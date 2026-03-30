---
title: WebRTC Player - 事件监听
description: WebRTC Player 事件系统详解，包括拉流和推流事件。
---

# 事件监听

## 事件类型

### 通用事件

`RtcPlayer` 和 `RtcPublisher` 均可使用：

| 事件                 | 说明         | 参数                    |
| -------------------- | ------------ | ----------------------- |
| `state`              | 连接状态变化 | `RtcState`              |
| `error`              | 错误发生     | `string`                |
| `icecandidate`       | ICE 候选     | `RTCIceCandidate`       |
| `iceconnectionstate` | ICE 连接状态 | `RTCIceConnectionState` |

### 拉流事件

| 事件    | 说明       | 参数                |
| ------- | ---------- | ------------------- |
| `track` | 收到远程流 | `{ stream, event }` |

### 推流事件

| 事件               | 说明       | 参数                |
| ------------------ | ---------- | ------------------- |
| `streamstart`      | 推流开始   | `{ stream }`        |
| `streamstop`       | 推流停止   | `void`              |
| `sourcechange`     | 输入源切换 | `MediaSource`       |
| `permissiondenied` | 权限拒绝   | `{ source, error }` |

## 使用方法

```typescript
player.on('state', (state) => console.log(state));
player.off('track', handler); // 取消监听
player.once('error', handler); // 仅监听一次
```

详见 [RtcState](../api/state)。
