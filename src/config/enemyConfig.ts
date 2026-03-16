export interface EnemyStats {
  hp: number;
  speed: number;      // px/s
  damage: number;
  radius: number;     // collision radius
  spriteSize: number; // visual size
  color: string;
  xpValue: number;
  goldChance: number; // 0-1
  contactCooldown: number; // seconds between contact damage
}

export const SHADOW_CONFIG: EnemyStats = {
  hp: 12,
  speed: 55,
  damage: 6,
  radius: 6,
  spriteSize: 12,
  color: 'rgba(80, 0, 120, 0.9)',
  xpValue: 1,
  goldChance: 0.6,
  contactCooldown: 1.0,
};

/** HP/damage scale per 60-second interval */
export const ENEMY_SCALE_INTERVAL = 60;  // seconds
export const ENEMY_HP_SCALE = 1.2;
export const ENEMY_DAMAGE_SCALE = 1.1;
