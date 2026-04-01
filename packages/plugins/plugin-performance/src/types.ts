/**
 * FPS 监控数据
 */
export interface FpsStats {
  fps: number;
  /** 过去一秒内的帧数 */
  frames: number;
}

/**
 * 网络相关统计
 */
export interface NetworkStats {
  /** 发送字节数（自连接建立以来累计） */
  bytesSent: number;
  /** 接收字节数（自连接建立以来累计） */
  bytesReceived: number;
  /** 当前预估的发送比特率（bps） */
  bitrateSent: number;
  /** 当前预估的接收比特率（bps） */
  bitrateReceived: number;
  /** 往返时延（ms），可能为 null（尚未收到 RTCP） */
  rtt: number | null;
  /** 当前 ICE 候选对的连接状态 */
  connectionState: RTCIceConnectionState;
  /** 当前 RTP 视频轨道的抖动（秒），可能为 null */
  jitter: number | null;
  /** 发送数据包丢包率（0~1） */
  packetsLostRate: number;
  /** 接收数据包丢包率（0~1） */
  packetsReceivedLostRate: number;
}

/**
 * 性能数据汇总
 */
export interface PerformanceData {
  /** 拉流端 URL */
  url: string;
  /** 报告时间戳（performance.now()） */
  timestamp: number;
  fps?: FpsStats;
  network?: NetworkStats;
}

/**
 * createPerformancePlugin 的配置选项
 */
export interface PerformancePluginOptions {
  /**
   * 监控间隔（毫秒），默认 1000。
   * 影响 FPS 采样精度和网络 stats 轮询频率。
   */
  interval?: number;
}
