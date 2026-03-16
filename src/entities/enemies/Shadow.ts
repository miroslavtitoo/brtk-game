import { Enemy } from './Enemy';
import { SHADOW_CONFIG } from '../../config/enemyConfig';

export class Shadow extends Enemy {
  private hpScale: number;
  private damageScale: number;

  constructor(x: number, y: number, hpScale: number = 1, damageScale: number = 1) {
    const cfg = SHADOW_CONFIG;
    super(
      x, y,
      Math.round(cfg.hp * hpScale),
      cfg.speed,
      cfg.damage * damageScale,
      cfg.radius,
      cfg.xpValue,
      cfg.goldChance
    );
    this.hpScale = hpScale;
    this.damageScale = damageScale;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.updateDamageCooldown(dt);
    this.moveToward(playerX, playerY, dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = SHADOW_CONFIG.spriteSize;
    const half = s / 2;

    ctx.save();

    // Shadow body — dark purple blob
    ctx.shadowColor = 'rgba(120, 0, 200, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = SHADOW_CONFIG.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, half + 1, half, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wispy top
    ctx.fillStyle = 'rgba(100, 0, 160, 0.5)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - half + 1, half * 0.6, half * 0.8, 0, Math.PI, 0);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    this.renderHPBar(ctx, s);
  }

  resetOnPool(x: number, y: number, hpScale: number = 1, damageScale: number = 1): void {
    this.x = x;
    this.y = y;
    this.hpScale = hpScale;
    this.damageScale = damageScale;
    this.hp = Math.round(SHADOW_CONFIG.hp * hpScale);
    this.maxHp = this.hp;
    this.damage = SHADOW_CONFIG.damage * damageScale;
    this.speed = SHADOW_CONFIG.speed;
    this.active = true;
  }
}
