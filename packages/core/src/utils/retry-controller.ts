/**
 * RetryController 配置项。
 */
export interface RetryControllerOptions {
  /**
   * 是否启用重试调度。
   *
   * - true: 允许 schedule 生效
   * - false: schedule 会直接返回，不会创建任何定时器
   *
   * 默认值：true
   */
  enabled?: boolean;

  /**
   * 最大重试次数。
   *
   * 注意：这是“可执行重试任务的次数”上限。
   * 例如 maxRetries = 2 时，最多触发两次 onRetry / task，
   * 第三次进入调度检查时会触发 onExhausted。
   *
   * 默认值：5
   */
  maxRetries?: number;

  /**
   * 重试基准间隔（毫秒）。
   *
   * - exponential=false 时，每次延迟都使用该值
   * - exponential=true 时，该值作为指数退避的初始基数
   *
   * 默认值：2000
   */
  interval?: number;

  /**
   * 是否启用指数退避。
   *
   * 开启后延迟为：interval * 2^n（n 为当前重试序号，从 0 开始）。
   * 默认值：false
   */
  exponential?: boolean;

  /**
   * 最大重试间隔（毫秒，可选）。
   *
   * 若设置，将在计算出退避延迟后做上限截断：min(delay, maxInterval)。
   */
  maxInterval?: number;

  /**
   * 抖动比例（可选）。
   *
   * 用于在最终延迟上附加随机波动，降低多实例同一时间重试造成的“惊群”。
   * 例如 jitterRatio = 0.2，则随机因子范围约为 [0.8, 1.2]。
   *
   * 计算公式：delay * (1 + random(-jitterRatio, +jitterRatio))
   */
  jitterRatio?: number;
}

/**
 * 单次重试触发时透出的数据。
 */
export interface RetryAttemptPayload {
  /** 当前是第几次重试（从 1 开始计数） */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 本次调度使用的等待间隔（毫秒） */
  interval: number;
}

/**
 * 调度生命周期回调。
 */
export interface RetryControllerCallbacks {
  /**
   * 在一次重试即将执行时触发。
   *
   * 触发时机：
   * 1) 定时器到期
   * 2) 未达到 maxRetries
   * 3) retryCount 自增后
   * 4) 调用 onRetry
   * 5) 执行 task
   */
  onRetry?: (payload: RetryAttemptPayload) => void;

  /**
   * 当达到最大重试次数后，再次调度检查时触发。
   *
   * 该回调触发后，不会执行 task。
   */
  onExhausted?: () => void;
}

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_INTERVAL = 2000;

/**
 * 通用重试调度器。
 *
 * 职责：
 * - 管理重试计数（retryCount）
 * - 计算每次调度延迟（固定/指数退避 + 可选抖动 + 可选上限）
 * - 管理定时器生命周期（schedule / cancel / reset / dispose）
 *
 * 设计约束：
 * - 同一时刻只允许一个待执行定时器（避免重复调度）
 * - 控制器被 dispose 后不可再次使用
 * - 控制器本身不感知业务成功/失败，只负责“按策略触发 task”
 */
export class RetryController {
  private enabled: boolean;
  private maxRetries: number;
  private interval: number;
  private exponential: boolean;
  private maxInterval?: number;
  private jitterRatio?: number;

  /** 当前挂起的重试定时器（若存在） */
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** 已触发的重试次数（从 0 开始内部计数） */
  private retryCount = 0;
  /** 是否已销毁；销毁后调度将失效 */
  private disposed = false;

  private callbacks: RetryControllerCallbacks;

  /**
   * 创建一个重试调度器。
   *
   * @param options 重试策略配置
   * @param callbacks 生命周期回调
   */
  constructor(options: RetryControllerOptions = {}, callbacks: RetryControllerCallbacks = {}) {
    this.enabled = options.enabled ?? true;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.interval = options.interval ?? DEFAULT_INTERVAL;
    this.exponential = options.exponential ?? false;
    this.maxInterval = options.maxInterval;
    this.jitterRatio = options.jitterRatio;
    this.callbacks = callbacks;
  }

  /**
   * 返回当前累计重试次数（从 0 开始）。
   */
  get count(): number {
    return this.retryCount;
  }

  /**
   * 安排一次重试任务。
   *
   * 行为说明：
   * - 若未启用 / 已销毁 / 已存在挂起定时器，则直接忽略。
   * - 只会创建“一个”定时器，防止并发 schedule 造成重复触发。
   * - 定时器触发后：
   *   1) 若已达最大次数 -> 触发 onExhausted，结束
   *   2) 否则递增 retryCount，触发 onRetry，再执行 task
   *
   * @param task 实际要执行的异步重试任务
   */
  schedule(task: () => Promise<void>): void {
    if (!this.enabled || this.disposed || this.timer !== null) {
      return;
    }

    const delay = this.getNextDelay(this.retryCount);
    this.timer = setTimeout(() => {
      this.timer = null;

      if (this.retryCount >= this.maxRetries) {
        this.callbacks.onExhausted?.();
        return;
      }

      const interval = this.getNextDelay(this.retryCount);
      this.retryCount += 1;
      this.callbacks.onRetry?.({
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
        interval,
      });

      void task();
    }, delay);
  }

  /**
   * 取消当前已安排但尚未执行的重试任务。
   *
   * 注意：
   * - 不会清空 retryCount
   * - 适合“临时中断调度，但保留历史重试次数”的场景
   */
  cancelScheduled(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 重置调度器状态。
   *
   * 行为：
   * - 取消挂起定时器
   * - 将 retryCount 清零
   *
   * 适合“连接恢复成功后重新开始计数”的场景。
   */
  reset(): void {
    this.cancelScheduled();
    this.retryCount = 0;
  }

  /**
   * 销毁调度器。
   *
   * 行为：
   * - 取消挂起定时器
   * - 清零计数
   * - 标记为 disposed（后续 schedule 永远不会生效）
   */
  dispose(): void {
    this.cancelScheduled();
    this.disposed = true;
    this.retryCount = 0;
  }

  /**
   * 计算下一次调度延迟（毫秒）。
   *
   * 流程：
   * 1) 计算基础延迟（固定 or 指数退避）
   * 2) 应用 maxInterval 上限（若设置）
   * 3) 应用 jitter 随机抖动（若设置且 > 0）
   *
   * @param exponent 指数退避的指数（通常使用当前 retryCount）
   */
  private getNextDelay(exponent: number): number {
    const base = this.exponential ? this.interval * Math.pow(2, exponent) : this.interval;
    const withMax = this.maxInterval ? Math.min(base, this.maxInterval) : base;

    if (!this.jitterRatio || this.jitterRatio <= 0) {
      return withMax;
    }

    const randomFactor = 1 + (Math.random() * 2 - 1) * this.jitterRatio;
    return Math.max(0, Math.round(withMax * randomFactor));
  }
}
