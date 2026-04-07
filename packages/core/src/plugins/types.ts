import type {
  RtcPlayerOptions as RtcPlayerOptionsFromRtc,
  MediaSource as RtcMediaSource,
} from '../rtc/types';

/**
 * 连接状态变化时传递的数据
 */
export interface ConnectionStateData {
  state: RTCPeerConnectionState;
  previousState?: RTCPeerConnectionState;
}

/**
 * ICE 候选数据
 */
export interface IceCandidateData {
  candidate: RTCIceCandidate;
  /** 是否来自远程（推流端始终为 false，拉流端在收到 answer 后触发时为 true） */
  isRemote?: boolean;
}

/**
 * ICE 候选处理结果
 * 用于 onBeforeICESetCandidate 钩子的返回值
 */
export interface ProcessedIceCandidate {
  /** 处理后的 ICE 候选 */
  candidate: RTCIceCandidateInit;
  /** 是否应该跳过添加（默认 false） */
  skip?: boolean;
}

/**
 * 错误数据
 */
export interface ErrorData {
  error: Error | string;
  /** 错误发生时的上下文 */
  context?: string;
}

/**
 * 插件宿主页可访问的所有阶段标识
 * 用于 HookContext.phase，使插件能够感知当前调用的上下文
 */
export const PluginPhase = {
  // === 公共阶段 ===
  ERROR: 'error',
  PEER_CONNECTION_CREATED: 'peerConnectionCreated',

  // === 拉流端阶段 ===
  PLAYER_BEFORE_CONNECT: 'player:beforeConnect',
  PLAYER_CONNECTING: 'player:connecting',
  PLAYER_BEFORE_SET_LOCAL_DESCRIPTION: 'player:beforeSetLocalDescription',
  PLAYER_BEFORE_SET_REMOTE_DESCRIPTION: 'player:beforeSetRemoteDescription',
  PLAYER_REMOTE_DESCRIPTION_SET: 'player:remoteDescriptionSet',
  PLAYER_TRACK: 'player:track',
  PLAYER_BEFORE_VIDEO_PLAY: 'player:beforeVideoPlay',
  PLAYER_VIDEO_PLAYING: 'player:videoPlaying',
  PLAYER_FRAME: 'player:frame',
  PLAYER_BEFORE_SWITCH_STREAM: 'player:beforeSwitchStream',
  PLAYER_AFTER_SWITCH_STREAM: 'player:afterSwitchStream',
  PLAYER_DESTROY: 'player:destroy',

  // === 推流端阶段 ===
  PUBLISHER_STARTING: 'publisher:starting',
  PUBLISHER_BEFORE_GET_USER_MEDIA: 'publisher:beforeGetUserMedia',
  PUBLISHER_MEDIA_STREAM: 'publisher:mediaStream',
  PUBLISHER_BEFORE_ATTACH_STREAM: 'publisher:beforeAttachStream',
  PUBLISHER_BEFORE_ATTACH_TRACK: 'publisher:beforeAttachTrack',
  PUBLISHER_TRACK_ATTACHED: 'publisher:trackAttached',
  PUBLISHER_BEFORE_SET_LOCAL_DESCRIPTION: 'publisher:beforeSetLocalDescription',
  PUBLISHER_BEFORE_SET_REMOTE_DESCRIPTION: 'publisher:beforeSetRemoteDescription',
  PUBLISHER_REMOTE_DESCRIPTION_SET: 'publisher:remoteDescriptionSet',
  PUBLISHER_STREAM_START: 'publisher:streamStart',
  PUBLISHER_STREAMING_STATE_CHANGE: 'publisher:streamingStateChange',
  PUBLISHER_STREAM_STOP: 'publisher:streamStop',
  PUBLISHER_BEFORE_SOURCE_CHANGE: 'publisher:beforeSourceChange',
  PUBLISHER_AFTER_SOURCE_CHANGE: 'publisher:afterSourceChange',
  PUBLISHER_BEFORE_REPLACE_TRACK: 'publisher:beforeReplaceTrack',
  PUBLISHER_AFTER_REPLACE_TRACK: 'publisher:afterReplaceTrack',
  PUBLISHER_DESTROY: 'publisher:destroy',
} as const;

