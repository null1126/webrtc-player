# @webrtc-player/plugin-performance

[主项目](https://github.com/null1126/webrtc-player)

性能监控插件，拦截 `RtcPlayer` 的视频帧渲染与 WebRTC 连接统计，定时通过回调输出 FPS、网络带宽、丢包率、RTT 等关键指标。

---

## 安装

```bash
npm install @webrtc-player/plugin-performance
# 或
pnpm add @webrtc-player/plugin-performance
# 或
yarn add @webrtc-player/plugin-performance
```

需要 peer dependency：

```bash
npm install @webrtc-player/core
```

---

## 快速开始

```typescript
import { RtcPlayer } from '@webrtc-player/core';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

const perf = createPerformancePlugin({ interval: 1000 }, (data) => {
  console.log(`[${data.url}]`);
  console.log(`  FPS: ${data.fps?.fps ?? '-'}`);
  console.log(`  接收码率: ${data.network?.bitrateReceived ?? '-'} bps`);
  console.log(`  RTT: ${data.network?.rtt ?? '-'} ms`);
});

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});
player.use(perf);
await player.play();
```

---

## API

### `createPerformancePlugin(options, onReport)`

创建性能监控插件，返回值可直接传入 `player.use()`。

**参数**

| 参数       | 类型                              | 必填 | 说明                       |
| ---------- | --------------------------------- | ---- | -------------------------- |
| `options`  | `PerformancePluginOptions`        | 否   | 配置选项                   |
| `onReport` | `(data: PerformanceData) => void` | 是   | 定时收到性能数据的回调函数 |

---

### PerformancePluginOptions

| 属性       | 类型     | 默认值 | 说明                                                         |
| ---------- | -------- | ------ | ------------------------------------------------------------ |
| `interval` | `number` | `1000` | 监控数据上报间隔（毫秒），影响 FPS 采样精度和 stats 轮询频率 |

---

### PerformanceData

每次回调返回的完整性能数据对象。

| 属性        | 类型           | 说明                                    |
| ----------- | -------------- | --------------------------------------- |
| `url`       | `string`       | 当前拉流端 URL                          |
| `timestamp` | `number`       | 报告时刻的时间戳（`performance.now()`） |
| `fps`       | `FpsStats`     | FPS 监控数据，详见下方定义              |
| `network`   | `NetworkStats` | 网络统计，详见下方定义                  |

---

### FpsStats

| 属性     | 类型     | 说明                        |
| -------- | -------- | --------------------------- |
| `fps`    | `number` | 过去一秒的实时帧率（帧/秒） |
| `frames` | `number` | 过去一秒内渲染的总帧数      |

---

### NetworkStats

| 属性                      | 类型                    | 说明                                                              |
| ------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `bytesSent`               | `number`                | 发送字节数（自连接建立以来累计）                                  |
| `bytesReceived`           | `number`                | 接收字节数（自连接建立以来累计）                                  |
| `bitrateSent`             | `number`                | 当前预估发送比特率（bps）                                         |
| `bitrateReceived`         | `number`                | 当前预估接收比特率（bps）                                         |
| `rtt`                     | `number \| null`        | 往返时延（ms），尚未收到 RTCP 时为 `null`                         |
| `connectionState`         | `RTCIceConnectionState` | 当前 ICE 候选对的连接状态                                         |
| `jitter`                  | `number \| null`        | 当前 RTP 视频轨道的抖动（秒），可能为 `null`                      |
| `packetsLostRate`         | `number`                | 发送数据包丢包率（0\~1），计算公式：`packetsLost / totalSent`     |
| `packetsReceivedLostRate` | `number`                | 接收数据包丢包率（0\~1），计算公式：`packetsLost / totalReceived` |

> **关于丢包率字段的说明**：`packetsLostRate` 对应发送端视角（本地向外发送的 RTP 包中丢失的比例），`packetsReceivedLostRate` 对应接收端视角（从远端接收的 RTP 包中丢失的比例）。两者均以小数形式（0\~1）返回。

---

## 监控指标解读

### FPS

FPS 通过在 `onBeforeVideoRender` hook 中计数视频帧来统计，精度依赖于浏览器刷新率。

| 帧率范围 | 含义                             |
| -------- | -------------------------------- |
| `≈ 60`   | 流畅（通常对应 60Hz 显示器）     |
| `≈ 30`   | 流畅（通常对应 30Hz 直播流）     |
| `< 15`   | 可能存在卡顿，建议检查网络或解码 |

### 码率（bitrate）

- `bitrateReceived`：拉流端实际接收到的视频码率，与服务器推流码率相关。
- `bitrateSent`：本端向服务器发送的码率（通常为 0，因为这是拉流端）。

### RTT（往返时延）

| RTT 范围    | 质量评价             |
| ----------- | -------------------- |
| `< 100ms`   | 优秀                 |
| `100~300ms` | 良好                 |
| `> 300ms`   | 较差，可能有明显延迟 |

> `rtt` 为 `null` 表示尚未收到远端 RTCP 反馈，通常在连接初期会出现。

### 丢包率

| 丢包率范围    | 质量评价                 |
| ------------- | ------------------------ |
| `0 ~ 0.01`    | 优秀（< 1%）             |
| `0.01 ~ 0.05` | 良好（1% ~ 5%）          |
| `> 0.05`      | 较差，可能出现花屏或卡顿 |

## 局限性

- **仅支持拉流端**：该插件目前仅拦截 `RtcPlayer` 的帧渲染，不支持 `RtcPublisher`。
- **统计延迟**：`bytesSent` / `bytesReceived` 等累计值需要两次采样才能计算出码率，初次上报的 `bitrateSent` / `bitrateReceived` 可能为 0。
- **精度依赖**：`jitter` 与 `rtt` 的精度受制于浏览器的 RTCP 反馈频率，初期连接可能为 `null`。

---

## 许可证

[MIT](./LICENSE) — Copyright (c) 2024-present WebRTC Player Contributors
