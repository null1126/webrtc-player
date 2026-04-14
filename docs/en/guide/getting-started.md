---
title: WebRTC Engine - Getting Started
description: Complete playback and publishing integration quickly, then scale with framework-specific patterns.
---

# Getting Started

This page provides a production-oriented onboarding path: establish a minimal playback/publishing flow first, then integrate cleanly at the framework layer.

## Prerequisites

Before you begin, make sure your environment meets the following requirements:

- Modern browsers (Chrome 56+, Firefox 44+, Safari 11+, Edge 79+)
- HTTPS in production (or `localhost` during development)
- A WebRTC-capable media server (e.g., SRS, ZLMediaKit, monibuca)

## Installation

```bash
pnpm add @webrtc-engine/core
# or
npm install @webrtc-engine/core
```

## Playback

```typescript
import { RtcPlayer } from '@webrtc-engine/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => console.log('Playback state:', state));
player.on('error', (error) => console.error('Playback error:', error));

await player.play();
```

## Publishing

```typescript
import { RtcPublisher } from '@webrtc-engine/core';

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
  target: document.getElementById('preview') as HTMLVideoElement,
});

publisher.on('streamstart', () => console.log('Publishing started'));
publisher.on('error', (error) => console.error('Publishing error:', error));

await publisher.start();
```

## Supported Media Sources

| Type       | Config                            | Description            |
| ---------- | --------------------------------- | ---------------------- |
| Camera     | `{ type: 'camera', audio: true }` | Video + audio          |
| Screen     | `{ type: 'screen', audio: true }` | Optional system audio  |
| Microphone | `{ type: 'microphone' }`          | Audio-only capture     |
| Custom     | `{ type: 'custom', stream }`      | Existing `MediaStream` |

## Framework Integration

Framework examples are now split into dedicated pages. You can access them from the left sidebar under "Framework Integration", or jump directly to:

- [React Integration](./frameworks/react)
- [Vue Integration](./frameworks/vue)

## Engineering Recommendations

- Encapsulate lifecycle management to prevent player/publisher instance leaks
- Build observability around `state` and `error` events
- Validate permission flows early and provide actionable guidance

## Next Steps

- [Events](./events) - Understand the full event model
- [Publishing Guide](./publisher) - Manage source switching and capture control
- [Custom Signaling](./custom-signaling) - Integrate internal gateways or custom backends
- [API Documentation](../api/) - Explore all available options
