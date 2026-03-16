import { Entity } from './Entity';
import { AriadneThread } from '../weapons/AriadneThread';
import { PLAYER_CONFIG } from '../config/playerConfig';
import type { InputManager } from '../core/InputManager';
import type { Enemy } from './enemies/Enemy';

export class Player extends Entity {
  hp: number = PLAYER_CONFIG.HP;
  readonly maxHp: number = PLAYER_CONFIG.HP;
  readonly radius: number = PLAYER_CONFIG.RADIUS;
  readonly speed: number = PLAYER_CONFIG.SPEED;

  weapon = new AriadneThread();

  /** Last movement direction in radians (default: right) */
  facingAngle = 0;

  private invincibleTimer = 0;
  private blinkTimer = 0;
  private blinkVisible = true;
  private isMoving = false;

  /** Visual flash on level-up */
  private levelUpFlashTimer = 0;

  update(dt: number, input: InputManager, enemies: Enemy[]): void {
    // Movement
    if (input.magnitude > 0.01) {
      const speed = PLAYER_CONFIG.SPEED * input.magnitude;
      this.x += input.direction.x * speed * dt;
      this.y += input.direction.y * speed * dt;
      this.facingAngle = Math.atan2(input.direction.y, input.direction.x);
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Invincibility timer (level-up)
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.blinkTimer += dt;
      if (this.blinkTimer >= PLAYER_CONFIG.BLINK_INTERVAL) {
        this.blinkTimer = 0;
        this.blinkVisible = !this.blinkVisible;
      }
    } else {
      this.blinkVisible = true;
    }

    if (this.levelUpFlashTimer > 0) this.levelUpFlashTimer -= dt;

    // Update weapon
    this.weapon.update(dt, this.x, this.y, this.facingAngle, enemies);
  }

  takeDamage(amount: number): void {
    if (this.invincibleTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
  }

  isInvincible(): boolean {
    return this.invincibleTimer > 0;
  }

  triggerInvincibility(duration: number): void {
    this.invincibleTimer = duration;
    this.blinkTimer = 0;
    this.blinkVisible = true;
    this.levelUpFlashTimer = 0.4;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.blinkVisible) return;

    const s = PLAYER_CONFIG.SPRITE_SIZE;
    const half = s / 2;

    ctx.save();

    // Level-up golden flash aura
    if (this.levelUpFlashTimer > 0) {
      const alpha = this.levelUpFlashTimer / 0.4;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 30 * alpha;
      ctx.globalAlpha = 0.5 + alpha * 0.5;
    }

    // Body — blue square with slight rounding (Тесей placeholder)
    ctx.fillStyle = PLAYER_CONFIG.COLOR;
    ctx.strokeStyle = PLAYER_CONFIG.OUTLINE_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(this.x - half, this.y - half, s, s);
    ctx.fill();
    ctx.stroke();

    // Direction indicator (small triangle pointing toward facingAngle)
    const triLen = 6;
    const triX = this.x + Math.cos(this.facingAngle) * (half + 3);
    const triY = this.y + Math.sin(this.facingAngle) * (half + 3);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(triX, triY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();

    // Draw weapon arc
    this.weapon.render(ctx, this.x, this.y);
  }
}
