import { Entity } from './Entity';
import { BaseWeapon } from '../weapons/Weapon';
import { AriadneThread } from '../weapons/AriadneThread';
import { AstralCrossbow } from '../weapons/AstralCrossbow';
import { TitanSpark } from '../weapons/TitanSpark';
import { PLAYER_CONFIG } from '../config/playerConfig';
import { getCharacter, type CharacterType } from '../config/characterConfig';
import type { InputManager } from '../core/InputManager';
import type { Enemy } from './enemies/Enemy';

export class Player extends Entity {
  hp: number = PLAYER_CONFIG.HP;
  readonly maxHp: number = PLAYER_CONFIG.HP;
  readonly radius: number = PLAYER_CONFIG.RADIUS;
  readonly speed: number = PLAYER_CONFIG.SPEED;

  readonly characterType: CharacterType;
  readonly color: string;
  readonly accentColor: string;
  readonly weaponName: string;

  weapon: BaseWeapon;

  /** Last movement direction in radians (default: right) */
  facingAngle = 0;

  private invincibleTimer = 0;
  private blinkTimer = 0;
  private blinkVisible = true;
  private levelUpFlashTimer = 0;

  constructor(x: number, y: number, characterType: CharacterType = 'theseus') {
    super(x, y);
    this.characterType = characterType;

    const def = getCharacter(characterType);
    this.color = def.color;
    this.accentColor = def.accentColor;
    this.weaponName = def.weaponName;

    switch (characterType) {
      case 'theseus':    this.weapon = new AriadneThread();  break;
      case 'orion':      this.weapon = new AstralCrossbow(); break;
      case 'prometheus': this.weapon = new TitanSpark();     break;
    }
  }

  update(dt: number, input: InputManager, enemies: Enemy[]): void {
    if (input.magnitude > 0.01) {
      const speed = PLAYER_CONFIG.SPEED * input.magnitude;
      this.x += input.direction.x * speed * dt;
      this.y += input.direction.y * speed * dt;
      this.facingAngle = Math.atan2(input.direction.y, input.direction.x);
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.blinkTimer += dt;
      if (this.blinkTimer >= PLAYER_CONFIG.BLINK_INTERVAL) {
        this.blinkTimer = 0;
        this.blinkVisible = !this.blinkVisible;
      }
    } else {
      this.blinkVisible = true;
    }

    if (this.levelUpFlashTimer > 0) this.levelUpFlashTimer -= dt;

    this.weapon.update(dt, this.x, this.y, this.facingAngle, enemies);
  }

  takeDamage(amount: number): void {
    if (this.invincibleTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
  }

  isInvincible(): boolean {
    return this.invincibleTimer > 0;
  }

  triggerInvincibility(duration: number): void {
    this.invincibleTimer = duration;
    this.blinkTimer = 0;
    this.blinkVisible = true;
    this.levelUpFlashTimer = 0.4;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.blinkVisible) return;

    const s = PLAYER_CONFIG.SPRITE_SIZE;
    const half = s / 2;

    ctx.save();

    if (this.levelUpFlashTimer > 0) {
      const a = this.levelUpFlashTimer / 0.4;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 28 * a;
      ctx.globalAlpha = 0.6 + a * 0.4;
    }

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(this.x - half, this.y - half, s, s);
    ctx.fill();
    ctx.stroke();

    // Direction dot
    const dotX = this.x + Math.cos(this.facingAngle) * (half + 3);
    const dotY = this.y + Math.sin(this.facingAngle) * (half + 3);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();

    this.weapon.render(ctx, this.x, this.y);
  }
}
