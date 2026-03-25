# WebRTCPlayer

The core class of WebRTC Player, used for managing WebRTC connections and video playback.

## Constructor

```typescript
new WebRTCPlayer(options: PlayerOptions)
```

### Parameters

| Parameter | Type            | Required | Description                  |
| --------- | --------------- | -------- | ---------------------------- |
| options   | `PlayerOptions` | Yes      | Player configuration options |

## Methods

### play()

Start playing WebRTC video stream.

```typescript
async play(): Promise<boolean>
```

**Returns**: Returns a Promise, resolves with `true` on success, throws on failure.

**Example**:

```typescript
try {
  await player.play();
  console.log('Playback started');
} catch (error) {
  console.error('Playback failed:', error);
}
```

### switchStream(url)

Switch to a new video stream.

```typescript
async switchStream(url: string): Promise<void>
```

**Parameters**:

| Parameter | Type     | Required | Description      |
| --------- | -------- | -------- | ---------------- |
| url       | `string` | Yes      | New playback URL |

**Example**:

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

### destroy()

Destroy the player instance and release all resources.

```typescript
destroy(): void
```

**Example**:

```typescript
player.destroy();
```

## Events

### on(event, listener)

Listen to the specified event.

```typescript
on<T extends EventType>(event: T, listener: EventListener<T>): this
```

### off(event, listener)

Remove event listener.

```typescript
off<T extends EventType>(event: T, listener: EventListener<T>): this
```

### once(event, listener)

Listen to an event only once.

```typescript
once<T extends EventType>(event: T, listener: EventListener<T>): this
```

## Example

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// Listen to events
player.on('track', ({ stream }) => {
  console.log('Stream received');
});

player.on('state', (state) => {
  console.log('State:', state);
});

player.on('error', (error) => {
  console.error('Error:', error);
});

// Start playback
player.play();

// Switch stream
player.switchStream('webrtc://localhost/live/newstream');

// Destroy
player.destroy();
```

## Type Definitions

```typescript
export type EventType = keyof PlayerEvents;

export interface PlayerEvents {
  track: { stream: MediaStream; event: RTCTrackEvent };
  state: StateEnum;
  error: string;
  icecandidate: RTCIceCandidate;
  iceconnectionstate: RTCIceConnectionState;
  icegatheringstate: RTCIceGatheringState;
}

export type EventListener<T extends EventType> = (data: PlayerEvents[T]) => void;
```
