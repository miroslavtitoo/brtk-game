export const PLAYER_CONFIG = {
  HP: 80,
  SPEED: 110,             // px/s
  RADIUS: 8,              // collision radius (px)
  SPRITE_SIZE: 16,        // visual size
  COLOR: '#5B8DD9',       // blue (placeholder)
  OUTLINE_COLOR: '#3a6cb5',
  INVINCIBILITY_ON_LEVELUP: 1.0,  // seconds of invincibility after weapon level up
  BLINK_INTERVAL: 0.1,            // blink interval while invincible
} as const;
