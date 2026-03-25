# 事件监听

WebRTC Player 提供了完整的事件系统，用于监听播放器状态变化。

## 事件列表

### track

当收到远程音视频流时触发。

```typescript
player.on('track', ({ stream, event }) => {
  // stream: MediaStream 对象
  // event: RTCTrackEvent 对象
  console.log('收到流:', stream);
});
```

### state

当连接状态发生变化时触发。

```typescript
player.on('state', (state: StateEnum) => {
  console.log('连接状态:', state);
});
```

状态值参考 [StateEnum](../api/state)。

### error

当发生错误时触发。

```typescript
player.on('error', (error: string) => {
  console.error('播放器错误:', error);
});
```

### icecandidate

当收集到 ICE 候选时触发。

```typescript
player.on('icecandidate', (candidate: RTCIceCandidate) => {
  console.log('ICE 候选:', candidate);
});
```

### iceconnectionstate

当 ICE 连接状态发生变化时触发。

```typescript
player.on('iceconnectionstate', (state: RTCIceConnectionState) => {
  console.log('ICE 连接状态:', state);
  // 可能的值: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed'
});
```

### icegatheringstate

当 ICE 收集状态发生变化时触发。

```typescript
player.on('icegatheringstate', (state: RTCIceGatheringState) => {
  console.log('ICE 收集状态:', state);
  // 可能的值: 'new' | 'gathering' | 'complete'
});
```

## 事件监听方法

### on

监听事件。

```typescript
player.on('track', handler);
```

### off

取消监听事件。

```typescript
player.off('track', handler);
```

### once

只监听一次事件。

```typescript
player.once('track', handler);
```

## 示例：完整的事件监听

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

// 监听所有事件
player.on('track', ({ stream }) => {
  console.log('收到音视频流');
});

player.on('state', (state) => {
  console.log('连接状态:', state);

  // 根据状态更新 UI
  if (state === StateEnum.CONNECTED) {
    console.log('播放开始');
  } else if (state === StateEnum.FAILED) {
    console.log('连接失败');
  }
});

player.on('error', (error) => {
  console.error('错误:', error);
});

player.on('iceconnectionstate', (iceState) => {
  console.log('ICE 连接状态:', iceState);
});

player.on('icegatheringstate', (gatheringState) => {
  console.log('ICE 收集状态:', gatheringState);
});

// 开始播放
player.play();
```

## 事件状态机

```
                    ┌──────────────┐
                    │  CONNECTING  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌──────────┐              ┌──────────┐
       │ CONNECTED │              │  FAILED  │
       └─────┬─────┘              └──────────┘
             │
             │ ◄──────────────┐
             │                │
             ▼                │
       ┌──────────────┐       │
       │ DISCONNECTED │───────┘
       └──────┬───────┘
              │
              ▼
       ┌──────────┐
       │  CLOSED  │
       └──────────┘
```

## 注意事项

1. 确保在调用 `play()` 方法之前设置好所有事件监听器
2. 组件卸载时，记得调用 `destroy()` 方法清理资源
3. 错误处理很重要，建议始终监听 `error` 事件
4. ICE 相关事件用于调试和问题排查，生产环境可能不需要
