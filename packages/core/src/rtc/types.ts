import type { RtcPlayerPlugin, RtcPublisherPlugin } from '../plugins/types';
import type { PlayerSignalingProvider, PublisherSignalingProvider } from '../signaling/types';

/**
 * 媒体源类型
 */
export type MediaSource =
  | MediaSourceCamera
  | MediaSourceMicrophone
  | MediaSourceScreen
  | MediaSourceCustom;

/**
 * 摄像头媒体源
 * 使用系统摄像头作为视频输入，audio 为 true 时同时获取麦克风音频
 */
export interface MediaSourceCamera {
  type: 'camera';
  deviceId?: string;
  audio?: boolean;
}

/**
 * 麦克风媒体源
 * 使用系统麦克风作为音频输入
 */
export interface MediaSourceMicrophone {
  type: 'microphone';
  deviceId?: string;
}

/**
 * 录屏媒体源
 * 使用浏览器录屏 API（getDisplayMedia）捕获屏幕内容
 */
export interface MediaSourceScreen {
  type: 'screen';
  audio?: boolean;
}

/**
 * 自定义媒体源
 * 由调用方自行传入 MediaStream，适用于已有媒体流的场景
 */
export interface MediaSourceCustom {
  type: 'custom';
  stream: MediaStream;
}

/**
 * 重连配置
 */
export interface ReconnectOptions {
  /** 是否开启自动重连（默认: false） */
  enabled?: boolean;
  /** 最大重试次数（默认: 5） */
  maxRetries?: number;
  /** 重试间隔（毫秒），启用指数退避时此值为初始间隔（默认: 2000） */
  interval?: number;
  /** 是否启用指数退避（默认: false） */
  exponential?: boolean;
  /** 重试最大间隔（毫秒） */
  maxInterval?: number;
  /** 随机抖动比例（0~1） */
  jitterRatio?: number;
  /** 进入 disconnected 后的兜底重连延迟（毫秒，默认 5000） */
  disconnectedTimeout?: number;
}

/**
 * ICE 行为配置
 */
export interface IceOptions {
  /**
   * 是否等待 ICE 收集完成后再交换 SDP（默认: true）
   * - true: 非 Trickle ICE 模式，先收集再交换
   * - false: 立即交换 SDP，依赖后续候选补充
   */
  waitForComplete?: boolean;
  /**
   * 等待 ICE 收集完成的超时时间（毫秒，默认: 3000）
   */
  gatheringTimeout?: number;
}

/**
 * 公共选项
 */
export interface RtcBaseOptions {
  /** WebRTC 流地址 */
  url: string;
  /** 信令服务器地址 */
  api: string;
  /** RTCConfiguration */
  config?: RTCConfiguration;
  /** 重连配置 */
  reconnect?: ReconnectOptions;
  /** ICE 配置 */
  ice?: IceOptions;
}

/**
 * 媒体类型配置
 * - 'audio': 仅音频
 * - 'video': 仅视频
 * - 'all': 音频和视频（默认）
 */
export type MediaKind = 'audio' | 'video' | 'all';

/** 渲染目标元素 */
export type MediaRenderTarget = HTMLVideoElement | HTMLAudioElement | HTMLCanvasElement;

/**
 * 拉流选项
 */
export interface RtcPlayerOptions extends RtcBaseOptions {
  /** 自定义拉流信令提供者（优先于 api） */
  signaling?: PlayerSignalingProvider;
  /** 目标渲染元素（自动绑定远端流）；支持 video/audio/canvas */
  target?: MediaRenderTarget;
  /** 目标是否静音（默认: true） */
  muted?: boolean;
  /** 媒体类型配置（默认: 'all'） */
  media?: MediaKind;
  /** 插件列表 */
  plugins?: RtcPlayerPlugin[];
}

/**
 * 推流选项
 */
export interface RtcPublisherOptions extends RtcBaseOptions {
  /** 自定义推流信令提供者（优先于 api） */
  signaling?: PublisherSignalingProvider;
  /** 媒体源 */
  source: MediaSource;
  /** 预览目标元素；支持 video/audio/canvas */
  target?: MediaRenderTarget;
  /** 目标是否静音（默认: true） */
  muted?: boolean;
  /** 插件列表 */
  plugins?: RtcPublisherPlugin[];
}

/**
 * 连接状态枚举
 */
export enum RtcState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
  SWITCHING = 'switching',
  SWITCHED = 'switched',
  DESTROYED = 'destroyed',
}

/**
 * 公共事件（所有 RTC 实例共享）
 */
export interface RtcBaseEvents {
  state: RtcState;
  error: string;
  icecandidate: RTCIceCandidate;
  iceconnectionstate: RTCIceConnectionState;
  icegatheringstate: RTCIceGatheringState;
  /** 重连状态变化 */
  reconnecting: { retryCount: number; maxRetries: number; interval: number };
  /** 重连失败（已达最大次数） */
  reconnectfailed: { maxRetries: number };
}

/**
 * 拉流事件
 */
export interface RtcPlayerEvents extends RtcBaseEvents {
  /** 收到远端流 */
  track: { stream: MediaStream; event: RTCTrackEvent };
}

/**
 * 推流事件
 */
export interface RtcPublisherEvents extends RtcBaseEvents {
  /** 开始推流 */
  streamstart: { stream: MediaStream };
  /** 停止推流 */
  streamstop: void;
  /** 输入源切换成功 */
  sourcechange: MediaSource;
  /** 推流端收到远端流（回显/对讲） */
  track: { stream: MediaStream; event: RTCTrackEvent };
  /** 用户拒绝媒体授权 */
  permissiondenied: { source: MediaSource; error: Error };
}
