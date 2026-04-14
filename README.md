# WebRTC Engine

[English](./README_en.md) · [简体中文](./README.md) · [Demo](https://github.com/null1126/webrtc-engine) · [文档](https://null1126.github.io/webrtc-engine/zh/)

一款轻量级、框架无关的 WebRTC 视频库，支持浏览器端实时视频播放与推流。**一库双用**：既可拉流播放，也可推流发布。

---

## 特性

- **拉流与推流** — 一库双用：订阅 WebRTC 视频流，或发布摄像头/麦克风/屏幕录制
- **框架无关** — 适用于 React、Vue、Angular 或原生 TypeScript/JavaScript
- **TypeScript 优先** — 完整的 TypeScript 类型定义，开箱即用
- **事件驱动** — 完整的事件生命周期，实时管理连接状态
- **自定义信令** — 内置 HTTP 信令提供者；通过 `SignalingProvider` 接口可对接任意信令服务器
- **多源采集** — 支持摄像头、麦克风、屏幕录制、自定义 MediaStream
- **流切换** — 无需重建播放器实例即可切换视频源
- **连接策略可配置** — 支持自动重连与 ICE 行为配置
- **灵活渲染目标** — 支持 video/audio/canvas 作为目标元素，并可配置静音
- **插件系统** — 通过插件机制扩展播放器，支持日志记录、性能监控等开箱即用功能
- **零外部依赖** — 无第三方运行时依赖，仅使用标准 Web API

---

## 安装

```bash
npm install @webrtc-engine/core
# 或
pnpm add @webrtc-engine/core
# 或
yarn add @webrtc-engine/core
```

---

## 快速开始

### 拉流（播放）

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
  muted: true,
  reconnect: {
    enabled: true,
    maxRetries: 6,
    exponential: true,
  },
  ice: {
    waitForComplete: true,
    gatheringTimeout: 3000,
  },
});

player.on('state', (state) => {
  console.log('连接状态:', state);
});

player.on('track', ({ stream }) => {
  console.log('收到新轨道:', stream);
});

player.on('error', (message) => {
  console.error('播放器错误:', message);
});

await player.play();
```

### 推流（发布）

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
  muted: true,
  reconnect: {
    enabled: true,
    maxRetries: 5,
  },
  ice: {
    waitForComplete: false,
  },
});

publisher.on('streamstart', ({ stream }) => {
  console.log('推流开始:', stream);
});

publisher.on('error', (message) => {
  console.error('推流器错误:', message);
});

await publisher.start();
```

### 媒体源类型

| 类型     | 配置                              | 说明             |
| -------- | --------------------------------- | ---------------- |
| 摄像头   | `{ type: 'camera', audio: true }` | 视频 + 音频      |
| 屏幕录制 | `{ type: 'screen', audio: true }` | 含系统音频       |
| 麦克风   | `{ type: 'microphone' }`          | 仅音频           |
| 自定义流 | `{ type: 'custom', stream }`      | 已有 MediaStream |

### 流切换

```typescript
// 切换拉流地址
await player.switchStream('webrtc://localhost/live/new-stream');

// 切换推流源，无需重建连接
await publisher.switchSource({ type: 'screen', audio: true });
```

---

## API 概览

### `RtcPlayer`（拉流）

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

#### RtcPlayerOptions

| 属性        | 类型                                                        | 必填 | 说明                                    |
| ----------- | ----------------------------------------------------------- | ---- | --------------------------------------- |
| `url`       | `string`                                                    | 是   | WebRTC 流地址                           |
| `api`       | `string`                                                    | 是   | 信令服务器 HTTP/HTTPS 地址              |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | 否   | 渲染目标元素，支持 video/audio/canvas   |
| `muted`     | `boolean`                                                   | 否   | 目标元素是否静音（默认 `true`）         |
| `media`     | `MediaKind`                                                 | 否   | 媒体类型：`'audio'`、`'video'`、`'all'` |
| `signaling` | `SignalingProvider`                                         | 否   | 自定义信令提供者（优先于 `api`）        |
| `config`    | `RTCConfiguration`                                          | 否   | 自定义 RTCConfiguration                 |
| `reconnect` | `ReconnectOptions`                                          | 否   | 自动重连配置                            |
| `ice`       | `IceOptions`                                                | 否   | ICE 行为配置（等待收集完成、收集超时）  |

#### RtcPlayer 方法

| 方法                | 返回值             | 说明                         |
| ------------------- | ------------------ | ---------------------------- |
| `play()`            | `Promise<boolean>` | 开始 WebRTC 连接             |
| `switchStream(url)` | `Promise<void>`    | 切换到新的流地址             |
| `use(plugin)`       | `this`             | 注册并安装插件，支持链式调用 |
| `unuse(name)`       | `this`             | 卸载指定名称的插件           |
| `destroy()`         | `void`             | 销毁播放器                   |

