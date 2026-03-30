---
title: WebRTC Player - RtcPlayerOptions
description: RtcPlayer playback player configuration options.
---

# RtcPlayerOptions

## Properties

| Property | Type                          | Required | Description               |
| -------- | ----------------------------- | -------- | ------------------------- |
| `url`    | `string`                      | Yes      | WebRTC playback URL       |
| `api`    | `string`                      | Yes      | Signaling server URL      |
| `video`  | `HTMLVideoElement`            | No       | Video element             |
| `media`  | `'audio' \| 'video' \| 'all'` | No       | Media type, default `all` |
| `config` | `RTCConfiguration`            | No       | ICE server config         |

## Example

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});
```
