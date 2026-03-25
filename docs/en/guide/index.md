# Introduction

WebRTC Player is a lightweight WebRTC video player library focused on real-time video streaming.

## Features

- **Easy to Use**: Clean API design, implement WebRTC video playback in just a few lines of code
- **Protocol Compatible**: Supports WebRTC protocol, works with mainstream streaming servers
- **Event-Driven**: Complete event system for real-time connection state and error monitoring
- **High Performance**: Lightweight implementation, no dependencies, efficient execution
- **Cross-Platform**: Based on standard Web APIs, supports all modern browsers
- **Stream Switching**: Supports dynamic video source switching without recreating player instance

## Installation

```bash
# Using pnpm
pnpm add @webrtc-player/core

# Using npm
npm install @webrtc-player/core

# Using yarn
yarn add @webrtc-player/core
```

## Basic Usage

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// Listen to events
player.on('track', ({ stream }) => {
  console.log('Received stream:', stream);
});

player.on('state', (state) => {
  console.log('Connection state:', state);
});

// Start playback
player.play();
```

## How It Works

WebRTC Player implements video playback through the following steps:

1. **Create PeerConnection**: Establish WebRTC peer connection
2. **Add Audio/Video Tracks**: Configure audio and video data reception
3. **SDP Exchange**: Exchange Session Description Protocol through signaling server
4. **Media Stream Reception**: Receive and play remote audio/video streams

## Browser Support

| Browser | Supported Version |
| ------- | ----------------- |
| Chrome  | 56+               |
| Firefox | 44+               |
| Safari  | 11+               |
| Edge    | 79+               |

## License

This project is open source under the MIT License.
