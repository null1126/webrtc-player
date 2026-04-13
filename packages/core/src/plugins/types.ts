import type { MediaKind, MediaRenderTarget, MediaSource as RtcMediaSource } from '../rtc/types';

/**
 * 连接状态变化数据。
 */
export interface ConnectionStateData {
  /** 当前连接状态 */
  state: RTCPeerConnectionState;
  /** 上一个连接状态（若可用） */
  previousState?: RTCPeerConnectionState;
}

/**
 * ICE Candidate 事件数据。
 */
export interface IceCandidateData {
  /** Candidate 实体 */
  candidate: RTCIceCandidate;
  /** 是否远端 candidate（当前实现默认本地为 false） */
  isRemote?: boolean;
}

/**
 * 错误事件数据。
 */
export interface ErrorData {
  /** 错误对象或错误文本 */
  error: Error | string;
  /** 可选上下文标记，用于定位错误来源 */
  context?: string;
}

/**
 * 信令请求对象。
 * 在 onBeforeSignalingRequest 中可被插件改写。
 */
export interface SignalingRequestData {
  /** 角色：拉流端或推流端 */
  role: 'player' | 'publisher';
  /** 信令服务地址 */
  url: string;
  /** 请求 SDP（通常是 offer） */
  sdp: string;
  /** 透传扩展字段 */
  extra?: Record<string, unknown>;
}

/**
 * 信令响应对象。
 * 在 onAfterSignalingResponse 中可被插件改写。
 */
export interface SignalingResponseData {
  /** 角色：拉流端或推流端 */
  role: 'player' | 'publisher';
  /** 信令服务地址 */
  url: string;
  /** 响应 SDP（通常是 answer） */
  answerSdp: string;
  /** 信令请求耗时（毫秒） */
  latencyMs?: number;
  /** 原始响应体（调试/兼容场景） */
  raw?: unknown;
}

/**
 * 插件生命周期阶段常量。
 *
 * 约定：
 * - base:* 表示所有角色共享阶段
 * - player:* 表示拉流专属阶段
 * - publisher:* 表示推流专属阶段
 */
