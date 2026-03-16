export const GAME_CONFIG = {
  FIXED_STEP: 1 / 60,        // Fixed update timestep (60 fps)
  MAX_DELTA: 0.1,             // Max delta cap (prevents spiral of death)
  MAX_PIXEL_RATIO: 2,         // Cap DPR for performance
  BG_TILE_SIZE: 32,           // Background tile size
  SPAWN_MARGIN: 80,           // Extra margin beyond screen edge for spawning
} as const;
