---
title: 自定义信令
description: 如何为 WebRTC Player 实现自定义信令服务器对接
---

# 自定义信令

WebRTC 本身只负责媒体传输，**信令（Signaling）**负责在 Peer 之间交换 SDP（会话描述）和 ICE 候选地址。WebRTC Player 通过信令接口抽象出这一层，支持你对接任意信令服务器。

## 信令接口

只需实现 `SignalingProvider` 接口即可：

```typescript
import type { SignalingProvider } from '@webrtc-player/core';

interface SignalingProvider {
  /**
   * 推流信令交换
   * @param sdp 本地 SDP offer
   * @param url 推流地址（如 webrtc://example.com/live/stream）
   * @returns 远端 SDP answer
   */
  publish(sdp: string, url: string): Promise<string>;

  /**
   * 拉流信令交换
   * @param sdp 本地 SDP offer
   * @param url 拉流地址
   * @returns 远端 SDP answer
   */
  play(sdp: string, url: string): Promise<string>;
}
```

## 内置信令：HttpSignalingProvider

SDK 内置了一个基于 HTTP POST 的信令实现，适合对接 SRS 等标准 HTTP-FLV/WebSocket 风格的信令接口：

```typescript
import { HttpSignalingProvider } from '@webrtc-player/core';

const signaling = new HttpSignalingProvider('https://your-server.com/api/signaling');
```

请求体格式：

```json
{
  "api": "https://your-server.com/api/signaling",
  "streamurl": "webrtc://example.com/live/stream",
  "sdp": "v=0\r\no=..."
}
```

成功响应格式：

```json
{
  "code": 0,
  "sdp": "v=0\r\no=..."
}
```

> `code !== 0` 时会抛出 `Error("Signaling failed: code {code}")`

## 自定义信令示例：WebSocket 信令

如果你的信令服务器使用 WebSocket 协议（例如 some-webcontainers 或纯 WebSocket 服务），可以这样实现：

```typescript
import type { SignalingProvider } from '@webrtc-player/core';

class WebSocketSignalingProvider implements SignalingProvider {
  constructor(private wsUrl: string) {}

  async publish(sdp: string, url: string): Promise<string> {
    return this.exchange({ type: 'publish', sdp, url });
  }

  async play(sdp: string, url: string): Promise<string> {
    return this.exchange({ type: 'play', sdp, url });
  }

  private exchange(message: { type: string; sdp: string; url: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify(message));
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        ws.close();
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.sdp);
        }
      };

      ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };
    });
  }
}
```

## 使用自定义信令

在创建播放器或推流器时，通过 `signaling` 配置项传入自定义信令实例：

```typescript
import { RtcPlayer } from '@webrtc-player/core';

// 使用自定义 WebSocket 信令
const player = new RtcPlayer({
  url: 'webrtc://your-server.com/live/stream',
  signaling: new WebSocketSignalingProvider('wss://signaling.example.com'),
});

player.on('state', (state) => console.log('状态:', state));
await player.play();
```

```typescript
import { RtcPublisher } from '@webrtc-player/core';

// 使用自定义 WebSocket 信令
const publisher = new RtcPublisher({
  url: 'webrtc://your-server.com/live/stream',
  signaling: new WebSocketSignalingProvider('wss://signaling.example.com'),
  source: { type: 'camera' },
});

publisher.on('state', (state) => console.log('状态:', state));
await publisher.publish();
```

## 配置优先级

`signaling` 配置项的优先级高于 `api`：

| 配置                        | 行为                                  |
| --------------------------- | ------------------------------------- |
| 只传 `api`                  | 自动创建 `HttpSignalingProvider(api)` |
| 同时传 `api` 和 `signaling` | 使用传入的 `signaling`，`api` 被忽略  |
| 只传 `signaling`            | 直接使用传入的信令实例                |

## 完整示例：自定义 HTTP 信令（带鉴权）

```typescript
import type { SignalingProvider } from '@webrtc-player/core';

class AuthenticatedHttpSignalingProvider implements SignalingProvider {
  constructor(
    private api: string,
    private token: string
  ) {}

  async publish(sdp: string, url: string): Promise<string> {
    return this.exchange(sdp, url);
  }

  async play(sdp: string, url: string): Promise<string> {
    return this.exchange(sdp, url);
  }

  private async exchange(sdp: string, url: string): Promise<string> {
    const res = await fetch(this.api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ streamurl: url, sdp }),
    });

    if (!res.ok) {
      throw new Error(`Signaling error: ${res.status} ${res.statusText}`);
    }

    const json: { code: number; sdp: string } = await res.json();

    if (json.code !== 0) {
      throw new Error(`Signaling failed: code ${json.code}`);
    }

    return json.sdp;
  }
}

// 使用
const signaling = new AuthenticatedHttpSignalingProvider(
  'https://your-server.com/api/signaling',
  'your-jwt-token'
);

const player = new RtcPlayer({
  url: 'webrtc://example.com/live/stream',
  signaling,
});
```
