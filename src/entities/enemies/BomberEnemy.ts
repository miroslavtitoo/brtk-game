import { Enemy } from './Enemy';
import {
  BOMBER_CONFIG,
  BOMBER_TRIGGER_RANGE,
  BOMBER_EXPLOSION_RADIUS,
} from '../../config/enemyConfig';

export class BomberEnemy extends Enemy {
  /** Set to true when the bomber triggers its explosion */
  exploding = false;
  readonly explosionRadius = BOMBER_EXPLOSION_RADIUS;

  private pulseTimer = 0;
  private hasExploded = false;

  constructor(x: number, y: number, hpScale = 1, dmgScale = 1) {
    const cfg = BOMBER_CONFIG;
    super(x, y, Math.round(cfg.hp * hpScale), cfg.speed, cfg.damage * dmgScale, cfg.radius, cfg.xpValue, cfg.goldChance);
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (this.hasExploded) return;
    this.updateDamageCooldown(dt);
    this.pulseTimer += dt;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= BOMBER_TRIGGER_RANGE) {
      this.hasExploded = true;
      this.exploding = true;
      this.active = false; // removes from enemy list, GameScene handles explosion
      return;
    }

    this.moveToward(playerX, playerY, dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = BOMBER_CONFIG.spriteSize;
    const pulse = 0.8 + Math.sin(this.pulseTimer * 6) * 0.2;
    const r = (s / 2) * pulse;

    ctx.save();
    ctx.shadowColor = '#ff7700';
    ctx.shadowBlur = 12 + Math.sin(this.pulseTimer * 6) * 6;

    // Outer glow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
    ctx.fill();

    // Core — orange circle
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(
      this.x - r * 0.3, this.y - r * 0.3, 0,
      this.x, this.y, r
    );
    grad.addColorStop(0, '#ffcc44');
    grad.addColorStop(0.6, '#cc5500');
    grad.addColorStop(1, '#881100');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Warning cross ✕
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    const cx = this.x, cy = this.y, cr = r * 0.4;
    ctx.beginPath();
    ctx.moveTo(cx - cr, cy - cr); ctx.lineTo(cx + cr, cy + cr);
    ctx.moveTo(cx + cr, cy - cr); ctx.lineTo(cx - cr, cy + cr);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();

    this.renderHPBar(ctx, s);
  }
}
