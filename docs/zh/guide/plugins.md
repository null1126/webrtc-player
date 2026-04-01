---
title: WebRTC Player - 插件系统
description: WebRTC Player 插件系统文档，介绍如何编写和使用插件。
---

# 插件系统

WebRTC Player 提供了一套灵活的插件系统，允许你在播放器/推流器的生命周期关键节点注入自定义逻辑，实现日志记录、性能监控、数据统计、媒体处理等扩展功能。

## 安装官方插件

```bash
npm install @webrtc-player/plugin-logger @webrtc-player/plugin-performance
# 或
pnpm add @webrtc-player/plugin-logger @webrtc-player/plugin-performance
```

## 快速开始

### 方式一：通过配置传入

插件可在创建播放器实例时直接传入 `plugins` 配置项：

```typescript
import { RtcPlayer } from '@webrtc-player/core';
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
  plugins: [
    createPlayerLoggerPlugin(),
    createPerformancePlugin({ onStats: (s) => console.log(s) }),
  ],
});

player.on('state', (state) => console.log(state));
await player.play();
```

### 方式二：通过 .use() 链式调用

插件也可以在播放器创建后，通过 `.use()` 方法动态注册：

```typescript
import { RtcPlayer } from '@webrtc-player/core';
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: videoElement,
});

player
  .use(createPlayerLoggerPlugin())
  .use(createPerformancePlugin({ onStats: (s) => console.log(s) }));

player.on('state', (state) => console.log(state));
await player.play();
```

两种方式的插件都会在 `play()` 被调用时自动生效。两种方式也可以同时使用。

## 安装与卸载

```typescript
const plugin = createPlayerLoggerPlugin();

// 注册并安装插件，立即生效
player.use(plugin);

// 卸载插件，触发 uninstall() 回调并从管理器移除
player.unuse(plugin.name);

// 卸载全部插件
player.unuseAll();
```

## 架构

插件系统基于 **Hook 机制**：插件通过声明一组 Hook 函数来介入播放器的生命周期。Hook 按用途分为三类：

| 类型               | 说明       | 行为                                                                       |
| ------------------ | ---------- | -------------------------------------------------------------------------- |
| **Notify Hook**    | 通知型     | 纯副作用，无需返回值，用于日志记录、统计上报等                             |
| **Pipe Hook**      | 同步管道型 | 同步调用，**首个返回值的插件**决定后续插件的输入，用于修改参数、拦截请求等 |
| **AsyncPipe Hook** | 异步管道型 | 支持 `Promise` 返回，适用于 `getUserMedia` 等异步操作前的参数处理          |

## 插件接口

### 基础接口 `RtcBasePlugin`

所有插件都实现此接口：

```typescript
interface RtcBasePlugin<I = unknown> {
  /** 插件唯一名称，同名插件只能注册一次 */
  name: string;

  /** 优先级，数值越大越先执行，默认 0 */
  priority?: number;

  /** 插件注册时调用，用于初始化资源 */
  install?(instance: I): void | Promise<void>;

  /** 插件卸载时调用，用于清理资源 */
  uninstall?(): void | Promise<void>;
}
```

### `RtcPlayerPluginInstance` — 播放器插件实例

插件在 `install()` 时接收一个只读实例对象，可用于查询当前状态：

```typescript
interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  getStreamUrl(): string;
  getVideoElement(): HTMLVideoElement | undefined;
  getCurrentStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

### `RtcPublisherPluginInstance` — 推流器插件实例

```typescript
interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

---

## Hook 详解

以下是所有插件 Hook 的完整说明，按调用阶段排序。

### 通用 Hook（播放器与推流器共用）

#### `onPeerConnectionCreated(pc)`

**类型：** Notify Hook | **调用时机：** RTCPeerConnection 创建完成后

**参数：**

| 参数 | 类型                | 说明             |
| ---- | ------------------- | ---------------- |
| `pc` | `RTCPeerConnection` | 新创建的连接对象 |

**用途：** 在连接建立后访问底层 RTCPeerConnection，添加数据通道、绑定统计回调、修改 ICE 配置等。

