import type {
  RtcPlayerPlugin,
  RtcPlayerPluginInstance,
  RtcPublisherPlugin,
  RtcPublisherPluginInstance,
} from '@webrtc-engine/core/plugins/types';
import type { FpsStats, NetworkStats, PerformanceData, PerformancePluginOptions } from './types';

/** 统一宿主实例类型：播放器或推流器 */
type PerfInstance = RtcPlayerPluginInstance | RtcPublisherPluginInstance;

/**
 * 类型守卫：判断是否为播放器实例。
 *
 * @param instance 插件宿主实例
 * @returns 是否为 RtcPlayerPluginInstance
 */
const isPlayerInstance = (instance: PerfInstance): instance is RtcPlayerPluginInstance => {
  return 'getStreamUrl' in instance;
};

/**
 * 根据宿主实例推导角色。
 *
 * @param instance 插件宿主实例
 * @returns 性能数据角色标识
 */
const getRole = (instance: PerfInstance): PerformanceData['role'] => {
  return isPlayerInstance(instance) ? 'player' : 'publisher';
};

/**
 * 创建性能监控插件（同时支持拉流与推流）。
 *
 * 指标策略：
 * - FPS：优先使用 requestVideoFrameCallback，回退到 WebRTC stats 差分
 * - 网络：基于 getStats 计算码率、丢包率、RTT、jitter 等
 *
 * @param options 插件配置（采样周期等）
 * @param onReport 性能数据回调
 * @returns 同时兼容 Player/Publisher 的插件实例
 */
