---
title: React Integration
---

# React Integration

Use `@webrtc-engine/core` directly in React projects and manage instance lifecycle with `useEffect`.

## Basic Pattern

- Create `RtcPlayer` / `RtcPublisher` in `useEffect`
- Bind `target` to a `ref` element
- Call `destroy()` in cleanup

## Example

See full working examples here:

- [Publishing Examples](../../examples/publisher)
- [Basic Examples](../../examples/)
- [Events](../events)
