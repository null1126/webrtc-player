# WebRTC Engine

[简体中文](./README.md) · [English](./README_en.md) · [Demo](https://github.com/null1126/webrtc-engine) · [Documentation](https://null1126.github.io/webrtc-engine/en/)

A lightweight, framework-agnostic WebRTC library for browser-based real-time video streaming. Supports both **playback** (subscribe) and **publishing** (push).

---

## Features

- **Playback & Publishing** — One library for both: subscribe WebRTC streams or publish camera/microphone/screen
- **Framework Agnostic** — Works with React, Vue, Angular, or vanilla TypeScript/JavaScript
- **TypeScript First** — Full TypeScript support with detailed type definitions
- **Event-Driven** — Complete event lifecycle for player state management
- **Custom Signaling** — Built-in HTTP signaling provider; implement your own via `SignalingProvider` interface
- **Multi-Source Capture** — Camera, microphone, screen capture, or custom MediaStream
- **Stream Switching** — Switch video sources without recreating the player instance
- **Configurable Connection Strategy** — Supports auto reconnect and ICE behavior tuning
- **Flexible Render Target** — Supports video/audio/canvas target elements with mute control
- **Plugin System** — Extensible via plugins; logging, performance monitoring, and more available out of the box
- **Zero External Dependencies** — No third-party runtime dependencies; only standard Web APIs

---

## Installation

```bash
npm install @webrtc-engine/core
# or
pnpm add @webrtc-engine/core
# or
yarn add @webrtc-engine/core
```

---

## Quick Start

### Playback (Subscribe)

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
  muted: true,
  reconnect: {
    enabled: true,
    maxRetries: 6,
    exponential: true,
  },
  ice: {
    waitForComplete: true,
    gatheringTimeout: 3000,
  },
});

player.on('state', (state) => {
  console.log('Connection state:', state);
});

player.on('track', ({ stream }) => {
  console.log('New track received:', stream);
});

player.on('error', (message) => {
  console.error('Player error:', message);
});

await player.play();
```

### Publishing (Push)

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
  muted: true,
  reconnect: {
    enabled: true,
    maxRetries: 5,
  },
  ice: {
    waitForComplete: false,
  },
});

publisher.on('streamstart', ({ stream }) => {
  console.log('Publishing started:', stream);
});

publisher.on('error', (message) => {
  console.error('Publisher error:', message);
});

await publisher.start();
```

### Media Sources

| Type       | Config                            | Description        |
| ---------- | --------------------------------- | ------------------ |
| Camera     | `{ type: 'camera', audio: true }` | Video + audio      |
| Screen     | `{ type: 'screen', audio: true }` | With system audio  |
| Microphone | `{ type: 'microphone' }`          | Audio only         |
| Custom     | `{ type: 'custom', stream }`      | Custom MediaStream |

### Stream Switching

```typescript
// Switch to a different playback stream
await player.switchStream('webrtc://localhost/live/new-stream');

// Switch publishing source without rebuilding
await publisher.switchSource({ type: 'screen', audio: true });
```

---

## API Overview

### `RtcPlayer` (Playback)

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

#### RtcPlayerOptions

| Property    | Type                                                        | Required | Description                                                 |
| ----------- | ----------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `url`       | `string`                                                    | Yes      | WebRTC stream URL                                           |
| `api`       | `string`                                                    | Yes      | Signaling server HTTP/HTTPS URL                             |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | No       | Render target element for auto-binding (video/audio/canvas) |
| `muted`     | `boolean`                                                   | No       | Whether target element is muted (default `true`)            |
| `media`     | `MediaKind`                                                 | No       | Media type: `'audio'`, `'video'`, `'all'`                   |
| `signaling` | `SignalingProvider`                                         | No       | Custom signaling provider (overrides `api`)                 |
| `config`    | `RTCConfiguration`                                          | No       | Custom RTCConfiguration                                     |
| `reconnect` | `ReconnectOptions`                                          | No       | Auto reconnect configuration                                |
| `ice`       | `IceOptions`                                                | No       | ICE behavior config (gathering strategy and timeout)        |

#### RtcPlayer Methods

| Method              | Returns            | Description                               |
| ------------------- | ------------------ | ----------------------------------------- |
| `play()`            | `Promise<boolean>` | Start the WebRTC connection               |
| `switchStream(url)` | `Promise<void>`    | Switch to a different stream              |
| `use(plugin)`       | `this`             | Register and install a plugin (chainable) |
| `unuse(name)`       | `this`             | Uninstall a plugin by name                |
| `destroy()`         | `void`             | Destroy the player                        |

