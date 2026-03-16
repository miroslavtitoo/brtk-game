import { Shadow } from '../entities/enemies/Shadow';
import type { Enemy } from '../entities/enemies/Enemy';
import { WAVE_CONFIG } from '../config/waveConfig';
import {
  ENEMY_SCALE_INTERVAL,
  ENEMY_HP_SCALE,
  ENEMY_DAMAGE_SCALE,
} from '../config/enemyConfig';

export class SpawnSystem {
  private spawnAccumulator = 0;

  /** Update spawner. Returns newly spawned enemies. */
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
    const hpScale = Math.pow(ENEMY_HP_SCALE, scaleGen);
    const dmgScale = Math.pow(ENEMY_DAMAGE_SCALE, scaleGen);

    const spawned: Enemy[] = [];
    const remaining = Math.min(toSpawn, phase.maxEnemies - currentCount);

    for (let i = 0; i < remaining; i++) {
      const pos = this.getSpawnPosition(playerX, playerY, screenW, screenH);
      // Phase 1: only shadows. Future: check phase.shadowRatio for mushrooms
      spawned.push(new Shadow(pos.x, pos.y, hpScale, dmgScale));
    }

    return spawned;
  }

  private getCurrentPhase(gameTime: number) {
    for (const phase of WAVE_CONFIG) {
      if (gameTime >= phase.startTime && gameTime < phase.endTime) {
        return phase;
      }
    }
    return null;
  }

  /** Spawn just outside the visible screen area at a random angle */
  private getSpawnPosition(
    playerX: number,
    playerY: number,
    screenW: number,
    screenH: number
  ): { x: number; y: number } {
    // Spawn outside the screen diagonal + margin
    const spawnDist = Math.sqrt(screenW * screenW + screenH * screenH) / 2 + 60;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: playerX + Math.cos(angle) * spawnDist,
      y: playerY + Math.sin(angle) * spawnDist,
    };
  }
}
