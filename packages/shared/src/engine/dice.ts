import type {
  DiceRollResult,
  ExtendedRollState,
  ResistedRollResult,
  BinaryRollResult,
  BinaryOutcome,
  OblivionDieResult,
} from '../types/dice.js';

function rollDie(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Roll a d10 dice pool against a difficulty.
 * - Each die >= difficulty counts as a success
 * - Each die showing 1 subtracts a success
 * - If specialty is true, 10s count as 2 successes
 * - Botch: 0 successes (after subtraction) and at least one 1
 */
export function rollPool(
  poolSize: number,
  difficulty: number = 6,
  isSpecialty: boolean = false,
  rng: () => number = rollDie,
): DiceRollResult {
  if (poolSize < 1) poolSize = 1;
  if (difficulty < 2) difficulty = 2;
  if (difficulty > 10) difficulty = 10;

  const dice: number[] = [];
  for (let i = 0; i < poolSize; i++) {
    dice.push(rng());
  }

  let successes = 0;
  let ones = 0;

  for (const die of dice) {
    if (die === 1) {
      ones++;
    } else if (die >= difficulty) {
      successes++;
      if (isSpecialty && die === 10) {
        successes++; // 10s count as 2 successes with specialty
      }
    }
  }

  // Subtract ones from successes
  const netSuccesses = Math.max(0, successes - ones);
  const isBotch = successes === 0 && ones > 0;

  return {
    dice,
    successes: isBotch ? 0 : netSuccesses,
    ones,
    isBotch,
    difficulty,
    poolSize,
    isSpecialty,
  };
}

/**
 * Extended roll: accumulate successes across multiple rolls
 * toward a target number of successes.
 */
export function createExtendedRoll(
  targetSuccesses: number,
  maxRolls: number | null = null,
): ExtendedRollState {
  return {
    totalSuccesses: 0,
    targetSuccesses,
    rollsCompleted: 0,
    maxRolls,
    isComplete: false,
    rolls: [],
  };
}

export function advanceExtendedRoll(
  state: ExtendedRollState,
  poolSize: number,
  difficulty: number = 6,
  isSpecialty: boolean = false,
): ExtendedRollState {
  if (state.isComplete) return state;

  const result = rollPool(poolSize, difficulty, isSpecialty);
  const newTotal = state.totalSuccesses + result.successes;
  const newRollsCompleted = state.rollsCompleted + 1;

  // Botch on extended roll loses all accumulated successes
  const totalAfterBotch = result.isBotch ? 0 : newTotal;

  const isComplete =
    totalAfterBotch >= state.targetSuccesses ||
    (state.maxRolls !== null && newRollsCompleted >= state.maxRolls);

  return {
    totalSuccesses: totalAfterBotch,
    targetSuccesses: state.targetSuccesses,
    rollsCompleted: newRollsCompleted,
    maxRolls: state.maxRolls,
    isComplete,
    rolls: [...state.rolls, result],
  };
}

/**
 * Resisted roll: two parties roll opposing pools.
 * The one with more successes wins; net successes are the margin.
 */
export function resistedRoll(
  attackerPool: number,
  defenderPool: number,
  attackerDifficulty: number = 6,
  defenderDifficulty: number = 6,
): ResistedRollResult {
  const attacker = rollPool(attackerPool, attackerDifficulty);
  const defender = rollPool(defenderPool, defenderDifficulty);

  const netSuccesses = attacker.successes - defender.successes;

  let winner: 'attacker' | 'defender' | 'tie';
  if (netSuccesses > 0) winner = 'attacker';
  else if (netSuccesses < 0) winner = 'defender';
  else winner = 'tie';

  return { attacker, defender, netSuccesses, winner };
}

/**
 * Binary Roll (THD Solo System):
 * Roll two d10s — one positive, one negative.
 * Higher die determines outcome direction.
 * Double 10s = exceptional positive; double 1s = exceptional negative.
 * Ties trigger a reroll.
 */
export function binaryRoll(rng: () => number = rollDie): BinaryRollResult {
  const positiveDie = rng();
  const negativeDie = rng();

  let outcome: BinaryOutcome;

  if (positiveDie === 10 && negativeDie === 10) {
    outcome = 'exceptional_positive';
  } else if (positiveDie === 1 && negativeDie === 1) {
    outcome = 'exceptional_negative';
  } else if (positiveDie === negativeDie) {
    outcome = 'tie_reroll';
  } else if (positiveDie > negativeDie) {
    outcome = 'positive';
  } else {
    outcome = 'negative';
  }

  return { positiveDie, negativeDie, outcome };
}

/**
 * Oblivion Die (THD Solo System):
 * Roll an extra d10 alongside other rolls.
 * On 1 or 10, the Shadow must interject.
 */
export function rollOblivionDie(rng: () => number = rollDie): OblivionDieResult {
  const value = rng();
  return {
    value,
    shadowInterjects: value === 1 || value === 10,
  };
}

/**
 * Check if a random scene triggers at end of scene.
 * Roll 1d10, halve (round down). If result <= temporaryAngst, scene triggers.
 */
export function checkRandomSceneTrigger(
  temporaryAngst: number,
  rng: () => number = rollDie,
): { roll: number; halved: number; triggered: boolean } {
  const roll = rng();
  const halved = Math.floor(roll / 2);
  return {
    roll,
    halved,
    triggered: halved <= temporaryAngst && temporaryAngst > 0,
  };
}

/**
 * Roll on random scene table (1d10).
 */
export function rollRandomScene(rng: () => number = rollDie): number {
  return rng();
}

/**
 * Generate NPC power level from 1d10 roll.
 */
export function rollNpcPowerLevel(rng: () => number = rollDie): {
  roll: number;
  level: string;
  dicePool: [number, number];
  willpower: number;
} {
  const roll = rng();
  if (roll <= 2) return { roll, level: 'much_weaker', dicePool: [2, 3], willpower: 3 };
  if (roll <= 4) return { roll, level: 'slightly_weaker', dicePool: [3, 4], willpower: 4 };
  if (roll <= 6) return { roll, level: 'similar', dicePool: [4, 5], willpower: 4 };
  if (roll <= 8) return { roll, level: 'slightly_stronger', dicePool: [5, 6], willpower: 6 };
  return { roll, level: 'much_stronger', dicePool: [7, 8], willpower: 8 };
}
