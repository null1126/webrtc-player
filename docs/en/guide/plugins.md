---
title: WebRTC Player - Plugin System
description: WebRTC Player plugin system documentation — how to write and use plugins.
---

# Plugin System

WebRTC Player provides a flexible plugin system that lets you inject custom logic at key lifecycle points of the player and publisher — enabling logging, performance monitoring, analytics, media processing, and more.

## Install Official Plugins

```bash
npm install @webrtc-player/plugin-logger @webrtc-player/plugin-performance
# or
pnpm add @webrtc-player/plugin-logger @webrtc-player/plugin-performance
```

## Quick Start

### Method 1: Via Configuration

Plugins can be passed directly via the `plugins` option when creating the player instance:

```typescript
import { RtcPlayer } from '@webrtc-player/core';
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
  plugins: [
    createPlayerLoggerPlugin(),
    createPerformancePlugin({ onStats: (s) => console.log(s) }),
  ],
});

player.on('state', (state) => console.log(state));
await player.play();
```

### Method 2: Via .use() Chain

Plugins can also be registered dynamically after the player is created using the `.use()` method:

```typescript
import { RtcPlayer } from '@webrtc-player/core';
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player
  .use(createPlayerLoggerPlugin())
  .use(createPerformancePlugin({ onStats: (s) => console.log(s) }));

player.on('state', (state) => console.log(state));
await player.play();
```

Both methods take effect automatically when `play()` is called. They can also be used together.

## Installation & Uninstallation

```typescript
const plugin = createPlayerLoggerPlugin();

// Register and install — takes effect immediately
player.use(plugin);

// Uninstall, triggers uninstall() callback and removes from manager
player.unuse(plugin.name);

// Uninstall all plugins
player.unuseAll();
```

## Architecture

The plugin system is built on **Hooks**: plugins declare a set of hook functions to intercept the host's lifecycle. There are three hook categories:

| Type               | Description     | Behavior                                                                                                                                                          |
| ------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notify Hook**    | Fire-and-forget | Pure side effects, return value ignored; used for logging, analytics, etc.                                                                                        |
| **Pipe Hook**      | Sync pipeline   | Sync call; **the first plugin to return a non-undefined value** becomes the input for subsequent plugins. Used for modifying options, intercepting requests, etc. |
| **AsyncPipe Hook** | Async pipeline  | Supports `Promise` returns; used for async parameter manipulation                                                                                                 |

## Plugin Interface

### Base Interface `RtcBasePlugin`

All plugins implement this interface:

```typescript
interface RtcBasePlugin<I = unknown> {
  /** Unique plugin name; duplicates are rejected on registration */
  name: string;

  /** Execution priority; higher runs first, default 0 */
  priority?: number;

  /** Called on plugin registration; initialize resources here */
  install?(instance: I): void | Promise<void>;

  /** Called on plugin removal; clean up resources here */
  uninstall?(): void | Promise<void>;
}
```

### `RtcPlayerPluginInstance` — Player Plugin Instance

Read-only context passed to plugins during `install()`:

```typescript
interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  getStreamUrl(): string;
  getVideoElement(): HTMLVideoElement | undefined;
  getCurrentStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

### `RtcPublisherPluginInstance` — Publisher Plugin Instance

```typescript
interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

---

## Hook Reference

Complete reference for all plugin hooks, ordered by invocation phase.

### Common Hooks (Shared by Player and Publisher)

#### `onPeerConnectionCreated(pc)`

**Type:** Notify Hook | **Invoked:** After RTCPeerConnection is created

**Parameters:**

| Param | Type                | Description                  |
| ----- | ------------------- | ---------------------------- |
| `pc`  | `RTCPeerConnection` | The newly created connection |

**Use cases:** Access the underlying peer connection to add data channels, bind stats callbacks, or modify ICE configuration.

