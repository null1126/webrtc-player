---
title: WebRTC Engine - RtcPublisher API
description: RtcPublisher publisher core class API documentation.
---

# RtcPublisher

Used to publish local media streams to a streaming server.

## Constructor

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

## Options (RtcPublisherOptions)

### Properties

| Property    | Type                                                        | Required | Description                                        |
| ----------- | ----------------------------------------------------------- | -------- | -------------------------------------------------- |
| `url`       | `string`                                                    | Yes      | WebRTC publishing URL                              |
| `api`       | `string`                                                    | Yes      | Signaling server URL                               |
| `source`    | `MediaSource`                                               | Yes      | Media source config                                |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | No       | Preview render target element (video/audio/canvas) |
| `muted`     | `boolean`                                                   | No       | Whether target element is muted, default `true`    |
| `config`    | `RTCConfiguration`                                          | No       | WebRTC connection config                           |
| `reconnect` | `ReconnectOptions`                                          | No       | Auto reconnect behavior                            |
| `ice`       | `IceOptions`                                                | No       | ICE behavior options (wait strategy and timeout)   |

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

### start() <Badge type="tip" text="async" />

Start publishing.

```typescript
await publisher.start();
```

### stop()

Stop publishing.

```typescript
publisher.stop();
```

### switchSource(source) <Badge type="tip" text="async" />

Switch media source without rebuilding the connection.

```typescript
await publisher.switchSource({ type: 'screen', audio: true });
```

### getStream()

Get local MediaStream.

```typescript
const stream = publisher.getStream();
```

### destroy()

Destroy instance and release resources.

```typescript
publisher.destroy();
```

## Events

| Event                  | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `state`                | RTC state changed (`connecting/connected/...`)         |
| `streamstart`          | Publishing started                                     |
| `streamstop`           | Publishing stopped                                     |
| `streamingstatechange` | Publishing state changed (`idle/connecting/streaming`) |
| `sourcechange`         | Source changed                                         |
| `permissiondenied`     | Media permission denied                                |
| `track`                | Remote stream received (echo/talkback scenarios)       |
| `trackended`           | Local track ended                                      |
| `trackmutechanged`     | Local track mute state changed                         |
| `error`                | Runtime error                                          |
| `icecandidate`         | Local ICE candidate generated                          |
| `iceconnectionstate`   | ICE connection state updated                           |
| `icegatheringstate`    | ICE gathering state updated                            |
| `reconnecting`         | Auto-reconnect attempt started                         |
| `reconnectfailed`      | Auto-reconnect exhausted (max retries reached)         |
| `reconnected`          | Auto-reconnect succeeded                               |
| `signalingerror`       | Signaling request failed                               |

See [Publishing Guide](../guide/publisher) for details.
