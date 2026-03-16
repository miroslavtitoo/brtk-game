import { Enemy } from './Enemy';
import { ENEMY_HP_SCALE, ENEMY_DAMAGE_SCALE } from '../../config/enemyConfig';

const BASE_HP     = 130;
const BASE_SPEED  = 50;
const BASE_DAMAGE = 18;
const RADIUS      = 15;
const SPRITE_SIZE = 28;
const XP_VALUE    = 25;

/** Оборотень — первый босс. Меняется с каждой волной. */
export class Boss extends Enemy {
  private pulseTimer = 0;
  /** Shockwave: set when boss slams, GameScene reads & resets */
  shockwaving = false;
  readonly shockwaveRadius = 95;
  private shockwaveCooldown = 3.5;
  private shockwaveFlash = 0;

  constructor(x: number, y: number, wave = 1) {
    const hpScale  = Math.pow(ENEMY_HP_SCALE,  wave - 1);
    const dmgScale = Math.pow(ENEMY_DAMAGE_SCALE, wave - 1);
    super(
      x, y,
      Math.round(BASE_HP * hpScale),
      BASE_SPEED + wave * 2,
      BASE_DAMAGE * dmgScale,
      RADIUS,
      XP_VALUE + wave * 5,
      1.0 // always drops XP crystal
    );
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.updateDamageCooldown(dt);
    this.pulseTimer += dt;

    this.moveToward(playerX, playerY, dt);

    // Shockwave cooldown
    this.shockwaveCooldown -= dt;
    if (this.shockwaveFlash > 0) this.shockwaveFlash -= dt;

    if (this.shockwaveCooldown <= 0) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      if (dx * dx + dy * dy <= this.shockwaveRadius * this.shockwaveRadius) {
        this.shockwaving = true;
        this.shockwaveFlash = 0.35;
        this.shockwaveCooldown = 4.5;
      } else {
        this.shockwaveCooldown = 1.0; // retry in 1s
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = SPRITE_SIZE;
    const half = s / 2;
    const pulse = 0.88 + Math.sin(this.pulseTimer * 3.5) * 0.12;
    const r = half * pulse;

    ctx.save();
    ctx.shadowColor = '#7700bb';
    ctx.shadowBlur = 18 + Math.sin(this.pulseTimer * 4) * 6;

    // Outer aura
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#9900ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 8, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(
      this.x - r * 0.3, this.y - r * 0.3, 0,
      this.x, this.y, r
    );
    grad.addColorStop(0, '#8822cc');
    grad.addColorStop(0.6, '#440088');
    grad.addColorStop(1, '#1a0033');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOff = r * 0.3;
    const eyeY = this.y - r * 0.15;
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x - eyeOff, eyeY, 3, 0, Math.PI * 2);
    ctx.arc(this.x + eyeOff, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave flash
    if (this.shockwaveFlash > 0) {
      const fa = this.shockwaveFlash / 0.35;
      ctx.globalAlpha = fa * 0.5;
      ctx.fillStyle = '#cc44ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.shockwaveRadius * (1 - fa * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Boss HP bar — wider and more prominent
    this.renderBossHPBar(ctx, s);
  }

  private renderBossHPBar(ctx: CanvasRenderingContext2D, size: number): void {
    const barW = size * 2.5;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - size / 2 - 10;

    ctx.fillStyle = '#300';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#aa00cc';
    ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);

    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#ffbbff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ОБОРОТЕНЬ', this.x, by - 2);
    ctx.textAlign = 'left';
  }
}
