# WebRTC Player

[English](./README.md) · [简体中文](./README_zh.md) · [Demo](https://github.com/null1126/webrtc-player) · [文档](https://github.com/null1126/webrtc-player)

一款轻量级、框架无关的 WebRTC 视频流播放器，专为浏览器端实时视频播放设计。

---

## 特性

- **框架无关** — 可与任意 JavaScript 框架或原生 TypeScript/JavaScript 配合使用
- **TypeScript 优先** — 完整的 TypeScript 类型定义，随包附带
- **事件驱动** — 灵活的事件发射器 API，实时管理播放器状态
- **信令服务器集成** — 内置 HTTP 信令服务器通信模块
- **流切换** — 无需重建播放器实例即可切换到不同的视频源
- **自动绑定 Video 元素** — 可选传入 `<video>` 元素，播放器自动处理所有绑定逻辑
- **零外部依赖** — 无第三方依赖，仅使用标准 Web API

---

## 安装

```bash
npm install @webrtc-player/core
# 或
pnpm add @webrtc-player/core
# 或
yarn add @webrtc-player/core
```

---

## 快速开始

### 基本用法

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost:8080/live/stream',
  api: 'http://localhost:8080',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  console.log('连接状态:', state);
});

player.on('track', ({ stream, event }) => {
  console.log('收到新轨道:', stream);
});

player.on('error', (message) => {
  console.error('播放器错误:', message);
});

await player.play();
```

### 流切换

```typescript
// 无需重建播放器即可切换到另一个流
await player.switchStream('webrtc://localhost:8080/live/new-stream');
```

### 手动处理视频流

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost:8080/live/stream',
  api: 'http://localhost:8080',
  // 不传入 video 元素，手动处理流
});

player.on('track', ({ stream }) => {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  document.body.appendChild(video);
});

await player.play();
```

---

## API 概览

### `WebRTCPlayer`

```typescript
new WebRTCPlayer(options: PlayerOptions)
```

#### PlayerOptions

| 属性    | 类型               | 必填 | 说明                       |
| ------- | ------------------ | ---- | -------------------------- |
| `url`   | `string`           | 是   | WebRTC 流地址              |
| `api`   | `string`           | 是   | 信令服务器 HTTP/HTTPS 地址 |
| `video` | `HTMLVideoElement` | 否   | 视频元素，传入后自动绑定流 |

#### 方法

| 方法                        | 返回值             | 说明                 |
| --------------------------- | ------------------ | -------------------- |
| `play()`                    | `Promise<boolean>` | 开始 WebRTC 连接     |
| `switchStream(url: string)` | `Promise<void>`    | 切换到新的流地址     |
| `destroy()`                 | `void`             | 销毁播放器并释放资源 |

#### 事件

| 事件                 | 载荷                                            | 说明             |
| -------------------- | ----------------------------------------------- | ---------------- |
| `state`              | `StateEnum`                                     | 连接状态变更     |
| `track`              | `{ stream: MediaStream; event: RTCTrackEvent }` | 收到新的媒体轨道 |
| `icecandidate`       | `RTCIceCandidate`                               | ICE 候选者已收集 |
| `iceconnectionstate` | `string`                                        | ICE 连接状态变更 |
| `icegatheringstate`  | `string`                                        | ICE 收集状态变更 |
| `error`              | `string`                                        | 播放器发生错误   |

#### StateEnum

```typescript
enum StateEnum {
  CONNECTING = 'connecting', // 连接中
  CONNECTED = 'connected', // 已连接
  DISCONNECTED = 'disconnected', // 已断开
  FAILED = 'failed', // 连接失败
  CLOSED = 'closed', // 连接关闭
  SWITCHING = 'switching', // 切换中
  SWITCHED = 'switched', // 切换成功
  DESTROYED = 'destroyed', // 已销毁
}
```

---

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 本地开发

```bash
# 安装依赖
pnpm install

# 构建核心包
pnpm build

# 启动所有工作区（核心库开发 + 示例应用）
pnpm dev

# 运行代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 类型检查
pnpm typecheck
```

### 文档

项目文档基于 [VitePress](https://vitepress.dev) 构建：

```bash
# 启动文档开发服务器
pnpm docs:dev

# 构建生产环境文档
pnpm docs:build

# 预览构建后的文档
pnpm docs:preview
```

---

## 相关项目

- [webrtc-player](https://github.com/null1126/webrtc-player) — 主项目仓库
- [webrtc-player 文档](https://github.com/null1126/webrtc-player) — 完整文档站点

---

## 许可证

[ISC](./LICENSE) — Copyright (c) 2024-present WebRTC Player Contributors
