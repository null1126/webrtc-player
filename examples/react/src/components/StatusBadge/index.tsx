import { RtcState } from '@webrtc-engine/core';
import './index.css';

const STATE_LABELS: Record<RtcState, string> = {
  [RtcState.CONNECTING]: '连接中',
  [RtcState.CONNECTED]: '已连接',
  [RtcState.DISCONNECTED]: '断开',
  [RtcState.FAILED]: '失败',
  [RtcState.CLOSED]: '已关闭',
  [RtcState.SWITCHING]: '切换中',
  [RtcState.SWITCHED]: '已切换',
  [RtcState.DESTROYED]: '已销毁',
};

interface StatusBadgeProps {
  state: RtcState;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  return (
    <span className="status-badge" data-state={state.toLowerCase()}>
      <span className="status-badge__dot" />
      {STATE_LABELS[state]}
    </span>
  );
}
