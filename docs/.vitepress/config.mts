import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WebRTC Engine',
  description: 'A lightweight WebRTC video player library',

  // GitHub Pages 部署路径
  // ⚠️ 请根据你的 GitHub 仓库路径修改：
  //   - 用户仓库: /webrtc-engine/
  //   - 组织仓库: /your-org/webrtc-engine/
  base: '/webrtc-engine/',

  // 默认暗黑主题
  appearance: 'dark',

  // 多语言支持
  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/' },
          { text: '示例', link: '/zh/examples/' },
          { text: '插件', link: '/zh/plugins/system' },
          { text: '版本', link: '/zh/versions/' },
        ],
      },
      head: [
        [
          'script',
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'WebRTC Engine',
                alternateName: 'webrtc-engine',
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Web (Browser)',
                programmingLanguage: ['TypeScript', 'JavaScript'],
                description:
                  '轻量级 WebRTC 视频播放器 npm 包，支持拉流与推流功能。TypeScript 编写，零外部依赖，可集成 React、Vue 等前端项目。',
                url: 'https://null1126.github.io/webrtc-engine/',
                downloadUrl: 'https://www.npmjs.com/package/webrtc-engine',
                installUrl: 'https://www.npmjs.com/package/webrtc-engine',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                author: {
                  '@type': 'Person',
                  name: 'null1126',
                  url: 'https://github.com/null1126',
                },
                softwareVersion: '1.0.0',
                softwareRequirements: ['WebRTC', 'getUserMedia API'],
                featureList: [
                  '从流媒体服务器拉取 WebRTC 视频流并播放',
                  '采集本地摄像头、麦克风、屏幕录制并推流',
                  '与 SRS、ZLMediaKit、monibuca 等流媒体服务器配合使用',
                  '支持 SignalingProvider 接口，可对接 HTTP、WebSocket 等自定义信令服务器',
                  'TypeScript / JavaScript 双重支持',
                  '支持 React、Vue 等主流前端框架',
                  'npm install 即可安装，无外部依赖',
                  '支持动态切换视频源（无需重建播放器）',
                  '完整的事件系统（连接状态、错误、权限等）',
                  '跨浏览器支持（Chrome、Firefox、Safari、Edge）',
                ],
                applicationSubCategory: 'Video Streaming SDK',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'WebRTC Engine 支持哪些流媒体服务器？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'WebRTC Engine 支持所有兼容 WebRTC 协议的流媒体服务器，包括但不限于 SRS、ZLMediaKit、monibuca 等主流服务器。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'WebRTC Engine 如何安装？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '通过 npm 安装：npm install webrtc-engine 或 pnpm add webrtc-engine。也可以通过 CDN 直接引入。安装后只需几行代码即可完成 WebRTC 视频播放或推流。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'WebRTC Engine 支持哪些前端框架？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'WebRTC Engine 是框架无关的原生 JavaScript 库，可直接用于原生 JS、React、Vue、Angular 等任何前端项目。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'WebRTC Engine 支持推流吗？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '支持。WebRTC Engine 同时支持拉流（从服务器播放视频）和推流（采集本地摄像头/麦克风/屏幕并推送到服务器）。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'WebRTC Engine 有 TypeScript 类型支持吗？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '有。WebRTC Engine 全程使用 TypeScript 编写，提供完整的类型定义，无需额外安装 @types 包。',
                    },
                  },
                ],
              },
            ]),
          },
        ],
      ],
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/' },
          { text: 'Examples', link: '/en/examples/' },
          { text: 'Plugins', link: '/en/plugins/system' },
          { text: 'Versions', link: '/en/versions/' },
        ],
      },
      head: [
        [
          'script',
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'WebRTC Engine',
                alternateName: 'webrtc-engine',
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Web (Browser)',
                programmingLanguage: ['TypeScript', 'JavaScript'],
                description:
                  'Lightweight WebRTC video player npm package supporting both playback and publishing. Written in TypeScript, zero external dependencies. Works with React, Vue, or any frontend framework.',
                url: 'https://null1126.github.io/webrtc-engine/',
                downloadUrl: 'https://www.npmjs.com/package/webrtc-engine',
                installUrl: 'https://www.npmjs.com/package/webrtc-engine',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                author: {
                  '@type': 'Person',
                  name: 'null1126',
                  url: 'https://github.com/null1126',
                },
                softwareVersion: '1.0.0',
                softwareRequirements: ['WebRTC', 'getUserMedia API'],
                featureList: [
                  'Subscribe and play WebRTC video streams from media servers',
                  'Publish local camera, microphone, or screen capture streams to servers',
                  'Compatible with SRS, ZLMediaKit, monibuca and other WebRTC-enabled servers',
                  'Implements SignalingProvider interface for custom HTTP, WebSocket or any signaling protocol',
                  'TypeScript / JavaScript with full type definitions',
                  'Works with React, Vue, Angular and other frontend frameworks',
                  'Install via npm / pnpm / yarn, zero runtime dependencies',
                  'Dynamic stream switching without recreating player instance',
                  'Full event lifecycle (connection state, errors, ICE candidates, permissions)',
                  'Cross-browser support (Chrome, Firefox, Safari, Edge)',
                ],
                applicationSubCategory: 'Video Streaming SDK',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What streaming servers does WebRTC Engine support?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'WebRTC Engine supports any WebRTC-compatible media server, including but not limited to SRS, ZLMediaKit, and monibuca.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How do I install WebRTC Engine?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Install via npm: npm install webrtc-engine or pnpm add webrtc-engine. You can also use CDN. After installation, playing or publishing a WebRTC stream requires only a few lines of code.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does WebRTC Engine work with React or Vue?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. WebRTC Engine is a framework-agnostic native JavaScript library. It works seamlessly with React, Vue, Angular, or plain JavaScript.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can WebRTC Engine publish streams as well as play them?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. WebRTC Engine supports both playback (subscribe streams from a media server) and publishing (capture camera/microphone/screen and send to a server).',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does WebRTC Engine include TypeScript types?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. WebRTC Engine is written entirely in TypeScript and ships with complete type definitions. No @types package needed.',
                    },
                  },
                ],
              },
            ]),
          },
        ],
      ],
    },
  },

  // 全局主题配置（侧边栏和 footer 跨语言共享，通过路径自动匹配）
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/null1126/webrtc-engine' }],
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    // 侧边栏
    sidebar: {
      '/zh/guide/': [
        {
          text: '指南',
          items: [
            { text: '简介', link: '/zh/guide/' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
            { text: '事件监听', link: '/zh/guide/events' },
            { text: '推流指南', link: '/zh/guide/publisher' },
            { text: '自定义信令', link: '/zh/guide/custom-signaling' },
          ],
        },
        {
          text: 'API',
          items: [
            { text: 'RtcPlayer', link: '/zh/api/' },
            { text: 'RtcPublisher', link: '/zh/api/publisher' },
            { text: 'RtcState', link: '/zh/api/state' },
          ],
        },
      ],
      '/zh/api/': [
        {
          text: '指南',
          items: [
            { text: '简介', link: '/zh/guide/' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
            { text: '事件监听', link: '/zh/guide/events' },
            { text: '推流指南', link: '/zh/guide/publisher' },
            { text: '自定义信令', link: '/zh/guide/custom-signaling' },
          ],
        },
        {
          text: 'API',
          items: [
            { text: 'RtcPlayer', link: '/zh/api/' },
            { text: 'RtcPublisher', link: '/zh/api/publisher' },
            { text: 'RtcState', link: '/zh/api/state' },
          ],
        },
      ],
      '/zh/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础用法', link: '/zh/examples/' },
            { text: '切换视频源', link: '/zh/examples/switch-stream' },
            { text: '推流示例', link: '/zh/examples/publisher' },
          ],
        },
      ],
      '/zh/plugins/': [
        {
          text: '插件',
          items: [
            { text: '插件系统', link: '/zh/plugins/system' },
            { text: '插件 API', link: '/zh/plugins/api' },
            { text: '官方插件', link: '/zh/plugins/official' },
          ],
        },
      ],
      '/zh/versions/': [
        {
          text: '版本管理',
          items: [
            { text: '版本列表', link: '/zh/versions/' },
            { text: 'v2.1.0', link: '/zh/versions/v2.1.0' },
            { text: 'v2.0.0', link: '/zh/versions/v2.0.0' },
            { text: 'v1.2.0', link: '/zh/versions/v1.2.0' },
            { text: 'v1.0.0', link: '/zh/versions/v1.0.0' },
          ],
        },
      ],
      '/en/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/en/guide/' },
            { text: 'Getting Started', link: '/en/guide/getting-started' },
            { text: 'Events', link: '/en/guide/events' },
            { text: 'Publishing', link: '/en/guide/publisher' },
            { text: 'Custom Signaling', link: '/en/guide/custom-signaling' },
          ],
        },
        {
          text: 'API',
          items: [
            { text: 'RtcPlayer', link: '/en/api/' },
            { text: 'RtcPublisher', link: '/en/api/publisher' },
            { text: 'RtcState', link: '/en/api/state' },
          ],
        },
      ],
      '/en/api/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/en/guide/' },
            { text: 'Getting Started', link: '/en/guide/getting-started' },
            { text: 'Events', link: '/en/guide/events' },
            { text: 'Publishing', link: '/en/guide/publisher' },
            { text: 'Custom Signaling', link: '/en/guide/custom-signaling' },
          ],
        },
        {
          text: 'API',
          items: [
            { text: 'RtcPlayer', link: '/en/api/' },
            { text: 'RtcPublisher', link: '/en/api/publisher' },
            { text: 'RtcState', link: '/en/api/state' },
          ],
        },
      ],
      '/en/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/en/examples/' },
            { text: 'Switch Stream', link: '/en/examples/switch-stream' },
            { text: 'Publishing', link: '/en/examples/publisher' },
          ],
        },
      ],
      '/en/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Plugin System', link: '/en/plugins/system' },
            { text: 'Plugin API', link: '/en/plugins/api' },
            { text: 'Official Plugins', link: '/en/plugins/official' },
          ],
        },
      ],
      '/en/versions/': [
        {
          text: 'Versions',
          items: [
            { text: 'Version List', link: '/en/versions/' },
            { text: 'v2.1.0', link: '/en/versions/v2.1.0' },
            { text: 'v2.0.0', link: '/en/versions/v2.0.0' },
            { text: 'v1.2.0', link: '/en/versions/v1.2.0' },
            { text: 'v1.0.0', link: '/en/versions/v1.0.0' },
          ],
        },
      ],
    },

    // footer
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2026 WebRTC Engine',
    },
  },

  // 头部脚本（全局）
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['link', { rel: 'canonical', href: 'https://null1126.github.io/webrtc-engine/' }],
    [
      'style',
      { type: 'text/css' },
      `
      .VPNavBar .content .VPNavBarSocialLinks {
        margin-right: 12px;
      }
    `,
    ],
  ],
});
