---
title: WebRTC Player - 基础用法
description: WebRTC Player 基础示例。
---

# 基础用法

## HTML

```html
<video id="video" controls muted></video>
```

## 播放器

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('track', ({ stream }) => console.log('收到流'));
player.on('state', (state) => console.log('状态:', state));
player.on('error', (error) => console.error('错误:', error));

player.play();
```

## 手动绑定流

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
