import { EventEmitter } from '../utils/emitter';
import type { RtcBaseEvents, RtcBaseOptions, SignalingProvider } from './types';
import { RtcState } from './types';
import { PluginManager } from '../plugins/manager';
import type { AnyPlugin, HookContext } from '../plugins/types';

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

  constructor(
    options: RtcBaseOptions,
    signaling: SignalingProvider,
    pluginManager: PluginManager<TPlugin, TInstance>
  ) {
    this.url = options.url;
    this.signaling = signaling;
    this.pluginManager = pluginManager;
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
   * 绑定 PC 公共事件（连接状态、ICE 候选、ICE 连接状态）
   * @param pc RTCPeerConnection 实例
   */
  protected bindPcEvents(pc: RTCPeerConnection): void {
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      this.emit('state', this.mapConnectionState(state));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.emit('iceconnectionstate', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      this.emit('icegatheringstate', pc.iceGatheringState);
    };

    pc.ontrack = (event) => this.onTrack(event);
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
      this.createHookContext('error'),
      'onError',
      errorData
    );
    if (!handled) {
      this.emit('error', msg);
    }
  }

  /**
   * 销毁连接
   */
  destroy() {
    this.pluginManager.unuseAll();
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.emit('state', RtcState.DESTROYED);
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
}
