---
title: WebRTC Engine - Plugin System
description: 'WebRTC Engine plugin system overview: architecture goals, integration patterns, and lifecycle.'
---

# Plugin System

The WebRTC Engine plugin system is an extension framework built around Player and Publisher lifecycles.
It provides a unified hook orchestration model so business capabilities can be composed without coupling to the core runtime implementation.

For hook/type contracts, see [Plugin API](./api).
For official packages, see [Official Plugins](./official).

## System Objectives

The plugin system is designed as an engineering extension model (not just a feature container), with the following objectives:

- **Low-coupling extensibility**: decouple cross-cutting concerns (logging, observability, policy controls, etc.) from core media workflows.
- **Deterministic execution**: ensure predictable multi-plugin behavior through explicit hook timing and `priority` ordering.
- **Lifecycle consistency**: standardize install/execute/uninstall phases to reduce integration and maintenance complexity.
- **Runtime governance**: support dynamic registration and controlled uninstallation for feature toggles, phased rollout, and operational control.
- **Stability-first architecture**: keep plugin failure and resource boundaries explicit so extensibility does not compromise critical playback/publishing paths.

Typical scenarios include:

- structured logging and diagnostics
- observability, analytics, and performance telemetry
- connection parameter rewriting (e.g., SDP / ICE strategies)
- media stream preprocessing (e.g., track filtering and enhancement)

## Integration Patterns

You can use either pattern independently, or combine both.

### Pattern 1: `plugins` in constructor options

```typescript
import { RtcPlayer } from '@webrtc-engine/core';
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  target: videoElement,
  plugins: [createPlayerLoggerPlugin()],
});

await player.play();
```

### Pattern 2: Runtime `.use()` registration

```typescript
import { createPerformancePlugin } from '@webrtc-engine/plugin-performance';

player.use(createPerformancePlugin({ onStats: (stats) => console.log(stats) }));
```

## Lifecycle

### Installation

- Register with `player.use(plugin)` or pass via `plugins`.
- `install()` is invoked during plugin activation.

### Execution

- Hooks execute by priority (`priority` larger value runs first).
- Duplicate plugin names are rejected.

### Uninstallation

```typescript
player.unuse('plugin-name');
player.unuseAll();
```

- `uninstall()` is called for cleanup.

## Best Practices

- Keep plugin names unique.
- Use `priority` when execution order matters.
- Clean timers/listeners/external resources during teardown hooks.
- Keep interface details in [Plugin API](./api), and package listing in [Official Plugins](./official).
