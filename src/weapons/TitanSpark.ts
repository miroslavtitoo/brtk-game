import { BaseWeapon } from './Weapon';
import {
  TITAN_LEVELS,
  TITAN_ORBIT_RADIUS,
  TITAN_ORBIT_SPEED,
  TITAN_SPHERE_RADIUS,
  TITAN_SPHERE_CONTACT_COOLDOWN,
  TITAN_TONGUE_SPEED,
  TITAN_TONGUE_MAX_RANGE,
} from '../config/weaponConfig';
import type { Enemy } from '../entities/enemies/Enemy';

// ── Fire Tongue projectile ────────────────────────────────────────────────────

class FireTongue {
  x: number;
  y: number;
  vx: number;
  vy: number;
  traveled = 0;
  done = false;
  private damage: number;
  private hitSet = new Set<Enemy>();
  private flashTimer = 0;

  constructor(sx: number, sy: number, tx: number, ty: number, damage: number) {
    this.x = sx;
    this.y = sy;
    this.damage = damage;
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = dx / dist;
    this.vy = dy / dist;
  }

  update(dt: number, enemies: Enemy[]): void {
    if (this.done) return;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.done = true;
      return;
    }

    const step = TITAN_TONGUE_SPEED * dt;
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.traveled += step;

    for (const enemy of enemies) {
      if (!enemy.active || this.hitSet.has(enemy)) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const rSum = enemy.radius + 5;
      if (dx * dx + dy * dy <= rSum * rSum) {
        this.hitSet.add(enemy);
        enemy.takeDamage(this.damage);
        this.flashTimer = 0.12;
        return;
      }
    }

    if (this.traveled >= TITAN_TONGUE_MAX_RANGE) {
      this.done = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.done && this.flashTimer <= 0) return;

    const alpha = this.flashTimer > 0 ? this.flashTimer / 0.12 : 1;
    const prog = this.traveled / TITAN_TONGUE_MAX_RANGE;

    ctx.save();
    ctx.globalAlpha = alpha * (1 - prog * 0.5);
    ctx.strokeStyle = this.flashTimer > 0 ? '#ffeeaa' : '#ff8c00';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 12, this.y - this.vy * 12);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── TitanSpark weapon ─────────────────────────────────────────────────────────

export class TitanSpark extends BaseWeapon {
  readonly displayName = 'Искра Титана';

  private orbitAngle = 0;
  private sphereX = 0;
  private sphereY = 0;
  private cooldownTimer = 0;
  private tongues: FireTongue[] = [];

  /** Track per-enemy contact cooldown to avoid rapid damage */
  private contactTimers = new Map<Enemy, number>();

  get data() {
    return TITAN_LEVELS[this.level - 1];
  }

  override update(dt: number, playerX: number, playerY: number, _facingAngle: number, enemies: Enemy[]): void {
    // Orbit
    this.orbitAngle += TITAN_ORBIT_SPEED * dt;
    this.sphereX = playerX + Math.cos(this.orbitAngle) * TITAN_ORBIT_RADIUS;
    this.sphereY = playerY + Math.sin(this.orbitAngle) * TITAN_ORBIT_RADIUS;

    // Decay contact timers
    for (const [enemy, timer] of this.contactTimers) {
      if (!enemy.active) { this.contactTimers.delete(enemy); continue; }
      const next = timer - dt;
      if (next <= 0) this.contactTimers.delete(enemy);
      else this.contactTimers.set(enemy, next);
    }

    // Sphere contact damage
    for (const enemy of enemies) {
      if (!enemy.active || this.contactTimers.has(enemy)) continue;
      const dx = enemy.x - this.sphereX;
      const dy = enemy.y - this.sphereY;
      const rSum = enemy.radius + TITAN_SPHERE_RADIUS;
      if (dx * dx + dy * dy <= rSum * rSum) {
        enemy.takeDamage(this.data.sphereContactDamage);
        this.contactTimers.set(enemy, TITAN_SPHERE_CONTACT_COOLDOWN);
      }
    }

    // Volley cooldown
    this.cooldownTimer -= dt;
    if (this.cooldownTimer <= 0) {
      this.cooldownTimer = this.data.cooldown;
      this.fireVolley(enemies);
    }

    // Update tongues
    for (let i = this.tongues.length - 1; i >= 0; i--) {
      this.tongues[i].update(dt, enemies);
      if (this.tongues[i].done) this.tongues.splice(i, 1);
    }
  }

  private fireVolley(enemies: Enemy[]): void {
    const count = this.data.tongueCount;
    if (enemies.length === 0) return;

    // Sort by distance to sphere, take closest N
    const active = enemies.filter(e => e.active);
    active.sort((a, b) => {
      const da = (a.x - this.sphereX) ** 2 + (a.y - this.sphereY) ** 2;
      const db = (b.x - this.sphereX) ** 2 + (b.y - this.sphereY) ** 2;
      return da - db;
    });

    const targets = active.slice(0, count);
    for (const target of targets) {
      this.tongues.push(
        new FireTongue(this.sphereX, this.sphereY, target.x, target.y, this.data.tongueDamage)
      );
    }
  }

  override render(ctx: CanvasRenderingContext2D, _playerX: number, _playerY: number): void {
    // Draw tongues first (under sphere)
    for (const tongue of this.tongues) tongue.render(ctx);

    // Orbiting fire sphere
    const pulse = 0.85 + Math.sin(this.orbitAngle * 3) * 0.15;
    const r = TITAN_SPHERE_RADIUS * pulse;

    ctx.save();
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 16;

    // Outer glow
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(this.sphereX, this.sphereY, r + 5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(
      this.sphereX - r * 0.3, this.sphereY - r * 0.3, 0,
      this.sphereX, this.sphereY, r
    );
    grad.addColorStop(0, '#ffee88');
    grad.addColorStop(0.5, '#ff8800');
    grad.addColorStop(1, '#cc2200');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.sphereX, this.sphereY, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
