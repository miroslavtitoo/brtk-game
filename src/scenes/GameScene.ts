import { Player } from '../entities/Player';
import { XPCrystal } from '../entities/XPCrystal';
import { Camera } from '../core/Camera';
import { InputManager } from '../core/InputManager';
import { SpawnSystem } from '../systems/SpawnSystem';
import { XPSystem } from '../systems/XPSystem';
import { HUD } from '../ui/HUD';
import { Notification } from '../ui/Notification';
import { GameOverScreen } from '../ui/GameOverScreen';
import { GAME_CONFIG } from '../config/gameConfig';
import { SHADOW_CONFIG } from '../config/enemyConfig';
import { MAX_WEAPON_LEVEL } from '../config/xpConfig';
import type { Enemy } from '../entities/enemies/Enemy';

const BG_TILE = GAME_CONFIG.BG_TILE_SIZE;

export class GameScene {
  private player: Player;
  private enemies: Enemy[] = [];
  private crystals: XPCrystal[] = [];
  private notifications: Notification[] = [];

  private camera: Camera;
  private spawnSystem: SpawnSystem;
  private xpSystem: XPSystem;
  private hud: HUD;
  private gameOverScreen: GameOverScreen;

  private gameTime = 0;
  private kills = 0;
  isDead = false;

