---
title: WebRTC Engine - RtcPlayer API
description: RtcPlayer 拉流播放器核心类 API 文档。
---

# RtcPlayer

拉流播放器核心类。

## 构造函数

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

## 配置项（RtcPlayerOptions）

### 属性

| 属性        | 类型                                                        | 必填 | 说明                                         |
| ----------- | ----------------------------------------------------------- | ---- | -------------------------------------------- |
| `url`       | `string`                                                    | 是   | WebRTC 播放地址                              |
| `api`       | `string`                                                    | 是   | 信令服务器地址                               |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | 否   | 渲染目标元素（video/audio/canvas）           |
| `muted`     | `boolean`                                                   | 否   | 目标元素是否静音，默认 `true`                |
| `media`     | `'audio' \| 'video' \| 'all'`                               | 否   | 媒体类型，默认 `all`                         |
| `config`    | `RTCConfiguration`                                          | 否   | WebRTC 连接配置                              |
| `reconnect` | `ReconnectOptions`                                          | 否   | 自动重连配置                                 |
| `ice`       | `IceOptions`                                                | 否   | ICE 行为配置（是否等待收集完成、收集超时等） |

### ReconnectOptions

| 属性                  | 类型      | 必填 | 说明                                                    |
| --------------------- | --------- | ---- | ------------------------------------------------------- |
| `enabled`             | `boolean` | 否   | 是否开启自动重连，默认 `false`                          |
| `maxRetries`          | `number`  | 否   | 最大重试次数，默认 `5`                                  |
| `interval`            | `number`  | 否   | 重试间隔（ms），指数退避时为初始间隔，默认 `2000`       |
| `exponential`         | `boolean` | 否   | 是否启用指数退避，默认 `false`                          |
| `maxInterval`         | `number`  | 否   | 重试最大间隔（ms）                                      |
| `jitterRatio`         | `number`  | 否   | 随机抖动比例（0~1）                                     |
| `disconnectedTimeout` | `number`  | 否   | 进入 `disconnected` 后的兜底重连延迟（ms），默认 `5000` |

### IceOptions

| 属性               | 类型      | 必填 | 说明                                           |
| ------------------ | --------- | ---- | ---------------------------------------------- |
| `waitForComplete`  | `boolean` | 否   | 是否等待 ICE 收集完成后再交换 SDP，默认 `true` |
| `gatheringTimeout` | `number`  | 否   | ICE 收集超时时间（ms），默认 `3000`            |

## 方法

### play() <Badge type="tip" text="异步" />

开始拉流。

```typescript
await player.play();
```

### switchStream(url) <Badge type="tip" text="异步" />

切换拉流地址。

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

### use(plugin) <Badge type="tip" text="同步" />

注册并安装插件，返回实例自身，支持链式调用。

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

详细用法请参考[插件系统](../guide/plugins)。

### unuse(name) <Badge type="tip" text="同步" />

卸载指定名称的插件。

```typescript
player.unuse('player-logger');
```

### destroy()

销毁实例。

```typescript
player.destroy();
```

## 事件

| 事件                 | 说明                                       |
| -------------------- | ------------------------------------------ |
| `track`              | 收到远端流                                 |
| `mediaready`         | 媒体进入可播放状态                         |
| `state`              | RTC 状态变化（`connecting/connected/...`） |
| `error`              | 运行时错误                                 |
| `icecandidate`       | 本地 ICE 候选产生                          |
| `iceconnectionstate` | ICE 连接状态更新                           |
| `icegatheringstate`  | ICE 收集状态更新                           |
| `reconnecting`       | 自动重连尝试开始                           |
| `reconnectfailed`    | 自动重连耗尽（达到最大重试次数）           |
| `reconnected`        | 自动重连成功                               |
| `signalingerror`     | 信令请求异常                               |

## 使用示例

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: videoElement,
});

player.on('track', ({ stream }) => (video.srcObject = stream));
player.on('state', (state) => console.log(state));
player.play();
```
