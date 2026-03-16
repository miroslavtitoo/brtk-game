import { Vector2 } from '../utils/Vector2';

const DEAD_ZONE = 8;
const MAX_RADIUS = 50;
const KNOB_RADIUS = 20;
const OUTER_RADIUS = 50;

export class InputManager {
  /** Normalized direction vector; (0,0) = not moving */
  readonly direction = new Vector2(0, 0);
  /** 0–1 movement intensity */
  magnitude = 0;

  joystickActive = false;
  joystickCenterX = 0;
  joystickCenterY = 0;
  joystickKnobX = 0;
  joystickKnobY = 0;

  private activeTouchId: number | null = null;
  private screenH = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.screenH = canvas.clientHeight;

    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    // Mouse fallback for desktop development
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  updateScreenSize(h: number): void {
    this.screenH = h;
  }

  // ── Touch ─────────────────────────────────────────────────────────────────

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.activeTouchId !== null) return;

    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    if (y < this.screenH / 2) return; // only bottom half

    this.activeTouchId = touch.identifier;
    this.activateJoystick(touch.clientX - rect.left, y);
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== this.activeTouchId) continue;
      const rect = this.canvas.getBoundingClientRect();
      this.moveJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
      break;
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId) {
        this.deactivateJoystick();
        break;
      }
    }
  };

  // ── Mouse fallback ────────────────────────────────────────────────────────

  private mouseDown = false;

  private onMouseDown = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < this.screenH / 2) return;

    this.mouseDown = true;
    this.activateJoystick(e.clientX - rect.left, y);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.mouseDown) return;
    const rect = this.canvas.getBoundingClientRect();
    this.moveJoystick(e.clientX - rect.left, e.clientY - rect.top);
  };

  private onMouseUp = (): void => {
    if (this.mouseDown) {
      this.mouseDown = false;
      this.deactivateJoystick();
    }
  };

  // ── Core joystick logic ───────────────────────────────────────────────────

  private activateJoystick(x: number, y: number): void {
    this.joystickActive = true;
    this.joystickCenterX = x;
    this.joystickCenterY = y;
    this.joystickKnobX = x;
    this.joystickKnobY = y;
    this.direction.set(0, 0);
    this.magnitude = 0;
  }

  private moveJoystick(x: number, y: number): void {
    const dx = x - this.joystickCenterX;
    const dy = y - this.joystickCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < DEAD_ZONE) {
      this.direction.set(0, 0);
      this.magnitude = 0;
      this.joystickKnobX = x;
      this.joystickKnobY = y;
      return;
    }

    const clamped = Math.min(dist, MAX_RADIUS);
    this.magnitude = clamped / MAX_RADIUS;
    this.direction.set(dx / dist, dy / dist);
    this.joystickKnobX = this.joystickCenterX + this.direction.x * clamped;
    this.joystickKnobY = this.joystickCenterY + this.direction.y * clamped;
  }

  private deactivateJoystick(): void {
    this.activeTouchId = null;
    this.joystickActive = false;
    this.direction.set(0, 0);
    this.magnitude = 0;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.joystickActive) return;

    ctx.save();
    ctx.globalAlpha = 0.5;

    // Outer ring
    ctx.beginPath();
    ctx.arc(this.joystickCenterX, this.joystickCenterY, OUTER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    // Knob
    ctx.beginPath();
    ctx.arc(this.joystickKnobX, this.joystickKnobY, KNOB_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  destroy(): void {
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
