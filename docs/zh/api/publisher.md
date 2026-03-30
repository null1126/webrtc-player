---
title: WebRTC Player - RtcPublisher API
description: RtcPublisher 推流器核心类 API 文档。
---

# RtcPublisher

用于将本地媒体流推送到流媒体服务器。

## 构造函数

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

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

| 事件                 | 说明         |
| -------------------- | ------------ |
| `state`              | 连接状态     |
| `streamstart`        | 推流开始     |
| `streamstop`         | 推流停止     |
| `sourcechange`       | 输入源切换   |
| `permissiondenied`   | 权限拒绝     |
| `error`              | 错误         |
| `iceconnectionstate` | ICE 连接状态 |

详见 [推流指南](../guide/publisher) 和 [PublisherOptions](./publisher-options)。
