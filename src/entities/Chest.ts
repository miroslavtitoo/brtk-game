/** Golden chest that appears on the map and gives a weapon level-up */
export class Chest {
  readonly x: number;
  readonly y: number;
  readonly radius = 14;

  collected = false;
  active = true;

  private glowTimer = 0;
  private bobTimer = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.glowTimer = Math.random() * Math.PI * 2; // random phase
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (!this.active) return;
    this.glowTimer += dt * 2.5;
    this.bobTimer += dt * 3;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    if (dx * dx + dy * dy <= this.radius * this.radius) {
      this.collected = true;
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const bob = Math.sin(this.bobTimer) * 2;
    const glow = 0.6 + Math.sin(this.glowTimer) * 0.4;
    const cx = this.x;
    const cy = this.y + bob;
    const W = 20;
    const H = 16;

    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14 * glow;

    // Chest body
    ctx.fillStyle = '#a0620a';
    ctx.fillRect(cx - W / 2, cy - H / 2 + 4, W, H - 4);

    // Lid
    ctx.fillStyle = '#c87820';
    ctx.fillRect(cx - W / 2, cy - H / 2, W, 8);
    ctx.fillRect(cx - W / 2 + 1, cy - H / 2 + 1, W - 2, 6);

    // Gold trim
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.globalAlpha = glow;
    ctx.strokeRect(cx - W / 2, cy - H / 2, W, H);
    ctx.globalAlpha = 1;

    // Latch
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Floating ★ sparkle
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255,220,80,${glow})`;
    ctx.fillText('★', cx, cy - H / 2 - 8 + bob);

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
