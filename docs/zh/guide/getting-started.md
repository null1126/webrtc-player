# 快速开始

本指南将帮助你在项目中快速集成 WebRTC Player。

## 环境要求

- 现代浏览器（Chrome 56+、Firefox 44+、Safari 11+、Edge 79+）
- 支持 HTTPS（生产环境）或 localhost（开发环境）
- 流媒体服务器支持 WebRTC 协议

## 安装

通过 npm 或 pnpm 安装核心包：

```bash
pnpm add @webrtc-player/core
# 或
npm install @webrtc-player/core
```

## 创建播放器

### 基础用法

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

// 获取 video 元素
const video = document.getElementById('myVideo') as HTMLVideoElement;

// 创建播放器实例
const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

// 开始播放
player.play();
```

### 手动绑定流

如果你不想自动绑定 video 元素，可以监听 `track` 事件手动处理：

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

## 完整示例

以下是一个包含错误处理和状态监听的完整示例：

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const video = document.getElementById('myVideo') as HTMLVideoElement;

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: video,
});

// 监听连接状态
player.on('state', (state: StateEnum) => {
  console.log('连接状态:', state);

  switch (state) {
    case StateEnum.CONNECTING:
      console.log('正在连接...');
      break;
    case StateEnum.CONNECTED:
      console.log('连接成功');
      break;
    case StateEnum.DISCONNECTED:
      console.log('连接断开');
      break;
    case StateEnum.FAILED:
      console.log('连接失败');
      break;
    case StateEnum.CLOSED:
      console.log('连接已关闭');
      break;
    case StateEnum.SWITCHING:
      console.log('正在切换流...');
      break;
    case StateEnum.SWITCHED:
      console.log('流切换成功');
      break;
    case StateEnum.DESTROYED:
      console.log('播放器已销毁');
      break;
  }
});

// 监听错误
player.on('error', (error: string) => {
  console.error('播放器错误:', error);
});

// 监听 ICE 连接状态
player.on('iceconnectionstate', (state: RTCIceConnectionState) => {
  console.log('ICE 连接状态:', state);
});

// 开始播放
player.play();

// 组件销毁时
// player.destroy();
```

## React 中使用

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

## 下一步

- 查看 [事件监听](./events) 了解更多事件类型
- 查看 [API 文档](../api/) 了解更多配置选项
- 查看 [示例](../examples/) 了解完整示例