```typescript
onPeerConnectionCreated(pc: RTCPeerConnection) {
  // 添加自定义 RTCDataChannel
  const channel = pc.createDataChannel('custom');
}
```

---

#### `onIceCandidate(candidate)`

**类型：** Notify Hook | **调用时机：** ICE 候选者收集完成时

**参数：**

| 参数        | 类型              | 说明                |
| ----------- | ----------------- | ------------------- |
| `candidate` | `RTCIceCandidate` | 新收集的 ICE 候选者 |

**用途：** 记录或上报 ICE 候选者信息。

```typescript
onIceCandidate(candidate: RTCIceCandidate) {
  console.log('ICE Candidate:', candidate.candidate);
}
```

---

#### `onBeforeICESetCandidate(candidate)`

**类型：** Pipe Hook | **调用时机：** ICE 候选者被添加到远端之前

**参数：**

| 参数        | 类型              | 说明                |
| ----------- | ----------------- | ------------------- |
| `candidate` | `RTCIceCandidate` | 待添加的 ICE 候选者 |

**返回值：** 返回原候选者以添加；返回 `null` 跳过此次候选；返回修改后的 `RTCIceCandidate` 替换候选者。

**用途：** 选择性地过滤或修改 ICE 候选者，例如移除特定类型的候选以优化连接路径。

```typescript
onBeforeICESetCandidate(candidate: RTCIceCandidate) {
  // 跳过 localhost 候选
  if (candidate.candidate.includes('127.0.0.1')) return null;
  return candidate;
}
```

---

#### `onConnectionStateChange(state)`

**类型：** Notify Hook | **调用时机：** WebRTC 连接状态变更时

**参数：**

| 参数    | 类型                     | 说明                                                                                                       |
| ------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `state` | `RTCPeerConnectionState` | 当前连接状态（`'new'` \| `'connecting'` \| `'connected'` \| `'disconnected'` \| `'failed'` \| `'closed'`） |

**用途：** 监听连接整体状态变化，更新 UI 状态或触发重连逻辑。

```typescript
onConnectionStateChange(state: RTCPeerConnectionState) {
  console.log('Connection state:', state);
}
```

---

#### `onIceConnectionStateChange(state)`

**类型：** Notify Hook | **调用时机：** ICE 连接状态变更时

**参数：**

| 参数    | 类型                    | 说明                                                                                                                           |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `state` | `RTCIceConnectionState` | 当前 ICE 连接状态（`'new'` \| `'checking'` \| `'connected'` \| `'completed'` \| `'failed'` \| `'disconnected'` \| `'closed'`） |

**用途：** 监控 ICE 层连接质量，比 `onConnectionStateChange` 更细粒度，可用于判断 NAT 类型或对等连接质量。

---

#### `onIceGatheringStateChange(state)`

**类型：** Notify Hook | **调用时机：** ICE 候选收集状态变更时

**参数：**

| 参数    | 类型                   | 说明                                                     |
| ------- | ---------------------- | -------------------------------------------------------- |
| `state` | `RTCIceGatheringState` | 当前收集状态（`'new'` \| `'gathering'` \| `'complete'`） |

**用途：** 监听 ICE 收集进度，`state === 'complete'` 时表示候选收集完毕。

---

#### `onError(error)`

**类型：** Pipe Hook | **调用时机：** 播放器/推流器内部发生错误时

**参数：**

| 参数    | 类型     | 说明         |
| ------- | -------- | ------------ |
| `error` | `string` | 错误描述信息 |

**返回值：** 返回 `true` 表示已处理该错误，阻止默认错误事件（`player.on('error')`）触发。

**用途：** 自定义错误处理逻辑，如上报到监控系统、静默忽略特定错误。

```typescript
onError(error: string) {
  myReporter.report(error);
  return true; // 阻止默认行为（不触发 error 事件）
}
```

---

#### `onPreDestroy()`

**类型：** Notify Hook | **调用时机：** `destroy()` 调用后、RTCPeerConnection 关闭前

**返回值：** 支持 `Promise`，等待异步清理完成后再继续销毁流程。

