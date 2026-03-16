/**
 * XP needed to advance from level N to N+1.
 * Index 0 = 1→2, index 6 = 7→8.
 */
export const XP_TABLE = [8, 12, 18, 26, 36, 48, 64] as const;

/** Total XP to reach each level */
export const XP_CUMULATIVE = XP_TABLE.reduce<number[]>((acc, val, i) => {
  acc.push((acc[i - 1] ?? 0) + val);
  return acc;
}, []);

export const MAX_WEAPON_LEVEL = 8;