```typescript
onPeerConnectionCreated(pc: RTCPeerConnection) {
  const channel = pc.createDataChannel('custom');
  channel.onmessage = (e) => console.log('Data received:', e.data);
}
```

---

#### `onIceCandidate(candidate)`

**Type:** Notify Hook | **Invoked:** When an ICE candidate is gathered

**Parameters:**

| Param       | Type              | Description                      |
| ----------- | ----------------- | -------------------------------- |
| `candidate` | `RTCIceCandidate` | The newly gathered ICE candidate |

**Use cases:** Log or report ICE candidates, build candidate topology maps, or monitor candidate quality.

---

#### `onBeforeICESetCandidate(candidate)`

**Type:** Pipe Hook | **Invoked:** Before an ICE candidate is added to the remote description

**Parameters:**

| Param       | Type              | Description                     |
| ----------- | ----------------- | ------------------------------- |
| `candidate` | `RTCIceCandidate` | The candidate about to be added |

**Return value:** Return the original candidate to add it; return `null` to skip this candidate; return a modified `RTCIceCandidate` to replace it.

**Use cases:** Filter or rewrite candidates — for example, skip localhost candidates or prefer relay candidates over host candidates.

```typescript
onBeforeICESetCandidate(candidate: RTCIceCandidate) {
  // Skip localhost candidates
  if (candidate.candidate.includes('127.0.0.1')) return null;
  return candidate;
}
```

---

#### `onConnectionStateChange(state)`

**Type:** Notify Hook | **Invoked:** When the WebRTC connection state changes

**Parameters:**

| Param   | Type                     | Description                                                                                                |
| ------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `state` | `RTCPeerConnectionState` | Current state (`'new'` \| `'connecting'` \| `'connected'` \| `'disconnected'` \| `'failed'` \| `'closed'`) |

**Use cases:** Monitor overall connection health, update UI indicators, or trigger reconnection logic.

---

#### `onIceConnectionStateChange(state)`

**Type:** Notify Hook | **Invoked:** When the ICE connection state changes

**Parameters:**

| Param   | Type                    | Description                                                                                                                              |
| ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `state` | `RTCIceConnectionState` | Current ICE connection state (`'new'` \| `'checking'` \| `'connected'` \| `'completed'` \| `'failed'` \| `'disconnected'` \| `'closed'`) |

**Use cases:** Fine-grained ICE-layer monitoring — `completed` signals a stable connection, `disconnected` may indicate temporary network issues.

---

#### `onIceGatheringStateChange(state)`

**Type:** Notify Hook | **Invoked:** When the ICE gathering state changes

**Parameters:**

| Param   | Type                   | Description                                              |
| ------- | ---------------------- | -------------------------------------------------------- |
| `state` | `RTCIceGatheringState` | Current state (`'new'` \| `'gathering'` \| `'complete'`) |

**Use cases:** Track candidate gathering progress; `state === 'complete'` means all candidates have been gathered.

---

#### `onError(error)`

**Type:** Pipe Hook | **Invoked:** When an internal error occurs in the player or publisher

**Parameters:**

| Param   | Type     | Description               |
| ------- | -------- | ------------------------- |
| `error` | `string` | Error description message |

**Return value:** Return `true` to signal the error has been handled — this suppresses the default `error` event (`player.on('error')`).

**Use cases:** Custom error handling, reporting to monitoring systems, or silently ignoring known harmless errors.

```typescript
onError(error: string) {
  myReporter.captureException(error);
  return true; // Suppress default error event
}
```

---

#### `onPreDestroy()`

**Type:** Notify Hook | **Invoked:** At the start of `destroy()`, before RTCPeerConnection is closed

**Return value:** Supports `Promise`; destruction waits for async cleanup to complete.

**Use cases:** Clear timers, remove event listeners, close WebSocket connections. The connection is still available at this point.

```typescript
onPreDestroy() {
  clearInterval(this.timerId);
  this.ws?.close();
}
```

---

