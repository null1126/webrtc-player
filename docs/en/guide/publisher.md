---
title: WebRTC Player - Publishing Guide
description: WebRTC Player publishing guide including camera, screen recording, and source switching.
---

# Publishing Guide

`RtcPublisher` pushes local camera, microphone or screen content to streaming servers.

## Basic Usage

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Stream started'));
publisher.on('sourcechange', (s) => console.log('Source:', s.type));
publisher.on('permissiondenied', ({ error }) => alert(error.message));

publisher.start();
```

## Media Sources

```typescript
// Camera
{ type: 'camera', audio: true }

// Microphone
{ type: 'microphone' }

// Screen
{ type: 'screen', audio: true }

// Custom stream
{ type: 'custom', stream: existingMediaStream }
```

## Source Switching

```typescript
// Switch during publishing, no need to rebuild connection
publisher.switchSource({ type: 'screen', audio: true });
```

## Lifecycle

```typescript
publisher.start(); // Start publishing
publisher.stop(); // Stop publishing
publisher.destroy(); // Destroy instance
```

## Get Local Stream

```typescript
const stream = publisher.getStream();
if (stream) {
  console.log(stream.getVideoTracks().length); // Video track count
  console.log(stream.getAudioTracks().length); // Audio track count
}
```

## Best Practices

1. **Handle permission denied** - Listen to `permissiondenied` event
2. **Clean up resources** - Call `destroy()` on unmount
3. **Use HTTPS** - Required in production

See [Publishing Examples](../examples/publisher) and [RtcPublisher API](../api/publisher).
