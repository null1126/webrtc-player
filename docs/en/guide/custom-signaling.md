---
title: Custom Signaling
description: How to implement a custom signaling server for WebRTC Player
---

# Custom Signaling

WebRTC itself only handles media transport. **Signaling** is the process of exchanging SDP (Session Description) and ICE candidates between peers. WebRTC Player abstracts this layer through the `SignalingProvider` interface, allowing you to connect to any signaling server.

## Signaling Interface

All you need to do is implement the `SignalingProvider` interface:

```typescript
import type { SignalingProvider } from '@webrtc-player/core';

interface SignalingProvider {
  /**
   * Signaling exchange for publishing (pushing a stream to the server)
   * @param sdp Local SDP offer
   * @param url Stream URL (e.g. webrtc://example.com/live/stream)
   * @returns Remote SDP answer
   */
  publish(sdp: string, url: string): Promise<string>;

  /**
   * Signaling exchange for playback (pulling a stream from the server)
   * @param sdp Local SDP offer
   * @param url Stream URL
   * @returns Remote SDP answer
   */
  play(sdp: string, url: string): Promise<string>;
}
```

## Built-in Signaling: HttpSignalingProvider

The SDK ships with a built-in HTTP-based signaling implementation, suitable for SRS and similar servers that expose an HTTP POST API:

```typescript
import { HttpSignalingProvider } from '@webrtc-player/core';

const signaling = new HttpSignalingProvider('https://your-server.com/api/signaling');
```

Request body format:

```json
{
  "api": "https://your-server.com/api/signaling",
  "streamurl": "webrtc://example.com/live/stream",
  "sdp": "v=0\r\no=..."
}
```

Successful response format:

```json
{
  "code": 0,
  "sdp": "v=0\r\no=..."
}
```

> When `code !== 0`, an `Error("Signaling failed: code {code}")` is thrown.

## Custom Signaling Example: WebSocket

If your signaling server uses WebSocket (e.g. some-webcontainers or a custom WebSocket service), implement it like this:

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

## Using Custom Signaling

Pass your custom signaling instance via the `signaling` option when creating a player or publisher:

```typescript
import { RtcPlayer } from '@webrtc-player/core';

// Use custom WebSocket signaling
const player = new RtcPlayer({
  url: 'webrtc://your-server.com/live/stream',
  signaling: new WebSocketSignalingProvider('wss://signaling.example.com'),
});

player.on('state', (state) => console.log('State:', state));
await player.play();
```

```typescript
import { RtcPublisher } from '@webrtc-player/core';

// Use custom WebSocket signaling
const publisher = new RtcPublisher({
  url: 'webrtc://your-server.com/live/stream',
  signaling: new WebSocketSignalingProvider('wss://signaling.example.com'),
  source: { type: 'camera' },
});

publisher.on('state', (state) => console.log('State:', state));
await publisher.publish();
```

## Configuration Priority

The `signaling` option takes priority over `api`:

| Configuration                       | Behavior                                               |
| ----------------------------------- | ------------------------------------------------------ |
| Only `api` provided                 | Automatically creates `HttpSignalingProvider(api)`     |
| Both `api` and `signaling` provided | Uses the custom `signaling` instance; `api` is ignored |
| Only `signaling` provided           | Uses the custom signaling instance directly            |

## Complete Example: Authenticated HTTP Signaling

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

// Usage
const signaling = new AuthenticatedHttpSignalingProvider(
  'https://your-server.com/api/signaling',
  'your-jwt-token'
);

const player = new RtcPlayer({
  url: 'webrtc://example.com/live/stream',
  signaling,
});
```