#### `onPostDestroy()`

**Type:** Notify Hook | **Invoked:** At the end of `destroy()`, after RTCPeerConnection is closed

**Return value:** Supports `Promise`.

**Use cases:** Final cleanup. The connection object is no longer usable.

---

### Player-Only Hooks

#### `onBeforeConnect(options)`

**Type:** Pipe Hook | **Invoked:** After `play()` is called, before the connection begins

**Parameters:**

| Param     | Type               | Description                  |
| --------- | ------------------ | ---------------------------- |
| `options` | `RtcPlayerOptions` | Current player configuration |

**Return value:** Return a modified `RtcPlayerOptions` to replace the config, or `void` to keep the original.

**Use cases:** Dynamically modify the URL, media constraints, or RTCConfiguration based on runtime conditions (network type, device, etc.).

```typescript
onBeforeConnect(options: RtcPlayerOptions) {
  return {
    ...options,
    url: options.url.replace('low', 'high'),
    config: { ...options.config, iceServers: [...] },
  };
}
```

---

#### `onBeforeSetLocalDescription(offer)`

**Type:** Pipe Hook | **Invoked:** After offer SDP is generated, before `setLocalDescription()` is called

**Parameters:**

| Param   | Type                        | Description                         |
| ------- | --------------------------- | ----------------------------------- |
| `offer` | `RTCSessionDescriptionInit` | The local offer SDP about to be set |

**Return value:** Return a modified SDP to replace it.

**Use cases:** Rewrite SDP content before sending to the server — e.g., modify bandwidth limits, codec preferences, or add custom session parameters.

---

#### `onBeforeSetRemoteDescription(answer)`

**Type:** Pipe Hook | **Invoked:** After answer SDP is received, before `setRemoteDescription()` is called

**Parameters:**

| Param    | Type                        | Description                           |
| -------- | --------------------------- | ------------------------------------- |
| `answer` | `RTCSessionDescriptionInit` | The remote answer SDP about to be set |

**Return value:** Return a modified SDP to replace it.

**Use cases:** Modify remote SDP content, such as adjusting bandwidth parameters in Media Descriptions.

---

#### `onRemoteDescriptionSet()`

**Type:** Notify Hook | **Invoked:** After `setRemoteDescription()` completes successfully

**Use cases:** Execute logic after SDP exchange is done.

---

#### `onTrack(track, stream)`

**Type:** Notify Hook | **Invoked:** When a remote media track is received

**Parameters:**

| Param    | Type               | Description                   |
| -------- | ------------------ | ----------------------------- |
| `track`  | `MediaStreamTrack` | The received media track      |
| `stream` | `MediaStream`      | The MediaStream it belongs to |

**Use cases:** React to incoming tracks, attach to custom renderers, or log track metadata.

```typescript
onTrack(track: MediaStreamTrack, stream: MediaStream) {
  console.log('Remote track:', track.kind, 'id:', track.id);
}
```

---

#### `onBeforeVideoPlay(stream)`

**Type:** Pipe Hook | **Invoked:** Before the remote stream is assigned to `video.srcObject`

**Parameters:**

| Param    | Type          | Description                               |
| -------- | ------------- | ----------------------------------------- |
| `stream` | `MediaStream` | The remote MediaStream about to be played |

**Return value:** Return a replacement `MediaStream`; return `void` to use the original.

**Use cases:** Pre-process the stream before playback — add extra audio tracks, replace video tracks, apply filters, etc.

```typescript
onBeforeVideoPlay(stream: MediaStream) {
  // Replace with video-only stream
  const videoOnly = new MediaStream(stream.getVideoTracks());
  return videoOnly;
}
```

---

#### `onPlaying()`

**Type:** Notify Hook | **Invoked:** When the video element fires the `playing` event, meaning playback has started

**Use cases:** Confirm playback started, hide loading indicators, begin performance monitoring.

---

#### `onBeforeSwitchStream(url)`

