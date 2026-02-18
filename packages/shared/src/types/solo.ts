import type { BinaryRollResult, OblivionDieResult } from './dice.js';

export interface SoloSession {
  id: string;
  characterId: string;
  currentScene: Scene;
  sceneHistory: Scene[];
  temporaryAngst: number;
  temporaryShadowPoints: number;
  goals: SoloGoal[];
}

export interface Scene {
  id: string;
  number: number;
  activity: string;
  focus: string;
  description: string;
  events: SceneEvent[];
  isRandom: boolean;
}

export interface SceneEvent {
  id: string;
  type: SceneEventType;
  description: string;
  binaryRoll?: BinaryRollResult;
  oblivionDie?: OblivionDieResult;
  timestamp: string;
}

export type SceneEventType =
  | 'binary_roll'
  | 'shadow_interjection'
  | 'random_scene_trigger'
  | 'combat'
  | 'arcanos_use'
  | 'passion_pursuit'
  | 'narrative';

export type RandomSceneType =
  | 'work_towards_passion'
  | 'new_npc'
  | 'npc_action'
  | 'move_away_from_passion'
  | 'positive_npc'
  | 'positive_pc'
  | 'negative_pc'
  | 'negative_npc'
  | 'work_towards_goal'
  | 'work_away_from_goal';

export interface SoloGoal {
  id: string;
  description: string;
  progress: number;
  isComplete: boolean;
}

export interface NpcPowerLevel {
  level: 'much_weaker' | 'slightly_weaker' | 'similar' | 'slightly_stronger' | 'much_stronger';
  dicePool: [number, number];
  willpower: number;
  expertiseDifficulty: number;
  weaknessDifficulty: number;
}

export interface ShadowDiceOffer {
  diceOffered: number;
  accepted: boolean;
  shadowPointsGained: number;
}
