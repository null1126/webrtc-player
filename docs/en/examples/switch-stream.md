# Switch Stream

This page demonstrates how to dynamically switch video sources during playback.

## Use Cases

- Switching between different cameras in surveillance systems
- Multi-view live streaming
- Video playlist playback

## Basic Usage

Use the `switchStream` method to dynamically switch to a new video source:

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  console.log('State:', state);
});

// Play initial video
player.play();

// Switch to another video source after 3 seconds
setTimeout(() => {
  player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## Multi-Camera Switching Example

A complete multi-camera switching interface example:

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

class MultiCameraPlayer {
  private player: WebRTCPlayer | null = null;
  private cameras: { name: string; url: string }[] = [];
  private currentCamera: string = '';

  constructor(videoId: string) {
    this.setupUI(videoId);
  }

  private setupUI(videoId: string) {
    const video = document.getElementById(videoId) as HTMLVideoElement;
    video.style.width = '600px';
    video.style.height = '400px';
  }

  init(cameras: { name: string; url: string }[], api: string) {
    this.cameras = cameras;

    const video = document.getElementById('video') as HTMLVideoElement;
    this.player = new WebRTCPlayer({
      url: cameras[0].url,
      api,
      video,
    });

    this.currentCamera = cameras[0].name;
    this.setupListeners();
    this.player.play();
  }

  private setupListeners() {
    if (!this.player) return;

    this.player.on('state', (state) => {
      console.log('State:', state);

      if (state === StateEnum.SWITCHED) {
        console.log('Switch completed');
      }
    });

    this.player.on('error', (error) => {
      console.error('Error:', error);
    });
  }

  switchTo(cameraName: string) {
    const camera = this.cameras.find((c) => c.name === cameraName);
    if (!camera || !this.player) {
      console.error('Camera not found:', cameraName);
      return;
    }

    console.log(`Switching to: ${cameraName}`);
    this.currentCamera = cameraName;
    this.player.switchStream(camera.url);
  }

  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}

// Usage example
const player = new MultiCameraPlayer('video');
player.init(
  [
    { name: 'Sanya', url: 'webrtc://localhost/live/sanya' },
    { name: 'Pea', url: 'webrtc://localhost/live/wandou' },
    { name: 'Test', url: 'webrtc://localhost/live/test' },
  ],
  'http://localhost:1985/rtc/v1/play/'
);

// Click buttons to switch
document.querySelectorAll('.camera-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.getAttribute('data-camera');
    if (name) {
      player.switchTo(name);
    }
  });
});
```

## HTML

```html
<div class="video-container">
  <video id="video" controls muted></video>
</div>

<div class="camera-list">
  <button class="camera-btn active" data-camera="Sanya">Sanya</button>
  <button class="camera-btn" data-camera="Pea">Pea</button>
  <button class="camera-btn" data-camera="Test">Test</button>
</div>
```

## Notes

1. **State during switching**: The `SWITCHING` and `SWITCHED` states are triggered sequentially during switching
2. **API address unchanged**: `switchStream` only changes the playback URL, the signaling server address remains unchanged
3. **Error handling**: It's recommended to listen to the `error` event to handle switching failures
4. **Resource cleanup**: Old connections are automatically closed and new ones established during switching, no manual handling needed
