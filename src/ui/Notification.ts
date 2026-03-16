const LIFETIME = 2.0;      // seconds
const FADE_START = 0.5;    // start fading at this many seconds remaining

export class Notification {
  active = true;
  private timer: number;

  constructor(
    private text: string,
    private duration: number = LIFETIME,
    private color: string = '#ffd700'
  ) {
    this.timer = duration;
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) this.active = false;
  }

  render(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!this.active) return;

    const alpha = this.timer < FADE_START
      ? this.timer / FADE_START
      : Math.min(1, (this.duration - this.timer) / 0.2);

    const y = screenH * 0.38 - (this.duration - this.timer) * 18; // float upward

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(this.text, screenW / 2 + 1, y + 1);

    // Text
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, screenW / 2, y);

    ctx.restore();
  }
}
