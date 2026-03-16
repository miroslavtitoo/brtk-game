import { CHARACTERS, type CharacterType, type CharacterDef } from '../config/characterConfig';
import { GAME_CONFIG } from '../config/gameConfig';
import { roundRect } from '../utils/math';
import type { InputManager } from '../core/InputManager';

/* ── Card layout ─────────────────────────────────────────────── */
const CARD_W = 120;
const CARD_H = 240;
const CARD_GAP = 8;
const CARD_RADIUS = 10;
const TOTAL_CARDS_W = CARD_W * 3 + CARD_GAP * 2;

export class CharacterSelectScene {
  private selected: CharacterType = 'theseus';
  private onStart: (c: CharacterType) => void;

  private screenW = 0;
  private screenH = 0;
  private bgOffset = 0;
  private time = 0; // for title pulse animation

  private cardBounds: Array<{ x: number; y: number; w: number; h: number; id: CharacterType }> = [];
  private btnBounds = { x: 0, y: 0, w: 0, h: 0 };

  private readonly dpr: number;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly canvas: HTMLCanvasElement,
    private readonly input: InputManager,
    dpr: number,
    onStart: (character: CharacterType) => void
  ) {
    this.dpr = dpr;
    this.onStart = onStart;
    this.screenW = canvas.width / dpr;
    this.screenH = canvas.height / dpr;

    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  update(dt: number): void {
    this.bgOffset = (this.bgOffset + dt * 15) % GAME_CONFIG.BG_TILE_SIZE;
    this.time += dt;
  }

  render(): void {
    const { ctx } = this;
    const W = this.screenW;
    const H = this.screenH;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Background
    this.renderBackground(ctx, W, H);

    // Cards (centered)
    const cardY = this.getCardY(H);
    this.renderCards(ctx, W, cardY);

    // Title block — above cards
    this.renderTitle(ctx, W, cardY);

    // Start button — below cards
    this.renderStartButton(ctx, W, cardY);

    this.input.render(ctx);
  }

  /* ── Background ────────────────────────────────────────────── */

  private renderBackground(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    const TILE = GAME_CONFIG.BG_TILE_SIZE;
    const off = this.bgOffset;

    ctx.strokeStyle = '#161630';
    ctx.lineWidth = 0.5;

    for (let x = -off; x <= W + TILE; x += TILE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = -off; y <= H + TILE; y += TILE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    grad.addColorStop(0, 'rgba(30, 20, 60, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Card Y position (vertically centered) ─────────────────── */

  private getCardY(H: number): number {
    // Center card block vertically with slight upward offset
    return H / 2 - CARD_H / 2 - 6;
  }

  /* ── Title ─────────────────────────────────────────────────── */

  private renderTitle(ctx: CanvasRenderingContext2D, W: number, cardY: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Pulsing main title «ПЕТРОСТИГИЯ» (Minecraft-style breathe)
    const pulse = 1 + Math.sin(this.time * 1.8) * 0.04; // scale 0.96–1.04
    const titleY = cardY - 68;

    ctx.save();
    ctx.translate(W / 2, titleY);
    ctx.scale(pulse, pulse);

    // Shadow
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('ПЕТРОСТИГИЯ', 2, 2);

    // Glow
    ctx.shadowColor = '#5588ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#c8d8ff';
    ctx.fillText('ПЕТРОСТИГИЯ', 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();

    // Subtitle «ВЫБЕРИ ГЕРОЯ»
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText('ВЫБЕРИ ГЕРОЯ', W / 2 + 1, cardY - 28 + 1);
    ctx.fillStyle = 'rgba(200,210,240,0.8)';
    ctx.fillText('ВЫБЕРИ ГЕРОЯ', W / 2, cardY - 28);
  }

  /* ── Cards ─────────────────────────────────────────────────── */

  private renderCards(ctx: CanvasRenderingContext2D, W: number, cardY: number): void {
    this.cardBounds = [];
    const startX = W / 2 - TOTAL_CARDS_W / 2;

    CHARACTERS.forEach((char, i) => {
      const cx = startX + i * (CARD_W + CARD_GAP);
      const isSelected = this.selected === char.id;
      this.cardBounds.push({ x: cx, y: cardY, w: CARD_W, h: CARD_H, id: char.id });
      this.renderCard(ctx, cx, cardY, char, isSelected);
    });
  }

  private renderCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    char: CharacterDef,
    selected: boolean
  ): void {
    ctx.save();

    /* Card background */
    ctx.fillStyle = selected ? 'rgba(40,40,70,0.95)' : 'rgba(20,20,40,0.85)';
    roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fill();

    /* Border */
    if (selected) {
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = char.color;
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = 'rgba(80,80,120,0.5)';
      ctx.lineWidth = 1;
    }
    roundRect(ctx, x, y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* Color accent bar at top */
    ctx.fillStyle = char.color;
    ctx.globalAlpha = selected ? 0.9 : 0.5;
    roundRect(ctx, x, y, CARD_W, 5, CARD_RADIUS);
    ctx.fill();
    ctx.globalAlpha = 1;

    const cx = x + CARD_W / 2;
    const innerW = CARD_W - 16; // usable text width (8px padding each side)

    /* ── Avatar placeholder ── */
    const avatarY = y + 26;
    const avatarSize = 50;
    ctx.shadowColor = char.color;
    ctx.shadowBlur = selected ? 20 : 6;
    ctx.fillStyle = char.color;
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(cx - avatarSize / 2, avatarY, avatarSize, avatarSize);
    ctx.fill();
    ctx.stroke();

    // Direction dot
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + avatarSize / 2 + 5, avatarY + avatarSize / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    /* ── Hero name (large) ── */
    const nameY = avatarY + avatarSize + 20;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = selected ? char.color : 'rgba(220,220,245,0.9)';
    if (selected) {
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillText(char.heroName, cx, nameY);
    ctx.shadowBlur = 0;

    /* ── Divider ── */
    const divY = nameY + 16;
    ctx.strokeStyle = selected ? `${char.color}66` : 'rgba(80,80,120,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 12, divY);
    ctx.lineTo(x + CARD_W - 12, divY);
    ctx.stroke();

    /* ── Weapon name ── */
    const weaponY = divY + 16;
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = selected ? '#ffd700' : 'rgba(200,180,100,0.8)';
    ctx.fillText(char.weaponName, cx, weaponY);

    /* ── Weapon description (pixel-based word-wrap) ── */
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(185,185,210,0.7)';
    const descLines = this.wrapTextPixel(ctx, char.weaponDesc, innerW);
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], cx, weaponY + 18 + i * 13);
    }

    /* ── Tagline at bottom ── */
    ctx.font = '9px monospace';
    ctx.fillStyle = selected ? 'rgba(185,220,255,0.9)' : 'rgba(130,145,185,0.65)';
    ctx.fillText(char.tagline, cx, y + CARD_H - 18);

    ctx.restore();
  }

  /** Word-wrap using actual pixel width measurement */
  private wrapTextPixel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  /* ── Start button ──────────────────────────────────────────── */

  private renderStartButton(ctx: CanvasRenderingContext2D, W: number, cardY: number): void {
    const def = CHARACTERS.find(c => c.id === this.selected)!;
    const btnW = 180;
    const btnH = 44;
    const btnX = W / 2 - btnW / 2;
    const btnY = cardY + CARD_H + 32;

    this.btnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.save();
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = def.accentColor;
    roundRect(ctx, btnX, btnY, btnW, btnH, 10);
    ctx.fill();

    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, btnX, btnY, btnW, btnH, 10);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('▶ НАЧАТЬ БОЙ', W / 2, btnY + btnH / 2);

    ctx.restore();
  }

  /* ── Input handling ────────────────────────────────────────── */

  private handleTap(tapX: number, tapY: number): void {
    for (const b of this.cardBounds) {
      if (tapX >= b.x && tapX <= b.x + b.w && tapY >= b.y && tapY <= b.y + b.h) {
        this.selected = b.id;
        return;
      }
    }
    const { x, y, w, h } = this.btnBounds;
    if (tapX >= x && tapX <= x + w && tapY >= y && tapY <= y + h) {
      this.onStart(this.selected);
    }
  }

  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.handleTap(e.clientX - rect.left, e.clientY - rect.top);
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.handleTap(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
