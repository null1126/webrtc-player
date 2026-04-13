---
title: WebRTC Player - 插件 API
description: WebRTC Player 插件 API 参考文档，包含最新 Hook、阶段与实例上下文定义。
---

# 插件 API

本文档描述当前版本的插件 API（已与最新实现对齐）。

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

## 插件基础字段

- `name: string`（必填）：插件唯一标识
- `priority?: number`（可选）：优先级，值越大越先执行
- `install?(instance)` / `uninstall?()`：插件安装/卸载生命周期

## 通用 Hook（Player / Publisher）

- `onPeerConnectionCreated(ctx, pc)`
- `onIceCandidate(ctx, { candidate, isRemote? })`
- `onConnectionStateChange(ctx, { state, previousState? })`
- `onIceConnectionStateChange(ctx, state)`
- `onIceGatheringStateChange(ctx, state)`
- `onError(ctx, { error, context? })`
- `onReconnecting(ctx, { retryCount, maxRetries, interval })`
- `onReconnectFailed(ctx, { maxRetries })`
- `onReconnected(ctx)`
- `onPreDestroy(ctx)` / `onPostDestroy(ctx)`
- `onBeforeSignalingRequest(ctx, request)`（**AsyncPipe**）
- `onAfterSignalingResponse(ctx, response)`（**AsyncPipe**）
- `onSignalingError(ctx, { error, request? })`

## 拉流 Hook（Player）

- `onBeforeConnect(ctx, { url, media })`（**Pipe**）
- `onBeforeSetLocalDescription(ctx, offer)`（**Pipe**）
- `onBeforeSetRemoteDescription(ctx, answer)`（**Pipe**）
- `onRemoteDescriptionSet(ctx, answer)`
- `onTrack(ctx, stream, event)`
- `onBeforeAttachStream(ctx, stream)`（**Pipe**，可替换流）
- `onMediaReady(ctx, stream)`
- `onBeforeSwitchStream(ctx, url)`（**Pipe**）
- `onAfterSwitchStream(ctx, url)`

## 推流 Hook（Publisher）

- `onBeforeGetUserMedia(ctx, constraints)`（**Pipe**）
- `onMediaStream(ctx, stream)`
- `onBeforeAttachStream(ctx, stream)`（**AsyncPipe**）
- `onBeforeAttachTrack(ctx, track, stream)`（**AsyncPipe**）
- `onTrackAttached(ctx, track, stream)`
- `onBeforeSetLocalDescription(ctx, offer)`（**Pipe**）
- `onBeforeSetRemoteDescription(ctx, answer)`（**Pipe**）
- `onRemoteDescriptionSet(ctx, answer)`
- `onBeforeReplaceTrack(ctx, oldTrack, newTrack)`（**AsyncPipe**）
- `onAfterReplaceTrack(ctx, track)`
- `onTrack(ctx, stream, event)`
- `onStreamingStateChange(ctx, state)`，`state` 为 `idle | connecting | streaming`
- `onBeforeStop(ctx)`（**AsyncPipe**）
- `onAfterStop(ctx)`
- `onBeforeSourceChange(ctx, source)`（**Pipe**）
- `onAfterSourceChange(ctx, source)`
- `onTrackEnded(ctx, { track, stream?, reason? })`
- `onTrackMuteChanged(ctx, { track, muted })`

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
