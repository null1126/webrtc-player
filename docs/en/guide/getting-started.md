---
title: WebRTC Player - Getting Started
description: Quickly integrate WebRTC Player into your project, supporting both playback and publishing.
---

# Getting Started

## Requirements

- Modern browsers (Chrome 56+, Firefox 44+, Safari 11+, Edge 79+)
- HTTPS support (production) or localhost (development)
- Streaming server with WebRTC support (SRS, ZLMediaKit, monibuca, etc.)

## Installation

```bash
pnpm add @webrtc-player/core
# or
npm install @webrtc-player/core
```

## Playback

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => console.log('State:', state));
player.on('error', (error) => console.error('Error:', error));

player.play();
```

## Publishing

```typescript
import { RtcPublisher } from '@webrtc-player/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Stream started'));
publisher.on('error', (error) => console.error('Error:', error));

publisher.start();
```

## Supported Media Sources

| Type       | Config                            | Description          |
| ---------- | --------------------------------- | -------------------- |
| Camera     | `{ type: 'camera', audio: true }` | Video + audio        |
| Screen     | `{ type: 'screen', audio: true }` | With system audio    |
| Microphone | `{ type: 'microphone' }`          | Audio only           |
| Custom     | `{ type: 'custom', stream }`      | Existing MediaStream |

## React Usage

```typescript
// Playback
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const player = new RtcPlayer({
      url: 'webrtc://localhost/live/livestream',
      api: 'http://localhost:1985/rtc/v1/play/',
      video: videoRef.current,
    });
    player.play();
    return () => player.destroy();
  }, []);

  return <video ref={videoRef} controls muted />;
}

// Publishing
function StreamPublisher() {
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const publisher = new RtcPublisher({
      url: 'webrtc://localhost/live/pushstream',
      api: 'http://localhost:1985/rtc/v1/publish/',
      source: { type: 'camera', audio: true },
      video: previewRef.current,
    });
    publisher.start();
    return () => publisher.destroy();
  }, []);

  return <video ref={previewRef} muted autoPlay playsInline />;
}
```

## Vue Usage

```vue
<!-- Playback -->
<template>
  <video ref="videoRef" controls muted />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RtcPlayer } from '@webrtc-player/core';

const videoRef = ref<HTMLVideoElement | null>(null);
let player: RtcPlayer | null = null;

onMounted(() => {
  player = new RtcPlayer({
    url: 'webrtc://localhost/live/livestream',
    api: 'http://localhost:1985/rtc/v1/play/',
    video: videoRef.value!,
  });
  player.play();
});

onUnmounted(() => {
  player?.destroy();
});
</script>
```

```vue
<!-- Publishing -->
<template>
  <video ref="previewRef" muted autoplay playsinline />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RtcPublisher } from '@webrtc-player/core';

const previewRef = ref<HTMLVideoElement | null>(null);
let publisher: RtcPublisher | null = null;

onMounted(() => {
  publisher = new RtcPublisher({
    url: 'webrtc://localhost/live/pushstream',
    api: 'http://localhost:1985/rtc/v1/publish/',
    source: { type: 'camera', audio: true },
    video: previewRef.value!,
  });
  publisher.start();
});

onUnmounted(() => {
  publisher?.destroy();
});
</script>
```

## Next Steps

- [Events](./events) - Learn about event types
- [Publishing](./publisher) - Camera/screen streaming
- [API Documentation](../api/) - Configuration options
