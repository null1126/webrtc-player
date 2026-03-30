---
title: WebRTC Player - 快速开始
description: 快速集成 WebRTC Player 到你的项目中，支持拉流播放和推流发布。
---

# 快速开始

## 环境要求

- 现代浏览器（Chrome 56+、Firefox 44+、Safari 11+、Edge 79+）
- 支持 HTTPS（生产环境）或 localhost（开发环境）
- 流媒体服务器支持 WebRTC 协议（SRS、ZLMediaKit、monibuca 等）

## 安装

```bash
pnpm add @webrtc-player/core
# 或
npm install @webrtc-player/core
```

## 拉流（播放）

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => console.log('状态:', state));
player.on('error', (error) => console.error('错误:', error));

player.play();
```

## 推流（发布）

```typescript
import { RtcPublisher } from '@webrtc-player/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('推流开始'));
publisher.on('error', (error) => console.error('错误:', error));

publisher.start();
```

## 支持的媒体源

| 类型     | 配置                              | 说明             |
| -------- | --------------------------------- | ---------------- |
| 摄像头   | `{ type: 'camera', audio: true }` | 视频 + 音频      |
| 屏幕录制 | `{ type: 'screen', audio: true }` | 含系统音频       |
| 麦克风   | `{ type: 'microphone' }`          | 仅音频           |
| 自定义流 | `{ type: 'custom', stream }`      | 已有 MediaStream |

## React 使用

```typescript
// 拉流
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

// 推流
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

## Vue 使用

```vue
<!-- 拉流 -->
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
<!-- 推流 -->
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

## 下一步

- [事件监听](./events) - 了解更多事件类型
- [推流指南](./publisher) - 摄像头/屏幕推流
- [API 文档](../api/) - 配置选项详解
