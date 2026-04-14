---
title: React 集成
---

# React 集成

在 React 项目中可直接使用 `@webrtc-engine/core`，并通过 `useEffect` 管理实例生命周期。

## 基础模式

- 在 `useEffect` 中创建 `RtcPlayer` / `RtcPublisher`
- 使用 `ref` 绑定 `target` 元素
- 在 cleanup 中调用 `destroy()`

## 示例入口

可参考以下完整示例：

- [推流示例](../../examples/publisher)
- [基础示例](../../examples/)
- [事件监听](../events)
