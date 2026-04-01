import { forwardRef } from 'react';
import './index.css';

interface StreamVideoProps {
  label?: string;
  muted?: boolean;
  autoPlay?: boolean;
}

export const StreamVideo = forwardRef<HTMLVideoElement, StreamVideoProps>(
  ({ label, muted = true, autoPlay = true }, ref) => {
    return (
      <div className="stream-video">
        <video ref={ref} autoPlay={autoPlay} muted={muted} playsInline />
        {label && <span className="stream-video__label">{label}</span>}
      </div>
    );
  }
);
