---
title: WebRTC Player - Plugin API
description: Plugin API reference for WebRTC Player, including latest hooks, phases, and instance contracts.
---

# Plugin API

This page documents the current plugin API and is aligned with the latest implementation.

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
} from '@webrtc-player/core';
```

## Plugin base fields

- `name: string` (required): unique plugin identifier
- `priority?: number` (optional): higher value runs earlier
- `install?(instance)` / `uninstall?()`: lifecycle callbacks

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
- `onBeforeVideoPlay(ctx, stream)` (**Pipe**, replaceable stream)
- `onMediaReady(ctx, stream)`
- `onBeforeSwitchStream(ctx, url)` (**Pipe**)
- `onAfterSwitchStream(ctx, url)`

## Publisher hooks

- `onBeforeGetUserMedia(ctx, constraints)` (**Pipe**)
- `onMediaStream(ctx, stream)`
- `onBeforeAttachStream(ctx, stream)` (**AsyncPipe**)
- `onBeforeAttachTrack(ctx, track, stream)` (**AsyncPipe**)
- `onTrackAttached(ctx, track, stream)`
- `onBeforeSetLocalDescription(ctx, offer)` (**Pipe**)
- `onBeforeSetRemoteDescription(ctx, answer)` (**Pipe**)
- `onRemoteDescriptionSet(ctx, answer)`
- `onBeforeReplaceTrack(ctx, oldTrack, newTrack)` (**AsyncPipe**)
- `onAfterReplaceTrack(ctx, track)`
- `onTrack(ctx, stream, event)`
- `onStreamingStateChange(ctx, state)` where `state` is `idle | connecting | streaming`
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
