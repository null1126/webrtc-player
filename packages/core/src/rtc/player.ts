import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import { CanvasRenderer } from '../renders/canvas-renderer';
import type { MediaKind, MediaRenderTarget, RtcPlayerEvents, RtcPlayerOptions } from '../rtc/types';
import type { PlayerSignalingProvider } from '../signaling/types';
import { RtcState } from '../rtc/types';
import type {
  RtcPlayerPlugin,
  RtcPlayerPluginInstance,
  SignalingRequestData,
  SignalingResponseData,
} from '../plugins/types';

/**
 * WebRTC 拉流端。
 *
 * 负责建立播放会话、接收远端流并绑定到渲染目标。
 */
export class RtcPlayer extends RtcBase<
  RtcPlayerEvents,
  RtcPlayerPlugin,
  RtcPlayerPluginInstance,
  PlayerSignalingProvider
> {
  /** 渲染目标。 */
  private target?: MediaRenderTarget;
  /** 拉流媒体类型。 */
  private mediaKind: MediaKind;
  /** 是否静音。 */
  private muted: boolean;
  /** 当前远端媒体流。 */
  private _currentStream: MediaStream | null = null;
  /** 已处理的远端 track 键。 */
  private _handledRemoteTrackKeys = new Set<string>();
  /** 预处理后的流缓存。 */
  private _preparedStreams = new Map<string, MediaStream>();
  /** 最近一次绑定的流 ID。 */
  private _renderedStreamId: string | null = null;
  /** canvas 渲染器。 */
  private canvasRenderer = new CanvasRenderer();
  /** 当前会话上下文。 */
  private _sessionCtx: ReturnType<RtcPlayer['createHookContext']> | null = null;

  constructor(options: RtcPlayerOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPlayerPlugin, RtcPlayerPluginInstance>();

    super(options, signaling, pluginManager);

    pluginManager.setInstance(this);
    this.target = options.target;
    this.mediaKind = options.media ?? 'all';
    this.muted = options.muted ?? true;

    const plugins = (options.plugins ?? []) as RtcPlayerPlugin[];
    for (const plugin of plugins) {
      pluginManager.use(plugin);
    }
  }

  /** 获取当前拉流 URL。 */
  getStreamUrl(): string {
    return this.url;
  }

  /** 获取当前渲染目标。 */
  getTargetElement(): MediaRenderTarget | undefined {
    return this.target;
  }

  /** 获取当前远端流。 */
  getCurrentStream(): MediaStream | null {
    return this._currentStream;
  }

  /** 获取底层 PeerConnection。 */
  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  /**
   * 启动拉流流程。
   *
   * @returns 是否启动成功。
   */
  async play(): Promise<boolean> {
    try {
      const ctx = this.createHookContext(PluginPhase.PLAYER_BEFORE_CONNECT);
      const modified = this.pluginManager.pipeHook(ctx, 'onBeforeConnect', {
        url: this.url,
        media: this.mediaKind,
      });

      this.url = modified.url;
      this.mediaKind = modified.media;

      this.initPeerConnection();
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
      return true;
    } catch (err) {
      this.emitError(err, 'player.play');
      throw err;
    }
  }

  /**
   * 切换拉流地址。
   *
   * @param url 新的拉流地址。
   */
  async switchStream(url: string): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PLAYER_BEFORE_SWITCH_STREAM);
    this.emit('state', RtcState.SWITCHING);

    const modified = this.pluginManager.pipeHook(ctx, 'onBeforeSwitchStream', url);
    this.url = modified;

    this.resetSession();
    await this.play();

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PLAYER_AFTER_SWITCH_STREAM),
      'onAfterSwitchStream',
      this.url
    );

    this.emit('state', RtcState.SWITCHED);
  }

  /**
   * 创建播放会话。
   */
  protected async createSession(): Promise<void> {
    const ctx = this.createHookContext(PluginPhase.PLAYER_CONNECTING);
    this._sessionCtx = ctx;

    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    const offerSDP = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    await this.pc.setLocalDescription(offerSDP);

    await this.waitForIceGatheringComplete();

    const signalingCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_SIGNALING_REQUEST);
    const requestStart = performance.now();
    const request: SignalingRequestData = await this.pluginManager.asyncPipeHook(
      signalingCtx,
      'onBeforeSignalingRequest',
      {
        role: 'player',
        url: this.url,
        sdp: this.pc.localDescription?.sdp ?? offerSDP.sdp ?? '',
      }
    );

    let answerSdp: string;
    try {
      answerSdp = await this.signaling.play(request.sdp, request.url);
    } catch (error) {
      const signalingError = error instanceof Error ? error : new Error(String(error));
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PLAYER_SIGNALING_ERROR),
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

    const responseCtx = this.createHookContext(PluginPhase.PLAYER_AFTER_SIGNALING_RESPONSE);
    const response: SignalingResponseData = await this.pluginManager.asyncPipeHook(
      responseCtx,
      'onAfterSignalingResponse',
      {
        role: 'player',
        url: request.url,
        answerSdp,
        latencyMs: performance.now() - requestStart,
      }
    );

    const remoteCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_SET_REMOTE_DESCRIPTION);
    const answerToSet = this.pluginManager.pipeHook(remoteCtx, 'onBeforeSetRemoteDescription', {
      type: 'answer' as RTCSdpType,
      sdp: response.answerSdp,
    });
    await this.pc.setRemoteDescription(answerToSet);

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.PLAYER_REMOTE_DESCRIPTION_SET),
      'onRemoteDescriptionSet',
      answerToSet
    );
  }

  /** 上次连接状态。 */
  private _prevConnectionState: RTCPeerConnectionState = 'new';
  /** 上次 ICE gathering 状态。 */
  private _prevIceGatheringState: RTCIceGatheringState = 'new';

  /**
   * 转发连接状态变化到插件系统。
   *
   * @param state 当前连接状态。
   */
  protected override onConnectionStateChanged(state: RTCPeerConnectionState): void {
    const ctx = this._sessionCtx;
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
   * 转发本地 ICE candidate 到插件系统。
   *
   * @param candidate 本地 candidate。
   */
  protected override onIceCandidateReceived(candidate: RTCIceCandidate): void {
    const ctx = this._sessionCtx;
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
   * 转发 ICE connection state 到插件系统。
   *
   * @param state 当前 ICE connection 状态。
   */
  protected override onIceConnectionStateChanged(state: RTCIceConnectionState): void {
    const ctx = this._sessionCtx;
    if (!ctx) return;

    this.pluginManager.callHook(
      this.createHookContext(PluginPhase.BASE_ICE_CONNECTION_STATE_CHANGE),
      'onIceConnectionStateChange',
      state
    );
  }

  /**
   * 转发 ICE gathering state 到插件系统。
   *
   * @param state 当前 ICE gathering 状态。
   */
  protected override onIceGatheringStateChanged(state: RTCIceGatheringState): void {
    const ctx = this._sessionCtx;
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
   * 重置当前播放会话。
   */
  protected resetSession(): void {
    this._currentStream = null;
    this._handledRemoteTrackKeys.clear();
    this._preparedStreams.clear();
    this._renderedStreamId = null;
    this.canvasRenderer.stop();

    if (this.target && !this.canvasRenderer.isCanvasTarget(this.target)) {
      this.target.srcObject = null;
      this.target.onloadedmetadata = null;
      this.target.onplaying = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  /**
   * 重连流程：重置后重新执行 `play`。
   */
  protected async performReconnect(): Promise<void> {
    this.resetSession();
    await this.play();
  }

  /**
   * 处理远端 track 到达。
   *
   * @param event `RTCTrackEvent`。
   */
  protected onTrack(event: RTCTrackEvent): void {
    const stream = event.streams[0];
    if (!stream) {
      return;
    }

    const trackKey = `${event.track.kind}:${event.track.id}`;
    if (this._handledRemoteTrackKeys.has(trackKey)) {
      // 同一 kind+track 的重复 ontrack 回调（常见于重协商/状态抖动），直接跳过
      return;
    }
    this._handledRemoteTrackKeys.add(trackKey);

    const ctx = this.createHookContext(PluginPhase.PLAYER_TRACK);
    this._currentStream = stream;

    this.pluginManager.callHook(ctx, 'onTrack', stream, event);
    this.emit('track', { stream, event });

    if (!this.target) return;

    const streamId = stream.id;
    let finalStream = this._preparedStreams.get(streamId) ?? null;

    if (!finalStream) {
      const playCtx = this.createHookContext(PluginPhase.PLAYER_BEFORE_ATTACH_STREAM);
      finalStream = this.pluginManager.pipeHook(playCtx, 'onBeforeAttachStream', stream);
      this._preparedStreams.set(streamId, finalStream);
    }

    if (this._renderedStreamId === finalStream.id) {
      // 渲染目标已绑定当前流，避免重复 attach 导致后续回调重复触发
      return;
    }
    this._renderedStreamId = finalStream.id;

    if (this.canvasRenderer.isCanvasTarget(this.target)) {
      this.canvasRenderer.attach(this.target, finalStream, {
        muted: this.muted,
        onPlaying: () => {
          this.pluginManager.callHook(
            this.createHookContext(PluginPhase.PLAYER_MEDIA_READY),
            'onMediaReady',
            finalStream
          );
          this.emit('mediaready', { stream: finalStream });
        },
        onFrame: (frame) => {
          this.pluginManager.callHook(
            this.createHookContext(PluginPhase.PLAYER_CANVAS_FRAME),
            'onCanvasFrame',
            frame
          );
        },
      });
      return;
    }

    const mediaTarget = this.target;
    this.canvasRenderer.stop();

    mediaTarget.onloadedmetadata = null;
    mediaTarget.onplaying = null;

    mediaTarget.srcObject = finalStream;
    mediaTarget.muted = this.muted;

    mediaTarget.onloadedmetadata = () => {
      void mediaTarget.play();
    };

    mediaTarget.onplaying = () => {
      this.pluginManager.callHook(
        this.createHookContext(PluginPhase.PLAYER_MEDIA_READY),
        'onMediaReady',
        finalStream
      );
      this.emit('mediaready', { stream: finalStream });
    };
  }

  /**
   * 销毁播放器实例。
   */
  public override destroy(): void {
    this.canvasRenderer.stop();
    super.destroy();
  }
}
