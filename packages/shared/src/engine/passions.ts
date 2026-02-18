import { v4 as uuidv4 } from 'uuid';
import type { Character, Passion, Fetter, DotRating, FetterType } from '../types/character.js';
import type { DiceRollResult } from '../types/dice.js';
import { rollPool } from './dice.js';

// ─── Passion Management ───────────────────────────────────────────

export function createPassion(
  description: string,
  emotion: string,
  rating: DotRating,
): Passion {
  return { id: uuidv4(), description, emotion, rating };
}

export function createFetter(
  description: string,
  type: FetterType,
  rating: DotRating,
): Fetter {
  return { id: uuidv4(), description, type, rating };
}

/**
 * Generate Pathos by pursuing a Passion.
 * Active pursuit: difficulty 6.
 * Observing others experience it: difficulty 8.
 * Each success = 1 Pathos gained.
 */
export function rollPathosGeneration(
  passionRating: number,
  isActive: boolean = true,
): DiceRollResult {
  const difficulty = isActive ? 6 : 8;
  return rollPool(passionRating, difficulty);
}

/**
 * Attempt to resolve a Passion (complete its goal).
 * Must achieve successes >= Passion's original rating on difficulty 6.
 * Success: Passion is removed (resolved).
 * Failure: Passion rating increases by 1.
 */
export function rollPassionResolution(
  passionRating: number,
): { roll: DiceRollResult; resolved: boolean; newRating: DotRating } {
  const roll = rollPool(passionRating, 6);
  const resolved = roll.successes >= passionRating;
  const newRating = resolved
    ? 0 as DotRating
    : Math.min(5, passionRating + 1) as DotRating;
  return { roll, resolved, newRating };
}

/**
 * Attempt to resolve a Fetter (sever the tie).
 * Must achieve successes >= Fetter's rating on difficulty 6.
 * Success: Fetter is removed.
 * Failure: Fetter rating increases by 1.
 */
export function rollFetterResolution(
  fetterRating: number,
): { roll: DiceRollResult; resolved: boolean; newRating: DotRating } {
  const roll = rollPool(fetterRating, 6);
  const resolved = roll.successes >= fetterRating;
  const newRating = resolved
    ? 0 as DotRating
    : Math.min(5, fetterRating + 1) as DotRating;
  return { roll, resolved, newRating };
}

/**
 * Generate Pathos from Memoriam background.
 * Roll Memoriam rating at difficulty 8. Each success = 1 Pathos.
 */
export function rollMemoriamPathos(memoriamRating: number): DiceRollResult {
  return rollPool(memoriamRating, 8);
}

// ─── Passion / Fetter Mutation ────────────────────────────────────

export function addPassionToCharacter(character: Character, passion: Passion): Character {
  return {
    ...character,
    passions: [...character.passions, passion],
    updatedAt: new Date().toISOString(),
  };
}

export function removePassionFromCharacter(character: Character, passionId: string): Character {
  return {
    ...character,
    passions: character.passions.filter(p => p.id !== passionId),
    updatedAt: new Date().toISOString(),
  };
}

export function updatePassionRating(character: Character, passionId: string, newRating: DotRating): Character {
  return {
    ...character,
    passions: character.passions.map(p =>
      p.id === passionId ? { ...p, rating: newRating } : p,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function addFetterToCharacter(character: Character, fetter: Fetter): Character {
  return {
    ...character,
    fetters: [...character.fetters, fetter],
    updatedAt: new Date().toISOString(),
  };
}

export function removeFetterFromCharacter(character: Character, fetterId: string): Character {
  return {
    ...character,
    fetters: character.fetters.filter(f => f.id !== fetterId),
    updatedAt: new Date().toISOString(),
  };
}
