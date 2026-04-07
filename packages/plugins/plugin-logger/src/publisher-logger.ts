import type { RtcPublisherPlugin, PluginPhaseValue } from '@webrtc-player/core/plugins/types';
import type { LogCallback, LogLevel, LoggerPluginOptions } from './types';
import { formatTime, getSourceName, nextId } from './utils';

/**
 * 创建推流端日志插件
 *
 * @param options  配置选项
 * @param callback  日志回调，每次有日志产生时调用
 * @returns RtcPublisherPlugin，可直接传入 publisher.use()
 *
 * @example
 * ```ts
 * const logger = createPublisherLoggerPlugin(
 *   { includeDebug: false },
 *   (entry) => console.log(entry.time, entry.level, entry.message)
 * );
 * const publisher = new RtcPublisher({ url: '...' });
 * publisher.use(logger);
 * ```
 */
export function createPublisherLoggerPlugin(
  options: LoggerPluginOptions = {},
  callback: LogCallback
): RtcPublisherPlugin {
  const { includeDebug = false } = options;

  const interceptors: Partial<RtcPublisherPlugin> = {};

  const plugin: RtcPublisherPlugin = {
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

      interceptors.onStreamingStateChange = (ctx, state) => {
        emit('info', `[状态] ${state}`, ctx.phase);
      };

      interceptors.onPublishing = (ctx) => {
        emit('info', `[事件] streamstart — 推流已启动`, ctx.phase);
      };

      interceptors.onUnpublishing = (ctx) => {
        emit('info', `[操作] 停止推流`, ctx.phase);
      };

      interceptors.onBeforeSourceChange = (ctx, source) => {
        emit('info', `[操作] 切换至 ${getSourceName(source)}`, ctx.phase);
      };

      interceptors.onAfterSourceChange = (ctx, source) => {
        emit('info', `[事件] sourcechange — 输入源已切换: ${getSourceName(source)}`, ctx.phase);
      };

      interceptors.onTrackAttached = (ctx, track, stream) => {
        emit(
          'debug',
          `[事件] trackAttached — ${track.kind} (${stream.getVideoTracks().length}v / ${stream.getAudioTracks().length}a)`,
          ctx.phase
        );
      };

      interceptors.onPreDestroy = (ctx) => {
        emit('info', `[操作] 停止推流`, ctx.phase);
      };

      Object.assign(plugin, interceptors);
    },

    uninstall() {
      // 无需清理
    },
  };

  return plugin;
}