**Type:** Pipe Hook | **Invoked:** After `switchStream(url)` is called, before the actual switch

**Parameters:**

| Param | Type     | Description           |
| ----- | -------- | --------------------- |
| `url` | `string` | The target stream URL |

**Return value:** Return a modified URL to replace it.

**Use cases:** Dynamically route to a different server node during stream switching.

```typescript
onBeforeSwitchStream(url: string) {
  return url.replace('/live/', '/live/replica-2/');
}
```

---

#### `onAfterSwitchStream(url)`

**Type:** Notify Hook | **Invoked:** After the stream switch is complete

**Parameters:**

| Param | Type     | Description                    |
| ----- | -------- | ------------------------------ |
| `url` | `string` | The stream URL after switching |

**Use cases:** Post-switch operations — update UI, log switch latency.

---

#### `onBeforeVideoRender()`

**Type:** AsyncPipe Hook | **Invoked:** On every `requestAnimationFrame` tick

**Return value:** Supports `Promise`; frame rendering waits for the promise to resolve.

**Use cases:** Per-frame processing — screenshots, watermarks, real-time filters, canvas compositing.

```typescript
async onBeforeVideoRender(): Promise<void> {
  await drawWatermark(this.canvas, this.video);
}
```

---

### Publisher-Only Hooks

#### `onBeforeGetUserMedia(constraints)`

**Type:** Pipe Hook | **Invoked:** Before `getUserMedia()` is called

**Parameters:**

| Param         | Type                     | Description                            |
| ------------- | ------------------------ | -------------------------------------- |
| `constraints` | `MediaStreamConstraints` | The media constraints about to be used |

**Return value:** Return modified constraints to replace them.

**Use cases:** Adjust resolution, frame rate, bitrate, or switch audio/video devices before capture.

```typescript
onBeforeGetUserMedia(constraints: MediaStreamConstraints) {
  return {
    ...constraints,
    video: { ...(constraints.video as MediaTrackConstraints), width: 1280, height: 720 },
  };
}
```

---

#### `onMediaStream(stream)`

**Type:** Notify Hook | **Invoked:** After `getUserMedia()` succeeds

**Parameters:**

| Param    | Type          | Description                    |
| -------- | ------------- | ------------------------------ |
| `stream` | `MediaStream` | The captured local MediaStream |

**Use cases:** Post-capture processing — add extra tracks, start recording, generate preview thumbnails.

---

#### `onBeforeAttachStream(stream)`

**Type:** AsyncPipe Hook | **Invoked:** Before the local stream is added to RTCPeerConnection

**Parameters:**

| Param    | Type          | Description                          |
| -------- | ------------- | ------------------------------------ |
| `stream` | `MediaStream` | The MediaStream about to be attached |

**Return value:** Supports `Promise`; return a replacement `MediaStream`; return `void` to use the original.

**Use cases:** Pre-process the entire stream before it enters the connection — remove muted audio tracks, apply noise suppression, replace tracks.

```typescript
async onBeforeAttachStream(stream: MediaStream) {
  const enhanced = await applyNoiseSuppression(stream);
  return enhanced;
}
```

---

#### `onBeforeAttachTrack(track, stream)`

**Type:** AsyncPipe Hook | **Invoked:** Before each individual track is attached (called once for video, once for audio)

**Parameters:**

| Param    | Type               | Description                    |
| -------- | ------------------ | ------------------------------ |
| `track`  | `MediaStreamTrack` | The track about to be attached |
| `stream` | `MediaStream`      | Its parent MediaStream         |

**Return value:** Supports `Promise`; return a replacement `MediaStreamTrack`; return `void` to use the original; return `null` to skip this track entirely.

**Use cases:** Fine-grained per-track control — apply noise suppression to audio only, add filters to video tracks, selectively drop tracks.

