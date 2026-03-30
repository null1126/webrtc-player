---
title: WebRTC Player - RtcPlayer API
description: RtcPlayer playback player core class API documentation.
---

# RtcPlayer

Playback player core class.

## Constructor

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

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

### destroy()

Destroy instance.

```typescript
player.destroy();
```

## Events

| Event   | Description            |
| ------- | ---------------------- |
| `track` | Remote stream received |
| `state` | Connection state       |
| `error` | Error                  |

## Usage Example

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player.on('track', ({ stream }) => (video.srcObject = stream));
player.on('state', (state) => console.log(state));
player.play();
```
