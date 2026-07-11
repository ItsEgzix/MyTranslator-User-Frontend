import { WS_URL } from "./api";

export type ListenerEvent =
  | { type: "status"; live: boolean }
  | { type: "language"; language: string }
  | { type: "transcript.delta"; text: string }
  | { type: "transcript.done" }
  | { type: "connection"; state: "connecting" | "open" | "closed" };

/**
 * Connects to a room's listener socket, plays the translated English audio
 * (base64/binary PCM16 @ 24 kHz), and forwards transcript events to the UI.
 * Reconnects automatically if the socket drops.
 */
export class Listener {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private nextTime = 0;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private _muted = true; // browsers block autoplay until a user gesture
  private _volume = 1;

  constructor(
    private readonly code: string,
    private readonly language: string,
    private readonly onEvent: (e: ListenerEvent) => void,
  ) {}

  connect() {
    this.closed = false;
    this.open();
  }

  private open() {
    this.onEvent({ type: "connection", state: "connecting" });
    const ws = new WebSocket(
      `${WS_URL}/ws/listen?room=${encodeURIComponent(this.code)}&lang=${encodeURIComponent(this.language)}`,
    );
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => this.onEvent({ type: "connection", state: "open" });

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        try {
          this.onEvent(JSON.parse(ev.data) as ListenerEvent);
        } catch {
          // ignore
        }
      } else {
        this.playChunk(ev.data as ArrayBuffer);
      }
    };

    ws.onclose = () => {
      this.onEvent({ type: "connection", state: "closed" });
      if (!this.closed) {
        this.reconnectTimer = setTimeout(() => this.open(), 1500);
      }
    };

    ws.onerror = () => ws.close();
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  async enableAudio() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: 24000 });
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this._volume;
      this.gain.connect(this.ctx.destination);
    }
    await this.ctx.resume();
    this._muted = false;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
  }

  setVolume(v: number) {
    this._volume = v;
    if (this.gain) this.gain.gain.value = v;
  }

  private playChunk(buffer: ArrayBuffer) {
    if (this._muted || !this.ctx || !this.gain) return;

    const pcm = new Int16Array(buffer);
    if (pcm.length === 0) return;

    const audioBuffer = this.ctx.createBuffer(1, pcm.length, 24000);
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) {
      channel[i] = pcm[i] / 0x8000;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.gain);

    const now = this.ctx.currentTime;
    // Small lead-in avoids underruns; keep a continuous playback timeline.
    const startAt = Math.max(now + 0.05, this.nextTime);
    src.start(startAt);
    this.nextTime = startAt + audioBuffer.duration;
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ctx?.close().catch(() => {});
    this.ws = null;
    this.ctx = null;
    this.gain = null;
  }
}
