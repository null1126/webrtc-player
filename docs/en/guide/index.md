---
title: WebRTC Player - Introduction
description: WebRTC Player is a lightweight WebRTC video player library supporting both playback and publishing.
---

# Introduction

WebRTC Player is a lightweight WebRTC video player library supporting both **playback** and **publishing**.

## Features

- **Playback & Publishing** - One library for both
- **Protocol Compatible** - Works with SRS, ZLMediaKit, monibuca, etc.
- **Event-Driven** - Complete event system
- **Multi-Source** - Camera, microphone, screen recording
- **High Performance** - No dependencies, small bundle
- **Cross-Platform** - Chrome, Firefox, Safari, Edge

## Installation

```bash
pnpm add @webrtc-player/core
```

## Architecture

```
┌─────────────────────────────────────┐
│            WebRTC Player            │
├───────────────┬─────────────────────┤
│   RtcPlayer  │   RtcPublisher      │
│  (Playback)  │   (Publishing)      │
└───────────────┴─────────────────────┘
```

## Browser Support

Chrome 56+ / Firefox 44+ / Safari 11+ / Edge 79+

## License

MIT
