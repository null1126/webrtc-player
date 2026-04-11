import type { SignalingProvider } from './types';

/**
 * HTTP 信令响应
 */
export interface SignalingResponse {
  /** 状态码 */
  code: number;
  /** SDP */
  sdp: string;
}

/**
 * 默认 HTTP 信令提供者
 * 使用 HTTP POST JSON 方式与信令服务器交换 SDP
 */
export class HttpSignalingProvider implements SignalingProvider {
  /**
   * @param api 信令接口地址（POST JSON）
   */
  constructor(private api: string) {}

  /**
   * 推流端 SDP 交换。
   *
   * @param sdp 本地 Offer SDP
   * @param url 推流流地址
   * @returns 远端 Answer SDP
   */
  async publish(sdp: string, url: string): Promise<string> {
    return this.doExchange(sdp, url);
  }

  /**
   * 拉流端 SDP 交换。
   *
   * @param sdp 本地 Offer SDP
   * @param url 拉流流地址
   * @returns 远端 Answer SDP
   */
  async play(sdp: string, url: string): Promise<string> {
    return this.doExchange(sdp, url);
  }

  /**
   * 执行一次 HTTP 信令交换。
   *
   * @param sdp 本地 Offer SDP
   * @param url 推流流地址
   * @returns 远端 Answer SDP
   */
  private async doExchange(sdp: string, url: string): Promise<string> {
    const res = await fetch(this.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api: this.api, streamurl: url, sdp }),
    });
    const json: SignalingResponse = await res.json();
    if (json.code !== 0) {
      throw new Error(`Signaling failed: code ${json.code}`);
    }
    return json.sdp;
  }
}
