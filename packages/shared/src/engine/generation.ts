import { v4 as uuidv4 } from 'uuid';
import type { CauseOfDeath, FetterType, DotRating } from '../types/character.js';
import {
  AGE_BRACKETS,
  UPBRINGINGS,
  OCCUPATIONS,
  CAUSES_OF_DEATH,
  HAUNT_TYPES,
  HAUNT_SIZES,
  FETTER_TYPES,
  PERSON_OF_IMPORTANCE,
  PASSION_ACTIONS,
  PASSION_EMOTIONS,
  REGRET_TYPES,
  GENDER_PRONOUNS,
  HAIRSTYLES,
  HAIR_LENGTHS,
  HAIR_TEXTURES,
  FASHION_STYLES,
} from '../data/generation-tables.js';
import { CAUSE_OF_DEATH_TO_LEGION } from '../data/legions.js';

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollD4(): number {
  return Math.floor(Math.random() * 4) + 1;
}

/** Look up a result from a table keyed by roll ranges */
function lookupRoll<T extends { roll: number | readonly number[] }>(
  table: readonly T[],
  roll: number,
): T | undefined {
  return table.find(entry => {
    if (typeof entry.roll === 'number') {
      return entry.roll === roll;
    }
    if (Array.isArray(entry.roll) || (entry.roll as readonly number[]).length === 2) {
      const range = entry.roll as readonly number[];
      return roll >= range[0] && roll <= range[1];
    }
    return false;
  });
}

// ─── Individual Table Rolls ───────────────────────────────────────

export interface GenerationResult {
  roll: number;
  label: string;
}

export function rollAge(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(AGE_BRACKETS, roll);
  return { roll, label: entry?.label ?? 'Unknown' };
}

export function rollUpbringing(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(UPBRINGINGS, roll);
  return { roll, label: entry?.label ?? 'Unknown' };
}

export function rollOccupation(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(OCCUPATIONS, roll);
  return { roll, label: entry?.label ?? 'Unknown' };
}

export function rollCauseOfDeath(): GenerationResult & { legion: string; causeKey: CauseOfDeath } {
  const roll = rollD10();
  const entry = lookupRoll(CAUSES_OF_DEATH, roll);
  const label = entry?.label ?? 'Mystery';
  const legionKey = (entry as any)?.legion ?? 'paupers';
  // Map label to CauseOfDeath key
  const causeMap: Record<string, CauseOfDeath> = {
    'Old Age': 'old_age',
    'Disease': 'disease',
    'Violence': 'violence',
    'Madness': 'madness',
    'Happenstance': 'happenstance',
    'Despair': 'despair',
    'Mystery': 'mystery',
    'Fate': 'fate',
  };
  return { roll, label, legion: legionKey, causeKey: causeMap[label] ?? 'mystery' };
}

export function rollHauntType(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(HAUNT_TYPES, roll);
  return { roll, label: entry?.label ?? 'None' };
}

export function rollHauntSize(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(HAUNT_SIZES, roll);
  return { roll, label: entry?.label ?? 'Medium' };
}

export function rollFetterType(): GenerationResult & { fetterTypeKey: FetterType } {
  const roll = rollD10();
  const entry = lookupRoll(FETTER_TYPES, roll);
  const label = entry?.label ?? 'Treasured Possession';
  const typeMap: Record<string, FetterType> = {
    'Relative': 'relative',
    'Friend/Foe': 'friend_foe',
    'Place of Importance': 'place',
    'Treasured Possession': 'possession',
    'Cause of Death': 'cause_of_death',
    'Loved One': 'loved_one',
    'Place of Death': 'place_of_death',
    'Where Lived/Grew Up': 'childhood_home',
    'Symbolic Fragment of Mortal Self': 'symbolic_fragment',
    'Personal Document/Project': 'personal_document',
  };
  return { roll, label, fetterTypeKey: typeMap[label] ?? 'possession' };
}

export function rollPersonOfImportance(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(PERSON_OF_IMPORTANCE, roll);
  return { roll, label: entry?.label ?? 'Hapless Soul' };
}

export function rollPassionAction(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(PASSION_ACTIONS, roll);
  return { roll, label: entry?.label ?? 'Finish incomplete task' };
}

export function rollPassionEmotion(): GenerationResult {
  const roll = rollD20();
  const entry = lookupRoll(PASSION_EMOTIONS, roll);
  return { roll, label: entry?.label ?? 'Determination' };
}

export function rollRegret(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(REGRET_TYPES, roll);
  return { roll, label: entry?.label ?? 'Love' };
}

export function rollGenderPronouns(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(GENDER_PRONOUNS, roll);
  return { roll, label: entry?.label ?? 'They/Them' };
}

export function rollHairstyle(): GenerationResult {
  const roll = rollD10();
  const entry = lookupRoll(HAIRSTYLES, roll);
  return { roll, label: entry?.label ?? 'Side Part' };
}

export function rollHairLength(): GenerationResult {
  const roll = rollD4();
  const entry = lookupRoll(HAIR_LENGTHS, roll);
  return { roll, label: entry?.label ?? 'Medium' };
}

export function rollHairTexture(): GenerationResult {
  const roll = rollD4();
  const entry = lookupRoll(HAIR_TEXTURES, roll);
  return { roll, label: entry?.label ?? 'Straight' };
}

export function rollFashionStyle(): GenerationResult {
  const roll = rollD20();
  const entry = lookupRoll(FASHION_STYLES, roll);
  return { roll, label: entry?.label ?? 'Casual' };
}

// ─── Full Random Generation ───────────────────────────────────────

export interface RandomCharacterConcept {
  age: GenerationResult;
  gender: GenerationResult;
  upbringing: GenerationResult;
  occupation: GenerationResult;
  causeOfDeath: GenerationResult & { legion: string; causeKey: CauseOfDeath };
  haunt: { type: GenerationResult; size: GenerationResult };
  appearance: {
    hairstyle: GenerationResult;
    hairLength: GenerationResult;
    hairTexture: GenerationResult;
    fashion: GenerationResult;
  };
  regret: GenerationResult;
  personOfImportance: GenerationResult;
  passionSeed: { action: GenerationResult; emotion: GenerationResult };
  fetterSeed: GenerationResult & { fetterTypeKey: FetterType };
}

/**
 * Roll all THD generation tables to create a random character concept.
 * This provides narrative seeds — the player still assigns dots.
 */
export function rollRandomCharacterConcept(): RandomCharacterConcept {
  return {
    age: rollAge(),
    gender: rollGenderPronouns(),
    upbringing: rollUpbringing(),
    occupation: rollOccupation(),
    causeOfDeath: rollCauseOfDeath(),
    haunt: {
      type: rollHauntType(),
      size: rollHauntSize(),
    },
    appearance: {
      hairstyle: rollHairstyle(),
      hairLength: rollHairLength(),
      hairTexture: rollHairTexture(),
      fashion: rollFashionStyle(),
    },
    regret: rollRegret(),
    personOfImportance: rollPersonOfImportance(),
    passionSeed: {
      action: rollPassionAction(),
      emotion: rollPassionEmotion(),
    },
    fetterSeed: rollFetterType(),
  };
}