export type PluginPhaseValue = (typeof PluginPhase)[keyof typeof PluginPhase];

/**
 * 插件上下文
 * 随每个钩子调用一起传递，让插件能够了解当前调用的来源和阶段
 */
export interface HookContext<S = unknown> {
  /** 当前调用的宿主实例（RtcPlayer 或 RtcPublisher） */
  instance: S;
  /** 调用的阶段标识 */
  phase: PluginPhaseValue;
}

// ============================================================
// 插件基础属性
// ============================================================

/**
 * 插件基础属性
 *
 * @typeParam I - 宿主实例类型，默认为 unknown。
 *                 插件在 install 中通过此参数访问宿主实例的方法和属性。
 */
export interface RtcBasePlugin<I = unknown> {
  name: string;
  /**
   * 插件优先级，数值越大越先执行，默认 0。
   * 同一优先级的插件按注册顺序执行。
   */
  priority?: number;
  /**
   * 安装生命周期
   * 在插件注册时立即调用，插件可在此访问宿主实例。
   *
   * @param instance 宿主实例（RtcPublisher 或 RtcPlayer）
   */
  install?(instance: I): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

// ============================================================
// 插件公共钩子（所有插件共享）
// ============================================================

/**
 * 插件公共钩子（所有插件共享）
 *
 * 所有钩子的第一个参数均为 HookContext，插件可通过 context.instance
 * 访问宿主实例（如 RtcPublisher/RtcPlayer），通过 context.phase
 * 了解当前调用所在的阶段。
 */
export interface RtcPluginCommonHooks<S = unknown> {
  /** RTCPeerConnection 创建完成后触发（早于任何 transceiver 添加） */
  onPeerConnectionCreated?(ctx: HookContext<S>, pc: RTCPeerConnection): void;
  /** ICE 候选收集完成时触发（isRemote 在推流端始终为 false） */
  onIceCandidate?(ctx: HookContext<S>, data: IceCandidateData): void;
  /** 在 ICE 候选被添加之前触发，允许插件修改或跳过候选 */
  onBeforeICESetCandidate?(
    ctx: HookContext<S>,
    candidate: RTCIceCandidateInit
  ): ProcessedIceCandidate | void;
  /** RTCPeerConnection 连接状态变化时触发 */
  onConnectionStateChange?(ctx: HookContext<S>, data: ConnectionStateData): void;
  /** ICE 连接状态变化时触发 */
  onIceConnectionStateChange?(ctx: HookContext<S>, state: RTCIceConnectionState): void;
  /** ICE 候选收集状态变化时触发 */
  onIceGatheringStateChange?(ctx: HookContext<S>, state: RTCIceGatheringState): void;
  /** 错误发生时触发。返回 true 表示插件已处理错误，阻止默认错误 emit */
  onError?(ctx: HookContext<S>, data: ErrorData): boolean | void;
  /** 销毁前触发，插件可在此清理 RAF、定时器等资源 */
  onPreDestroy?(ctx: HookContext<S>): void;
  /** 销毁后触发，所有插件的 onPreDestroy 已执行完毕，pc 已 close */
  onPostDestroy?(ctx: HookContext<S>): void;
  /** 重连尝试时触发 */
  onReconnecting?(
    ctx: HookContext<S>,
    data: { retryCount: number; maxRetries: number; interval: number }
  ): void;
  /** 重连失败（已达最大次数）时触发 */
  onReconnectFailed?(ctx: HookContext<S>, data: { maxRetries: number }): void;
  /** 重连成功后触发 */
  onReconnected?(ctx: HookContext<S>): void;
}

// ============================================================
// 拉流插件接口
// ============================================================

/**
 * 拉流插件钩子（除公共钩子外的独有钩子）
 */
export interface RtcPlayerPluginHooks {
  /**
   * 在发起连接之前触发，可修改连接选项。
   * 返回修改后的选项，或 void 表示使用原始选项。
   */
  onBeforeConnect?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    options: RtcPlayerOptionsFromRtc
  ): RtcPlayerOptionsFromRtc | void;
  /** 在 setLocalDescription 之前触发，可修改 offer SDP */
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** 在 setRemoteDescription 之前触发，可修改 answer SDP */
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 完成后触发 */
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  /**
   * 收到远端轨道时触发（早于 target.srcObject 赋值）。
   * 插件可在此对轨道进行预处理。
   */
  onTrack?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  /**
   * 在 target.srcObject 赋值之前触发。
   * 插件可在此替换要播放的 MediaStream。
   * 返回修改后的 MediaStream，或 void 表示使用原始 stream。
   */
  onBeforeVideoPlay?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    stream: MediaStream
  ): MediaStream | void;
  /** 视频开始播放（onloadedmetadata 触发后）时触发 */
  onPlaying?(ctx: HookContext<RtcPlayerPluginInstance>, stream: MediaStream): void;
  /**
   * 切换流之前触发，可修改目标 URL。
   * 返回修改后的 URL，或 void 表示使用原始 URL。
   */
  onBeforeSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): string | void;
  /** 切换流完成后触发 */
  onAfterSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): void;
}

