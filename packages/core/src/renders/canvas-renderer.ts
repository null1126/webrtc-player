import type { MediaRenderTarget } from '../rtc/types';

export interface CanvasRendererOptions {
  muted: boolean;
  onPlaying?: () => void;
}

/**
 * 将 MediaStream 渲染到 canvas（contain）并处理音频播放。
 * - 自动跟随 canvas CSS 尺寸，并按 DPR 调整 backing store。
 * - 使用内部 hidden video 承载 srcObject 与音频播放。
 */
export class CanvasRenderer {
  private rafId: number | null = null;
  private hiddenVideo: HTMLVideoElement | null = null;

  isCanvasTarget(target: MediaRenderTarget): target is HTMLCanvasElement {
    return target instanceof HTMLCanvasElement;
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.hiddenVideo) {
      this.hiddenVideo.pause();
      this.hiddenVideo.srcObject = null;
      this.hiddenVideo.onloadedmetadata = null;
      this.hiddenVideo = null;
    }
  }

  attach(canvas: HTMLCanvasElement, stream: MediaStream, options: CanvasRendererOptions): void {
    this.stop();

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = options.muted;
    video.srcObject = stream;

    this.hiddenVideo = video;
    video.onloadedmetadata = () => {
      void video.play();
      this.renderLoop(canvas, video);
      options.onPlaying?.();
    };
  }

  private syncCanvasSize(canvas: HTMLCanvasElement): { width: number; height: number } {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    return { width, height };
  }

  private renderLoop(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (): void => {
      if (!this.hiddenVideo || this.hiddenVideo !== video) return;

      const { width: cw, height: ch } = this.syncCanvasSize(canvas);
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (vw > 0 && vh > 0 && cw > 0 && ch > 0) {
        ctx.clearRect(0, 0, cw, ch);

        // contain: 等比完整显示，居中，可能留边
        const scale = Math.min(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.drawImage(video, dx, dy, dw, dh);
      }

      this.rafId = requestAnimationFrame(draw);
    };

    this.rafId = requestAnimationFrame(draw);
  }
}
