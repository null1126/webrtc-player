---
title: WebRTC Player - 插件 API
description: WebRTC Player 插件系统 API 参考文档，包含插件接口、Hook 类型、PluginPhase 等完整类型定义。
---

# 插件 API

本文档是插件系统核心类型和接口的完整参考。

## 类型导入

所有插件相关类型均从 `@webrtc-player/core` 导出：

```typescript
import type {
  RtcPlayerPlugin,
  RtcPublisherPlugin,
  RtcPlayerPluginInstance,
  RtcPublisherPluginInstance,
  RtcPluginCommonHooks,
  RtcPlayerPluginHooks,
  RtcPublisherPluginHooks,
  PluginPhase,
} from '@webrtc-player/core';
```

## 接口

### `RtcBasePlugin<I>`

所有插件的基接口。

```typescript
interface RtcBasePlugin<I = unknown> {
  /** 插件唯一名称 */
  name: string;

  /** 优先级，数值越大越先执行，默认 0 */
  priority?: number;

  /** 安装阶段回调，插件在此初始化资源 */
  install?(instance: I): void | Promise<void>;

  /** 卸载阶段回调，插件在此清理资源 */
  uninstall?(): void | Promise<void>;
}
```

### `RtcPlayerPlugin`

播放器插件接口，继承 `RtcBasePlugin<RtcPlayerPluginInstance>`、`RtcPluginCommonHooks<RtcPlayerPluginInstance>` 和 `RtcPlayerPluginHooks`。

```typescript
interface RtcPlayerPlugin
  extends
    RtcBasePlugin<RtcPlayerPluginInstance>,
    RtcPluginCommonHooks<RtcPlayerPluginInstance>,
    RtcPlayerPluginHooks {}
```

### `RtcPublisherPlugin`

推流器插件接口，继承 `RtcBasePlugin<RtcPublisherPluginInstance>`、`RtcPluginCommonHooks<RtcPublisherPluginInstance>` 和 `RtcPublisherPluginHooks`。

```typescript
interface RtcPublisherPlugin
  extends
    RtcBasePlugin<RtcPublisherPluginInstance>,
    RtcPluginCommonHooks<RtcPublisherPluginInstance>,
    RtcPublisherPluginHooks {}
```

### `RtcPluginCommonHooks<S>`

播放器与推流器共有的 Hook。

```typescript
interface RtcPluginCommonHooks<S> {
  /** RTCPeerConnection 创建后 */
  onPeerConnectionCreated?(pc: RTCPeerConnection): void;

  /** ICE 候选者已收集 */
  onIceCandidate?(candidate: RTCIceCandidate): void;

  /**
   * ICE 候选者添加前（Pipe Hook）
   * 返回 null 跳过此次候选；返回 RTCIceCandidate 替换候选
   */
  onBeforeICESetCandidate?(candidate: RTCIceCandidate): RTCIceCandidate | null | void;

  /** 连接状态变更 */
  onConnectionStateChange?(state: RTCPeerConnectionState): void;

  /** ICE 连接状态变更 */
  onIceConnectionStateChange?(state: RTCIceConnectionState): void;

  /** ICE 收集状态变更 */
  onIceGatheringStateChange?(state: RTCIceGatheringState): void;

  /**
   * 错误发生时（Pipe Hook）
   * 返回 true 阻止默认错误事件触发
   */
  onError?(error: string): boolean | void;

  /** 销毁前清理 */
  onPreDestroy?(): void | Promise<void>;

  /** 销毁后（RTCPeerConnection 已关闭） */
  onPostDestroy?(): void | Promise<void>;
}
```

### `RtcPlayerPluginHooks`

播放器独有 Hook。

