import type { DotRating } from './character.js';

export interface ArcanosRating {
  name: ArcanosName;
  rating: DotRating;
}

export type ArcanosName =
  // Common Western Arcanoi
  | 'argos'
  | 'castigate'
  | 'embody'
  | 'fatalism'
  | 'flux'
  | 'inhabit'
  | 'intimation'
  | 'keening'
  | 'lifeweb'
  | 'mnemosynis'
  | 'moliate'
  | 'outrage'
  | 'pandemonium'
  | 'phantasm'
  | 'puppetry'
  | 'usury'
  // Non-Western Arcanoi
  | 'way_of_the_scholar'
  | 'way_of_the_artisan'
  | 'way_of_the_farmer'
  | 'way_of_the_merchant'
  | 'way_of_the_soul'
  | 'chains_of_the_emperor'
  | 'tvashtriya'
  | 'moriman';

export type DarkArcanosName =
  | 'collogue'
  | 'contaminate'
  | 'corruption'
  | 'dark_larceny'
  | 'maleficence'
  | 'shroud_rending'
  | 'tempestos'
  | 'tempest_weaving';

export type ShadecraftName =
  | 'chameleon_parasite'
  | 'ectoplasmic_tentacles'
  | 'hound_the_harrowed'
  | 'imprison'
  | 'miasmal_breath'
  | 'numb_the_heart'
  | 'pathos_drain'
  | 'rend_the_lifeweb'
  | 'sharks_teeth'
  | 'siphon_emotion'
  | 'spectral_scream'
  | 'stampede'
  | 'talons'
  | 'tempest_wrack';

export interface ArcanosLevel {
  level: DotRating;
  name: string;
  description: string;
  pathosCost: number;
  willpowerCost: number;
  dicePool: string;
  difficulty: number;
  duration?: string;
}

export interface ArcanosDefinition {
  name: ArcanosName;
  displayName: string;
  guild: GuildName;
  description: string;
  levels: ArcanosLevel[];
}

export type GuildName =
  | 'harbingers'
  | 'pardoners'
  | 'proctors'
  | 'oracles'
  | 'alchemists'
  | 'artificers'
  | 'solicitors'
  | 'chanteurs'
  | 'monitors'
  | 'mnemoi'
  | 'masquers'
  | 'spooks'
  | 'sandmen'
  | 'puppeteers'
  | 'usurers';
