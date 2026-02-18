import { rollPool } from './dice.js';
import type { DiceRollResult } from '../types/dice.js';
import type {
  CombatState,
  InitiativeEntry,
  AttackResult,
  CombatManeuver,
} from '../types/combat.js';
import type { DamageType } from '../types/dice.js';
import { WOUND_LEVELS } from '../constants.js';
import type { WoundLevel } from '../types/character.js';

// ─── Initiative ────────────────────────────────────────────────────

/**
 * Roll initiative for a single character.
 * Initiative = Dexterity + Wits pool, difficulty 6.
 * The initiative value is the number of successes.
 */
export function rollInitiative(
  characterId: string,
  characterName: string,
  dexterity: number,
  wits: number,
  rng?: () => number,
): InitiativeEntry {
  const poolSize = dexterity + wits;
  const roll = rollPool(poolSize, 6, false, rng);
  return {
    characterId,
    characterName,
    roll,
    initiative: roll.successes,
    hasActed: false,
  };
}

/**
 * Create a combat state from an array of participants.
 * Rolls initiative for each and sorts descending.
 */
export function createCombatState(
  participants: Array<{
    characterId: string;
    characterName: string;
    dexterity: number;
    wits: number;
  }>,
  rng?: () => number,
): CombatState {
  const initiativeOrder = participants
    .map((p) =>
      rollInitiative(p.characterId, p.characterName, p.dexterity, p.wits, rng),
    )
    .sort((a, b) => b.initiative - a.initiative);

  return {
    round: 1,
    initiativeOrder,
    currentTurn: 0,
    isActive: true,
  };
}

/**
 * Advance to the next turn in initiative order.
 * Wraps to a new round when all characters have acted.
 */
export function advanceToNextTurn(state: CombatState): CombatState {
  if (!state.isActive) return state;

  // Mark current character as having acted
  const updated = state.initiativeOrder.map((entry, i) =>
    i === state.currentTurn ? { ...entry, hasActed: true } : entry,
  );

  // Find next character who hasn't acted
  let nextTurn = state.currentTurn + 1;
  let newRound = state.round;

  if (nextTurn >= updated.length) {
    // New round — reset all hasActed flags
    newRound++;
    nextTurn = 0;
    return {
      ...state,
      round: newRound,
      currentTurn: nextTurn,
      initiativeOrder: updated.map((entry) => ({ ...entry, hasActed: false })),
    };
  }

  return {
    ...state,
    round: newRound,
    currentTurn: nextTurn,
    initiativeOrder: updated,
  };
}

/**
 * End combat.
 */
export function endCombat(state: CombatState): CombatState {
  return { ...state, isActive: false };
}

// ─── Attack Resolution ─────────────────────────────────────────────

/**
 * Resolve a full attack sequence:
 * 1. Roll attack pool vs difficulty
 * 2. If hit, roll damage pool (add net attack successes as bonus dice)
 * 3. Defender rolls soak pool vs difficulty 6
 * 4. Net damage = damage successes − soak successes (min 0)
 *
 * If the attack roll gets 0 or fewer successes, no damage roll occurs.
 */
export function resolveAttack(
  attackerName: string,
  defenderName: string,
  attackerPool: number,
  difficulty: number,
  damagePool: number,
  damageType: DamageType,
  soakPool: number,
  rng?: () => number,
): AttackResult {
  const attackRoll = rollPool(attackerPool, difficulty, false, rng);

  // Miss — no damage
  if (attackRoll.successes === 0 || attackRoll.isBotch) {
    const zeroDamage = rollPool(1, 10, false, () => 1); // guaranteed 0 successes
    return {
      attackRoll,
      damageRoll: { ...zeroDamage, dice: [], poolSize: 0, successes: 0 },
      soakRoll: { ...zeroDamage, dice: [], poolSize: 0, successes: 0 },
      netDamage: 0,
      damageType,
      attackerName,
      defenderName,
    };
  }

  // Hit — roll damage with bonus dice from attack successes
  const totalDamagePool = damagePool + attackRoll.successes;
  const damageRoll = rollPool(totalDamagePool, 6, false, rng);

  // Soak — defender rolls Stamina (or equivalent) vs 6
  // Aggravated damage cannot be soaked by default (soakPool = 0 for aggravated unless special)
  const effectiveSoakPool =
    damageType === 'aggravated' ? 0 : Math.max(0, soakPool);
  let soakRoll: DiceRollResult;

  if (effectiveSoakPool > 0) {
    soakRoll = rollPool(effectiveSoakPool, 6, false, rng);
  } else {
    soakRoll = {
      dice: [],
      successes: 0,
      ones: 0,
      isBotch: false,
      difficulty: 6,
      poolSize: 0,
      isSpecialty: false,
    };
  }

  const netDamage = Math.max(0, damageRoll.successes - soakRoll.successes);

  return {
    attackRoll,
    damageRoll,
    soakRoll,
    netDamage,
    damageType,
    attackerName,
    defenderName,
  };
}

// ─── Defensive Actions ─────────────────────────────────────────────

/**
 * Resolve a dodge attempt.
 * Roll Dexterity + Dodge vs difficulty.
 * Returns successes that subtract from the attacker's attack successes.
 */
export function resolveDodge(
  dodgePool: number,
  difficulty: number = 6,
  rng?: () => number,
): DiceRollResult {
  return rollPool(dodgePool, difficulty, false, rng);
}

