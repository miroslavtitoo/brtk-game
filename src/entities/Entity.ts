/** Base class for all game objects */
export abstract class Entity {
  x: number;
  y: number;
  active: boolean = true;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  abstract update(dt: number, ...args: unknown[]): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}
