import { Entity } from './Entity';

const ATTRACT_RADIUS_SQ = 60 * 60;   // 60px attraction radius
const ATTRACT_SPEED = 180;           // px/s when attracted
const COLLECT_RADIUS_SQ = 10 * 10;   // px, auto-collect distance

export class XPCrystal extends Entity {
  value: number;
  collected = false;
  private attracted = false;
  private bobTimer = 0;

  constructor(x: number, y: number, value: number) {
    super(x, y);
    this.value = value;
    // Random tiny spawn offset so crystals don't stack perfectly
    this.x += (Math.random() - 0.5) * 12;
    this.y += (Math.random() - 0.5) * 12;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.bobTimer += dt;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq <= COLLECT_RADIUS_SQ) {
      this.collected = true;
      this.active = false;
      return;
    }

    if (distSq <= ATTRACT_RADIUS_SQ) {
      this.attracted = true;
    }

    if (this.attracted) {
      const dist = Math.sqrt(distSq);
      const speed = ATTRACT_SPEED * dt;
      this.x += (dx / dist) * Math.min(speed, dist);
      this.y += (dy / dist) * Math.min(speed, dist);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bob = Math.sin(this.bobTimer * 4) * 1.5;
    const cy = this.y + bob;

    ctx.save();
    ctx.shadowColor = '#00cfff';
    ctx.shadowBlur = 6;

    // Diamond shape
    ctx.fillStyle = this.attracted ? '#66dfff' : '#00b4d8';
    ctx.beginPath();
    ctx.moveTo(this.x, cy - 5);
    ctx.lineTo(this.x + 3, cy);
    ctx.lineTo(this.x, cy + 5);
    ctx.lineTo(this.x - 3, cy);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(this.x, cy - 5);
    ctx.lineTo(this.x + 1.5, cy - 1);
    ctx.lineTo(this.x, cy - 1);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