export const PluginPhase = {
  // ===== 基础阶段 =====
  /** 基础错误阶段 */
  ERROR: 'base:error',
  /** PeerConnection 创建完成 */
  PEER_CONNECTION_CREATED: 'base:peerConnectionCreated',
  /** 连接状态变化 */
  BASE_CONNECTION_STATE_CHANGE: 'base:connectionStateChange',
  /** ICE Candidate 产出 */
  BASE_ICE_CANDIDATE: 'base:iceCandidate',
  /** ICE 连接状态变化 */
  BASE_ICE_CONNECTION_STATE_CHANGE: 'base:iceConnectionStateChange',
  /** ICE 收集状态变化 */
  BASE_ICE_GATHERING_STATE_CHANGE: 'base:iceGatheringStateChange',
  /** 开始重连 */
  BASE_RECONNECTING: 'base:reconnecting',
  /** 重连失败 */
  BASE_RECONNECT_FAILED: 'base:reconnectFailed',
  /** 重连成功 */
  BASE_RECONNECTED: 'base:reconnected',

  // ===== 拉流阶段 =====
  /** 拉流前（connect 入参可改写） */
  PLAYER_BEFORE_CONNECT: 'player:beforeConnect',
  /** 拉流连接中 */
  PLAYER_CONNECTING: 'player:connecting',
  /** 设置本地描述前 */
  PLAYER_BEFORE_SET_LOCAL_DESCRIPTION: 'player:beforeSetLocalDescription',
  /** 发起信令请求前 */
  PLAYER_BEFORE_SIGNALING_REQUEST: 'player:beforeSignalingRequest',
  /** 收到信令响应后 */
  PLAYER_AFTER_SIGNALING_RESPONSE: 'player:afterSignalingResponse',
  /** 拉流信令异常 */
  PLAYER_SIGNALING_ERROR: 'player:signalingError',
  /** 设置远端描述前 */
  PLAYER_BEFORE_SET_REMOTE_DESCRIPTION: 'player:beforeSetRemoteDescription',
  /** 远端描述设置完成 */
  PLAYER_REMOTE_DESCRIPTION_SET: 'player:remoteDescriptionSet',
  /** 收到远端轨道 */
  PLAYER_TRACK: 'player:track',
  /** 挂载远端流前 */
  PLAYER_BEFORE_ATTACH_STREAM: 'player:beforeAttachStream',
  /** canvas 帧渲染中（仅 target 为 canvas） */
  PLAYER_CANVAS_FRAME: 'player:canvasFrame',
  /** 媒体已就绪 */
  PLAYER_MEDIA_READY: 'player:mediaReady',
  /** 切流前 */
  PLAYER_BEFORE_SWITCH_STREAM: 'player:beforeSwitchStream',
  /** 切流后 */
  PLAYER_AFTER_SWITCH_STREAM: 'player:afterSwitchStream',
  /** 拉流实例销毁 */
  PLAYER_DESTROY: 'player:destroy',

  // ===== 推流阶段 =====
  /** 推流启动 */
  PUBLISHER_STARTING: 'publisher:starting',
  /** 获取媒体流前（约束可改写） */
  PUBLISHER_BEFORE_GET_USER_MEDIA: 'publisher:beforeGetUserMedia',
  /** 获取到媒体流 */
  PUBLISHER_MEDIA_STREAM: 'publisher:mediaStream',
  /** canvas 帧渲染中（仅 target 为 canvas） */
  PUBLISHER_CANVAS_FRAME: 'publisher:canvasFrame',
  /** 整体流挂载前 */
  PUBLISHER_BEFORE_ATTACH_STREAM: 'publisher:beforeAttachStream',
  /** 单轨挂载前 */
  PUBLISHER_BEFORE_ATTACH_TRACK: 'publisher:beforeAttachTrack',
  /** 单轨挂载后 */
  PUBLISHER_TRACK_ATTACHED: 'publisher:trackAttached',
  /** 设置本地描述前 */
  PUBLISHER_BEFORE_SET_LOCAL_DESCRIPTION: 'publisher:beforeSetLocalDescription',
  /** 发起信令请求前 */
  PUBLISHER_BEFORE_SIGNALING_REQUEST: 'publisher:beforeSignalingRequest',
  /** 收到信令响应后 */
  PUBLISHER_AFTER_SIGNALING_RESPONSE: 'publisher:afterSignalingResponse',
  /** 推流信令异常 */
  PUBLISHER_SIGNALING_ERROR: 'publisher:signalingError',
  /** 设置远端描述前 */
  PUBLISHER_BEFORE_SET_REMOTE_DESCRIPTION: 'publisher:beforeSetRemoteDescription',
  /** 远端描述设置完成 */
  PUBLISHER_REMOTE_DESCRIPTION_SET: 'publisher:remoteDescriptionSet',
  /** 推流状态变化 */
  PUBLISHER_STREAMING_STATE_CHANGE: 'publisher:streamingStateChange',
  /** 停止推流前 */
  PUBLISHER_BEFORE_STOP: 'publisher:beforeStop',
  /** 停止推流后 */
  PUBLISHER_AFTER_STOP: 'publisher:afterStop',
  /** 切换媒体源前 */
  PUBLISHER_BEFORE_SOURCE_CHANGE: 'publisher:beforeSourceChange',
  /** 切换媒体源后 */
  PUBLISHER_AFTER_SOURCE_CHANGE: 'publisher:afterSourceChange',
  /** replaceTrack 前 */
  PUBLISHER_BEFORE_REPLACE_TRACK: 'publisher:beforeReplaceTrack',
  /** replaceTrack 后 */
  PUBLISHER_AFTER_REPLACE_TRACK: 'publisher:afterReplaceTrack',
  /** 轨道结束 */
  PUBLISHER_TRACK_ENDED: 'publisher:trackEnded',
  /** 轨道静音状态变化 */
  PUBLISHER_TRACK_MUTE_CHANGED: 'publisher:trackMuteChanged',
  /** 推流实例销毁 */
  PUBLISHER_DESTROY: 'publisher:destroy',
} as const;

/** 插件阶段联合类型 */
export type PluginPhaseValue = (typeof PluginPhase)[keyof typeof PluginPhase];