```typescript
onBeforeAttachTrack(track: MediaStreamTrack, stream: MediaStream) {
  if (track.kind === 'audio') {
    return applyNoiseSuppressionToTrack(track);
  }
  return track;
}
```

---

#### `onTrackAttached(track, stream)`

**Type:** Notify Hook | **Invoked:** After a track is successfully added to RTCPeerConnection

**Parameters:**

| Param    | Type               | Description              |
| -------- | ------------------ | ------------------------ |
| `track`  | `MediaStreamTrack` | The track that was added |
| `stream` | `MediaStream`      | Its parent MediaStream   |

**Use cases:** Post-attachment operations — start RTCRtpSender statistics, enable track-level control.

---

#### `onBeforeSetLocalDescription(offer)`

**Type:** Pipe Hook | **Invoked:** After offer SDP is generated, before `setLocalDescription()` is called

**Parameters:**

| Param   | Type                        | Description                         |
| ------- | --------------------------- | ----------------------------------- |
| `offer` | `RTCSessionDescriptionInit` | The local offer SDP about to be set |

**Return value:** Return a modified SDP to replace it.

**Use cases:** Adjust SDP parameters before sending — modify bandwidth limits (`TIAS`), codec priorities, or add custom extensions.

---

#### `onBeforeSetRemoteDescription(answer)`

**Type:** Pipe Hook | **Invoked:** After answer SDP is received, before `setRemoteDescription()` is called

**Parameters:**

| Param    | Type                        | Description                           |
| -------- | --------------------------- | ------------------------------------- |
| `answer` | `RTCSessionDescriptionInit` | The remote answer SDP about to be set |

**Return value:** Return a modified SDP to replace it.

---

#### `onRemoteDescriptionSet()`

**Type:** Notify Hook | **Invoked:** After `setRemoteDescription()` completes successfully

---

#### `onBeforeReplaceTrack(track)`

**Type:** Pipe Hook | **Invoked:** Before `replaceTrack()` is called

**Parameters:**

| Param   | Type                       | Description                                                |
| ------- | -------------------------- | ---------------------------------------------------------- |
| `track` | `MediaStreamTrack \| null` | The new track to replace with; `null` means stop the track |

**Return value:** Return a modified track to replace it; return `null` to skip the replacement.

**Use cases:** Pre-process the new track before replacement — apply noise suppression or filters.

```typescript
onBeforeReplaceTrack(track: MediaStreamTrack | null) {
  return track ? applyDenoise(track) : null;
}
```

---

#### `onAfterReplaceTrack()`

**Type:** Notify Hook | **Invoked:** After `replaceTrack()` completes

---

#### `onTrack(track, stream)`

**Type:** Notify Hook | **Invoked:** When a remote track is received (for echo scenarios)

**Parameters:**

| Param    | Type               | Description               |
| -------- | ------------------ | ------------------------- |
| `track`  | `MediaStreamTrack` | The received remote track |
| `stream` | `MediaStream`      | Its parent MediaStream    |

**Use cases:** Handle remote echo tracks — mix audio or render remote video on the publisher side.

---

#### `onStreamingStateChange(state)`

**Type:** Notify Hook | **Invoked:** When the publishing state machine transitions

**Parameters:**

| Param   | Type                                        | Description             |
| ------- | ------------------------------------------- | ----------------------- |
| `state` | `'idle'` \| `'connecting'` \| `'streaming'` | Current streaming state |

**Use cases:** Monitor state transitions, update UI indicators, or trigger auto-reconnect logic.

---

#### `onPublishing()`

**Type:** Notify Hook | **Invoked:** When streaming starts, as `streamingState` transitions to `'streaming'`

**Use cases:** Confirm streaming has begun — show "Live" indicator.

---

#### `onUnpublishing()`

**Type:** Notify Hook | **Invoked:** When streaming stops, as `streamingState` leaves `'streaming'`

**Use cases:** Confirm streaming has stopped, clean up related state.

---

