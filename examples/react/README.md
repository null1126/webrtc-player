# WebRTC Engine — React Example

[WebRTC Engine](https://github.com/null1126/webrtc-engine) · [Core Package](https://www.npmjs.com/package/@webrtc-engine/core) · [Documentation](https://github.com/null1126/webrtc-engine)

This is a React 19 + Vite + TypeScript example demonstrating how to use `@webrtc-engine/core`.

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
import { WebRTCPlayer, StateEnum } from '@webrtc-engine/core';

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

[ISC](https://github.com/null1126/webrtc-engine) — Copyright (c) 2024-present WebRTC Engine Contributors