/**
 * Hook 上下文。
 * 每次 Hook 调用都会携带该上下文。
 */
export interface HookContext<S = unknown> {
  /** 当前宿主实例（RtcPlayer 或 RtcPublisher） */
  instance: S;
  /** 当前 Hook 所处生命周期阶段 */
  phase: PluginPhaseValue;
}

/**
 * 插件基础接口。
 */
export interface RtcBasePlugin<I = unknown> {
  /** 插件唯一名称 */
  name: string;
  /** 优先级，值越大越先执行 */
  priority?: number;
  /** 安装生命周期 */
  install?(instance: I): void | Promise<void>;
  /** 卸载生命周期 */
  uninstall?(): void | Promise<void>;
}

/**
 * 所有插件共享 Hook。
 */
export interface RtcPluginCommonHooks<S = unknown> {
  /** PeerConnection 创建后触发 */
  onPeerConnectionCreated?(ctx: HookContext<S>, pc: RTCPeerConnection): void;
  /** 采集到 ICE candidate 时触发 */
  onIceCandidate?(ctx: HookContext<S>, data: IceCandidateData): void;
  /** 连接状态变化时触发 */
  onConnectionStateChange?(ctx: HookContext<S>, data: ConnectionStateData): void;
  /** ICE 连接状态变化时触发 */
  onIceConnectionStateChange?(ctx: HookContext<S>, state: RTCIceConnectionState): void;
  /** ICE 收集状态变化时触发 */
  onIceGatheringStateChange?(ctx: HookContext<S>, state: RTCIceGatheringState): void;
  /** 统一错误通知 */
  onError?(ctx: HookContext<S>, data: ErrorData): void;
  /** destroy 前触发 */
  onPreDestroy?(ctx: HookContext<S>): void;
  /** destroy 后触发 */
  onPostDestroy?(ctx: HookContext<S>): void;
  /** 重连中通知 */
  onReconnecting?(
    ctx: HookContext<S>,
    data: { retryCount: number; maxRetries: number; interval: number }
  ): void;
  /** 重连失败通知 */
  onReconnectFailed?(ctx: HookContext<S>, data: { maxRetries: number }): void;
  /** 重连成功通知 */
  onReconnected?(ctx: HookContext<S>): void;
  /** 信令请求前（可改写请求参数） */
  onBeforeSignalingRequest?(
    ctx: HookContext<S>,
    request: SignalingRequestData
  ): SignalingRequestData | void | Promise<SignalingRequestData | void>;
  /** 信令响应后（可改写响应数据） */
  onAfterSignalingResponse?(
    ctx: HookContext<S>,
    response: SignalingResponseData
  ): SignalingResponseData | void | Promise<SignalingResponseData | void>;
  /** 信令异常通知 */
  onSignalingError?(
    ctx: HookContext<S>,
    data: { error: Error; request?: SignalingRequestData }
  ): void;
}

/**
 * 拉流连接前请求对象。
 */
export interface PlayerConnectRequest {
  /** 拉流地址 */
  url: string;
  /** 拉流媒体类型 */
  media: MediaKind;
}

/**
 * Canvas 帧渲染数据（仅当 target 为 canvas 时可用）。
 */
export interface CanvasFrameData {
  /** 目标 canvas 元素 */
  canvas: HTMLCanvasElement;
  /** 当前 2D 上下文 */
  context2d: CanvasRenderingContext2D;
  /** 内部渲染用 video 元素 */
  video: HTMLVideoElement;
  /** rAF 时间戳 */
  timestamp: number;
  /** canvas backing store 宽 */
  canvasWidth: number;
  /** canvas backing store 高 */
  canvasHeight: number;
  /** video 源宽 */
  videoWidth: number;
  /** video 源高 */
  videoHeight: number;
  /** drawImage 目标起点 x */
  drawX: number;
  /** drawImage 目标起点 y */
  drawY: number;
  /** drawImage 目标宽 */
  drawWidth: number;
  /** drawImage 目标高 */
  drawHeight: number;
}

/**
 * 拉流插件专属 Hook。
 */
