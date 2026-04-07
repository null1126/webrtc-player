import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type { MediaKind, RtcPlayerEvents, RtcPlayerOptions } from '../rtc/types';
import { RtcState } from '../rtc/types';
import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '../plugins/types';

/**
 * RTC 拉流播放器
 */
export class RtcPlayer extends RtcBase<RtcPlayerEvents, RtcPlayerPlugin, RtcPlayerPluginInstance> {
  private target?: HTMLVideoElement | HTMLAudioElement;
  private mediaKind: MediaKind;
  private _currentStream: MediaStream | null = null;
  /** 保存 createSession 中的 ctx，供扩展点方法使用 */
  private _sessionCtx: ReturnType<RtcPlayer['createHookContext']> | null = null;

  constructor(options: RtcPlayerOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPlayerPlugin, RtcPlayerPluginInstance>();
    super(options, signaling, pluginManager);
    pluginManager.setInstance(this);
    this.target = options.target;
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
   * 获取已绑定的目标元素
   */
  getTargetElement(): HTMLVideoElement | HTMLAudioElement | undefined {
    return this.target;
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
        target: this.target,
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

      this.url = finalUrl;
      await this.createSession();
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
    this._sessionCtx = ctx;
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    // Hook: onBeforeSetLocalDescription
    const modifiedOffer = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    const offerSDP = modifiedOffer ?? offer;
    await this.pc.setLocalDescription(offerSDP);

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

  private _prevConnectionState: RTCPeerConnectionState = 'new';
  private _prevIceGatheringState: RTCIceGatheringState = 'new';

  protected override onConnectionStateChanged(state: RTCPeerConnectionState): void {
    const ctx = this._sessionCtx;
    if (!ctx) return;
    const prev = this._prevConnectionState;
    this._prevConnectionState = state;
    this.pluginManager.callHook(ctx, 'onConnectionStateChange', { state, previousState: prev });
  }

  protected override onIceCandidateReceived(candidate: RTCIceCandidate): void {
    const ctx = this._sessionCtx;
    if (!ctx) return;
    this.pluginManager.callHook(ctx, 'onIceCandidate', { candidate, isRemote: false });
  }

  protected override onIceConnectionStateChanged(state: RTCIceConnectionState): void {
    const ctx = this._sessionCtx;
    if (!ctx) return;
    this.pluginManager.callHook(ctx, 'onIceConnectionStateChange', state);
  }

  protected override onIceGatheringStateChanged(state: RTCIceGatheringState): void {
    const ctx = this._sessionCtx;
    if (!ctx) return;
    if (this._prevIceGatheringState !== state) {
      this._prevIceGatheringState = state;
      this.pluginManager.callHook(ctx, 'onIceGatheringStateChange', state);
    }
  }

  protected resetSession(): void {
    this._currentStream = null;
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  protected async performReconnect(): Promise<void> {
    this.resetSession();
    await this.play();
  }

  protected onTrack(event: RTCTrackEvent): void {
    const ctx = this.createHookContext(PluginPhase.PLAYER_TRACK);
    const stream = event.streams[0];
    this._currentStream = stream;

    // Hook: onTrack for video
    this.pluginManager.callHook(ctx, 'onTrack', stream, event);

    this.emit('track', { stream, event });

    if (this.target) {
      // Hook: onBeforeVideoPlay — allows plugins to replace the stream
      const playCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_VIDEO_PLAY);
      const modifiedStream = this.pluginManager.pipeHook(playCtx, 'onBeforeVideoPlay', stream);
      const finalStream = modifiedStream ?? stream;

      this.target.srcObject = finalStream;
      this.target.muted = true;
      this.target.onloadedmetadata = () => {
        this.target!.play();
        // Hook: onPlaying
        this.pluginManager.callHook(
          this.createHookContext(PluginPhase.PLAYER_VIDEO_PLAYING),
          'onPlaying',
          finalStream
        );
      };
    }
  }

  public override destroy(): void {
    super.destroy();
  }
}