**用途：** 在插件中清理定时器、移除事件监听、取消网络请求等。连接此时仍可用。

```typescript
onPreDestroy() {
  clearInterval(this.timerId);
  this.ws?.close();
}
```

---

#### `onPostDestroy()`

**类型：** Notify Hook | **调用时机：** `destroy()` 流程的最后阶段，RTCPeerConnection 已关闭后

**返回值：** 支持 `Promise`。

**用途：** 最终清理，确保所有资源都已释放。连接对象此时已不可用。

---

### 播放器专用 Hook

#### `onBeforeConnect(options)`

**类型：** Pipe Hook | **调用时机：** `play()` 被调用后、开始连接前

**参数：**

| 参数      | 类型               | 说明                 |
| --------- | ------------------ | -------------------- |
| `options` | `RtcPlayerOptions` | 当前播放器的配置对象 |

**返回值：** 返回修改后的 `RtcPlayerOptions` 替换原配置，或返回 `void` 使用原配置。

**用途：** 在连接前动态修改 URL、媒体约束或 RTCConfiguration，例如根据网络环境选择不同服务器。

```typescript
onBeforeConnect(options: RtcPlayerOptions) {
  return {
    ...options,
    url: options.url.replace('low', 'high'),
    config: { ...options.config, iceServers: [...] },
  };
}
```

---

#### `onBeforeSetLocalDescription(offer)`

**类型：** Pipe Hook | **调用时机：** `setLocalDescription()` 调用前，offer SDP 生成之后

**参数：**

| 参数    | 类型                        | 说明                   |
| ------- | --------------------------- | ---------------------- |
| `offer` | `RTCSessionDescriptionInit` | 待设置的本地 offer SDP |

**返回值：** 返回修改后的 SDP 替换原值。

**用途：** 在 SDP 发送前修改其内容，例如插入自定义 Session Description Parameters (SDP mid、Codec 参数等)。

---

#### `onBeforeSetRemoteDescription(answer)`

**类型：** Pipe Hook | **调用时机：** `setRemoteDescription()` 调用前，answer SDP 到达之后

**参数：**

| 参数     | 类型                        | 说明                    |
| -------- | --------------------------- | ----------------------- |
| `answer` | `RTCSessionDescriptionInit` | 待设置的远端 answer SDP |

**返回值：** 返回修改后的 SDP 替换原值。

**用途：** 修改远端 SDP 内容，例如调整 Media Description 中的带宽参数。

---

#### `onRemoteDescriptionSet()`

**类型：** Notify Hook | **调用时机：** `setRemoteDescription()` 成功完成后

**用途：** 在 SDP 交换完成后执行操作，例如开始收集本地候选者后的额外处理。

---

#### `onTrack(track, stream)`

**类型：** Notify Hook | **调用时机：** 收到远端媒体轨道时

**参数：**

| 参数     | 类型               | 说明               |
| -------- | ------------------ | ------------------ |
| `track`  | `MediaStreamTrack` | 收到的媒体轨道     |
| `stream` | `MediaStream`      | 所属的 MediaStream |

**用途：** 监听远端轨道到达，可用于在轨道到达前执行处理逻辑。

```typescript
onTrack(track: MediaStreamTrack, stream: MediaStream) {
  console.log('Remote track:', track.kind, 'id:', track.id);
}
```

---

#### `onBeforeVideoPlay(stream)`

**类型：** Pipe Hook | **调用时机：** 远端流被赋值给 `video.srcObject` 之前

**参数：**

| 参数     | 类型          | 说明                     |
| -------- | ------------- | ------------------------ |
| `stream` | `MediaStream` | 待播放的远端 MediaStream |

**返回值：** 返回替换后的 `MediaStream`；返回 `void` 使用原流。

**用途：** 在视频元素播放前对流进行处理，例如添加额外的音频轨道、替换视频轨道、插入滤镜等。

```typescript
onBeforeVideoPlay(stream: MediaStream) {
  // 替换为静音版本
  const muted = new MediaStream(stream.getVideoTracks());
  return muted;
}
```

