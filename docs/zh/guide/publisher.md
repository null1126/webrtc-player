---
title: WebRTC Engine - 推流指南
description: 使用 RtcPublisher 构建稳定推流链路，涵盖采集源配置、切换与生命周期管理。
---

# 推流指南

`RtcPublisher` 用于将本地媒体（摄像头、麦克风、屏幕或自定义流）发布到 WebRTC 服务端。

本文重点介绍推流流程、媒体源切换方式以及工程化注意事项。

## 基础用法

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('推流开始'));
publisher.on('sourcechange', (source) => console.log('输入源变更:', source.type));
publisher.on('permissiondenied', ({ error }) => {
  console.error('权限被拒绝:', error.message);
});

await publisher.start();
```

## 媒体源类型

```typescript
// 摄像头（可选采集麦克风）
{ type: 'camera', audio: true }

// 麦克风（纯音频推流）
{ type: 'microphone' }

// 屏幕录制（可选系统音频）
{ type: 'screen', audio: true }

// 自定义媒体流
{ type: 'custom', stream: existingMediaStream }
```

## 推流中切换输入源

在不中断推流会话的情况下切换采集源：

```typescript
await publisher.switchSource({ type: 'screen', audio: true });
```

## 生命周期管理

```typescript
await publisher.start(); // 启动推流
publisher.stop(); // 停止推流
publisher.destroy(); // 释放资源并销毁实例
```

## 获取当前本地流

```typescript
const stream = publisher.getStream();

if (stream) {
  console.log('视频轨道数:', stream.getVideoTracks().length);
  console.log('音频轨道数:', stream.getAudioTracks().length);
}
```

## 最佳实践

1. **显式处理权限拒绝**：监听 `permissiondenied` 并提供明确交互引导
2. **遵循生命周期清理**：页面卸载或组件销毁时调用 `destroy()`
3. **生产环境使用 HTTPS**：浏览器对媒体采集与 WebRTC 能力有安全上下文要求
4. **可观测性建设**：结合 `state`、`error`、`sourcechange` 建立链路诊断日志

详见 [RtcPublisher API](../api/publisher) 与 [插件系统](../plugins/system)。
