import type {
  RtcPlayerPlugin,
  RtcPlayerPluginInstance,
  RtcPublisherPlugin,
  RtcPublisherPluginInstance,
} from '@webrtc-player/core/plugins/types';
import type { FpsStats, NetworkStats, PerformanceData, PerformancePluginOptions } from './types';

type PerfInstance = RtcPlayerPluginInstance | RtcPublisherPluginInstance;

const isPlayerInstance = (instance: PerfInstance): instance is RtcPlayerPluginInstance => {
  return 'getStreamUrl' in instance;
};

const getRole = (instance: PerfInstance): PerformanceData['role'] => {
  return isPlayerInstance(instance) ? 'player' : 'publisher';
};

/**
 * 创建性能监控插件（同时支持拉流与推流）
 *
 * @param options  配置选项
 * @param onReport 性能数据回调，插件会定期调用它
 */
export function createPerformancePlugin(
  options: PerformancePluginOptions = {},
  onReport: (data: PerformanceData) => void
): RtcPlayerPlugin & RtcPublisherPlugin {
  const { interval = 1000 } = options;

  let hostInstance: PerfInstance | null = null;
  let statsTimer: ReturnType<typeof setInterval> | null = null;

  // 优先使用真实视频帧回调（requestVideoFrameCallback）
  let videoFrameCbId: number | null = null;
  let trackedVideoEl: HTMLVideoElement | null = null;
  let frameCount = 0;
  let lastReportTime = 0;

  // FPS 兜底（无法使用 requestVideoFrameCallback 时）
  let lastDecodedFrames = 0;
  let lastEncodedFrames = 0;

  // 网络差分基线
  let lastBytesSent = 0;
  let lastBytesReceived = 0;
  let lastTimestamp = 0;

  const supportsVideoFrameCallback = (el: HTMLVideoElement) => {
    return typeof el.requestVideoFrameCallback === 'function';
  };

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

  const stopVideoFrameTracking = () => {
    if (trackedVideoEl && videoFrameCbId !== null && trackedVideoEl.cancelVideoFrameCallback) {
      trackedVideoEl.cancelVideoFrameCallback(videoFrameCbId);
    }
    trackedVideoEl = null;
    videoFrameCbId = null;
    frameCount = 0;
  };

  const resetFpsFallbackBaseline = () => {
    lastDecodedFrames = 0;
    lastEncodedFrames = 0;
  };

  const resetNetworkDelta = () => {
    lastBytesSent = 0;
    lastBytesReceived = 0;
    lastTimestamp = performance.now();
  };

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

  const collectRealFrameFps = async (instance: PerfInstance): Promise<FpsStats> => {
    const now = performance.now();
    const elapsed = (now - lastReportTime) / 1000;
    const role = getRole(instance);

    // 优先：播放器场景使用 requestVideoFrameCallback 统计真实渲染帧
    if (isPlayerInstance(instance)) {
      const target = instance.getTargetElement();
      if (target instanceof HTMLVideoElement && supportsVideoFrameCallback(target)) {
        // 首次进入或元素切换时重建追踪
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

    // 兜底：通过 WebRTC stats 的 frames* 累计值差分估算真实帧率
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

  const stopReporting = () => {
    if (statsTimer !== null) {
      clearInterval(statsTimer);
      statsTimer = null;
    }
    stopVideoFrameTracking();
  };

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

  const plugin: RtcPlayerPlugin & RtcPublisherPlugin = {
    name: 'performance',

    install(instance) {
      hostInstance = instance;
    },

    onPlaying() {
      startReporting();
    },

    onPublishing() {
      startReporting();
    },

    onUnpublishing() {
      stopReporting();
    },

    onPreDestroy() {
      stopReporting();
      hostInstance = null;
    },

    uninstall() {
      stopReporting();
      hostInstance = null;
    },
  };

  return plugin;
}
