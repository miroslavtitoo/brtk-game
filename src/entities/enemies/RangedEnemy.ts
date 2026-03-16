import { Enemy } from './Enemy';
import { EnemyProjectile } from '../EnemyProjectile';
import {
  RANGED_CONFIG,
  RANGED_MIN_DIST,
  RANGED_MAX_DIST,
  RANGED_FIRE_COOLDOWN,
  RANGED_PROJ_SPEED,
  RANGED_PROJ_LIFETIME,
} from '../../config/enemyConfig';

export class RangedEnemy extends Enemy {
  /** Projectiles spawned this frame — GameScene drains this each tick */
  readonly pendingProjectiles: EnemyProjectile[] = [];

  private fireCooldown = RANGED_FIRE_COOLDOWN * 0.6; // slight delay before first shot

  constructor(x: number, y: number, hpScale = 1, dmgScale = 1) {
    const cfg = RANGED_CONFIG;
    super(x, y, Math.round(cfg.hp * hpScale), cfg.speed, cfg.damage * dmgScale, cfg.radius, cfg.xpValue, cfg.goldChance);
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.updateDamageCooldown(dt);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist < RANGED_MIN_DIST) {
      // Back away from player
      this.x -= (dx / dist) * this.speed * dt;
      this.y -= (dy / dist) * this.speed * dt;
    } else if (dist > RANGED_MAX_DIST) {
      // Approach
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    // In sweet spot (MIN–MAX): stand still and shoot

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = RANGED_FIRE_COOLDOWN;
      this.pendingProjectiles.push(
        new EnemyProjectile(this.x, this.y, playerX, playerY, RANGED_PROJ_SPEED, this.damage, RANGED_PROJ_LIFETIME)
      );
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = RANGED_CONFIG.spriteSize;
    const half = s / 2;

    ctx.save();
    ctx.shadowColor = '#cc2222';
    ctx.shadowBlur = 10;

    // Diamond / archer shape — rotated square
    ctx.fillStyle = RANGED_CONFIG.color;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-half + 1, -half + 1, s - 2, s - 2);
    ctx.restore();

    // Crosshair dot (aiming indicator)
    ctx.fillStyle = '#ff5555';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Reload pulse — shows how close to next shot
    const reloadFrac = 1 - this.fireCooldown / RANGED_FIRE_COOLDOWN;
    if (reloadFrac > 0.8) {
      ctx.globalAlpha = (reloadFrac - 0.8) / 0.2;
      ctx.fillStyle = '#ff8888';
      ctx.beginPath();
      ctx.arc(this.x, this.y, half + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    this.renderHPBar(ctx, s);
  }

  /** Drain newly spawned projectiles */
  drainProjectiles(): EnemyProjectile[] {
    const out = this.pendingProjectiles.splice(0);
    return out;
  }
}
