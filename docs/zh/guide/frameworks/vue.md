---
title: Vue 集成
---

# Vue 集成

在 Vue 项目中可直接使用 `@webrtc-engine/core`，并通过组件生命周期管理实例。

## 基础模式

- 在 `onMounted` 中创建 `RtcPlayer` / `RtcPublisher`
- 使用模板 `ref` 绑定 `target` 元素
- 在 `onBeforeUnmount` 中调用 `destroy()`

## 示例入口

可参考以下完整示例：

- [推流示例](../../examples/publisher)
- [基础示例](../../examples/)
- [事件监听](../events)
