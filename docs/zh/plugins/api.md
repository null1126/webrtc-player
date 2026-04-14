---
title: WebRTC Engine - 插件 API
description: WebRTC Engine 插件 API 参考文档，包含插件接口、Hook 类型与 PluginPhase 生命周期定义。
---

# 插件 API

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
} from '@webrtc-engine/core';
```

## 核心配置

### `name`

- 类型：`string`
- 必填：是
- 说明：插件唯一标识。重复 `name` 的插件会被拒绝注册。

### `priority`

- 类型：`number`
- 必填：否（默认 `0`）
- 说明：执行优先级，值越大越先执行。

### `install(instance)` / `uninstall()`

- 类型：`(instance) => void | Promise<void>` / `() => void | Promise<void>`
- 说明：插件安装与卸载生命周期。

---

## 通用 Hook（播放器 / 推流器）

#### `onPeerConnectionCreated(pc)`

- 类型：Notify Hook
- 时机：`RTCPeerConnection` 创建后

#### `onIceCandidate(data)`

- 类型：Notify Hook
- 签名：`{ candidate: RTCIceCandidate; isRemote?: boolean }`

#### `onConnectionStateChange(data)` / `onIceConnectionStateChange(state)` / `onIceGatheringStateChange(state)`

- 类型：Notify Hook
- 时机：对应状态变化时触发

#### `onError(error)`

- 类型：Notify Hook
- 时机：内部错误抛出时

#### `onReconnecting(data)` / `onReconnectFailed(data)` / `onReconnected()`

- 类型：Notify Hook
- 时机：重连生命周期

#### `onPreDestroy()` / `onPostDestroy()`

- 类型：Notify Hook
- 时机：销毁前 / 销毁后

#### `onBeforeSignalingRequest(request)`

- 类型：AsyncPipe Hook
- 时机：信令请求发起前
- 用途：改写 url/sdp、注入 tracing 字段

#### `onAfterSignalingResponse(response)`

- 类型：AsyncPipe Hook
- 时机：信令响应返回后（`setRemoteDescription` 前）
- 用途：改写 answer、记录耗时

#### `onSignalingError(data)`

- 类型：Notify Hook
- 时机：信令请求异常时

---

## 拉流 Hook（播放器）

#### `onBeforeConnect(request)`

- 类型：Pipe Hook
- 签名：`{ url: string; media: 'audio' | 'video' | 'all' }`

#### `onBeforeSetLocalDescription(offer)` / `onBeforeSetRemoteDescription(answer)`

- 类型：Pipe Hook
- 时机：`setLocalDescription` / `setRemoteDescription` 前

#### `onRemoteDescriptionSet(answer)`

- 类型：Notify Hook
- 时机：远端描述设置成功后

#### `onTrack(stream, event)`

- 类型：Notify Hook
- 时机：收到远端轨道

#### `onBeforeAttachStream(stream)`

- 类型：Pipe Hook
- 时机：绑定渲染目标前
- 返回：可替换 `MediaStream`

#### `onMediaReady(stream)`

- 类型：Notify Hook
- 时机：媒体元素实际进入播放态后

#### `onCanvasFrame(frame)`

- 类型：Notify Hook
- 时机：Canvas 每帧绘制时
- 触发条件：仅当 `target` 为 `HTMLCanvasElement` 时触发
- 常用字段：`frame.context2d`、`frame.canvas`、`frame.timestamp`、`frame.drawX/drawY/drawWidth/drawHeight`

```typescript
const plugin: RtcPlayerPlugin = {
  name: 'canvas-watermark',
  onCanvasFrame(_ctx, frame) {
    const { context2d: ctx, canvas } = frame;
    ctx.save();
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'right';
    ctx.fillText('LIVE', canvas.width - 16, 28);
    ctx.restore();
  },
};
```

#### `onBeforeSwitchStream(url)` / `onAfterSwitchStream(url)`

- 类型：Pipe Hook / Notify Hook
- 时机：切流前 / 后

---

## 推流 Hook（推流器）

#### `onBeforeGetUserMedia(constraints)`

- 类型：Pipe Hook
- 时机：采集前

#### `onMediaStream(stream)`

- 类型：Notify Hook
- 时机：本地流可用后

#### `onCanvasFrame(frame)`

- 类型：Notify Hook
- 时机：Canvas 每帧绘制时
- 触发条件：仅当 `target` 为 `HTMLCanvasElement` 时触发
- 说明：推流本地预览为 `canvas` 时，可在此叠加预览信息（如状态角标）

#### `onBeforeAttachStream(stream)` / `onBeforeAttachTrack(track, stream)`

- 类型：AsyncPipe Hook
- 时机：流/轨道接入 PeerConnection 前

#### `onTrackAttached(track, stream)`

- 类型：Notify Hook
- 时机：轨道接入后

#### `onBeforeSetLocalDescription(offer)` / `onBeforeSetRemoteDescription(answer)`

- 类型：Pipe Hook

#### `onRemoteDescriptionSet(answer)`

- 类型：Notify Hook

#### `onBeforeReplaceTrack(oldTrack, newTrack)` / `onAfterReplaceTrack(track)`

- 类型：AsyncPipe Hook / Notify Hook
- 时机：替轨前 / 后

#### `onStreamingStateChange(state)`

- 类型：Notify Hook
- 状态：`idle` / `connecting` / `streaming`

#### `onBeforeStop()` / `onAfterStop()`

- 类型：AsyncPipe Hook / Notify Hook
- 时机：停止推流前 / 后

#### `onBeforeSourceChange(source)` / `onAfterSourceChange(source)`

- 类型：Pipe Hook / Notify Hook
- 时机：切源前 / 后

#### `onTrackEnded(data)` / `onTrackMuteChanged(data)`

- 类型：Notify Hook
- 时机：本地轨道 ended 或 mute/unmute

---

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
