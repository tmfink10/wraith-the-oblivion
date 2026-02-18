import { rollOblivionDie } from '../dice.js';
import { SCENE_ACTIVITIES, SCENE_FOCUSES } from '../../data/scene-tables.js';
import type { OblivionDieResult } from '../../types/dice.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface SceneGenerationResult {
  /** The activity word from the 100-entry table */
  activity: string;
  /** The focus word from the 100-entry table */
  focus: string;
  /** The 2d10 roll used to pick activity (tens + ones → index 1-100) */
  activityRoll: { tens: number; ones: number; index: number };
  /** The 2d10 roll used to pick focus (tens + ones → index 1-100) */
  focusRoll: { tens: number; ones: number; index: number };
  /** Oblivion Die result rolled alongside scene generation */
  oblivionDie: OblivionDieResult;
  /** Combined two-word prompt */
  prompt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function defaultRng(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Convert 2d10 to a 1-100 index using standard percentile convention.
 * tens=10 → 0 (tens digit), ones=10 → 0 (ones digit)
 * 00 + 0 = 100 (not 0).
 */
function rollTableIndex(rng: () => number): {
  tens: number;
  ones: number;
  index: number;
} {
  const tens = rng(); // 1-10
  const ones = rng(); // 1-10

  const tensDigit = tens === 10 ? 0 : tens;
  const onesDigit = ones === 10 ? 0 : ones;
  let index = tensDigit * 10 + onesDigit;
  if (index === 0) index = 100;

  return { tens, ones, index };
}

// ─── Functions ─────────────────────────────────────────────────────

/**
 * Generate a scene prompt by rolling on Activity and Focus tables.
 * Rolls: 2d10 (activity) + 2d10 (focus) + 1d10 (Oblivion Die) = 5 dice total.
 */
export function generateScene(rng?: () => number): SceneGenerationResult {
  const roll = rng ?? defaultRng;

  const activityRoll = rollTableIndex(roll);
  const focusRoll = rollTableIndex(roll);
  const oblivionDie = rollOblivionDie(roll);

  // Tables are 0-indexed arrays; rolls produce 1-100
  const actIdx = Math.min(
    activityRoll.index - 1,
    SCENE_ACTIVITIES.length - 1,
  );
  const focIdx = Math.min(focusRoll.index - 1, SCENE_FOCUSES.length - 1);

  const activity = SCENE_ACTIVITIES[actIdx] ?? 'Unknown';
  const focus = SCENE_FOCUSES[focIdx] ?? 'Unknown';

  return {
    activity,
    focus,
    activityRoll,
    focusRoll,
    oblivionDie,
    prompt: `${activity} ${focus}`,
  };
}
