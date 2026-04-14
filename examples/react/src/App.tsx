import { useState } from 'react';
import './App.css';
import { StreamPublisher } from './components/StreamPublisher';
import { StreamPlayer } from './components/StreamPlayer';

const DEFAULT_PUBLISHER_URL = 'webrtc://localhost/live/pushstream';
const DEFAULT_PUBLISHER_API = 'http://localhost:1985/rtc/v1/publish/';
const DEFAULT_PLAYER_URL = 'webrtc://localhost/live/livestream';
const DEFAULT_PLAYER_API = 'http://localhost:1985/rtc/v1/play/';

export default function App() {
  const [pubStreamUrl, setPubStreamUrl] = useState(DEFAULT_PUBLISHER_URL);
  const [pubApiUrl, setPubApiUrl] = useState(DEFAULT_PUBLISHER_API);
  const [playerStreamUrl, setPlayerStreamUrl] = useState(DEFAULT_PLAYER_URL);
  const [playerApiUrl, setPlayerApiUrl] = useState(DEFAULT_PLAYER_API);

  return (
    <div className="app-page">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-brand">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect
                x="1"
                y="4"
                width="16"
                height="12"
                rx="2"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
              />
              <circle cx="17.5" cy="7.5" r="2" stroke="var(--color-accent)" strokeWidth="1.5" />
              <circle cx="17.5" cy="13.5" r="1.5" stroke="var(--color-accent)" strokeWidth="1.5" />
              <path
                d="M19 10l3 1.5L19 13"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="app-header-brand-name">WebRTC Engine</span>
            <span className="app-header-tag">DEMO</span>
          </div>
          <span className="app-header-subtitle">推流端 + 拉流端</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        {/* 副标题说明 */}
        <div className="app-intro">
          <h1>摄像头推拉流演示</h1>
          <p>
            摄像头通过推流端发布到流媒体服务器，再由拉流端从服务器订阅并播放。两侧面板独立运行，可同时启用。
          </p>
        </div>

        {/* 流程示意 */}
        <div className="app-flow">
          <FlowChip label="摄像头" />
          <FlowArrow />
          <FlowChip label="推流端" accent />
          <FlowArrow />
          <FlowChip label="流媒体服务器" />
          <FlowArrow />
          <FlowChip label="拉流端" accent />
          <FlowArrow />
          <FlowChip label="视频播放" />
        </div>

        {/* 双面板 */}
        <div className="app-panels">
          <StreamPublisher
            streamUrl={pubStreamUrl}
            apiUrl={pubApiUrl}
            onStreamUrlChange={setPubStreamUrl}
            onApiUrlChange={setPubApiUrl}
          />
          <StreamPlayer
            streamUrl={playerStreamUrl}
            apiUrl={playerApiUrl}
            onStreamUrlChange={setPlayerStreamUrl}
            onApiUrlChange={setPlayerApiUrl}
          />
        </div>

        {/* 底部说明 */}
        <div className="app-usage">
          <p>
            <strong>使用说明：</strong>
            确认流媒体服务器（ZLMediaKit / SRS / monibuca 等）已启动并启用 WebRTC 功能。
            推流端与拉流端的 <code>streamUrl</code> 需指向同一流名称（如{' '}
            <code>webrtc://localhost/live/mycam</code>
            ）， 信令地址则根据服务器配置填写对应路径。
          </p>
        </div>
      </main>
    </div>
  );
}

/* ���── Flow diagram chips ─── */

function FlowChip({ label, accent }: { label: string; accent?: boolean }) {
  return <span className={`app-flow-chip${accent ? ' app-flow-chip--accent' : ''}`}>{label}</span>;
}

function FlowArrow() {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M0 6H18M18 6L13 1M18 6L13 11"
        stroke="var(--color-border)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
