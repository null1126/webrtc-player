---
title: WebRTC Engine - 切换视频源
description: 播放过程中动态切换视频源，并保留状态监听与错误处理。
---

# 切换视频源

## 基本用法

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

## 完整示例

```typescript
import { RtcPlayer, RtcState } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  if (state === RtcState.SWITCHING) {
    console.log('正在切换流...');
  }
  if (state === RtcState.SWITCHED) {
    console.log('切换完成');
  }
});

player.on('error', (error) => {
  console.error('切换失败:', error);
});

await player.play();

// 3 秒后切换到另一路流
setTimeout(async () => {
  await player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## 注意事项

1. 切换期间通常会触发 `SWITCHING` → `SWITCHED`
2. 底层会自动关闭旧连接并建立新连接
3. 建议结合 `error` 事件做失败重试或降级提示
