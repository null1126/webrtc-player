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
 * 插件管理器。
 *
 * 负责插件注册、卸载与 Hook 调度，默认按 `priority` 降序执行。
 *
 * @typeParam T 插件类型。
 * @typeParam S 宿主实例类型。
 */
export class PluginManager<T extends AnyPlugin = AnyPlugin, S = unknown> {
  /** 已注册插件列表，按 `priority` 降序排列。 */
  private plugins: T[] = [];
  /** 当前宿主实例。 */
  private _instance: S | null = null;

  /**
   * 绑定宿主实例。
   *
   * @param instance 宿主实例。
   */
  setInstance(instance: S): void {
    this._instance = instance;
  }

  /**
   * 返回当前插件列表快照。
   */
  list(): ReadonlyArray<T> {
    return this.plugins as ReadonlyArray<T>;
  }

  /**
   * 按 `priority` 降序排序插件列表。
   */
  private sortPlugins(): void {
    this.plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * 注册插件并触发安装。
   *
   * @param plugin 插件实例。
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
   * 卸载指定名称的插件。
   *
   * @param name 插件名称。
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
   *
   * @param name 插件名称。
   */
  has(name: string): boolean {
    return this.plugins.some((p) => p.name === name);
  }

  /**
   * 创建 Hook 上下文。
   *
   * @param phase 生命周期阶段标识。
   */
  createContext(phase: string): HookContext<S> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance: this._instance as any,
      phase: phase as HookContext<S>['phase'],
    };
  }

  /**
   * 触发通知类 Hook。
   *
   * @param ctx Hook 上下文。
   * @param hook Hook 名称。
   * @param args Hook 参数。
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
   * @param ctx Hook 上下文。
   * @param hook Hook 名称。
   * @param initial 初始值。
   * @param args 额外参数。
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
   * @param ctx Hook 上下文。
   * @param hook Hook 名称。
   * @param initial 初始值。
   * @param args 额外参数。
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
