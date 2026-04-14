---
title: WebRTC Engine - 快速开始
description: 通过最小示例快速完成 WebRTC Engine 的播放与推流接入，并掌握主流框架集成方式。
---

# 快速开始

本页提供一条面向生产实践的最短接入路径：先完成播放/推流最小闭环，再按需接入框架层封装。

## 环境要求

在开始前，请确认以下条件：

- 现代浏览器（Chrome 56+、Firefox 44+、Safari 11+、Edge 79+）
- 生产环境使用 HTTPS，开发环境可使用 `localhost`
- 流媒体服务端支持 WebRTC（如 SRS、ZLMediaKit、monibuca）

## 安装

推荐使用与你现有工程一致的包管理器，避免锁文件与依赖树混用。

::: code-group

```bash [pnpm]
pnpm add @webrtc-engine/core
```

```bash [npm]
npm install @webrtc-engine/core
```

```bash [yarn]
yarn add @webrtc-engine/core
```

:::

## 拉流（播放）

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

## 推流（发布）

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('推流已开始'));
publisher.on('error', (error) => console.error('推流错误:', error));

await publisher.start();
```

## 支持的媒体源

| 类型     | 配置                              | 说明               |
| -------- | --------------------------------- | ------------------ |
| 摄像头   | `{ type: 'camera', audio: true }` | 视频 + 音频        |
| 屏幕录制 | `{ type: 'screen', audio: true }` | 可携带系统音频     |
| 麦克风   | `{ type: 'microphone' }`          | 仅采集音频         |
| 自定义流 | `{ type: 'custom', stream }`      | 已有 `MediaStream` |

## 框架集成

- [React 集成](./frameworks/react)
- [Vue 集成](./frameworks/vue)

## 工程建议

- 在业务层统一封装播放器/推流器生命周期，避免实例泄漏
- 基于 `state` 与 `error` 事件建立可观测日志
- 推流前优先进行权限预检，并对拒绝场景做清晰提示

## 下一步

- [事件监听](./events) - 了解完整事件模型
- [推流指南](./publisher) - 掌握媒体源切换与采集控制
- [自定义信令](./custom-signaling) - 对接企业内网或自定义网关
- [API 文档](../api/) - 查看全部配置项
