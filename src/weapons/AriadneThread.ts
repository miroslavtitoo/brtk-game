import { ARIADNE_LEVELS, ARIADNE_FLASH_DURATION } from '../config/weaponConfig';
import { deg2rad, isAngleInArc } from '../utils/math';
import type { Enemy } from '../entities/enemies/Enemy';

export class AriadneThread {
  level = 1;  // 1-8
  private cooldownTimer = 0;
  private flashTimer = 0;  // how long the arc flash remains visible
  private lastFacingAngle = 0;  // radians, direction of last attack

  get data() {
    return ARIADNE_LEVELS[this.level - 1];
  }

  get isFlashing(): boolean {
    return this.flashTimer > 0;
  }

  /** Called every frame. Returns list of enemies that were hit. */
  update(dt: number, playerX: number, playerY: number, facingAngle: number, enemies: Enemy[]): Enemy[] {
    const hits: Enemy[] = [];

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      return hits;
    }

    // Fire!
    this.cooldownTimer = this.data.cooldown;
    this.flashTimer = ARIADNE_FLASH_DURATION;
    this.lastFacingAngle = facingAngle;

    const { damage, radius, arcAngle } = this.data;
    const halfArc = deg2rad(arcAngle) / 2;
    const radiusSq = radius * radius;
    const fullCircle = arcAngle >= 360;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      if (dx * dx + dy * dy > radiusSq) continue;

      if (fullCircle || isAngleInArc(Math.atan2(dy, dx), facingAngle, halfArc)) {
        enemy.takeDamage(damage);
        hits.push(enemy);
      }
    }

    return hits;
  }

  /** Render the arc flash (call inside camera transform) */
  render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    if (this.flashTimer <= 0) return;

    const { radius, arcAngle } = this.data;
    const alpha = this.flashTimer / ARIADNE_FLASH_DURATION;

    ctx.save();
    ctx.globalAlpha = alpha * 0.55;

    const halfArc = deg2rad(arcAngle) / 2;
    const startAngle = this.lastFacingAngle - halfArc;
    const endAngle = this.lastFacingAngle + halfArc;
    const fullCircle = arcAngle >= 360;

    // Outer glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16;

    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    if (fullCircle) {
      ctx.arc(playerX, playerY, radius, 0, Math.PI * 2);
    } else {
      ctx.arc(playerX, playerY, radius, startAngle, endAngle);
    }
    ctx.closePath();
    ctx.fill();

    // Bright edge
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (fullCircle) {
      ctx.arc(playerX, playerY, radius, 0, Math.PI * 2);
    } else {
      ctx.arc(playerX, playerY, radius, startAngle, endAngle);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** XP cooldown readiness as 0–1 */
  get cooldownFraction(): number {
    if (this.data.cooldown <= 0) return 1;
    return 1 - Math.max(0, this.cooldownTimer) / this.data.cooldown;
  }
}
