/** Projectile fired by ranged enemies — damages the player on hit */
export class EnemyProjectile {
  x: number;
  y: number;
  private vx: number;
  private vy: number;
  readonly damage: number;
  private lifetime: number;
  readonly radius = 4;
  consumed = false;

  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    lifetime: number
  ) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.lifetime = lifetime;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
  }

  update(dt: number): void {
    if (this.consumed) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.consumed = true;
  }

  hitsPlayer(playerX: number, playerY: number, playerRadius: number): boolean {
    if (this.consumed) return false;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const rSum = this.radius + playerRadius;
    return dx * dx + dy * dy <= rSum * rSum;
  }

  get isDone(): boolean {
    return this.consumed;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.consumed) return;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const nx = this.vx / speed;
    const ny = this.vy / speed;

    ctx.save();
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 8;

    // Trail
    ctx.strokeStyle = 'rgba(180, 30, 30, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x - nx * 10, this.y - ny * 10);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Core
    ctx.fillStyle = '#ff6655';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