```typescript
interface RtcPlayerPluginHooks {
  /** 连接前（Pipe Hook），可修改连接参数 */
  onBeforeConnect?(options: RtcPlayerOptions): RtcPlayerOptions | void;

  /** setLocalDescription 前（Pipe Hook），可修改 offer SDP */
  onBeforeSetLocalDescription?(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit | void;

  /** setRemoteDescription 前（Pipe Hook），可修改 answer SDP */
  onBeforeSetRemoteDescription?(
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;

  /** setRemoteDescription 后 */
  onRemoteDescriptionSet?(): void;

  /** 收到远端轨道 */
  onTrack?(track: MediaStreamTrack, stream: MediaStream): void;

  /** video.srcObject 赋值前（Pipe Hook），可替换流 */
  onBeforeVideoPlay?(stream: MediaStream): MediaStream | void;

  /** 视频开始播放 */
  onPlaying?(): void;

  /** 切换流前（Pipe Hook） */
  onBeforeSwitchStream?(url: string): string | void;

  /** 切换流后 */
  onAfterSwitchStream?(url: string): void;
}
```

### `RtcPublisherPluginHooks`

推流器独有 Hook。

```typescript
interface RtcPublisherPluginHooks {
  /** getUserMedia 前（Pipe Hook），可修改采集约束 */
  onBeforeGetUserMedia?(constraints: MediaStreamConstraints): MediaStreamConstraints | void;

  /** MediaStream 获取后 */
  onMediaStream?(stream: MediaStream): void;

  /** 轨道接入前（AsyncPipe Hook），可替换整个流 */
  onBeforeAttachStream?(stream: MediaStream): MediaStream | void;

  /** 单轨道接入前（AsyncPipe Hook），可替换/移除单个轨道 */
  onBeforeAttachTrack?(track: MediaStreamTrack, stream: MediaStream): MediaStreamTrack | void;

  /** 轨道接入后 */
  onTrackAttached?(track: MediaStreamTrack, stream: MediaStream): void;

  /** setLocalDescription 前（Pipe Hook） */
  onBeforeSetLocalDescription?(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit | void;

  /** setRemoteDescription 前（Pipe Hook） */
  onBeforeSetRemoteDescription?(
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;

  /** setRemoteDescription 后 */
  onRemoteDescriptionSet?(): void;

  /** replaceTrack 前（Pipe Hook） */
  onBeforeReplaceTrack?(track: MediaStreamTrack | null): MediaStreamTrack | null | void;

  /** replaceTrack 后 */
  onAfterReplaceTrack?(): void;

  /** 收到远端轨道（回声场景） */
  onTrack?(track: MediaStreamTrack, stream: MediaStream): void;

  /** 推流状态变更 */
  onStreamingStateChange?(state: 'idle' | 'connecting' | 'streaming'): void;

  /** 推流开始 */
  onPublishing?(): void;

  /** 推流停止 */
  onUnpublishing?(): void;

  /** 切换源前（Pipe Hook） */
  onBeforeSourceChange?(source: MediaSource): MediaSource | void;

  /** 切换源后 */
  onAfterSourceChange?(source: MediaSource): void;
}
```

### `RtcPlayerPluginInstance`

插件在 `install()` 时接收的播放器实例上下文。

```typescript
interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  getStreamUrl(): string;
  getVideoElement(): HTMLVideoElement | undefined;
  getCurrentStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

### `RtcPublisherPluginInstance`

插件在 `install()` 时接收的推流器实例上下文。

```typescript
interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

## PluginPhase

`PluginPhase` 常量定义了插件钩子被调用的生命周期阶段。

```typescript
export const PluginPhase = {
  // Common
  ERROR: 'error',
  PEER_CONNECTION_CREATED: 'peerConnectionCreated',

  // Player
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

  // Publisher
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
```

## Hook 类型

插件中的每个 Hook 按调用语义分为两类：

| 类型                  | 含义       | 插件行为                                                    |
| --------------------- | ---------- | ----------------------------------------------------------- |
| `RtcPlayerNotifyHook` | 通知型     | 函数返回值被忽略；异常不传播                                |
| `RtcPlayerPipeHook`   | 同步管道型 | 首个返回值决定后续插件输入；返回 `undefined` 继续用上一个值 |

```typescript
type RtcPlayerNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onTrack'
  | 'onPlaying'
  | 'onAfterSwitchStream'
  | 'onPreDestroy'
  | 'onPostDestroy';

type RtcPlayerPipeHook =
  | 'onBeforeConnect'
  | 'onBeforeICESetCandidate'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeVideoPlay'
  | 'onBeforeSwitchStream'
  | 'onError';
```
