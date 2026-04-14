# @webrtc-engine/plugin-logger

[主项目](https://github.com/null1126/webrtc-engine)

日志插件，拦截 `RtcPlayer` 和 `RtcPublisher` 的生命周期事件，通过回调函数输出结构化日志。

---

## 安装

```bash
npm install @webrtc-engine/plugin-logger
# 或
pnpm add @webrtc-engine/plugin-logger
# 或
yarn add @webrtc-engine/plugin-logger
```

需要 peer dependency：

```bash
npm install @webrtc-engine/core
```

---

## 快速开始

### 拉流端

```typescript
import { RtcPlayer } from '@webrtc-engine/core';
import { createPlayerLoggerPlugin } from '@webrtc-engine/plugin-logger';

const logger = createPlayerLoggerPlugin({ includeDebug: false }, (entry) => {
  const prefix = entry.level === 'error' ? '❌' : entry.level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${entry.level}] ${entry.message}`);
});

const player = new RtcPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
});
player.use(logger);
await player.play();
```

### 推流端

```typescript
import { RtcPublisher } from '@webrtc-engine/core';
import { createPublisherLoggerPlugin } from '@webrtc-engine/plugin-logger';

const logger = createPublisherLoggerPlugin({ includeDebug: false }, (entry) => {
  const prefix = entry.level === 'error' ? '❌' : entry.level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${entry.level}] ${entry.message}`);
});

const publisher = new RtcPublisher({
  url: 'webrtc://localhost/live/pushstream',
  api: 'http://localhost:1985/rtc/v1/publish/',
  source: { type: 'camera', audio: true },
});
publisher.use(logger);
await publisher.start();
```

---

## API

### `createPlayerLoggerPlugin(options, callback)`

创建拉流端日志插件，返回值可直接传入 `player.use()`。

**参数**

| 参数       | 类型                  | 必填 | 说明               |
| ---------- | --------------------- | ---- | ------------------ |
| `options`  | `LoggerPluginOptions` | 否   | 配置选项           |
| `callback` | `LogCallback`         | 是   | 每次产生日志时调用 |

### `createPublisherLoggerPlugin(options, callback)`

创建推流端日志插件，返回值可直接传入 `publisher.use()`。

**参数**

| 参数       | 类型                  | 必填 | 说明               |
| ---------- | --------------------- | ---- | ------------------ |
| `options`  | `LoggerPluginOptions` | 否   | 配置选项           |
| `callback` | `LogCallback`         | 是   | 每次产生日志时调用 |

---

### LoggerPluginOptions

| 属性           | 类型      | 默认值  | 说明                                              |
| -------------- | --------- | ------- | ------------------------------------------------- |
| `maxLogs`      | `number`  | `200`   | 最大缓存日志条数，超过后自动丢弃最早日志          |
| `includeDebug` | `boolean` | `false` | 是否包含 debug 级别日志。debug 日志量大，注意性能 |

### LogCallback

```typescript
type LogCallback = (entry: LogEntry) => void;
```

每次有日志产生时，插件会调用此回调。

### LogEntry

回调收到的单条日志对象。

| 属性        | 类型       | 说明                                                     |
| ----------- | ---------- | -------------------------------------------------------- |
| `id`        | `number`   | 日志唯一递增 ID                                          |
| `time`      | `string`   | 日志时间，`HH:MM:SS` 格式                                |
| `timestamp` | `number`   | `Date.now()` 时间戳                                      |
| `level`     | `LogLevel` | 日志级别：`'info'` \| `'error'` \| `'warn'` \| `'debug'` |
| `message`   | `string`   | 日志正文内容                                             |
| `phase`     | `string`   | 所属插件阶段（`PluginPhase`），便于按来源过滤            |

---

## 监控事件一览

### 拉流端（RtcPlayer）

| 回调 message 示例                       | 级别  | 触发时机                        |
| --------------------------------------- | ----- | ------------------------------- |
| `[状态] new / connecting / connected …` | info  | PeerConnection 状态变更         |
| `[ICE] new / checking / connected …`    | info  | ICE 连接状态变更                |
| `[ICE Gathering] new / gathering …`     | debug | ICE 候选收集状态变更            |
| `[ICE] candidate…`                      | debug | 收到 ICE 候选（截断至 80 字符） |
| `[ICE] (空候选)`                        | debug | 收到空候选                      |
| `[错误] xxx`                            | error | 捕获到运行时错误                |
| `[事件] track — 收到远端流 (Nv / Na)`   | info  | 收到远端媒体流                  |
| `[事件] playing — 视频播放中`           | info  | 视频开始播放                    |
| `[操作] 切换至 webrtc://…`              | info  | 调用 `switchStream` 前          |
| `[事件] 切换完成 webrtc://…`            | info  | `switchStream` 切换完成         |
| `[操作] 停止拉流`                       | info  | 调用 `destroy()` 前             |

### 推流端（RtcPublisher）

| 回调 message 示例                              | 级别  | 触发时机                        |
| ---------------------------------------------- | ----- | ------------------------------- |
| `[状态] new / connecting / connected …`        | info  | PeerConnection 状态变更         |
| `[ICE] new / checking / connected …`           | info  | ICE 连接状态变更                |
| `[ICE Gathering] new / gathering …`            | debug | ICE 候选收集状态变更            |
| `[ICE] candidate…`                             | debug | 收到 ICE 候选（截断至 80 字符） |
| `[ICE] (空候选)`                               | debug | 收到空候选                      |
| `[错误] xxx`                                   | error | 捕获到运行时错误                |
| `[状态] CONNECTING / CONNECTED / …`            | info  | 推流连接状态变更                |
| `[事件] streamstart — 推流已启动`              | info  | 推流成功开始                    |
| `[操作] 停止推流`                              | info  | 调用 `stop()` 或 `destroy()` 前 |
| `[操作] 切换至 摄像头 / 屏幕录制`              | info  | 调用 `switchSource` 前          |
| `[事件] sourcechange — 输入源已切换: xxx`      | info  | `switchSource` 切换完成         |
| `[事件] trackAttached — video / audio (Nv/Na)` | debug | 本地轨道附加到 MediaStream      |
| `[操作] 停止推流`                              | info  | 调用 `destroy()` 前             |

---

## 与 try/catch 中手动日志的关系

`player.play()` 内部已经通过 `emitError()` 触发了 `onError` hook，所以 logger 插件**会自动记录启动失败**。如果在外层 `try/catch` 中重复调用 `appendLog`，会导致同一条错误出现两次。

建议让 logger 插件统一处理，示例：

```typescript
// ✅ 推荐：仅处理成功后的逻辑
await player.play();

// ✅ 也可以保留 catch，但不打印日志，只做 UI 反馈
try {
  await player.play();
} catch (err) {
  showErrorToast('连接失败，请检查网络');
}
```

## 许可证

[MIT](./LICENSE) — Copyright (c) 2024-present WebRTC Engine Contributors
