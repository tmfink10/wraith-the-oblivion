import { checkRandomSceneTrigger, rollRandomScene } from '../dice.js';
import { RANDOM_SCENE_TABLE } from '../../data/scene-tables.js';
import type { RandomSceneType } from '../../types/solo.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface RandomSceneCheckResult {
  /** The d10 trigger roll */
  triggerRoll: number;
  /** The halved value compared against angst */
  halvedValue: number;
  /** Whether the random scene was triggered */
  triggered: boolean;
  /** The random scene details, only present if triggered */
  scene?: {
    roll: number;
    type: RandomSceneType;
    label: string;
  };
}

// ─── Functions ─────────────────────────────────────────────────────

/**
 * Perform the end-of-scene random scene check.
 * 1. Roll 1d10, halve (round down).
 * 2. If result ≤ temporaryAngst (and angst > 0), a random scene triggers.
 * 3. If triggered, roll on the random scene table (1d10).
 */
export function checkForRandomScene(
  temporaryAngst: number,
  rng?: () => number,
): RandomSceneCheckResult {
  const triggerResult = checkRandomSceneTrigger(temporaryAngst, rng);

  if (!triggerResult.triggered) {
    return {
      triggerRoll: triggerResult.roll,
      halvedValue: triggerResult.halved,
      triggered: false,
    };
  }

  // Scene triggered — roll on the table
  const sceneRoll = rollRandomScene(rng);
  const tableEntry = RANDOM_SCENE_TABLE.find((e) => e.roll === sceneRoll);

  return {
    triggerRoll: triggerResult.roll,
    halvedValue: triggerResult.halved,
    triggered: true,
    scene: tableEntry
      ? {
          roll: sceneRoll,
          type: tableEntry.type as RandomSceneType,
          label: tableEntry.label,
        }
      : {
          roll: sceneRoll,
          type: 'work_towards_passion' as RandomSceneType,
          label: 'Unknown Scene',
        },
  };
}
