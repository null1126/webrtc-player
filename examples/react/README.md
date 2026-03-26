# WebRTC Player — React Example

[WebRTC Player](https://github.com/null1126/webrtc-player) · [Core Package](https://www.npmjs.com/package/@webrtc-player/core) · [Documentation](https://github.com/null1126/webrtc-player)

This is a React 19 + Vite + TypeScript example demonstrating how to use `@webrtc-player/core`.

---

## Setup

The example is part of the monorepo. From the repo root:

```bash
# Install all dependencies
pnpm install

# Start this example
pnpm dev
```

Or run it standalone:

```bash
cd examples/react
pnpm install
pnpm dev
```

---

## Usage

See the full API reference in the [core package README](../core/README.md).

```tsx
import { useEffect, useRef } from 'react';
import { WebRTCPlayer, StateEnum } from '@webrtc-player/core';

function VideoPlayer({ url, api }: { url: string; api: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const player = new WebRTCPlayer({
      url,
      api,
      video: videoRef.current!,
    });

    player.on('state', (state) => {
      console.log('Player state:', state);
    });

    player.on('error', (msg) => {
      console.error('Error:', msg);
    });

    player.play();

    return () => {
      player.destroy();
    };
  }, [url, api]);

  return <video ref={videoRef} style={{ width: '100%' }} />;
}
```

---

## License

[ISC](https://github.com/null1126/webrtc-player) — Copyright (c) 2024-present WebRTC Player Contributors