/**
 * Resolve a parry attempt.
 * Roll Dexterity + Melee vs difficulty.
 * Returns successes that subtract from attacker's attack successes.
 */
export function resolveParry(
  parryPool: number,
  difficulty: number = 6,
  rng?: () => number,
): DiceRollResult {
  return rollPool(parryPool, difficulty, false, rng);
}

// ─── Wound Track ───────────────────────────────────────────────────

/**
 * Create a fresh wound track (7 levels, all unfilled).
 */
export function createWoundTrack(): WoundLevel[] {
  return WOUND_LEVELS.map((level) => ({
    name: level.name,
    penalty: level.penalty,
    filled: false,
  }));
}

/**
 * Apply damage to a wound track.
 * Fills levels from top (Bruised) down.
 * Returns the updated wound track.
 */
export function applyDamageToWoundTrack(
  woundTrack: WoundLevel[],
  damage: number,
  damageType: DamageType = 'bashing',
): WoundLevel[] {
  const track = woundTrack.map((level) => ({ ...level }));
  let remaining = damage;

  for (let i = 0; i < track.length && remaining > 0; i++) {
    if (!track[i].filled) {
      track[i].filled = true;
      track[i].damageType = damageType;
      remaining--;
    }
  }

  return track;
}

/**
 * Calculate the current wound penalty from the wound track.
 * Scans from the bottom (most severe) upward, returning
 * the penalty of the most severe filled wound level.
 */
export function applyWoundPenalty(woundTrack: WoundLevel[]): number {
  // Find the most severe (highest index) filled wound level
  for (let i = woundTrack.length - 1; i >= 0; i--) {
    if (woundTrack[i].filled) {
      // Incapacitated is special — character can't act at all
      if (woundTrack[i].name === 'Incapacitated') return -Infinity;
      return woundTrack[i].penalty;
    }
  }
  return 0; // No wounds
}

/**
 * Get the name of the current wound level (most severe filled level).
 */
export function getWoundLevelName(woundTrack: WoundLevel[]): string {
  for (let i = woundTrack.length - 1; i >= 0; i--) {
    if (woundTrack[i].filled) {
      return woundTrack[i].name;
    }
  }
  return 'Healthy';
}

/**
 * Check if the character is incapacitated.
 */
export function isIncapacitated(woundTrack: WoundLevel[]): boolean {
  return woundTrack[woundTrack.length - 1]?.filled === true;
}

/**
 * Count total filled wound levels.
 */
export function countWounds(woundTrack: WoundLevel[]): number {
  return woundTrack.filter((level) => level.filled).length;
}

/**
 * Heal wound levels from the most severe down.
 */
export function healWoundTrack(
  woundTrack: WoundLevel[],
  levels: number,
): WoundLevel[] {
  const track = woundTrack.map((level) => ({ ...level }));
  let remaining = levels;

  // Heal from bottom (most severe) upward
  for (let i = track.length - 1; i >= 0 && remaining > 0; i--) {
    if (track[i].filled) {
      track[i].filled = false;
      track[i].damageType = undefined;
      remaining--;
    }
  }

  return track;
}

// ─── Standard Maneuvers ────────────────────────────────────────────

export const STANDARD_MANEUVERS: CombatManeuver[] = [
  {
    name: 'Punch',
    action: 'attack_brawl',
    dicePool: 'Dexterity + Brawl',
    difficulty: 6,
    damageType: 'bashing',
    damageBonus: 0, // Strength
    description: 'A standard punch. Damage: Strength (bashing).',
  },
  {
    name: 'Kick',
    action: 'attack_brawl',
    dicePool: 'Dexterity + Brawl',
    difficulty: 7,
    damageType: 'bashing',
    damageBonus: 1, // Strength + 1
    description: 'A kick. Harder to land but deals more damage. Damage: Strength + 1 (bashing).',
  },
  {
    name: 'Clinch',
    action: 'attack_brawl',
    dicePool: 'Strength + Brawl',
    difficulty: 6,
    damageType: 'bashing',
    damageBonus: 0, // Strength
    description: 'Grapple the opponent. Damage: Strength (bashing). Both immobilized.',
  },
  {
    name: 'Melee Strike',
    action: 'attack_melee',
    dicePool: 'Dexterity + Melee',
    difficulty: 6,
    damageType: 'lethal',
    damageBonus: 0, // Strength + weapon bonus
    description: 'Strike with a melee weapon. Damage: Strength + weapon damage (lethal).',
  },
  {
    name: 'Bite',
    action: 'attack_brawl',
    dicePool: 'Dexterity + Brawl',
    difficulty: 5,
    damageType: 'aggravated',
    damageBonus: 1, // Strength + 1
    description: 'Savage bite attack. Damage: Strength + 1 (aggravated).',
  },
  {
    name: 'Dodge',
    action: 'dodge',
    dicePool: 'Dexterity + Dodge',
    difficulty: 6,
    damageType: 'bashing', // not applicable
    damageBonus: 0,
    description: 'Evade an incoming attack. Successes subtract from attacker\'s roll.',
  },
  {
    name: 'Parry',
    action: 'parry',
    dicePool: 'Dexterity + Melee',
    difficulty: 6,
    damageType: 'bashing', // not applicable
    damageBonus: 0,
    description: 'Deflect a melee attack with a weapon. Successes subtract from attacker\'s roll.',
  },
];
