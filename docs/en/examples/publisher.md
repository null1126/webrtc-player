---
title: WebRTC Player - Publishing Examples
description: WebRTC Player publishing examples.
---

# Publishing Examples

## Camera Publishing

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Stream started'));
publisher.start();
```

## Screen Recording

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/screen',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'screen', audio: true },
  video: preview,
});

publisher.on('permissiondenied', ({ error }) => alert('Screen permission denied'));
publisher.start();
```

## Switch Input Source

```typescript
// Start with camera
publisher.start();

// Switch to screen during publishing
publisher.switchSource({ type: 'screen', audio: true });
```

## Notes

1. User permission required for camera/screen access
2. HTTPS required in production
3. Call `publisher.destroy()` on unmount
