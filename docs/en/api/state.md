# StateEnum

Player state enumeration.

## Enum Definition

```typescript
export enum StateEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
  SWITCHING = 'switching',
  SWITCHED = 'switched',
  DESTROYED = 'destroyed',
}
```

## State Values

### CONNECTING

- **Value**: `'connecting'`
- **Description**: Connecting, establishing WebRTC connection

### CONNECTED

- **Value**: `'connected'`
- **Description**: Connected, media stream established

### DISCONNECTED

- **Value**: `'disconnected'`
- **Description**: Disconnected, possibly due to network issues or peer disconnection

### FAILED

- **Value**: `'failed'`
- **Description**: Connection failed, unable to establish connection

### CLOSED

- **Value**: `'closed'`
- **Description**: Connection closed

### SWITCHING

- **Value**: `'switching'`
- **Description**: Switching stream, switching to new video source

### SWITCHED

- **Value**: `'switched'`
- **Description**: Stream switched successfully

### DESTROYED

- **Value**: `'destroyed'`
- **Description**: Player destroyed, resources released

## Usage Example

```typescript
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

const player = new WebRTCPlayer({
  url: 'webrtc://localhost/live/livestream',
  api: 'http://localhost:1985/rtc/v1/play/',
  video: document.getElementById('video') as HTMLVideoElement,
});

player.on('state', (state) => {
  switch (state) {
    case StateEnum.CONNECTING:
      console.log('Connecting...');
      break;
    case StateEnum.CONNECTED:
      console.log('Connected');
      break;
    case StateEnum.DISCONNECTED:
      console.log('Disconnected');
      break;
    case StateEnum.FAILED:
      console.log('Connection failed');
      break;
    case StateEnum.CLOSED:
      console.log('Connection closed');
      break;
    case StateEnum.SWITCHING:
      console.log('Switching stream...');
      break;
    case StateEnum.SWITCHED:
      console.log('Stream switched');
      break;
    case StateEnum.DESTROYED:
      console.log('Player destroyed');
      break;
  }
});

player.play();
```

## State Transition Diagram

```
CONNECTING → CONNECTED → DISCONNECTED → CLOSED
    ↓            ↓
  FAILED       SWITCHING → SWITCHED → DISCONNECTED → CLOSED
                                    ↓
                               DESTROYED
```
