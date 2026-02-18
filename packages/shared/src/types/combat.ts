import type { DamageType, DiceRollResult } from './dice.js';

export interface CombatState {
  round: number;
  initiativeOrder: InitiativeEntry[];
  currentTurn: number;
  isActive: boolean;
}

export interface InitiativeEntry {
  characterId: string;
  characterName: string;
  roll: DiceRollResult;
  initiative: number;
  hasActed: boolean;
}

export interface AttackResult {
  attackRoll: DiceRollResult;
  damageRoll: DiceRollResult;
  soakRoll: DiceRollResult;
  netDamage: number;
  damageType: DamageType;
  attackerName: string;
  defenderName: string;
}

export type CombatAction =
  | 'attack_melee'
  | 'attack_ranged'
  | 'attack_brawl'
  | 'dodge'
  | 'parry'
  | 'use_arcanos'
  | 'movement'
  | 'other';

export interface CombatManeuver {
  name: string;
  action: CombatAction;
  dicePool: string;
  difficulty: number;
  damageType: DamageType;
  damageBonus: number;
  description: string;
}