export function createPerformancePlugin(
  options: PerformancePluginOptions = {},
  onReport: (data: PerformanceData) => void
): RtcPlayerPlugin & RtcPublisherPlugin {
  const { interval = 1000 } = options;

  /** 当前挂载的宿主实例 */
  let hostInstance: PerfInstance | null = null;
  /** 周期采样定时器 */
  let statsTimer: ReturnType<typeof setInterval> | null = null;

  /** requestVideoFrameCallback 回调 ID */
  let videoFrameCbId: number | null = null;
  /** 当前追踪的视频元素 */
  let trackedVideoEl: HTMLVideoElement | null = null;
  /** 当前窗口累计帧数 */
  let frameCount = 0;
  /** 上次 FPS 汇报时间 */
  let lastReportTime = 0;

  /** FPS fallback 基线：解码帧 */
  let lastDecodedFrames = 0;
  /** FPS fallback 基线：编码帧 */
  let lastEncodedFrames = 0;

  /** 网络差分基线：发送字节 */
  let lastBytesSent = 0;
  /** 网络差分基线：接收字节 */
  let lastBytesReceived = 0;
  /** 网络差分基线时间 */
  let lastTimestamp = 0;

  /**
   * 判断视频元素是否支持 requestVideoFrameCallback。
   *
   * @param el 视频元素
   * @returns 是否支持 requestVideoFrameCallback
   */
  const supportsVideoFrameCallback = (el: HTMLVideoElement) => {
    return typeof el.requestVideoFrameCallback === 'function';
  };

  /**
   * 启动真实渲染帧追踪。
   *
   * @param videoEl 目标视频元素
   * @returns void
   */
  const startVideoFrameTracking = (videoEl: HTMLVideoElement) => {
    if (videoFrameCbId !== null) return;
    if (!supportsVideoFrameCallback(videoEl)) return;

    trackedVideoEl = videoEl;

    const tick = () => {
      frameCount += 1;
      if (!trackedVideoEl) return;
      videoFrameCbId = trackedVideoEl.requestVideoFrameCallback(tick);
    };

    videoFrameCbId = videoEl.requestVideoFrameCallback(tick);
  };

  /**
   * 停止真实渲染帧追踪并重置帧计数。
   *
   * @returns void
   */
  const stopVideoFrameTracking = () => {
    if (trackedVideoEl && videoFrameCbId !== null && trackedVideoEl.cancelVideoFrameCallback) {
      trackedVideoEl.cancelVideoFrameCallback(videoFrameCbId);
    }
    trackedVideoEl = null;
    videoFrameCbId = null;
    frameCount = 0;
  };

  /**
   * 重置 FPS fallback 差分基线。
   *
   * @returns void
   */
  const resetFpsFallbackBaseline = () => {
    lastDecodedFrames = 0;
    lastEncodedFrames = 0;
  };

  /**
   * 重置网络差分基线。
   *
   * @returns void
   */
  const resetNetworkDelta = () => {
    lastBytesSent = 0;
    lastBytesReceived = 0;
    lastTimestamp = performance.now();
  };

  /**
   * 采集网络指标。
   *
   * @param instance 当前宿主实例
   * @returns 网络指标；当 pc 不可用时返回 undefined
   */
  const collectNetworkStats = async (instance: PerfInstance): Promise<NetworkStats | undefined> => {
    const pc = instance.getPeerConnection();
    if (!pc) return undefined;

    const stats = await pc.getStats();
    let bytesSent = 0;
    let bytesReceived = 0;
    let bitrateSent = 0;
    let bitrateReceived = 0;
    let rtt: number | null = null;
    let jitter: number | null = null;
    let packetsLostSent = 0;
    let packetsSent = 0;
    let packetsLostReceived = 0;
    let packetsReceived = 0;
    let connectionState: RTCIceConnectionState = 'new';

    const now = performance.now();

    stats.forEach((report) => {
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        bytesSent = Number(report.bytesSent ?? 0);
        packetsSent = Number(report.packetsSent ?? 0);
        packetsLostSent = Number(report.packetsLost ?? 0);
      }

      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bytesReceived = Number(report.bytesReceived ?? 0);
        packetsReceived = Number(report.packetsReceived ?? 0);
        packetsLostReceived = Number(report.packetsLost ?? 0);
        jitter = report.jitter != null ? Math.round(report.jitter * 1000 * 100) / 100 : null;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const currentRtt = report.currentRoundTripTime;
        rtt = currentRtt != null ? Math.round(currentRtt * 1000 * 100) / 100 : null;
      }
    });

    const pcIceState = pc.iceConnectionState;
    connectionState = pcIceState ?? connectionState;

    const timeDelta = (now - lastTimestamp) / 1000;
    if (timeDelta > 0) {
      bitrateSent = Math.max(0, Math.round(((bytesSent - lastBytesSent) * 8) / timeDelta));
      bitrateReceived = Math.max(
        0,
        Math.round(((bytesReceived - lastBytesReceived) * 8) / timeDelta)
      );
    }

    lastBytesSent = bytesSent;
    lastBytesReceived = bytesReceived;
    lastTimestamp = now;

    const totalSent = packetsSent + packetsLostSent;
    const totalReceived = packetsReceived + packetsLostReceived;

    return {
      bytesSent,
      bytesReceived,
      bitrateSent,
      bitrateReceived,
      rtt,
      connectionState,
      jitter,
      packetsLostRate:
        totalSent > 0 ? Math.round((packetsLostSent / totalSent) * 10000) / 10000 : 0,
      packetsReceivedLostRate:
        totalReceived > 0 ? Math.round((packetsLostReceived / totalReceived) * 10000) / 10000 : 0,
    };
  };

  /**
   * 采集 FPS。
   *
   * @param instance 当前宿主实例
   * @returns FPS 与当前窗口帧数
   */
  const collectRealFrameFps = async (instance: PerfInstance): Promise<FpsStats> => {
    const now = performance.now();
    const elapsed = (now - lastReportTime) / 1000;
    const role = getRole(instance);

    if (isPlayerInstance(instance)) {
      const target = instance.getTargetElement();
      if (target instanceof HTMLVideoElement && supportsVideoFrameCallback(target)) {
        if (trackedVideoEl !== target || videoFrameCbId === null) {
          stopVideoFrameTracking();
          startVideoFrameTracking(target);
        }

        const fps = elapsed > 0 ? Math.round((frameCount / elapsed) * 10) / 10 : 0;
        const result: FpsStats = { fps, frames: frameCount };
        frameCount = 0;
        lastReportTime = now;
        return result;
      }
    }

    const pc = instance.getPeerConnection();
    if (!pc) {
      lastReportTime = now;
      return { fps: 0, frames: 0 };
    }

    const stats = await pc.getStats();
    let currentFrames = 0;

    stats.forEach((report) => {
      if (role === 'player') {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          currentFrames += Number(report.framesDecoded ?? report.framesReceived ?? 0);
        }
      } else if (report.type === 'outbound-rtp' && report.kind === 'video') {
        currentFrames += Number(report.framesEncoded ?? report.framesSent ?? 0);
      }
    });

    const prevFrames = role === 'player' ? lastDecodedFrames : lastEncodedFrames;
    const deltaFrames = Math.max(0, currentFrames - prevFrames);

    if (role === 'player') {
      lastDecodedFrames = currentFrames;
    } else {
      lastEncodedFrames = currentFrames;
    }

    const fps = elapsed > 0 ? Math.round((deltaFrames / elapsed) * 10) / 10 : 0;
    lastReportTime = now;

    return {
      fps,
      frames: deltaFrames,
    };
  };

  /**
   * 停止性能上报。
   *
   * @returns void
   */
  const stopReporting = () => {
    if (statsTimer !== null) {
      clearInterval(statsTimer);
      statsTimer = null;
    }
    stopVideoFrameTracking();
  };

  /**
   * 启动性能上报。
   *
   * @returns void
   */
  const startReporting = () => {
    if (!hostInstance || statsTimer !== null) return;

    frameCount = 0;
    lastReportTime = performance.now();
    resetFpsFallbackBaseline();
    resetNetworkDelta();

    if (isPlayerInstance(hostInstance)) {
      const target = hostInstance.getTargetElement();
      if (target instanceof HTMLVideoElement) {
        startVideoFrameTracking(target);
      }
    }

    statsTimer = setInterval(async () => {
      if (!hostInstance) return;

      const fps = await collectRealFrameFps(hostInstance);
      const network = await collectNetworkStats(hostInstance);
      const role = getRole(hostInstance);

      onReport({
        role,
        url: isPlayerInstance(hostInstance) ? hostInstance.getStreamUrl() : undefined,
        timestamp: performance.now(),
        fps,
        network,
      });
    }, interval);
  };

  /** 性能插件实现 */
  const plugin: RtcPlayerPlugin & RtcPublisherPlugin = {
    /** 插件唯一名称 */
    name: 'performance',

    /**
     * 安装阶段：保存宿主引用。
     *
     * @param instance 宿主实例
     */
    install(instance) {
      hostInstance = instance;
    },

    /**
     * 拉流媒体就绪后启动上报。
     */
    onMediaReady() {
      startReporting();
    },

    /**
     * 推流状态变化驱动上报启停。
     *
     * @param _ctx Hook 上下文（当前未使用）
     * @param state 推流状态
     */
    onStreamingStateChange(_ctx, state) {
      if (state === 'streaming') {
        startReporting();
      }
      if (state === 'idle') {
        stopReporting();
      }
    },

    /**
     * 推流停止前停止采样，避免无效 getStats。
     */
    onBeforeStop() {
      stopReporting();
    },

    /**
     * 销毁前清理定时器与宿主引用。
     */
    onPreDestroy() {
      stopReporting();
      hostInstance = null;
    },

    /**
     * 卸载时兜底清理。
     */
    uninstall() {
      stopReporting();
      hostInstance = null;
    },
  };

  return plugin;
}
