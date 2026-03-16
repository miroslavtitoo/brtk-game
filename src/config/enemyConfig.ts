export interface EnemyStats {
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  spriteSize: number;
  color: string;
  xpValue: number;
  goldChance: number;
  contactCooldown: number;
}

// ── Тень (Shadow) — базовый ближний моб ──────────────────────────────────────
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

// ── Стрелец — дальний боец, держит дистанцию и стреляет ─────────────────────
export const RANGED_CONFIG: EnemyStats = {
  hp: 18,
  speed: 42,
  damage: 9,      // projectile damage
  radius: 7,
  spriteSize: 13,
  color: '#8b1515',
  xpValue: 2,
  goldChance: 0.5,
  contactCooldown: 1.0,
};
export const RANGED_MIN_DIST = 130;       // stays at least this far from player (px)
export const RANGED_MAX_DIST = 200;       // approaches if farther than this
export const RANGED_FIRE_COOLDOWN = 2.4;  // seconds between shots
export const RANGED_PROJ_SPEED = 155;     // px/s
export const RANGED_PROJ_LIFETIME = 4.0;  // seconds before despawn

// ── Бомбардир — бегёт к игроку и взрывается ──────────────────────────────────
export const BOMBER_CONFIG: EnemyStats = {
  hp: 9,
  speed: 78,       // faster than Shadow
  damage: 22,      // explosion damage
  radius: 8,
  spriteSize: 15,
  color: '#cc5500',
  xpValue: 3,
  goldChance: 0.7,
  contactCooldown: 999, // never does contact damage — only explosion
};
export const BOMBER_TRIGGER_RANGE = 80;    // px — triggers explosion
export const BOMBER_EXPLOSION_RADIUS = 100; // px — AoE damage radius

// ── Scaling ───────────────────────────────────────────────────────────────────
export const ENEMY_SCALE_INTERVAL = 60;
export const ENEMY_HP_SCALE = 1.2;
export const ENEMY_DAMAGE_SCALE = 1.1;

// ── Chest ─────────────────────────────────────────────────────────────────────
export const CHEST_SPAWN_INTERVAL = 80;  // seconds between chests
export const CHEST_MAX_ON_MAP = 2;
export const CHEST_XP_BONUS = 60;        // large XP drop if weapon already maxed
