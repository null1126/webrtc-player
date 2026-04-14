---
title: WebRTC Engine - Switch Stream
description: Dynamically switch playback sources with state and error handling.
---

# Switch Stream

## Basic Usage

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

## Full Example

```typescript
import { RtcPlayer, RtcState } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  if (state === RtcState.SWITCHING) {
    console.log('Switching stream...');
  }
  if (state === RtcState.SWITCHED) {
    console.log('Switched');
  }
});

player.on('error', (error) => {
  console.error('Switch failed:', error);
});

await player.play();

// Switch after 3 seconds
setTimeout(async () => {
  await player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## Notes

1. Switching usually triggers `SWITCHING` → `SWITCHED`
2. The old connection is closed and a new one is created automatically
3. Handle `error` to implement retries or graceful fallback UI