export interface RtcPlayerPluginHooks {
  /** connect 前（可改写拉流请求） */
  onBeforeConnect?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    request: PlayerConnectRequest
  ): PlayerConnectRequest | void;
  /** setLocalDescription 前（可改写 offer） */
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 前（可改写 answer） */
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 成功后 */
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  /** 收到远端轨道 */
  onTrack?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  /** 挂载远端流前（可替换流对象） */
  onBeforeAttachStream?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    stream: MediaStream
  ): MediaStream | void;
  /** canvas 每帧渲染通知（仅 target 为 canvas 时触发） */
  onCanvasFrame?(ctx: HookContext<RtcPlayerPluginInstance>, frame: CanvasFrameData): void;
  /** 媒体可播放时触发 */
  onMediaReady?(ctx: HookContext<RtcPlayerPluginInstance>, stream: MediaStream): void;
  /** 切流前（可改写 URL） */
  onBeforeSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): string | void;
  /** 切流后通知 */
  onAfterSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): void;
}

/** 拉流插件完整接口 */
export interface RtcPlayerPlugin
  extends
    RtcBasePlugin<RtcPlayerPluginInstance>,
    RtcPluginCommonHooks<RtcPlayerPluginInstance>,
    RtcPlayerPluginHooks {}

/**
 * 拉流插件可访问的宿主实例能力。
 */
export interface RtcPlayerPluginInstance {
  /** 当前连接状态（只读） */
  readonly connectionState: RTCPeerConnectionState;
  /** 获取当前拉流 URL */
  getStreamUrl(): string;
  /** 获取当前渲染目标元素 */
  getTargetElement(): MediaRenderTarget | undefined;
  /** 获取当前媒体流 */
  getCurrentStream(): MediaStream | null;
  /** 获取 RTCPeerConnection 实例 */
  getPeerConnection(): RTCPeerConnection | null;
}

/**
 * 推流插件专属 Hook。
 */
export interface RtcPublisherPluginHooks {
  /** getUserMedia 前（可改写约束） */
  onBeforeGetUserMedia?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    constraints: MediaStreamConstraints
  ): MediaStreamConstraints | void;
  /** 获取媒体流后 */
  onMediaStream?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream): void;
  /** canvas 每帧渲染通知（仅 target 为 canvas 时触发） */
  onCanvasFrame?(ctx: HookContext<RtcPublisherPluginInstance>, frame: CanvasFrameData): void;
  /** 整体挂载流前（可替换 stream） */
  onBeforeAttachStream?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    stream: MediaStream
  ): MediaStream | void | Promise<MediaStream | void>;
  /** 单轨挂载前（可替换 track） */
  onBeforeAttachTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream
  ): MediaStreamTrack | void | Promise<MediaStreamTrack | void>;
  /** 单轨挂载后通知 */
  onTrackAttached?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream
  ): void;
  /** setLocalDescription 前（可改写 offer） */
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 前（可改写 answer） */
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 成功后 */
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  /** replaceTrack 前（可拦截/替换 newTrack） */
  onBeforeReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    oldTrack: MediaStreamTrack | null,
    newTrack: MediaStreamTrack | null
  ): MediaStreamTrack | null | void | Promise<MediaStreamTrack | null | void>;
  /** replaceTrack 后通知 */
  onAfterReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack | null
  ): void;
  /** 收到远端轨道 */
  onTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  /** 推流状态变化 */
  onStreamingStateChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    state: 'idle' | 'connecting' | 'streaming'
  ): void;
  /** 停止前（可异步执行收尾逻辑） */
  onBeforeStop?(ctx: HookContext<RtcPublisherPluginInstance>): void | Promise<void>;
  /** 停止后通知 */
  onAfterStop?(ctx: HookContext<RtcPublisherPluginInstance>): void;
  /** 切换媒体源前（可改写 source） */
  onBeforeSourceChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    source: RtcMediaSource
  ): RtcMediaSource | void;
  /** 切换媒体源后通知 */
  onAfterSourceChange?(ctx: HookContext<RtcPublisherPluginInstance>, source: RtcMediaSource): void;
  /** 轨道结束通知 */
  onTrackEnded?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    data: { track: MediaStreamTrack; stream?: MediaStream; reason?: string }
  ): void;
  /** 轨道静音状态变化通知 */
  onTrackMuteChanged?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    data: { track: MediaStreamTrack; muted: boolean }
  ): void;
}

