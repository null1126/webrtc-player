---
title: WebRTC Engine - RtcState
description: Connection state enumeration.
---

# RtcState

## States

| State          | Description       |
| -------------- | ----------------- |
| `CONNECTING`   | Connecting        |
| `CONNECTED`    | Connected         |
| `DISCONNECTED` | Disconnected      |
| `FAILED`       | Failed            |
| `CLOSED`       | Connection closed |
| `SWITCHING`    | Switching         |
| `SWITCHED`     | Switched          |
| `DESTROYED`    | Destroyed         |

## State Transitions

```
CONNECTING → CONNECTED → DISCONNECTED → CLOSED
    ↓            ↓
  FAILED       SWITCHING → SWITCHED → ...
```
