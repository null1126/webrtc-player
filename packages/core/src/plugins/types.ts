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
  /** 是否来自远程 */
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
 * 插件上下文
 * 随每个钩子调用一起传递，让插件能够了解当前调用的来源和阶段
 */
export interface HookContext<S = unknown> {
  /** 当前调用的宿主实例（RtcPlayer 或 RtcPublisher） */
  instance: S;
  /** 调用的阶段标识（如 'attachStream'、'createSession'、'switchStream'） */
  phase: string;
}

/**
 * 插件基础属性
 *
 * @typeParam I - 宿主实例类型，默认为 unknown。
 *                 插件在 install 中通过此参数访问宿主实例的方法和属性。
 */
export interface RtcBasePlugin<I = unknown> {
  name: string;
  version?: string;
  /**
   * 安装生命周期
   * 在插件注册时立即调用，插件可在此访问宿主实例。
   *
   * @param instance 宿主实例（RtcPlayer 或 RtcPublisher）
   */
  install?(instance: I): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

/**
 * 插件公共钩子（所有插件共享）
 *
 * 所有钩子的第一个参数均为 HookContext，插件可通过 context.instance
 * 访问宿主实例（如 RtcPublisher/RtcPlayer），通过 context.phase
 * 了解当前调用所在的阶段。
 */
export interface RtcPluginCommonHooks<S = unknown> {
  onPeerConnectionCreated?(ctx: HookContext<S>, pc: RTCPeerConnection): void;
  onIceCandidate?(ctx: HookContext<S>, data: IceCandidateData): void;
  onBeforeICESetCandidate?(
    ctx: HookContext<S>,
    candidate: RTCIceCandidateInit
  ): ProcessedIceCandidate | void;
  onConnectionStateChange?(ctx: HookContext<S>, data: ConnectionStateData): void;
  onIceConnectionStateChange?(ctx: HookContext<S>, state: RTCIceConnectionState): void;
  onError?(ctx: HookContext<S>, data: ErrorData): boolean | void;
}

/**
 * 拉流插件接口
 */
export interface RtcPlayerPlugin
  extends RtcBasePlugin<RtcPlayerPluginInstance>, RtcPluginCommonHooks<RtcPlayerPluginInstance> {
  onBeforeConnect?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    options: RtcPlayerOptionsFromRtc
  ): RtcPlayerOptionsFromRtc | void;
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  onTrack?(
    ctx: HookContext<RtcPlayerPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  onPlaying?(ctx: HookContext<RtcPlayerPluginInstance>, stream: MediaStream): void;
  onBeforeSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): string | void;
  onAfterSwitchStream?(ctx: HookContext<RtcPlayerPluginInstance>, url: string): void;
}

/**
 * 拉流插件可访问的宿主实例接口
 * 插件通过 HookContext.instance 或 install(instance) 获取此类型
 */
export interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
}

/**
 * 推流插件接口
 */
export interface RtcPublisherPlugin
  extends
    RtcBasePlugin<RtcPublisherPluginInstance>,
    RtcPluginCommonHooks<RtcPublisherPluginInstance> {
  onBeforeGetUserMedia?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    constraints: MediaStreamConstraints
  ): MediaStreamConstraints | void;
  onBeforeSetLocalDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    offer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  onBeforeSetRemoteDescription?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;
  onRemoteDescriptionSet?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    answer: RTCSessionDescriptionInit
  ): void;
  /**
   * 当本地 MediaStream 获取成功时触发，早于 onBeforeAttachTrack。
   * 插件可在此获取视频宽高等元信息来初始化 canvas 等资源。
   */
  onMediaStream?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream): void;
  /**
   * 在 track 附加到 RTCPeerConnection 之前触发。
   * 支持同步和异步两种返回值。
   * 返回处理后的 track；如果返回 void 则使用原始 track。
   *
   * @param ctx   插件上下文，ctx.instance 可访问宿主实例
   * @param track 待附加的 MediaStreamTrack
   * @param stream track 所属的 MediaStream（可据此获取视频宽高）
   * @returns 处理后的 track，或 void 表示使用原 track
   */
  onBeforeAttachTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream
  ): MediaStreamTrack | void | Promise<MediaStreamTrack | void>;
  onBeforeReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    oldTrack: MediaStreamTrack | null,
    newTrack: MediaStreamTrack | null
  ): void;
  onAfterReplaceTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack | null
  ): void;
  onTrack?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    track: MediaStreamTrack,
    stream: MediaStream,
    event: RTCTrackEvent
  ): void;
  onStreamingStateChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    state: 'idle' | 'connecting' | 'streaming'
  ): void;
  onPublishing?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream): void;
  onUnpublishing?(ctx: HookContext<RtcPublisherPluginInstance>, stream: MediaStream | null): void;
  onBeforeSourceChange?(
    ctx: HookContext<RtcPublisherPluginInstance>,
    source: RtcMediaSource
  ): RtcMediaSource | void;
  onAfterSourceChange?(ctx: HookContext<RtcPublisherPluginInstance>, source: RtcMediaSource): void;
}

/**
 * 推流插件可访问的宿主实例接口
 */
export interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
}

/** 联合类型，用于泛型约束 */
export type AnyPlugin = RtcPlayerPlugin | RtcPublisherPlugin;

// ============================================================
// 钩子名称定义（用于类型安全的 hook 方法）
// ============================================================

/** 拉流插件公共钩子 */
export type RtcPlayerCommonHookName =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onBeforeICESetCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onError';

/** 拉流插件特有钩子 */
export type RtcPlayerOwnHookName =
  | 'onBeforeConnect'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onRemoteDescriptionSet'
  | 'onTrack'
  | 'onPlaying'
  | 'onBeforeSwitchStream'
  | 'onAfterSwitchStream';

/** 拉流插件所有钩子名称 */
export type RtcPlayerHookName = RtcPlayerCommonHookName | RtcPlayerOwnHookName;

/** 推流插件公共钩子 */
export type RtcPublisherCommonHookName =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onBeforeICESetCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onError';

/** 推流插件特有钩子 */
export type RtcPublisherOwnHookName =
  | 'onBeforeGetUserMedia'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onRemoteDescriptionSet'
  | 'onMediaStream'
  | 'onBeforeAttachTrack'
  | 'onBeforeReplaceTrack'
  | 'onAfterReplaceTrack'
  | 'onTrack'
  | 'onStreamingStateChange'
  | 'onPublishing'
  | 'onUnpublishing'
  | 'onBeforeSourceChange'
  | 'onAfterSourceChange';

/** 推流插件所有钩子名称 */
export type RtcPublisherHookName = RtcPublisherCommonHookName | RtcPublisherOwnHookName;
