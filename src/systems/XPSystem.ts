import { XP_TABLE, MAX_WEAPON_LEVEL } from '../config/xpConfig';
import type { BaseWeapon } from '../weapons/Weapon';

export class XPSystem {
  private xp = 0;
  private levelIndex = 0; // 0-based index into XP_TABLE

  constructor(private weapon: BaseWeapon) {}

  get currentXP(): number {
    return this.xp;
  }

  get xpForNext(): number {
    if (this.levelIndex >= XP_TABLE.length) return Infinity;
    return XP_TABLE[this.levelIndex];
  }

  /** Progress 0–1 toward next level */
  get xpProgress(): number {
    if (this.levelIndex >= XP_TABLE.length) return 1;
    return Math.min(1, this.xp / XP_TABLE[this.levelIndex]);
  }

  get weaponLevel(): number {
    return this.weapon.level;
  }

  get isMaxLevel(): boolean {
    return this.weapon.level >= MAX_WEAPON_LEVEL;
  }

  addXP(amount: number): void {
    if (this.isMaxLevel) return;
    this.xp += amount;
  }

  /**
   * Check if we have enough XP to level up.
   * Returns true if a level up occurred.
   */
  checkLevelUp(): boolean {
    if (this.isMaxLevel) return false;
    if (this.levelIndex >= XP_TABLE.length) return false;

    if (this.xp >= XP_TABLE[this.levelIndex]) {
      this.xp -= XP_TABLE[this.levelIndex];
      this.levelIndex++;
      if (this.weapon.level < MAX_WEAPON_LEVEL) {
        this.weapon.level++;
      }
      return true;
    }
    return false;
  }

  reset(): void {
    this.xp = 0;
    this.levelIndex = 0;
    this.weapon.level = 1;
  }
}
