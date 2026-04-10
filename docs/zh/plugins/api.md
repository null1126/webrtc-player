---
title: WebRTC Player - 插件 API
description: WebRTC Player 插件 API 参考文档，包含插件接口、Hook 类型与 PluginPhase 生命周期定义。
---

# 插件 API

本文档仅包含插件 API 参考内容。

如需了解插件接入方式，请查看 [插件系统](./system)。
如需查看官方维护的插件，请查看 [官方插件](./official)。

## 类型导入

```typescript
import type {
  RtcPlayerPlugin,
  RtcPublisherPlugin,
  RtcPlayerPluginInstance,
  RtcPublisherPluginInstance,
  RtcPluginCommonHooks,
  RtcPlayerPluginHooks,
  RtcPublisherPluginHooks,
} from '@webrtc-player/core';
```

## 核心配置

本节聚焦插件对象的核心配置项（而非接口继承关系）。

### `name`

- 类型：`string`
- 必填：是
- 说明：插件唯一标识。重复 `name` 的插件会被拒绝注册。

### `priority`

- 类型：`number`
- 必填：否（默认 `0`）
- 说明：执行优先级，值越大越先执行。

### `install(instance)`

- 类型：`(instance) => void | Promise<void>`
- 必填：否
- 说明：插件安装时触发，可用于初始化资源、读取实例状态。

### `uninstall()`

- 类型：`() => void | Promise<void>`
- 必填：否
- 说明：插件卸载时触发，用于清理定时器、监听器、连接等资源。

### 最小插件示例

```typescript
const myPlugin = {
  name: 'my-plugin',
  priority: 10,
  install(instance) {
    console.log('plugin installed', instance);
  },
  uninstall() {
    console.log('plugin uninstalled');
  },
};
```

## Hook 详解

本节给出各 Hook 的调用时机与语义说明。

