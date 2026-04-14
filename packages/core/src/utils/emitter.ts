/**
 * 轻量级类型安全事件发射器。
 *
 * @typeParam TEventMap 事件映射类型。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventEmitter<TEventMap extends Record<string, any>> {
  /** 事件监听表。 */
  private events: Map<keyof TEventMap, Array<(data: unknown) => void>> = new Map();

  /**
   * 监听事件。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  on<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener as (data: unknown) => void);
  }

  /**
   * 发射事件。
   *
   * @param event 事件名。
   * @param data 事件数据。
   */
  emit<K extends keyof TEventMap>(event: K, data?: TEventMap[K]): void {
    this.events.get(event)?.forEach((listener) => listener(data));
  }

  /**
   * 移除事件监听器。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  off<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    this.events.set(
      event,
      (this.events.get(event) ?? []).filter((l) => l !== (listener as (data: unknown) => void))
    );
  }

  /**
   * 监听一次事件。
   *
   * @param event 事件名。
   * @param listener 监听回调。
   */
  once<K extends keyof TEventMap>(event: K, listener: (data: TEventMap[K]) => void): void {
    const wrappedListener = (data: unknown) => {
      listener(data as TEventMap[K]);
      this.off(event, wrappedListener as (data: TEventMap[K]) => void);
    };
    this.on(event, wrappedListener as (data: TEventMap[K]) => void);
  }

  /**
   * 检查事件是否存在。
   *
   * @param event 事件名。
   */
  has(event: keyof TEventMap): boolean {
    return (this.events.get(event)?.length ?? 0) > 0;
  }
}
