---
title: WebRTC Player - Basic Usage
description: WebRTC Player basic examples.
---

# Basic Usage

## HTML

```html
<video id="video" controls muted></video>
```

## Player

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('track', ({ stream }) => console.log('Stream received'));
player.on('state', (state) => console.log('State:', state));
player.on('error', (error) => console.error('Error:', error));

player.play();
```

## Manual Stream Binding

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});

player.on('track', ({ stream }) => {
  video.srcObject = stream;
  video.play();
});

player.play();
```
