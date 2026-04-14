---
title: WebRTC Engine - RtcPublisher API
description: RtcPublisher 推流器核心类 API 文档。
---

# RtcPublisher

用于将本地媒体流推送到流媒体服务器。

## 构造函数

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

## 配置项（RtcPublisherOptions）

### 属性

| 属性        | 类型                                                        | 必填 | 说明                                         |
| ----------- | ----------------------------------------------------------- | ---- | -------------------------------------------- |
| `url`       | `string`                                                    | 是   | WebRTC 推流地址                              |
| `api`       | `string`                                                    | 是   | 信令服务器地址                               |
| `source`    | `MediaSource`                                               | 是   | 媒体源配置                                   |
| `target`    | `HTMLVideoElement \| HTMLAudioElement \| HTMLCanvasElement` | 否   | 本地预览渲染目标元素（video/audio/canvas）   |
| `muted`     | `boolean`                                                   | 否   | 目标元素是否静音，默认 `true`                |
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

### start() <Badge type="tip" text="异步" />

开始推流。

```typescript
await publisher.start();
```

### stop()

停止推流。

```typescript
publisher.stop();
```

### switchSource(source) <Badge type="tip" text="异步" />

切换输入源，无需重建连接。

```typescript
await publisher.switchSource({ type: 'screen', audio: true });
```

### getStream()

获取本地 MediaStream。

```typescript
const stream = publisher.getStream();
```

### destroy()

销毁实例，释放资源。

```typescript
publisher.destroy();
```

## 事件

| 事件                   | 说明                                        |
| ---------------------- | ------------------------------------------- |
| `state`                | RTC 状态变化（`connecting/connected/...`）  |
| `streamstart`          | 推流开始                                    |
| `streamstop`           | 推流停止                                    |
| `streamingstatechange` | 推流状态变化（`idle/connecting/streaming`） |
| `sourcechange`         | 输入源切换                                  |
| `permissiondenied`     | 媒体权限被拒绝                              |
| `track`                | 收到远端流（回声/对讲场景）                 |
| `trackended`           | 本地轨道结束                                |
| `trackmutechanged`     | 本地轨道静音状态变化                        |
| `error`                | 运行时错误                                  |
| `icecandidate`         | 本地 ICE 候选产生                           |
| `iceconnectionstate`   | ICE 连接状态更新                            |
| `icegatheringstate`    | ICE 收集状态更新                            |
| `reconnecting`         | 自动重连尝试开始                            |
| `reconnectfailed`      | 自动重连耗尽（达到最大重试次数）            |
| `reconnected`          | 自动重连成功                                |
| `signalingerror`       | 信令请求异常                                |

详见 [推流指南](../guide/publisher)。
