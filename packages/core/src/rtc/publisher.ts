import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import type {
  MediaSource,
  MediaSourceMicrophone,
  RtcPublisherEvents,
  RtcPublisherOptions,
} from './types';
import { RtcState } from './types';

/**
 * RTC 推流器
 */
export class RtcPublisher extends RtcBase<RtcPublisherEvents> {
  private _source: MediaSource;
  private video?: HTMLVideoElement;
  private localStream: MediaStream | null = null;
  private activeTransceivers: RTCRtpTransceiver[] = [];

  constructor(options: RtcPublisherOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    super(options, signaling);
    this._source = options.source;
    this.video = options.video;
  }

  get source(): MediaSource {
    return this._source;
  }

  /**
   * 获取本地 MediaStream
   */
  getStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * 开始推流
   */
  async start(): Promise<boolean> {
    try {
      this.initPeerConnection();
      if (!this.pc) {
        throw new Error('Peer connection not initialized');
      }

      await this.acquireSource();
      await this.attachStream();
      await this.createSession();

      this.emit('streamstart', { stream: this.localStream as MediaStream });
      return true;
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  /**
   * 停止推流
   */
  stop(): void {
    this.resetSession();
    this.releaseSource();
    this.emit('streamstop', undefined);
  }

  /**
   * 切换输入源
   * @param source 新的媒体源
   */
  async switchSource(source: MediaSource): Promise<void> {
    this.emit('state', RtcState.SWITCHING);

    const prevStream = this.localStream;
    const prevSource = this._source;

    try {
      await this.acquireSource();

      if (!this.pc || !this.localStream) {
        throw new Error('Peer connection not ready');
      }

      for (const transceiver of this.activeTransceivers) {
        const track = this.localStream!.getTracks().find(
          (t) => t.kind === transceiver.receiver.track.kind
        );
        if (track) {
          await transceiver.sender.replaceTrack(track);
        }
      }

      this._source = source;
    } catch (err) {
      if (err instanceof Error) {
        this.handlePermissionError(source, err);
      }
      this._source = prevSource;
      throw err;
    } finally {
      this.releaseSource(prevStream ?? undefined);
    }

    this.emit('state', RtcState.SWITCHED);
    this.emit('sourcechange', source);
  }

  /**
   * 创建会话
   */
  protected async createSession(): Promise<void> {
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const answerSDP = await this.signaling.publish(offer.sdp!, this.url);
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSDP,
    });
  }

  /**
   * 重置会话
   */
  protected resetSession(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.activeTransceivers = [];
  }

  /**
   * 处理轨道事件
   */
  protected onTrack(event: RTCTrackEvent): void {
    const stream = event.streams[0];
    this.emit('track', { stream, event });
  }

  /**
   * 获取媒体源
   */
  private async acquireSource(): Promise<MediaStream> {
    const s = this._source;

    if (s.type === 'custom') {
      this.localStream = s.stream;
      return s.stream;
    }

    try {
      this.localStream = await this.requestMedia(s);
    } catch (err) {
      if (err instanceof Error) {
        this.handlePermissionError(s, err);
      }
      throw err;
    }

    this.bindVideo();

    return this.localStream;
  }

  /**
   * 请求媒体设备获取 MediaStream
   * - screen: 调用 getDisplayMedia 获取录屏流
   * - camera: 调用 getUserMedia 获取摄像头视频流（audio 为 true 时同时获取麦克风）
   * - microphone: 调用 getUserMedia 获取麦克风音频流
   */
  private async requestMedia(s: MediaSource): Promise<MediaStream> {
    if (s.type === 'screen') {
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: true,
        audio: s.audio ?? false,
      };
      return navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    }

    if (s.type === 'camera') {
      const constraints: MediaStreamConstraints = {
        video: { deviceId: s.deviceId },
        audio: s.audio ? { deviceId: s.deviceId } : false,
      };
      return navigator.mediaDevices.getUserMedia(constraints);
    }

    const sm = s as MediaSourceMicrophone;
    const constraints: MediaStreamConstraints = {
      video: false,
      audio: sm.deviceId ? { deviceId: sm.deviceId } : true,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * 将 localStream 绑定到预览 video 元素
   * 设置 muted 避免回声，自动播放
   */
  private bindVideo(): void {
    if (!this.video || !this.localStream) return;

    this.video.srcObject = this.localStream;
    this.video.muted = true;
    this.video.onloadedmetadata = () => {
      this.video?.play();
    };
  }

  /**
   * 检测并发射权限拒绝事件
   * 捕获 NotAllowedError / PermissionDeniedError / AbortError
   */
  private handlePermissionError(source: MediaSource, err: Error): void {
    if (
      err.name === 'NotAllowedError' ||
      err.name === 'PermissionDeniedError' ||
      err.name === 'AbortError'
    ) {
      this.emit('permissiondenied', { source, error: err });
    }
  }

  /**
   * 将媒体流绑定到轨道
   */
  private async attachStream(): Promise<void> {
    if (!this.pc || !this.localStream) return;

    this.activeTransceivers = [];

    const videoTrack = this.localStream.getVideoTracks()[0];
    const audioTrack = this.localStream.getAudioTracks()[0];

    if (videoTrack) {
      const videoTransceiver = this.pc.addTransceiver(videoTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(videoTransceiver);
    }

    if (audioTrack) {
      const audioTransceiver = this.pc.addTransceiver(audioTrack, {
        direction: 'sendonly',
      });
      this.activeTransceivers.push(audioTransceiver);
    }

    if (!videoTrack && !audioTrack) {
      throw new Error('No media tracks available');
    }
  }

  /**
   * 释放媒体源
   */
  private releaseSource(stream?: MediaStream): void {
    const target = stream ?? this.localStream;
    if (!target) return;

    target.getTracks().forEach((track) => track.stop());

    if (!stream) {
      this.localStream = null;
      if (this.video) {
        this.video.srcObject = null;
      }
    }
  }

  public override destroy(): void {
    this.stop();
    super.destroy();
  }
}
