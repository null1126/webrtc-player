---
title: WebRTC Player - 切换视频源
description: 播放过程中动态切换视频源。
---

# 切换视频源

## 基本用法

```typescript
player.switchStream('webrtc://localhost/live/newstream');
```

## 示例

```typescript
const player = new RtcPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player.on('state', (state) => {
  if (state === RtcState.SWITCHED) {
    console.log('切换完成');
  }
});

player.play();

// 切换到另一个视频源
setTimeout(() => {
  player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## 注意事项

1. 切换期间会触发 `SWITCHING` → `SWITCHED` 状态
2. 切换时自动关闭旧连接，建立新连接
