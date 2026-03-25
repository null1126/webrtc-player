# 切换视频源

本页面展示如何在播放过程中动态切换视频源。

## 场景

- 监控系统中切换不同摄像头
- 多视角直播切换
- 视频列表播放

## 基本用法

使用 `switchStream` 方法可以动态切换到新的视频源：

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/camera1',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  console.log('状态:', state);
});

// 播放初始视频
player.play();

// 3 秒后切换到另一个视频源
setTimeout(() => {
  player.switchStream('webrtc://localhost/live/camera2');
}, 3000);
```

## 多摄像头切换示例

一个完整的摄像头切换界面示例：

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
      console.log('状态:', state);

      if (state === StateEnum.SWITCHED) {
        console.log('切换完成');
      }
    });

    this.player.on('error', (error) => {
      console.error('错误:', error);
    });
  }

  switchTo(cameraName: string) {
    const camera = this.cameras.find((c) => c.name === cameraName);
    if (!camera || !this.player) {
      console.error('未找到摄像头:', cameraName);
      return;
    }

    console.log(`切换到: ${cameraName}`);
    this.currentCamera = cameraName;
    this.player.switchStream(camera.url);
  }

  destroy() {
    this.player?.destroy();
    this.player = null;
  }
}

// 使用示例
const player = new MultiCameraPlayer('video');
player.init(
  [
    { name: '三亚', url: 'webrtc://localhost/live/sanya' },
    { name: '豌豆', url: 'webrtc://localhost/live/wandou' },
    { name: '测试', url: 'webrtc://localhost/live/test' },
  ],
  'http://localhost:1985/rtc/v1/play/'
);

// 点击按钮切换
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
  <button class="camera-btn active" data-camera="三亚">三亚</button>
  <button class="camera-btn" data-camera="豌豆">豌豆</button>
  <button class="camera-btn" data-camera="测试">测试</button>
</div>
```

## 注意事项

1. **切换期间的状态**: 切换过程中会依次触发 `SWITCHING` 和 `SWITCHED` 状态
2. **API 地址不变**: `switchStream` 只会改变播放地址，信令服务器地址保持不变
3. **错误处理**: 建议监听 `error` 事件处理切换失败的情况
4. **资源清理**: 切换时会自动关闭旧连接并建立新连接，无需手动处理