  /** Screen dimensions in logical pixels (CSS) */
  private screenW: number;
  private screenH: number;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly canvas: HTMLCanvasElement,
    private readonly input: InputManager,
    private readonly dpr: number
  ) {
    this.screenW = canvas.width / dpr;
    this.screenH = canvas.height / dpr;

    this.player = new Player(0, 0);
    this.camera = new Camera(0, 0);
    this.camera.snapTo(0, 0);

    this.spawnSystem = new SpawnSystem();
    this.xpSystem = new XPSystem(this.player.weapon);
    this.hud = new HUD();
    this.gameOverScreen = new GameOverScreen();

    // Register restart taps
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
    this.input.updateScreenSize(h);
  }

  // ── Main update ──────────────────────────────────────────────────────────

  update(dt: number): void {
    if (this.gameOverScreen.visible) {
      this.gameOverScreen.update(dt);
      return;
    }

    this.gameTime += dt;

    // Player movement + weapon
    this.player.update(dt, this.input, this.enemies);

    // Camera follows player
    this.camera.follow(this.player.x, this.player.y, dt);

    // Spawn enemies
    const newEnemies = this.spawnSystem.update(
      dt,
      this.gameTime,
      this.enemies.length,
      this.player.x,
      this.player.y,
      this.screenW,
      this.screenH
    );
    for (const e of newEnemies) this.enemies.push(e);

    // Update enemies + player collision
    this.updateEnemies(dt);

    // Update XP crystals
    this.updateCrystals(dt);

    // Check XP level ups
    while (this.xpSystem.checkLevelUp()) {
      const lvl = this.xpSystem.weaponLevel;
      this.player.triggerInvincibility(1.0);
      this.pushNotification(`НИТЬ АРИАДНЫ — УРОВЕНЬ ${lvl}!`, '#ffd700');
      this.tryHaptic('impact');

      if (lvl >= MAX_WEAPON_LEVEL) {
        this.pushNotification('МАКСИМАЛЬНЫЙ УРОВЕНЬ!', '#ff9900');
      }
    }

    // Update notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].update(dt);
      if (!this.notifications[i].active) this.notifications.splice(i, 1);
    }

    // Death check
    if (this.player.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.tryHaptic('notification');
      this.gameOverScreen.show(this.gameTime, this.kills, () => this.restart());
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      enemy.update(dt, this.player.x, this.player.y);

      // Skip if already dead from weapon
      if (!enemy.active) {
        this.onEnemyDied(enemy);
        this.enemies.splice(i, 1);
        continue;
      }

      // Contact damage (circle vs circle)
      if (this.circlesOverlap(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.radius)) {
        if (enemy.canDamagePlayer() && !this.player.isInvincible()) {
          this.player.takeDamage(enemy.damage);
          enemy.resetDamageCooldown(SHADOW_CONFIG.contactCooldown);
          this.tryHaptic('impact');
        }
      }
    }
  }

  private updateCrystals(dt: number): void {
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      c.update(dt, this.player.x, this.player.y);

      if (c.collected) {
        this.xpSystem.addXP(c.value);
        this.crystals.splice(i, 1);
      }
    }
  }

  private onEnemyDied(enemy: Enemy): void {
    this.kills++;
    // Spawn XP crystal
    this.crystals.push(new XPCrystal(enemy.x, enemy.y, enemy.xpValue));
  }

  // ── Render ───────────────────────────────────────────────────────────────

  render(): void {
    const { ctx } = this;
    const W = this.screenW;
    const H = this.screenH;

    // Reset transform to DPR scale
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Apply camera
    ctx.save();
    ctx.translate(W / 2 - this.camera.x, H / 2 - this.camera.y);

    this.renderBackground(ctx);

    // XP crystals
    for (const c of this.crystals) c.render(ctx);

    // Enemies (behind player)
    for (const e of this.enemies) e.render(ctx);

    // Player
    this.player.render(ctx);

    ctx.restore();

    // Screen-space UI
    this.hud.render(ctx, W, H, this.player, this.gameTime, this.xpSystem);

    for (const n of this.notifications) n.render(ctx, W, H);

    this.input.render(ctx);

    if (this.gameOverScreen.visible) {
      this.gameOverScreen.render(ctx, W, H);
    }
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    const W = this.screenW;
    const H = this.screenH;
    const camX = this.camera.x;
    const camY = this.camera.y;

    const startX = Math.floor((camX - W / 2) / BG_TILE) * BG_TILE;
    const startY = Math.floor((camY - H / 2) / BG_TILE) * BG_TILE;
    const endX = startX + W + BG_TILE * 2;
    const endY = startY + H + BG_TILE * 2;

    // Base fill
    ctx.fillStyle = '#13132a';
    ctx.fillRect(startX, startY, endX - startX, endY - startY);

    // Grid lines — subtle cobblestone
    ctx.strokeStyle = '#1c1c3a';
    ctx.lineWidth = 0.5;

    for (let x = startX; x <= endX; x += BG_TILE) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += BG_TILE) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Subtle random "cracks" — deterministic per tile
    for (let tx = Math.floor(startX / BG_TILE); tx * BG_TILE <= endX; tx++) {
      for (let ty = Math.floor(startY / BG_TILE); ty * BG_TILE <= endY; ty++) {
        const seed = ((tx * 2341 + ty * 9871) & 0xffff);
        if (seed % 7 === 0) {
          const ox = tx * BG_TILE + (seed % BG_TILE);
          const oy = ty * BG_TILE + ((seed >> 4) % BG_TILE);
          ctx.fillStyle = '#1e1e3e';
          ctx.fillRect(ox, oy, 3 + (seed % 5), 1);
        }
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private circlesOverlap(
    ax: number, ay: number, ar: number,
    bx: number, by: number, br: number
  ): boolean {
    const dx = ax - bx;
    const dy = ay - by;
    const minDist = ar + br;
    return dx * dx + dy * dy <= minDist * minDist;
  }

  private pushNotification(text: string, color: string = '#ffd700'): void {
    this.notifications.push(new Notification(text, 2.0, color));
  }

  private tryHaptic(type: 'impact' | 'notification'): void {
    try {
      const tg = (window as unknown as Record<string, unknown>).Telegram as {
        WebApp?: { HapticFeedback?: {
          impactOccurred?: (style: string) => void;
          notificationOccurred?: (type: string) => void;
        }};
      } | undefined;
      const hf = tg?.WebApp?.HapticFeedback;
      if (!hf) return;
      if (type === 'impact') hf.impactOccurred?.('light');
      if (type === 'notification') hf.notificationOccurred?.('error');
    } catch {
      // ignore
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  private restart(): void {
    this.enemies = [];
    this.crystals = [];
    this.notifications = [];
    this.gameTime = 0;
    this.kills = 0;
    this.isDead = false;

    this.player = new Player(0, 0);
    this.camera.snapTo(0, 0);
    this.spawnSystem = new SpawnSystem();
    this.xpSystem = new XPSystem(this.player.weapon);
    this.gameOverScreen.hide();
  }

  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.gameOverScreen.handleTap(e.clientX - rect.left, e.clientY - rect.top);
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.gameOverScreen.visible) return;
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const handled = this.gameOverScreen.handleTap(
      touch.clientX - rect.left,
      touch.clientY - rect.top
    );
    if (handled) e.preventDefault();
  };

  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
