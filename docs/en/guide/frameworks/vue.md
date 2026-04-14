---
title: Vue Integration
---

# Vue Integration

Use `@webrtc-engine/core` directly in Vue projects and manage instance lifecycle with component hooks.

## Basic Pattern

- Create `RtcPlayer` / `RtcPublisher` in `onMounted`
- Bind `target` to a template `ref`
- Call `destroy()` in `onBeforeUnmount`

## Example

See full working examples here:

- [Publishing Examples](../../examples/publisher)
- [Basic Examples](../../examples/)
- [Events](../events)
