import { describe, expect, it } from 'vitest';
import { formatTime, getSourceName } from '../src/utils';

describe('plugin-logger utils', () => {
  it('formats time as HH:mm:ss', () => {
    const date = new Date('2026-01-01T01:02:03');
    expect(formatTime(date)).toBe('01:02:03');
  });

  it('maps source type to localized labels', () => {
    expect(getSourceName({ type: 'screen' })).toBe('屏幕录制');
    expect(getSourceName({ type: 'camera' })).toBe('摄像头');
    expect(getSourceName({ type: 'custom' })).toBe('custom');
  });
});
