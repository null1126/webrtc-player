---
title: WebRTC Player - 推流指南
description: WebRTC Player 推流功能详解，包括摄像头、屏幕录制、输入源切换。
---

# 推流指南

`RtcPublisher` 用于将本地摄像头、麦克风或屏幕内容推送到流媒体服务器。

## 基础用法

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('推流开始'));
publisher.on('sourcechange', (s) => console.log('输入源:', s.type));
publisher.on('permissiondenied', ({ error }) => alert(error.message));

publisher.start();
```

## 媒体源类型

```typescript
// 摄像头
{ type: 'camera', audio: true }

// 麦克风
{ type: 'microphone' }

// 屏幕录制
{ type: 'screen', audio: true }

// 自定义流
{ type: 'custom', stream: existingMediaStream }
```

## 输入源切换

```typescript
// 推流中动态切换，无需重建连接
publisher.switchSource({ type: 'screen', audio: true });
```

## 生命周期

```typescript
publisher.start(); // 开始推流
publisher.stop(); // 停止推流
publisher.destroy(); // 销毁实例
```

## 获取本地流

```typescript
const stream = publisher.getStream();
if (stream) {
  console.log(stream.getVideoTracks().length); // 视频轨道数
  console.log(stream.getAudioTracks().length); // 音频轨道数
}
```

## 最佳实践

1. **处理权限拒绝** - 监听 `permissiondenied` 事件
2. **清理资源** - 组件卸载时调用 `destroy()`
3. **使用 HTTPS** - 生产环境必须使用 HTTPS

详见 [推流示例](../examples/publisher) 和 [RtcPublisher API](../api/publisher)。
