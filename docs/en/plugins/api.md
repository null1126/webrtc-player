---
title: WebRTC Engine - Plugin API
description: Plugin API reference for WebRTC Engine, including hooks, phases, and instance contracts.
---

# Plugin API

This page documents the latest plugin API contracts.

## Imports

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

## Core plugin fields

- `name: string` (required): unique plugin id
- `priority?: number` (optional): higher runs earlier
- `install?(instance)` / `uninstall?()`: lifecycle methods

## Common hooks (Player / Publisher)

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
- `onBeforeSignalingRequest(ctx, request)` (**AsyncPipe**)
- `onAfterSignalingResponse(ctx, response)` (**AsyncPipe**)
- `onSignalingError(ctx, { error, request? })`

## Player hooks

- `onBeforeConnect(ctx, { url, media })` (**Pipe**)
- `onBeforeSetLocalDescription(ctx, offer)` (**Pipe**)
- `onBeforeSetRemoteDescription(ctx, answer)` (**Pipe**)
- `onRemoteDescriptionSet(ctx, answer)`
- `onTrack(ctx, stream, event)`
- `onBeforeAttachStream(ctx, stream)` (**Pipe**, can replace stream)
- `onMediaReady(ctx, stream)`
- `onCanvasFrame(ctx, frame)` (**Notify**, only when `target` is `HTMLCanvasElement`)
- `onBeforeSwitchStream(ctx, url)` (**Pipe**)
- `onAfterSwitchStream(ctx, url)`

### Hook details: `onCanvasFrame(ctx, frame)`

- Timing: called on each canvas frame render.
- Trigger condition: only when `target` is `HTMLCanvasElement`.
- Common fields: `frame.context2d`, `frame.canvas`, `frame.timestamp`, `frame.drawX/drawY/drawWidth/drawHeight`.

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

## Publisher hooks

- `onBeforeGetUserMedia(ctx, constraints)` (**Pipe**)
- `onMediaStream(ctx, stream)`
- `onCanvasFrame(ctx, frame)` (**Notify**, only when `target` is `HTMLCanvasElement`)
- `onBeforeAttachStream(ctx, stream)` (**AsyncPipe**)
- `onBeforeAttachTrack(ctx, track, stream)` (**AsyncPipe**)
- `onTrackAttached(ctx, track, stream)`
- `onBeforeSetLocalDescription(ctx, offer)` (**Pipe**)
- `onBeforeSetRemoteDescription(ctx, answer)` (**Pipe**)
- `onRemoteDescriptionSet(ctx, answer)`
- `onBeforeReplaceTrack(ctx, oldTrack, newTrack)` (**AsyncPipe**)
- `onAfterReplaceTrack(ctx, track)`
- `onTrack(ctx, stream, event)`
- `onStreamingStateChange(ctx, state)` where state is `idle | connecting | streaming`
- `onBeforeStop(ctx)` (**AsyncPipe**)
- `onAfterStop(ctx)`
- `onBeforeSourceChange(ctx, source)` (**Pipe**)
- `onAfterSourceChange(ctx, source)`
- `onTrackEnded(ctx, { track, stream?, reason? })`
- `onTrackMuteChanged(ctx, { track, muted })`

## Instance contracts

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
