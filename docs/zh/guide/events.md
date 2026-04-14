---
title: WebRTC Engine - 事件监听
description: WebRTC Engine 事件模型与监听方式，覆盖通用、拉流与推流事件。
---

# 事件监听

WebRTC Engine 采用事件驱动模型。你可以通过事件感知连接状态、媒体轨道变化与错误信息，并据此实现可观测、可恢复的实时链路。

## 事件详解

本节按插件 API 的 Hook 文档规范描述事件：统一给出**类型、触发时机、参数签名与用途建议**。

> 事件分类导航：
>
> - [通用事件（播放器 / 推流器）](#通用事件播放器--推流器)
> - [拉流事件（播放器）](#拉流事件播放器)
> - [推流事件（推流器）](#推流事件推流器)

## 通用事件（播放器 / 推流器）

#### `state`

- 类型：State Event
- 时机：RTC 状态变化时
- 签名：`state: RtcState`
- 状态值：`connecting`、`connected`、`disconnected`、`failed`、`closed`、`switching`、`switched`、`destroyed`
- 用途：驱动业务状态机（连接中 / 已连接 / 重连中 / 失败）

#### `error`

- 类型：Error Event
- 时机：运行期异常发生时
- 签名：`error: string`
- 用途：统一错误提示、日志上报与告警

#### `icecandidate`

- 类型：Notify Event
- 时机：本地 ICE 候选产生时
- 签名：`candidate: RTCIceCandidate`
- 用途：连通性调试、候选信息观测

#### `iceconnectionstate`

- 类型：Notify Event
- 时机：ICE 连接状态变化时
- 签名：`state: RTCIceConnectionState`
- 用途：监控网络质量与连接健康度

#### `icegatheringstate`

- 类型：Notify Event
- 时机：ICE 收集状态变化时
- 签名：`state: RTCIceGatheringState`
- 用途：判断候选是否收集完成

#### `reconnecting`

- 类型：Notify Event
- 时机：每次发起自动重连时
- 签名：`data: { retryCount: number; maxRetries: number; interval: number }`
- 用途：展示重连进度、记录重试策略

#### `reconnectfailed`

- 类型：Notify Event
- 时机：自动重连达到最大重试次数时
- 签名：`data: { maxRetries: number }`
- 用途：触发兜底策略（提示刷新、切换线路、人工介入）

#### `reconnected`

- 类型：Notify Event
- 时机：自动重连成功后
- 签名：`void`
- 用途：清理重连提示、恢复业务链路

#### `signalingerror`

- 类型：Error Event
- 时机：信令请求异常时
- 签名：`data: { error: Error; request?: { role: 'player' | 'publisher'; url: string; sdp: string; extra?: Record<string, unknown> } }`
- 用途：精准定位协商失败原因，补充日志与告警信息

---

## 拉流事件（播放器）

#### `track`

- 类型：Notify Event
- 时机：收到远端媒体轨道时
- 签名：`data: { stream: MediaStream; event: RTCTrackEvent }`
- 用途：挂载远端流到视频元素、做轨道分析与统计

#### `mediaready`

- 类型：Notify Event
- 时机：媒体元素实际进入播放态后
- 签名：`data: { stream: MediaStream }`
- 用途：关闭 loading、切换“可播放”状态

---

## 推流事件（推流器）

#### `streamstart`

- 类型：Notify Event
- 时机：推流建立并开始发送媒体后
- 签名：`data: { stream: MediaStream }`
- 用途：更新“正在推流”状态、启动推流侧监控

#### `streamstop`

- 类型：Notify Event
- 时机：推流停止后
- 签名：`void`
- 用途：更新 UI 状态、回收推流相关资源

#### `sourcechange`

- 类型：Notify Event
- 时机：采集源切换完成后
- 签名：`source: MediaSource`
- 用途：同步 UI 的采集源展示（摄像头 / 屏幕）

#### `permissiondenied`

- 类型：Error Event
- 时机：获取媒体权限被拒绝时
- 签名：`data: { source: MediaSource; error: Error }`
- 用途：提示用户授权路径与重试方式

#### `streamingstatechange`

- 类型：Notify Event
- 时机：推流状态变化时
- 签名：`state: 'idle' | 'connecting' | 'streaming'`
- 用途：驱动推流按钮与状态文案（连接中/推流中/空闲）

#### `track`

- 类型：Notify Event
- 时机：收到远端媒体轨道时（如回声检测/对讲场景）
- 签名：`data: { stream: MediaStream; event: RTCTrackEvent }`
- 用途：处理返送流、对讲流等远端媒体

#### `trackended`

- 类型：Notify Event
- 时机：本地轨道触发 ended 时
- 签名：`data: { track: MediaStreamTrack; stream: MediaStream; reason: 'ended' }`
- 用途：提示设备中断、自动触发重试或切源

#### `trackmutechanged`

- 类型：Notify Event
- 时机：本地轨道触发 mute/unmute 时
- 签名：`data: { track: MediaStreamTrack; muted: boolean }`
- 用途：同步静音态 UI、埋点设备波动

## 监听方式

```typescript
const onState = (state: RtcState) => {
  console.log('状态变化:', state);
};

const onTrack = (payload: { stream: MediaStream; event: RTCTrackEvent }) => {
  console.log('收到远端流', payload.stream, payload.event);
};

instance.on('state', onState);
player.on('track', onTrack);

// 仅监听一次
player.once('error', (error) => {
  console.error('发生错误:', error);
});

// 取消监听
player.off('track', onTrack);
```

## 实践建议

- 先按“通用 / 拉流 / 推流”分层组织监听逻辑，避免职责混杂
- 将 `state` 映射到业务状态机，明确每个状态对应 UI 与重试策略
- 为 `error` 与 `permissiondenied` 建立统一错误分类与上报机制
- 对重连事件（`reconnecting` / `reconnectfailed`）配置可观测指标（次数、间隔、成功率）

详见 [RtcState](../api/state) 与 [插件 API](../plugins/api)。
