---
layout: home

head:
  - - link
    - rel: canonical
      href: https://null1126.github.io/webrtc-player/zh/
  - - meta
    - name: keywords
      content: WebRTC, WebRTC播放器, WebRTC推流, WebRTC拉流, 实时视频流, 直播推流, 直播拉流, SRS播放器, ZLMediaKit, monibuca, NPM包, TypeScript, React WebRTC, Vue WebRTC, 视频播放器SDK, WebRTC直播, 低延迟直播, 实时通讯
  - - meta
    - name: description
      content: WebRTC Player 是一个轻量级的 WebRTC 视频播放器 npm 包，支持拉流与推流功能，开箱即用，TypeScript 编写，零外部依赖。可快速集成到 React、Vue 等前端项目中。
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
      content: WebRTC Player - 轻量级 WebRTC 视频播放器（支持拉流与推流）
  - - meta
    - property: og:description
      content: 轻量级 WebRTC 视频播放器，支持拉流与推流。基于 WebRTC 协议的实时视频流播放，简单易用，性能卓越。
  - - meta
    - property: og:url
      content: https://null1126.github.io/webrtc-player/zh/
  - - meta
    - property: og:image
      content: https://null1126.github.io/webrtc-player/og-image.png
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: WebRTC Player - 轻量级 WebRTC 视频播放器
  - - meta
    - name: twitter:description
      content: 轻量级 WebRTC 视频播放器，支持拉流与推流。简洁的 API 设计，几行代码即可实现。

hero:
  name: WebRTC Player
  text: 轻量级 WebRTC 播放器
  tagline: 支持拉流与推流，基于 WebRTC 协议的实时视频流播放，简单易用，性能卓越
  actions:
    - theme: brand
      text: 快速开始 →
      link: /zh/guide/getting-started
    - theme: alt
      text: 插件系统 →
      link: /zh/guide/plugins
    - theme: alt
      text: 查看 API
      link: /zh/api/
  image:
    src: /logo.svg
    alt: WebRTC Player

features:
  - icon: 🚀
    title: 简单易用
    details: 简洁的 API 设计，安装即用，支持 npm install 安装，提供完整 TypeScript 类型。播放视频流只需数行代码，无任何外部依赖。
  - icon: 🔌
    title: 拉流与推流
    details: 一库双用：既可作为播放器，从 SRS、ZLMediaKit、monibuca 等服务器拉取视频流并播放；也可作为推流器，采集摄像头、麦克风或屏幕录制推送到服务器。
  - icon: 🧩
    title: 插件系统
    details: 丰富的可扩展插件体系，通过 Hook 机制在播放器生命周期关键节点注入自定义逻辑。官方提供日志记录、性能监控插件，也可轻松编写自己的插件。
  - icon: 🔗
    title: 协议兼容
    details: 严格遵循 WebRTC 协议（RTCPeerConnection、getUserMedia、RTCRtpSender）。与所有兼容 WebRTC 的流媒体服务器无缝对接，无需担心服务器选型。
  - icon: 🛠
    title: 自定义信令
    details: 通过 SignalingProvider 接口，可自由对接 HTTP、WebSocket 等任意信令服务器。内置 HttpSignalingProvider，可直接配合 SRS 使用，也可几行代码实现自己的信令。
  - icon: 📹
    title: 多源采集
    details: 支持摄像头（getUserMedia）、麦克风、屏幕录制（getDisplayMedia）等媒体源。可在推流过程中动态切换输入设备，无需重建连接。
  - icon: ⚡
    title: 高性能 & 零依赖 & 框架无关
    details: 纯 TypeScript 实现，无任何外部运行时依赖。体积小，加载快。可直接用于 React、Vue、Angular 或原生 JavaScript 项目。
  - icon: 🏗️
    title: 适用场景
    details: 适用于直播带货、在线教育、远程医疗、视频会议、安防监控、实时游戏推流等需要低延迟实时视频的应用场景。
  - icon: 📦
    title: npm 开源
    details: 开源免费（MIT License），发布于 npm，可通过 pnpm / npm / yarn 安装。源码托管于 GitHub，欢迎 star 和贡献。
---
