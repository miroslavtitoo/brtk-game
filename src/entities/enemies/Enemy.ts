import { Entity } from '../Entity';

export abstract class Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  goldChance: number;

  private damageCooldownTimer = 0;

  constructor(
    x: number,
    y: number,
    hp: number,
    speed: number,
    damage: number,
    radius: number,
    xpValue: number,
    goldChance: number
  ) {
    super(x, y);
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.radius = radius;
    this.xpValue = xpValue;
    this.goldChance = goldChance;
  }

  /** Move directly toward target position */
  protected moveToward(targetX: number, targetY: number, dt: number, speedOverride?: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const spd = speedOverride ?? this.speed;
    this.x += (dx / dist) * spd * dt;
    this.y += (dy / dist) * spd * dt;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.active = false;
    }
  }

  canDamagePlayer(): boolean {
    return this.damageCooldownTimer <= 0;
  }

  resetDamageCooldown(cooldown: number): void {
    this.damageCooldownTimer = cooldown;
  }

  protected updateDamageCooldown(dt: number): void {
    if (this.damageCooldownTimer > 0) {
      this.damageCooldownTimer -= dt;
    }
  }

  /** Render a small HP bar above the enemy */
  protected renderHPBar(ctx: CanvasRenderingContext2D, size: number): void {
    if (this.hp >= this.maxHp) return;
    const barW = size + 4;
    const barH = 2;
    const bx = this.x - barW / 2;
    const by = this.y - size / 2 - 5;

    ctx.fillStyle = '#400';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#f44';
    ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
  }
}
