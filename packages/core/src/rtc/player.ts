import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type { MediaKind, RtcPlayerEvents, RtcPlayerOptions } from '../rtc/types';
import { RtcState } from '../rtc/types';
import type { VideoFrameData, ProcessedVideoFrame } from '../plugins/types';
import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '../plugins/types';

/**
 * RTC 拉流播放器
 */
export class RtcPlayer extends RtcBase<RtcPlayerEvents, RtcPlayerPlugin, RtcPlayerPluginInstance> {
  private video?: HTMLVideoElement;
  private mediaKind: MediaKind;
  private _currentStream: MediaStream | null = null;
  private _destroyed = false;
  private _renderRafId: number | null = null;

  constructor(options: RtcPlayerOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPlayerPlugin, RtcPlayerPluginInstance>();
    super(options, signaling, pluginManager);
    pluginManager.setInstance(this);
    this.video = options.video;
    this.mediaKind = options.media ?? 'all';
    const plugins = (options.plugins ?? []) as RtcPlayerPlugin[];
    for (const plugin of plugins) {
      pluginManager.use(plugin);
    }
  }

  /**
   * 获取当前拉流的 URL（暴露给插件实例）
   */
  getStreamUrl(): string {
    return this.url;
  }

  /**
   * 获取已绑定的 video 元素
   */
  getVideoElement(): HTMLVideoElement | undefined {
    return this.video;
  }

  /**
   * 获取当前远端 MediaStream（播放后可用）
   */
  getCurrentStream(): MediaStream | null {
    return this._currentStream;
  }

  /**
   * 获取 RTCPeerConnection 实例，用于调用 getStats() 等高级 API
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  /**
   * 开始拉流
   */
  async play(): Promise<boolean> {
    try {
      const ctx = this.createHookContext(PluginPhase.PLAYER_BEFORE_CONNECT);
      const pluginOpts: RtcPlayerOptions = {
        url: this.url,
        api: '',
        media: this.mediaKind,
        video: this.video,
      };
      // Hook: onBeforeConnect
      const modified = this.pluginManager.pipeHook(ctx, 'onBeforeConnect', pluginOpts);
      const finalUrl = modified?.url ?? pluginOpts.url;

      this.initPeerConnection();
      // Hook: onPeerConnectionCreated
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED),
        'onPeerConnectionCreated',
        this.pc!
      );

      if (!this.pc) {
        throw new Error('Peer connection not initialized');
      }

