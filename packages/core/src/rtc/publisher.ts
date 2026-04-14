import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import { CanvasRenderer } from '../renders/canvas-renderer';
import type {
  MediaRenderTarget,
  MediaSource,
  MediaSourceMicrophone,
  RtcPublisherEvents,
  RtcPublisherOptions,
} from './types';
import { RtcState } from './types';
import type {
  HookContext,
  RtcPublisherPlugin,
  RtcPublisherPluginInstance,
  SignalingRequestData,
  SignalingResponseData,
} from '../plugins/types';
import type { PublisherSignalingProvider } from '../signaling/types';

/**
 * WebRTC 推流端。
 *
 * 负责采集本地媒体、绑定发送轨道并完成信令协商。
 */
export class RtcPublisher extends RtcBase<
  RtcPublisherEvents,
  RtcPublisherPlugin,
  RtcPublisherPluginInstance,
  PublisherSignalingProvider
> {
  /** 当前输入源。 */
  private _source: MediaSource;
  /** 本地预览目标。 */
  private target?: MediaRenderTarget;
  /** 是否静音。 */
  private muted: boolean;
  /** 当前本地采集流。 */
  private localStream: MediaStream | null = null;
  /** 已创建的发送 transceiver 列表。 */
  private activeTransceivers: RTCRtpTransceiver[] = [];
  /** canvas 预览渲染器。 */
  private canvasRenderer = new CanvasRenderer();
  /** 启动阶段上下文。 */
  private _startCtx: HookContext<RtcPublisherPluginInstance> | null = null;
  /** track 生命周期解绑集合。 */
  private trackEventUnsubs: Array<() => void> = [];

  constructor(options: RtcPublisherOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPublisherPlugin, RtcPublisherPluginInstance>();

    super(options, signaling, pluginManager);

    pluginManager.setInstance(this);
    this._source = options.source;
    this.target = options.target;
    this.muted = options.muted ?? true;

    const plugins = (options.plugins ?? []) as RtcPublisherPlugin[];
    for (const plugin of plugins) {
      pluginManager.use(plugin);
    }
  }

  /** 当前输入源（只读）。 */
  get source(): MediaSource {
    return this._source;
  }

  /** 获取当前本地流。 */
  getStream(): MediaStream | null {
    return this.localStream;
  }

  /** 获取底层 PeerConnection。 */
  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  /** 获取当前预览目标。 */
  getTargetElement(): MediaRenderTarget | undefined {
    return this.target;
  }

  /** 覆盖销毁阶段，用于插件上下文标记。 */
  protected override getDestroyPhase(): string {
    return PluginPhase.PUBLISHER_DESTROY;
  }

  /**
   * 启动推流。
   *
   * @returns 是否启动成功。
   */
  async start(): Promise<boolean> {
    try {
      const ctx = this.createHookContext(PluginPhase.PUBLISHER_STARTING);
      this.pluginManager.callHook(ctx, 'onStreamingStateChange', 'connecting');
      this.emit('streamingstatechange', 'connecting');

      this.initPeerConnection();
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED),
        'onPeerConnectionCreated',
        this.pc!
      );
      this._startCtx = ctx;

      await this.acquireSource(this._source, ctx);
      await this.attachStream(ctx);
      await this.createSession(ctx);

      this.emit('streamstart', { stream: this.localStream as MediaStream });
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_STREAMING_STATE_CHANGE),
        'onStreamingStateChange',
        'streaming'
      );
      this.emit('streamingstatechange', 'streaming');

      return true;
    } catch (err) {
      this.emitError(err, 'publisher.start');
      throw err;
    }
  }

  /**
   * 停止推流。
   *
   * @returns Promise。
   */
  async stop(): Promise<void> {
    await this.pluginManager.asyncPipeHook(
      this.createHookContext(PluginPhase.PUBLISHER_BEFORE_STOP),
      'onBeforeStop',
      undefined as void | undefined
    );

    this.resetSession();
    this.releaseSource();
    this.emit('streamstop', undefined);

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_STREAMING_STATE_CHANGE),
      'onStreamingStateChange',
      'idle'
    );
    this.emit('streamingstatechange', 'idle');

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_AFTER_STOP),
      'onAfterStop'
    );
  }

  /**
   * 切换输入源。
   *
   * @param source 新输入源。
   */
  async switchSource(source: MediaSource): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PUBLISHER_BEFORE_SOURCE_CHANGE);
    this.emit('state', RtcState.SWITCHING);

    source = this.pluginManager.pipeHook(ctx, 'onBeforeSourceChange', source);

    const prevStream = this.localStream;
    const prevSource = this._source;

    try {
      await this.acquireSource(source, ctx);

      if (!this.pc || !this.localStream) {
        throw new Error('RTC peer connection not ready');
      }

      for (const transceiver of this.activeTransceivers) {
        const oldTrack = transceiver.sender.track;
        const newTrackRaw =
          this.localStream.getTracks().find((t) => t.kind === oldTrack?.kind) ?? null;

        const newTrack = await this.pluginManager.asyncPipeHook(
          this.createHookContext(PluginPhase.PUBLISHER_BEFORE_REPLACE_TRACK),
          'onBeforeReplaceTrack',
          newTrackRaw,
          oldTrack,
          newTrackRaw
        );

        await transceiver.sender.replaceTrack(newTrack);

        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PUBLISHER_AFTER_REPLACE_TRACK),
          'onAfterReplaceTrack',
          newTrack
        );
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

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_AFTER_SOURCE_CHANGE),
      'onAfterSourceChange',
      source
    );
  }

  /**
   * 创建推流会话。
   *
   * @param ctx 当前 Hook 上下文。
   */
  protected async createSession(ctx: HookContext<RtcPublisherPluginInstance>): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    const offerSDP = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    await this.pc.setLocalDescription(offerSDP);

    await this.waitForIceGatheringComplete();

    const requestStart = performance.now();
    const request: SignalingRequestData = await this.pluginManager.asyncPipeHook(
      this.createHookContext(PluginPhase.PUBLISHER_BEFORE_SIGNALING_REQUEST),
      'onBeforeSignalingRequest',
      {
        role: 'publisher',
        url: this.url,
        sdp: this.pc.localDescription?.sdp ?? offerSDP.sdp ?? '',
      }
    );

    let answerSDP: string;
    try {
      answerSDP = await this.signaling.publish(request.sdp, request.url);
    } catch (error) {
      const signalingError = error instanceof Error ? error : new Error(String(error));
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_SIGNALING_ERROR),
        'onSignalingError',
        {
          error: signalingError,
          request,
        }
      );
      this.emit('signalingerror', {
        error: signalingError,
        request,
      });
      throw error;
    }

    const response: SignalingResponseData = await this.pluginManager.asyncPipeHook(
      this.createHookContext(PluginPhase.PUBLISHER_AFTER_SIGNALING_RESPONSE),
      'onAfterSignalingResponse',
      {
        role: 'publisher',
        url: request.url,
        answerSdp: answerSDP,
        latencyMs: performance.now() - requestStart,
      }
    );

    const answerToSet = this.pluginManager.pipeHook(
      this.createHookContext(PluginPhase.PUBLISHER_BEFORE_SET_REMOTE_DESCRIPTION),
      'onBeforeSetRemoteDescription',
      {
        type: 'answer' as RTCSdpType,
        sdp: response.answerSdp,
      }
    );
    await this.pc.setRemoteDescription(answerToSet);

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PUBLISHER_REMOTE_DESCRIPTION_SET),
      'onRemoteDescriptionSet',
      answerToSet
    );
  }

  /**
   * 重置推流会话。
   */
  protected resetSession(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.clearTrackListeners();
    this.activeTransceivers = [];
  }

  /**
   * 重连策略：重置并重新执行 `start`。
   */
  protected async performReconnect(): Promise<void> {
    this.resetSession();
    this.releaseSource();
    await this.start();
  }

  /**
   * 处理远端 track。
   *
   * @param event `RTCTrackEvent`。
   */
  protected onTrack(event: RTCTrackEvent): void {
    const ctx = this.createHookContext(PluginPhase.PUBLISHER_TRACK_ATTACHED);
    const stream = event.streams[0];
    this.pluginManager.callHook(ctx, 'onTrack', stream, event);
    this.emit('track', { stream, event });
  }

  /** 上一个 connectionState。 */
  private _prevConnectionState: RTCPeerConnectionState = 'new';
  /** 上一个 iceGatheringState。 */
  private _prevIceGatheringState: RTCIceGatheringState = 'new';

  /**
   * 转发 connectionState 到插件。
   *
   * @param state 当前连接状态。
   */
  protected override onConnectionStateChanged(state: RTCPeerConnectionState): void {
    const ctx = this._startCtx;
    if (!ctx) return;

    const prev = this._prevConnectionState;
    this._prevConnectionState = state;

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.BASE_CONNECTION_STATE_CHANGE),
      'onConnectionStateChange',
      { state, previousState: prev }
    );
  }

  /**
   * 转发本地 candidate 到插件。
   *
   * @param candidate 本地 candidate。
   */
  protected override onIceCandidateReceived(candidate: RTCIceCandidate): void {
    const ctx = this._startCtx;
    if (!ctx) return;

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.BASE_ICE_CANDIDATE),
      'onIceCandidate',
      {
        candidate,
        isRemote: false,
      }
    );
  }

  /**
   * 转发 ICE connection state 到插件。
   *
   * @param state 当前 ICE connection 状态。
   */
  protected override onIceConnectionStateChanged(state: RTCIceConnectionState): void {
    const ctx = this._startCtx;
    if (!ctx) return;

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.BASE_ICE_CONNECTION_STATE_CHANGE),
      'onIceConnectionStateChange',
      state
    );
  }

  /**
   * 转发 ICE gathering state 到插件。
   *
   * @param state 当前 ICE gathering 状态。
   */
  protected override onIceGatheringStateChanged(state: RTCIceGatheringState): void {
    const ctx = this._startCtx;
    if (!ctx) return;

    if (this._prevIceGatheringState !== state) {
      this._prevIceGatheringState = state;
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.BASE_ICE_GATHERING_STATE_CHANGE),
        'onIceGatheringStateChange',
        state
      );
    }
  }

  /**
   * 采集指定输入源并更新 localStream。
   *
   * @param source 输入源。
   * @param ctx 当前 Hook 上下文。
   */
  private async acquireSource(
    source: MediaSource,
    ctx: HookContext<RtcPublisherPluginInstance>
  ): Promise<MediaStream> {
    if (source.type === 'custom') {
      this.localStream = source.stream;
      this.bindVideo();
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_MEDIA_STREAM),
        'onMediaStream',
        this.localStream
      );
      this.bindTrackLifecycle(this.localStream);
      return source.stream;
    }

    try {
      const constraints = this.buildConstraints(source);
      const finalConstraints = this.pluginManager.pipeHook(
        ctx,
        'onBeforeGetUserMedia',
        constraints
      );
      this.localStream = await this.requestMedia(source, finalConstraints);
    } catch (err) {
      if (err instanceof Error) {
        this.handlePermissionError(source, err);
      }
      throw err;
    }

    this.bindVideo();

    if (this.localStream) {
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_MEDIA_STREAM),
        'onMediaStream',
        this.localStream
      );
      this.bindTrackLifecycle(this.localStream);
    }

    return this.localStream;
  }

  /**
   * 根据输入源构建媒体采集约束。
   *
   * @param s 输入源。
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
   * 调用浏览器媒体 API 获取流。
   *
   * @param s 输入源。
   * @param constraints 媒体约束。
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
   * 将本地流绑定到预览目标。
   */
  private bindVideo(): void {
    if (!this.target || !this.localStream) return;

    if (this.canvasRenderer.isCanvasTarget(this.target)) {
      this.canvasRenderer.attach(this.target, this.localStream, {
        muted: this.muted,
        onFrame: (frame) => {
          this.pluginManager.callHook(
            this.createHookContext(PluginPhase.PUBLISHER_CANVAS_FRAME),
            'onCanvasFrame',
            frame
          );
        },
      });
      return;
    }

    const mediaTarget = this.target;
    this.canvasRenderer.stop();
    mediaTarget.srcObject = this.localStream;
    mediaTarget.muted = this.muted;
    mediaTarget.onloadedmetadata = () => {
      void mediaTarget.play();
    };
  }

  /**
   * 统一处理权限拒绝类错误。
   *
   * @param source 输入源。
   * @param err 错误对象。
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
   * 将流轨道绑定到 PeerConnection。
   *
   * @param _ctx 当前 Hook 上下文。
   */
  private async attachStream(_ctx: HookContext<RtcPublisherPluginInstance>): Promise<void> {
    if (!this.pc || !this.localStream) return;

    this.activeTransceivers = [];

    const attachCtx = this.createHookContext(PluginPhase.PUBLISHER_BEFORE_ATTACH_STREAM);
    const streamToAttach = await this.pluginManager.asyncPipeHook(
      attachCtx,
      'onBeforeAttachStream',
      this.localStream
    );

    const videoTrack = streamToAttach.getVideoTracks()[0];
    const audioTrack = streamToAttach.getAudioTracks()[0];

    if (videoTrack) {
      const finalVideoTrack = await this.pluginManager.asyncPipeHook(
        this.createHookContext(PluginPhase.PUBLISHER_BEFORE_ATTACH_TRACK),
        'onBeforeAttachTrack',
        videoTrack,
        streamToAttach
      );

      const videoTransceiver = this.pc.addTransceiver(finalVideoTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(videoTransceiver);

      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PUBLISHER_TRACK_ATTACHED),
        'onTrackAttached',
        finalVideoTrack,
        streamToAttach
      );
    }

    if (audioTrack) {
      const finalAudioTrack = await this.pluginManager.asyncPipeHook(
        this.createHookContext(PluginPhase.PUBLISHER_BEFORE_ATTACH_TRACK),
        'onBeforeAttachTrack',
        audioTrack,
        streamToAttach
      );

      const audioTransceiver = this.pc.addTransceiver(finalAudioTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(audioTransceiver);

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
   * 绑定本地 track 生命周期事件（ended/mute/unmute）。
   *
   * @param stream 本地流。
   */
  private bindTrackLifecycle(stream: MediaStream): void {
    this.clearTrackListeners();

    for (const track of stream.getTracks()) {
      if (
        typeof track.addEventListener !== 'function' ||
        typeof track.removeEventListener !== 'function'
      ) {
        continue;
      }

      const onEnded = () => {
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PUBLISHER_TRACK_ENDED),
          'onTrackEnded',
          { track, stream, reason: 'ended' }
        );
        this.emit('trackended', { track, stream, reason: 'ended' });
      };
      const onMute = () => {
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PUBLISHER_TRACK_MUTE_CHANGED),
          'onTrackMuteChanged',
          { track, muted: true }
        );
        this.emit('trackmutechanged', { track, muted: true });
      };
      const onUnmute = () => {
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PUBLISHER_TRACK_MUTE_CHANGED),
          'onTrackMuteChanged',
          { track, muted: false }
        );
        this.emit('trackmutechanged', { track, muted: false });
      };

      track.addEventListener('ended', onEnded);
      track.addEventListener('mute', onMute);
      track.addEventListener('unmute', onUnmute);

      this.trackEventUnsubs.push(() => {
        track.removeEventListener('ended', onEnded);
        track.removeEventListener('mute', onMute);
        track.removeEventListener('unmute', onUnmute);
      });
    }
  }

  /**
   * 清理已绑定的 track 生命周期监听。
   */
  private clearTrackListeners(): void {
    this.trackEventUnsubs.forEach((off) => off());
    this.trackEventUnsubs = [];
  }

  /**
   * 释放媒体源。
   *
   * @param stream 指定要释放的流；不传则释放当前 `localStream`。
   */
  private releaseSource(stream?: MediaStream): void {
    const target = stream ?? this.localStream;
    if (!target) return;

    const shouldStopTracks = !(this._source.type === 'custom' && target === this._source.stream);
    if (shouldStopTracks) {
      target.getTracks().forEach((track) => track.stop());
    }

    if (!stream) {
      this.localStream = null;
      this.canvasRenderer.stop();
      if (this.target && !this.canvasRenderer.isCanvasTarget(this.target)) {
        this.target.srcObject = null;
      }
    }
  }

  /**
   * 销毁推流实例。
   */
  public override destroy(): void {
    this.canvasRenderer.stop();
    void this.stop();
    super.destroy();
  }
}
