# Getting Started

This guide will help you quickly integrate WebRTC Player into your project.

## Requirements

- Modern browsers (Chrome 56+, Firefox 44+, Safari 11+, Edge 79+)
- HTTPS support (production) or localhost (development)
- Streaming server with WebRTC protocol support

## Installation

Install the core package via npm or pnpm:

```bash
pnpm add @webrtc-player/core
# or
npm install @webrtc-player/core
```

## Create Player

### Basic Usage

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

// Get video element
const video = document.getElementById('myVideo') as HTMLVideoElement;

// Create player instance
const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

// Start playback
player.play();
```

### Manual Stream Binding

If you don't want automatic video element binding, listen to the `track` event and handle it manually:

```typescript
const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});

player.on('track', ({ stream }) => {
  const video = document.getElementById('myVideo') as HTMLVideoElement;
  video.srcObject = stream;
  video.play();
});

player.play();
```

## Complete Example

Here's a complete example with error handling and state monitoring:

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const video = document.getElementById('myVideo') as HTMLVideoElement;

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

// Listen to connection state
player.on('state', (state: StateEnum) => {
  console.log('Connection state:', state);

  switch (state) {
    case StateEnum.CONNECTING:
      console.log('Connecting...');
      break;
    case StateEnum.CONNECTED:
      console.log('Connected');
      break;
    case StateEnum.DISCONNECTED:
      console.log('Disconnected');
      break;
    case StateEnum.FAILED:
      console.log('Connection failed');
      break;
    case StateEnum.CLOSED:
      console.log('Connection closed');
      break;
    case StateEnum.SWITCHING:
      console.log('Switching stream...');
      break;
    case StateEnum.SWITCHED:
      console.log('Stream switched');
      break;
    case StateEnum.DESTROYED:
      console.log('Player destroyed');
      break;
  }
});

// Listen to errors
player.on('error', (error: string) => {
  console.error('Player error:', error);
});

// Listen to ICE connection state
player.on('iceconnectionstate', (state: RTCIceConnectionState) => {
  console.log('ICE connection state:', state);
});

// Start playback
player.play();

// When component is destroyed
// player.destroy();
```

## Usage in React

```typescript
import { useEffect, useRef } from 'react';
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<WebRTCPlayer | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = new WebRTCPlayer({
      url: 'webrtc://localhost/live/livestream',
      api: 'http://localhost:1985/rtc/v1/play/',
      video: videoRef.current,
    });

    playerRef.current.on('state', (state) => {
      console.log('Connection state:', state);
    });

    playerRef.current.play();

    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} controls muted />
    </div>
  );
}
```

## Next Steps

- See [Events](./events) to learn more about event types
- See [API Documentation](../api/) to learn more about configuration options
- See [Examples](../examples/) to see complete examples
