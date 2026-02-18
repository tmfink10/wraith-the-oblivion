export interface DiceRollResult {
  dice: number[];
  successes: number;
  ones: number;
  isBotch: boolean;
  difficulty: number;
  poolSize: number;
  isSpecialty: boolean;
}

export interface ExtendedRollState {
  totalSuccesses: number;
  targetSuccesses: number;
  rollsCompleted: number;
  maxRolls: number | null;
  isComplete: boolean;
  rolls: DiceRollResult[];
}

export interface ResistedRollResult {
  attacker: DiceRollResult;
  defender: DiceRollResult;
  netSuccesses: number;
  winner: 'attacker' | 'defender' | 'tie';
}

export interface BinaryRollResult {
  positiveDie: number;
  negativeDie: number;
  outcome: BinaryOutcome;
}

export type BinaryOutcome =
  | 'positive'
  | 'negative'
  | 'exceptional_positive'
  | 'exceptional_negative'
  | 'tie_reroll';

export interface OblivionDieResult {
  value: number;
  shadowInterjects: boolean;
}

export type DamageType = 'bashing' | 'lethal' | 'aggravated';
