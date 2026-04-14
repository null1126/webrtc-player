---
title: WebRTC Engine - Official Plugins
description: Officially maintained WebRTC Engine plugins and usage examples.
---

# Official Plugins

This document only covers official plugin packages.

For architecture and lifecycle details, see [Plugin System](./system).
For hook/type contracts, see [Plugin API](./api).

## `@webrtc-engine/plugin-logger`

Logs player/publisher lifecycle events.

- Package docs (npm): https://www.npmjs.com/package/@webrtc-engine/plugin-logger

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

player.use(createPlayerLoggerPlugin());
```

## `@webrtc-engine/plugin-performance`

Monitors player FPS and network transport stats.

- Package docs (npm): https://www.npmjs.com/package/@webrtc-engine/plugin-performance

```typescript
import { createPerformancePlugin } from '@webrtc-engine/plugin-performance';

player.use(createPerformancePlugin({ onStats: (s) => console.log(s) }));
```
