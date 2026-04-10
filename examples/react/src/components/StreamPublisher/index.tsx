import { useRef, useState } from 'react';
import {
  RtcPublisher,
  RtcState,
  type MediaRenderTarget,
  type MediaSource,
} from '@webrtc-player/core';
import { createPublisherLoggerPlugin } from '@webrtc-player/plugin-logger';
import { StatusBadge } from '../StatusBadge';
import { StreamVideo } from '../StreamVideo';
import { LogPanel, useLogs } from '../LogPanel';
import './index.css';

export type PublisherSourceType = 'camera' | 'screen';
type PreviewContainerType = 'video' | 'canvas';

interface StreamPublisherProps {
  streamUrl: string;
  apiUrl: string;
  onStreamUrlChange: (url: string) => void;
  onApiUrlChange: (url: string) => void;
}

export function StreamPublisher({
  streamUrl,
  apiUrl,
  onStreamUrlChange,
  onApiUrlChange,
}: StreamPublisherProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const publisherRef = useRef<RtcPublisher | null>(null);

  const [state, setState] = useState<RtcState>(RtcState.CLOSED);
  const [previewContainer, setPreviewContainer] = useState<PreviewContainerType>('video');
  const [sourceType, setSourceType] = useState<PublisherSourceType>('camera');
  const [withAudio, setWithAudio] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<{
    source: string;
    error: string;
  } | null>(null);
  const { logs, appendLog } = useLogs();

  function setupPublisher(pub: RtcPublisher) {
    pub.on('state', (s) => setState(s));

    pub.on('streamstart', ({ stream }) => setLocalStream(stream));

    pub.on('permissiondenied', ({ source, error }) => {
      const sourceName =
        source.type === 'screen' ? '屏幕录制' : source.type === 'camera' ? '摄像头' : '麦克风';
      setPermissionDenied({ source: sourceName, error: error.message });
    });
  }

  async function handleStart() {
    if (publisherRef.current) return;

    setPermissionDenied(null);

    const source: MediaSource =
      sourceType === 'screen'
        ? { type: 'screen', audio: withAudio }
        : { type: 'camera', audio: withAudio };

    const loggerPlugin = createPublisherLoggerPlugin({}, (entry) => {
      if (entry.level === 'info' || entry.level === 'error') {
        appendLog(entry.level, entry.message);
      }
    });

    const target: MediaRenderTarget | undefined =
      previewContainer === 'canvas'
        ? (canvasRef.current ?? undefined)
        : (videoRef.current ?? undefined);

    const pub = new RtcPublisher({
      url: streamUrl,
      api: apiUrl,
      source,
      target,
      plugins: [loggerPlugin],
    });

    publisherRef.current = pub;
    setupPublisher(pub);

    try {
      await pub.start();
    } catch (err) {
      console.error(err);
    }
  }

  function handleStop() {
    publisherRef.current?.destroy();
    publisherRef.current = null;
    setPermissionDenied(null);
    setLocalStream(null);
    setState(RtcState.DESTROYED);
  }

  function handleSwitchSource() {
    if (!publisherRef.current) return;
    setPermissionDenied(null);
    const newType: PublisherSourceType = sourceType === 'camera' ? 'screen' : 'camera';
    setSourceType(newType);
    const source: MediaSource =
      newType === 'screen'
        ? { type: 'screen', audio: withAudio }
        : { type: 'camera', audio: withAudio };
    publisherRef.current.switchSource(source);
  }

  const active = !!publisherRef.current;

  return (
    <div className="publisher-card">
      {/* Header */}
      <div className="publisher-header">
        <div className="publisher-header-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="1"
              y="3"
              width="10"
              height="8"
              rx="1.5"
              stroke="var(--color-accent)"
              strokeWidth="1.3"
            />
            <circle cx="12.5" cy="5.5" r="1.5" stroke="var(--color-accent)" strokeWidth="1.3" />
            <circle cx="12.5" cy="9.5" r="1" stroke="var(--color-accent)" strokeWidth="1.3" />
          </svg>
          推流端
        </div>
        <StatusBadge state={state} />
      </div>

      {/* Body */}
      <div className="publisher-body">
        {/* URL 配置 */}
        <div className="field">
          <FieldLabel>流地址 / Stream URL</FieldLabel>
          <Input
            value={streamUrl}
            onChange={(e) => onStreamUrlChange(e.target.value)}
            placeholder="webrtc://localhost/live/pushstream"
            mono
            disabled={active}
          />
        </div>

        <div className="field">
          <FieldLabel>信令地址 / API URL</FieldLabel>
          <Input
            value={apiUrl}
            onChange={(e) => onApiUrlChange(e.target.value)}
            placeholder="http://localhost:1985/rtc/v1/publish/"
            mono
            disabled={active}
          />
        </div>

        {/* 源选择 */}
        <div className="field">
          <FieldLabel>输入源 / Source</FieldLabel>
          <div className="field-row">
            {(['camera', 'screen'] as PublisherSourceType[]).map((type) => (
              <SourceBtn
                key={type}
                active={sourceType === type && !active}
                selected={sourceType === type}
                label={type === 'camera' ? '摄像头' : '屏幕录制'}
                onClick={() => setSourceType(type)}
                disabled={active}
              />
            ))}
          </div>
        </div>

        {/* 音频采集 */}
        <div className="field">
          <FieldLabel>音频采集 / Audio</FieldLabel>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={withAudio}
              onChange={(e) => setWithAudio(e.target.checked)}
              disabled={active}
            />
            <span>包含麦克风音频</span>
          </label>
        </div>

        {/* 预览容器 */}
        <div className="field">
          <FieldLabel>预览容器 / Container</FieldLabel>
          <div className="field-row">
            {(['video', 'canvas'] as PreviewContainerType[]).map((type) => (
              <SourceBtn
                key={type}
                active={previewContainer === type && !active}
                selected={previewContainer === type}
                label={type === 'video' ? 'Video' : 'Canvas'}
                onClick={() => setPreviewContainer(type)}
                disabled={active}
              />
            ))}
          </div>
        </div>

        {/* 视频预览 */}
        <div className="preview-section">
          <div className="preview-header">
            <FieldLabel>本地预览 / Preview</FieldLabel>
            {localStream && (
              <span className="preview-stats">
                ● {localStream.getVideoTracks().length} 视频轨道 ·{' '}
                {localStream.getAudioTracks().length} 音频轨道
              </span>
            )}
          </div>
          <StreamVideo
            ref={previewContainer === 'canvas' ? canvasRef : videoRef}
            containerType={previewContainer}
            label={previewContainer === 'canvas' ? '本地预览（Canvas）' : '本地预览（Video）'}
            muted
          />
          {permissionDenied && (
            <div className="permission-alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1.5L12.5 11.5H1.5L7 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 5.5V7.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="9.5" r="0.6" fill="currentColor" />
              </svg>
              <span className="permission-alert-text">
                授权拒绝：{permissionDenied.source} — {permissionDenied.error}
              </span>
              <button className="permission-alert-close" onClick={() => setPermissionDenied(null)}>
                关闭
              </button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="field-row">
          {!active ? (
            <button className="action-btn action-btn--primary" onClick={handleStart}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <polygon points="2,1 12,6.5 2,12" fill="currentColor" />
              </svg>
              开始推流
            </button>
          ) : (
            <>
              <button className="action-btn action-btn--secondary" onClick={handleSwitchSource}>
                切换输入源
              </button>
              <button className="action-btn action-btn--danger" onClick={handleStop}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="1.5" y="1.5" width="10" height="10" rx="1" fill="currentColor" />
                </svg>
                停止
              </button>
            </>
          )}
        </div>

        {/* 日志 */}
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="field-label">{children}</span>;
}

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  mono?: boolean;
  disabled?: boolean;
}

function Input({ value, onChange, placeholder, mono, disabled }: InputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`input${mono ? ' input--mono' : ''}`}
    />
  );
}

interface SourceBtnProps {
  active: boolean;
  selected: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function SourceBtn({ active, selected, label, onClick, disabled }: SourceBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'source-btn',
        selected ? 'source-btn--selected' : '',
        active ? 'source-btn--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  );
}
