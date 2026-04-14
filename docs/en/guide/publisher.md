---
title: WebRTC Engine - Publishing Guide
description: Build stable publishing workflows with RtcPublisher, including source configuration, switching, and lifecycle control.
---

# Publishing Guide

`RtcPublisher` publishes local media (camera, microphone, screen, or custom streams) to your WebRTC backend.

This guide focuses on practical publishing workflows, source switching, and production-oriented operational patterns.

## Basic Usage

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Publishing started'));
publisher.on('sourcechange', (source) => console.log('Source changed:', source.type));
publisher.on('permissiondenied', ({ error }) => {
  console.error('Permission denied:', error.message);
});

await publisher.start();
```

## Media Source Types

```typescript
// Camera (optionally with microphone)
{ type: 'camera', audio: true }

// Microphone (audio-only publishing)
{ type: 'microphone' }

// Screen sharing (optionally with system audio)
{ type: 'screen', audio: true }

// Custom stream
{ type: 'custom', stream: existingMediaStream }
```

## Switch Source During Publishing

You can switch capture sources without recreating the publishing session:

```typescript
await publisher.switchSource({ type: 'screen', audio: true });
```

## Lifecycle Management

```typescript
await publisher.start(); // Start publishing
publisher.stop(); // Stop publishing
publisher.destroy(); // Release resources and destroy instance
```

## Access Current Local Stream

```typescript
const stream = publisher.getStream();

if (stream) {
  console.log('Video tracks:', stream.getVideoTracks().length);
  console.log('Audio tracks:', stream.getAudioTracks().length);
}
```

## Best Practices

1. **Handle permission denial explicitly**: Listen to `permissiondenied` and provide clear user guidance
2. **Always clean up lifecycle resources**: Call `destroy()` when page/component is disposed
3. **Use HTTPS in production**: Media capture and WebRTC capabilities require secure contexts
4. **Invest in observability**: Combine `state`, `error`, and `sourcechange` for diagnostics

See [RtcPublisher API](../api/publisher) and [Plugin System](../plugins/system).
