// Binary Roll
export { performBinaryRoll, describeBinaryOutcome } from './binary-roll.js';
export type { BinaryRollWithOblivionResult } from './binary-roll.js';

// Scene Generation
export { generateScene } from './scene-gen.js';
export type { SceneGenerationResult } from './scene-gen.js';

// Random Scene
export { checkForRandomScene } from './random-scene.js';
export type { RandomSceneCheckResult } from './random-scene.js';

// NPC Generation
export { generateNpc, describeNpcPowerLevel } from './npc-gen.js';
export type { GeneratedNpc } from './npc-gen.js';

// Oblivion Die / Shadow Interjection
export {
  determineShadowInterjection,
  resolveShadowDiceOffer,
} from './oblivion-die.js';
export type {
  ShadowInterjection,
  ShadowInterjectionType,
} from './oblivion-die.js';