/** 推流插件完整接口 */
export interface RtcPublisherPlugin
  extends
    RtcBasePlugin<RtcPublisherPluginInstance>,
    RtcPluginCommonHooks<RtcPublisherPluginInstance>,
    RtcPublisherPluginHooks {}

/**
 * 推流插件可访问的宿主实例能力。
 */
export interface RtcPublisherPluginInstance {
  /** 当前媒体源（只读） */
  readonly source: RtcMediaSource;
  /** 当前连接状态（只读） */
  readonly connectionState: RTCPeerConnectionState;
  /** 获取当前推流媒体流 */
  getStream(): MediaStream | null;
  /** 获取当前渲染目标元素 */
  getTargetElement(): MediaRenderTarget | undefined;
  /** 获取 RTCPeerConnection 实例 */
  getPeerConnection(): RTCPeerConnection | null;
}

/** 任意插件联合类型 */
export type AnyPlugin = RtcPlayerPlugin | RtcPublisherPlugin;

/** 拉流通知 Hook 名称（只通知，不参与参数改写） */
export type RtcPlayerNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onTrack'
  | 'onCanvasFrame'
  | 'onMediaReady'
  | 'onAfterSwitchStream'
  | 'onSignalingError'
  | 'onPreDestroy'
  | 'onPostDestroy'
  | 'onReconnecting'
  | 'onReconnectFailed'
  | 'onReconnected'
  | 'onError';

/** 推流通知 Hook 名称（只通知，不参与参数改写） */
export type RtcPublisherNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onMediaStream'
  | 'onCanvasFrame'
  | 'onStreamingStateChange'
  | 'onAfterReplaceTrack'
  | 'onAfterSourceChange'
  | 'onTrack'
  | 'onTrackAttached'
  | 'onTrackEnded'
  | 'onTrackMuteChanged'
  | 'onBeforeStop'
  | 'onAfterStop'
  | 'onSignalingError'
  | 'onPreDestroy'
  | 'onPostDestroy'
  | 'onReconnecting'
  | 'onReconnectFailed'
  | 'onReconnected'
  | 'onError';

/** 拉流同步管道 Hook 名称（同步串行，可改写参数） */
export type RtcPlayerPipeHook =
  | 'onBeforeConnect'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeSwitchStream'
  | 'onBeforeAttachStream';

/** 推流同步管道 Hook 名称（同步串行，可改写参数） */
export type RtcPublisherPipeHook =
  | 'onBeforeGetUserMedia'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeSourceChange';

/** 异步管道 Hook 名称（支持 Promise） */
export type RtcAsyncPipeHook =
  | 'onBeforeAttachStream'
  | 'onBeforeAttachTrack'
  | 'onBeforeReplaceTrack'
  | 'onBeforeSignalingRequest'
  | 'onAfterSignalingResponse'
  | 'onBeforeStop';

/** 拉流通知 Hook 别名类型 */
export type RtcPlayerNotifyHookName = RtcPlayerNotifyHook;
/** 拉流同步管道 Hook 别名类型 */
export type RtcPlayerPipeHookName = RtcPlayerPipeHook;
/** 拉流可用 Hook 名称全集 */
export type RtcPlayerHookName = RtcPlayerNotifyHookName | RtcPlayerPipeHookName;

/** 推流通知 Hook 别名类型 */
export type RtcPublisherNotifyHookName = RtcPublisherNotifyHook;
/** 推流同步管道 Hook 别名类型 */
export type RtcPublisherPipeHookName = RtcPublisherPipeHook;
/** 异步管道 Hook 别名类型 */
export type RtcAsyncPipeHookName = RtcAsyncPipeHook;
/** 推流可用 Hook 名称全集 */
export type RtcPublisherHookName =
  | RtcPublisherNotifyHookName
  | RtcPublisherPipeHookName
  | RtcAsyncPipeHookName;
