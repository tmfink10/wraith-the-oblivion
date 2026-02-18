import { v4 as uuidv4 } from 'uuid';
import type {
  Character,
  CharacterCreationState,
  CharacterCreationStep,
  ExperienceTemplate,
  Attributes,
  Abilities,
  Talents,
  Skills,
  Knowledges,
  PhysicalAttributes,
  SocialAttributes,
  MentalAttributes,
  AttributeCategory,
  AbilityCategory,
  Priority,
  DotRating,
  ExtendedDotRating,
  Background,
  Passion,
  Fetter,
  WoundLevel,
  Resources,
} from '../types/character.js';
import type { ArcanosRating } from '../types/arcanoi.js';
import type { Shadow } from '../types/shadow.js';
import {
  FREEBIE_COSTS,
  EXPERIENCE_TEMPLATES,
  MAX_ABILITY_AT_CREATION,
  MAX_DOT_RATING,
  STARTING_PATHOS_BASE,
  STARTING_WILLPOWER,
  WOUND_LEVELS,
} from '../constants.js';

// ─── Default / Empty Structures ───────────────────────────────────

export function createEmptyPhysicalAttributes(): PhysicalAttributes {
  return { strength: 1, dexterity: 1, stamina: 1 };
}

export function createEmptySocialAttributes(): SocialAttributes {
  return { charisma: 1, manipulation: 1, appearance: 1 };
}

export function createEmptyMentalAttributes(): MentalAttributes {
  return { perception: 1, intelligence: 1, wits: 1 };
}

export function createEmptyAttributes(): Attributes {
  return {
    physical: createEmptyPhysicalAttributes(),
    social: createEmptySocialAttributes(),
    mental: createEmptyMentalAttributes(),
  };
}

export function createEmptyTalents(): Talents {
  return {
    alertness: 0, athletics: 0, awareness: 0, brawl: 0, dodge: 0,
    empathy: 0, expression: 0, intimidation: 0, streetwise: 0, subterfuge: 0,
  };
}

export function createEmptySkills(): Skills {
  return {
    animalKen: 0, archery: 0, drive: 0, firearms: 0, larceny: 0,
    leadership: 0, melee: 0, performance: 0, stealth: 0, survival: 0,
  };
}

export function createEmptyKnowledges(): Knowledges {
  return {
    bureaucracy: 0, cosmology: 0, cryptography: 0, hypnosis: 0,
    investigation: 0, linguistics: 0, medicine: 0, metallurgy: 0,
    occult: 0, politics: 0, science: 0, technology: 0,
  };
}

export function createEmptyAbilities(): Abilities {
  return {
    talents: createEmptyTalents(),
    skills: createEmptySkills(),
    knowledges: createEmptyKnowledges(),
  };
}

export function createEmptyShadow(): Shadow {
  return {
    archetype: '',
    angst: { permanent: 1, temporary: 0 },
    darkPassions: [],
    thorns: [],
    freebiePointsSpent: 0,
  };
}

export function createDefaultWoundTrack(): WoundLevel[] {
  return WOUND_LEVELS.map((level) => ({
    name: level.name,
    penalty: level.penalty,
    filled: false,
  }));
}

export function createDefaultResources(memoriam: number = 0): Resources {
  const pathosMax = Math.min(10, STARTING_PATHOS_BASE + memoriam) as ExtendedDotRating;
  return {
    corpus: { max: 10, current: 10 },
    pathos: { max: pathosMax, current: pathosMax },
    willpower: { permanent: STARTING_WILLPOWER as ExtendedDotRating, temporary: STARTING_WILLPOWER as ExtendedDotRating },
  };
}

// ─── Character Creation State ─────────────────────────────────────

