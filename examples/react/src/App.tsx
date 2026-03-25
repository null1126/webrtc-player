import { StateEnum, WebRTCPlayer } from '@webrtc-player/core';
import { useEffect, useRef, useState } from 'react';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<WebRTCPlayer | null>(null);
  const [state, setState] = useState<StateEnum>(StateEnum.CONNECTING);

  useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = new WebRTCPlayer({
      url: 'webrtc://localhost/live/livestream',
      api: 'http://localhost:1985/rtc/v1/play/',
      video: videoRef.current,
    });

    // 监听流
    playerRef.current.on('track', ({ stream, event }) => {
      console.log('stream:', stream, 'RTCTrackEvent:', event);
    });

    // 监听状态
    playerRef.current.on('state', (state: StateEnum) => {
      console.log('connection state:', state);
      setState(state);
    });

    // 监听错误
    playerRef.current.on('error', (err) => {
      console.error('player error:', err);
    });

    playerRef.current.play();
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  const changeStream = (url: string) => {
    playerRef.current?.switchStream(url);
  };

  const destroyPlayer = () => {
    playerRef.current?.destroy();
    playerRef.current = null;
  };

  return (
    <>
      <div>
        <button onClick={() => changeStream('webrtc://localhost/live/livestream')}>三亚</button>
        <button onClick={() => changeStream('webrtc://localhost/live/livestream1')}>豌豆</button>
        <button onClick={destroyPlayer}>销毁播放器</button>
        <p>当前状态: {state}</p>
        <video
          style={{
            display: 'block',
            margin: '0 auto',
            objectFit: 'contain',
            width: '600px',
            height: '300px',
            border: '1px solid #000',
          }}
          ref={videoRef}
          muted
          controls
        />
      </div>
    </>
  );
}

export default App;
