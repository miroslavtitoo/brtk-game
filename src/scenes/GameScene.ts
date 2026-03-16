import { Player } from '../entities/Player';
import { XPCrystal } from '../entities/XPCrystal';
import { Chest } from '../entities/Chest';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { Camera } from '../core/Camera';
import { InputManager } from '../core/InputManager';
import { SpawnSystem } from '../systems/SpawnSystem';
import { XPSystem } from '../systems/XPSystem';
import { HUD } from '../ui/HUD';
import { Notification } from '../ui/Notification';
import { GameOverScreen } from '../ui/GameOverScreen';
import { GAME_CONFIG } from '../config/gameConfig';
import { SHADOW_CONFIG, CHEST_SPAWN_INTERVAL, CHEST_MAX_ON_MAP, CHEST_XP_BONUS, BOSS_SPAWN_INTERVAL } from '../config/enemyConfig';
import { MAX_WEAPON_LEVEL } from '../config/xpConfig';
import { type CharacterType } from '../config/characterConfig';
import type { Enemy } from '../entities/enemies/Enemy';
import { RangedEnemy } from '../entities/enemies/RangedEnemy';
import { BomberEnemy } from '../entities/enemies/BomberEnemy';
import { Boss } from '../entities/enemies/Boss';

const BG_TILE = GAME_CONFIG.BG_TILE_SIZE;

