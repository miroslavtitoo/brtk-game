import type { Enemy } from '../entities/enemies/Enemy';

/** Abstract base for all weapons */
export abstract class BaseWeapon {
  level: number = 1;

  abstract readonly displayName: string;

  abstract update(
    dt: number,
    playerX: number,
    playerY: number,
    facingAngle: number,
    enemies: Enemy[]
  ): void;

  abstract render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void;
}
