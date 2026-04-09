import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RtcPublisher } from '../src/rtc/publisher';
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

  createOffer = vi.fn(async () => ({ type: 'offer' as RTCSdpType, sdp: 'offer-sdp' }));
  setLocalDescription = vi.fn(async () => undefined);
  setRemoteDescription = vi.fn(async () => undefined);
  addTransceiver = vi.fn((track: MediaStreamTrack) => ({
    sender: { track, replaceTrack: vi.fn(async () => undefined) },
    receiver: { track },
  }));
  close = vi.fn();
}

function createTrack(kind: 'video' | 'audio') {
  return { kind, stop: vi.fn() } as unknown as MediaStreamTrack;
}

describe('RtcPublisher', () => {
  beforeEach(() => {
    vi.stubGlobal('RTCPeerConnection', MockPeerConnection as unknown as typeof RTCPeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('start() publishes local stream and emits streamstart', async () => {
    const stream = {
      getTracks: () => [createTrack('video'), createTrack('audio')],
      getVideoTracks: () => [createTrack('video')],
      getAudioTracks: () => [createTrack('audio')],
    } as unknown as MediaStream;

    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'unused'),
      publish: vi.fn(async () => 'answer-sdp'),
    };

    const publisher = new RtcPublisher({
      url: 'webrtc://demo',
      api: 'http://api',
      source: { type: 'custom', stream },
      signaling,
    });

    const onStart = vi.fn();
    publisher.on('streamstart', onStart);

    const ok = await publisher.start();
    expect(ok).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(signaling.publish).toHaveBeenCalledWith('offer-sdp', 'webrtc://demo');
  });

  it('switchSource() updates source and emits sourcechange', async () => {
    const oldStream = {
      getTracks: () => [createTrack('video')],
      getVideoTracks: () => [createTrack('video')],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const newVideoTrack = createTrack('video');
    const newStream = {
      getTracks: () => [newVideoTrack],
      getVideoTracks: () => [newVideoTrack],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'unused'),
      publish: vi.fn(async () => 'answer-sdp'),
    };

    const publisher = new RtcPublisher({
      url: 'webrtc://demo',
      api: 'http://api',
      source: { type: 'custom', stream: oldStream },
      signaling,
    });

    await publisher.start();
    const onSourceChange = vi.fn();
    publisher.on('sourcechange', onSourceChange);

    await publisher.switchSource({ type: 'custom', stream: newStream });

    expect(onSourceChange).toHaveBeenCalledTimes(1);
    expect(publisher.source).toEqual({ type: 'custom', stream: newStream });
  });

  it('destroy() stops publishing and closes peer connection', async () => {
    const stream = {
      getTracks: () => [createTrack('video')],
      getVideoTracks: () => [createTrack('video')],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const signaling: SignalingProvider = {
      play: vi.fn(async () => 'unused'),
      publish: vi.fn(async () => 'answer-sdp'),
    };

    const publisher = new RtcPublisher({
      url: 'webrtc://demo',
      api: 'http://api',
      source: { type: 'custom', stream },
      signaling,
    });

    await publisher.start();
    const pc = publisher.getPeerConnection() as unknown as MockPeerConnection;

    publisher.destroy();

    expect(pc.close).toHaveBeenCalled();
    expect(publisher.getPeerConnection()).toBeNull();
  });
});
