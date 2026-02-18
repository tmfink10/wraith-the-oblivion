// Character creation point allocations
export const ATTRIBUTE_POINTS = { primary: 7, secondary: 5, tertiary: 3 } as const;
export const ABILITY_POINTS = { primary: 13, secondary: 9, tertiary: 5 } as const;
export const ARCANOI_POINTS = 5;
export const BACKGROUND_POINTS = 5;
export const PASSION_POINTS = 5;
export const FETTER_POINTS = 10;
export const STARTING_WILLPOWER = 5;
export const STARTING_PATHOS_BASE = 5;
export const FREEBIE_POINTS = 15;
export const MAX_SHADOW_FREEBIE_TRADE = 7;

// Max ability rating at creation (can go to 5 with freebie/XP)
export const MAX_ABILITY_AT_CREATION = 3;

// Freebie point costs
export const FREEBIE_COSTS = {
  attributes: 5,
  abilities: 2,
  arcanoi: 5,
  backgrounds: 1,
  passions: 2,
  fetters: 2,
  willpower: 2,
} as const;

// XP costs (multiply by current rating)
export const XP_COSTS = {
  attributes: 4,       // current × 4
  abilities: 1,        // current × 1 (or 3 for new)
  arcanoi: 7,          // current × 7
  backgrounds: 3,      // current × 3
  willpower: 3,        // current × 3
  newAbility: 3,
} as const;

// THD experience templates
export const EXPERIENCE_TEMPLATES = {
  standard: {
    attributes: { primary: 7, secondary: 5, tertiary: 3 },
    abilities: { primary: 13, secondary: 9, tertiary: 5 },
    arcanoi: 5,
    backgrounds: 5,
    passions: 5,
    fetters: 10,
    freebiePoints: 15,
  },
  experienced: {
    attributes: { primary: 8, secondary: 6, tertiary: 4 },
    abilities: { primary: 14, secondary: 10, tertiary: 7 },
    arcanoi: 8,
    backgrounds: 10,
    passions: 10,
    fetters: 10,
    freebiePoints: 18,
  },
  old: {
    attributes: { primary: 9, secondary: 7, tertiary: 5 },
    abilities: { primary: 17, secondary: 15, tertiary: 10 },
    arcanoi: 12,
    backgrounds: 12,
    passions: 7,
    fetters: 7,
    freebiePoints: 25,
  },
  ancient: {
    attributes: { primary: 12, secondary: 8, tertiary: 6 },
    abilities: { primary: 20, secondary: 16, tertiary: 13 },
    arcanoi: 18,
    backgrounds: 15,
    passions: 5,
    fetters: 5,
    freebiePoints: 35,
  },
} as const;

// Dice defaults
export const DEFAULT_DIFFICULTY = 6;
export const MIN_DIFFICULTY = 2;
export const MAX_DIFFICULTY = 10;
export const MAX_DOT_RATING = 5;
export const MAX_RESOURCE_RATING = 10;

// Wound track (standard 7 levels)
export const WOUND_LEVELS = [
  { name: 'Bruised', penalty: 0 },
  { name: 'Hurt', penalty: -1 },
  { name: 'Injured', penalty: -1 },
  { name: 'Wounded', penalty: -2 },
  { name: 'Mauled', penalty: -2 },
  { name: 'Crippled', penalty: -5 },
  { name: 'Incapacitated', penalty: 0 }, // can't act
] as const;

// Difficulty descriptions
export const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  2: 'Trivial',
  3: 'Easy',
  4: 'Routine',
  5: 'Straightforward',
  6: 'Challenging',
  7: 'Difficult',
  8: 'Very Difficult',
  9: 'Nearly Impossible',
  10: 'Impossible',
};
