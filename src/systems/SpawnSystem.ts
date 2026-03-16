import { Shadow } from '../entities/enemies/Shadow';
import { RangedEnemy } from '../entities/enemies/RangedEnemy';
import { BomberEnemy } from '../entities/enemies/BomberEnemy';
import type { Enemy } from '../entities/enemies/Enemy';
import { WAVE_CONFIG } from '../config/waveConfig';
import {
  ENEMY_SCALE_INTERVAL,
  ENEMY_HP_SCALE,
  ENEMY_DAMAGE_SCALE,
} from '../config/enemyConfig';

/** Returns 0–1 mix weights for [shadow, ranged, bomber] based on game time */
function getSpawnWeights(gameTime: number): [number, number, number] {
  if (gameTime < 30)  return [1.00, 0.00, 0.00];
  if (gameTime < 60)  return [0.75, 0.25, 0.00];
  if (gameTime < 90)  return [0.55, 0.35, 0.10];
  if (gameTime < 150) return [0.45, 0.35, 0.20];
  return               [0.35, 0.35, 0.30];
}

export class SpawnSystem {
  private spawnAccumulator = 0;

  update(
    dt: number,
    gameTime: number,
    currentCount: number,
    playerX: number,
    playerY: number,
    screenW: number,
    screenH: number
  ): Enemy[] {
    const phase = this.getCurrentPhase(gameTime);
    if (!phase || currentCount >= phase.maxEnemies) return [];

    this.spawnAccumulator += phase.spawnRate * dt;
    const toSpawn = Math.floor(this.spawnAccumulator);
    if (toSpawn < 1) return [];
    this.spawnAccumulator -= toSpawn;

    const scaleGen = Math.floor(gameTime / ENEMY_SCALE_INTERVAL);
    const hpScale  = Math.pow(ENEMY_HP_SCALE, scaleGen);
    const dmgScale = Math.pow(ENEMY_DAMAGE_SCALE, scaleGen);

    const [wShadow, wRanged, wBomber] = getSpawnWeights(gameTime);
    const spawned: Enemy[] = [];
    const remaining = Math.min(toSpawn, phase.maxEnemies - currentCount);

    for (let i = 0; i < remaining; i++) {
      const pos = this.getSpawnPosition(playerX, playerY, screenW, screenH);
      const roll = Math.random();

      if (roll < wShadow) {
        spawned.push(new Shadow(pos.x, pos.y, hpScale, dmgScale));
      } else if (roll < wShadow + wRanged) {
        spawned.push(new RangedEnemy(pos.x, pos.y, hpScale, dmgScale));
      } else if (wBomber > 0) {
        spawned.push(new BomberEnemy(pos.x, pos.y, hpScale, dmgScale));
      } else {
        spawned.push(new Shadow(pos.x, pos.y, hpScale, dmgScale));
      }
    }

    return spawned;
  }

  private getCurrentPhase(gameTime: number) {
    for (const phase of WAVE_CONFIG) {
      if (gameTime >= phase.startTime && gameTime < phase.endTime) return phase;
    }
    return null;
  }

  private getSpawnPosition(
    playerX: number,
    playerY: number,
    screenW: number,
    screenH: number
  ): { x: number; y: number } {
    const spawnDist = Math.sqrt(screenW * screenW + screenH * screenH) / 2 + 60;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: playerX + Math.cos(angle) * spawnDist,
      y: playerY + Math.sin(angle) * spawnDist,
    };
  }
}
