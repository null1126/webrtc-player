import type { AnyPlugin, HookContext, RtcPlayerHookName, RtcPublisherHookName } from './types';

/**
 * 插件管理器
 * 负责插件的注册、安装、卸载和钩子调用
 *
 * @typeParam T - 插件类型（必须是 RtcPlayerPlugin 或 RtcPublisherPlugin）
 * @typeParam S - 宿主实例类型（RtcPlayerPluginInstance 或 RtcPublisherPluginInstance）
 */
export class PluginManager<T extends AnyPlugin = AnyPlugin, S = unknown> {
  private plugins: T[] = [];
  private _instance: S | null = null;

  /**
   * 设置所属实例
   */
  setInstance(instance: S): void {
    this._instance = instance;
  }

  /**
   * 获取已注册的插件列表（不含实例）
   */
  list(): ReadonlyArray<T> {
    return this.plugins as ReadonlyArray<T>;
  }

  /**
   * 注册一个插件
   * - 相同名称的插件不能重复注册
   * - 安装时自动调用插件的 install 生命周期
   *
   * @returns 返回 this，支持链式调用
   */
  use(plugin: T): this {
    if (this.plugins.some((p) => p.name === plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" is already registered.`);
      return this;
    }
    this.plugins.push(plugin);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = this._instance !== null ? plugin.install?.(this._instance as any) : undefined;
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
   * 卸载指定名称的插件
   * - 自动调用插件的 uninstall 生命周期
   *
   * @returns 返回 this，支持链式调用
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
   * 卸载所有插件
   */
  unuseAll(): void {
    const names = this.plugins.map((p) => p.name);
    for (const name of names) {
      this.unuse(name);
    }
  }

  /**
   * 检查指定插件是否已注册
   */
  has(name: string): boolean {
    return this.plugins.some((p) => p.name === name);
  }

  /**
   * 创建插件上下文
   * 供子类在调用钩子时使用
   */
  createContext(phase: string): HookContext<S> {
    return {
      instance: this._instance as S,
      phase,
    };
  }

  /**
   * 按注册顺序执行所有插件的通知类钩子
   * @param ctx  插件上下文
   * @param hook 钩子名称
   * @param args 传递给每个插件的参数
   */
  callHook<H extends RtcPlayerHookName | RtcPublisherHookName>(
    ctx: HookContext<S>,
    hook: H,
    ...args: unknown[]
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
   * 按注册顺序执行所有插件的 pipe 钩子。
   * 第一个有返回值的插件决定最终结果，之后的插件收到该结果作为输入。
   * 如果第一个插件返回 void，则后续插件收到 initial，直到遇到第一个返回值。
   *
   * @param ctx     插件上下文
   * @param hook    钩子名称
   * @param initial 初始值
   * @param args    传递给每个插件的额外参数
   * @returns 第一个有返回值的插件结果；若均无返回值则返回 initial
   */
  pipeHook<Ret>(
    ctx: HookContext<S>,
    hook: RtcPlayerHookName | RtcPublisherHookName,
    initial: Ret,
    ...args: unknown[]
  ): Ret | undefined {
    let value: Ret | undefined = initial;
    let found = false;
    for (const plugin of this.plugins) {
      const fn = (plugin as unknown as Record<string, unknown>)[hook] as
        | ((...args: unknown[]) => Ret | undefined)
        | undefined;
      if (typeof fn === 'function') {
        try {
          const result = fn(ctx, value, ...args);
          if (!found && result !== undefined) {
            value = result;
            found = true;
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
   * 按注册顺序执行所有插件的异步通知钩子
   * @param ctx  插件上下文
   * @param hook 钩子名称
   * @param args 传递给每个插件的参数
   */
  async asyncHook<H extends RtcPlayerHookName | RtcPublisherHookName>(
    ctx: HookContext<S>,
    hook: H,
    ...args: unknown[]
  ): Promise<void> {
    const promises = this.plugins
      .filter((p) => typeof (p as unknown as Record<string, unknown>)[hook] === 'function')
      .map(async (plugin) => {
        try {
          const fn = (plugin as unknown as Record<string, unknown>)[hook] as (
            ...args: unknown[]
          ) => unknown;
          const result = fn(ctx, ...args);
          if (result instanceof Promise) {
            await result;
          }
        } catch (err) {
          console.error(
            `[PluginManager] Error in plugin "${plugin.name}" hook "${String(hook)}":`,
            err
          );
        }
      });
    await Promise.all(promises);
  }

  /**
   * 按注册顺序执行所有插件的异步 pipe 钩子。
   * 第一个有返回值的插件决定最终结果，之后的插件收到该结果作为输入。
   *
   * @param ctx     插件上下文
   * @param hook    钩子名称
   * @param initial 初始值
   * @param args    传递给每个插件的额外参数
   */
  async asyncPipeHook<Ret>(
    ctx: HookContext<S>,
    hook: RtcPlayerHookName | RtcPublisherHookName,
    initial: Ret,
    ...args: unknown[]
  ): Promise<Ret | undefined> {
    let value: Ret | undefined = initial;
    let found = false;
    for (const plugin of this.plugins) {
      const fn = (plugin as unknown as Record<string, unknown>)[hook] as
        | ((...args: unknown[]) => Ret | Promise<Ret> | undefined)
        | undefined;
      if (typeof fn === 'function') {
        try {
          const result = fn(ctx, value, ...args);
          const resolved = result instanceof Promise ? await result : result;
          if (!found && resolved !== undefined) {
            value = resolved;
            found = true;
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
