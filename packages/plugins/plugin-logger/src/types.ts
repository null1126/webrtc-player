/**
 * 日志级别
 */
export type LogLevel = 'info' | 'error' | 'warn' | 'debug';

/**
 * 单条日志条目
 */
export interface LogEntry {
  /** 日志唯一 ID */
  id: number;
  /** 日志时间（HH:MM:SS 格式字符串，与 LogPanel 保持一致） */
  time: string;
  /** 日志时间戳（Date.now()） */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 日志内容 */
  message: string;
  /** 所属阶段（PluginPhase），便于按来源过滤 */
  phase?: string;
}

/**
 * 日志插件回调函数类型
 * 每次有日志产生时，插件会调用此回调
 */
export type LogCallback = (entry: LogEntry) => void;

/**
 * 日志插件配置选项
 */
export interface LoggerPluginOptions {
  /**
   * 最大缓存日志条数，超过后自动丢弃最早的日志。
   * 默认 200。
   */
  maxLogs?: number;
  /**
   * 是否包含 debug 级别日志，默认 false。
   * debug 日志量大，开启后请注意性能。
   */
  includeDebug?: boolean;
}
