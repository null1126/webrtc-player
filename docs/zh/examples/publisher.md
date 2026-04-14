---
title: WebRTC Engine - 推流示例
description: 覆盖摄像头、录屏、自定义流、音频推流与动态切换输入源的推流示例。
---

# 推流示例

本页聚焦发布端（`RtcPublisher`）的高频场景：

- 推摄像头 + 麦克风
- 推屏幕录制
- 推麦克风（音频）
- 推自定义 `MediaStream`
- 推流过程中动态切换输入源

## 1) 摄像头 + 麦克风推流

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/camera-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('摄像头推流已开始'));
publisher.on('error', (error) => console.error('推流错误:', error));

await publisher.start();
```

## 2) 屏幕录制推流

```typescript
const screenPublisher = new RtcPublisher({
  url: 'webrtc://localhost/live/screen-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'screen', audio: true },
  target: document.getElementById('screen-preview') as HTMLVideoElement,
});

screenPublisher.on('permissiondenied', () => {
  alert('屏幕录制权限被拒绝');
});

await screenPublisher.start();
```

## 3) 麦克风音频推流（渲染到 audio）

```typescript
const micPublisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mic-stream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'microphone' },
  target: document.getElementById('mic-preview') as HTMLAudioElement,
});

await micPublisher.start();
```

## 4) 自定义流推流（custom MediaStream）

当你已拥有业务侧合成流（例如 Canvas 采集、混流或 WebAudio 处理后流）时，可直接推送：

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

## 5) 推流中动态切换输入源

```typescript
// 先以摄像头开始
await publisher.start();

// 切换到屏幕录制
await publisher.switchSource({ type: 'screen', audio: true });

// 切回摄像头
await publisher.switchSource({ type: 'camera', audio: true });
```

## 实践建议

1. 首次采集需要用户授权，建议先做权限预检查与错误提示
2. 生产环境请使用 HTTPS，避免浏览器阻止设备访问
3. 页面卸载/组件销毁时调用 `publisher.destroy()` 释放资源
4. 对于自定义流，建议在停止推流后同步停止本地 `MediaStreamTrack`
