# StateEnum

播放器状态枚举。

## 枚举定义

```typescript
export enum StateEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
  SWITCHING = 'switching',
  SWITCHED = 'switched',
  DESTROYED = 'destroyed',
}
```

## 状态值

### CONNECTING

- **值**: `'connecting'`
- **说明**: 连接中，正在建立 WebRTC 连接

### CONNECTED

- **值**: `'connected'`
- **说明**: 连接成功，媒体流已建立

### DISCONNECTED

- **值**: `'disconnected'`
- **说明**: 连接断开，可能是网络问题或对方主动断开

### FAILED

- **值**: `'failed'`
- **说明**: 连接失败，无法建立连接

### CLOSED

- **值**: `'closed'`
- **说明**: 连接已关闭

### SWITCHING

- **值**: `'switching'`
- **说明**: 正在切换流，正在切换到新的视频源

### SWITCHED

- **值**: `'switched'`
- **说明**: 流切换成功

### DESTROYED

- **值**: `'destroyed'`
- **说明**: 播放器已销毁，资源已释放

## 使用示例

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
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

player.play();
```

## 状态转换图

```
CONNECTING → CONNECTED → DISCONNECTED → CLOSED
    ↓            ↓
  FAILED       SWITCHING → SWITCHED → DISCONNECTED → CLOSED
                                    ↓
                               DESTROYED
```
