---
title: WebRTC Player - RtcPlayerOptions
description: RtcPlayer 拉流播放器配置选项。
---

# RtcPlayerOptions

## 属性

| 属性     | 类型                          | 必填 | 说明                 |
| -------- | ----------------------------- | ---- | -------------------- |
| `url`    | `string`                      | 是   | WebRTC 播放地址      |
| `api`    | `string`                      | 是   | 信令服务器地址       |
| `video`  | `HTMLVideoElement`            | 否   | 视频元素             |
| `media`  | `'audio' \| 'video' \| 'all'` | 否   | 媒体类型，默认 `all` |
| `config` | `RTCConfiguration`            | 否   | ICE 服务器配置       |

## 示例

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});
```
