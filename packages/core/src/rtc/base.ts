import { EventEmitter } from '../utils/emitter';
import { RetryController } from '../utils/retry-controller';
import type { RtcBaseEvents, RtcBaseOptions } from './types';
import type { SignalingProvider } from '../signaling/types';
import { RtcState } from './types';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type { AnyPlugin, HookContext } from '../plugins/types';

/**
 * 重连状态
 */
type ReconnectState = 'idle' | 'pending' | 'max_retries';

/**
 * RTC 抽象基类
 * 提供公共的连接管理、ICE 协商、事件发射能力
 *
 * @typeParam TEvents - 子类的事件类型（必须扩展 RtcBaseEvents 以包含公共事件）
 * @typeParam TPlugin - 子类的插件类型
 * @typeParam TInstance - 子类的实例类型，用于类型安全的插件钩子
 */
export abstract class RtcBase<
  TEvents extends RtcBaseEvents = RtcBaseEvents,
  TPlugin extends AnyPlugin = AnyPlugin,
  TInstance = unknown,
  TSignaling = SignalingProvider,
> {
  protected pc: RTCPeerConnection | null = null;
  protected emitter = new EventEmitter<TEvents>();
  protected url: string;
  protected signaling: TSignaling;

  /** 插件管理器，由子类管理 */
  protected pluginManager: PluginManager<TPlugin, TInstance>;

  /** 重连相关配置 */
  private _reconnectEnabled = true;
  /** 重连最大次数 */
  private _reconnectMaxRetries = 5;
  /** 重连状态 */
  private _reconnectState: ReconnectState = 'idle';
  /** 重连调度器 */
  private _retryController: RetryController | null = null;
  /** disconnected 兜底重连延迟（毫秒） */
  private _disconnectedTimeout = 5000;
  /** disconnected 兜底定时器 */
  private _disconnectedTimer: ReturnType<typeof setTimeout> | null = null;

  /** 是否等待 ICE 收集完成后再交换 SDP */
  protected _waitForIceComplete = true;
  /** 等待 ICE 收集完成超时时间（毫秒） */
  protected _iceGatheringTimeout = 3000;

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
   * 运行时注册一个插件
   * @returns 返回 this，支持链式调用
   */
  use(plugin: TPlugin): this {
    this.pluginManager.use(plugin);
    return this;
  }

  /**
   * 运行时卸载一个插件
   * @returns 返回 this，支持链式调用
   */
  unuse(name: string): this {
    this.pluginManager.unuse(name);
    return this;
  }

  /**
   * 监听事件
   */
  on<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.off(event, listener);
  }

  /**
   * 监听一次事件
   */
  once<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): void {
    this.emitter.once(event, listener);
  }

  /**
   * 触发事件（子类可直接调用）
   */
  protected emit<K extends keyof TEvents>(event: K, data: TEvents[K]) {
    this.emitter.emit(event, data);
  }

  /**
   * 创建插件上下文
   * 供子类在调用钩子时使用
   */
  protected createHookContext(phase: string): HookContext<TInstance> {
    return this.pluginManager.createContext(phase);
  }

  /**
   * 创建并初始化 RTCPeerConnection
   */
  protected initPeerConnection(config?: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);
    this.bindPcEvents(this.pc);
  }

  /**
   * 绑定 PC 公共事件（连接状态、ICE 候选、ICE 连接状态、ICE 收集状态）
   * @param pc RTCPeerConnection 实例
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
      // Hook: onIceGatheringStateChange — 只在子类未通过扩展点重写时生效
      const ctx = this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED);
      this.pluginManager.callHook(ctx, 'onIceGatheringStateChange', state);
      this.onIceGatheringStateChanged(state);
    };

    pc.ontrack = (event) => this.onTrack(event);
  }

  /**
   * 连接状态变更扩展点
   */
  protected onConnectionStateChanged(_state: RTCPeerConnectionState): void {}

  /**
   * ICE 候选收集完成扩展点
   */
  protected onIceCandidateReceived(_candidate: RTCIceCandidate): void {}

  /**
   * ICE 连接状态变更扩展点
   */
  protected onIceConnectionStateChanged(_state: RTCIceConnectionState): void {}

  /**
   * ICE 收集状态变更扩展点
   */
  protected onIceGatheringStateChanged(_state: RTCIceGatheringState): void {}

  /**
   * 等待 ICE 收集完成（用于非 Trickle ICE 场景）
   * @param timeoutMs 最长等待时间，超时后继续流程，避免卡死
   */
  protected waitForIceGatheringComplete(timeoutMs = this._iceGatheringTimeout): Promise<void> {
    if (!this._waitForIceComplete || !this.pc) {
      return Promise.resolve();
    }

    const pc = this.pc;

    if (pc.iceGatheringState === 'complete') {
      return Promise.resolve();
    }

    // 非标准实现/测试桩不支持事件监听时，直接跳过等待
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
   * 子类实现：处理远端轨道事件
   */
  protected abstract onTrack(event: RTCTrackEvent): void;

  /**
   * 子类实现：创建会话（offer/answer）
   * @param _ctx 调用方已创建的上下文，子类应自行通过 createHookContext 获取 phase
   */
  protected abstract createSession(_ctx?: unknown): Promise<void>;

  /**
   * 子类实现：重置会话
   */
  protected abstract resetSession(): void;

  /**
   * 发射错误
   */
  protected emitError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const errorData = { error: err instanceof Error ? err : new Error(msg) };
    const handled = this.pluginManager.pipeHook(
      this.createHookContext(PluginPhase.ERROR),
      'onError',
      errorData
    );
    if (!handled) {
      this.emit('error', msg);
    }
  }

  /**
   * 销毁连接
   * 子类应覆盖 getDestroyPhase() 以提供正确的 phase
   */
  destroy() {
    // 停止重连调度
    this._retryController?.dispose();
    this.clearDisconnectedTimer();
    this._reconnectState = 'idle';

    const phase = this.getDestroyPhase();

    // Phase: preDestroy — 所有插件在此清理 RAF、定时器等资源
    const preCtx = this.createHookContext(phase);
    this.pluginManager.callHook(preCtx, 'onPreDestroy');

    // 触发所有插件的 uninstall
    this.pluginManager.unuseAll();

    // 关闭 PeerConnection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Phase: postDestroy — pc 已关闭，插件可在此做最终清理
    const postCtx = this.createHookContext(phase);
    this.pluginManager.callHook(postCtx, 'onPostDestroy');

    this.emit('state', RtcState.DESTROYED);
  }

  /**
   * 返回 destroy 流程中使用的 phase 值
   * 子类覆盖此方法以提供正确的 phase
   */
  protected getDestroyPhase(): string {
    return PluginPhase.PLAYER_DESTROY;
  }

  /**
   * 获取当前连接状态
   */
  get connectionState() {
    return this.pc?.connectionState ?? 'new';
  }

  /**
   * 映射连接状态
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
   * 处理连接失败，触发重连流程
   * @param state 连接状态（来自 connectionState 或 iceConnectionState）
   * @param source 来源：'connection' | 'ice'
   */
  private handleConnectionFailure(
    state: RTCPeerConnectionState | RTCIceConnectionState,
    source: 'connection' | 'ice'
  ): void {
    // connectionState: 'connected' 是最终确认的连接状态
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

    // iceConnectionState: 'disconnected' / 'failed' 才是真正的重连触发点
    if (state === 'connected' || state === 'completed') {
      this.resetReconnect(true);
      return;
    }

    if (state === 'disconnected') {
      // disconnected 常见于临时抖动，先等待一段时间；若未恢复再触发重连
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
   * 调度重连
   */
  private scheduleReconnect(): void {
    this._retryController?.schedule(() => this.doReconnect());
  }

  /**
   * disconnected 场景下的兜底重连调度
   */
  private scheduleDisconnectedFallback(): void {
    this.clearDisconnectedTimer();
    this._disconnectedTimer = setTimeout(() => {
      this._disconnectedTimer = null;
      this.beginReconnectIfIdle();
    }, this._disconnectedTimeout);
  }

  /**
   * 清理 disconnected 定时器
   */
  private clearDisconnectedTimer(): void {
    if (this._disconnectedTimer !== null) {
      clearTimeout(this._disconnectedTimer);
      this._disconnectedTimer = null;
    }
  }

  /**
   * 若当前空闲则开始重连
   */
  private beginReconnectIfIdle(): void {
    if (this._reconnectState !== 'idle') {
      return;
    }
    this._reconnectState = 'pending';
    this.scheduleReconnect();
  }

  /**
   * 重置重连状态
   * @param notifySuccess 是否通知重连成功
   */
  private resetReconnect(notifySuccess: boolean, resetCount = true): void {
    const shouldNotify = notifySuccess && this._reconnectState !== 'idle';
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
   * 执行重连
   */
  private async doReconnect(): Promise<void> {
    try {
      await this.performReconnect();
    } catch {
      // performReconnect 失败，恢复为可再次调度状态并继续重试
      this._reconnectState = 'idle';
      this.scheduleReconnect();
    }
  }

  /**
   * 子类实现实际重连操作
   */
  protected abstract performReconnect(): Promise<void>;

  /**
   * 通知重连中
   * @param retryCount 当前重试次数
   * @param maxRetries 最大重试次数
   * @param interval 重连间隔
   */
  private notifyReconnecting(retryCount: number, maxRetries: number, interval: number): void {
    const data = {
      retryCount,
      maxRetries,
      interval,
    };
    const ctx = this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED);
    this.pluginManager.callHook(ctx, 'onReconnecting', data);
    this.emit('reconnecting', data);
  }

  /**
   * 通知重连失败
   */
  private notifyReconnectFailed(): void {
    const data = { maxRetries: this._reconnectMaxRetries };
    const ctx = this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED);
    this.pluginManager.callHook(ctx, 'onReconnectFailed', data);
    this.emit('reconnectfailed', data);
    this.emit('state', RtcState.FAILED);

    // 重置重连状态
    this._reconnectState = 'idle';
    this.clearDisconnectedTimer();
    this._retryController?.reset();
  }

  /**
   * 通知重连成功
   */
  private notifyReconnected(): void {
    const ctx = this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED);
    this.pluginManager.callHook(ctx, 'onReconnected');
  }
}
