import { CHARACTERS, type CharacterType, type CharacterDef } from '../config/characterConfig';
import { GAME_CONFIG } from '../config/gameConfig';
import { roundRect } from '../utils/math';
import type { InputManager } from '../core/InputManager';

const CARD_W = 100;
const CARD_H = 148;
const CARD_GAP = 12;
const TOTAL_CARDS_W = CARD_W * 3 + CARD_GAP * 2;

export class CharacterSelectScene {
  private selected: CharacterType = 'theseus';
  private onStart: (c: CharacterType) => void;

  private screenW = 0;
  private screenH = 0;
  private bgOffset = 0;

  /** Bounds for each card (tap detection) */
  private cardBounds: Array<{ x: number; y: number; w: number; h: number; id: CharacterType }> = [];
  /** Bounds for start button */
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
  }

  render(): void {
    const { ctx } = this;
    const W = this.screenW;
    const H = this.screenH;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Background
    this.renderBackground(ctx, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(120,180,255,0.6)';
    ctx.fillText('ПЕТРОСТИГИЯ', W / 2, H * 0.10);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('ВЫБЕРИ ГЕРОЯ', W / 2 + 1, H * 0.18 + 1);
    ctx.fillStyle = '#e8e8ff';
    ctx.fillText('ВЫБЕРИ ГЕРОЯ', W / 2, H * 0.18);

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(150,150,200,0.7)';
    ctx.fillText('Шестеро потомков олимпийских родов', W / 2, H * 0.24);

    // Cards
    this.renderCards(ctx, W, H);

    // Start button
    this.renderStartButton(ctx, W, H);

    // Input render (joystick not needed on select screen but keep for consistency)
    this.input.render(ctx);
  }

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

    // Atmospheric glow in center
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    grad.addColorStop(0, 'rgba(30, 20, 60, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  private renderCards(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    this.cardBounds = [];

    const startX = W / 2 - TOTAL_CARDS_W / 2;
    const cardY = H * 0.30;

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

    // Card background
    ctx.fillStyle = selected ? 'rgba(40,40,70,0.95)' : 'rgba(20,20,40,0.85)';
    roundRect(ctx, x, y, CARD_W, CARD_H, 8);
    ctx.fill();

    // Border
    if (selected) {
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = char.color;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = 'rgba(80,80,120,0.5)';
      ctx.lineWidth = 1;
    }
    roundRect(ctx, x, y, CARD_W, CARD_H, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Color accent bar at top
    ctx.fillStyle = char.color;
    ctx.globalAlpha = selected ? 0.9 : 0.5;
    roundRect(ctx, x, y, CARD_W, 4, 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    const cx = x + CARD_W / 2;

    // Character avatar (colored square — placeholder)
    const avatarY = y + 22;
    const avatarSize = 28;
    ctx.shadowColor = char.color;
    ctx.shadowBlur = selected ? 14 : 4;
    ctx.fillStyle = char.color;
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(cx - avatarSize / 2, avatarY, avatarSize, avatarSize);
    ctx.fill();
    ctx.stroke();

    // Direction dot on avatar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + avatarSize / 2 + 4, avatarY + avatarSize / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Hero name
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 11px monospace`;
    ctx.fillStyle = selected ? char.color : 'rgba(200,200,230,0.85)';
    ctx.fillText(char.heroName, cx, avatarY + avatarSize + 8);

    // Player name
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(150,150,180,0.7)';
    ctx.fillText(char.playerName, cx, avatarY + avatarSize + 22);

    // Weapon name
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = selected ? '#ffd700' : 'rgba(200,180,100,0.7)';
    ctx.fillText(char.weaponName, cx, avatarY + avatarSize + 38);

    // Weapon desc (wrap at ~14 chars)
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(180,180,200,0.6)';
    const desc = char.weaponDesc;
    const line1 = desc.slice(0, 14);
    const line2 = desc.slice(14);
    ctx.fillText(line1, cx, avatarY + avatarSize + 50);
    if (line2) ctx.fillText(line2, cx, avatarY + avatarSize + 61);

    // Tagline
    ctx.font = '7px monospace';
    ctx.fillStyle = selected ? 'rgba(180,220,255,0.9)' : 'rgba(120,140,180,0.6)';
    ctx.fillText(char.tagline, cx, y + CARD_H - 14);

    // Selected checkmark
    if (selected) {
      ctx.fillStyle = char.color;
      ctx.font = 'bold 9px monospace';
      ctx.fillText('▼ ВЫБРАН', cx, y + CARD_H - 5);
    }

    ctx.restore();
  }

  private renderStartButton(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const def = CHARACTERS.find(c => c.id === this.selected)!;
    const btnW = 180;
    const btnH = 44;
    const btnX = W / 2 - btnW / 2;
    const btnY = H * 0.30 + CARD_H + 24;

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
    ctx.fillText(`▶ НАЧАТЬ БОЙ`, W / 2, btnY + btnH / 2);

    ctx.restore();
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private handleTap(tapX: number, tapY: number): void {
    // Check cards
    for (const b of this.cardBounds) {
      if (tapX >= b.x && tapX <= b.x + b.w && tapY >= b.y && tapY <= b.y + b.h) {
        this.selected = b.id;
        return;
      }
    }
    // Check start button
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
