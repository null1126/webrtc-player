import { EventEmitter } from '../utils/emitter';
import { RetryController } from '../utils/retry-controller';
import type { RtcBaseEvents, RtcBaseOptions } from './types';
import type { SignalingProvider } from '../signaling/types';
import { RtcState } from './types';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type { AnyPlugin, HookContext } from '../plugins/types';

/**
 * 重连状态。
 */
type ReconnectState = 'idle' | 'pending' | 'max_retries';

/**
 * RTC 基类。
 *
 * 封装 PeerConnection、事件分发、重连调度与插件 Hook 上下文。
 *
 * @typeParam TEvents 事件类型。
 * @typeParam TPlugin 插件类型。
 * @typeParam TInstance 宿主实例类型。
 * @typeParam TSignaling 信令实现类型。
 */
export abstract class RtcBase<
  TEvents extends RtcBaseEvents = RtcBaseEvents,
  TPlugin extends AnyPlugin = AnyPlugin,
  TInstance = unknown,
  TSignaling = SignalingProvider,
> {
  /** 当前 `RTCPeerConnection` 实例。 */
  protected pc: RTCPeerConnection | null = null;
  /** 事件发射器。 */
  protected emitter = new EventEmitter<TEvents>();
  /** 当前会话 URL。 */
  protected url: string;
  /** 信令实现。 */
  protected signaling: TSignaling;
  /** 插件管理器。 */
  protected pluginManager: PluginManager<TPlugin, TInstance>;

  /** 是否启用重连。 */
  private _reconnectEnabled = true;
  /** 最大重连次数。 */
  private _reconnectMaxRetries = 5;
  /** 当前重连状态。 */
  private _reconnectState: ReconnectState = 'idle';
  /** 重连调度控制器。 */
  private _retryController: RetryController | null = null;
  /** `disconnected` 状态兜底延迟。 */
  private _disconnectedTimeout = 5000;
  /** `disconnected` 状态兜底定时器。 */
  private _disconnectedTimer: ReturnType<typeof setTimeout> | null = null;

  /** 是否等待 ICE 收集完成后再发起信令交换。 */
  protected _waitForIceComplete = true;
  /** ICE 收集等待超时时间。 */
  protected _iceGatheringTimeout = 3000;

  /**
   * @param options RTC 基础配置。
   * @param signaling 信令实现。
   * @param pluginManager 插件管理器。
   */
  constructor(
    options: RtcBaseOptions,
    signaling: TSignaling,
    pluginManager: PluginManager<TPlugin, TInstance>
  ) {
    this.url = options.url;
    this.signaling = signaling;
    this.pluginManager = pluginManager;

    const reconnectOptions = options.reconnect;
    this._reconnectEnabled = reconnectOptions?.enabled ?? true;
    this._reconnectMaxRetries = reconnectOptions?.maxRetries ?? 5;
    this._disconnectedTimeout = reconnectOptions?.disconnectedTimeout ?? 5000;

    this._waitForIceComplete = options.ice?.waitForComplete ?? true;
    this._iceGatheringTimeout = options.ice?.gatheringTimeout ?? 3000;

    this._retryController = new RetryController(
      {
        enabled: this._reconnectEnabled,
        maxRetries: this._reconnectMaxRetries,
        interval: reconnectOptions?.interval ?? 2000,
        exponential: reconnectOptions?.exponential ?? false,
        maxInterval: reconnectOptions?.maxInterval,
        jitterRatio: reconnectOptions?.jitterRatio,
      },
      {
        onRetry: ({ retryCount, maxRetries, interval }) => {
          this.notifyReconnecting(retryCount, maxRetries, interval);
          this.emit('state', RtcState.CONNECTING);
        },
        onExhausted: () => {
          this._reconnectState = 'max_retries';
          this.notifyReconnectFailed();
        },
      }
    );
  }

  /**
   * 注册插件。
   *
   * @param plugin 插件实例。
   */
  use(plugin: TPlugin): this {
    this.pluginManager.use(plugin);
    return this;
  }

  /**
   * 卸载插件。
   *
   * @param name 插件名称。
   */
  unuse(name: string): this {
    this.pluginManager.unuse(name);
    return this;
  }

  /**
   * 订阅事件。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  on<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * 取消事件订阅。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  off<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.off(event, listener);
  }

  /**
   * 订阅一次性事件。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  once<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.once(event, listener);
  }

  /**
   * 触发事件。
   *
   * @param event 事件名。
   * @param data 事件数据。
   */
  protected emit<K extends keyof TEvents>(event: K, data: TEvents[K]) {
    this.emitter.emit(event, data);
  }

  /**
   * 创建 Hook 上下文。
   *
   * @param phase 生命周期阶段。
   */
  protected createHookContext(phase: string): HookContext<TInstance> {
    return this.pluginManager.createContext(phase);
  }

  /**
   * 初始化 `RTCPeerConnection` 并绑定基础事件。
   *
   * @param config PeerConnection 配置。
   */
  protected initPeerConnection(config?: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);
    this.bindPcEvents(this.pc);
  }

  /**
   * 绑定 `RTCPeerConnection` 公共事件。
   *
   * @param pc `RTCPeerConnection` 实例。
   */
  protected bindPcEvents(pc: RTCPeerConnection): void {
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      this.emit('state', this.mapConnectionState(state));

      if (this._reconnectEnabled) {
        this.handleConnectionFailure(pc.connectionState, 'connection');
      }

      this.onConnectionStateChanged(pc.connectionState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
        this.onIceCandidateReceived(event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.emit('iceconnectionstate', pc.iceConnectionState);

      if (this._reconnectEnabled) {
        this.handleConnectionFailure(pc.iceConnectionState, 'ice');
      }

      this.onIceConnectionStateChanged(pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      const state = pc.iceGatheringState;
      this.emit('icegatheringstate', state);
      this.onIceGatheringStateChanged(state);
    };

    pc.ontrack = (event) => this.onTrack(event);
  }

  /**
   * 连接状态变化回调。
   *
   * @param _state 连接状态。
   */
  protected onConnectionStateChanged(_state: RTCPeerConnectionState): void {}

  /**
   * 收到本地 ICE candidate 回调。
   *
   * @param _candidate ICE candidate。
   */
  protected onIceCandidateReceived(_candidate: RTCIceCandidate): void {}

  /**
   * ICE 连接状态变化回调。
   *
   * @param _state ICE 连接状态。
   */
  protected onIceConnectionStateChanged(_state: RTCIceConnectionState): void {}

  /**
   * ICE 收集状态变化回调。
   *
   * @param _state ICE 收集状态。
   */
  protected onIceGatheringStateChanged(_state: RTCIceGatheringState): void {}

  /**
   * 等待 ICE 收集完成。
   *
   * @param timeoutMs 超时时间，单位毫秒。
   */
  protected waitForIceGatheringComplete(timeoutMs = this._iceGatheringTimeout): Promise<void> {
    if (!this._waitForIceComplete || !this.pc) {
      return Promise.resolve();
    }

    const pc = this.pc;

    if (pc.iceGatheringState === 'complete') {
      return Promise.resolve();
    }

    if (typeof pc.addEventListener !== 'function' || typeof pc.removeEventListener !== 'function') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      const finish = () => {
        cleanup();
        resolve();
      };

      const onStateChange = () => {
        if (pc.iceGatheringState === 'complete') {
          finish();
        }
      };

      pc.addEventListener('icegatheringstatechange', onStateChange);
      timer = setTimeout(finish, timeoutMs);
    });
  }

  /**
   * 子类必须实现：处理远端 track。
   */
  protected abstract onTrack(event: RTCTrackEvent): void;

  /**
   * 子类必须实现：创建会话。
   */
  protected abstract createSession(_ctx?: unknown): Promise<void>;

  /**
   * 子类必须实现：重置会话资源。
   */
  protected abstract resetSession(): void;

  /**
   * 统一错误发射入口。
   *
   * @param err 原始错误。
   * @param context 可选上下文标识。
   */
  protected emitError(err: unknown, context?: string) {
    const msg = err instanceof Error ? err.message : String(err);
    const errorData = { error: err instanceof Error ? err : new Error(msg), context };

    this.pluginManager.callHook(this.createHookContext(PluginPhase.ERROR), 'onError', errorData);
    this.emit('error', msg);
  }

  /**
   * 销毁 RTC 实例。
   */
  destroy() {
    this._retryController?.dispose();
    this.clearDisconnectedTimer();
    this._reconnectState = 'idle';

    const phase = this.getDestroyPhase();

    const preCtx = this.createHookContext(phase);
    this.pluginManager.callHook(preCtx, 'onPreDestroy');

    this.pluginManager.unuseAll();

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    const postCtx = this.createHookContext(phase);
    this.pluginManager.callHook(postCtx, 'onPostDestroy');

    this.emit('state', RtcState.DESTROYED);
  }

  /**
   * 返回 destroy 流程的 phase 标识。
   */
  protected getDestroyPhase(): string {
    return PluginPhase.PLAYER_DESTROY;
  }

  /**
   * 获取当前连接状态。
   */
  get connectionState() {
    return this.pc?.connectionState ?? 'new';
  }

  /**
   * 将原生 RTCPeerConnectionState 映射为 SDK 的 RtcState。
   *
   * @param state 原生连接状态。
   * @returns 映射后的 SDK 连接状态。
   */
  protected mapConnectionState(state: RTCPeerConnectionState): RtcState {
    const map: Record<RTCPeerConnectionState, RtcState> = {
      new: RtcState.CONNECTING,
      connecting: RtcState.CONNECTING,
      connected: RtcState.CONNECTED,
      disconnected: RtcState.DISCONNECTED,
      failed: RtcState.FAILED,
      closed: RtcState.CLOSED,
    };
    return map[state] ?? RtcState.FAILED;
  }

  /**
   * 根据连接来源和状态判断是否启动重连。
   *
   * @param state 当前连接状态。
   * @param source 状态来源。
   */
  private handleConnectionFailure(
    state: RTCPeerConnectionState | RTCIceConnectionState,
    source: 'connection' | 'ice'
  ): void {
    if (source === 'connection') {
      if (state === 'connected') {
        this.resetReconnect(true);
        return;
      }

      if (state !== 'failed') {
        return;
      }

      this.clearDisconnectedTimer();
      this.beginReconnectIfIdle();
      return;
    }

    if (state === 'connected' || state === 'completed') {
      this.resetReconnect(true);
      return;
    }

    if (state === 'disconnected') {
      this.scheduleDisconnectedFallback();
      return;
    }

    if (state !== 'failed') {
      return;
    }

    this.clearDisconnectedTimer();
    this.beginReconnectIfIdle();
  }

  /**
   * 调度一次重连任务。
   */
  private scheduleReconnect(): void {
    this._retryController?.schedule(() => this.doReconnect());
  }

  /**
   * 为 `disconnected` 状态设置兜底重连调度。
   */
  private scheduleDisconnectedFallback(): void {
    this.clearDisconnectedTimer();
    this._disconnectedTimer = setTimeout(() => {
      this._disconnectedTimer = null;
      this.beginReconnectIfIdle();
    }, this._disconnectedTimeout);
  }

  /**
   * 清理 `disconnected` 兜底定时器。
   */
  private clearDisconnectedTimer(): void {
    if (this._disconnectedTimer !== null) {
      clearTimeout(this._disconnectedTimer);
      this._disconnectedTimer = null;
    }
  }

  /**
   * 在空闲状态下进入重连流程。
   */
  private beginReconnectIfIdle(): void {
    if (this._reconnectState !== 'idle') {
      return;
    }
    this._reconnectState = 'pending';
    this.scheduleReconnect();
  }

  /**
   * 重置重连状态。
   *
   * @param notifySuccess 是否触发重连成功通知。
   * @param resetCount 是否重置重试计数。
   */
  private resetReconnect(notifySuccess: boolean, resetCount = true): void {
    const hasRetried = (this._retryController?.count ?? 0) > 0;
    const shouldNotify = notifySuccess && (this._reconnectState !== 'idle' || hasRetried);

    this._reconnectState = 'idle';
    this.clearDisconnectedTimer();

    if (resetCount) {
      this._retryController?.reset();
    } else {
      this._retryController?.cancelScheduled();
    }

    if (shouldNotify) {
      this.notifyReconnected();
    }
  }

  /**
   * 执行重连动作。
   */
  private async doReconnect(): Promise<void> {
    try {
      await this.performReconnect();
      this._reconnectState = 'idle';
    } catch {
      this._reconnectState = 'idle';
      this.beginReconnectIfIdle();
    }
  }

  /**
   * 子类必须实现：真正的重连逻辑。
   */
  protected abstract performReconnect(): Promise<void>;

  /**
   * 通知“重连中”。
   */
  private notifyReconnecting(retryCount: number, maxRetries: number, interval: number): void {
    const data = { retryCount, maxRetries, interval };
    const ctx = this.createHookContext(PluginPhase.BASE_RECONNECTING);

    this.pluginManager.callHook(ctx, 'onReconnecting', data);
    this.emit('reconnecting', data);
  }

  /**
   * 通知“重连失败”。
   */
  private notifyReconnectFailed(): void {
    const data = { maxRetries: this._reconnectMaxRetries };
    const ctx = this.createHookContext(PluginPhase.BASE_RECONNECT_FAILED);

    this.pluginManager.callHook(ctx, 'onReconnectFailed', data);
    this.emit('reconnectfailed', data);
    this.emit('state', RtcState.FAILED);

    this._reconnectState = 'idle';
    this.clearDisconnectedTimer();
    this._retryController?.reset();
  }

  /**
   * 通知“重连成功”。
   */
  private notifyReconnected(): void {
    const ctx = this.createHookContext(PluginPhase.BASE_RECONNECTED);
    this.pluginManager.callHook(ctx, 'onReconnected');
    this.emit('reconnected', undefined);
  }
}
