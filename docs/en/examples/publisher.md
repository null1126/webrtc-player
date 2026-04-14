---
title: WebRTC Engine - Publishing Examples
description: Publishing examples for camera, screen sharing, custom streams, audio-only workflows, and source switching.
---

# Publishing Examples

This page focuses on common `RtcPublisher` scenarios:

- Publish camera + microphone
- Publish screen sharing
- Publish microphone-only audio
- Publish custom `MediaStream`
- Switch media source during publishing

## 1) Camera + microphone publishing

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/camera-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Camera publishing started'));
publisher.on('error', (error) => console.error('Publishing error:', error));

await publisher.start();
```

## 2) Screen sharing publishing

```typescript
const screenPublisher = new RtcPublisher({
  url: 'webrtc://localhost/live/screen-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'screen', audio: true },
  target: document.getElementById('screen-preview') as HTMLVideoElement,
});

screenPublisher.on('permissiondenied', () => {
  alert('Screen capture permission denied');
});

await screenPublisher.start();
```

## 3) Microphone-only publishing (render to audio)

```typescript
const micPublisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mic-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'microphone' },
  target: document.getElementById('mic-preview') as HTMLAudioElement,
});

await micPublisher.start();
```

## 4) Custom stream publishing (`custom` MediaStream)

If your app already has a composed stream (e.g., canvas capture, mixed tracks, or WebAudio-processed output), publish it directly:

```typescript
const customStream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720, frameRate: 30 },
  audio: true,
});

const customPublisher = new RtcPublisher({
  url: 'webrtc://localhost/live/custom-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'custom', stream: customStream },
  target: document.getElementById('preview') as HTMLVideoElement,
});

await customPublisher.start();
```

## 5) Switch media source while publishing

```typescript
// Start with camera
await publisher.start();

// Switch to screen sharing
await publisher.switchSource({ type: 'screen', audio: true });

// Switch back to camera
await publisher.switchSource({ type: 'camera', audio: true });
```

## Best Practices

1. Ask for permissions early and surface clear fallback messages
2. Use HTTPS in production to avoid blocked media-device access
3. Call `publisher.destroy()` on page/component teardown
4. For custom streams, stop local tracks when publishing ends
