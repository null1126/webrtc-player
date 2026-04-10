import { forwardRef, type Ref } from 'react';
import './index.css';

type StreamContainerType = 'video' | 'canvas';

interface StreamVideoProps {
  label?: string;
  muted?: boolean;
  autoPlay?: boolean;
  containerType?: StreamContainerType;
}

export const StreamVideo = forwardRef<HTMLVideoElement | HTMLCanvasElement, StreamVideoProps>(
  ({ label, muted = true, autoPlay = true, containerType = 'video' }, ref) => {
    return (
      <div className="stream-video">
        {containerType === 'canvas' ? (
          <canvas ref={ref as Ref<HTMLCanvasElement>} />
        ) : (
          <video ref={ref as Ref<HTMLVideoElement>} autoPlay={autoPlay} muted={muted} playsInline />
        )}
        {label && <span className="stream-video__label">{label}</span>}
      </div>
    );
  }
);
