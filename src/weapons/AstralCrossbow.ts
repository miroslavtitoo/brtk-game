import { BaseWeapon } from './Weapon';
import { CROSSBOW_LEVELS } from '../config/weaponConfig';
import type { Enemy } from '../entities/enemies/Enemy';

const BOLT_SPEED = 400; // px/s

type BoltState = 'traveling' | 'embedded' | 'exploding' | 'done';

class Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: BoltState = 'traveling';
  traveled = 0;

  private boltDamage: number;
  private explosionDamage: number;
  private explosionRadius: number;
  private maxRange: number;
  private embedTime: number;
  private embedTimer = 0;
  private flashTimer = 0;

  private pierced = 0;              // number of enemies pierced so far
  private hitSet = new Set<Enemy>(); // avoid re-hitting same enemy while traveling

  // 5th-shot marker for passive (Орион: every 5th shot = double damage + auto-aim)
  isPowered: boolean;

  constructor(
    x: number,
    y: number,
    angle: number,
    boltDamage: number,
    explosionDamage: number,
    explosionRadius: number,
    maxRange: number,
    embedTime: number,
    isPowered: boolean
  ) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle);
    this.boltDamage = isPowered ? boltDamage * 2 : boltDamage;
    this.explosionDamage = isPowered ? explosionDamage * 2 : explosionDamage;
    this.explosionRadius = explosionRadius;
    this.maxRange = maxRange;
    this.embedTime = embedTime;
    this.isPowered = isPowered;
  }

  update(dt: number, enemies: Enemy[]): void {
    if (this.state === 'done') return;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.state = 'done';
      return;
    }

    if (this.state === 'traveling') {
      const moveX = this.vx * BOLT_SPEED * dt;
      const moveY = this.vy * BOLT_SPEED * dt;
      this.x += moveX;
      this.y += moveY;
      this.traveled += Math.sqrt(moveX * moveX + moveY * moveY);

      for (const enemy of enemies) {
        if (!enemy.active || this.hitSet.has(enemy)) continue;
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const rSum = enemy.radius + 5;
        if (dx * dx + dy * dy > rSum * rSum) continue;

        this.hitSet.add(enemy);
        enemy.takeDamage(this.boltDamage);
        this.pierced++;

        if (this.pierced >= 2) {
          this.state = 'embedded';
          this.embedTimer = this.embedTime;
          return;
        }
      }

      if (this.traveled >= this.maxRange) {
        this.state = 'done'; // no explosion if didn't embed
      }
      return;
    }

    if (this.state === 'embedded') {
      this.embedTimer -= dt;
      if (this.embedTimer <= 0) {
        this.explode(enemies);
      }
      return;
    }
  }

  private explode(enemies: Enemy[]): void {
    const rSq = this.explosionRadius * this.explosionRadius;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      if (dx * dx + dy * dy <= rSq) {
        enemy.takeDamage(this.explosionDamage);
      }
    }
    this.state = 'exploding';
    this.flashTimer = 0.28;
  }

  get isDone(): boolean {
    return this.state === 'done';
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'done') return;

    if (this.state === 'exploding') {
      const alpha = this.flashTimer / 0.28;
      const r = this.explosionRadius * (1.2 - alpha * 0.5);
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.shadowColor = '#7df9ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.isPowered ? '#ffdd44' : '#b0e0ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.shadowColor = this.isPowered ? '#ffd700' : '#7df9ff';
    ctx.shadowBlur = this.isPowered ? 16 : 10;

    if (this.state === 'embedded') {
      const pulse = 0.7 + Math.sin(this.embedTimer * 25) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = this.isPowered ? '#ffe055' : '#a8e8ff';
      ctx.beginPath();
      // Pulsing diamond
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    } else {
      // Traveling bolt — thin arrow
      ctx.strokeStyle = this.isPowered ? '#ffd700' : '#c0f0ff';
      ctx.lineWidth = this.isPowered ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - this.vx * 10, this.y - this.vy * 10);
      ctx.lineTo(this.x + this.vx * 4, this.y + this.vy * 4);
      ctx.stroke();

      // Tip glow
      ctx.fillStyle = '#e8f8ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.isPowered ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class AstralCrossbow extends BaseWeapon {
  readonly displayName = 'Астральный арбалет';

  private cooldownTimer = 0;
  private bolts: Bolt[] = [];
  private shotCount = 0; // for 5th-shot passive

  get data() {
    return CROSSBOW_LEVELS[this.level - 1];
  }

  override update(dt: number, playerX: number, playerY: number, facingAngle: number, enemies: Enemy[]): void {
    // Update existing bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].update(dt, enemies);
      if (this.bolts[i].isDone) this.bolts.splice(i, 1);
    }

    // Cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      return;
    }

    this.cooldownTimer = this.data.cooldown;

    const { boltCount, spreadDeg, boltDamage, explosionDamage, explosionRadius, boltRange, embedTime } = this.data;
    this.shotCount++;
    const isPowered = this.shotCount % 5 === 0;

    // Auto-aim at closest enemy always; 5th shot targets strongest (most HP) and deals 2× damage
    let aimAngle = facingAngle; // fallback if no enemies
    const activeEnemies = enemies.filter(e => e.active);
    if (activeEnemies.length > 0) {
      if (isPowered) {
        // 5th shot: strongest enemy
        const strongest = activeEnemies.reduce((best, e) => e.hp > best.hp ? e : best);
        aimAngle = Math.atan2(strongest.y - playerY, strongest.x - playerX);
      } else {
        // All other shots: closest enemy
        const closest = activeEnemies.reduce((best, e) => {
          const da = (e.x - playerX) ** 2 + (e.y - playerY) ** 2;
          const db = (best.x - playerX) ** 2 + (best.y - playerY) ** 2;
          return da < db ? e : best;
        });
        aimAngle = Math.atan2(closest.y - playerY, closest.x - playerX);
      }
    }

    const spreadRad = (spreadDeg * Math.PI) / 180;

    for (let i = 0; i < boltCount; i++) {
      let angle = aimAngle;
      if (boltCount > 1) {
        const offset = -spreadRad + (spreadRad * 2 * i) / (boltCount - 1);
        angle += offset;
      }
      this.bolts.push(
        new Bolt(playerX, playerY, angle, boltDamage, explosionDamage, explosionRadius, boltRange, embedTime, isPowered)
      );
    }
  }

  override render(ctx: CanvasRenderingContext2D, _playerX: number, _playerY: number): void {
    for (const bolt of this.bolts) bolt.render(ctx);
  }
}
