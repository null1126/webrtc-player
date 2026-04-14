---
title: WebRTC Engine - Guide Overview
description: WebRTC Engine guide covering core capabilities, integration paths, and production-oriented practices.
---

# Guide Overview

WebRTC Engine is a lightweight WebRTC SDK for real-time media scenarios, providing a unified API for both **playback** and **publishing**.

This guide is designed for teams that need fast adoption with reliable production behavior. It focuses on:

- Quick integration with minimal, runnable examples
- Event model and state handling
- Publishing workflow and media source control
- Plugin-based extensibility
- Custom signaling integration patterns

## Core Features

- **Unified API design**: `RtcPlayer` and `RtcPublisher` share a consistent lifecycle and event style
- **Broad server compatibility**: Works with common WebRTC servers such as SRS, ZLMediaKit, and monibuca
- **Comprehensive event model**: Covers state transitions, errors, track changes, and permission signals
- **Multi-source capture**: Camera, microphone, screen sharing, and custom `MediaStream`
- **Canvas rendering support**: Render video frames to Canvas for custom drawing, frame processing, and snapshot workflows
- **Plugin system**: Extensible architecture for logging, performance telemetry, and business-specific features
- **Cross-browser support**: Compatible with modern Chrome, Firefox, Safari, and Edge

## Architecture

```
┌─────────────────────────────────────┐
│            WebRTC Engine            │
├───────────────┬─────────────────────┤
│   RtcPlayer   │   RtcPublisher      │
│   (Playback)  │   (Publishing)      │
└───────────────┴─────────────────────┘
```

## Browser Support

Chrome 56+ / Firefox 44+ / Safari 11+ / Edge 79+

## License

MIT
