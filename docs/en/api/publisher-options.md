---
title: WebRTC Player - PublisherOptions
description: RtcPublisher configuration options.
---

# PublisherOptions

## Properties

| Property | Type               | Required | Description           |
| -------- | ------------------ | -------- | --------------------- |
| `url`    | `string`           | Yes      | WebRTC publishing URL |
| `api`    | `string`           | Yes      | Signaling server URL  |
| `source` | `MediaSource`      | Yes      | Media source config   |
| `video`  | `HTMLVideoElement` | No       | Preview element       |
| `config` | `RTCConfiguration` | No       | ICE server config     |

## Example

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
