export interface AriadneLevelData {
  damage: number;
  radius: number;     // px
  cooldown: number;   // seconds
  arcAngle: number;   // degrees (360 = full circle)
}

/** Нить Ариадны — 8 levels from GDD */
export const ARIADNE_LEVELS: AriadneLevelData[] = [
  { damage: 10, radius: 55,  cooldown: 1.00, arcAngle: 120 },
  { damage: 13, radius: 60,  cooldown: 0.95, arcAngle: 120 },
  { damage: 17, radius: 68,  cooldown: 0.88, arcAngle: 180 },
  { damage: 22, radius: 74,  cooldown: 0.80, arcAngle: 180 },
  { damage: 28, radius: 82,  cooldown: 0.72, arcAngle: 240 },
  { damage: 36, radius: 90,  cooldown: 0.64, arcAngle: 240 },
  { damage: 46, radius: 100, cooldown: 0.55, arcAngle: 300 },
  { damage: 60, radius: 110, cooldown: 0.45, arcAngle: 360 },
];

/** How long the arc flash visual lasts */
export const ARIADNE_FLASH_DURATION = 0.18; // seconds
