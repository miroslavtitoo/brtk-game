import { GameScene } from './scenes/GameScene';
import { InputManager } from './core/InputManager';
import { GAME_CONFIG } from './config/gameConfig';

// ── Telegram WebApp init ────────────────────────────────────────────────────
try {
  const tg = (window as unknown as Record<string, unknown>).Telegram as {
    WebApp?: { ready?: () => void; expand?: () => void };
  } | undefined;
  tg?.WebApp?.ready?.();
  tg?.WebApp?.expand?.();
} catch {
  // Not in Telegram — running standalone (dev mode)
}

// ── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const dpr = Math.min(window.devicePixelRatio || 1, GAME_CONFIG.MAX_PIXEL_RATIO);

function resizeCanvas(): void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.imageSmoothingEnabled = false;
  scene?.resize(W, H);
  input?.updateScreenSize(H);
}

// ── Game objects ─────────────────────────────────────────────────────────────
const input = new InputManager(canvas);
let scene: GameScene | null = null;

function createScene(): GameScene {
  return new GameScene(ctx, canvas, input, dpr);
}

// ── Game loop (fixed timestep) ───────────────────────────────────────────────
const FIXED_STEP = GAME_CONFIG.FIXED_STEP;
const MAX_DELTA = GAME_CONFIG.MAX_DELTA;

let lastTime = 0;
let accumulator = 0;
let animFrameId = 0;

function gameLoop(timestamp: number): void {
  const rawDt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Clamp to avoid spiral of death on tab unfocus
  const dt = Math.min(rawDt, MAX_DELTA);
  accumulator += dt;

  while (accumulator >= FIXED_STEP) {
    scene!.update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  scene!.render();

  animFrameId = requestAnimationFrame(gameLoop);
}

function start(): void {
  resizeCanvas();
  scene = createScene();
  lastTime = performance.now();
  accumulator = 0;
  animFrameId = requestAnimationFrame(gameLoop);
}

// ── Resize handler ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  resizeCanvas();
});

// Prevent default touch behaviours (scroll, zoom)
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Kick off ──────────────────────────────────────────────────────────────────
start();
