---
layout: home

head:
  - - link
    - rel: canonical
      href: https://null1126.github.io/webrtc-player/en/
  - - meta
    - name: keywords
      content: WebRTC, WebRTC player, WebRTC publishing, WebRTC subscriber, real-time video streaming, live streaming, SRS player, ZLMediaKit, monibuca, NPM package, TypeScript, React WebRTC, Vue WebRTC, video player SDK, WebRTC live, low latency streaming, WebRTC API
  - - meta
    - name: description
      content: WebRTC Player is a lightweight WebRTC video player npm package supporting both playback and publishing. Written in TypeScript, zero external dependencies, tree-shakable. Integrate into React, Vue, or any frontend project in minutes.
  - - meta
    - name: robots
      content: index, follow
  - - meta
    - property: og:site_name
      content: WebRTC Player
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: WebRTC Player - Lightweight WebRTC Video Player (Playback & Publishing)
  - - meta
    - property: og:description
      content: Lightweight WebRTC video player supporting both playback and publishing. Real-time video streaming based on WebRTC protocol, simple and performant.
  - - meta
    - property: og:url
      content: https://null1126.github.io/webrtc-player/en/
  - - meta
    - property: og:image
      content: https://null1126.github.io/webrtc-player/og-image.png
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: WebRTC Player - Lightweight WebRTC Video Player
  - - meta
    - name: twitter:description
      content: Lightweight WebRTC video player supporting playback and publishing. Clean API design, implement in just a few lines.

hero:
  name: WebRTC Player
  text: Lightweight WebRTC Player
  tagline: Supports playback and publishing, real-time video streaming based on WebRTC protocol, simple and performant
  actions:
    - theme: brand
      text: Get Started →
      link: /en/guide/getting-started
    - theme: alt
      text: Plugin System →
      link: /en/guide/plugins
    - theme: alt
      text: View API
      link: /en/api/
  image:
    src: /logo.svg
    alt: WebRTC Player

features:
  - icon: 🚀
    title: Easy to Use
    details: Clean API design, install and go. Available via npm with full TypeScript definitions. Play a video stream in just a few lines of code, zero external dependencies.
  - icon: 🔌
    title: Playback & Publishing
    details: 'One library for both: subscribe WebRTC streams from SRS, ZLMediaKit, monibuca and other servers; or publish local camera, microphone, or screen capture to any WebRTC-compatible server.'
  - icon: 🔗
    title: Protocol Compatible
    details: Built on standard WebRTC APIs (RTCPeerConnection, getUserMedia, RTCRtpSender). Works with any WebRTC-enabled media server, no lock-in on server choice.
  - icon: 🛠
    title: Custom Signaling
    details: Implement the SignalingProvider interface to connect to any signaling server — HTTP, WebSocket, or your own protocol. Built-in HttpSignalingProvider works with SRS out of the box, or swap in your own in a few lines.
  - icon: 📹
    title: Multi-Source Capture
    details: Supports camera (getUserMedia), microphone, and screen capture (getDisplayMedia). Switch input devices mid-stream without rebuilding the peer connection.
  - icon: ⚡
    title: High Performance & Zero Dependencies
    details: Pure TypeScript implementation, no runtime dependencies. Small bundle size, fast loading, tree-shakable, production-ready.
  - icon: 🌐
    title: Cross-Browser & Framework-Agnostic
    details: Built on standard WebRTC APIs, supporting Chrome, Firefox, Safari, and Edge. Works in React, Vue, Angular, or plain JavaScript without any framework adapter.
  - icon: 🏗️
    title: Use Cases
    details: Suitable for live commerce, online education, telemedicine, video conferencing, security surveillance, real-time game streaming, and any low-latency real-time video application.
---
