/**
 * 信令提供者接口
 * 用户可自定义实现，支持 HTTP / WebSocket / GRPC 等任何信令协议
 */
export interface SignalingProvider {
  /**
   * 推流信令交换
   * @param sdp 本地 SDP offer
   * @param url 推流地址
   * @returns 远端 SDP answer
   */
  publish(sdp: string, url: string): Promise<string>;

  /**
   * 拉流信令交换
   * @param sdp 本地 SDP offer
   * @param url 拉流地址
   * @returns 远端 SDP answer
   */
  play(sdp: string, url: string): Promise<string>;
}

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
 * 公共选项
 */
export interface RtcBaseOptions {
  /** WebRTC 流地址 */
  url: string;
  /** 信令服务器地址 */
  api: string;
  /** 自定义信令提供者（优先于 api） */
  signaling?: SignalingProvider;
  /** RTCConfiguration（可选） */
  config?: RTCConfiguration;
}

/**
 * 媒体类型配置
 * - 'audio': 仅音频
 * - 'video': 仅视频
 * - 'all': 音频和视频（默认）
 */
export type MediaKind = 'audio' | 'video' | 'all';

/**
 * 拉流选项
 */
export interface RtcPlayerOptions extends RtcBaseOptions {
  /** 视频元素（可选，自动绑定远端流） */
  video?: HTMLVideoElement;
  /** 媒体类型配置（默认: 'all'） */
  media?: MediaKind;
}

/**
 * 推流选项
 */
export interface RtcPublisherOptions extends RtcBaseOptions {
  /** 媒体源 */
  source: MediaSource;
  /** 预览视频元素（可选） */
  video?: HTMLVideoElement;
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
