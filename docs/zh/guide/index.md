# 简介

WebRTC Player 是一个轻量级的 WebRTC 视频播放器库，专注于实时视频流的播放。

## 特性

- **简单易用**：简洁的 API 设计，几行代码即可实现 WebRTC 视频播放
- **协议兼容**：支持 WebRTC 协议，可与主流流媒体服务器配合使用
- **事件驱动**：完整的事件系统，实时监听连接状态和错误信息
- **高性能**：轻量级实现，无额外依赖，运行效率高
- **跨平台**：基于标准 Web API，支持所有现代浏览器
- **流切换**：支持动态切换视频源，无需重建播放器实例

## 安装

```bash
# 使用 pnpm
pnpm add @webrtc-player/core

# 使用 npm
npm install @webrtc-player/core

# 使用 yarn
yarn add @webrtc-player/core
```

## 基本使用

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// 监听事件
player.on('track', ({ stream }) => {
  console.log('Received stream:', stream);
});

player.on('state', (state) => {
  console.log('Connection state:', state);
});

// 开始播放
player.play();
```

## 工作原理

WebRTC Player 通过以下步骤实现视频播放：

1. **创建 PeerConnection**：建立 WebRTC 对等连接
2. **添加音视频轨道**：配置收发音视频数据
3. **SDP 交换**：通过信令服务器交换会话描述协议
4. **媒体流接收**：接收并播放远程音视频流

## 浏览器支持

| 浏览器  | 支持版本 |
| ------- | -------- |
| Chrome  | 56+      |
| Firefox | 44+      |
| Safari  | 11+      |
| Edge    | 79+      |

## 许可证

本项目基于 MIT 许可证开源。
