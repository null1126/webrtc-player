/**
 * 轻量级类型安全事件发射器。
 *
 * 特性：
 * - 通过泛型 `TEventMap` 约束事件名与 payload 类型
 * - 支持 `on / off / once / emit`
 * - 不依赖外部运行时，适合 SDK 内部基础设施
 *
 * @typeParam TEventMap 事件映射类型，键为事件名，值为事件参数类型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventEmitter<TEventMap extends Record<string, any>> {
  /** 事件监听表：eventName -> listeners[] */
  private events: Map<keyof TEventMap, Array<(data: unknown) => void>> = new Map();

  /**
   * 监听事件
   * @param event 事件类型
   * @param listener 事件监听器
   */
  on<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener as (data: unknown) => void);
  }

  /**
   * 发射事件
   * @param event 事件类型
   * @param data 事件数据
   */
  emit<K extends keyof TEventMap>(event: K, data?: TEventMap[K]): void {
    this.events.get(event)?.forEach((listener) => listener(data));
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 事件监听器
   */
  off<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    this.events.set(
      event,
      (this.events.get(event) ?? []).filter((l) => l !== (listener as (data: unknown) => void))
    );
  }

  /**
   * 监听一次事件
   * @param event 事件类型
   * @param listener 事件监听器
   */
  once<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    const wrappedListener = (data: unknown) => {
      listener(data as TEventMap[K]);
      this.off(event, wrappedListener as (data: TEventMap[K]) => void);
    };
    this.on(event, wrappedListener as (data: TEventMap[K]) => void);
  }

  /**
   * 检查事件是否存在
   */
  has(event: keyof TEventMap): boolean {
    return (this.events.get(event)?.length ?? 0) > 0;
  }
}
