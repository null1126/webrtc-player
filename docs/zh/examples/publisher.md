---
title: WebRTC Player - 推流示例
description: WebRTC Player 推流功能示例。
---

# 推流示例

## 摄像头推流

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('推流开始'));
publisher.start();
```

## 屏幕录制推流

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/screen',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'screen', audio: true },
  video: preview,
});

publisher.on('permissiondenied', ({ error }) => alert('屏幕录制权限被拒绝'));
publisher.start();
```

## 切换输入源

```typescript
// 开始用摄像头推流
publisher.start();

// 动态切换到屏幕录制
publisher.switchSource({ type: 'screen', audio: true });
```

## 注意事项

1. 首次使用需要用户授权摄像头/屏幕
2. 生产环境必须使用 HTTPS
3. 组件卸载时调用 `publisher.destroy()`
