# WebRTCPlayer

WebRTC 播放器的核心类，用于管理 WebRTC 连接和视频播放。

## 构造函数

```typescript
new WebRTCPlayer(options: PlayerOptions)
```

### 参数

| 参数    | 类型            | 必填 | 说明           |
| ------- | --------------- | ---- | -------------- |
| options | `PlayerOptions` | 是   | 播放器配置选项 |

## 方法

### play()

开始播放 WebRTC 视频流。

```typescript
async play(): Promise<boolean>
```

**返回值**: 返回 Promise，成功返回 `true`，失败抛出异常。

**示例**:

```typescript
try {
  await player.play();
  console.log('播放成功');
} catch (error) {
  console.error('播放失败:', error);
}
```

### switchStream(url)

切换到新的视频流。

```typescript
async switchStream(url: string): Promise<void>
```

**参数**:

| 参数 | 类型     | 必填 | 说明         |
| ---- | -------- | ---- | ------------ |
| url  | `string` | 是   | 新的播放地址 |

**示例**:

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

### destroy()

销毁播放器实例，释放所有资源。

```typescript
destroy(): void
```

**示例**:

```typescript
player.destroy();
```

## 事件

### on(event, listener)

监听指定事件。

```typescript
on<T extends EventType>(event: T, listener: EventListener<T>): this
```

### off(event, listener)

取消事件监听。

```typescript
off<T extends EventType>(event: T, listener: EventListener<T>): this
```

### once(event, listener)

监听一次事件。

```typescript
once<T extends EventType>(event: T, listener: EventListener<T>): this
```

## 示例

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// 监听事件
player.on('track', ({ stream }) => {
  console.log('收到流');
});

player.on('state', (state) => {
  console.log('状态:', state);
});

player.on('error', (error) => {
  console.error('错误:', error);
});

// 开始播放
player.play();

// 切换流
player.switchStream('webrtc://localhost/live/newstream');

// 销毁
player.destroy();
```

## 类型定义

```typescript
export type EventType = keyof PlayerEvents;

export interface PlayerEvents {
  track: { stream: MediaStream; event: RTCTrackEvent };
  state: StateEnum;
  error: string;
  icecandidate: RTCIceCandidate;
  iceconnectionstate: RTCIceConnectionState;
  icegatheringstate: RTCIceGatheringState;
}

export type EventListener<T extends EventType> = (data: PlayerEvents[T]) => void;
```
