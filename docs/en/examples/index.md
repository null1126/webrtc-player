---
title: WebRTC Engine - Basic Examples
description: Basic playback examples covering video/audio/canvas rendering and manual stream binding.
---

# Basic Examples

This page covers common playback patterns:

- Render to `video`
- Render to `audio` (audio-only)
- Render to `canvas`
- Bind `MediaStream` manually

## 1) Render to video

```html
<video id="video" controls playsinline muted></video>
```

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => console.log('Playback state:', state));
player.on('error', (error) => console.error('Playback error:', error));

await player.play();
```

## 2) Render to audio (audio-only streams)

Useful for voice rooms, intercom, and audio monitoring.

```html
<audio id="audio" controls autoplay></audio>
```

```typescript
const audioPlayer = new RtcPlayer({
  url: 'webrtc://localhost/live/audio-only',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('audio') as HTMLAudioElement,
});

await audioPlayer.play();
```

## 3) Render to canvas (for overlays)

When `target` is a canvas, you can layer custom drawing (watermarks, regions, subtitles) in your app.

```html
<canvas id="canvas" width="1280" height="720"></canvas>
```

```typescript
const canvasPlayer = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('canvas') as HTMLCanvasElement,
});

await canvasPlayer.play();
```

## 4) Manual stream binding (fully custom rendering)

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});

const video = document.getElementById('video') as HTMLVideoElement;

player.on('track', ({ stream }) => {
  video.srcObject = stream;
  void video.play();
});

await player.play();
```

## Related Examples

- [Switch Stream](./switch-stream)
- [Publishing Examples](./publisher)