---

#### `onPlaying()`

**类型：** Notify Hook | **调用时机：** 视频元素触发 `playing` 事件，视频开始播放时

**用途：** 确认视频已开始播放，可用于启动性能统计、隐藏加载动画等。

---

#### `onBeforeSwitchStream(url)`

**类型：** Pipe Hook | **调用时机：** `switchStream(url)` 调用后、实际切换前

**参数：**

| 参数  | 类型     | 说明       |
| ----- | -------- | ---------- |
| `url` | `string` | 目标流地址 |

**返回值：** 返回修改后的 URL 替换原地址。

**用途：** 在流切换前修改目标地址，例如根据客户端 ID 动态路由到不同节点。

```typescript
onBeforeSwitchStream(url: string) {
  return url.replace('/live/', '/live/replica-2/');
}
```

---

#### `onAfterSwitchStream(url)`

**类型：** Notify Hook | **调用时机：** 流切换流程完成后

**参数：**

| 参数  | 类型     | 说明           |
| ----- | -------- | -------------- |
| `url` | `string` | 切换后的流地址 |

**用途：** 流切换完成后的后续处理，如更新 UI、记录切换耗时。

---

#### `onBeforeVideoRender()`

**类型：** AsyncPipe Hook | **调用时机：** 每帧 `requestAnimationFrame` 触发时

**返回值：** 支持 `Promise`，异步处理完成后才开始帧渲染。

**用途：** 视频帧级处理，如截图、水印叠加、实时滤镜等。

```typescript
onBeforeVideoRender(): Promise<void> {
  return drawWatermark(this.canvas, this.video);
}
```

---

### 推流器专用 Hook

#### `onBeforeGetUserMedia(constraints)`

**类型：** Pipe Hook | **调用时机：** `getUserMedia()` 调用前

**参数：**

| 参数          | 类型                     | 说明             |
| ------------- | ------------------------ | ---------------- |
| `constraints` | `MediaStreamConstraints` | 待使用的媒体约束 |

**返回值：** 返回修改后的约束替换原值。

**用途：** 在采集前调整分辨率、帧率、码率约束，或切换音频设备。

```typescript
onBeforeGetUserMedia(constraints: MediaStreamConstraints) {
  return {
    ...constraints,
    video: { ...(constraints.video as MediaTrackConstraints), width: 1280, height: 720 },
  };
}
```

---

#### `onMediaStream(stream)`

**类型：** Notify Hook | **调用时机：** `getUserMedia()` 成功返回后

**参数：**

| 参数     | 类型          | 说明                     |
| -------- | ------------- | ------------------------ |
| `stream` | `MediaStream` | 采集到的本地 MediaStream |

**用途：** 在获取到本地流后执行处理，如添加额外轨道、录音、生成预览缩略图等。

---

#### `onBeforeAttachStream(stream)`

**类型：** AsyncPipe Hook | **调用时机：** 本地流被添加到 RTCPeerConnection 前

**参数：**

| 参数     | 类型          | 说明                 |
| -------- | ------------- | -------------------- |
| `stream` | `MediaStream` | 待接入的 MediaStream |

**返回值：** 支持 `Promise`；返回替换后的 `MediaStream`；返回 `void` 使用原流。

**用途：** 在流接入连接前进行处理，如移除静音音轨、替换指定轨道。

```typescript
async onBeforeAttachStream(stream: MediaStream) {
  const enhanced = await applyNoiseSuppression(stream);
  return enhanced;
}
```

---

#### `onBeforeAttachTrack(track, stream)`

**类型：** AsyncPipe Hook | **调用时机：** 每条轨道单独添加前（视频轨和音频轨各调用一次）

**参数：**

| 参数     | 类型               | 说明               |
| -------- | ------------------ | ------------------ |
| `track`  | `MediaStreamTrack` | 待添加的轨道       |
| `stream` | `MediaStream`      | 所属的 MediaStream |

**返回值：** 支持 `Promise`；返回替换后的 `MediaStreamTrack`；返回 `void` 使用原轨道；返回 `null` 跳过此轨道。