      if (this.mediaKind === 'all' || this.mediaKind === 'video') {
        this.pc.addTransceiver('video', { direction: 'recvonly' });
      }
      if (this.mediaKind === 'all' || this.mediaKind === 'audio') {
        this.pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      await this.createSession();
      this.url = finalUrl;
      return true;
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  /**
   * 切换拉流地址
   */
  async switchStream(url: string): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PLAYER_BEFORE_SWITCH_STREAM);
    this.emit('state', RtcState.SWITCHING);
    // Hook: onBeforeSwitchStream
    const modified = this.pluginManager.pipeHook(ctx, 'onBeforeSwitchStream', url);
    url = modified ?? url;
    this.url = url;
    this.stopRenderLoop();
    this.resetSession();
    await this.play();
    // Hook: onAfterSwitchStream
    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PLAYER_AFTER_SWITCH_STREAM),
      'onAfterSwitchStream',
      url
    );
    this.emit('state', RtcState.SWITCHED);
  }

  protected async createSession(): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PLAYER_CONNECTING);
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    // Hook: onBeforeSetLocalDescription
    const modifiedOffer = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    const offerSDP = modifiedOffer ?? offer;
    await this.pc.setLocalDescription(offerSDP);

    // Hook: onConnectionStateChange + onIceConnectionStateChange
    this.bindSignalingHooks(ctx);
    const answerSDP = await this.signaling.play(offerSDP.sdp!, this.url);

    // Hook: onBeforeSetRemoteDescription
    const remoteCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_SET_REMOTE_DESCRIPTION);
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
      this.createHookContext(PluginPhase.PLAYER_REMOTE_DESCRIPTION_SET),
      'onRemoteDescriptionSet',
      answerToSet
    );
  }

  /** 绑定信令交互中产生的 PC 事件钩子 */
  private bindSignalingHooks(ctx: ReturnType<RtcPlayer['createHookContext']>): void {
    const prevState = { state: this.connectionState };
    const prevIceGathering = { state: this.pc!.iceGatheringState };
    const onStateChange = () => {
      const next = { state: this.pc!.connectionState, previousState: prevState.state };
      prevState.state = next.state;
      this.emit('state', this.mapConnectionState(next.state));
      this.pluginManager.callHook(ctx, 'onConnectionStateChange', next);
    };
    const onIce = () => {
      this.emit('iceconnectionstate', this.pc!.iceConnectionState);
      this.pluginManager.callHook(ctx, 'onIceConnectionStateChange', this.pc!.iceConnectionState);
    };
    const onIceGathering = () => {
      const state = this.pc!.iceGatheringState;
      if (prevIceGathering.state !== state) {
        prevIceGathering.state = state;
        this.emit('icegatheringstate', state);
        this.pluginManager.callHook(ctx, 'onIceGatheringStateChange', state);
      }
    };
    const onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
        this.pluginManager.callHook(ctx, 'onIceCandidate', {
          candidate: event.candidate,
          isRemote: false,
        });
      }
    };
    this.pc!.onconnectionstatechange = onStateChange;
    this.pc!.oniceconnectionstatechange = onIce;
    this.pc!.onicecandidate = onIceCandidate;
    this.pc!.onicegatheringstatechange = onIceGathering;
  }

  protected resetSession(): void {
    this._currentStream = null;
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  protected onTrack(event: RTCTrackEvent): void {
    const ctx = this.createHookContext(PluginPhase.PLAYER_TRACK);
    const stream = event.streams[0];
    this._currentStream = stream;
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Hook: onTrack for video
    if (videoTrack) {
      this.pluginManager.callHook(ctx, 'onTrack', videoTrack, stream, event);
    }
    // Hook: onTrack for audio
    if (audioTrack) {
      this.pluginManager.callHook(ctx, 'onTrack', audioTrack, stream, event);
    }

    this.emit('track', { stream, event });

    if (this.video) {
      // Hook: onBeforeVideoPlay — allows plugins to replace the stream
      const playCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_VIDEO_PLAY);
      const modifiedStream = this.pluginManager.pipeHook(playCtx, 'onBeforeVideoPlay', stream);
      const finalStream = modifiedStream ?? stream;

      this.video.srcObject = finalStream;
      this.video.muted = true;
      this.video.onloadedmetadata = () => {
        this.video!.play();
        // Hook: onPlaying
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PLAYER_VIDEO_PLAYING),
          'onPlaying',
          finalStream
        );
        // 启动帧级渲染钩子（onBeforeVideoRender）
        this.startRenderLoop(finalStream);
      };
    }
  }

  /**
   * 启动基于 requestAnimationFrame 的帧级渲染钩子
   * 调用 onBeforeVideoRender 钩子，支持插件在每帧渲染前进行处理
   */
  private startRenderLoop(stream: MediaStream): void {
    this.stopRenderLoop();
    if (!this.video) return;

    const video = this.video;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const frameData: VideoFrameData = {
      timestamp: 0,
      track: videoTrack,
      stream,
    };

    const render = () => {
      if (this._destroyed || !this.video) return;
      frameData.timestamp = performance.now();

      // Hook: onBeforeVideoRender
      const ctx = this.createHookContext(PluginPhase.PLAYER_BEFORE_VIDEO_RENDER);
      const result = this.pluginManager.asyncPipeHook(
        ctx,
        'onBeforeVideoRender',
        undefined as ProcessedVideoFrame | undefined,
        video,
        frameData
      );

      result.then((processed) => {
        if (!this._destroyed && this.video) {
          if (processed && !processed.skipRender) {
            // 插件返回了处理后的帧，由插件自行渲染到目标 canvas
          }
          // 默认渲染由浏览器 video 元素自动完成，无需手动 drawImage
        }
      });

      this._renderRafId = requestAnimationFrame(render);
    };

    this._renderRafId = requestAnimationFrame(render);
  }

  /**
   * 停止帧渲染循环
   */
  private stopRenderLoop(): void {
    if (this._renderRafId !== null) {
      cancelAnimationFrame(this._renderRafId);
      this._renderRafId = null;
    }
  }

  public override destroy(): void {
    this._destroyed = true;
    this.stopRenderLoop();
    super.destroy();
  }
}
