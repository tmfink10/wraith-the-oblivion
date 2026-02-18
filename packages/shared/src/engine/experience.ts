import type { Character, DotRating } from '../types/character.js';
import { XP_COSTS } from '../constants.js';

export type XpPurchaseType =
  | 'attribute'
  | 'ability'
  | 'new_ability'
  | 'arcanos'
  | 'background'
  | 'willpower';

/**
 * Calculate XP cost for raising a trait by one dot.
 * Cost = currentRating × multiplier (or fixed cost for new abilities).
 */
export function calculateXpCost(
  type: XpPurchaseType,
  currentRating: number,
): number {
  switch (type) {
    case 'attribute':
      return currentRating * XP_COSTS.attributes;
    case 'ability':
      return Math.max(1, currentRating * XP_COSTS.abilities);
    case 'new_ability':
      return XP_COSTS.newAbility;
    case 'arcanos':
      return currentRating * XP_COSTS.arcanoi;
    case 'background':
      return currentRating * XP_COSTS.backgrounds;
    case 'willpower':
      return currentRating * XP_COSTS.willpower;
    default:
      return 0;
  }
}

/**
 * Attempt to spend XP to raise a trait.
 * Returns updated character or null if insufficient XP.
 */
export function spendXp(
  character: Character,
  amount: number,
): Character | null {
  if (character.experience.available < amount) return null;
  return {
    ...character,
    experience: {
      ...character.experience,
      spent: character.experience.spent + amount,
      available: character.experience.available - amount,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Award XP to a character.
 */
export function awardXp(character: Character, amount: number): Character {
  return {
    ...character,
    experience: {
      total: character.experience.total + amount,
      spent: character.experience.spent,
      available: character.experience.available + amount,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get a breakdown of what a character can afford with current XP.
 */
export function getAffordableUpgrades(character: Character): {
  type: string;
  trait: string;
  currentRating: number;
  cost: number;
  canAfford: boolean;
}[] {
  const upgrades: {
    type: string;
    trait: string;
    currentRating: number;
    cost: number;
    canAfford: boolean;
  }[] = [];
  const available = character.experience.available;

  // Attributes
  for (const [catKey, catAttrs] of Object.entries(character.attributes)) {
    for (const [key, val] of Object.entries(catAttrs)) {
      if ((val as number) < 5) {
        const cost = calculateXpCost('attribute', val as number);
        upgrades.push({
          type: 'Attribute',
          trait: key,
          currentRating: val as number,
          cost,
          canAfford: available >= cost,
        });
      }
    }
  }

  // Abilities
  for (const [catKey, catAbils] of Object.entries(character.abilities)) {
    for (const [key, val] of Object.entries(catAbils)) {
      const rating = val as number;
      if (rating < 5) {
        const xpType = rating === 0 ? 'new_ability' : 'ability';
        const cost = calculateXpCost(xpType, rating);
        upgrades.push({
          type: 'Ability',
          trait: key,
          currentRating: rating,
          cost,
          canAfford: available >= cost,
        });
      }
    }
  }

  // Willpower
  if (character.resources.willpower.permanent < 10) {
    const cost = calculateXpCost('willpower', character.resources.willpower.permanent);
    upgrades.push({
      type: 'Willpower',
      trait: 'willpower',
      currentRating: character.resources.willpower.permanent,
      cost,
      canAfford: available >= cost,
    });
  }

  // Arcanoi
  for (const arc of character.arcanoi) {
    if (arc.rating < 5) {
      const cost = calculateXpCost('arcanos', arc.rating);
      upgrades.push({
        type: 'Arcanos',
        trait: arc.name,
        currentRating: arc.rating,
        cost,
        canAfford: available >= cost,
      });
    }
  }

  return upgrades;
}
