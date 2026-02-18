import { rollPool } from './dice.js';
import { spendPathos, spendWillpower } from './resources.js';
import type { DiceRollResult } from '../types/dice.js';
import type { ArcanosName, ArcanosLevel } from '../types/arcanoi.js';
import type { Character, DotRating, Resources } from '../types/character.js';

// ─── Arcanos Activation Result ─────────────────────────────────────

export interface ArcanosActivationResult {
  arcanosName: ArcanosName;
  levelUsed: number;
  powerName: string;
  roll: DiceRollResult;
  success: boolean;
  resourcesAfter: Resources;
  pathosCost: number;
  willpowerCost: number;
  effect: string;
}

// ─── Arcanoi Definitions ───────────────────────────────────────────

/**
 * Full power definitions for all 16 Western Arcanoi, 5 levels each.
 * Each level specifies: name, costs, dice pool description, difficulty, duration.
 *
 * Dice pool strings are descriptive — the actual pool must be computed
 * from character stats at activation time. The `difficulty` is the
 * standard difficulty for the roll.
 */
export const ARCANOI_DEFINITIONS: Record<
  string,
  {
    displayName: string;
    levels: ArcanosLevel[];
  }
> = {
  argos: {
    displayName: 'Argos',
    levels: [
      { level: 1 as DotRating, name: 'Enshroud', description: 'Become invisible to other wraiths', pathosCost: 1, willpowerCost: 0, dicePool: 'Intelligence + Argos', difficulty: 6 },
      { level: 2 as DotRating, name: 'Phantom Wings', description: 'Fly through the Shadowlands', pathosCost: 1, willpowerCost: 0, dicePool: 'Dexterity + Argos', difficulty: 6, duration: '1 scene' },
      { level: 3 as DotRating, name: 'Tempest Threshold', description: 'Open a Nihil to the Tempest', pathosCost: 2, willpowerCost: 0, dicePool: 'Intelligence + Argos', difficulty: 7 },
      { level: 4 as DotRating, name: 'Byway', description: 'Create safe passage through the Tempest', pathosCost: 3, willpowerCost: 0, dicePool: 'Wits + Argos', difficulty: 7, duration: '1 scene' },
      { level: 5 as DotRating, name: 'Oubliette', description: 'Banish target into the Tempest', pathosCost: 4, willpowerCost: 1, dicePool: 'Intelligence + Argos', difficulty: 8 },
    ],
  },
  castigate: {
    displayName: 'Castigate',
    levels: [
      { level: 1 as DotRating, name: 'Dark Secrets', description: 'Glimpse the target\'s Shadow\'s nature', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Castigate', difficulty: 6 },
      { level: 2 as DotRating, name: 'Devil\'s Dare', description: 'Force the Shadow to reveal a Dark Passion', pathosCost: 1, willpowerCost: 0, dicePool: 'Manipulation + Castigate', difficulty: 7 },
      { level: 3 as DotRating, name: 'Defiance', description: 'Temporarily suppress one of the target\'s Thorns', pathosCost: 2, willpowerCost: 0, dicePool: 'Charisma + Castigate', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Purify', description: 'Remove temporary Angst from the target', pathosCost: 3, willpowerCost: 0, dicePool: 'Manipulation + Castigate', difficulty: 8 },
      { level: 5 as DotRating, name: 'Exorcism', description: 'Drive the Shadow into dormancy', pathosCost: 4, willpowerCost: 1, dicePool: 'Charisma + Castigate', difficulty: 9, duration: '1 scene' },
    ],
  },
  embody: {
    displayName: 'Embody',
    levels: [
      { level: 1 as DotRating, name: 'Whispers', description: 'Speak audibly to the living as a faint voice', pathosCost: 1, willpowerCost: 0, dicePool: 'Charisma + Embody', difficulty: 6 },
      { level: 2 as DotRating, name: 'Statue', description: 'Become visible as a ghostly, translucent form', pathosCost: 1, willpowerCost: 0, dicePool: 'Stamina + Embody', difficulty: 6, duration: '1 scene' },
      { level: 3 as DotRating, name: 'Apparition', description: 'Manifest a solid, lifelike form', pathosCost: 2, willpowerCost: 0, dicePool: 'Stamina + Embody', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Maintain the Facade', description: 'Pass as a living person completely', pathosCost: 3, willpowerCost: 1, dicePool: 'Manipulation + Embody', difficulty: 8, duration: '1 scene' },
      { level: 5 as DotRating, name: 'Life-in-Death', description: 'Become truly physical temporarily', pathosCost: 5, willpowerCost: 1, dicePool: 'Stamina + Embody', difficulty: 9, duration: '1 scene' },
    ],
  },
  fatalism: {
    displayName: 'Fatalism',
    levels: [
      { level: 1 as DotRating, name: 'Fortune\'s Fool', description: 'Sense the most likely outcome of an action', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Fatalism', difficulty: 6 },
      { level: 2 as DotRating, name: 'Prognostication', description: 'Read an omen about someone\'s near future', pathosCost: 1, willpowerCost: 0, dicePool: 'Intelligence + Fatalism', difficulty: 7 },
      { level: 3 as DotRating, name: 'Guiding Fate', description: 'Nudge probability in a favorable direction', pathosCost: 2, willpowerCost: 0, dicePool: 'Wits + Fatalism', difficulty: 7 },
      { level: 4 as DotRating, name: 'Fated Doom', description: 'Reveal a target\'s ultimate fate', pathosCost: 3, willpowerCost: 0, dicePool: 'Intelligence + Fatalism', difficulty: 8 },
      { level: 5 as DotRating, name: 'Kismet', description: 'Rewrite a thread of fate entirely', pathosCost: 5, willpowerCost: 1, dicePool: 'Manipulation + Fatalism', difficulty: 9 },
    ],
  },
  flux: {
    displayName: 'Flux',
    levels: [
      { level: 1 as DotRating, name: 'Decay', description: 'Age and decay a small object', pathosCost: 1, willpowerCost: 0, dicePool: 'Intelligence + Flux', difficulty: 6 },
      { level: 2 as DotRating, name: 'Transmute', description: 'Change the composition of plasm', pathosCost: 1, willpowerCost: 0, dicePool: 'Intelligence + Flux', difficulty: 7 },
      { level: 3 as DotRating, name: 'Warp', description: 'Reshape plasm into new forms', pathosCost: 2, willpowerCost: 0, dicePool: 'Wits + Flux', difficulty: 7 },
      { level: 4 as DotRating, name: 'Disintegrate', description: 'Destroy relic or plasm objects', pathosCost: 3, willpowerCost: 0, dicePool: 'Intelligence + Flux', difficulty: 8 },
      { level: 5 as DotRating, name: 'Unmake', description: 'Unravel the fabric of the Underworld locally', pathosCost: 5, willpowerCost: 1, dicePool: 'Intelligence + Flux', difficulty: 9 },
    ],
  },
  inhabit: {
    displayName: 'Inhabit',
    levels: [
      { level: 1 as DotRating, name: 'Sense Gremlin', description: 'Detect nearby machines and their condition', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Inhabit', difficulty: 6 },
      { level: 2 as DotRating, name: 'Surge', description: 'Channel energy into or through a device', pathosCost: 1, willpowerCost: 0, dicePool: 'Wits + Inhabit', difficulty: 6 },
      { level: 3 as DotRating, name: 'Claim', description: 'Possess and control a simple machine', pathosCost: 2, willpowerCost: 0, dicePool: 'Intelligence + Inhabit', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Override', description: 'Possess and control complex electronics', pathosCost: 3, willpowerCost: 0, dicePool: 'Intelligence + Inhabit', difficulty: 8, duration: '1 scene' },
      { level: 5 as DotRating, name: 'Communion', description: 'Merge completely with a machine, gaining full control', pathosCost: 4, willpowerCost: 1, dicePool: 'Intelligence + Inhabit', difficulty: 9, duration: '1 scene' },
    ],
  },
  intimation: {
    displayName: 'Intimation',
    levels: [
      { level: 1 as DotRating, name: 'Awe', description: 'Inspire fascination and reverence in a target', pathosCost: 1, willpowerCost: 0, dicePool: 'Charisma + Intimation', difficulty: 6 },
      { level: 2 as DotRating, name: 'Emotion Sense', description: 'Read a target\'s emotional state', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Intimation', difficulty: 6 },
      { level: 3 as DotRating, name: 'Rapport', description: 'Create an emotional bond with a target', pathosCost: 2, willpowerCost: 0, dicePool: 'Manipulation + Intimation', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Terror', description: 'Flood a target with overwhelming fear', pathosCost: 3, willpowerCost: 0, dicePool: 'Manipulation + Intimation', difficulty: 7 },
      { level: 5 as DotRating, name: 'Emotional Dominance', description: 'Completely control a target\'s emotions', pathosCost: 4, willpowerCost: 1, dicePool: 'Charisma + Intimation', difficulty: 8, duration: '1 scene' },
    ],
  },
  keening: {
    displayName: 'Keening',
    levels: [
      { level: 1 as DotRating, name: 'Dirge', description: 'Song that saps the will of listeners', pathosCost: 1, willpowerCost: 0, dicePool: 'Charisma + Keening', difficulty: 6 },
      { level: 2 as DotRating, name: 'Ballad', description: 'A song that inspires strong emotion', pathosCost: 1, willpowerCost: 0, dicePool: 'Charisma + Keening', difficulty: 6, duration: '1 scene' },
      { level: 3 as DotRating, name: 'Requiem', description: 'A dirge that can immobilize wraiths', pathosCost: 2, willpowerCost: 0, dicePool: 'Manipulation + Keening', difficulty: 7 },
      { level: 4 as DotRating, name: 'Crescendo', description: 'A building sonic force that can shatter relic objects', pathosCost: 3, willpowerCost: 0, dicePool: 'Stamina + Keening', difficulty: 8 },
      { level: 5 as DotRating, name: 'Opus', description: 'A masterwork that rewrites the emotional reality of all who hear', pathosCost: 5, willpowerCost: 1, dicePool: 'Charisma + Keening', difficulty: 9, duration: '1 scene' },
    ],
  },
  lifeweb: {
    displayName: 'Lifeweb',
    levels: [
      { level: 1 as DotRating, name: 'Locate Fetter', description: 'Sense the direction and distance to a Fetter', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Lifeweb', difficulty: 6 },
      { level: 2 as DotRating, name: 'Web Sight', description: 'See the web of connections around a wraith', pathosCost: 1, willpowerCost: 0, dicePool: 'Perception + Lifeweb', difficulty: 7 },
      { level: 3 as DotRating, name: 'Splice', description: 'Temporarily strengthen or weaken a Fetter bond', pathosCost: 2, willpowerCost: 0, dicePool: 'Intelligence + Lifeweb', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Sever', description: 'Cut a Fetter bond temporarily', pathosCost: 3, willpowerCost: 0, dicePool: 'Intelligence + Lifeweb', difficulty: 8 },
      { level: 5 as DotRating, name: 'Reweave', description: 'Permanently alter or create Fetter connections', pathosCost: 5, willpowerCost: 1, dicePool: 'Intelligence + Lifeweb', difficulty: 9 },
    ],
  },
  mnemosynis: {
    displayName: 'Mnemosynis',
    levels: [
      { level: 1 as DotRating, name: 'Memory Wrack', description: 'Read surface memories of a target', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Mnemosynis', difficulty: 6 },
      { level: 2 as DotRating, name: 'Recall', description: 'Access deeper, buried memories', pathosCost: 1, willpowerCost: 0, dicePool: 'Intelligence + Mnemosynis', difficulty: 7 },
      { level: 3 as DotRating, name: 'Memory Theft', description: 'Temporarily suppress a specific memory', pathosCost: 2, willpowerCost: 0, dicePool: 'Manipulation + Mnemosynis', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Counterfeit Memory', description: 'Implant a false memory', pathosCost: 3, willpowerCost: 0, dicePool: 'Manipulation + Mnemosynis', difficulty: 8 },
      { level: 5 as DotRating, name: 'Memory Storm', description: 'Completely overwrite or erase memories', pathosCost: 5, willpowerCost: 1, dicePool: 'Intelligence + Mnemosynis', difficulty: 9 },
    ],
  },
  moliate: {
    displayName: 'Moliate',
    levels: [
      { level: 1 as DotRating, name: 'Shapesense', description: 'Read the history of plasm-shaping on a target', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Moliate', difficulty: 6 },
      { level: 2 as DotRating, name: 'Sculpt', description: 'Make cosmetic changes to plasmic form', pathosCost: 1, willpowerCost: 0, dicePool: 'Dexterity + Moliate', difficulty: 6, duration: '1 scene' },
      { level: 3 as DotRating, name: 'Bodywork', description: 'Reshape plasm to enhance physical attributes', pathosCost: 2, willpowerCost: 0, dicePool: 'Dexterity + Moliate', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Rend', description: 'Inflict lethal damage by tearing plasm', pathosCost: 3, willpowerCost: 0, dicePool: 'Strength + Moliate', difficulty: 7 },
      { level: 5 as DotRating, name: 'Martyr', description: 'Complete plasmic transformation into any form', pathosCost: 5, willpowerCost: 1, dicePool: 'Stamina + Moliate', difficulty: 9, duration: '1 scene' },
    ],
  },
  outrage: {
    displayName: 'Outrage',
    levels: [
      { level: 1 as DotRating, name: 'Ping', description: 'Create small noises or vibrations in the Skinlands', pathosCost: 1, willpowerCost: 0, dicePool: 'Strength + Outrage', difficulty: 6 },
      { level: 2 as DotRating, name: 'Wraithgrasp', description: 'Move small objects in the Skinlands', pathosCost: 1, willpowerCost: 0, dicePool: 'Strength + Outrage', difficulty: 6, duration: '1 turn' },
      { level: 3 as DotRating, name: 'Stonehand Punch', description: 'Strike physical objects and living beings from across the Shroud', pathosCost: 2, willpowerCost: 0, dicePool: 'Strength + Outrage', difficulty: 7 },
      { level: 4 as DotRating, name: 'Death\'s Touch', description: 'Deal lethal damage to the living', pathosCost: 3, willpowerCost: 0, dicePool: 'Strength + Outrage', difficulty: 8 },
      { level: 5 as DotRating, name: 'Obliviate', description: 'Unleash devastating destructive force across the Shroud', pathosCost: 5, willpowerCost: 1, dicePool: 'Strength + Outrage', difficulty: 9 },
    ],
  },
  pandemonium: {
    displayName: 'Pandemonium',
    levels: [
      { level: 1 as DotRating, name: 'Befuddlement', description: 'Cause minor confusion and distraction', pathosCost: 1, willpowerCost: 0, dicePool: 'Manipulation + Pandemonium', difficulty: 6 },
      { level: 2 as DotRating, name: 'Foul Humour', description: 'Create unpleasant sensory phenomena', pathosCost: 1, willpowerCost: 0, dicePool: 'Manipulation + Pandemonium', difficulty: 6, duration: '1 scene' },
      { level: 3 as DotRating, name: 'Dark Ether', description: 'Fill an area with darkness, cold, or dread', pathosCost: 2, willpowerCost: 0, dicePool: 'Wits + Pandemonium', difficulty: 7, duration: '1 scene' },
      { level: 4 as DotRating, name: 'Wildfires', description: 'Create phantom fires and impossible phenomena', pathosCost: 3, willpowerCost: 0, dicePool: 'Manipulation + Pandemonium', difficulty: 8, duration: '1 scene' },
      { level: 5 as DotRating, name: 'Maelstrom', description: 'Unleash total reality-bending chaos in an area', pathosCost: 5, willpowerCost: 1, dicePool: 'Wits + Pandemonium', difficulty: 9, duration: '1 scene' },
    ],
  },
  phantasm: {
    displayName: 'Phantasm',
    levels: [
      { level: 1 as DotRating, name: 'Sleepsense', description: 'Detect nearby sleeping or dreaming beings', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Phantasm', difficulty: 6 },
      { level: 2 as DotRating, name: 'Dreamstep', description: 'Enter the dreams of a sleeping target', pathosCost: 1, willpowerCost: 0, dicePool: 'Wits + Phantasm', difficulty: 7 },
      { level: 3 as DotRating, name: 'Dream Shaping', description: 'Modify and control elements within a dream', pathosCost: 2, willpowerCost: 0, dicePool: 'Manipulation + Phantasm', difficulty: 7, duration: '1 dream' },
      { level: 4 as DotRating, name: 'Phantasmagoria', description: 'Create shared dream experiences for multiple targets', pathosCost: 3, willpowerCost: 0, dicePool: 'Charisma + Phantasm', difficulty: 8, duration: '1 dream' },
      { level: 5 as DotRating, name: 'Dreamscape', description: 'Permanently alter dreamscapes or pull dreamers into the Tempest', pathosCost: 5, willpowerCost: 1, dicePool: 'Manipulation + Phantasm', difficulty: 9 },
    ],
  },
  puppetry: {
    displayName: 'Puppetry',
    levels: [
      { level: 1 as DotRating, name: 'Skinride', description: 'Ride along passively within a living host', pathosCost: 1, willpowerCost: 0, dicePool: 'Manipulation + Puppetry', difficulty: 6, duration: '1 scene' },
      { level: 2 as DotRating, name: 'Master\'s Voice', description: 'Speak through the host\'s mouth', pathosCost: 1, willpowerCost: 0, dicePool: 'Manipulation + Puppetry', difficulty: 7 },
      { level: 3 as DotRating, name: 'Seizure', description: 'Control the host\'s body briefly', pathosCost: 2, willpowerCost: 0, dicePool: 'Charisma + Puppetry', difficulty: 7, duration: '1 turn per success' },
      { level: 4 as DotRating, name: 'Dominate', description: 'Take full control of the host', pathosCost: 3, willpowerCost: 1, dicePool: 'Charisma + Puppetry', difficulty: 8, duration: '1 scene' },
      { level: 5 as DotRating, name: 'Fusion', description: 'Completely merge with the host, gaining full access', pathosCost: 5, willpowerCost: 1, dicePool: 'Manipulation + Puppetry', difficulty: 9, duration: '1 scene' },
    ],
  },
  usury: {
    displayName: 'Usury',
    levels: [
      { level: 1 as DotRating, name: 'Assess', description: 'Determine how much Pathos a target has', pathosCost: 0, willpowerCost: 0, dicePool: 'Perception + Usury', difficulty: 6 },
      { level: 2 as DotRating, name: 'Charitable Trust', description: 'Transfer Pathos to another wraith', pathosCost: 0, willpowerCost: 0, dicePool: 'Manipulation + Usury', difficulty: 6 },
      { level: 3 as DotRating, name: 'Early Withdrawal', description: 'Drain Pathos from a target', pathosCost: 0, willpowerCost: 0, dicePool: 'Manipulation + Usury', difficulty: 7 },
      { level: 4 as DotRating, name: 'Investment', description: 'Store Pathos in objects or locations', pathosCost: 0, willpowerCost: 0, dicePool: 'Intelligence + Usury', difficulty: 7, duration: 'permanent' },
      { level: 5 as DotRating, name: 'Liquidate', description: 'Convert other energy sources to Pathos', pathosCost: 0, willpowerCost: 1, dicePool: 'Intelligence + Usury', difficulty: 8 },
    ],
  },
};

// ─── Arcanos Lookup ────────────────────────────────────────────────

/**
 * Get the definition for a specific Arcanos level.
 */
export function getArcanosLevel(
  arcanosName: string,
  level: number,
): ArcanosLevel | null {
  const arcanos = ARCANOI_DEFINITIONS[arcanosName];
  if (!arcanos) return null;
  return arcanos.levels.find((l) => l.level === level) ?? null;
}

/**
 * Get all level definitions for a named Arcanos.
 */
export function getArcanosDefinition(arcanosName: string): {
  displayName: string;
  levels: ArcanosLevel[];
} | null {
  return ARCANOI_DEFINITIONS[arcanosName] ?? null;
}

// ─── Activation Checks ────────────────────────────────────────────

/**
 * Check whether a character can activate an Arcanos at a given level.
 * Checks: character has the Arcanos at the required rating,
 * and has sufficient Pathos and Willpower.
 */
export function canActivateArcanos(
  character: Character,
  arcanosName: ArcanosName,
  level: number,
): { canActivate: boolean; reason?: string } {
  // Check character has the arcanos at required rating
  const charArcanos = character.arcanoi.find((a) => a.name === arcanosName);
  if (!charArcanos) {
    return { canActivate: false, reason: `Character does not have ${arcanosName}` };
  }
  if (charArcanos.rating < level) {
    return {
      canActivate: false,
      reason: `${arcanosName} rating ${charArcanos.rating} is below required level ${level}`,
    };
  }

  // Check power definition exists
  const power = getArcanosLevel(arcanosName, level);
  if (!power) {
    return { canActivate: false, reason: `No power definition for ${arcanosName} level ${level}` };
  }

  // Check Pathos
  if (character.resources.pathos.current < power.pathosCost) {
    return {
      canActivate: false,
      reason: `Insufficient Pathos: need ${power.pathosCost}, have ${character.resources.pathos.current}`,
    };
  }

  // Check Willpower
  if (power.willpowerCost > 0 && character.resources.willpower.temporary < power.willpowerCost) {
    return {
      canActivate: false,
      reason: `Insufficient Willpower: need ${power.willpowerCost}, have ${character.resources.willpower.temporary}`,
    };
  }

  return { canActivate: true };
}

/**
 * Activate an Arcanos power. Deducts costs, rolls the dice pool, returns result.
 *
 * The `dicePoolSize` parameter should be pre-computed by the caller
 * based on the power's dicePool string and the character's stats.
 */
export function activateArcanos(
  character: Character,
  arcanosName: ArcanosName,
  level: number,
  dicePoolSize: number,
  rng?: () => number,
): ArcanosActivationResult | null {
  const check = canActivateArcanos(character, arcanosName, level);
  if (!check.canActivate) return null;

  const power = getArcanosLevel(arcanosName, level)!;

  // Deduct Pathos
  let resources = character.resources;
  if (power.pathosCost > 0) {
    const afterPathos = spendPathos(resources, power.pathosCost);
    if (!afterPathos) return null;
    resources = afterPathos;
  }

  // Deduct Willpower
  if (power.willpowerCost > 0) {
    const afterWP = spendWillpower(resources, power.willpowerCost);
    if (!afterWP) return null;
    resources = afterWP;
  }

  // Roll the dice pool
  const roll = rollPool(dicePoolSize, power.difficulty, false, rng);

  return {
    arcanosName,
    levelUsed: level,
    powerName: power.name,
    roll,
    success: roll.successes > 0 && !roll.isBotch,
    resourcesAfter: resources,
    pathosCost: power.pathosCost,
    willpowerCost: power.willpowerCost,
    effect: power.description,
  };
}

// ─── Available Arcanoi ─────────────────────────────────────────────

/**
 * Get a list of all powers the character can currently activate,
 * considering their Arcanoi ratings and current resources.
 */
export function getAvailableArcanoi(
  character: Character,
): Array<{
  arcanosName: ArcanosName;
  level: number;
  powerName: string;
  pathosCost: number;
  willpowerCost: number;
}> {
  const available: Array<{
    arcanosName: ArcanosName;
    level: number;
    powerName: string;
    pathosCost: number;
    willpowerCost: number;
  }> = [];

  for (const charArcanos of character.arcanoi) {
    const def = ARCANOI_DEFINITIONS[charArcanos.name];
    if (!def) continue;

    for (const power of def.levels) {
      if (power.level > charArcanos.rating) continue;

      const check = canActivateArcanos(character, charArcanos.name, power.level);
      if (check.canActivate) {
        available.push({
          arcanosName: charArcanos.name,
          level: power.level,
          powerName: power.name,
          pathosCost: power.pathosCost,
          willpowerCost: power.willpowerCost,
        });
      }
    }
  }

  return available;
}
