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
  let rafId: number | null = null;

  let frameCount = 0;
  let lastReportTime = 0;
  let lastBytesSent = 0;
  let lastBytesReceived = 0;
  let lastTimestamp = 0;

  const startFpsTracking = () => {
    if (rafId !== null) return;
    const tick = () => {
      frameCount += 1;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const stopFpsTracking = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    frameCount = 0;
  };

  const flushFps = (): FpsStats => {
    const now = performance.now();
    const elapsed = (now - lastReportTime) / 1000;
    const fps = elapsed > 0 ? Math.round((frameCount / elapsed) * 10) / 10 : 0;
    const result: FpsStats = { fps, frames: frameCount };
    frameCount = 0;
    lastReportTime = now;
    return result;
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

  const stopReporting = () => {
    if (statsTimer !== null) {
      clearInterval(statsTimer);
      statsTimer = null;
    }
    stopFpsTracking();
  };

  const startReporting = () => {
    if (!hostInstance || statsTimer !== null) return;

    frameCount = 0;
    lastReportTime = performance.now();
    resetNetworkDelta();
    startFpsTracking();

    statsTimer = setInterval(async () => {
      if (!hostInstance) return;

      const fps = flushFps();
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