export class GameScene {
  private player: Player;
  private enemies: Enemy[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private crystals: XPCrystal[] = [];
  private chests: Chest[] = [];
  private chestTimer = CHEST_SPAWN_INTERVAL * 0.5;
  private bossTimer = BOSS_SPAWN_INTERVAL;
  private bossWave = 1;
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
    private readonly dpr: number,
    private characterType: CharacterType = 'theseus',
    private readonly onBackToMenu?: () => void
  ) {
    this.screenW = canvas.width / dpr;
    this.screenH = canvas.height / dpr;

    this.player = new Player(0, 0, this.characterType);
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

    // Update enemy projectiles
    this.updateEnemyProjectiles(dt);

    // Update chests + spawn logic
    this.updateChests(dt);
    this.chestTimer -= dt;
    if (this.chestTimer <= 0 && this.chests.length < CHEST_MAX_ON_MAP) {
      this.chestTimer = CHEST_SPAWN_INTERVAL;
      this.spawnChest();
    }

    // Boss spawn
    this.bossTimer -= dt;
    if (this.bossTimer <= 0) {
      this.bossTimer = BOSS_SPAWN_INTERVAL;
      this.spawnBoss();
    }

    // Check XP level ups
    while (this.xpSystem.checkLevelUp()) {
      const lvl = this.xpSystem.weaponLevel;
      this.player.triggerInvincibility(1.0);
      const wName = this.player.weaponName.toUpperCase();
      this.pushNotification(`${wName} — УРОВЕНЬ ${lvl}!`, '#ffd700');
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
      this.gameOverScreen.show(
        this.gameTime, this.kills,
        () => this.restart(),            // "Играть снова"
        () => this.onBackToMenu?.()      // "Меню"
      );
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      enemy.update(dt, this.player.x, this.player.y);

      // Harvest projectiles from ranged enemies
      if (enemy instanceof RangedEnemy) {
        for (const p of enemy.drainProjectiles()) this.enemyProjectiles.push(p);
      }

      // Boss shockwave damage
      if (enemy instanceof Boss && enemy.shockwaving) {
        enemy.shockwaving = false;
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const r = enemy.shockwaveRadius + this.player.radius;
        if (dx * dx + dy * dy <= r * r && !this.player.isInvincible()) {
          this.player.takeDamage(enemy.damage * 0.8);
          this.player.triggerInvincibility(0.6);
          this.tryHaptic('impact');
        }
      }

      // Skip if already dead from weapon or self-triggered
      if (!enemy.active) {
        // Bomber explosion: AoE damage to player
        if (enemy instanceof BomberEnemy && enemy.exploding) {
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const r = enemy.explosionRadius + this.player.radius;
          if (dx * dx + dy * dy <= r * r && !this.player.isInvincible()) {
            this.player.takeDamage(enemy.damage);
            this.player.triggerInvincibility(0.5);
            this.tryHaptic('impact');
          }
          // Explosion flash crystal
          this.crystals.push(new XPCrystal(enemy.x, enemy.y, enemy.xpValue));
        } else {
          this.onEnemyDied(enemy);
        }
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

  private updateEnemyProjectiles(dt: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      proj.update(dt);

      if (!proj.isDone && proj.hitsPlayer(this.player.x, this.player.y, this.player.radius)) {
        if (!this.player.isInvincible()) {
          this.player.takeDamage(proj.damage);
          this.player.triggerInvincibility(0.4);
          this.tryHaptic('impact');
        }
        proj.consumed = true;
      }

      if (proj.isDone) this.enemyProjectiles.splice(i, 1);
    }
  }

  private updateChests(dt: number): void {
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const chest = this.chests[i];
      chest.update(dt, this.player.x, this.player.y);
      if (chest.collected) {
        this.chests.splice(i, 1);
        // Force weapon level up, or give big XP if maxed
        if (!this.xpSystem.isMaxLevel) {
          this.xpSystem.addXP(this.xpSystem.xpForNext);
        } else {
          this.xpSystem.addXP(CHEST_XP_BONUS);
        }
        this.pushNotification('СУНДУК! УРОВЕНЬ ОРУЖИЯ +1 ✦', '#ffd700');
        this.tryHaptic('impact');
      }
    }
  }

  private spawnChest(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 220 + Math.random() * 130;
    this.chests.push(new Chest(
      this.player.x + Math.cos(angle) * dist,
      this.player.y + Math.sin(angle) * dist
    ));
  }

  private spawnBoss(): void {
    const spawnDist = Math.sqrt(this.screenW * this.screenW + this.screenH * this.screenH) / 2 + 80;
    const angle = Math.random() * Math.PI * 2;
    const boss = new Boss(
      this.player.x + Math.cos(angle) * spawnDist,
      this.player.y + Math.sin(angle) * spawnDist,
      this.bossWave
    );
    this.enemies.push(boss);
    this.pushNotification(`⚠ ОБОРОТЕНЬ ПОЯВИЛСЯ!`, '#cc44ff');
    this.bossWave++;
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

    // Chests
    for (const ch of this.chests) ch.render(ctx);

    // XP crystals
    for (const c of this.crystals) c.render(ctx);

    // Enemy projectiles
    for (const p of this.enemyProjectiles) p.render(ctx);

    // Enemies (behind player)
    for (const e of this.enemies) e.render(ctx);

    // Player
    this.player.render(ctx);

    ctx.restore();

    // Screen-space UI
    this.hud.render(ctx, W, H, this.player, this.gameTime, this.xpSystem);

    // Notification stack: newest = slot 0 (bottom), older pushed up
    const active = this.notifications.filter(n => n.active);
    for (let i = active.length - 1; i >= 0; i--) {
      const slot = active.length - 1 - i;
      active[i].render(ctx, W, H, slot);
    }

    // Chest arrows — screen-edge indicators
    this.renderChestArrows(ctx, W, H);

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

  private renderChestArrows(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (this.chests.length === 0) return;

    const camX = this.camera.x;
    const camY = this.camera.y;
    const margin = 28; // distance from screen edge

    for (const chest of this.chests) {
      // Chest in screen space
      const sx = chest.x - camX + W / 2;
      const sy = chest.y - camY + H / 2;

      // Only show arrow if chest is off-screen (with margin)
      if (sx >= margin && sx <= W - margin && sy >= margin && sy <= H - margin) continue;

      // Direction from screen center to chest screen pos
      const dx = sx - W / 2;
      const dy = sy - H / 2;
      const angle = Math.atan2(dy, dx);

      // Clamp to screen edge
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scaleX = (W / 2 - margin) / Math.abs(cos || 0.001);
      const scaleY = (H / 2 - margin) / Math.abs(sin || 0.001);
      const scale = Math.min(scaleX, scaleY);
      const ax = W / 2 + cos * scale;
      const ay = H / 2 + sin * scale;

      // Draw gold arrow triangle
      const arrowSize = 10;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(arrowSize, 0);
      ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.55);
      ctx.lineTo(-arrowSize * 0.6,  arrowSize * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
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
    this.enemyProjectiles = [];
    this.crystals = [];
    this.chests = [];
    this.chestTimer = CHEST_SPAWN_INTERVAL * 0.5;
    this.bossTimer = BOSS_SPAWN_INTERVAL;
    this.bossWave = 1;
    this.notifications = [];
    this.gameTime = 0;
    this.kills = 0;
    this.isDead = false;

    this.player = new Player(0, 0, this.characterType);
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
