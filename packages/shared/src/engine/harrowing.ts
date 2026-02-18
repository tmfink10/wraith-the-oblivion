import { rollPool, resistedRoll } from './dice.js';
import { getCatharsisDifficulty, type CatharsisTriggerType } from './shadow.js';
import type { DiceRollResult, ResistedRollResult } from '../types/dice.js';

// ─── Harrowing Types ───────────────────────────────────────────────

export type HarrowingOutcome =
  | 'escape'        // Psyche wins — wraith escapes the Harrowing
  | 'shadow_gains'  // Shadow wins — gains permanent Angst or a Thorn
  | 'catharsis'     // Wraith achieves catharsis — loses Angst, strengthened
  | 'destruction';  // Total Shadow victory — wraith is destroyed (Oblivion)

export interface HarrowingChallenge {
  psycheRoll: DiceRollResult;
  shadowRoll: DiceRollResult;
  winner: 'psyche' | 'shadow' | 'tie';
  netSuccesses: number;
}

export interface HarrowingState {
  triggers: CatharsisTriggerType;
  challenges: HarrowingChallenge[];
  psycheWins: number;
  shadowWins: number;
  totalChallenges: number;
  maxChallenges: number;
  isComplete: boolean;
  outcome: HarrowingOutcome | null;
}

// ─── Harrowing Trigger ─────────────────────────────────────────────

/**
 * Check if a Harrowing is triggered.
 * The wraith rolls Willpower vs the catharsis difficulty for the trigger type.
 * Failure = enter Harrowing.
 */
export function checkHarrowingTrigger(
  trigger: CatharsisTriggerType,
  willpowerPool: number,
  rng?: () => number,
): {
  triggered: boolean;
  roll: DiceRollResult;
  difficulty: number;
} {
  const difficulty = getCatharsisDifficulty(trigger);
  const roll = rollPool(willpowerPool, difficulty, false, rng);

  return {
    triggered: roll.successes === 0 || roll.isBotch,
    roll,
    difficulty,
  };
}

// ─── Harrowing State ───────────────────────────────────────────────

/**
 * Create a new Harrowing state.
 * Standard Harrowing has 3 challenges by default.
 */
export function createHarrowingState(
  trigger: CatharsisTriggerType,
  maxChallenges: number = 3,
): HarrowingState {
  return {
    triggers: trigger,
    challenges: [],
    psycheWins: 0,
    shadowWins: 0,
    totalChallenges: 0,
    maxChallenges,
    isComplete: false,
    outcome: null,
  };
}

// ─── Challenge Resolution ──────────────────────────────────────────

/**
 * Resolve a single Harrowing challenge.
 * Psyche (the wraith's true self) and Shadow roll opposing pools.
 * Difficulty is based on the trigger type.
 */
export function resolveHarrowingChallenge(
  psychePool: number,
  shadowPool: number,
  difficulty: number = 6,
  rng?: () => number,
): HarrowingChallenge {
  const psycheRoll = rollPool(psychePool, difficulty, false, rng);
  const shadowRoll = rollPool(shadowPool, difficulty, false, rng);

  const netSuccesses = psycheRoll.successes - shadowRoll.successes;

  let winner: 'psyche' | 'shadow' | 'tie';
  if (netSuccesses > 0) winner = 'psyche';
  else if (netSuccesses < 0) winner = 'shadow';
  else winner = 'tie';

  return {
    psycheRoll,
    shadowRoll,
    winner,
    netSuccesses,
  };
}

/**
 * Advance the Harrowing by resolving the next challenge.
 * Updates the state with challenge results.
 */
export function advanceHarrowing(
  state: HarrowingState,
  psychePool: number,
  shadowPool: number,
  difficulty: number = 6,
  rng?: () => number,
): HarrowingState {
  if (state.isComplete) return state;

  const challenge = resolveHarrowingChallenge(
    psychePool,
    shadowPool,
    difficulty,
    rng,
  );

  const newState: HarrowingState = {
    ...state,
    challenges: [...state.challenges, challenge],
    psycheWins: state.psycheWins + (challenge.winner === 'psyche' ? 1 : 0),
    shadowWins: state.shadowWins + (challenge.winner === 'shadow' ? 1 : 0),
    totalChallenges: state.totalChallenges + 1,
  };

  // Check if Harrowing is complete
  if (newState.totalChallenges >= newState.maxChallenges) {
    return resolveHarrowing(newState);
  }

  return newState;
}

// ─── Harrowing Resolution ──────────────────────────────────────────

/**
 * Determine the outcome of a completed Harrowing.
 *
 * - Psyche wins majority → 'escape' (or 'catharsis' if dominant)
 * - Shadow wins majority → 'shadow_gains' (or 'destruction' if dominant)
 * - Tie → 'escape' (wraith narrowly survives)
 *
 * "Dominant" = winning ALL challenges.
 */
export function resolveHarrowing(state: HarrowingState): HarrowingState {
  let outcome: HarrowingOutcome;

  if (state.psycheWins > state.shadowWins) {
    // Psyche won majority
    if (state.psycheWins === state.maxChallenges) {
      outcome = 'catharsis'; // Total Psyche victory — catharsis achieved
    } else {
      outcome = 'escape';
    }
  } else if (state.shadowWins > state.psycheWins) {
    // Shadow won majority
    if (state.shadowWins === state.maxChallenges) {
      outcome = 'destruction'; // Total Shadow victory — Oblivion
    } else {
      outcome = 'shadow_gains';
    }
  } else {
    // Tie — wraith narrowly escapes
    outcome = 'escape';
  }

  return {
    ...state,
    isComplete: true,
    outcome,
  };
}

/**
 * Get a narrative description of the Harrowing outcome.
 */
export function getHarrowingOutcomeDescription(outcome: HarrowingOutcome): string {
  switch (outcome) {
    case 'escape':
      return 'The wraith survives the Harrowing, emerging shaken but intact. The Shadow retreats, for now.';
    case 'shadow_gains':
      return 'The Shadow emerges stronger from the Harrowing. It gains permanent Angst or a new Thorn.';
    case 'catharsis':
      return 'The wraith achieves Catharsis! Through sheer force of will, the Psyche dominates the Shadow completely. Permanent Angst is reduced.';
    case 'destruction':
      return 'The Shadow wins completely. The wraith is consumed by Oblivion and ceases to exist.';
  }
}

/**
 * Apply Harrowing outcome effects.
 * Returns the mechanical changes that should be applied to the character.
 */
export function getHarrowingEffects(outcome: HarrowingOutcome): {
  angstChange: number;      // positive = gain, negative = lose
  thornGained: boolean;
  destroyed: boolean;
  willpowerRestored: boolean;
} {
  switch (outcome) {
    case 'escape':
      return { angstChange: 0, thornGained: false, destroyed: false, willpowerRestored: false };
    case 'shadow_gains':
      return { angstChange: 1, thornGained: true, destroyed: false, willpowerRestored: false };
    case 'catharsis':
      return { angstChange: -1, thornGained: false, destroyed: false, willpowerRestored: true };
    case 'destruction':
      return { angstChange: 0, thornGained: false, destroyed: true, willpowerRestored: false };
  }
}
