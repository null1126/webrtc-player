import type { RtcPlayerPlugin, PluginPhaseValue } from '@webrtc-player/core/plugins/types';
import type { LogCallback, LogLevel, LoggerPluginOptions } from './types';
import { formatTime, nextId } from './utils';

/**
 * 创建拉流端日志插件
 *
 * @param options  配置选项
 * @param callback  日志回调，每次有日志产生时调用
 * @returns RtcPlayerPlugin，可直接传入 player.use()
 *
 * @example
 * ```ts
 * const logger = createPlayerLoggerPlugin(
 *   { includeDebug: false },
 *   (entry) => console.log(entry.time, entry.level, entry.message)
 * );
 * const player = new RtcPlayer({ url: '...' });
 * player.use(logger);
 * ```
 */
export function createPlayerLoggerPlugin(
  options: LoggerPluginOptions = {},
  callback: LogCallback
): RtcPlayerPlugin {
  const { includeDebug = false } = options;

  const interceptors: Partial<RtcPlayerPlugin> = {};

  const plugin: RtcPlayerPlugin = {
    name: 'logger',

    install() {
      const emit = (level: LogLevel, message: string, phase: PluginPhaseValue) => {
        if (level === 'debug' && !includeDebug) return;
        callback({
          id: nextId(),
          time: formatTime(new Date()),
          timestamp: Date.now(),
          level,
          message,
          phase,
        });
      };

      interceptors.onConnectionStateChange = (ctx, data) => {
        emit('info', `[状态] ${data.state}`, ctx.phase);
      };

      interceptors.onIceConnectionStateChange = (ctx, state) => {
        emit('info', `[ICE] ${state}`, ctx.phase);
      };

      interceptors.onIceGatheringStateChange = (ctx, state) => {
        emit('debug', `[ICE Gathering] ${state}`, ctx.phase);
      };

      interceptors.onIceCandidate = (ctx, data) => {
        const c = data.candidate.candidate;
        emit(
          'debug',
          `[ICE] ${c ? c.slice(0, 80) + (c.length > 80 ? '…' : '') : '(空候选)'}`,
          ctx.phase
        );
      };

      interceptors.onReconnecting = (ctx, data) => {
        emit('info', `[重连] 重连中 (${data.retryCount}/${data.maxRetries})`, ctx.phase);
      };

      interceptors.onReconnectFailed = (ctx, data) => {
        emit('error', `[重连] 重连失败 (${data.maxRetries})`, ctx.phase);
      };

      interceptors.onReconnected = (ctx) => {
        emit('info', `[重连] 重连成功`, ctx.phase);
      };

      interceptors.onError = (ctx, data) => {
        const msg = data.error instanceof Error ? data.error.message : String(data.error);
        emit('error', `[错误] ${msg}`, ctx.phase);
      };

      interceptors.onTrack = (ctx, stream, event) => {
        const kindToLabel: Record<string, string> = {
          video: '视频',
          audio: '音频',
        };

        emit(
          'info',
          `[事件] track — 收到远端${kindToLabel[event.track?.kind] ?? '未知'}轨道 (${stream.getVideoTracks().length}v / ${stream.getAudioTracks().length}a)`,
          ctx.phase
        );
      };

      interceptors.onPlaying = (ctx) => {
        emit('info', `[事件] playing — 视频播放中`, ctx.phase);
      };

      interceptors.onBeforeSwitchStream = (ctx, url) => {
        emit('info', `[操作] 切换至 ${url}`, ctx.phase);
      };

      interceptors.onAfterSwitchStream = (ctx, url) => {
        emit('info', `[事件] 切换完成 ${url}`, ctx.phase);
      };

      interceptors.onPreDestroy = (ctx) => {
        emit('info', `[操作] 停止拉流`, ctx.phase);
      };

      Object.assign(plugin, interceptors);
    },

    uninstall() {
      // 无需清理
    },
  };

  return plugin;
}