export function createCharacterCreationState(
  template: ExperienceTemplate = 'standard',
): CharacterCreationState {
  const templateData = EXPERIENCE_TEMPLATES[template];
  return {
    step: 'concept',
    template,
    attributePriorities: {
      physical: 'primary',
      social: 'secondary',
      mental: 'tertiary',
    },
    abilityPriorities: {
      talents: 'primary',
      skills: 'secondary',
      knowledges: 'tertiary',
    },
    freebiePointsRemaining: templateData.freebiePoints,
    character: {
      id: uuidv4(),
      experienceTemplate: template,
      attributes: createEmptyAttributes(),
      abilities: createEmptyAbilities(),
      backgrounds: [],
      arcanoi: [],
      passions: [],
      fetters: [],
      resources: createDefaultResources(),
      woundTrack: createDefaultWoundTrack(),
      shadow: createEmptyShadow(),
      experience: { total: 0, spent: 0, available: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ─── Point Allocation Helpers ─────────────────────────────────────

/**
 * Get the number of points available for a given attribute category
 * based on its priority and experience template.
 */
export function getAttributePoints(
  priority: Priority,
  template: ExperienceTemplate = 'standard',
): number {
  const t = EXPERIENCE_TEMPLATES[template].attributes;
  return t[priority];
}

export function getAbilityPoints(
  priority: Priority,
  template: ExperienceTemplate = 'standard',
): number {
  const t = EXPERIENCE_TEMPLATES[template].abilities;
  return t[priority];
}

/**
 * Count total dots spent in a category of attributes.
 * Attributes start at 1, so we subtract 1 per attribute to get "dots spent."
 */
export function countAttributeDotsSpent(attrs: PhysicalAttributes | SocialAttributes | MentalAttributes): number {
  return Object.values(attrs).reduce((sum, val) => sum + (val - 1), 0);
}

export function countAbilityDotsSpent(abilityGroup: Record<string, number>): number {
  return Object.values(abilityGroup).reduce((sum, val) => sum + val, 0);
}

export function countBackgroundDotsSpent(backgrounds: Background[]): number {
  return backgrounds.reduce((sum, bg) => sum + bg.rating, 0);
}

export function countArcanoidotsSpent(arcanoi: ArcanosRating[]): number {
  return arcanoi.reduce((sum, a) => sum + a.rating, 0);
}

export function countPassionDotsSpent(passions: Passion[]): number {
  return passions.reduce((sum, p) => sum + p.rating, 0);
}

export function countFetterDotsSpent(fetters: Fetter[]): number {
  return fetters.reduce((sum, f) => sum + f.rating, 0);
}

// ─── Validation ───────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAttributeAllocation(
  attributes: Attributes,
  priorities: Record<AttributeCategory, Priority>,
  template: ExperienceTemplate = 'standard',
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const categories: AttributeCategory[] = ['physical', 'social', 'mental'];

  for (const cat of categories) {
    const priority = priorities[cat];
    const allowed = getAttributePoints(priority, template);
    const spent = countAttributeDotsSpent(attributes[cat]);

    if (spent > allowed) {
      errors.push(`${cat} attributes: spent ${spent}/${allowed} dots (over by ${spent - allowed})`);
    } else if (spent < allowed) {
      warnings.push(`${cat} attributes: only spent ${spent}/${allowed} dots`);
    }

    // Check max per attribute (5)
    for (const [key, val] of Object.entries(attributes[cat])) {
      if (val > MAX_DOT_RATING) {
        errors.push(`${key} exceeds maximum of ${MAX_DOT_RATING}`);
      }
    }
  }

  // Check priorities are unique
  const priorityValues = Object.values(priorities);
  if (new Set(priorityValues).size !== 3) {
    errors.push('Each attribute category must have a unique priority (primary/secondary/tertiary)');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function validateAbilityAllocation(
  abilities: Abilities,
  priorities: Record<AbilityCategory, Priority>,
  template: ExperienceTemplate = 'standard',
  maxAtCreation: number = MAX_ABILITY_AT_CREATION,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const categories: AbilityCategory[] = ['talents', 'skills', 'knowledges'];

  for (const cat of categories) {
    const priority = priorities[cat];
    const allowed = getAbilityPoints(priority, template);
    const spent = countAbilityDotsSpent(abilities[cat]);

    if (spent > allowed) {
      errors.push(`${cat}: spent ${spent}/${allowed} dots (over by ${spent - allowed})`);
    } else if (spent < allowed) {
      warnings.push(`${cat}: only spent ${spent}/${allowed} dots`);
    }

    // Check max per ability at creation
    for (const [key, val] of Object.entries(abilities[cat])) {
      if (val > maxAtCreation) {
        errors.push(`${key} exceeds creation maximum of ${maxAtCreation} (use freebie points for 4-5)`);
      }
    }
  }

  const priorityValues = Object.values(priorities);
  if (new Set(priorityValues).size !== 3) {
    errors.push('Each ability category must have a unique priority');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function validateAdvantages(
  backgrounds: Background[],
  arcanoi: ArcanosRating[],
  passions: Passion[],
  fetters: Fetter[],
  template: ExperienceTemplate = 'standard',
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const t = EXPERIENCE_TEMPLATES[template];

  const bgSpent = countBackgroundDotsSpent(backgrounds);
  if (bgSpent > t.backgrounds) {
    errors.push(`Backgrounds: spent ${bgSpent}/${t.backgrounds}`);
  } else if (bgSpent < t.backgrounds) {
    warnings.push(`Backgrounds: only spent ${bgSpent}/${t.backgrounds}`);
  }

  const arcSpent = countArcanoidotsSpent(arcanoi);
  if (arcSpent > t.arcanoi) {
    errors.push(`Arcanoi: spent ${arcSpent}/${t.arcanoi}`);
  } else if (arcSpent < t.arcanoi) {
    warnings.push(`Arcanoi: only spent ${arcSpent}/${t.arcanoi}`);
  }

  const passionSpent = countPassionDotsSpent(passions);
  if (passionSpent > t.passions) {
    errors.push(`Passions: spent ${passionSpent}/${t.passions}`);
  } else if (passionSpent < t.passions) {
    warnings.push(`Passions: only spent ${passionSpent}/${t.passions}`);
  }

  const fetterSpent = countFetterDotsSpent(fetters);
  if (fetterSpent > t.fetters) {
    errors.push(`Fetters: spent ${fetterSpent}/${t.fetters}`);
  } else if (fetterSpent < t.fetters) {
    warnings.push(`Fetters: only spent ${fetterSpent}/${t.fetters}`);
  }

  // Check individual maximums (5 per background/arcanos)
  for (const bg of backgrounds) {
    if (bg.rating > MAX_DOT_RATING) {
      errors.push(`Background "${bg.name}" exceeds max of ${MAX_DOT_RATING}`);
    }
  }
  for (const arc of arcanoi) {
    if (arc.rating > MAX_DOT_RATING) {
      errors.push(`Arcanos "${arc.name}" exceeds max of ${MAX_DOT_RATING}`);
    }
  }
  for (const p of passions) {
    if (p.rating > MAX_DOT_RATING) {
      errors.push(`Passion "${p.description}" exceeds max of ${MAX_DOT_RATING}`);
    }
  }
  for (const f of fetters) {
    if (f.rating > MAX_DOT_RATING) {
      errors.push(`Fetter "${f.description}" exceeds max of ${MAX_DOT_RATING}`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ─── Freebie Point Spending ───────────────────────────────────────

export type FreebieTarget =
  | { type: 'attribute'; category: AttributeCategory; key: string }
  | { type: 'ability'; category: AbilityCategory; key: string }
  | { type: 'arcanos'; name: string }
  | { type: 'background'; name: string }
  | { type: 'passion'; id: string }
  | { type: 'fetter'; id: string }
  | { type: 'willpower' }
  | { type: 'shadow_trade'; points: number };

export function getFreebiePointCost(target: FreebieTarget): number {
  switch (target.type) {
    case 'attribute': return FREEBIE_COSTS.attributes;
    case 'ability': return FREEBIE_COSTS.abilities;
    case 'arcanos': return FREEBIE_COSTS.arcanoi;
    case 'background': return FREEBIE_COSTS.backgrounds;
    case 'passion': return FREEBIE_COSTS.passions;
    case 'fetter': return FREEBIE_COSTS.fetters;
    case 'willpower': return FREEBIE_COSTS.willpower;
    case 'shadow_trade': return -target.points; // Gives freebie points
    default: return 0;
  }
}

// ─── Full Character Validation ────────────────────────────────────

export function validateCharacter(
  character: Partial<Character>,
  state: CharacterCreationState,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Concept checks
  if (!character.name?.trim()) errors.push('Character name is required');
  if (!character.concept?.trim()) errors.push('Character concept is required');
  if (!character.nature) errors.push('Nature archetype is required');
  if (!character.demeanor) errors.push('Demeanor archetype is required');
  if (!character.causeOfDeath) errors.push('Cause of death is required');

  // Attribute validation
  if (character.attributes) {
    const attrResult = validateAttributeAllocation(
      character.attributes,
      state.attributePriorities,
      state.template,
    );
    errors.push(...attrResult.errors);
    warnings.push(...attrResult.warnings);
  }

  // Ability validation
  if (character.abilities) {
    const abilResult = validateAbilityAllocation(
      character.abilities,
      state.abilityPriorities,
      state.template,
    );
    errors.push(...abilResult.errors);
    warnings.push(...abilResult.warnings);
  }

  // Advantages validation
  if (character.backgrounds && character.arcanoi && character.passions && character.fetters) {
    const advResult = validateAdvantages(
      character.backgrounds,
      character.arcanoi,
      character.passions,
      character.fetters,
      state.template,
    );
    errors.push(...advResult.errors);
    warnings.push(...advResult.warnings);
  }

  // Shadow validation
  if (character.shadow) {
    if (!character.shadow.archetype) {
      errors.push('Shadow archetype is required');
    }
    if (character.shadow.darkPassions.length === 0) {
      warnings.push('Shadow has no Dark Passions');
    }
  }

  // Freebie points
  if (state.freebiePointsRemaining < 0) {
    errors.push(`Overspent freebie points by ${Math.abs(state.freebiePointsRemaining)}`);
  } else if (state.freebiePointsRemaining > 0) {
    warnings.push(`${state.freebiePointsRemaining} freebie points remaining`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ─── Build Final Character ────────────────────────────────────────

export function finalizeCharacter(
  state: CharacterCreationState,
): Character {
  const c = state.character;

  // Calculate Pathos based on Memoriam
  const memoriam = c.backgrounds?.find(b => b.name === 'memoriam')?.rating ?? 0;
  const resources = createDefaultResources(memoriam);

  // Apply willpower from state if modified
  if (c.resources?.willpower) {
    resources.willpower = c.resources.willpower;
  }

  const now = new Date().toISOString();

  return {
    id: c.id || uuidv4(),
    name: c.name || '',
    player: c.player || '',
    concept: c.concept || '',
    nature: c.nature || '',
    demeanor: c.demeanor || '',
    causeOfDeath: c.causeOfDeath || 'mystery',
    legion: c.legion || 'paupers',
    guild: c.guild,
    experienceTemplate: state.template,
    attributes: c.attributes || createEmptyAttributes(),
    abilities: c.abilities || createEmptyAbilities(),
    backgrounds: c.backgrounds || [],
    arcanoi: c.arcanoi || [],
    passions: c.passions || [],
    fetters: c.fetters || [],
    resources,
    woundTrack: c.woundTrack || createDefaultWoundTrack(),
    shadow: c.shadow || createEmptyShadow(),
    experience: c.experience || { total: 0, spent: 0, available: 0 },
    age: c.age,
    upbringing: c.upbringing,
    occupation: c.occupation,
    regret: c.regret,
    haunt: c.haunt,
    createdAt: c.createdAt || now,
    updatedAt: now,
  };
}

// ─── Creation Step Navigation ─────────────────────────────────────

const STEP_ORDER: CharacterCreationStep[] = [
  'concept', 'attributes', 'abilities', 'advantages', 'shadow', 'finishing',
];

export function getNextStep(current: CharacterCreationStep): CharacterCreationStep | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

export function getPreviousStep(current: CharacterCreationStep): CharacterCreationStep | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx > 0 ? STEP_ORDER[idx - 1] : null;
}

export function getStepIndex(step: CharacterCreationStep): number {
  return STEP_ORDER.indexOf(step);
}

export function getTotalSteps(): number {
  return STEP_ORDER.length;
}
