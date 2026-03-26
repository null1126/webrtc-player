# WebRTC Player

[English](./README.md) · [简体中文](./README_zh.md) · [Demo](https://github.com/null1126/webrtc-player) · [Documentation](https://github.com/null1126/webrtc-player)

A lightweight, framework-agnostic WebRTC player library for browser-based real-time video streaming.

---

## Features

- **Framework Agnostic** — Works with any JavaScript framework or vanilla TypeScript/JavaScript
- **TypeScript First** — Full TypeScript support with detailed type definitions included in the package
- **Event-Driven** — Flexible event emitter API for player state management
- **Signaling Server Integration** — Built-in HTTP signaling server communication
- **Stream Switching** — Switch between multiple video sources without recreating the player instance
- **Auto Video Binding** — Optionally pass a `<video>` element and the player handles everything automatically
- **Zero External Dependencies** — No third-party dependencies; only standard Web APIs

---

## Packages

This monorepo uses [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

| Package                                  | Description                | Published |
| ---------------------------------------- | -------------------------- | --------- |
| [`@webrtc-player/core`](./packages/core) | Core WebRTC player library | npm       |
| [`react`](./examples/react)              | React integration example  | Internal  |

---

## Quick Start

### Installation

```bash
npm install @webrtc-player/core
# or
pnpm add @webrtc-player/core
# or
yarn add @webrtc-player/core
```

### Basic Usage

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost:8080/live/stream',
  api: 'http://localhost:8080',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  console.log('Connection state:', state);
});

player.on('track', ({ stream, event }) => {
  console.log('New track received:', stream);
});

player.on('error', (message) => {
  console.error('Player error:', message);
});

await player.play();
```

### Stream Switching

```typescript
// Switch to a different stream without recreating the player
await player.switchStream('webrtc://localhost:8080/live/new-stream');
```

### Without Auto Video Binding

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost:8080/live/stream',
  api: 'http://localhost:8080',
  // omit video element — handle stream manually
});

player.on('track', ({ stream }) => {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  document.body.appendChild(video);
});

await player.play();
```

---

## API Overview

### `WebRTCPlayer`

```typescript
new WebRTCPlayer(options: PlayerOptions)
```

#### PlayerOptions

| Property | Type               | Required | Description                     |
| -------- | ------------------ | -------- | ------------------------------- |
| `url`    | `string`           | Yes      | WebRTC stream URL               |
| `api`    | `string`           | Yes      | Signaling server HTTP/HTTPS URL |
| `video`  | `HTMLVideoElement` | No       | Video element for auto-binding  |

#### Methods

| Method                      | Returns            | Description                              |
| --------------------------- | ------------------ | ---------------------------------------- |
| `play()`                    | `Promise<boolean>` | Start the WebRTC connection              |
| `switchStream(url: string)` | `Promise<void>`    | Switch to a different stream             |
| `destroy()`                 | `void`             | Destroy the player and release resources |

#### Events

| Event                | Payload                                         | Description                  |
| -------------------- | ----------------------------------------------- | ---------------------------- |
| `state`              | `StateEnum`                                     | Connection state changes     |
| `track`              | `{ stream: MediaStream; event: RTCTrackEvent }` | New media track received     |
| `icecandidate`       | `RTCIceCandidate`                               | ICE candidate gathered       |
| `iceconnectionstate` | `string`                                        | ICE connection state changed |
| `icegatheringstate`  | `string`                                        | ICE gathering state changed  |
| `error`              | `string`                                        | Player error occurred        |

#### StateEnum

```typescript
enum StateEnum {
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

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Setup

```bash
# Install dependencies
pnpm install

# Build core package
pnpm build

# Start all workspaces (core dev + examples)
pnpm dev

# Run linting
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type checking
pnpm typecheck
```

### Documentation

The documentation site is built with [VitePress](https://vitepress.dev):

```bash
# Start docs dev server (English)
pnpm docs:dev

# Build docs for production
pnpm docs:build

# Preview built docs
pnpm docs:preview
```

---

## License

[ISC](./LICENSE) — Copyright (c) 2024-present WebRTC Player Contributors
