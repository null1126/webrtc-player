---
title: WebRTC Player - Switch Stream
description: Dynamically switch video sources during playback.
---

# Switch Stream

## Basic Usage

```typescript
player.switchStream('webrtc://localhost/live/newstream');
```

## Example

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player.on('state', (state) => {
  if (state === RtcState.SWITCHED) {
    console.log('Switched');
  }
});

player.play();

// Switch to another source after 3 seconds
setTimeout(() => {
  player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## Notes

1. Triggers `SWITCHING` → `SWITCHED` state during switching
2. Automatically closes old connection and creates new one
