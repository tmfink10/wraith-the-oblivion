import { rollNpcPowerLevel } from '../dice.js';
import { SCENE_ACTIVITIES, SCENE_FOCUSES } from '../../data/scene-tables.js';
import type { NpcPowerLevel } from '../../types/solo.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface GeneratedNpc {
  /** Power level details */
  powerLevel: NpcPowerLevel;
  /** The raw d10 roll */
  roll: number;
  /** A random descriptor pulled from scene tables for inspiration */
  descriptor: string;
  /** A random motivation pulled from scene tables for inspiration */
  motivation: string;
}

// ─── Constants ─────────────────────────────────────────────────────

const EXPERTISE_DIFFICULTY: Record<string, number> = {
  much_weaker: 4,
  slightly_weaker: 5,
  similar: 6,
  slightly_stronger: 7,
  much_stronger: 8,
};

const WEAKNESS_DIFFICULTY: Record<string, number> = {
  much_weaker: 3,
  slightly_weaker: 4,
  similar: 5,
  slightly_stronger: 5,
  much_stronger: 6,
};

// ─── Functions ─────────────────────────────────────────────────────

function defaultRng(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Generate a full NPC with power level and narrative hooks.
 * Uses random activity as a descriptor and random focus as a motivation
 * to spark narrative inspiration.
 */
export function generateNpc(rng?: () => number): GeneratedNpc {
  const roll = rng ?? defaultRng;

  const rawResult = rollNpcPowerLevel(roll);

  // Pick random descriptor/motivation from scene tables for narrative flavor
  const descriptorIdx = roll() - 1;
  const motivationIdx = roll() - 1;

  const descriptor =
    SCENE_ACTIVITIES[Math.abs(descriptorIdx) % SCENE_ACTIVITIES.length] ??
    'Mysterious';
  const motivation =
    SCENE_FOCUSES[Math.abs(motivationIdx) % SCENE_FOCUSES.length] ?? 'Unknown';

  const powerLevel: NpcPowerLevel = {
    level: rawResult.level as NpcPowerLevel['level'],
    dicePool: rawResult.dicePool,
    willpower: rawResult.willpower,
    expertiseDifficulty: EXPERTISE_DIFFICULTY[rawResult.level] ?? 6,
    weaknessDifficulty: WEAKNESS_DIFFICULTY[rawResult.level] ?? 5,
  };

  return {
    powerLevel,
    roll: rawResult.roll,
    descriptor,
    motivation,
  };
}

/**
 * Get human-readable label for an NPC power level.
 */
export function describeNpcPowerLevel(
  level: NpcPowerLevel['level'],
): string {
  const labels: Record<string, string> = {
    much_weaker: 'Much Weaker (Drone)',
    slightly_weaker: 'Slightly Weaker (Grunt)',
    similar: 'Similar Power (Rival)',
    slightly_stronger: 'Slightly Stronger (Veteran)',
    much_stronger: 'Much Stronger (Elder)',
  };
  return labels[level] ?? level;
}
