import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '@webrtc-player/core/plugins/types';
import type { FpsStats, NetworkStats, PerformanceData, PerformancePluginOptions } from './types';

/**
 * 创建性能监控插件
 *
 * @param options  配置选项
 * @param onReport 性能数据回调，插件会定期调用它
 * @returns RtcPlayerPlugin 实例，可直接传入 player.use()
 *
 * @example
 * ```ts
 * const perfPlugin = createPerformancePlugin(
 *   { interval: 1000 },
 *   (data) => {
 *     console.log('fps:', data.fps?.fps);
 *     console.log('bitrate:', data.network?.bitrateReceived);
 *   }
 * );
 *
 * const player = new RtcPlayer({ url: '...' });
 * player.use(perfPlugin);
 * ```
 */
export function createPerformancePlugin(
  options: PerformancePluginOptions = {},
  onReport: (data: PerformanceData) => void
): RtcPlayerPlugin {
  const { interval = 1000 } = options;

  let statsTimer: ReturnType<typeof setInterval> | null = null;
  let frameCount = 0;
  let lastReportTime = 0;
  let lastBytesSent = 0;
  let lastBytesReceived = 0;
  let lastTimestamp = 0;

  const flushFps = (): FpsStats => {
    const now = performance.now();
    const elapsed = (now - lastReportTime) / 1000;
    const fps = elapsed > 0 ? Math.round((frameCount / elapsed) * 10) / 10 : 0;
    const result: FpsStats = { fps, frames: frameCount };
    frameCount = 0;
    lastReportTime = now;
    return result;
  };

  const collectNetworkStats = async (
    instance: RtcPlayerPluginInstance
  ): Promise<NetworkStats | undefined> => {
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
        jitter = report.jitter ? report.jitter * 1000 : null;
        connectionState = report.state as RTCIceConnectionState;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const currentRtt = report.currentRoundTripTime;
        rtt = currentRtt != null ? Math.round(currentRtt * 1000 * 100) / 100 : null;
      }
    });

    const timeDelta = (now - lastTimestamp) / 1000;
    if (timeDelta > 0) {
      bitrateSent = Math.round(((bytesSent - lastBytesSent) * 8) / timeDelta);
      bitrateReceived = Math.round(((bytesReceived - lastBytesReceived) * 8) / timeDelta);
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

  const plugin: RtcPlayerPlugin = {
    name: 'performance',

    install(instance: RtcPlayerPluginInstance) {
      lastReportTime = performance.now();
      lastTimestamp = performance.now();

      statsTimer = setInterval(async () => {
        const fps = flushFps();
        const network = await collectNetworkStats(instance);

        onReport({
          url: instance.getStreamUrl(),
          timestamp: performance.now(),
          fps,
          network,
        });
      }, interval);
    },

    onBeforeVideoRender() {
      frameCount++;
    },

    uninstall() {
      if (statsTimer !== null) {
        clearInterval(statsTimer);
        statsTimer = null;
      }
    },
  };

  return plugin;
}
