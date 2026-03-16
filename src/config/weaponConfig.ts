// ── Нить Ариадны (Тесей) ────────────────────────────────────────────────────

export interface AriadneLevelData {
  damage: number;
  radius: number;
  cooldown: number;
  arcAngle: number; // degrees — 360 = full circle (always)
}

/** Нить Ариадны — 8 levels. arcAngle = 360° at all levels (full AoE). */
export const ARIADNE_LEVELS: AriadneLevelData[] = [
  { damage: 10, radius: 55,  cooldown: 1.00, arcAngle: 360 },
  { damage: 13, radius: 60,  cooldown: 0.95, arcAngle: 360 },
  { damage: 17, radius: 68,  cooldown: 0.88, arcAngle: 360 },
  { damage: 22, radius: 74,  cooldown: 0.80, arcAngle: 360 },
  { damage: 28, radius: 82,  cooldown: 0.72, arcAngle: 360 },
  { damage: 36, radius: 90,  cooldown: 0.64, arcAngle: 360 },
  { damage: 46, radius: 100, cooldown: 0.55, arcAngle: 360 },
  { damage: 60, radius: 110, cooldown: 0.45, arcAngle: 360 },
];

export const ARIADNE_FLASH_DURATION = 0.18;

// ── Астральный арбалет (Орион) ───────────────────────────────────────────────

export interface CrossbowLevelData {
  boltDamage: number;
  explosionDamage: number;
  cooldown: number;
  boltCount: number;    // how many bolts per shot
  spreadDeg: number;    // spread angle in degrees (0 = single shot)
  explosionRadius: number;
  boltRange: number;    // max travel distance in px
  embedTime: number;    // seconds before explosion after embed
}

export const CROSSBOW_LEVELS: CrossbowLevelData[] = [
  { boltDamage:  8, explosionDamage: 12, cooldown: 1.20, boltCount: 1, spreadDeg:  0, explosionRadius: 45, boltRange: 250, embedTime: 0.8 },
  { boltDamage: 10, explosionDamage: 16, cooldown: 1.10, boltCount: 1, spreadDeg:  0, explosionRadius: 48, boltRange: 260, embedTime: 0.8 },
  { boltDamage: 13, explosionDamage: 20, cooldown: 1.00, boltCount: 2, spreadDeg: 10, explosionRadius: 52, boltRange: 275, embedTime: 0.8 },
  { boltDamage: 16, explosionDamage: 26, cooldown: 0.92, boltCount: 2, spreadDeg: 10, explosionRadius: 56, boltRange: 290, embedTime: 0.8 },
  { boltDamage: 20, explosionDamage: 32, cooldown: 0.84, boltCount: 3, spreadDeg: 15, explosionRadius: 60, boltRange: 310, embedTime: 0.8 },
  { boltDamage: 25, explosionDamage: 40, cooldown: 0.76, boltCount: 3, spreadDeg: 15, explosionRadius: 68, boltRange: 330, embedTime: 0.8 },
  { boltDamage: 32, explosionDamage: 50, cooldown: 0.68, boltCount: 4, spreadDeg: 18, explosionRadius: 76, boltRange: 350, embedTime: 0.8 },
  { boltDamage: 40, explosionDamage: 65, cooldown: 0.58, boltCount: 4, spreadDeg: 18, explosionRadius: 85, boltRange: 380, embedTime: 0.8 },
];

// ── Искра Титана (Прометей) ──────────────────────────────────────────────────

export interface TitanLevelData {
  tongueDamage: number;
  tongueCount: number;     // how many fire tongues per volley
  cooldown: number;        // volley cooldown in seconds
  sphereContactDamage: number; // damage per hit while sphere touches enemy
}

export const TITAN_LEVELS: TitanLevelData[] = [
  { tongueDamage:  7, tongueCount: 1, cooldown: 1.4, sphereContactDamage:  4 },
  { tongueDamage:  9, tongueCount: 1, cooldown: 1.3, sphereContactDamage:  5 },
  { tongueDamage: 12, tongueCount: 2, cooldown: 1.2, sphereContactDamage:  7 },
  { tongueDamage: 15, tongueCount: 2, cooldown: 1.1, sphereContactDamage:  9 },
  { tongueDamage: 19, tongueCount: 3, cooldown: 1.0, sphereContactDamage: 12 },
  { tongueDamage: 24, tongueCount: 3, cooldown: 0.9, sphereContactDamage: 15 },
  { tongueDamage: 30, tongueCount: 4, cooldown: 0.8, sphereContactDamage: 19 },
  { tongueDamage: 38, tongueCount: 5, cooldown: 0.7, sphereContactDamage: 25 },
];

export const TITAN_ORBIT_RADIUS = 38;
export const TITAN_ORBIT_SPEED = 2.2;  // radians/sec
export const TITAN_SPHERE_RADIUS = 10;
export const TITAN_SPHERE_CONTACT_COOLDOWN = 0.5; // seconds between sphere hits on same enemy
export const TITAN_TONGUE_SPEED = 320; // px/s
export const TITAN_TONGUE_MAX_RANGE = 160; // px
