import { roundRect, formatTime } from '../utils/math';

export class GameOverScreen {
  private fadeTimer = 0;
  private readonly FADE_DURATION = 0.8;
  visible = false;

  private stats = { time: 0, kills: 0 };
  private onRestart: (() => void) | null = null;
  private onMenu: (() => void) | null = null;

  private restartBtn = { x: 0, y: 0, w: 0, h: 0 };
  private menuBtn    = { x: 0, y: 0, w: 0, h: 0 };

  show(time: number, kills: number, onRestart: () => void, onMenu: () => void): void {
    this.stats = { time, kills };
    this.fadeTimer = 0;
    this.visible = true;
    this.onRestart = onRestart;
    this.onMenu = onMenu;
  }

  hide(): void { this.visible = false; }

  update(dt: number): void {
    if (!this.visible) return;
    this.fadeTimer = Math.min(this.fadeTimer + dt, this.FADE_DURATION);
  }

  render(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!this.visible) return;

    const alpha = this.fadeTimer / this.FADE_DURATION;
    const cx = screenW / 2;
    const cy = screenH / 2;

    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.globalAlpha = alpha;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('GAME OVER', cx + 2, cy - 70 + 2);
    ctx.fillStyle = '#c0392b';
    ctx.fillText('GAME OVER', cx, cy - 70);

    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(180,160,200,0.9)';
    ctx.fillText('Тени поглотили героя...', cx, cy - 38);

    // Stats box
    const boxW = 220, boxH = 70;
    const bx = cx - boxW / 2, by = cy - 15;

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

    // ── Two buttons ──────────────────────────────────────────────────────────
    const btnH  = 44;
    const gap   = 10;
    const btnW1 = 155;
    const btnW2 = 95;
    const totalW = btnW1 + gap + btnW2;
    const btnY   = cy + 75;
    const startX = cx - totalW / 2;

    // "Играть снова"
    const rx = startX;
    this.restartBtn = { x: rx, y: btnY, w: btnW1, h: btnH };
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, rx, btnY, btnW1, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, rx, btnY, btnW1, btnH, 8);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('▶ ИГРАТЬ СНОВА', rx + btnW1 / 2, btnY + btnH / 2);

    // "Меню"
    const mx = startX + btnW1 + gap;
    this.menuBtn = { x: mx, y: btnY, w: btnW2, h: btnH };
    ctx.fillStyle = 'rgba(50,50,90,0.95)';
    roundRect(ctx, mx, btnY, btnW2, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,200,0.5)';
    roundRect(ctx, mx, btnY, btnW2, btnH, 8);
    ctx.stroke();
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('☰ МЕНЮ', mx + btnW2 / 2, btnY + btnH / 2);

    ctx.restore();
  }

  handleTap(x: number, y: number): boolean {
    if (!this.visible) return false;
    const hit = (b: {x:number;y:number;w:number;h:number}) =>
      x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    if (hit(this.restartBtn)) { this.onRestart?.(); return true; }
    if (hit(this.menuBtn))    { this.onMenu?.();    return true; }
    return false;
  }
}