**用途：** 逐轨道精细控制，如单独对音频轨道降噪、对视频轨道加滤镜。

```typescript
onBeforeAttachTrack(track: MediaStreamTrack, stream: MediaStream) {
  if (track.kind === 'audio') {
    return applyNoiseSuppressionToTrack(track);
  }
  return track;
}
```

---

#### `onTrackAttached(track, stream)`

**类型：** Notify Hook | **调用时机：** 轨道成功添加到 RTCPeerConnection 后

**参数：**

| 参数     | 类型               | 说明               |
| -------- | ------------------ | ------------------ |
| `track`  | `MediaStreamTrack` | 已添加的轨道       |
| `stream` | `MediaStream`      | 所属的 MediaStream |

**用途：** 在轨道添加完成后执行操作，如开启 RTCRtpSender 统计。

---

#### `onBeforeSetLocalDescription(offer)`

**类型：** Pipe Hook | **调用时机：** `setLocalDescription()` 调用前，offer SDP 生成之后

**参数：**

| 参数    | 类型                        | 说明                   |
| ------- | --------------------------- | ---------------------- |
| `offer` | `RTCSessionDescriptionInit` | 待设置的本地 offer SDP |

**返回值：** 返回修改后的 SDP 替换原值。

**用途：** 修改推流端的 SDP 参数，如调整带宽限制（`TIAS`）、codec 优先级。

---

#### `onBeforeSetRemoteDescription(answer)`

**类型：** Pipe Hook | **调用时机：** `setRemoteDescription()` 调用前，answer SDP 到达之后

**参数：**

| 参数     | 类型                        | 说明                    |
| -------- | --------------------------- | ----------------------- |
| `answer` | `RTCSessionDescriptionInit` | 待设置的远端 answer SDP |

**返回值：** 返回修改后的 SDP 替换原值。

---

#### `onRemoteDescriptionSet()`

**类型：** Notify Hook | **调用时机：** `setRemoteDescription()` 成功完成后

---

#### `onBeforeReplaceTrack(track)`

**类型：** Pipe Hook | **调用时机：** `replaceTrack()` 调用前

**参数：**

| 参数    | 类型                       | 说明                                        |
| ------- | -------------------------- | ------------------------------------------- |
| `track` | `MediaStreamTrack \| null` | 即将替换上来的新轨道，`null` 表示停止该轨道 |

**返回值：** 返回修改后的轨道替换原值；返回 `null` 跳过替换。

**用途：** 在替换前对轨道进行处理，如对新轨道加降噪。

```typescript
onBeforeReplaceTrack(track: MediaStreamTrack | null) {
  return track ? applyDenoise(track) : null;
}
```

---

#### `onAfterReplaceTrack()`

**类型：** Notify Hook | **调用时机：** `replaceTrack()` 完成后

---

#### `onTrack(track, stream)`

**类型：** Notify Hook | **调用时机：** 收到远端轨道时（用于回声场景）

**参数：**

| 参数     | 类型               | 说明               |
| -------- | ------------------ | ------------------ |
| `track`  | `MediaStreamTrack` | 收到的远端轨道     |
| `stream` | `MediaStream`      | 所属的 MediaStream |

**用途：** 推流端收到远端回声轨道时执行处理，如混音或渲染远端画面。

---

#### `onStreamingStateChange(state)`

**类型：** Notify Hook | **调用时机：** 推流状态变更时

**参数：**

| 参数    | 类型                                        | 说明         |
| ------- | ------------------------------------------- | ------------ |
| `state` | `'idle'` \| `'connecting'` \| `'streaming'` | 当前推流状态 |

**用途：** 监听推流状态机转换，更新 UI 指示器或触发自动重连。

---

#### `onPublishing()`

**类型：** Notify Hook | **调用时机：** 推流正式开始，`streamingState` 变为 `'streaming'` 时

**用途：** 推流开始确认，可用于显示"正在直播"标识。

---

#### `onUnpublishing()`

**类型：** Notify Hook | **调用时机：** 推流停止，`streamingState` 从 `'streaming'` 变为其他状态时

