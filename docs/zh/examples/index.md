# 基础用法

本页面展示 WebRTC Player 的基础使用示例。

## HTML 结构

```html
<div id="app">
  <video id="video" controls muted></video>
  <div id="status">状态: 连接中...</div>
</div>
```

## 基础播放器

最简单的播放器使用方式：

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const video = document.getElementById('video') as HTMLVideoElement;

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

player.on('track', ({ stream }) => {
  console.log('收到音视频流');
});

player.on('state', (state) => {
  console.log('状态:', state);
});

player.play();
```

## 带有完整状态的示例

展示如何监听所有事件并更新 UI：

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
      console.log('收到流');
    });

    this.player.on('state', (state) => {
      this.updateStatus(state);
    });

    this.player.on('error', (error) => {
      console.error('错误:', error);
    });
  }

  private updateStatus(state: StateEnum) {
    const statusMap: Record<StateEnum, string> = {
      [StateEnum.CONNECTING]: '连接中',
      [StateEnum.CONNECTED]: '已连接',
      [StateEnum.DISCONNECTED]: '已断开',
      [StateEnum.FAILED]: '连接失败',
      [StateEnum.CLOSED]: '已关闭',
      [StateEnum.SWITCHING]: '切换中',
      [StateEnum.SWITCHED]: '已切换',
      [StateEnum.DESTROYED]: '已销毁',
    };
    this.statusEl.textContent = `状态: ${statusMap[state]}`;
  }

  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}

// 使用
const videoPlayer = new VideoPlayer('video', 'status');
videoPlayer.init('webrtc://localhost/live/livestream', 'http://localhost:1985/rtc/v1/play/');
```

## 手动控制视频播放

如果不使用自动绑定功能：

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