/**
 * 拉流插件完整接口
 */
export interface RtcPlayerPlugin
  extends
    RtcBasePlugin<RtcPlayerPluginInstance>,
    RtcPluginCommonHooks<RtcPlayerPluginInstance>,
    RtcPlayerPluginHooks {}

/**
 * 拉流插件可访问的宿主实例接口
 */
export interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  /** 当前拉流的 URL */
  getStreamUrl(): string;
  /** 获取已绑定的目标元素 */
  getTargetElement(): HTMLVideoElement | HTMLAudioElement | undefined;
  /** 获取当前远端 MediaStream（播放后可用） */
  getCurrentStream(): MediaStream | null;
  /** 获取 RTCPeerConnection 实例，用于调用 getStats() 等高级 API */
  getPeerConnection(): RTCPeerConnection | null;
}

// ============================================================
// 推流插件接口
// ============================================================

/**
 * 推流插件钩子（除公共钩子外的独有钩子）
 */
export interface RtcPublisherPluginHooks {
  /**
   * 在 getUserMedia 之前触发，可修改媒体约束条件。
   * 返回修改后的约束，或 void 表示使用原始约束。
   */
  onBeforeGetUserMedia?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    constraints: MediaStreamConstraints
  ): MediaStreamConstraints | void;
  /** MediaStream 获取成功后触发，早于任何 track 处理。适合在此获取视频宽高初始化 canvas */
  onMediaStream?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream): void;
  /**
   * 在 track 附加到 RTCPeerConnection 之前触发。
   * 接收完整的 MediaStream，插件可在此一次性处理所有 track（如混流、添加水印等）。
   *
   * 返回处理后的 MediaStream，或 void 表示使用原始 stream。
   * 如果同时注册了 onBeforeAttachTrack，两者都会被调用：先执行 onBeforeAttachStream，
   * 其返回值作为 onBeforeAttachTrack 的输入。
   */
  onBeforeAttachStream?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    stream: MediaStream
  ): MediaStream | void | Promise<MediaStream | void>;
  /**
   * 在单个 track 附加到 RTCPeerConnection 之前触发。
   * 支持同步和异步两种返回值。
   *
   * 注意：video track 和 audio track 会各自独立调用此钩子。
   * 推荐优先使用 onBeforeAttachStream（接收整个 stream）以避免重复处理。
   *
   * @param ctx   插件上下文
   * @param track 待附加的 MediaStreamTrack
   * @param stream track 所属的 MediaStream
   * @returns 处理后的 track，或 void 表示使用原 track
   */
  onBeforeAttachTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream
  ): MediaStreamTrack | void | Promise<MediaStreamTrack | void>;
  /**
   * track 成功附加到 RTCPeerConnection 后触发。
   * 适合在推流开始后对已连接的轨道进行监控或后处理。
   */
  onTrackAttached?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream
  ): void;
  /** 在 setLocalDescription 之前触发，可修改 offer SDP */
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** 在 setRemoteDescription 之前触发，可修改 answer SDP */
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  /** setRemoteDescription 完成后触发 */
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  /**
   * 在 track 替换之前触发。
   * 适合在切换摄像头/屏幕前做清理。
   */
  onBeforeReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    oldTrack: MediaStreamTrack | null,
    newTrack: MediaStreamTrack | null
  ): void;
  /** track 替换完成后触发 */
  onAfterReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack | null
  ): void;
  /** 收到远端轨道时触发（适用于回声/对讲场景） */
  onTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  /** 推流状态变化时触发 */
  onStreamingStateChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    state: 'idle' | 'connecting' | 'streaming'
  ): void;
  /** 推流开始时触发（onStreamingStateChange('streaming') 之后） */
  onPublishing?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream): void;
  /** 推流停止时触发（onStreamingStateChange('idle') 之前） */
  onUnpublishing?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream | null): void;
  /**
   * 在切换输入源之前触发，可修改目标源。
   * 返回修改后的 MediaSource，或 void 表示使用原始 source。
   */
  onBeforeSourceChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    source: RtcMediaSource
  ): RtcMediaSource | void;
  /** 切换输入源完成后触发 */
  onAfterSourceChange?(ctx: HookContext<RtcPublisherPluginInstance>, source: RtcMediaSource): void;
}