> Hook 分类导航：
>
> - [通用 Hook（播放器 / 推流器）](#通用-hook播放器--推流器)
> - [拉流 Hook（播放器）](#拉流-hook播放器)
> - [推流 Hook（推流器）](#推流-hook推流器)

---

## 通用 Hook（播放器 / 推流器）

#### `onPeerConnectionCreated(pc)`

- 类型：Notify Hook
- 时机：`RTCPeerConnection` 创建后
- 用途：访问底层连接对象、挂载 DataChannel/统计逻辑

#### `onIceCandidate(data)`

- 类型：Notify Hook
- 时机：本地 ICE 候选收集到时
- 签名：`onIceCandidate(ctx, data: { candidate: RTCIceCandidate; isRemote?: boolean })`
- 用途：日志、上报、调试连通性

#### `onConnectionStateChange(data)`

- 类型：Notify Hook
- 时机：连接状态变化
- 签名：`onConnectionStateChange(ctx, data: { state: RTCPeerConnectionState; previousState?: RTCPeerConnectionState })`
- 用途：更新 UI、触发重连策略

#### `onIceConnectionStateChange(state)`

- 类型：Notify Hook
- 时机：ICE 连接状态变化
- 用途：网络质量与连通性监控

#### `onIceGatheringStateChange(state)`

- 类型：Notify Hook
- 时机：ICE 收集状态变化
- 用途：判断候选是否收集完成

#### `onError(error)`

- 类型：Pipe Hook
- 时机：内部错误抛出时
- 签名：`onError(ctx, data: { error: Error | string; context?: string }) => boolean | void`
- 返回：`true` 表示已处理并阻止默认错误事件

#### `onPreDestroy()` / `onPostDestroy()`

- 类型：Notify Hook
- 时机：销毁前 / 销毁后
- 签名：`onPreDestroy(ctx)` / `onPostDestroy(ctx)`
- 用途：资源清理、收尾上报

#### `onReconnecting(data)` / `onReconnectFailed(data)` / `onReconnected()`

- 类型：Notify Hook
- 时机：
  - `onReconnecting`：每次发起重连
  - `onReconnectFailed`：达到最大重试次数
  - `onReconnected`：重连成功
- 签名：
  - `onReconnecting(ctx, { retryCount, maxRetries, interval })`
  - `onReconnectFailed(ctx, { maxRetries })`
  - `onReconnected(ctx)`

---

## 拉流 Hook（播放器）

#### `onBeforeConnect(options)`

- 类型：Pipe Hook
- 时机：`play()` 后、连接前
- 签名：`onBeforeConnect(ctx, options: RtcPlayerOptions) => RtcPlayerOptions | void`
- 用途：动态修改 URL 或拉流参数

#### `onBeforeSetLocalDescription(offer)`

- 类型：Pipe Hook
- 时机：`setLocalDescription()` 前
- 用途：改写本地 SDP

#### `onBeforeSetRemoteDescription(answer)`

- 类型：Pipe Hook
- 时机：`setRemoteDescription()` 前
- 用途：改写远端 SDP

#### `onRemoteDescriptionSet(answer)`

- 类型：Notify Hook
- 时机：远端描述设置成功后
- 签名：`onRemoteDescriptionSet(ctx, answer: RTCSessionDescriptionInit)`

#### `onTrack(stream, event)`

- 类型：Notify Hook
- 时机：收到远端轨道
- 签名：`onTrack(ctx, stream: MediaStream, event: RTCTrackEvent)`

#### `onBeforeVideoPlay(stream)`

- 类型：Pipe Hook
- 时机：`video.srcObject` 赋值前
- 返回：可替换 `MediaStream`

#### `onPlaying(stream)`

- 类型：Notify Hook
- 时机：视频触发 `playing`
- 签名：`onPlaying(ctx, stream: MediaStream)`

#### `onBeforeSwitchStream(url)` / `onAfterSwitchStream(url)`

- 类型：Pipe Hook / Notify Hook
- 时机：切流前 / 切流后

---

## 推流 Hook（推流器）

#### `onBeforeGetUserMedia(constraints)`

- 类型：Pipe Hook
- 时机：采集前
- 用途：改写分辨率/设备等约束

#### `onMediaStream(stream)`

- 类型：Notify Hook
- 时机：本地流采集成功后

#### `onBeforeAttachStream(stream)`

- 类型：AsyncPipe Hook
- 时机：流接入 PeerConnection 前
- 返回：可异步替换 `MediaStream`

#### `onBeforeAttachTrack(track, stream)`

- 类型：AsyncPipe Hook
- 时机：单轨道接入前
- 签名：`onBeforeAttachTrack(ctx, track, stream) => MediaStreamTrack | void | Promise<MediaStreamTrack | void>`
- 返回：可替换轨道；返回 `void` 使用原轨道

#### `onTrackAttached(track, stream)`

- 类型：Notify Hook
- 时机：轨道接入后

#### `onBeforeReplaceTrack(oldTrack, newTrack)` / `onAfterReplaceTrack(track)`

- 类型：Notify Hook / Notify Hook
- 时机：替轨前 / 替轨后
- 签名：
  - `onBeforeReplaceTrack(ctx, oldTrack: MediaStreamTrack | null, newTrack: MediaStreamTrack | null)`
  - `onAfterReplaceTrack(ctx, track: MediaStreamTrack | null)`

#### `onStreamingStateChange(state)`

- 类型：Notify Hook
- 时机：推流状态变化（`idle` / `connecting` / `streaming`）

#### `onPublishing(stream)` / `onUnpublishing(stream)`

- 类型：Notify Hook
- 时机：开始推流 / 停止推流
- 签名：
  - `onPublishing(ctx, stream: MediaStream)`
  - `onUnpublishing(ctx, stream: MediaStream | null)`

#### `onBeforeSourceChange(source)` / `onAfterSourceChange(source)`

- 类型：Pipe Hook / Notify Hook
- 时机：切换采集源前 / 后

## 实例上下文

### `RtcPlayerPluginInstance`

```typescript
interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  getStreamUrl(): string;
  getTargetElement(): MediaRenderTarget | undefined;
  getCurrentStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

### `RtcPublisherPluginInstance`

```typescript
interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
  getTargetElement(): MediaRenderTarget | undefined;
  getPeerConnection(): RTCPeerConnection | null;
}
```
