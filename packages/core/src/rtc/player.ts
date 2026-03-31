import { RtcBase } from './base';
import { HttpSignalingProvider } from '../signaling/http';
import { PluginManager } from '../plugins/manager';
import type { MediaKind, RtcPlayerEvents, RtcPlayerOptions } from './types';
import { RtcState } from './types';
import type { RtcPlayerPlugin, RtcPlayerPluginInstance } from '../plugins/types';

/**
 * RTC 拉流播放器
 */
export class RtcPlayer extends RtcBase<RtcPlayerEvents, RtcPlayerPlugin, RtcPlayerPluginInstance> {
  private video?: HTMLVideoElement;
  private mediaKind: MediaKind;

  constructor(options: RtcPlayerOptions) {
    const signaling = options.signaling ?? new HttpSignalingProvider(options.api);
    const pluginManager = new PluginManager<RtcPlayerPlugin, RtcPlayerPluginInstance>();
    super(options, signaling, pluginManager);
    pluginManager.setInstance(this);
    this.video = options.video;
    this.mediaKind = options.media ?? 'all';
    const plugins = (options.plugins ?? []) as RtcPlayerPlugin[];
    for (const plugin of plugins) {
      pluginManager.use(plugin);
    }
  }

  /**
   * 开始拉流
   */
  async play(): Promise<boolean> {
    try {
      const ctx = this.createHookContext('play');
      const pluginOpts: RtcPlayerOptions = {
        url: this.url,
        api: '',
        media: this.mediaKind,
        video: this.video,
      };
      // Hook: onBeforeConnect
      const modified = this.pluginManager.pipeHook(ctx, 'onBeforeConnect', pluginOpts);
      const finalUrl = modified?.url ?? pluginOpts.url;

      this.initPeerConnection();
      // Hook: onPeerConnectionCreated
      this.pluginManager.callHook(ctx, 'onPeerConnectionCreated', this.pc!);

      if (!this.pc) {
        throw new Error('Peer connection not initialized');
      }

      if (this.mediaKind === 'all' || this.mediaKind === 'video') {
        this.pc.addTransceiver('video', { direction: 'recvonly' });
      }
      if (this.mediaKind === 'all' || this.mediaKind === 'audio') {
        this.pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      await this.createSession();
      this.url = finalUrl;
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
    const ctx = this.createHookContext('switchStream');
    this.emit('state', RtcState.SWITCHING);
    // Hook: onBeforeSwitchStream
    const modified = this.pluginManager.pipeHook(ctx, 'onBeforeSwitchStream', url);
    url = modified ?? url;
    this.url = url;
    this.resetSession();
    await this.play();
    // Hook: onAfterSwitchStream
    this.pluginManager.callHook(ctx, 'onAfterSwitchStream', url);
    this.emit('state', RtcState.SWITCHED);
  }

  protected async createSession(): Promise<void> {
    const ctx = this.createHookContext('createSession');
    if (!this.pc) throw new Error('Peer connection not initialized');

    const offer = await this.pc.createOffer();
    // Hook: onBeforeSetLocalDescription
    const modifiedOffer = this.pluginManager.pipeHook(ctx, 'onBeforeSetLocalDescription', offer);
    const offerSDP = modifiedOffer ?? offer;
    await this.pc.setLocalDescription(offerSDP);

    // Hook: onConnectionStateChange + onIceConnectionStateChange
    this.bindSignalingHooks(ctx);
    const answerSDP = await this.signaling.play(offerSDP.sdp!, this.url);

    // Hook: onBeforeSetRemoteDescription
    const modifiedAnswer = this.pluginManager.pipeHook(ctx, 'onBeforeSetRemoteDescription', {
      type: 'answer' as RTCSdpType,
      sdp: answerSDP,
    });
    const answerToSet: RTCSessionDescriptionInit = modifiedAnswer ?? {
      type: 'answer',
      sdp: answerSDP,
    };
    await this.pc.setRemoteDescription(answerToSet);

    // Hook: onRemoteDescriptionSet
    this.pluginManager.callHook(ctx, 'onRemoteDescriptionSet', answerToSet);
  }

  /** 绑定信令交互中产生的 PC 事件钩子 */
  private bindSignalingHooks(ctx: ReturnType<RtcPlayer['createHookContext']>): void {
    const prevState = { state: this.connectionState };
    const onStateChange = () => {
      const next = { state: this.pc!.connectionState, previousState: prevState.state };
      prevState.state = next.state;
      this.emit('state', this.mapConnectionState(next.state));
      this.pluginManager.callHook(ctx, 'onConnectionStateChange', next);
    };
    const onIce = () => {
      this.emit('iceconnectionstate', this.pc!.iceConnectionState);
      this.pluginManager.callHook(ctx, 'onIceConnectionStateChange', this.pc!.iceConnectionState);
    };
    this.pc!.onconnectionstatechange = onStateChange;
    this.pc!.oniceconnectionstatechange = onIce;
  }

  protected resetSession(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  protected onTrack(event: RTCTrackEvent): void {
    const ctx = this.createHookContext('track');
    const stream = event.streams[0];
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Hook: onTrack for video
    if (videoTrack) {
      this.pluginManager.callHook(ctx, 'onTrack', videoTrack, stream, event);
    }
    // Hook: onTrack for audio
    if (audioTrack) {
      this.pluginManager.callHook(ctx, 'onTrack', audioTrack, stream, event);
    }

    this.emit('track', { stream, event });

    if (this.video) {
      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.onloadedmetadata = () => {
        // Hook: onPlaying
        this.pluginManager.callHook(ctx, 'onPlaying', stream);
        this.video?.play();
      };
    }
  }
}
