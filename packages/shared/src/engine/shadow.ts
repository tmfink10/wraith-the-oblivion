import { v4 as uuidv4 } from 'uuid';
import type { Shadow, DarkPassion, Thorn, ThornName, ShadowArchetypeName } from '../types/shadow.js';
import type { DotRating, ExtendedDotRating } from '../types/character.js';
import { MAX_SHADOW_FREEBIE_TRADE } from '../constants.js';

// ─── Shadow Creation ──────────────────────────────────────────────

export function createShadow(
  archetype: ShadowArchetypeName,
  darkPassions: Array<{ description: string; emotion: string; rating: DotRating }> = [],
  thorns: Array<{ name: ThornName; rating: DotRating }> = [],
): Shadow {
  return {
    archetype,
    angst: { permanent: 1, temporary: 0 },
    darkPassions: darkPassions.map(dp => ({
      id: uuidv4(),
      description: dp.description,
      emotion: dp.emotion,
      rating: dp.rating,
    })),
    thorns: thorns.map(t => ({
      name: t.name,
      rating: t.rating,
    })),
    freebiePointsSpent: 0,
  };
}

// ─── Dark Passion Management ──────────────────────────────────────

export function addDarkPassion(
  shadow: Shadow,
  description: string,
  emotion: string,
  rating: DotRating,
): Shadow {
  return {
    ...shadow,
    darkPassions: [
      ...shadow.darkPassions,
      { id: uuidv4(), description, emotion, rating },
    ],
  };
}

export function removeDarkPassion(shadow: Shadow, passionId: string): Shadow {
  return {
    ...shadow,
    darkPassions: shadow.darkPassions.filter(dp => dp.id !== passionId),
  };
}

export function updateDarkPassion(
  shadow: Shadow,
  passionId: string,
  updates: Partial<Omit<DarkPassion, 'id'>>,
): Shadow {
  return {
    ...shadow,
    darkPassions: shadow.darkPassions.map(dp =>
      dp.id === passionId ? { ...dp, ...updates } : dp,
    ),
  };
}

// ─── Thorn Management ─────────────────────────────────────────────

export function addThorn(shadow: Shadow, name: ThornName, rating: DotRating): Shadow {
  // Don't allow duplicate thorns
  if (shadow.thorns.some(t => t.name === name)) {
    return shadow;
  }
  return {
    ...shadow,
    thorns: [...shadow.thorns, { name, rating }],
  };
}

export function removeThorn(shadow: Shadow, thornName: ThornName): Shadow {
  return {
    ...shadow,
    thorns: shadow.thorns.filter(t => t.name !== thornName),
  };
}

export function updateThornRating(shadow: Shadow, thornName: ThornName, rating: DotRating): Shadow {
  return {
    ...shadow,
    thorns: shadow.thorns.map(t =>
      t.name === thornName ? { ...t, rating } : t,
    ),
  };
}

// ─── Angst Management ─────────────────────────────────────────────

export function gainAngst(shadow: Shadow, amount: number = 1): Shadow {
  const newTemp = Math.min(10, shadow.angst.temporary + amount);
  return {
    ...shadow,
    angst: { ...shadow.angst, temporary: newTemp },
  };
}

export function spendAngst(shadow: Shadow, amount: number = 1): Shadow {
  const newTemp = Math.max(0, shadow.angst.temporary - amount);
  return {
    ...shadow,
    angst: { ...shadow.angst, temporary: newTemp },
  };
}

export function increasePermanentAngst(shadow: Shadow): Shadow {
  const newPerm = Math.min(10, shadow.angst.permanent + 1) as ExtendedDotRating;
  return {
    ...shadow,
    angst: { ...shadow.angst, permanent: newPerm },
  };
}

// ─── Shadow Freebie Point Trade ───────────────────────────────────

/**
 * Trade freebie points to strengthen the Shadow.
 * Returns additional freebie points the player can spend on the Psyche,
 * but the Shadow gets to spend the same amount on Thorns/Dark Passions.
 */
export function calculateShadowTrade(
  pointsTraded: number,
): { playerFreebies: number; shadowFreebies: number; isValid: boolean } {
  if (pointsTraded < 0 || pointsTraded > MAX_SHADOW_FREEBIE_TRADE) {
    return { playerFreebies: 0, shadowFreebies: 0, isValid: false };
  }
  return {
    playerFreebies: pointsTraded,
    shadowFreebies: pointsTraded,
    isValid: true,
  };
}

// ─── Shadow Validation ────────────────────────────────────────────

export interface ShadowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateShadow(shadow: Shadow): ShadowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!shadow.archetype) {
    errors.push('Shadow archetype is required');
  }

  if (shadow.darkPassions.length === 0) {
    warnings.push('Shadow should have at least one Dark Passion');
  }

  // Check each Dark Passion has valid rating
  for (const dp of shadow.darkPassions) {
    if (dp.rating < 1 || dp.rating > 5) {
      errors.push(`Dark Passion "${dp.description}" has invalid rating: ${dp.rating}`);
    }
    if (!dp.description.trim()) {
      errors.push('Dark Passion description cannot be empty');
    }
    if (!dp.emotion.trim()) {
      errors.push('Dark Passion emotion cannot be empty');
    }
  }

  // Thorns validation
  for (const t of shadow.thorns) {
    if (t.rating < 1 || t.rating > 5) {
      errors.push(`Thorn "${t.name}" has invalid rating: ${t.rating}`);
    }
  }

  // Duplicate Thorns check
  const thornNames = shadow.thorns.map(t => t.name);
  if (new Set(thornNames).size !== thornNames.length) {
    errors.push('Shadow has duplicate Thorns');
  }

  // Shadow freebie trade validation
  if (shadow.freebiePointsSpent > MAX_SHADOW_FREEBIE_TRADE) {
    errors.push(`Shadow freebie trade exceeds maximum of ${MAX_SHADOW_FREEBIE_TRADE}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ─── Catharsis Check ──────────────────────────────────────────────

/**
 * Determine the difficulty for a Catharsis roll based on trigger type.
 */
export type CatharsisTriggerType =
  | 'corpus_destroyed'
  | 'fetter_lost'
  | 'passion_lost'
  | 'willpower_zero'
  | 'trauma';

export function getCatharsisDifficulty(trigger: CatharsisTriggerType): number {
  switch (trigger) {
    case 'corpus_destroyed': return 8;
    case 'fetter_lost': return 7;
    case 'passion_lost': return 7;
    case 'willpower_zero': return 6;
    case 'trauma': return 6;
    default: return 6;
  }
}
