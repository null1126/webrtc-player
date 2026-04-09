import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RtcPlayer } from '../src/rtc/player';
import type { SignalingProvider } from '../src/rtc/types';

class MockPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'new';
  onconnectionstatechange: (() => void) | null = null;
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;

  addTransceiver = vi.fn();
  createOffer = vi.fn(async () => ({ type: 'offer' as RTCSdpType, sdp: 'offer-sdp' }));
  setLocalDescription = vi.fn(async () => undefined);
  setRemoteDescription = vi.fn(async () => undefined);
  close = vi.fn();
}

describe('RtcPlayer', () => {
  beforeEach(() => {
    vi.stubGlobal('RTCPeerConnection', MockPeerConnection as unknown as typeof RTCPeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('play() adds expected transceivers and creates session', async () => {
    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'answer-sdp'),
      publish: vi.fn(async () => 'unused'),
    };

    const player = new RtcPlayer({
      url: 'webrtc://demo',
      api: 'http://api',
      media: 'all',
      signaling,
    });

    const ok = await player.play();
    expect(ok).toBe(true);

    const pc = player.getPeerConnection() as unknown as MockPeerConnection;
    expect(pc.addTransceiver).toHaveBeenCalledWith('video', { direction: 'recvonly' });
    expect(pc.addTransceiver).toHaveBeenCalledWith('audio', { direction: 'recvonly' });
    expect(signaling.play).toHaveBeenCalledWith('offer-sdp', 'webrtc://demo');
  });

  it('switchStream() resets and reconnects with new url', async () => {
    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'answer-sdp'),
      publish: vi.fn(async () => 'unused'),
    };

    const player = new RtcPlayer({
      url: 'webrtc://old',
      api: 'http://api',
      signaling,
    });

    await player.play();
    const firstPc = player.getPeerConnection() as unknown as MockPeerConnection;

    await player.switchStream('webrtc://new');
    expect(firstPc.close).toHaveBeenCalledTimes(1);
    expect(signaling.play).toHaveBeenLastCalledWith('offer-sdp', 'webrtc://new');
  });

  it('onTrack binds stream to target and triggers play callback', () => {
    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'answer-sdp'),
      publish: vi.fn(async () => 'unused'),
    };
    const play = vi.fn();
    const target: Partial<HTMLVideoElement> = { play, muted: false, srcObject: null };

    const player = new RtcPlayer({
      url: 'webrtc://demo',
      api: 'http://api',
      signaling,
      target: target as HTMLVideoElement,
    });

    const stream: Partial<MediaStream> = {
      getVideoTracks: () => [{ kind: 'video' } as MediaStreamTrack],
      getAudioTracks: () => [],
    };

    (player as unknown as { onTrack: (event: RTCTrackEvent) => void }).onTrack({
      streams: [stream as MediaStream],
      track: { kind: 'video' } as MediaStreamTrack,
    } as RTCTrackEvent);

    expect(target.srcObject).toBe(stream);
    expect(target.muted).toBe(true);
    target.onloadedmetadata?.(new Event('loadedmetadata'));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