/**
 * 推流插件完整接口
 */
export interface RtcPublisherPlugin
  extends
    RtcBasePlugin<RtcPublisherPluginInstance>,
    RtcPluginCommonHooks<RtcPublisherPluginInstance>,
    RtcPublisherPluginHooks {}

/**
 * 推流插件可访问的宿主实例接口
 */
export interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  /** 获取本地 MediaStream */
  getStream(): MediaStream | null;
  /** 获取 RTCPeerConnection 实例，用于调用 getStats() 等高级 API */
  getPeerConnection(): RTCPeerConnection | null;
}

// ============================================================
// 联合类型
// ============================================================

/** 联合类型，用于泛型约束 */
export type AnyPlugin = RtcPlayerPlugin | RtcPublisherPlugin;

// ============================================================
// 钩子名称定义（用于类型安全的 hook 方法）
// ============================================================

/**
 * 通知类钩子 — 通过 callHook 调用，不等待返回值
 */
export type RtcPlayerNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onTrack'
  | 'onPlaying'
  | 'onAfterSwitchStream'
  | 'onTrackAttached'
  | 'onPreDestroy'
  | 'onPostDestroy'
  | 'onReconnecting'
  | 'onReconnectFailed'
  | 'onReconnected';

export type RtcPublisherNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onMediaStream'
  | 'onStreamingStateChange'
  | 'onPublishing'
  | 'onUnpublishing'
  | 'onBeforeReplaceTrack'
  | 'onAfterReplaceTrack'
  | 'onAfterSourceChange'
  | 'onTrack'
  | 'onTrackAttached'
  | 'onPreDestroy'
  | 'onPostDestroy'
  | 'onReconnecting'
  | 'onReconnectFailed'
  | 'onReconnected';

/**
 * 同步管道钩子 — 通过 pipeHook 调用，可修改初始值
 */
export type RtcPlayerPipeHook =
  | 'onBeforeConnect'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeICESetCandidate'
  | 'onBeforeSwitchStream'
  | 'onBeforeVideoPlay'
  | 'onError';

export type RtcPublisherPipeHook =
  | 'onBeforeGetUserMedia'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeICESetCandidate'
  | 'onBeforeSourceChange'
  | 'onError';

export type RtcPublisherAsyncPipeHook = 'onBeforeAttachStream' | 'onBeforeAttachTrack';

/** 拉流插件所有同步通知钩子 */
export type RtcPlayerNotifyHookName = RtcPlayerNotifyHook;
/** 拉流插件所有同步管道钩子 */
export type RtcPlayerPipeHookName = RtcPlayerPipeHook;
/** 拉流插件所有钩子名称 */
export type RtcPlayerHookName = RtcPlayerNotifyHookName | RtcPlayerPipeHookName;

/** 推流插件所有同步通知钩子 */
export type RtcPublisherNotifyHookName = RtcPublisherNotifyHook;
/** 推流插件所有同步管道钩子 */
export type RtcPublisherPipeHookName = RtcPublisherPipeHook;
/** 推流插件所有异步管道钩子 */
export type RtcPublisherAsyncPipeHookName = RtcPublisherAsyncPipeHook;
/** 推流插件所有钩子名称 */
export type RtcPublisherHookName =
  | RtcPublisherNotifyHookName
  | RtcPublisherPipeHookName
  | RtcPublisherAsyncPipeHookName;
