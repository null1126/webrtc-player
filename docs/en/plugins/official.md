---
title: WebRTC Player - Official Plugins
description: Officially maintained WebRTC Player plugins and usage examples.
---

# Official Plugins

This document only covers official plugin packages.

For architecture and lifecycle details, see [Plugin System](./system).
For hook/type contracts, see [Plugin API](./api).

## `@webrtc-player/plugin-logger`

Logs player/publisher lifecycle events.

- Package docs (npm): https://www.npmjs.com/package/@webrtc-player/plugin-logger

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

## `@webrtc-player/plugin-performance`

Monitors player FPS and network transport stats.

- Package docs (npm): https://www.npmjs.com/package/@webrtc-player/plugin-performance

```typescript
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

player.use(createPerformancePlugin({ onStats: (s) => console.log(s) }));
```
