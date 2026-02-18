import type { Shadow } from './shadow.js';
import type { ArcanosRating } from './arcanoi.js';

// Dot rating: 0-5 for standard, 0-10 for resources
export type DotRating = 0 | 1 | 2 | 3 | 4 | 5;
export type ExtendedDotRating = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type AttributeCategory = 'physical' | 'social' | 'mental';
export type AbilityCategory = 'talents' | 'skills' | 'knowledges';
export type Priority = 'primary' | 'secondary' | 'tertiary';

export interface PhysicalAttributes {
  strength: DotRating;
  dexterity: DotRating;
  stamina: DotRating;
}

export interface SocialAttributes {
  charisma: DotRating;
  manipulation: DotRating;
  appearance: DotRating;
}

export interface MentalAttributes {
  perception: DotRating;
  intelligence: DotRating;
  wits: DotRating;
}

export interface Attributes {
  physical: PhysicalAttributes;
  social: SocialAttributes;
  mental: MentalAttributes;
}

export interface Talents {
  alertness: DotRating;
  athletics: DotRating;
  awareness: DotRating;
  brawl: DotRating;
  dodge: DotRating;
  empathy: DotRating;
  expression: DotRating;
  intimidation: DotRating;
  streetwise: DotRating;
  subterfuge: DotRating;
}

export interface Skills {
  animalKen: DotRating;
  archery: DotRating;
  drive: DotRating;
  firearms: DotRating;
  larceny: DotRating;
  leadership: DotRating;
  melee: DotRating;
  performance: DotRating;
  stealth: DotRating;
  survival: DotRating;
}

export interface Knowledges {
  bureaucracy: DotRating;
  cosmology: DotRating;
  cryptography: DotRating;
  hypnosis: DotRating;
  investigation: DotRating;
  linguistics: DotRating;
  medicine: DotRating;
  metallurgy: DotRating;
  occult: DotRating;
  politics: DotRating;
  science: DotRating;
  technology: DotRating;
}

export interface Abilities {
  talents: Talents;
  skills: Skills;
  knowledges: Knowledges;
}

export interface Passion {
  id: string;
  description: string;
  emotion: string;
  rating: DotRating;
}

export interface Fetter {
  id: string;
  description: string;
  type: FetterType;
  rating: DotRating;
}

export type FetterType =
  | 'relative'
  | 'friend_foe'
  | 'place'
  | 'possession'
  | 'cause_of_death'
  | 'loved_one'
  | 'place_of_death'
  | 'childhood_home'
  | 'symbolic_fragment'
  | 'personal_document';

export interface Background {
  name: BackgroundName;
  rating: DotRating;
  description?: string;
}

export type BackgroundName =
  | 'allies'
  | 'eidolon'
  | 'eminence'
  | 'haunt'
  | 'legacy'
  | 'mentor'
  | 'memoriam'
  | 'notoriety'
  | 'relic'
  | 'status';

export interface Resources {
  corpus: {
    max: ExtendedDotRating;
    current: ExtendedDotRating;
  };
  pathos: {
    max: ExtendedDotRating;
    current: ExtendedDotRating;
  };
  willpower: {
    permanent: ExtendedDotRating;
    temporary: ExtendedDotRating;
  };
}

export type ArchetypeName = string;

export type CauseOfDeath =
  | 'old_age'
  | 'disease'
  | 'violence'
  | 'madness'
  | 'happenstance'
  | 'despair'
  | 'mystery'
  | 'fate';

export type LegionName =
  | 'iron'
  | 'skeletal'
  | 'grim'
  | 'penitent'
  | 'emerald'
  | 'silent'
  | 'paupers'
  | 'fate';

export type ExperienceTemplate = 'standard' | 'experienced' | 'old' | 'ancient';

export interface WoundLevel {
  name: string;
  penalty: number;
  filled: boolean;
  damageType?: 'bashing' | 'lethal' | 'aggravated';
}

export interface Character {
  id: string;
  userId?: string;
  name: string;
  player: string;
  concept: string;
  nature: ArchetypeName;
  demeanor: ArchetypeName;
  causeOfDeath: CauseOfDeath;
  legion: LegionName;
  guild?: string;
  experienceTemplate: ExperienceTemplate;

  attributes: Attributes;
  abilities: Abilities;
  backgrounds: Background[];
  arcanoi: ArcanosRating[];
  passions: Passion[];
  fetters: Fetter[];
  resources: Resources;
  woundTrack: WoundLevel[];

  shadow: Shadow;

  experience: {
    total: number;
    spent: number;
    available: number;
  };

  // THD additions
  age?: string;
  upbringing?: string;
  occupation?: string;
  regret?: string;
  haunt?: {
    type: string;
    size: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CharacterCreationState {
  step: CharacterCreationStep;
  template: ExperienceTemplate;
  attributePriorities: Record<AttributeCategory, Priority>;
  abilityPriorities: Record<AbilityCategory, Priority>;
  freebiePointsRemaining: number;
  character: Partial<Character>;
}

export type CharacterCreationStep =
  | 'concept'
  | 'attributes'
  | 'abilities'
  | 'advantages'
  | 'shadow'
  | 'finishing';
