import type { DotRating, ExtendedDotRating } from './character.js';

export interface Shadow {
  archetype: ShadowArchetypeName;
  angst: {
    permanent: ExtendedDotRating;
    temporary: number;
  };
  darkPassions: DarkPassion[];
  thorns: Thorn[];
  freebiePointsSpent: number;
}

export type ShadowArchetypeName = string;

export interface DarkPassion {
  id: string;
  description: string;
  emotion: string;
  rating: DotRating;
}

export interface Thorn {
  name: ThornName;
  rating: DotRating;
  description?: string;
}

export type ThornName =
  | 'aura_of_corruption'
  | 'bad_luck'
  | 'dark_allies'
  | 'deaths_sigil'
  | 'devils_dare'
  | 'freudian_slip'
  | 'honeyed_tongue'
  | 'infamy'
  | 'manifestation'
  | 'mirror_mirror'
  | 'nightmares'
  | 'pact_of_doom'
  | 'shadow_call'
  | 'shadow_familiar'
  | 'shadow_life'
  | 'shadowed_face'
  | 'spectre_prestige'
  | 'tainted_relic'
  | 'trick_of_the_light'
  | 'vampiric_nature'
  | 'whispers';

export interface ShadowArchetype {
  name: string;
  source: 'corebook' | 'players_guide' | 'shadow_players_guide';
  description: string;
}

export interface CatharsisTrigger {
  type: 'corpus_destroyed' | 'fetter_lost' | 'passion_lost' | 'willpower_zero' | 'trauma';
  difficulty: number;
}
