import type { RtcPublisherPlugin, PluginPhaseValue } from '@webrtc-engine/core/plugins/types';
import type { LogCallback, LogLevel, LoggerPluginOptions } from './types';
import { formatTime, getSourceName, nextId } from './utils';

/**
 * 创建推流日志插件。
 *
 * 该插件关注推流端关键生命周期：
 * - 连接与 ICE 变化
 * - 信令请求/响应/错误
 * - 输入源切换与轨道状态
 * - 停止与销毁流程
 */
export function createPublisherLoggerPlugin(
  options: LoggerPluginOptions = {},
  callback: LogCallback
): RtcPublisherPlugin {
  const { includeDebug = false } = options;

  /** Hook 拦截器集合 */
  const interceptors: Partial<RtcPublisherPlugin> = {};

  const plugin: RtcPublisherPlugin = {
    /** 插件唯一名称 */
    name: 'logger',

    /**
     * 注册所有日志 Hook。
     */
    install() {
      /**
       * 统一输出日志入口。
       */
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

      /** 连接状态日志 */
      interceptors.onConnectionStateChange = (ctx, data) => {
        emit('info', `[状态] ${data.state}`, ctx.phase);
      };

      /** ICE 连接状态日志 */
      interceptors.onIceConnectionStateChange = (ctx, state) => {
        emit('info', `[ICE] ${state}`, ctx.phase);
      };

      /** ICE gathering 状态日志 */
      interceptors.onIceGatheringStateChange = (ctx, state) => {
        emit('debug', `[ICE Gathering] ${state}`, ctx.phase);
      };

      /** candidate 日志（截断） */
      interceptors.onIceCandidate = (ctx, data) => {
        const c = data.candidate.candidate;
        emit(
          'debug',
          `[ICE] ${c ? c.slice(0, 80) + (c.length > 80 ? '…' : '') : '(空候选)'}`,
          ctx.phase
        );
      };

      /** 重连中日志 */
      interceptors.onReconnecting = (ctx, data) => {
        emit('info', `[重连] 重连中 (${data.retryCount}/${data.maxRetries})`, ctx.phase);
      };

      /** 重连失败日志 */
      interceptors.onReconnectFailed = (ctx, data) => {
        emit('error', `[重连] 重连失败 (${data.maxRetries})`, ctx.phase);
      };

      /** 重连成功日志 */
      interceptors.onReconnected = (ctx) => {
        emit('info', `[重连] 重连成功`, ctx.phase);
      };

      /** 统一错误日志 */
      interceptors.onError = (ctx, data) => {
        const msg = data.error instanceof Error ? data.error.message : String(data.error);
        emit('error', `[错误] ${msg}`, ctx.phase);
      };

      /** 推流状态日志 */
      interceptors.onStreamingStateChange = (ctx, state) => {
        emit('info', `[状态] ${state}`, ctx.phase);
      };

      /** 切源前日志 */
      interceptors.onBeforeSourceChange = (ctx, source) => {
        emit('info', `[操作] 切换至 ${getSourceName(source)}`, ctx.phase);
      };

      /** 切源后日志 */
      interceptors.onAfterSourceChange = (ctx, source) => {
        emit('info', `[事件] sourcechange — 输入源已切换: ${getSourceName(source)}`, ctx.phase);
      };

      /** 轨道挂载日志 */
      interceptors.onTrackAttached = (ctx, track, stream) => {
        emit(
          'debug',
          `[事件] trackAttached — ${track.kind} (${stream.getVideoTracks().length}v / ${stream.getAudioTracks().length}a)`,
          ctx.phase
        );
      };

      /** 轨道结束日志 */
      interceptors.onTrackEnded = (ctx, data) => {
        emit('warn', `[轨道] ended: ${data.track.kind}`, ctx.phase);
      };

      /** 轨道 mute/unmute 日志 */
      interceptors.onTrackMuteChanged = (ctx, data) => {
        emit('info', `[轨道] ${data.track.kind} ${data.muted ? 'mute' : 'unmute'}`, ctx.phase);
      };

      /** 信令请求前日志 */
      interceptors.onBeforeSignalingRequest = (ctx, req) => {
        emit('debug', `[信令] 请求 ${req.url}`, ctx.phase);
      };

      /** 信令响应后日志 */
      interceptors.onAfterSignalingResponse = (ctx, res) => {
        emit('debug', `[信令] 响应 ${res.url} (${Math.round(res.latencyMs ?? 0)}ms)`, ctx.phase);
      };

      /** 信令错误日志 */
      interceptors.onSignalingError = (ctx, data) => {
        emit('error', `[信令] ${data.error.message}`, ctx.phase);
      };

      /** 停止前日志 */
      interceptors.onBeforeStop = (ctx) => {
        emit('info', `[操作] 停止推流`, ctx.phase);
      };

      /** 销毁前日志 */
      interceptors.onPreDestroy = (ctx) => {
        emit('info', `[操作] 销毁推流器`, ctx.phase);
      };

      Object.assign(plugin, interceptors);
    },

    /**
     * logger 不持有外部资源。
     */
    uninstall() {
      // noop
    },
  };

  return plugin;
}
