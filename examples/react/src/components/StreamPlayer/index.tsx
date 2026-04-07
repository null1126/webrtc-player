import { useRef, useState } from 'react';
import { RtcPlayer, RtcState } from '@webrtc-player/core';
import { createPerformancePlugin } from '@webrtc-player/plugin-performance';
import { createPlayerLoggerPlugin } from '@webrtc-player/plugin-logger';
import type { PerformanceData } from '@webrtc-player/plugin-performance';
import { StatusBadge } from '../StatusBadge';
import { StreamVideo } from '../StreamVideo';
import { LogPanel, useLogs } from '../LogPanel';
import './index.css';

interface StreamPlayerProps {
  streamUrl: string;
  apiUrl: string;
  onStreamUrlChange: (url: string) => void;
  onApiUrlChange: (url: string) => void;
}

export function StreamPlayer({
  streamUrl,
  apiUrl,
  onStreamUrlChange,
  onApiUrlChange,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<RtcPlayer | null>(null);

  const [state, setState] = useState<RtcState>(RtcState.CLOSED);
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const { logs, appendLog } = useLogs();

  async function handleStart() {
    if (playerRef.current) return;

    const loggerPlugin = createPlayerLoggerPlugin({}, (entry) => {
      if (entry.level === 'info' || entry.level === 'error') {
        appendLog(entry.level, entry.message);
      }
    });

    const performancePlugin = createPerformancePlugin({ interval: 1000 }, (data) => {
      setPerfData(data);
    });

    const player = new RtcPlayer({
      url: streamUrl,
      api: apiUrl,
      target: videoRef.current ?? undefined,
      media: 'all',
      reconnect: {
        enabled: true,
        exponential: true,
        maxRetries: 2,
        interval: 1000,
      },
      plugins: [performancePlugin, loggerPlugin],
    });

    playerRef.current = player;

    player.on('state', (s) => setState(s));

    player.on('track', ({ stream }) => setRemoteStream(stream));

    await player.play();
  }

  function handleStop() {
    playerRef.current?.destroy();
    playerRef.current = null;
    setPerfData(null);
    setState(RtcState.DESTROYED);
  }

  async function handleSwitch(newUrl: string) {
    if (!playerRef.current) return;
    onStreamUrlChange(newUrl);
    try {
      await playerRef.current.switchStream(newUrl);
    } catch (err) {
      console.error(err);
    }
  }

  const active = !!playerRef.current;

  return (
    <div className="stream-player-card">
      {/* Header */}
      <div className="stream-player-header">
        <div className="stream-player-header-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="1"
              y="2"
              width="11"
              height="9"
              rx="1.5"
              stroke="var(--color-accent)"
              strokeWidth="1.3"
            />
            <path
              d="M13 5l2.5 2L13 9.5"
              stroke="var(--color-accent)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          拉流端
        </div>
        <StatusBadge state={state} />
      </div>

      {/* Body */}
      <div className="stream-player-body">
        {/* URL 配置 */}
        <div className="sp-field">
          <label className="field-label">流地址 / Stream URL</label>
          <input
            type="text"
            className={`sp-input${active ? '' : ' sp-input--mono'}`}
            value={streamUrl}
            onChange={(e) => onStreamUrlChange(e.target.value)}
            placeholder="webrtc://localhost/live/livestream"
            disabled={active}
          />
        </div>

        <div className="sp-field">
          <label className="field-label">信令地址 / API URL</label>
          <input
            type="text"
            className={`sp-input${active ? '' : ' sp-input--mono'}`}
            value={apiUrl}
            onChange={(e) => onApiUrlChange(e.target.value)}
            placeholder="http://localhost:1985/rtc/v1/play/"
            disabled={active}
          />
        </div>

        {/* 快速切换流 */}
        {active && (
          <div className="sp-quick-switch">
            <label className="field-label">快速切换 / Quick Switch</label>
            <div className="sp-quick-switch-list">
              {['webrtc://localhost/live/livestream', 'webrtc://localhost/live/livestream1'].map(
                (url) => (
                  <button
                    key={url}
                    className={`sp-quick-switch-btn${streamUrl === url ? ' sp-quick-switch-btn--active' : ''}`}
                    onClick={() => handleSwitch(url)}
                  >
                    {url.split('/').pop()}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 视频区域 */}
        <div className="sp-preview">
          <div className="sp-preview-header">
            <span className="field-label">播放画面 / Remote Stream</span>
            {remoteStream && (
              <span className="sp-preview-stats">
                ● {remoteStream.getVideoTracks().length} 视频轨道 ·{' '}
                {remoteStream.getAudioTracks().length} 音频轨道
              </span>
            )}
          </div>
          <StreamVideo ref={videoRef} label="拉流画面" muted />
          {perfData && (
            <div className="perf-panel">
              <div className="perf-panel-title">性能监控</div>
              {perfData.fps && (
                <div className="perf-row">
                  <span className="perf-label">FPS</span>
                  <span className="perf-value">{perfData.fps.fps}</span>
                </div>
              )}
              {perfData.network && (
                <>
                  <div className="perf-row">
                    <span className="perf-label">接收码率</span>
                    <span className="perf-value">
                      {perfData.network.bitrateReceived > 0
                        ? `${(perfData.network.bitrateReceived / 1000).toFixed(0)} kbps`
                        : '—'}
                    </span>
                  </div>
                  <div className="perf-row">
                    <span className="perf-label">RTT</span>
                    <span className="perf-value">
                      {perfData.network.rtt != null ? `${perfData.network.rtt} ms` : '—'}
                    </span>
                  </div>
                  <div className="perf-row">
                    <span className="perf-label">抖动</span>
                    <span className="perf-value">
                      {perfData.network.jitter != null
                        ? `${perfData.network.jitter.toFixed(1)} ms`
                        : '—'}
                    </span>
                  </div>
                  <div className="perf-row">
                    <span className="perf-label">收包丢包</span>
                    <span className="perf-value">
                      {(perfData.network.packetsReceivedLostRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="perf-row">
                    <span className="perf-label">ICE 状态</span>
                    <span className="perf-value">{perfData.network.connectionState}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="sp-actions">
          {!active ? (
            <button className="sp-btn sp-btn--primary" onClick={handleStart}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <polygon points="2,1 12,6.5 2,12" fill="currentColor" />
              </svg>
              开始拉流
            </button>
          ) : (
            <button className="sp-btn sp-btn--danger" onClick={handleStop}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1.5" y="1.5" width="10" height="10" rx="1" fill="currentColor" />
              </svg>
              停止
            </button>
          )}
        </div>

        {/* 日志 */}
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}
