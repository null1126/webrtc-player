---
title: WebRTC Player - RtcPlayer API
description: RtcPlayer 拉流播放器核心类 API 文档。
---

# RtcPlayer

拉流播放器核心类。

## 构造函数

```typescript
new RtcPlayer(options: RtcPlayerOptions)
```

## 方法

### play() <Badge type="tip" text="异步" />

开始拉流。

```typescript
await player.play();
```

### switchStream(url) <Badge type="tip" text="异步" />

切换拉流地址。

```typescript
await player.switchStream('webrtc://localhost/live/newstream');
```

### use(plugin) <Badge type="tip" text="同步" />

注册并安装插件，返回实例自身，支持链式调用。

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

详细用法请参考[插件系统](../guide/plugins)。

### unuse(name) <Badge type="tip" text="同步" />

卸载指定名称的插件。

```typescript
player.unuse('player-logger');
```

### destroy()

销毁实例。

```typescript
player.destroy();
```

## 事件

| 事件    | 说明       |
| ------- | ---------- |
| `track` | 收到远程流 |
| `state` | 连接状态   |
| `error` | 错误       |

## 使用示例

```typescript
import { RtcPlayer } from '@webrtc-player/core';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player.on('track', ({ stream }) => (video.srcObject = stream));
player.on('state', (state) => console.log(state));
player.play();
```
