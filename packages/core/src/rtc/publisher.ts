import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type {
  MediaSource,
  MediaSourceMicrophone,
  RtcPublisherEvents,
  RtcPublisherOptions,
} from './types';
import { RtcState } from './types';
import type { HookContext, RtcPublisherPlugin, RtcPublisherPluginInstance } from '../plugins/types';

/**
 * RTC 推流器
 */
export class RtcPublisher extends RtcBase<
  RtcPublisherEvents,
  RtcPublisherPlugin,
  RtcPublisherPluginInstance
> {
  private _source: MediaSource;
  private video?: HTMLVideoElement;
  private localStream: MediaStream | null = null;
  private activeTransceivers: RTCRtpTransceiver[] = [];

  constructor(options: RtcPublisherOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPublisherPlugin, RtcPublisherPluginInstance>();
    super(options, signaling, pluginManager);
    pluginManager.setInstance(this);
    this._source = options.source;
    this.video = options.video;
    const plugins = (options.plugins ?? []) as RtcPublisherPlugin[];
    for (const plugin of plugins) {
      pluginManager.use(plugin);
    }
  }

  get source(): MediaSource {
    return this._source;
  }

  /**
   * 获取本地 MediaStream
   */
  getStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * 获取 RTCPeerConnection 实例，用于调用 getStats() 等高级 API
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  protected override getDestroyPhase(): string {
    return PluginPhase.PUBLISHER_DESTROY;
  }

  /**
   * 开始推流
   */
  async start(): Promise<boolean> {
    try {
      const ctx = this.createHookContext(PluginPhase.PUBLISHER_STARTING);

      // Hook: onStreamingStateChange('connecting')
      this.pluginManager.callHook(ctx, 'onStreamingStateChange', 'connecting');

      this.initPeerConnection();
      // Hook: onPeerConnectionCreated — immediately after init so plugins
      // can configure pc (e.g. add transceivers, set codecs, etc.)
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED),
        'onPeerConnectionCreated',
        this.pc!
      );
      this.bindCommonHooks(ctx);

      await this.acquireSource(ctx);
      await this.attachStream(ctx);
      await this.createSession(ctx);

      // Hook: onPublishing
      if (this.localStream) {
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PUBLISHER_STREAM_START),
          'onPublishing',
          this.localStream
        );
      }

      this.emit('streamstart', { stream: this.localStream as MediaStream });

      // Hook: onStreamingStateChange('streaming')
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_STREAMING_STATE_CHANGE),
        'onStreamingStateChange',
        'streaming'
      );

      return true;
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  /**
   * 停止推流
   */
  stop(): void {
    const ctx = this.createHookContext(PluginPhase.PUBLISHER_STREAM_STOP);
    // Hook: onUnpublishing
    this.pluginManager.callHook(ctx, 'onUnpublishing', this.localStream);
    this.resetSession();
    this.releaseSource();
    this.emit('streamstop', undefined);
    // Hook: onStreamingStateChange('idle')
    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_STREAMING_STATE_CHANGE),
      'onStreamingStateChange',
      'idle'
    );
  }

  /**
   * 切换输入源
   * @param source 新的媒体源
   */
  async switchSource(source: MediaSource): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PUBLISHER_BEFORE_SOURCE_CHANGE);
    this.emit('state', RtcState.SWITCHING);

    // Hook: onBeforeSourceChange
    const modified = this.pluginManager.pipeHook(ctx, 'onBeforeSourceChange', source);
    source = modified ?? source;

    const prevStream = this.localStream;
    const prevSource = this._source;

    try {
      await this.acquireSource(ctx);

      if (!this.pc || !this.localStream) {
        throw new Error('RTC peer connection not ready');
      }

      for (const transceiver of this.activeTransceivers) {
        const oldTrack = transceiver.sender.track;
        const newTrack = this.localStream!.getTracks().find(
          (t) => t.kind === transceiver.receiver.track.kind
        );
        if (newTrack) {
          // Hook: onBeforeReplaceTrack
          this.pluginManager.callHook(ctx, 'onBeforeReplaceTrack', oldTrack, newTrack);
          await transceiver.sender.replaceTrack(newTrack);
          // Hook: onAfterReplaceTrack
          this.pluginManager.callHook(ctx, 'onAfterReplaceTrack', newTrack);
        }
      }

      this._source = source;
    } catch (err) {
      if (err instanceof Error) {
        this.handlePermissionError(source, err);
      }
      this._source = prevSource;
      throw err;
    } finally {
      this.releaseSource(prevStream ?? undefined);
    }

    this.emit('state', RtcState.SWITCHED);
    this.emit('sourcechange', source);
    // Hook: onAfterSourceChange
    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_AFTER_SOURCE_CHANGE),
      'onAfterSourceChange',
      source
    );
  }

  /**
   * 创建会话
   */
  protected async createSession(ctx: HookContext<RtcPublisherPluginInstance>): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    // Hook: onBeforeSetLocalDescription
    const modifiedOffer = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    const offerSDP = modifiedOffer ?? offer;
    await this.pc.setLocalDescription(offerSDP);

    const answerSDP = await this.signaling.publish(offerSDP.sdp!, this.url);
    // Hook: onBeforeSetRemoteDescription
    const remoteCtx = this.createHookContext(PluginPhase.PUBLISHER_BEFORE_SET_REMOTE_DESCRIPTION);
    const modifiedAnswer = this.pluginManager.pipeHook(remoteCtx, 'onBeforeSetRemoteDescription', {
      type: 'answer' as RTCSdpType,
      sdp: answerSDP,
    });
    const answerToSet: RTCSessionDescriptionInit = modifiedAnswer ?? {
      type: 'answer',
      sdp: answerSDP,
    };
    await this.pc.setRemoteDescription(answerToSet);

    // Hook: onRemoteDescriptionSet
    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_REMOTE_DESCRIPTION_SET),
      'onRemoteDescriptionSet',
      answerToSet
    );
  }

  /**
   * 重置会话
   */
  protected resetSession(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.activeTransceivers = [];
  }

  /**
   * 处理轨道事件
   */
  protected onTrack(event: RTCTrackEvent): void {
    const ctx = this.createHookContext(PluginPhase.PUBLISHER_TRACK_ATTACHED);
    const stream = event.streams[0];
    const track = event.track;
    this.pluginManager.callHook(ctx, 'onTrack', track, stream, event);
    this.emit('track', { stream, event });
  }

  /**
   * 绑定公共钩子（连接状态、ICE 候选、ICE 连接状态、ICE 收集状态）
   */
  private bindCommonHooks(ctx: HookContext<RtcPublisherPluginInstance>): void {
    const prevState = { state: this.connectionState };
    const prevIceGathering = { state: this.pc!.iceGatheringState };

    this.pc!.onconnectionstatechange = () => {
      const next = { state: this.pc!.connectionState, previousState: prevState.state };
      prevState.state = next.state;
      this.emit('state', this.mapConnectionState(next.state));
      this.pluginManager.callHook(ctx, 'onConnectionStateChange', next);
    };

    this.pc!.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
        this.pluginManager.callHook(ctx, 'onIceCandidate', {
          candidate: event.candidate,
          isRemote: false,
        });
      }
    };

    this.pc!.oniceconnectionstatechange = () => {
      this.emit('iceconnectionstate', this.pc!.iceConnectionState);
      this.pluginManager.callHook(ctx, 'onIceConnectionStateChange', this.pc!.iceConnectionState);
    };

    this.pc!.onicegatheringstatechange = () => {
      const state = this.pc!.iceGatheringState;
      if (prevIceGathering.state !== state) {
        prevIceGathering.state = state;
        this.emit('icegatheringstate', state);
        this.pluginManager.callHook(ctx, 'onIceGatheringStateChange', state);
      }
    };
  }

  /**
   * 获取媒体源
   * @param ctx 调用方已创建的上下文
   */
  private async acquireSource(ctx: HookContext<RtcPublisherPluginInstance>): Promise<MediaStream> {
    const s = this._source;

    if (s.type === 'custom') {
      this.localStream = s.stream;
      // Hook: onMediaStream — immediately, before attachStream
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_MEDIA_STREAM),
        'onMediaStream',
        this.localStream
      );
      this.bindVideo();
      return s.stream;
    }

    try {
      // Hook: onBeforeGetUserMedia
      const constraints = this.buildConstraints(s);
      const modified = this.pluginManager.pipeHook(ctx, 'onBeforeGetUserMedia', constraints);
      const finalConstraints = modified ?? constraints;

      this.localStream = await this.requestMedia(s, finalConstraints);
    } catch (err) {
      if (err instanceof Error) {
        this.handlePermissionError(s, err);
      }
      throw err;
    }

    this.bindVideo();

    // Hook: onMediaStream — always called after localStream is available,
    // before onBeforeAttachStream/onBeforeAttachTrack run.
    if (this.localStream) {
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_MEDIA_STREAM),
        'onMediaStream',
        this.localStream
      );
    }

    return this.localStream;
  }

  /**
   * 根据 MediaSource 构建 MediaStreamConstraints
   */
  private buildConstraints(s: MediaSource): MediaStreamConstraints {
    if (s.type === 'screen') {
      return {
        video: true,
        audio: (s as { audio?: boolean }).audio ?? false,
      };
    }

    if (s.type === 'camera') {
      return {
        video: (s as { deviceId?: string }).deviceId
          ? { deviceId: (s as { deviceId: string }).deviceId }
          : true,
        audio: (s as { audio?: boolean }).audio
          ? { deviceId: (s as { deviceId?: string }).deviceId }
          : false,
      };
    }

    const sm = s as MediaSourceMicrophone;
    return {
      video: false,
      audio: sm.deviceId ? { deviceId: sm.deviceId } : true,
    };
  }

  /**
   * 请求媒体设备获取 MediaStream
   */
  private async requestMedia(
    s: MediaSource,
    constraints: MediaStreamConstraints
  ): Promise<MediaStream> {
    if (s.type === 'screen') {
      return navigator.mediaDevices.getDisplayMedia(constraints as DisplayMediaStreamOptions);
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * 将 localStream 绑定到预览 video 元素
   */
  private bindVideo(): void {
    if (!this.video || !this.localStream) return;

    this.video.srcObject = this.localStream;
    this.video.muted = true;
    this.video.onloadedmetadata = () => {
      this.video?.play();
    };
  }

  /**
   * 检测并发射权限拒绝事件
   */
  private handlePermissionError(source: MediaSource, err: Error): void {
    if (
      err.name === 'NotAllowedError' ||
      err.name === 'PermissionDeniedError' ||
      err.name === 'AbortError'
    ) {
      this.emit('permissiondenied', { source, error: err });
    }
  }

  /**
   * 将媒体流绑定到轨道
   *
   * 执行顺序：
   * 1. onBeforeAttachStream(stream) — 接收完整 stream，插件可在此混流/添加水印
   * 2. onBeforeAttachTrack(track, stream) — 接收单个 track（video/audio 各一次）
   * 3. transceiver.addTrack() — 实际绑定
   * 4. onTrackAttached(track, stream) — 绑定完成后
   *
   * @param _ctx 调用方已创建的上下文（内部通过 createHookContext 重新构建 phase）
   */
  private async attachStream(_ctx: HookContext<RtcPublisherPluginInstance>): Promise<void> {
    if (!this.pc || !this.localStream) return;

    this.activeTransceivers = [];

    // Step 1: Hook: onBeforeAttachStream — 接收完整 MediaStream
    const attachCtx = this.createHookContext(PluginPhase.PUBLISHER_BEFORE_ATTACH_STREAM);
    const processedStreamWrapper = await this.pluginManager.asyncPipeHook(
      attachCtx,
      'onBeforeAttachStream',
      this.localStream
    );
    const streamToAttach = processedStreamWrapper ?? this.localStream;

    const videoTrack = streamToAttach.getVideoTracks()[0];
    const audioTrack = streamToAttach.getAudioTracks()[0];

    if (videoTrack) {
      // Hook: onBeforeAttachTrack — async for video
      const processedVideoTrack = await this.pluginManager.asyncPipeHook(
        attachCtx,
        'onBeforeAttachTrack',
        videoTrack,
        streamToAttach
      );
      const finalVideoTrack = processedVideoTrack ?? videoTrack;

      const videoTransceiver = this.pc.addTransceiver(finalVideoTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(videoTransceiver);

      // Hook: onTrackAttached — after transceiver is created
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_TRACK_ATTACHED),
        'onTrackAttached',
        finalVideoTrack,
        streamToAttach
      );
    }

    if (audioTrack) {
      // Hook: onBeforeAttachTrack — async for audio
      const processedAudioTrack = await this.pluginManager.asyncPipeHook(
        attachCtx,
        'onBeforeAttachTrack',
        audioTrack,
        streamToAttach
      );
      const finalAudioTrack = processedAudioTrack ?? audioTrack;

      const audioTransceiver = this.pc.addTransceiver(finalAudioTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(audioTransceiver);

      // Hook: onTrackAttached — after transceiver is created
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_TRACK_ATTACHED),
        'onTrackAttached',
        finalAudioTrack,
        streamToAttach
      );
    }

    if (!videoTrack && !audioTrack) {
      throw new Error('No media tracks available');
    }
  }

  /**
   * 释放媒体源
   */
  private releaseSource(stream?: MediaStream): void {
    const target = stream ?? this.localStream;
    if (!target) return;

    target.getTracks().forEach((track) => track.stop());

    if (!stream) {
      this.localStream = null;
      if (this.video) {
        this.video.srcObject = null;
      }
    }
  }

  public override destroy(): void {
    this.stop();
    super.destroy();
  }
}
