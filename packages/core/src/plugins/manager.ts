import type {
  AnyPlugin,
  HookContext,
  RtcAsyncPipeHookName,
  RtcPlayerNotifyHookName,
  RtcPlayerPipeHookName,
  RtcPublisherNotifyHookName,
  RtcPublisherPipeHookName,
} from './types';

/**
 * 插件调度器。
 *
 * 设计目标：
 * 1. 管理插件生命周期（install / uninstall）
 * 2. 管理插件执行顺序（按 priority 从高到低）
 * 3. 提供三种 Hook 调度模型：
 *    - callHook: 纯通知，不关心返回值
 *    - pipeHook: 同步管道，可串行改写输入值
 *    - asyncPipeHook: 异步管道，可串行改写输入值
 *
 * @typeParam T 插件类型（Player / Publisher 联合）
 * @typeParam S 宿主实例类型（RtcPlayer / RtcPublisher）
 */
export class PluginManager<T extends AnyPlugin = AnyPlugin, S = unknown> {
  /** 已注册插件列表（始终维持优先级排序） */
  private plugins: T[] = [];
  /** 当前插件宿主实例 */
  private _instance: S | null = null;

  /**
   * 绑定宿主实例。
   * 插件 install(context.instance) 与 HookContext.instance 均依赖此对象。
   */
  setInstance(instance: S): void {
    this._instance = instance;
  }

  /**
   * 返回只读插件列表快照。
   */
  list(): ReadonlyArray<T> {
    return this.plugins as ReadonlyArray<T>;
  }

  /**
   * 根据 priority 降序排序。
   * 同优先级保持稳定插入顺序（由 JS sort 实现细节保证，不做额外扰动）。
   */
  private sortPlugins(): void {
    this.plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * 注册插件。
   * - 若重名插件已存在，忽略本次注册并输出警告。
   * - 注册后立即触发 install。
   */
  use(plugin: T): this {
    if (this.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" is already registered.`);
      return this;
    }

    this.plugins.push(plugin);
    this.sortPlugins();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = plugin.install?.(this._instance as any);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[PluginManager] Plugin "${plugin.name}" install failed:`, err);
        });
      }
    } catch (err) {
      console.error(`[PluginManager] Plugin "${plugin.name}" install threw an error:`, err);
    }

    return this;
  }

  /**
   * 卸载指定名称插件。
   * - 插件不存在时仅输出警告，不抛错。
   * - 卸载时触发 uninstall。
   */
  unuse(name: string): this {
    const idx = this.plugins.findIndex((p) => p.name === name);
    if (idx === -1) {
      console.warn(`[PluginManager] Plugin "${name}" not found.`);
      return this;
    }

    const plugin = this.plugins[idx];
    try {
      const result = plugin.uninstall?.();
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[PluginManager] Plugin "${name}" uninstall failed:`, err);
        });
      }
    } catch (err) {
      console.error(`[PluginManager] Plugin "${name}" uninstall threw an error:`, err);
    }

    this.plugins.splice(idx, 1);
    return this;
  }

  /**
   * 卸载全部插件。
   */
  unuseAll(): void {
    const names = this.plugins.map((p) => p.name);
    for (const name of names) {
      this.unuse(name);
    }
  }

  /**
   * 判断插件是否已注册。
   */
  has(name: string): boolean {
    return this.plugins.some((p) => p.name === name);
  }

  /**
   * 创建 Hook 调用上下文。
   *
   * @param phase 生命周期阶段标识（字符串常量，来自 PluginPhase）
   */
  createContext(phase: string): HookContext<S> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: this._instance as any,
      phase: phase as HookContext<S>['phase'],
    };
  }

  /**
   * 触发通知类 Hook（不处理返回值）。
   *
   * 执行特性：
   * - 按 priority 从高到低执行
   * - 单个插件异常不会中断后续插件执行
   */
  callHook(
    ctx: HookContext<S>,
    hook: RtcPlayerNotifyHookName | RtcPublisherNotifyHookName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): void {
    for (const plugin of this.plugins) {
      const fn = (plugin as unknown as Record<string, unknown>)[hook];
      if (typeof fn === 'function') {
        try {
          fn.call(plugin, ctx, ...args);
        } catch (err) {
          console.error(
            `[PluginManager] Error in plugin "${plugin.name}" hook "${String(hook)}":`,
            err
          );
        }
      }
    }
  }

  /**
   * 触发同步管道 Hook。
   *
   * 管道语义（compose）：
   * - 以上一个插件返回值作为下一个插件输入
   * - 返回 undefined 表示“不改写，沿用当前值”
   */
  pipeHook<Ret>(
    ctx: HookContext<S>,
    hook: RtcPlayerPipeHookName | RtcPublisherPipeHookName,
    initial: Ret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): Ret {
    let value = initial;

    for (const plugin of this.plugins) {
      const fn = (plugin as unknown as Record<string, unknown>)[hook] as
        | ((...args: unknown[]) => Ret | undefined)
        | undefined;

      if (typeof fn === 'function') {
        try {
          const result = fn(ctx, value, ...args);
          if (result !== undefined) {
            value = result;
          }
        } catch (err) {
          console.error(
            `[PluginManager] Error in plugin "${plugin.name}" hook "${String(hook)}":`,
            err
          );
        }
      }
    }

    return value;
  }

  /**
   * 触发异步管道 Hook。
   *
   * 与 pipeHook 的差异：
   * - 支持 Promise 返回值
   * - 保证串行 await，便于插件进行依赖顺序控制
   */
  async asyncPipeHook<Ret>(
    ctx: HookContext<S>,
    hook: RtcAsyncPipeHookName,
    initial: Ret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): Promise<Ret> {
    let value = initial;

    for (const plugin of this.plugins) {
      const fn = (plugin as unknown as Record<string, unknown>)[hook] as
        | ((...args: unknown[]) => Ret | Promise<Ret> | undefined)
        | undefined;

      if (typeof fn === 'function') {
        try {
          const result = fn(ctx, value, ...args);
          const resolved = result instanceof Promise ? await result : result;
          if (resolved !== undefined) {
            value = resolved;
          }
        } catch (err) {
          console.error(
            `[PluginManager] Error in plugin "${plugin.name}" hook "${String(hook)}":`,
            err
          );
        }
      }
    }

    return value;
  }
}
