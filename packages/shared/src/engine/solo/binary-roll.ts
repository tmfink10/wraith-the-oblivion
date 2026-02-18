import type { BinaryRollResult, BinaryOutcome, OblivionDieResult } from '../../types/dice.js';
import { binaryRoll, rollOblivionDie } from '../dice.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface BinaryRollWithOblivionResult {
  /** The final resolved binary roll (after any tie rerolls) */
  binaryRoll: BinaryRollResult;
  /** The Oblivion Die rolled alongside (rolled once with the first binary roll) */
  oblivionDie: OblivionDieResult;
  /** All intermediate tie-reroll attempts (empty if no ties) */
  tieHistory: BinaryRollResult[];
  /** True if two consecutive ties occurred (unexpected outcome) */
  isDoubleTie: boolean;
}

// ─── Functions ─────────────────────────────────────────────────────

/**
 * Perform a full THD Binary Roll: 2d10 (positive + negative) + 1d10 (Oblivion Die).
 * Automatically handles tie-rerolling:
 *  - First tie: reroll the binary dice (Oblivion Die stays from first roll)
 *  - Second consecutive tie: "unexpected outcome" — stop and flag isDoubleTie
 *  - Max 2 rerolls to prevent infinite loops
 *
 * Per THD rules, the Oblivion Die is rolled ONCE alongside the first Binary Roll (3d10 together).
 */
export function performBinaryRoll(
  rng?: () => number,
): BinaryRollWithOblivionResult {
  // Oblivion Die is rolled ONCE alongside the first binary roll
  const oblivionDie = rollOblivionDie(rng);

  const tieHistory: BinaryRollResult[] = [];
  let currentRoll = binaryRoll(rng);
  let rerollCount = 0;
  const MAX_REROLLS = 2;

  while (currentRoll.outcome === 'tie_reroll' && rerollCount < MAX_REROLLS) {
    tieHistory.push(currentRoll);
    currentRoll = binaryRoll(rng);
    rerollCount++;
  }

  // Check for double-tie (2+ consecutive ties)
  const isDoubleTie =
    tieHistory.length >= 2 ||
    (tieHistory.length >= 1 && currentRoll.outcome === 'tie_reroll');

  // If we exhausted rerolls and still tied, mark as unexpected outcome
  if (currentRoll.outcome === 'tie_reroll') {
    tieHistory.push(currentRoll);
    // Per THD, double-tie becomes an "unexpected" outcome
    // We keep the last tie roll data but flag isDoubleTie for the caller
  }

  return {
    binaryRoll: currentRoll,
    oblivionDie,
    tieHistory,
    isDoubleTie,
  };
}

/**
 * Interpret a Binary Roll outcome into a human-readable label.
 */
export function describeBinaryOutcome(
  outcome: BinaryOutcome,
  isDoubleTie: boolean,
): string {
  if (isDoubleTie) return 'Unexpected Outcome';
  switch (outcome) {
    case 'exceptional_positive':
      return 'Exceptional Positive';
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Negative';
    case 'exceptional_negative':
      return 'Exceptional Negative';
    case 'tie_reroll':
      return 'Tie (Rerolling...)';
  }
}
