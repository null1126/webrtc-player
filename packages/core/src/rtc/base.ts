import { EventEmitter } from '../utils/emitter';
import type { RtcBaseEvents, RtcBaseOptions, SignalingProvider } from './types';
import { RtcState } from './types';

/**
 * RTC 抽象基类
 * 提供公共的连接管理、ICE 协商、事件发射能力
 *
 * @typeParam TEvents - 子类的事件类型（必须扩展 RtcBaseEvents 以包含公共事件）
 */
export abstract class RtcBase<TEvents extends RtcBaseEvents = RtcBaseEvents> {
  protected pc: RTCPeerConnection | null = null;
  protected emitter = new EventEmitter<TEvents>();
  protected url: string;
  protected signaling: SignalingProvider;

  constructor(options: RtcBaseOptions, signaling: SignalingProvider) {
    this.url = options.url;
    this.signaling = signaling;
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
   * 创建并初始化 RTCPeerConnection
   */
  protected initPeerConnection(config?: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);
    this.bindPcEvents();
  }

  /**
   * 绑定 PC 事件
   */
  private bindPcEvents() {
    if (!this.pc) return;

    this.pc.onconnectionstatechange = () => {
      this.emit('state', this.mapConnectionState(this.pc!.connectionState));
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      this.emit('iceconnectionstate', this.pc!.iceConnectionState);
    };

    this.pc.onicegatheringstatechange = () => {
      this.emit('icegatheringstate', this.pc!.iceGatheringState);
    };

    this.pc.ontrack = (event) => {
      this.onTrack(event);
    };
  }

  /**
   * 子类实现：处理远端轨道事件
   */
  protected abstract onTrack(event: RTCTrackEvent): void;

  /**
   * 子类实现：创建会话（offer/answer）
   */
  protected abstract createSession(): Promise<void>;

  /**
   * 子类实现：重置会话
   */
  protected abstract resetSession(): void;

  /**
   * 发射错误
   */
  protected emitError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    this.emit('error', msg);
  }

  /**
   * 销毁连接
   */
  destroy() {
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
  private mapConnectionState(state: RTCPeerConnectionState): RtcState {
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
