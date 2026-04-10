---
title: WebRTC Player - Plugin API
description: WebRTC Player Plugin API reference, including core configuration, hook contracts, and instance context.
---

# Plugin API

This document only covers Plugin API reference details.

For plugin integration guides, see [Plugin System](./system).
For officially maintained plugins, see [Official Plugins](./official).

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

## Core Configuration

This section focuses on practical plugin configuration fields instead of interface inheritance structure.

### `name`

- Type: `string`
- Required: yes
- Description: Unique plugin identifier. Duplicate names are rejected.

### `priority`

- Type: `number`
- Required: no (default `0`)
- Description: Execution priority. Higher values run earlier.

### `install(instance)`

- Type: `(instance) => void | Promise<void>`
- Required: no
- Description: Called when the plugin is installed. Use it to initialize resources and read runtime context.

### `uninstall()`

- Type: `() => void | Promise<void>`
- Required: no
- Description: Called when the plugin is removed. Use it for cleanup.

### Minimal Plugin Example

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

## Hook Reference

This section explains invocation timing and semantics for each hook.

> Hook category quick links:
>
> - [Common Hooks (Player / Publisher)](#common-hooks-player--publisher)
> - [Playback Hooks (Player)](#playback-hooks-player)
> - [Publishing Hooks (Publisher)](#publishing-hooks-publisher)

---

## Common Hooks (Player / Publisher)

#### `onPeerConnectionCreated(pc)`

- Type: Notify Hook
- Timing: after `RTCPeerConnection` is created
- Use case: access low-level connection, attach DataChannel/stats logic

#### `onIceCandidate(data)`

- Type: Notify Hook
- Timing: when local ICE candidates are gathered
- Signature: `onIceCandidate(ctx, data: { candidate: RTCIceCandidate; isRemote?: boolean })`
- Use case: logging, reporting, connectivity diagnostics

#### `onConnectionStateChange(data)`

- Type: Notify Hook
- Timing: when connection state changes
- Signature: `onConnectionStateChange(ctx, data: { state: RTCPeerConnectionState; previousState?: RTCPeerConnectionState })`
- Use case: UI updates, reconnect strategy

#### `onIceConnectionStateChange(state)`

- Type: Notify Hook
- Timing: when ICE connection state changes
- Use case: network quality / transport monitoring

#### `onIceGatheringStateChange(state)`

- Type: Notify Hook
- Timing: when ICE gathering state changes
- Use case: determine whether candidate gathering is complete

#### `onError(error)`

- Type: Pipe Hook
- Timing: on internal errors
- Signature: `onError(ctx, data: { error: Error | string; context?: string }) => boolean | void`
- Return: `true` marks handled and suppresses default error event

#### `onPreDestroy()` / `onPostDestroy()`

- Type: Notify Hook
- Timing: before destroy / after destroy
- Signature: `onPreDestroy(ctx)` / `onPostDestroy(ctx)`
- Use case: cleanup and final reporting

#### `onReconnecting(data)` / `onReconnectFailed(data)` / `onReconnected()`

- Type: Notify Hook
- Timing:
  - `onReconnecting`: each reconnect attempt
  - `onReconnectFailed`: retries exhausted
  - `onReconnected`: reconnect succeeded
- Signature:
  - `onReconnecting(ctx, { retryCount, maxRetries, interval })`
  - `onReconnectFailed(ctx, { maxRetries })`
  - `onReconnected(ctx)`

---

## Playback Hooks (Player)

#### `onBeforeConnect(options)`

- Type: Pipe Hook
- Timing: after `play()` and before connect
- Signature: `onBeforeConnect(ctx, options: RtcPlayerOptions) => RtcPlayerOptions | void`
- Use case: rewrite URL or playback options

#### `onBeforeSetLocalDescription(offer)`

- Type: Pipe Hook
- Timing: before `setLocalDescription()`
- Use case: rewrite local SDP

#### `onBeforeSetRemoteDescription(answer)`

- Type: Pipe Hook
- Timing: before `setRemoteDescription()`
- Use case: rewrite remote SDP

#### `onRemoteDescriptionSet(answer)`

- Type: Notify Hook
- Timing: after remote description is set
- Signature: `onRemoteDescriptionSet(ctx, answer: RTCSessionDescriptionInit)`

#### `onTrack(stream, event)`

- Type: Notify Hook
- Timing: when remote track is received
- Signature: `onTrack(ctx, stream: MediaStream, event: RTCTrackEvent)`

#### `onBeforeVideoPlay(stream)`

- Type: Pipe Hook
- Timing: before assigning `video.srcObject`
- Return: can replace `MediaStream`

#### `onPlaying(stream)`

- Type: Notify Hook
- Timing: when video enters `playing`
- Signature: `onPlaying(ctx, stream: MediaStream)`

#### `onBeforeSwitchStream(url)` / `onAfterSwitchStream(url)`

- Type: Pipe Hook / Notify Hook
- Timing: before switch / after switch

---

## Publishing Hooks (Publisher)

#### `onBeforeGetUserMedia(constraints)`

- Type: Pipe Hook
- Timing: before media capture
- Use case: rewrite resolution/device constraints

#### `onMediaStream(stream)`

- Type: Notify Hook
- Timing: after local stream is captured

#### `onBeforeAttachStream(stream)`

- Type: AsyncPipe Hook
- Timing: before stream is attached to PeerConnection
- Return: can asynchronously replace `MediaStream`

#### `onBeforeAttachTrack(track, stream)`

- Type: AsyncPipe Hook
- Timing: before each track is attached
- Signature: `onBeforeAttachTrack(ctx, track, stream) => MediaStreamTrack | void | Promise<MediaStreamTrack | void>`
- Return: can replace track; returning `void` keeps original track

#### `onTrackAttached(track, stream)`

- Type: Notify Hook
- Timing: after track attachment

#### `onBeforeReplaceTrack(oldTrack, newTrack)` / `onAfterReplaceTrack(track)`

- Type: Notify Hook / Notify Hook
- Timing: before replace / after replace
- Signature:
  - `onBeforeReplaceTrack(ctx, oldTrack: MediaStreamTrack | null, newTrack: MediaStreamTrack | null)`
  - `onAfterReplaceTrack(ctx, track: MediaStreamTrack | null)`

#### `onStreamingStateChange(state)`

- Type: Notify Hook
- Timing: on publishing state changes (`idle` / `connecting` / `streaming`)

#### `onPublishing(stream)` / `onUnpublishing(stream)`

- Type: Notify Hook
- Timing: start publish / stop publish
- Signature:
  - `onPublishing(ctx, stream: MediaStream)`
  - `onUnpublishing(ctx, stream: MediaStream | null)`

#### `onBeforeSourceChange(source)` / `onAfterSourceChange(source)`

- Type: Pipe Hook / Notify Hook
- Timing: before source switch / after source switch

## Instance Context

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