#### `onBeforeSourceChange(source)`

**Type:** Pipe Hook | **Invoked:** After `switchSource()` is called, before the actual source switch

**Parameters:**

| Param    | Type          | Description                           |
| -------- | ------------- | ------------------------------------- |
| `source` | `MediaSource` | The target media source configuration |

**Return value:** Return a modified `MediaSource` to replace it.

**Use cases:** Adjust source configuration before switching — enforce specific device IDs or constrain resolution.

```typescript
onBeforeSourceChange(source: MediaSource) {
  if (source.type === 'camera') {
    return { ...source, audio: { deviceId: this.preferredMicId } };
  }
  return source;
}
```

---

#### `onAfterSourceChange(source)`

**Type:** Notify Hook | **Invoked:** After the source switch is complete

**Parameters:**

| Param    | Type          | Description                                    |
| -------- | ------------- | ---------------------------------------------- |
| `source` | `MediaSource` | The media source configuration after switching |

**Use cases:** Post-switch operations.

---

## Writing a Custom Plugin

Here's a configurable logging plugin:

```typescript
import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '@webrtc-player/core';

export interface CustomLoggerOptions {
  prefix?: string;
  levels?: ('track' | 'playing' | 'error')[];
  onLog?: (msg: string) => void;
}

export function createCustomLogger(options: CustomLoggerOptions = {}): RtcPlayerPlugin {
  const prefix = options.prefix ?? '[Player]';
  const levels = options.levels ?? ['track', 'playing', 'error'];
  const log = (msg: string) => options.onLog?.(msg) ?? console.log(msg);

  return {
    name: 'custom-logger',

    install(instance: RtcPlayerPluginInstance) {
      log(`${prefix} installed, URL: ${instance.getStreamUrl()}`);
    },

    uninstall() {
      log(`${prefix} uninstalled`);
    },

    onTrack(track, stream) {
      if (!levels.includes('track')) return;
      log(`${prefix} Track: ${track.kind} (${track.id}), stream: ${stream.id}`);
    },

    onPlaying() {
      if (!levels.includes('playing')) return;
      log(`${prefix} Video playing`);
    },

    onError(error) {
      if (!levels.includes('error')) return;
      log(`${prefix} Error: ${error}`);
      return false; // Do not suppress default behavior
    },

    onPreDestroy() {
      log(`${prefix} Destroying...`);
    },
  };
}
```

Usage:

```typescript
player.use(
  createCustomLogger({
    prefix: '[MyApp]',
    levels: ['playing', 'error'],
    onLog: (msg) => myLogger.info(msg),
  })
);
```

---

## Official Plugins

### `@webrtc-player/plugin-logger`

Logs player and publisher lifecycle events. See [plugin-logger docs](https://github.com/null1126/webrtc-player/tree/main/packages/plugins/plugin-logger).

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
player.use(createPlayerLoggerPlugin());
```

### `@webrtc-player/plugin-performance`

Monitors player FPS and network transport statistics. See [plugin-performance docs](https://github.com/null1126/webrtc-player/tree/main/packages/plugins/plugin-performance).

```typescript
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';
player.use(createPerformancePlugin({ onStats: (s) => console.log(s) }));
```

---

## Best Practices

- **Error handling**: All hook errors are caught internally and logged — they will never crash the host. Plugins do not need their own try/catch.
- **Priority**: Higher-priority plugins execute first. Set `priority: 100` to ensure your plugin runs before others.
- **Unique names**: Duplicate plugin names are rejected on registration.
- **Lifecycle cleanup**: Use `onPreDestroy` to cancel timers, remove listeners, and release resources.
- **Async hooks**: `onBeforeVideoRender`, `onBeforeAttachStream`, and `onBeforeAttachTrack` support `Promise`. All other hooks are synchronous.
- **Return value semantics**: In Pipe Hooks, returning `undefined` means "don't intervene"; returning a concrete value means "replace the input."
