---
title: WebRTC Player - PublisherOptions
description: RtcPublisher 推流器配置选项。
---

# PublisherOptions

## 属性

| 属性     | 类型               | 必填 | 说明            |
| -------- | ------------------ | ---- | --------------- |
| `url`    | `string`           | 是   | WebRTC 推流地址 |
| `api`    | `string`           | 是   | 信令服务器地址  |
| `source` | `MediaSource`      | 是   | 媒体源配置      |
| `video`  | `HTMLVideoElement` | 否   | 本地预览元素    |
| `config` | `RTCConfiguration` | 否   | ICE 服务器配置  |

## 示例

```typescript
const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/mystream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  video: preview,
  config: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
});
```
