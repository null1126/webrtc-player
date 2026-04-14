---
title: WebRTC Engine - Events
description: WebRTC Engine event model and listening patterns across common, playback, and publishing events.
---

# Events

WebRTC Engine uses an event-driven architecture. You can observe connection transitions, media updates, and runtime failures, then map them into robust business workflows.

## Quick Classification

- Common events: emitted by both `RtcPlayer` and `RtcPublisher`
- Playback events: emitted only by `RtcPlayer`
- Publishing events: emitted only by `RtcPublisher`

## 1) Common Events (Player / Publisher)

These events are available on both `RtcPlayer` and `RtcPublisher`:

> Full `state` values:
> `connecting`, `connected`, `disconnected`, `failed`, `closed`, `switching`, `switched`, `destroyed` (see `RtcState`)

| Event                | Description                                    | Payload type                           |
| -------------------- | ---------------------------------------------- | -------------------------------------- |
| `state`              | RTC state changed (`connecting/connected/...`) | `RtcState`                             |
| `error`              | Runtime error occurred                         | `string`                               |
| `icecandidate`       | Local ICE candidate generated                  | `RTCIceCandidate`                      |
| `iceconnectionstate` | ICE connection state updated                   | `RTCIceConnectionState`                |
| `icegatheringstate`  | ICE gathering state updated                    | `RTCIceGatheringState`                 |
| `reconnecting`       | Auto-reconnect attempt started                 | `{ retryCount, maxRetries, interval }` |
| `reconnectfailed`    | Auto-reconnect exhausted (max retries reached) | `{ maxRetries }`                       |
| `reconnected`        | Auto-reconnect succeeded                       | `void`                                 |
| `signalingerror`     | Signaling request failed                       | `{ error, request? }`                  |

### Recommended listeners (common)

```typescript
const onState = (state: RtcState) => {
  console.log('State changed:', state);
};

const onError = (error: string) => {
  console.error('Error:', error);
};

instance.on('state', onState);
instance.on('error', onError);
```

## 2) Playback Events (only `RtcPlayer`)

| Event        | Description                          | Payload type        |
| ------------ | ------------------------------------ | ------------------- |
| `track`      | Remote media stream arrived          | `{ stream, event }` |
| `mediaready` | Media element entered playable state | `{ stream }`        |

### Recommended listeners (playback)

```typescript
const onRemoteTrack = (payload: { stream: MediaStream; event: RTCTrackEvent }) => {
  videoEl.srcObject = payload.stream;
};

player.on('track', onRemoteTrack);
```

## 3) Publishing Events (only `RtcPublisher`)

| Event                  | Description                           | Payload type                            |
| ---------------------- | ------------------------------------- | --------------------------------------- |
| `streamstart`          | Publishing has started                | `{ stream }`                            |
| `streamstop`           | Publishing has stopped                | `void`                                  |
| `streamingstatechange` | Publishing state changed              | `'idle' \| 'connecting' \| 'streaming'` |
| `sourcechange`         | Capture source switched               | `MediaSource`                           |
| `permissiondenied`     | Media permission was denied           | `{ source, error: Error }`              |
| `track`                | Remote media stream arrived (echo)    | `{ stream, event }`                     |
| `trackended`           | Local track ended                     | `{ track, stream, reason: 'ended' }`    |
| `trackmutechanged`     | Local track mute/unmute state changed | `{ track, muted: boolean }`             |

### Recommended listeners (publishing)

```typescript
publisher.on('streamstart', ({ stream }) => {
  console.log('Publishing started', stream);
});

publisher.on('permissiondenied', ({ source, error }) => {
  console.warn('Permission denied:', source, error);
});
```

## Listener patterns

```typescript
const onTrack = (payload: { stream: MediaStream }) => {
  console.log('Remote stream received', payload.stream);
};

player.on('track', onTrack);

// Listen once
player.once('error', (error) => {
  console.error('Error:', error);
});

// Remove listener
player.off('track', onTrack);
```

## Best practices

- Design listeners by layers first (common / playback / publishing) to avoid mixed responsibilities
- Map `state` into your app state machine (connecting, connected, reconnecting, failed)
- Standardize `error` classification and reporting
- For `permissiondenied`, provide actionable guidance (browser permissions, retry path)

See [RtcState](../api/state).
