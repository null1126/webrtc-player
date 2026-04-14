---
title: WebRTC Engine - 插件系统
description: WebRTC Engine 插件系统文档，介绍插件机制、接入方式与最佳实践。
---

# 插件系统

WebRTC Engine 插件系统是围绕播放器（Player）与推流器（Publisher）生命周期构建的扩展框架。
它通过统一的 Hook 调度机制，在不侵入核心实现的前提下，为业务侧提供可组合、可治理、可演进的扩展能力。

## 系统目标

- **低耦合扩展**：将日志、监控、鉴权、策略控制等横切能力从核心链路中解耦，避免业务逻辑侵入内核。
- **可预测执行**：通过 `priority` 与明确的 Hook 时序，保证多插件并存场景下的执行顺序可控、行为可预期。
- **生命周期一致性**：围绕安装、执行、卸载阶段提供统一约束，降低插件接入与维护成本。
- **运行时可治理**：支持按需注册、按名卸载与批量卸载，便于动态开关能力与灰度发布。
- **稳定性优先**：插件异常与资源管理边界清晰，确保扩展能力增强的同时不破坏主链路稳定性。

典型应用场景包括：

- 日志记录与调试追踪
- 监控埋点与性能观测
- 连接参数动态改写（如 SDP / ICE 策略）
- 媒体流预处理（如轨道过滤、增强处理）

## 接入方式

支持两种接入方式，可单独或组合使用。

### 方式一：构造参数 `plugins`

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

### 方式二：运行时 `.use()`

```typescript
import { createPerformancePlugin } from '@webrtc-engine/plugin-performance';

player.use(createPerformancePlugin({ onStats: (stats) => console.log(stats) }));
```

## 生命周期

### 安装

- 调用 `player.use(plugin)` 或在 `plugins` 中声明后，插件会进入管理器。
- 在合适时机触发插件 `install()`。

### 执行

- 插件 Hook 会按优先级执行（`priority` 越大越先执行）。
- 同名插件只允许注册一次。

### 卸载

```typescript
player.unuse('plugin-name');
player.unuseAll();
```

- 卸载时触发 `uninstall()`，用于资源清理。

## 最佳实践

- 给插件设置唯一 `name`，避免重复注册冲突。
- 需要前置执行时设置更高 `priority`。
- 在销毁前后生命周期中及时清理定时器、事件监听和外部连接。
- 将“类型/Hook 细节”统一放在 [插件 API](./api)，将“可用插件列表”统一放在 [官方插件](./official)。
