import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import type { RtcPlayerEvents, RtcPlayerOptions } from './types';
import { RtcState } from './types';

export class RtcPlayer extends RtcBase<RtcPlayerEvents> {
  private video?: HTMLVideoElement;

  constructor(options: RtcPlayerOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    super(options, signaling);
    this.video = options.video;
  }

  /**
   * 开始拉流
   */
  async play(): Promise<boolean> {
    try {
      this.initPeerConnection();
      if (!this.pc) {
        throw new Error('Peer connection not initialized');
      }

      this.pc.addTransceiver('video', { direction: 'recvonly' });
      this.pc.addTransceiver('audio', { direction: 'recvonly' });

      await this.createSession();
      return true;
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  /**
   * 切换拉流地址
   */
  async switchStream(url: string): Promise<void> {
    this.emit('state', RtcState.SWITCHING);
    this.url = url;
    this.resetSession();
    await this.play();
    this.emit('state', RtcState.SWITCHED);
  }

  protected async createSession(): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const answerSDP = await this.signaling.play(offer.sdp!, this.url);

    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSDP,
    });
  }

  protected resetSession(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  protected onTrack(event: RTCTrackEvent): void {
    const stream = event.streams[0];
    this.emit('track', { stream, event });

    if (this.video) {
      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.onloadedmetadata = () => {
        this.video?.play();
      };
    }
  }
}