#### RtcPlayer Events

| Event                | Payload                                                        | Description                     |
| -------------------- | -------------------------------------------------------------- | ------------------------------- |
| `state`              | `RtcState`                                                     | Connection state changes        |
| `track`              | `{ stream: MediaStream; event: RTCTrackEvent }`                | New media track received        |
| `icecandidate`       | `RTCIceCandidate`                                              | ICE candidate gathered          |
| `iceconnectionstate` | `RTCIceConnectionState`                                        | ICE connection state            |
| `icegatheringstate`  | `RTCIceGatheringState`                                         | ICE gathering state             |
| `reconnecting`       | `{ retryCount: number; maxRetries: number; interval: number }` | Reconnecting in progress        |
| `reconnectfailed`    | `{ maxRetries: number }`                                       | Reconnect failed at max retries |
| `error`              | `string`                                                       | Player error occurred           |

---

### `RtcPublisher` (Publishing)

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

#### RtcPublisherOptions

| Property    | Type                                                        | Required | Description                                        |
| ----------- | ----------------------------------------------------------- | -------- | -------------------------------------------------- |
| `url`       | `string`                                                    | Yes      | WebRTC stream URL                                  |
| `api`       | `string`                                                    | Yes      | Signaling server HTTP/HTTPS URL                    |
| `source`    | `MediaSource`                                               | Yes      | Media source configuration                         |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | No       | Preview render target element (video/audio/canvas) |
| `muted`     | `boolean`                                                   | No       | Whether target element is muted (default `true`)   |
| `signaling` | `SignalingProvider`                                         | No       | Custom signaling provider                          |
| `config`    | `RTCConfiguration`                                          | No       | Custom RTCConfiguration                            |
| `reconnect` | `ReconnectOptions`                                          | No       | Auto reconnect configuration                       |
| `ice`       | `IceOptions`                                                | No       | ICE behavior configuration                         |

#### RtcPublisher Methods

| Method              | Returns         | Description           |
| ------------------- | --------------- | --------------------- |
| `start()`           | `Promise<void>` | Start publishing      |
| `switchSource(src)` | `Promise<void>` | Switch media source   |
| `stop()`            | `void`          | Stop publishing       |
| `destroy()`         | `void`          | Destroy the publisher |

#### RtcPublisher Events

| Event              | Payload                                                        | Description                     |
| ------------------ | -------------------------------------------------------------- | ------------------------------- |
| `streamstart`      | `{ stream: MediaStream }`                                      | Publishing started              |
| `streamstop`       | `void`                                                         | Publishing stopped              |
| `sourcechange`     | `MediaSource`                                                  | Source switched                 |
| `track`            | `{ stream: MediaStream; event: RTCTrackEvent }`                | Remote track received           |
| `permissiondenied` | `{ source: MediaSource; error: Error }`                        | Media permission denied         |
| `state`            | `RtcState`                                                     | Connection state changes        |
| `reconnecting`     | `{ retryCount: number; maxRetries: number; interval: number }` | Reconnecting in progress        |
| `reconnectfailed`  | `{ maxRetries: number }`                                       | Reconnect failed at max retries |
| `error`            | `string`                                                       | Publisher error occurred        |

---

### `RtcState` Enum

```typescript
enum RtcState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
  SWITCHING = 'switching',
  SWITCHED = 'switched',
  DESTROYED = 'destroyed',
}
```

---

## Related Projects

- [webrtc-engine](https://github.com/null1126/webrtc-engine) — Main repository
- [WebRTC Engine Documentation](https://webrtc-engine.netlify.app/) — Full documentation site

---

## Plugin Packages

Officially maintained plugins, install as needed:

```bash
npm install @webrtc-engine/plugin-logger @webrtc-engine/plugin-performance
```

### `@webrtc-engine/plugin-logger`

Logging plugin that records player/publisher lifecycle events (connection state, ICE state, track events, errors, etc.).

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

### `@webrtc-engine/plugin-performance`

Performance monitoring plugin reporting real-time FPS, bitrate, RTT, packet loss, and more.

```typescript
import { createPerformancePlugin } from '@webrtc-engine/plugin-performance';

const perf = createPerformancePlugin({
  onStats: (stats) =>
    console.log('FPS:', stats.fps, 'Bitrate:', (stats.bitrate / 1000).toFixed(1), 'kb/s'),
});

player.use(perf);
```

See the [Plugin System documentation](https://null1126.github.io/webrtc-engine/en/guide/plugins/) for full usage.

---

## License

[ISC](./LICENSE) — Copyright (c) 2024-present WebRTC Engine Contributors
