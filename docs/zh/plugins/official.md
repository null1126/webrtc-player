---
title: WebRTC Player - 官方插件
description: WebRTC Player 官方插件列表与使用说明。
---

# 官方插件

## `@webrtc-player/plugin-logger`

记录播放器/推流器生命周期事件。

- 插件文档（npm）：https://www.npmjs.com/package/@webrtc-player/plugin-logger

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

## `@webrtc-player/plugin-performance`

监控播放器 FPS 与网络传输统计数据。

- 插件文档（npm）：https://www.npmjs.com/package/@webrtc-player/plugin-performance

```typescript
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

player.use(createPerformancePlugin({ onStats: (s) => console.log(s) }));
```
