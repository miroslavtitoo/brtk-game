export interface WavePhase {
  startTime: number;    // seconds
  endTime: number;      // seconds
  spawnRate: number;    // enemies per second
  shadowRatio: number;  // 0-1 (fraction of spawns that are shadows; rest = mushrooms later)
  maxEnemies: number;
}

export const WAVE_CONFIG: WavePhase[] = [
  { startTime: 0,   endTime: 30,  spawnRate: 1.5, shadowRatio: 1.0, maxEnemies: 30 },
  { startTime: 30,  endTime: 60,  spawnRate: 2.0, shadowRatio: 0.7, maxEnemies: 50 },
  { startTime: 60,  endTime: 90,  spawnRate: 2.5, shadowRatio: 0.6, maxEnemies: 60 },
  { startTime: 90,  endTime: 120, spawnRate: 3.0, shadowRatio: 0.5, maxEnemies: 70 },
  { startTime: 120, endTime: 180, spawnRate: 3.5, shadowRatio: 0.4, maxEnemies: 80 },
  { startTime: 180, endTime: 210, spawnRate: 4.0, shadowRatio: 0.3, maxEnemies: 90 },
  { startTime: 210, endTime: 9999, spawnRate: 2.0, shadowRatio: 0.3, maxEnemies: 50 },
];
