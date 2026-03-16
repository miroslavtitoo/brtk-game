import { roundRect, formatTime } from '../utils/math';
import type { Player } from '../entities/Player';
import type { XPSystem } from '../systems/XPSystem';

const PADDING = 12;
const BAR_H = 10;
const BAR_W = 160;

export class HUD {
  render(
    ctx: CanvasRenderingContext2D,
    screenW: number,
    screenH: number,
    player: Player,
    gameTime: number,
    xpSystem: XPSystem
  ): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    this.renderHPBar(ctx, player, PADDING, PADDING);
    this.renderXPBar(ctx, xpSystem, PADDING, PADDING + BAR_H + 6);
    this.renderTimer(ctx, screenW, gameTime);
    this.renderWeaponLevel(ctx, xpSystem);

    ctx.restore();
  }

  private renderHPBar(
    ctx: CanvasRenderingContext2D,
    player: Player,
    x: number,
    y: number
  ): void {
    const pct = Math.max(0, player.hp / player.maxHp);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x - 2, y - 2, BAR_W + 4, BAR_H + 4, 3);
    ctx.fill();

    // Track
    ctx.fillStyle = '#2a0a0a';
    roundRect(ctx, x, y, BAR_W, BAR_H, 2);
    ctx.fill();

    // Fill — color shifts red→orange as HP drops
    const hue = Math.round(pct * 30); // 0°=red, 30°=orange
    ctx.fillStyle = `hsl(${hue}, 90%, 45%)`;
    if (pct > 0) {
      roundRect(ctx, x, y, BAR_W * pct, BAR_H, 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, x + 4, y + BAR_H / 2);
  }

  private renderXPBar(
    ctx: CanvasRenderingContext2D,
    xpSystem: XPSystem,
    x: number,
    y: number
  ): void {
    const pct = xpSystem.xpProgress;
    const level = xpSystem.weaponLevel;
    const isMax = xpSystem.isMaxLevel;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x - 2, y - 2, BAR_W + 4, BAR_H + 4, 3);
    ctx.fill();

    // Track
    ctx.fillStyle = '#1a1a0a';
    roundRect(ctx, x, y, BAR_W, BAR_H, 2);
    ctx.fill();

    // Fill
    ctx.fillStyle = isMax ? '#ffd700' : '#4a90e2';
    if (pct > 0) {
      roundRect(ctx, x, y, BAR_W * pct, BAR_H, 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'middle';
    const label = isMax ? `НИТЬ Lv.MAX` : `НИТЬ Lv.${level}`;
    ctx.fillText(label, x + 4, y + BAR_H / 2);
  }

  private renderTimer(
    ctx: CanvasRenderingContext2D,
    screenW: number,
    gameTime: number
  ): void {
    const text = formatTime(gameTime);
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(text, screenW / 2 + 1, PADDING + 1);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillText(text, screenW / 2, PADDING);
    ctx.textAlign = 'left';
  }

  private renderWeaponLevel(
    ctx: CanvasRenderingContext2D,
    xpSystem: XPSystem
  ): void {
    // Weapon level indicator — small dots below XP bar
    const level = xpSystem.weaponLevel;
    const startX = PADDING;
    const y = PADDING + BAR_H * 2 + 14;
    const dotR = 3;
    const spacing = 9;

    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textBaseline = 'middle';
    ctx.fillText('LVL', startX, y);

    for (let i = 0; i < 8; i++) {
      const cx = startX + 22 + i * spacing;
      ctx.beginPath();
      ctx.arc(cx, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = i < level ? '#ffd700' : 'rgba(255,255,255,0.2)';
      ctx.fill();
    }
  }
}
