import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameScene } from './scenes/GameScene';
import { InputManager } from './core/InputManager';
import { GAME_CONFIG } from './config/gameConfig';
import type { CharacterType } from './config/characterConfig';

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

// ── Canvas setup ─────────────────────────────────────────────────────────────
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
  currentScene?.resize(W, H);
  input?.updateScreenSize(H);
}

// ── Scene management ──────────────────────────────────────────────────────────

const input = new InputManager(canvas);

interface Scene {
  update(dt: number): void;
  render(): void;
  resize(w: number, h: number): void;
  destroy(): void;
}

let currentScene: Scene | null = null;

function switchToCharacterSelect(): void {
  currentScene?.destroy();

  const charSelect = new CharacterSelectScene(
    ctx, canvas, input, dpr,
    (character: CharacterType) => switchToGame(character)
  );
  charSelect.resize(window.innerWidth, window.innerHeight);
  currentScene = charSelect;
}

function switchToGame(character: CharacterType): void {
  currentScene?.destroy();

  const game = new GameScene(
    ctx, canvas, input, dpr, character,
    () => switchToCharacterSelect()   // "back to menu" on game over
  );
  game.resize(window.innerWidth, window.innerHeight);
  currentScene = game;
}

// ── Game loop (fixed timestep) ────────────────────────────────────────────────

const FIXED_STEP = GAME_CONFIG.FIXED_STEP;
const MAX_DELTA = GAME_CONFIG.MAX_DELTA;

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp: number): void {
  const rawDt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const dt = Math.min(rawDt, MAX_DELTA);
  accumulator += dt;

  while (accumulator >= FIXED_STEP) {
    currentScene!.update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  currentScene!.render();

  requestAnimationFrame(gameLoop);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

resizeCanvas();
switchToCharacterSelect();

lastTime = performance.now();
accumulator = 0;
requestAnimationFrame(gameLoop);

window.addEventListener('resize', () => resizeCanvas());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());
