# PlayerOptions

播放器配置选项接口。

## 接口定义

```typescript
interface PlayerOptions {
  url: string;
  api: string;
  video?: HTMLVideoElement;
}
```

## 属性

### url

- **类型**: `string`
- **必填**: 是
- **说明**: 播放地址，支持 WebRTC 协议

**示例**:

```typescript
{
  url: 'webrtc://localhost/live/livestream';
}
```

### api

- **类型**: `string`
- **必填**: 是
- **说明**: 信令服务器地址，支持 HTTP/HTTPS 协议

**示例**:

```typescript
{
  api: 'http://localhost:1985/rtc/v1/play/';
}
```

### video

- **类型**: `HTMLVideoElement`
- **必填**: 否
- **说明**: 视频元素。如果传入了 video 元素，播放器会自动将流绑定到该元素并开始播放。

**示例**:

```typescript
{
  video: document.getElementById('video') as HTMLVideoElement;
}
```

## 完整示例

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  // WebRTC 播放地址
  url: 'webrtc://localhost/live/livestream',

  // 信令服务器地址
  api: 'http://localhost:1985/rtc/v1/play/',

  // 可选：视频元素
  video: document.getElementById('video') as HTMLVideoElement,
});
```
