---
title: WebRTC Engine - RtcState
description: 连接状态枚举。
---

# RtcState

## 状态值

| 状态           | 说明       |
| -------------- | ---------- |
| `CONNECTING`   | 连接中     |
| `CONNECTED`    | 已连接     |
| `DISCONNECTED` | 连接断开   |
| `FAILED`       | 连接失败   |
| `CLOSED`       | 连接已关闭 |
| `SWITCHING`    | 切换中     |
| `SWITCHED`     | 切换成功   |
| `DESTROYED`    | 已销毁     |

## 状态转换

```
CONNECTING → CONNECTED → DISCONNECTED → CLOSED
    ↓            ↓
  FAILED       SWITCHING → SWITCHED → ...
```
