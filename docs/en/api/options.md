# PlayerOptions

Player configuration options interface.

## Interface Definition

```typescript
interface PlayerOptions {
  url: string;
  api: string;
  video?: HTMLVideoElement;
}
```

## Properties

### url

- **Type**: `string`
- **Required**: Yes
- **Description**: Playback URL, supports WebRTC protocol

**Example**:

```typescript
{
  url: 'webrtc://localhost/live/livestream';
}
```

### api

- **Type**: `string`
- **Required**: Yes
- **Description**: Signaling server URL, supports HTTP/HTTPS protocol

**Example**:

```typescript
{
  api: 'http://localhost:1985/rtc/v1/play/';
}
```

### video

- **Type**: `HTMLVideoElement`
- **Required**: No
- **Description**: Video element. If a video element is passed, the player will automatically bind the stream to that element and start playback.

**Example**:

```typescript
{
  video: document.getElementById('video') as HTMLVideoElement;
}
```

## Complete Example

```typescript
import { WebRTCPlayer } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  // WebRTC playback URL
  url: 'webrtc://localhost/live/livestream',

  // Signaling server URL
  api: 'http://localhost:1985/rtc/v1/play/',

  // Optional: video element
  video: document.getElementById('video') as HTMLVideoElement,
});
```
