---
title: WebRTC Engine - RtcPlayer API
description: RtcPlayer playback player core class API documentation.
---

# RtcPlayer

Playback player core class.

## Constructor

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

## Options (RtcPlayerOptions)

### Properties

| Property    | Type                                                        | Required | Description                                      |
| ----------- | ----------------------------------------------------------- | -------- | ------------------------------------------------ |
| `url`       | `string`                                                    | Yes      | WebRTC playback URL                              |
| `api`       | `string`                                                    | Yes      | Signaling server URL                             |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | No       | Render target element (video/audio/canvas)       |
| `muted`     | `boolean`                                                   | No       | Whether target element is muted, default `true`  |
| `media`     | `'audio' \| 'video' \| 'all'`                               | No       | Media type, default `all`                        |
| `config`    | `RTCConfiguration`                                          | No       | WebRTC connection config                         |
| `reconnect` | `ReconnectOptions`                                          | No       | Auto reconnect behavior                          |
| `ice`       | `IceOptions`                                                | No       | ICE behavior options (wait strategy and timeout) |

### ReconnectOptions

| Property              | Type      | Required | Description                                                                                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------------------------------ |
| `enabled`             | `boolean` | No       | Enable auto reconnect, default `false`                                                     |
| `maxRetries`          | `number`  | No       | Maximum retry attempts, default `5`                                                        |
| `interval`            | `number`  | No       | Retry interval in ms; initial interval when exponential backoff is enabled, default `2000` |
| `exponential`         | `boolean` | No       | Enable exponential backoff, default `false`                                                |
| `maxInterval`         | `number`  | No       | Maximum retry interval in ms                                                               |
| `jitterRatio`         | `number`  | No       | Random jitter ratio (0~1)                                                                  |
| `disconnectedTimeout` | `number`  | No       | Fallback reconnect delay after entering `disconnected` (ms), default `5000`                |

### IceOptions

| Property           | Type      | Required | Description                                                                       |
| ------------------ | --------- | -------- | --------------------------------------------------------------------------------- |
| `waitForComplete`  | `boolean` | No       | Whether to wait for ICE gathering to complete before SDP exchange, default `true` |
| `gatheringTimeout` | `number`  | No       | ICE gathering timeout in ms, default `3000`                                       |

## Methods

### play() <Badge type="tip" text="async" />

Start playback.

```typescript
await player.play();
```

### switchStream(url) <Badge type="tip" text="async" />

Switch playback URL.

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

### use(plugin) <Badge type="tip" text="sync" />

Register and install a plugin. Returns `this` for chaining.

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

See [Plugin System](../guide/plugins) for details.

### unuse(name) <Badge type="tip" text="sync" />

Uninstall a plugin by name.

```typescript
player.unuse('player-logger');
```

### destroy()

Destroy instance.

```typescript
player.destroy();
```

## Events

| Event                | Description                                    |
| -------------------- | ---------------------------------------------- |
| `track`              | Remote stream received                         |
| `mediaready`         | Media entered playable state                   |
| `state`              | RTC state changed (`connecting/connected/...`) |
| `error`              | Runtime error                                  |
| `icecandidate`       | Local ICE candidate generated                  |
| `iceconnectionstate` | ICE connection state updated                   |
| `icegatheringstate`  | ICE gathering state updated                    |
| `reconnecting`       | Auto-reconnect attempt started                 |
| `reconnectfailed`    | Auto-reconnect exhausted (max retries reached) |
| `reconnected`        | Auto-reconnect succeeded                       |
| `signalingerror`     | Signaling request failed                       |

## Usage Example

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: videoElement,
});

player.on('track', ({ stream }) => (video.srcObject = stream));
player.on('state', (state) => console.log(state));
player.play();
```
