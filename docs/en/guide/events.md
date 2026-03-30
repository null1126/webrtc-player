---
title: WebRTC Player - Events
description: WebRTC Player event system, including playback and publishing events.
---

# Events

## Event Types

### Common Events

Available in both `RtcPlayer` and `RtcPublisher`:

| Event                | Description              | Parameters              |
| -------------------- | ------------------------ | ----------------------- |
| `state`              | Connection state changed | `RtcState`              |
| `error`              | Error occurred           | `string`                |
| `icecandidate`       | ICE candidate            | `RTCIceCandidate`       |
| `iceconnectionstate` | ICE connection state     | `RTCIceConnectionState` |

### Playback Events

| Event   | Description            | Parameters          |
| ------- | ---------------------- | ------------------- |
| `track` | Remote stream received | `{ stream, event }` |

### Publishing Events

| Event              | Description          | Parameters          |
| ------------------ | -------------------- | ------------------- |
| `streamstart`      | Publishing started   | `{ stream }`        |
| `streamstop`       | Publishing stopped   | `void`              |
| `sourcechange`     | Input source changed | `MediaSource`       |
| `permissiondenied` | Permission denied    | `{ source, error }` |

## Usage

```typescript
player.on('state', (state) => console.log(state));
player.off('track', handler); // Remove listener
player.once('error', handler); // Listen once
```

See [RtcState](../api/state).
