---
title: WebRTC Engine - 基础示例
description: 覆盖 video/audio/canvas 渲染与手动绑定流的基础播放示例。
---

# 基础示例

本页展示拉流场景最常用的几种写法：

- 渲染到 `video`
- 渲染到 `audio`（纯音频）
- 渲染到 `canvas`
- 手动绑定 `MediaStream`

## 1) 渲染到 video

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

player.on('state', (state) => console.log('播放状态:', state));
player.on('error', (error) => console.error('播放错误:', error));

await player.play();
```

## 2) 渲染到 audio（音频流）

适用于语音直播、对讲、音频监控等场景。

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

## 3) 渲染到 canvas（用于叠加绘制）

当 `target` 为 `canvas` 时，可在业务层自行叠加水印、框选、字幕等。

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

## 4) 手动绑定流（完全自定义渲染）

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

## 相关示例

- [切换视频源](./switch-stream)
- [推流示例](./publisher)
