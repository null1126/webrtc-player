import type { RtcPlayerPlugin, PluginPhaseValue } from '@webrtc-engine/core/plugins/types';
import type { LogCallback, LogLevel, LoggerPluginOptions } from './types';
import { formatTime, nextId } from './utils';

/**
 * 创建拉流日志插件。
 *
 * 设计说明：
 * - 该插件仅做“被动观测”，不改写业务行为。
 * - 通过 Hook 记录关键状态、信令、轨道与错误信息。
 * - 适合线上问题排查与研发联调。
 *
 * @param options 插件配置（如是否输出 debug 日志）
 * @param callback 日志回调
 */
export function createPlayerLoggerPlugin(
  options: LoggerPluginOptions = {},
  callback: LogCallback
): RtcPlayerPlugin {
  const { includeDebug = false } = options;

  /**
   * 拦截器对象。
   * 采用先定义再一次性挂载的方式，便于 install 生命周期内组织逻辑。
   */
  const interceptors: Partial<RtcPlayerPlugin> = {};

  const plugin: RtcPlayerPlugin = {
    /** 插件唯一标识 */
    name: 'logger',

    /**
     * 插件安装时注册全部 Hook。
     */
    install() {
      /**
       * 统一日志输出函数。
       *
       * @param level 日志级别
       * @param message 日志内容
       * @param phase 当前 Hook 所在阶段
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

      /** 连接状态变化日志 */
      interceptors.onConnectionStateChange = (ctx, data) => {
        emit('info', `[状态] ${data.state}`, ctx.phase);
      };

      /** ICE 连接状态变化日志 */
      interceptors.onIceConnectionStateChange = (ctx, state) => {
        emit('info', `[ICE] ${state}`, ctx.phase);
      };

      /** ICE gathering 状态日志（调试级） */
      interceptors.onIceGatheringStateChange = (ctx, state) => {
        emit('debug', `[ICE Gathering] ${state}`, ctx.phase);
      };

      /** candidate 日志（截断输出避免过长） */
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

      /** 收到远端轨道日志 */
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

      /** 媒体可播放日志 */
      interceptors.onMediaReady = (ctx) => {
        emit('info', `[事件] mediaReady — 媒体播放中`, ctx.phase);
      };

      /** 切流前日志 */
      interceptors.onBeforeSwitchStream = (ctx, url) => {
        emit('info', `[操作] 切换至 ${url}`, ctx.phase);
      };

      /** 切流后日志 */
      interceptors.onAfterSwitchStream = (ctx, url) => {
        emit('info', `[事件] 切换完成 ${url}`, ctx.phase);
      };

      /** 信令请求前日志 */
      interceptors.onBeforeSignalingRequest = (ctx, req) => {
        emit('debug', `[信令] 请求 ${req.url}`, ctx.phase);
      };

      /** 信令响应后日志 */
      interceptors.onAfterSignalingResponse = (ctx, res) => {
        emit('debug', `[信令] 响应 ${res.url} (${Math.round(res.latencyMs ?? 0)}ms)`, ctx.phase);
      };

      /** 信令失败日志 */
      interceptors.onSignalingError = (ctx, data) => {
        emit('error', `[信令] ${data.error.message}`, ctx.phase);
      };

      /** 销毁前日志 */
      interceptors.onPreDestroy = (ctx) => {
        emit('info', `[操作] 停止拉流`, ctx.phase);
      };

      Object.assign(plugin, interceptors);
    },

    /**
     * logger 插件无额外资源，无需卸载清理。
     */
    uninstall() {
      // noop
    },
  };

  return plugin;
}
