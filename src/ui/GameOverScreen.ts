import { roundRect, formatTime } from '../utils/math';

export class GameOverScreen {
  private fadeTimer = 0;
  private readonly FADE_DURATION = 0.8;
  visible = false;

  private stats = {
    time: 0,
    kills: 0,
  };

  private restartCallback: (() => void) | null = null;

  /** Button bounds for tap/click detection */
  private btnX = 0;
  private btnY = 0;
  private btnW = 0;
  private btnH = 0;

  show(time: number, kills: number, onRestart: () => void): void {
    this.stats = { time, kills };
    this.fadeTimer = 0;
    this.visible = true;
    this.restartCallback = onRestart;
  }

  hide(): void {
    this.visible = false;
  }

  update(dt: number): void {
    if (!this.visible) return;
    this.fadeTimer = Math.min(this.fadeTimer + dt, this.FADE_DURATION);
  }

  render(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!this.visible) return;

    const alpha = this.fadeTimer / this.FADE_DURATION;

    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.globalAlpha = alpha;

    const cx = screenW / 2;
    const cy = screenH / 2;

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('GAME OVER', cx + 2, cy - 70 + 2);

    ctx.fillStyle = '#c0392b';
    ctx.fillText('GAME OVER', cx, cy - 70);

    // Subtitle
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(180,160,200,0.9)';
    ctx.fillText('Тени поглотили Тесея...', cx, cy - 38);

    // Stats box
    const boxW = 220;
    const boxH = 70;
    const bx = cx - boxW / 2;
    const by = cy - 15;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText('Выжил:', bx + 16, by + 20);
    ctx.fillText('Убийств:', bx + 16, by + 44);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(formatTime(this.stats.time), bx + boxW - 16, by + 20);
    ctx.fillText(String(this.stats.kills), bx + boxW - 16, by + 44);

    // Restart button
    const btnW = 160;
    const btnH = 42;
    const btnX = cx - btnW / 2;
    const btnY = cy + 75;

    this.btnX = btnX;
    this.btnY = btnY;
    this.btnW = btnW;
    this.btnH = btnH;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ИГРАТЬ СНОВА', cx, btnY + btnH / 2);

    ctx.restore();
  }

  handleTap(x: number, y: number): boolean {
    if (!this.visible) return false;
    if (
      x >= this.btnX &&
      x <= this.btnX + this.btnW &&
      y >= this.btnY &&
      y <= this.btnY + this.btnH
    ) {
      this.restartCallback?.();
      return true;
    }
    return false;
  }
}
