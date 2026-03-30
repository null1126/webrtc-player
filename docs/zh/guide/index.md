---
title: WebRTC Player - 简介
description: WebRTC Player 是一个轻量级的 WebRTC 视频播放器库，支持拉流与推流。
---

# 简介

WebRTC Player 是一个轻量级的 WebRTC 视频播放器库，支持**拉流**与**推流**。

## 特性

- **拉流与推流** - 同时支持播放和发布
- **协议兼容** - 支持 SRS、ZLMediaKit、monibuca 等
- **事件驱动** - 完整的事件系统
- **多源采集** - 摄像头、麦克风、屏幕录制
- **高性能** - 无额外依赖，体积小
- **跨平台** - 支持 Chrome、Firefox、Safari、Edge

## 安装

```bash
pnpm add @webrtc-player/core
```

## 架构

```
┌─────────────────────────────────────┐
│            WebRTC Player            │
├───────────────┬─────────────────────┤
│   RtcPlayer  │   RtcPublisher      │
│    (拉流)     │      (推流)          │
└───────────────┴─────────────────────┘
```

## 浏览器支持

Chrome 56+ / Firefox 44+ / Safari 11+ / Edge 79+

## 许可证

MIT
