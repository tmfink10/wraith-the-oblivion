import type { Shadow, ThornName } from '../../types/shadow.js';
import type { ShadowDiceOffer } from '../../types/solo.js';
import { THORNS } from '../../data/thorns.js';

// ─── Types ─────────────────────────────────────────────────────────

export type ShadowInterjectionType =
  | 'dark_comment'
  | 'coerce_dark_passion'
  | 'use_thorn'
  | 'offer_dice'
  | 'whisper_doubt';

export interface ShadowInterjection {
  /** The type of interjection */
  type: ShadowInterjectionType;
  /** Human-readable description of what the Shadow does */
  description: string;
  /** If type is 'use_thorn', which thorn is activated */
  thornUsed?: ThornName;
  /** If type is 'coerce_dark_passion', which passion index */
  darkPassionIndex?: number;
  /** If type is 'offer_dice', the dice offer details */
  diceOffer?: Omit<ShadowDiceOffer, 'accepted'>;
}

// ─── Helpers ───────────────────────────────────────────────────────

function defaultRng(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Generate a dark comment flavored by the Shadow archetype.
 */
function generateDarkComment(
  archetype: string,
  oblivionValue: number,
): string {
  const comments: Record<string, string[]> = {
    'The Monster': [
      'The Shadow snarls: "Let me show them what real fear looks like."',
      'A cruel laugh echoes in your mind. "They deserve what\'s coming."',
    ],
    'The Director': [
      'The Shadow sighs: "If only you\'d listen to me, this would go so much smoother."',
      '"I can see all the ways this goes wrong for you. Shall I enumerate them?"',
    ],
    'The Leech': [
      '"You need me more than you know. Let me take the wheel."',
      'The Shadow purrs: "They have so much. You have so little. Take it."',
    ],
    'The Martyr': [
      '"After everything I\'ve done for you, and this is how you repay me?"',
      'The Shadow weeps softly. "No one appreciates what we go through."',
    ],
    'The Parent': [
      '"I only want what\'s best for you. Trust me on this."',
      'The Shadow\'s voice is stern: "You\'re making a terrible mistake."',
    ],
    'The Trickster': [
      '"Oh, this is going to be fun. Let me add a little chaos."',
      'The Shadow cackles: "Why do things the easy way?"',
    ],
  };

  const archetypeComments = comments[archetype];
  if (archetypeComments && archetypeComments.length > 0) {
    const idx = (oblivionValue - 1) % archetypeComments.length;
    return archetypeComments[idx];
  }

  // Generic fallback
  const generic = [
    'The Shadow stirs restlessly, its presence felt like ice along your spine.',
    'A dark whisper echoes at the edge of your consciousness.',
    'The Shadow chuckles softly. "This should be interesting..."',
    'You feel the Shadow\'s attention sharpen, watching, waiting.',
    'The Shadow shifts, coiling like smoke behind your eyes.',
    'A chill runs through your corpus. The Shadow is paying attention.',
    '"You think you\'re in control?" the Shadow murmurs.',
    'The darkness within you stirs, hungry and restless.',
    'The Shadow leans close: "I\'m always here. Always watching."',
    'A bitter taste fills your mouth. The Shadow is amused.',
  ];
  return generic[(oblivionValue - 1) % generic.length];
}

// ─── Functions ─────────────────────────────────────────────────────

/**
 * Determine what the Shadow does when the Oblivion Die triggers.
 * Selects from the character's Shadow properties to make contextually
 * relevant interjections.
 *
 * @param shadow - The character's Shadow data
 * @param oblivionValue - The Oblivion Die value (1 or 10)
 * @param rng - Injectable RNG for selecting interjection type
 */
export function determineShadowInterjection(
  shadow: Shadow,
  oblivionValue: number,
  rng?: () => number,
): ShadowInterjection {
  const roll = (rng ?? defaultRng)();

  const hasThorns = shadow.thorns.length > 0;
  const hasDarkPassions = shadow.darkPassions.length > 0;

  // Coerce a Dark Passion (roll 1-2, if available)
  if (roll <= 2 && hasDarkPassions) {
    const selectRng = (rng ?? defaultRng)();
    const passionIdx = (selectRng - 1) % shadow.darkPassions.length;
    const passion = shadow.darkPassions[passionIdx];
    return {
      type: 'coerce_dark_passion',
      description: `The Shadow stirs your dark desire: "${passion.description}" (${passion.emotion})`,
      darkPassionIndex: passionIdx,
    };
  }

  // Activate a Thorn (roll 3-4, if available)
  if (roll <= 4 && hasThorns) {
    const selectRng = (rng ?? defaultRng)();
    const thornIdx = (selectRng - 1) % shadow.thorns.length;
    const thorn = shadow.thorns[thornIdx];
    const thornDef = THORNS.find((t) => t.key === thorn.name);
    return {
      type: 'use_thorn',
      description: `The Shadow activates ${thornDef?.name ?? thorn.name}: ${thornDef?.description ?? 'its dark power manifests'}`,
      thornUsed: thorn.name,
    };
  }

  // Offer bonus dice (roll 5-6)
  if (roll <= 6) {
    const diceRng = (rng ?? defaultRng)();
    const diceOffered = Math.ceil(diceRng / 3); // 1-4 bonus dice
    return {
      type: 'offer_dice',
      description: `The Shadow offers you ${diceOffered} bonus ${diceOffered === 1 ? 'die' : 'dice'}... but at what cost?`,
      diceOffer: {
        diceOffered,
        shadowPointsGained: diceOffered, // 1:1 ratio per THD
      },
    };
  }

  // Dark comment (roll 7-8)
  if (roll <= 8) {
    return {
      type: 'dark_comment',
      description: generateDarkComment(shadow.archetype, oblivionValue),
    };
  }

  // Whisper doubt (roll 9-10)
  return {
    type: 'whisper_doubt',
    description:
      'The Shadow whispers: "You know you can\'t succeed at this. You never could..."',
  };
}

/**
 * Process accepting or rejecting a Shadow dice offer.
 * Accepting increases temporary Angst by 1 (feeding the Shadow).
 */
export function resolveShadowDiceOffer(
  offer: Omit<ShadowDiceOffer, 'accepted'>,
  accepted: boolean,
  currentTemporaryAngst: number,
): {
  accepted: boolean;
  bonusDice: number;
  newTemporaryAngst: number;
  shadowPointsGained: number;
} {
  if (!accepted) {
    return {
      accepted: false,
      bonusDice: 0,
      newTemporaryAngst: currentTemporaryAngst,
      shadowPointsGained: 0,
    };
  }

  return {
    accepted: true,
    bonusDice: offer.diceOffered,
    newTemporaryAngst: currentTemporaryAngst + 1,
    shadowPointsGained: offer.shadowPointsGained,
  };
}
