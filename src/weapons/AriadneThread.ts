import { BaseWeapon } from './Weapon';
import { ARIADNE_LEVELS, ARIADNE_FLASH_DURATION } from '../config/weaponConfig';
import type { Enemy } from '../entities/enemies/Enemy';

export class AriadneThread extends BaseWeapon {
  readonly displayName = 'Нить братства';

  private cooldownTimer = 0;
  private flashTimer = 0;

  get data() {
    return ARIADNE_LEVELS[this.level - 1];
  }

  override update(
    dt: number,
    playerX: number,
    playerY: number,
    _facingAngle: number,
    enemies: Enemy[]
  ): void {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      return;
    }

    // Fire — always 360° circle
    this.cooldownTimer = this.data.cooldown;
    this.flashTimer = ARIADNE_FLASH_DURATION;

    const { damage, radius } = this.data;
    const radiusSq = radius * radius;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      if (dx * dx + dy * dy <= radiusSq) {
        enemy.takeDamage(damage);
      }
    }
  }

  override render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    if (this.flashTimer <= 0) return;

    const { radius } = this.data;
    const alpha = this.flashTimer / ARIADNE_FLASH_DURATION;

    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;

    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(playerX, playerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
