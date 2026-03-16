import { lerp } from '../utils/math';

export class Camera {
  x: number;
  y: number;

  /** Smoothing factor — 0 = instant follow, 1 = never moves */
  private readonly SMOOTH = 0.12;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /** Smoothly follow a target position */
  follow(targetX: number, targetY: number, _dt: number): void {
    this.x = lerp(this.x, targetX, 1 - this.SMOOTH);
    this.y = lerp(this.y, targetY, 1 - this.SMOOTH);
  }

  /** Snap immediately to position (used on scene start) */
  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
