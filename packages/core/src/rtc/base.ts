import { EventEmitter } from '../utils/emitter';
import type { RtcBaseEvents, RtcBaseOptions, SignalingProvider } from './types';
import { RtcState } from './types';
import { PluginManager } from '../plugins/manager';
import { PluginPhase } from '../plugins/types';
import type { AnyPlugin, HookContext } from '../plugins/types';

/**
 * 重连状态
 */
type ReconnectState = 'idle' | 'pending' | 'retrying' | 'max_retries';

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
> {
  protected pc: RTCPeerConnection | null = null;
  protected emitter = new EventEmitter<TEvents>();
  protected url: string;
  protected signaling: SignalingProvider;

  /** 插件管理器，由子类管理 */
  protected pluginManager: PluginManager<TPlugin, TInstance>;

  /** 重连相关配置 */
  private _reconnectEnabled = true;
  /** 重连最大次数 */
  private _reconnectMaxRetries = 5;
  /** 重连间隔 */
  private _reconnectInterval = 2000;
  /** 重连指数 */
  private _reconnectExponential = false;
  /** 重连定时器 */
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** 重连次数 */
  private _reconnectCount = 0;
  /** 重连状态 */
  private _reconnectState: ReconnectState = 'idle';

  constructor(
    options: RtcBaseOptions,
    signaling: SignalingProvider,
    pluginManager: PluginManager<TPlugin, TInstance>
  ) {
    this.url = options.url;
    this.signaling = signaling;
    this.pluginManager = pluginManager;
    if (options.reconnect?.enabled) {
      this._reconnectEnabled = true;
      this._reconnectMaxRetries = options.reconnect.maxRetries ?? 5;
      this._reconnectInterval = options.reconnect.interval ?? 2000;
      this._reconnectExponential = options.reconnect.exponential ?? false;
    }
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
    // 停止重连定时器
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._reconnectState = 'idle';
    this._reconnectCount = 0;

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
        if (this._reconnectState !== 'idle') {
          this._reconnectState = 'idle';
          this._reconnectCount = 0;
          if (this._reconnectTimer !== null) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
          }
          this.notifyReconnected();
        }
        return;
      }
      if (state !== 'failed') {
        return;
      }
      if (this._reconnectState !== 'idle') {
        return;
      }
      this._reconnectState = 'pending';
      this.scheduleReconnect();
      return;
    }

    // iceConnectionState: 'disconnected' / 'failed' 才是真正的重连触发点
    if (state === 'connected' || state === 'completed') {
      if (this._reconnectState !== 'idle') {
        this._reconnectState = 'idle';
        this._reconnectCount = 0;
        if (this._reconnectTimer !== null) {
          clearTimeout(this._reconnectTimer);
          this._reconnectTimer = null;
        }
        this.notifyReconnected();
      }
      return;
    }

    if (state === 'disconnected') {
      if (this._reconnectState !== 'idle') {
        this._reconnectState = 'idle';
        if (this._reconnectTimer !== null) {
          clearTimeout(this._reconnectTimer);
          this._reconnectTimer = null;
        }
      }
      return;
    }

    if (state !== 'failed') {
      return;
    }

    if (this._reconnectState !== 'idle') {
      return;
    }

    this._reconnectState = 'pending';
    this.scheduleReconnect();
  }

  /**
   * 获取重连间隔
   * @param exponent 指数
   * @returns 重连间隔
   */
  private getReconnectInterval(exponent: number): number {
    if (!this._reconnectExponential) return this._reconnectInterval;
    return this._reconnectInterval * Math.pow(2, exponent);
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
    }
    this._reconnectTimer = setTimeout(() => {
      if (this._reconnectCount >= this._reconnectMaxRetries) {
        this._reconnectState = 'max_retries';
        this.notifyReconnectFailed();
        return;
      }

      const interval = this.getReconnectInterval(this._reconnectCount);
      this._reconnectCount++;
      this.notifyReconnecting(interval);
      this.emit('state', RtcState.CONNECTING);
      this.doReconnect();
    }, this.getReconnectInterval(this._reconnectCount));
  }

  /**
   * 执行重连
   */
  private doReconnect(): void {
    this._reconnectTimer = null;
    this.performReconnect().catch(() => {
      // performReconnect 失败，不要把状态留在 'retrying' 以免 ICE failed 时无法再次调度
      this._reconnectState = 'idle';
    });
  }

  /**
   * 子类实现实际重连操作
   */
  protected abstract performReconnect(): Promise<void>;

  /**
   * 通知重连中
   * @param interval 重连间隔
   */
  private notifyReconnecting(interval: number): void {
    const data = {
      retryCount: this._reconnectCount,
      maxRetries: this._reconnectMaxRetries,
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
    this._reconnectCount = 0;
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  /**
   * 通知重连成功
   */
  private notifyReconnected(): void {
    const ctx = this.createHookContext(PluginPhase.PEER_CONNECTION_CREATED);
    this.pluginManager.callHook(ctx, 'onReconnected');
  }
}
