# Basic Usage

This page demonstrates basic usage examples of WebRTC Player.

## HTML Structure

```html
<div id="app">
  <video id="video" controls muted></video>
  <div id="status">Status: Connecting...</div>
</div>
```

## Basic Player

The simplest way to use the player:

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const video = document.getElementById('video') as HTMLVideoElement;

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

player.on('track', ({ stream }) => {
  console.log('Received audio/video stream');
});

player.on('state', (state) => {
  console.log('State:', state);
});

player.play();
```

## Complete Example with Status

Demonstrates how to listen to all events and update the UI:

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

class VideoPlayer {
  private player: WebRTCPlayer | null = null;
  private video: HTMLVideoElement;
  private statusEl: HTMLElement;

  constructor(videoId: string, statusId: string) {
    this.video = document.getElementById(videoId) as HTMLVideoElement;
    this.statusEl = document.getElementById(statusId) as HTMLElement;
  }

  init(url: string, api: string) {
    this.player = new WebRTCPlayer({
      url,
      api,
      video: this.video,
    });

    this.setupListeners();
    this.player.play();
  }

  private setupListeners() {
    if (!this.player) return;

    this.player.on('track', ({ stream }) => {
      console.log('Stream received');
    });

    this.player.on('state', (state) => {
      this.updateStatus(state);
    });

    this.player.on('error', (error) => {
      console.error('Error:', error);
    });
  }

  private updateStatus(state: StateEnum) {
    const statusMap: Record<StateEnum, string> = {
      [StateEnum.CONNECTING]: 'Connecting',
      [StateEnum.CONNECTED]: 'Connected',
      [StateEnum.DISCONNECTED]: 'Disconnected',
      [StateEnum.FAILED]: 'Connection Failed',
      [StateEnum.CLOSED]: 'Closed',
      [StateEnum.SWITCHING]: 'Switching',
      [StateEnum.SWITCHED]: 'Switched',
      [StateEnum.DESTROYED]: 'Destroyed',
    };
    this.statusEl.textContent = `Status: ${statusMap[state]}`;
  }

  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}

// Usage
const videoPlayer = new VideoPlayer('video', 'status');
videoPlayer.init('webrtc://localhost/live/livestream', 'http://localhost:1985/rtc/v1/play/');
```

## Manual Video Control

If you don't want to use automatic binding:

```typescript
const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});

player.on('track', ({ stream }) => {
  const video = document.getElementById('video') as HTMLVideoElement;
  video.srcObject = stream;
  video.play().catch(console.error);
});

player.play();
```
