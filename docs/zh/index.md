---
layout: home

head:
  - - link
    - rel: canonical
      href: https://null1126.github.io/webrtc-engine/zh/
  - - meta
    - name: keywords
      content: WebRTC, WebRTC播放器, WebRTC推流, WebRTC拉流, 实时视频流, 直播推流, 直播拉流, SRS播放器, ZLMediaKit, monibuca, NPM包, TypeScript, React WebRTC, Vue WebRTC, 视频播放器SDK, WebRTC直播, 低延迟直播, 实时通讯
  - - meta
    - name: description
      content: WebRTC Engine 是面向前端工程化场景的 WebRTC 实时音视频 SDK，支持拉流与推流，基于 TypeScript 构建、零外部运行时依赖，可高效集成到 React、Vue 等应用中。
  - - meta
    - name: robots
      content: index, follow
  - - meta
    - property: og:site_name
      content: WebRTC Engine
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: WebRTC Engine - 面向工程化的 WebRTC 实时音视频 SDK
  - - meta
    - property: og:description
      content: 面向生产环境的 WebRTC 实时音视频能力封装，支持拉流与推流，API 清晰、集成高效、性能稳定。
  - - meta
    - property: og:url
      content: https://null1126.github.io/webrtc-engine/zh/
  - - meta
    - property: og:image
      content: https://null1126.github.io/webrtc-engine/og-image.png
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: WebRTC Engine - WebRTC 实时音视频 SDK
  - - meta
    - name: twitter:description
      content: 提供拉流与推流一体化能力的 WebRTC SDK，设计简洁、扩展灵活，助力快速构建低延迟实时音视频应用。

hero:
  name: WebRTC Engine
  text: 实时音视频 SDK
  tagline: 面向生产环境的拉流与推流一体化能力，API 清晰、扩展灵活，帮助你高效构建低延迟实时音视频应用
  actions:
    - theme: brand
      text: 快速开始 →
      link: /zh/guide/getting-started
    - theme: alt
      text: 查看 API
      link: /zh/api/
  image:
    src: /logo.svg
    alt: WebRTC Engine

features:
  - icon: 🚀
    title: 快速集成
    details: API 设计简洁一致，支持 npm 安装与完整 TypeScript 类型提示。无需复杂配置，即可在数行代码内完成拉流能力接入。
  - icon: 🔌
    title: 拉流推流一体化
    details: 单一 SDK 同时覆盖播放与推流能力。可对接 SRS、ZLMediaKit、monibuca 等服务器完成拉流播放，也可采集摄像头、麦克风与屏幕进行实时推流。
  - icon: 🧩
    title: 可扩展插件架构
    details: 基于 Hook 机制开放关键生命周期节点，便于注入日志、监控、鉴权与业务编排逻辑。支持官方插件即插即用，也支持自定义插件扩展。
  - icon: 🎨
    title: Canvas 深度渲染
    details: 支持将视频帧输出到 Canvas，便于实现水印叠加、区域标注、图像后处理与截图等视觉增强能力，满足复杂前端交互场景。
  - icon: 🔗
    title: 标准协议兼容
    details: 严格遵循 WebRTC 标准接口（RTCPeerConnection、getUserMedia、RTCRtpSender），可与主流 WebRTC 媒体服务器稳定互通，降低系统集成成本。
  - icon: 🛠
    title: 灵活信令对接
    details: 通过 SignalingProvider 抽象可无缝接入 HTTP、WebSocket 等任意信令体系。内置 HttpSignalingProvider，开箱即可对接 SRS，也便于按需实现私有协议。
  - icon: 📹
    title: 多媒体源采集
    details: 原生支持摄像头、麦克风与屏幕采集（getUserMedia / getDisplayMedia），并支持推流过程中的设备动态切换，减少重连带来的业务中断。
  - icon: ⚡
    title: 轻量高性能
    details: 纯 TypeScript 实现，零外部运行时依赖，体积可控、加载高效。框架无关设计可直接用于 React、Vue、Angular 与原生 JavaScript 项目。
  - icon: 🏗️
    title: 面向真实业务场景
    details: 适用于直播、在线教育、远程医疗、视频会议、安防监控与互动娱乐等低延迟实时音视频场景，支持从验证到生产的持续演进。
---