**用途：** 推流停止确认，清理相关状态。

---

#### `onBeforeSourceChange(source)`

**类型：** Pipe Hook | **调用时机：** `switchSource()` 调用后、实际切换媒体源前

**参数：**

| 参数     | 类型          | 说明           |
| -------- | ------------- | -------------- |
| `source` | `MediaSource` | 目标媒体源配置 |

**返回值：** 返回修改后的 `MediaSource` 替换原配置。

**用途：** 在源切换前调整配置，如强制使用特定设备 ID。

```typescript
onBeforeSourceChange(source: MediaSource) {
  if (source.type === 'camera') {
    return { ...source, audio: { deviceId: this.preferredMicId } };
  }
  return source;
}
```

---

#### `onAfterSourceChange(source)`

**类型：** Notify Hook | **调用时机：** 源切换流程完成后

**参数：**

| 参数     | 类型          | 说明               |
| -------- | ------------- | ------------------ |
| `source` | `MediaSource` | 切换后的媒体源配置 |

**用途：** 源切换完成后的后续处理。

---

## 编写自定义插件

下面实现一个带配置选项的日志插件：

```typescript
import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '@webrtc-player/core';

export interface CustomLoggerOptions {
  prefix?: string;
  levels?: ('track' | 'playing' | 'error')[];
  onLog?: (msg: string) => void;
}

export function createCustomLogger(options: CustomLoggerOptions = {}): RtcPlayerPlugin {
  const prefix = options.prefix ?? '[Player]';
  const levels = options.levels ?? ['track', 'playing', 'error'];
  const log = (msg: string) => options.onLog?.(msg) ?? console.log(msg);

  return {
    name: 'custom-logger',

    install(instance: RtcPlayerPluginInstance) {
      log(`${prefix} installed, URL: ${instance.getStreamUrl()}`);
    },

    uninstall() {
      log(`${prefix} uninstalled`);
    },

    onTrack(track, stream) {
      if (!levels.includes('track')) return;
      log(`${prefix} Track: ${track.kind} (${track.id}), streams: ${stream.id}`);
    },

    onPlaying() {
      if (!levels.includes('playing')) return;
      log(`${prefix} Video playing`);
    },

    onError(error) {
      if (!levels.includes('error')) return;
      log(`${prefix} Error: ${error}`);
      return false; // 不阻止默认错误行为
    },

    onPreDestroy() {
      log(`${prefix} Destroying...`);
    },
  };
}
```

使用：

```typescript
player.use(
  createCustomLogger({
    prefix: '[MyApp]',
    levels: ['playing', 'error'],
    onLog: (msg) => myLogger.info(msg),
  })
);
```

---

## 官方插件

### `@webrtc-player/plugin-logger`

记录播放器/推流器生命周期事件。详见 [plugin-logger 文档](https://github.com/null1126/webrtc-player/tree/main/packages/plugins/plugin-logger)。

```typescript
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
player.use(createPlayerLoggerPlugin());
```

### `@webrtc-player/plugin-performance`

监控播放器 FPS 和网络传输统计数据。详见 [plugin-performance 文档](https://github.com/null1126/webrtc-player/tree/main/packages/plugins/plugin-performance)。

```typescript
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';
player.use(createPerformancePlugin({ onStats: (s) => console.log(s) }));
```

---

## 最佳实践

- **错误处理**：Hook 中的所有错误会被捕获并记录，不会导致播放器崩溃。插件无需自行 try/catch。
- **优先级**：高优先级插件先执行。如需确保插件在其他插件之前运行，可设置 `priority: 100`。
- **唯一命名**：同名的插件只能注册一次，重复注册会被拒绝。
- **生命周期**：建议在 `onPreDestroy` 中清理定时器、事件监听器等资源。
- **异步 Hook**：`onBeforeVideoRender` 和 `onBeforeAttachStream`/`onBeforeAttachTrack` 支持 `Promise`，其他 Hook 均为同步。
- **返回值语义**：Pipe Hook 中，返回 `undefined` 表示"不干预"，返回具体值才表示"替换"。
