# Events

WebRTC Player provides a complete event system for monitoring player state changes.

## Event List

### track

Triggered when a remote audio/video stream is received.

```typescript
player.on('track', ({ stream, event }) => {
  // stream: MediaStream object
  // event: RTCTrackEvent object
  console.log('Received stream:', stream);
});
```

### state

Triggered when the connection state changes.

```typescript
player.on('state', (state: StateEnum) => {
  console.log('Connection state:', state);
});
```

For state values, see [StateEnum](../api/state).

### error

Triggered when an error occurs.

```typescript
player.on('error', (error: string) => {
  console.error('Player error:', error);
});
```

### icecandidate

Triggered when an ICE candidate is gathered.

```typescript
player.on('icecandidate', (candidate: RTCIceCandidate) => {
  console.log('ICE candidate:', candidate);
});
```

### iceconnectionstate

Triggered when the ICE connection state changes.

```typescript
player.on('iceconnectionstate', (state: RTCIceConnectionState) => {
  console.log('ICE connection state:', state);
  // Possible values: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed'
});
```

### icegatheringstate

Triggered when the ICE gathering state changes.

```typescript
player.on('icegatheringstate', (state: RTCIceGatheringState) => {
  console.log('ICE gathering state:', state);
  // Possible values: 'new' | 'gathering' | 'complete'
});
```

## Event Listener Methods

### on

Listen to an event.

```typescript
player.on('track', handler);
```

### off

Remove event listener.

```typescript
player.off('track', handler);
```

### once

Listen to an event only once.

```typescript
player.once('track', handler);
```

## Example: Complete Event Listening

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// Listen to all events
player.on('track', ({ stream }) => {
  console.log('Received audio/video stream');
});

player.on('state', (state) => {
  console.log('Connection state:', state);

  // Update UI based on state
  if (state === StateEnum.CONNECTED) {
    console.log('Playback started');
  } else if (state === StateEnum.FAILED) {
    console.log('Connection failed');
  }
});

player.on('error', (error) => {
  console.error('Error:', error);
});

player.on('iceconnectionstate', (iceState) => {
  console.log('ICE connection state:', iceState);
});

player.on('icegatheringstate', (gatheringState) => {
  console.log('ICE gathering state:', gatheringState);
});

// Start playback
player.play();
```

## Event State Machine

```
                    ┌──────────────┐
                    │  CONNECTING  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌──────────┐              ┌──────────┐
       │ CONNECTED │              │  FAILED  │
       └─────┬─────┘              └──────────┘
             │
             │ ◄──────────────┐
             │                │
             ▼                │
       ┌──────────────┐       │
       │ DISCONNECTED │───────┘
       └──────┬───────┘
              │
              ▼
       ┌──────────┐
       │  CLOSED  │
       └──────────┘
```

## Notes

1. Make sure to set up all event listeners before calling the `play()` method
2. Remember to call the `destroy()` method to clean up resources when the component unmounts
3. Error handling is important, it's recommended to always listen to the `error` event
4. ICE related events are for debugging and troubleshooting, may not be needed in production