#### RtcPlayer 事件

| 事件                 | 载荷                                                           | 说明                 |
| -------------------- | -------------------------------------------------------------- | -------------------- |
| `state`              | `RtcState`                                                     | 连接状态变更         |
| `track`              | `{ stream: MediaStream; event: RTCTrackEvent }`                | 收到新的媒体轨道     |
| `icecandidate`       | `RTCIceCandidate`                                              | ICE 候选者已收集     |
| `iceconnectionstate` | `RTCIceConnectionState`                                        | ICE 连接状态变更     |
| `icegatheringstate`  | `RTCIceGatheringState`                                         | ICE 收集状态变更     |
| `reconnecting`       | `{ retryCount: number; maxRetries: number; interval: number }` | 正在重连             |
| `reconnectfailed`    | `{ maxRetries: number }`                                       | 重连失败（达到上限） |
| `error`              | `string`                                                       | 播放器发生错误       |

---

### `RtcPublisher`（推流）

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

#### RtcPublisherOptions

| 属性        | 类型                                                        | 必填 | 说明                                  |
| ----------- | ----------------------------------------------------------- | ---- | ------------------------------------- |
| `url`       | `string`                                                    | 是   | WebRTC 流地址                         |
| `api`       | `string`                                                    | 是   | 信令服务器 HTTP/HTTPS 地址            |
| `source`    | `MediaSource`                                               | 是   | 媒体源配置                            |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | 否   | 预览目标元素，支持 video/audio/canvas |
| `muted`     | `boolean`                                                   | 否   | 目标元素是否静音（默认 `true`）       |
| `signaling` | `SignalingProvider`                                         | 否   | 自定义信令提供者                      |
| `config`    | `RTCConfiguration`                                          | 否   | 自定义 RTCConfiguration               |
| `reconnect` | `ReconnectOptions`                                          | 否   | 自动重连配置                          |
| `ice`       | `IceOptions`                                                | 否   | ICE 行为配置                          |

#### RtcPublisher 方法

| 方法                   | 返回值          | 说明       |
| ---------------------- | --------------- | ---------- |
| `start()`              | `Promise<void>` | 开始推流   |
| `switchSource(source)` | `Promise<void>` | 切换媒体源 |
| `stop()`               | `void`          | 停止推流   |
| `destroy()`            | `void`          | 销毁推流器 |

#### RtcPublisher 事件

| 事件               | 载荷                                                           | 说明                 |
| ------------------ | -------------------------------------------------------------- | -------------------- |
| `streamstart`      | `{ stream: MediaStream }`                                      | 推流开始             |
| `streamstop`       | `void`                                                         | 推流停止             |
| `sourcechange`     | `MediaSource`                                                  | 媒体源已切换         |
| `track`            | `{ stream: MediaStream; event: RTCTrackEvent }`                | 收到远端轨道（回显） |
| `permissiondenied` | `{ source: MediaSource; error: Error }`                        | 媒体权限被拒绝       |
| `state`            | `RtcState`                                                     | 连接状态变更         |
| `reconnecting`     | `{ retryCount: number; maxRetries: number; interval: number }` | 正在重连             |
| `reconnectfailed`  | `{ maxRetries: number }`                                       | 重连失败（达到上限） |
| `error`            | `string`                                                       | 推流器发生错误       |

---

### `RtcState` 枚举

```typescript
enum RtcState {
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

## 相关项目

- [webrtc-engine](https://github.com/null1126/webrtc-engine) — 主项目仓库
- [webrtc-engine 文档](https://webrtc-engine.netlify.app/) — 完整文档站点

---

## 插件包

官方维护的插件包，可按需安装：

```bash
npm install @webrtc-engine/plugin-logger @webrtc-engine/plugin-performance
```

### `@webrtc-engine/plugin-logger`

日志插件，记录播放器/推流器生命周期事件（连接状态、ICE 状态、轨道事件、错误等）。

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

### `@webrtc-engine/plugin-performance`

性能监控插件，实时上报 FPS、网络码率、RTT、丢包率等指标。

```typescript
import { createPerformancePlugin } from '@webrtc-engine/plugin-performance';

const perf = createPerformancePlugin({
  onStats: (stats) =>
    console.log('FPS:', stats.fps, '码率:', (stats.bitrate / 1000).toFixed(1), 'kb/s'),
});

player.use(perf);
```

详细用法请参考[插件系统文档](https://null1126.github.io/webrtc-engine/zh/guide/plugins/)。

---

## 许可证

[ISC](./LICENSE) — Copyright (c) 2024-present WebRTC Engine Contributors
