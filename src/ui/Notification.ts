const LIFETIME = 2.2;
const FADE_START = 0.55;

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

  /**
   * @param slot  0 = newest (bottom), 1 = one older (above), 2 = oldest visible
   *              Higher slot → higher on screen, smaller, more transparent
   */
  render(ctx: CanvasRenderingContext2D, screenW: number, screenH: number, slot = 0): void {
    if (!this.active) return;

    // Fade in/out for slot-0 (newest); older slots are just steady at reduced alpha
    const fadeIn = Math.min(1, (this.duration - this.timer) / 0.15);
    const fadeOut = this.timer < FADE_START ? this.timer / FADE_START : 1;
    const baseAlpha = fadeIn * fadeOut;

    // Stack modifiers
    const slotAlpha   = Math.max(0, 1 - slot * 0.3);       // older = more transparent
    const slotScale   = Math.max(0.7, 1 - slot * 0.1);     // older = slightly smaller
    const slotOffsetY = slot * 28;                          // older = higher

    const alpha = baseAlpha * slotAlpha;
    if (alpha <= 0) return;

    const baseY = screenH * 0.36;
    const y = baseY - slotOffsetY;
    const fontSize = Math.round(16 * slotScale);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px monospace`;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(this.text, screenW / 2 + 1, y + 1);
    // Text
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, screenW / 2, y);

    ctx.restore();
  }
}
