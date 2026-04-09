import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RtcBase } from '../src/rtc/base';
import { PluginManager } from '../src/plugins/manager';
import type { SignalingProvider } from '../src/signaling/types';
import type { RtcBaseOptions } from '../src/rtc/types';

class MockPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'new';
  onconnectionstatechange: (() => void) | null = null;
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  close = vi.fn();
}

class TestRtc extends RtcBase<any, any, any> {
  reconnectCalls = 0;
  failReconnect = true;

  constructor(options: RtcBaseOptions) {
    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'answer'),
      publish: vi.fn(async () => 'answer'),
    };
    const manager = new PluginManager<any, any>();
    super(options, signaling, manager);
  }

  exposeInit() {
    this.initPeerConnection();
  }

  getPc() {
    return this.pc as unknown as MockPeerConnection;
  }

  protected onTrack(): void {}
  protected async createSession(): Promise<void> {}
  protected resetSession(): void {}

  protected async performReconnect(): Promise<void> {
    this.reconnectCalls += 1;
    if (this.failReconnect) {
      throw new Error('reconnect failed');
    }
  }
}

describe('RtcBase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('RTCPeerConnection', MockPeerConnection as unknown as typeof RTCPeerConnection);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('triggers reconnect and emits reconnectfailed after max retries', async () => {
    const rtc = new TestRtc({
      url: 'webrtc://demo',
      api: 'http://api',
      reconnect: { enabled: true, interval: 5, maxRetries: 1 },
    });
    const onReconnecting = vi.fn();
    const onReconnectFailed = vi.fn();
    const onState = vi.fn();

    rtc.on('reconnecting', onReconnecting);
    rtc.on('reconnectfailed', onReconnectFailed);
    rtc.on('state', onState);

    rtc.exposeInit();
    const pc = rtc.getPc();
    pc.connectionState = 'failed';
    pc.onconnectionstatechange?.();

    await vi.advanceTimersByTimeAsync(6);
    expect(rtc.reconnectCalls).toBe(1);
    expect(onReconnecting).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(6);
    expect(onReconnectFailed).toHaveBeenCalledTimes(1);
    expect(onState).toHaveBeenCalledWith('failed');
  });

  it('maps connection states to public rtc states', () => {
    const rtc = new TestRtc({ url: 'webrtc://demo', api: 'http://api' });
    expect((rtc as any).mapConnectionState('connected')).toBe('connected');
    expect((rtc as any).mapConnectionState('disconnected')).toBe('disconnected');
    expect((rtc as any).mapConnectionState('closed')).toBe('closed');
  });
});
