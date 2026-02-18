import { describe, it, expect } from 'vitest';

import {
  performBinaryRoll,
  describeBinaryOutcome,
} from '../src/engine/solo/binary-roll';

import { generateScene } from '../src/engine/solo/scene-gen';

import { checkForRandomScene } from '../src/engine/solo/random-scene';

import { generateNpc, describeNpcPowerLevel } from '../src/engine/solo/npc-gen';

import {
  determineShadowInterjection,
  resolveShadowDiceOffer,
} from '../src/engine/solo/oblivion-die';

import type { Shadow } from '../src/types/shadow';
import type { ExtendedDotRating } from '../src/types/character';

// ─── Test Helpers ──────────────────────────────────────────────────

/** Create an rng that returns a sequence of values, cycling if needed. */
function mockRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Create a minimal Shadow for testing. */
function createTestShadow(overrides?: Partial<Shadow>): Shadow {
  return {
    archetype: 'The Monster',
    angst: { permanent: 3 as ExtendedDotRating, temporary: 1 },
    darkPassions: [
      {
        id: 'dp1',
        description: 'Destroy my killer',
        emotion: 'Rage',
        rating: 3,
      },
    ],
    thorns: [{ name: 'whispers', rating: 2 }],
    freebiePointsSpent: 0,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════
// BINARY ROLL TESTS
// ════════════════════════════════════════════════════════════════════

describe('performBinaryRoll', () => {
  it('should return positive outcome with oblivion die', () => {
    // Oblivion: 5 (no interject), Binary: pos=8, neg=3 → positive
    const rng = mockRng([5, 8, 3]);
    const result = performBinaryRoll(rng);

    expect(result.binaryRoll.outcome).toBe('positive');
    expect(result.oblivionDie.shadowInterjects).toBe(false);
    expect(result.oblivionDie.value).toBe(5);
    expect(result.tieHistory).toHaveLength(0);
    expect(result.isDoubleTie).toBe(false);
  });

  it('should return negative outcome', () => {
    // Oblivion: 7, Binary: pos=2, neg=9 → negative
    const rng = mockRng([7, 2, 9]);
    const result = performBinaryRoll(rng);

    expect(result.binaryRoll.outcome).toBe('negative');
  });

  it('should handle a single tie-reroll', () => {
    // Oblivion: 3, First binary: 5,5 → tie, Reroll: 7,2 → positive
    const rng = mockRng([3, 5, 5, 7, 2]);
    const result = performBinaryRoll(rng);

    expect(result.tieHistory).toHaveLength(1);
    expect(result.binaryRoll.outcome).toBe('positive');
    expect(result.isDoubleTie).toBe(false);
  });

  it('should flag double-tie as unexpected outcome', () => {
    // Oblivion: 3, Tie 1: 5,5, Tie 2: 4,4, Tie 3: 6,6 (exhausted)
    const rng = mockRng([3, 5, 5, 4, 4, 6, 6]);
    const result = performBinaryRoll(rng);

    expect(result.isDoubleTie).toBe(true);
    expect(result.tieHistory.length).toBeGreaterThanOrEqual(2);
  });

  it('should report shadow interjection on oblivion die 1', () => {
    // Oblivion: 1 (interjects), Binary: 7,3 → positive
    const rng = mockRng([1, 7, 3]);
    const result = performBinaryRoll(rng);

    expect(result.oblivionDie.shadowInterjects).toBe(true);
    expect(result.oblivionDie.value).toBe(1);
  });

  it('should report shadow interjection on oblivion die 10', () => {
    // Oblivion: 10 (interjects), Binary: 4,9 → negative
    const rng = mockRng([10, 4, 9]);
    const result = performBinaryRoll(rng);

    expect(result.oblivionDie.shadowInterjects).toBe(true);
    expect(result.oblivionDie.value).toBe(10);
  });

  it('should report exceptional_positive on double 10s', () => {
    // Oblivion: 5, Binary: 10,10 → exceptional_positive
    const rng = mockRng([5, 10, 10]);
    const result = performBinaryRoll(rng);

    expect(result.binaryRoll.outcome).toBe('exceptional_positive');
  });

  it('should report exceptional_negative on double 1s', () => {
    // Oblivion: 5, Binary: 1,1 → exceptional_negative
    const rng = mockRng([5, 1, 1]);
    const result = performBinaryRoll(rng);

    expect(result.binaryRoll.outcome).toBe('exceptional_negative');
  });
});

describe('describeBinaryOutcome', () => {
  it('should label outcomes correctly', () => {
    expect(describeBinaryOutcome('positive', false)).toBe('Positive');
    expect(describeBinaryOutcome('negative', false)).toBe('Negative');
    expect(describeBinaryOutcome('exceptional_positive', false)).toBe(
      'Exceptional Positive',
    );
    expect(describeBinaryOutcome('exceptional_negative', false)).toBe(
      'Exceptional Negative',
    );
    expect(describeBinaryOutcome('tie_reroll', false)).toBe(
      'Tie (Rerolling...)',
    );
  });

  it('should return Unexpected Outcome for double tie', () => {
    expect(describeBinaryOutcome('exceptional_positive', true)).toBe(
      'Unexpected Outcome',
    );
    expect(describeBinaryOutcome('positive', true)).toBe(
      'Unexpected Outcome',
    );
  });
});

// ════════════════════════════════════════════════════════════════════
// SCENE GENERATION TESTS
// ════════════════════════════════════════════════════════════════════

describe('generateScene', () => {
  it('should return activity and focus from tables', () => {
    // Activity: tens=1, ones=1 → index 11, Focus: tens=2, ones=3 → index 23
    // Oblivion: 5
    const rng = mockRng([1, 1, 2, 3, 5]);
    const result = generateScene(rng);

    expect(result.activity).toBeTruthy();
    expect(result.focus).toBeTruthy();
    expect(result.prompt).toBe(`${result.activity} ${result.focus}`);
    expect(result.oblivionDie.value).toBe(5);
    expect(result.activityRoll.index).toBe(11);
    expect(result.focusRoll.index).toBe(23);
  });

  it('should handle percentile edge case (10, 10 = 100)', () => {
    // Activity: tens=10, ones=10 → index 100, Focus: tens=1, ones=1 → index 11
    // Oblivion: 3
    const rng = mockRng([10, 10, 1, 1, 3]);
    const result = generateScene(rng);

    expect(result.activityRoll.index).toBe(100);
    expect(result.activity).toBeTruthy();
  });

  it('should include oblivion die', () => {
    const rng = mockRng([1, 1, 1, 1, 10]); // Oblivion = 10 → interjects
    const result = generateScene(rng);

    expect(result.oblivionDie.shadowInterjects).toBe(true);
  });

  it('should combine activity and focus into a prompt', () => {
    const result = generateScene(); // non-deterministic but structural test
    expect(result.prompt).toMatch(/.+ .+/);
    expect(result.activity.length).toBeGreaterThan(0);
    expect(result.focus.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// RANDOM SCENE TESTS
// ════════════════════════════════════════════════════════════════════

describe('checkForRandomScene', () => {
  it('should not trigger when angst is 0', () => {
    const rng = mockRng([2]);
    const result = checkForRandomScene(0, rng);

    expect(result.triggered).toBe(false);
    expect(result.scene).toBeUndefined();
  });

  it('should trigger and return scene when halved roll <= angst', () => {
    // Roll 4, halved = 2, angst = 3 → triggered; Scene roll = 6
    const rng = mockRng([4, 6]);
    const result = checkForRandomScene(3, rng);

    expect(result.triggered).toBe(true);
    expect(result.triggerRoll).toBe(4);
    expect(result.halvedValue).toBe(2);
    expect(result.scene).toBeDefined();
    expect(result.scene!.roll).toBe(6);
    expect(result.scene!.type).toBe('positive_pc');
    expect(result.scene!.label).toBe('Something Positive Happens To PC');
  });

  it('should not trigger when halved roll > angst', () => {
    // Roll 8, halved = 4, angst = 2
    const rng = mockRng([8]);
    const result = checkForRandomScene(2, rng);

    expect(result.triggered).toBe(false);
    expect(result.scene).toBeUndefined();
  });

  it('should map all random scene table entries correctly', () => {
    const typeMap: Record<number, string> = {
      1: 'work_towards_passion',
      2: 'new_npc',
      3: 'npc_action',
      4: 'move_away_from_passion',
      5: 'positive_npc',
      6: 'positive_pc',
      7: 'negative_pc',
      8: 'negative_npc',
      9: 'work_towards_goal',
      10: 'work_away_from_goal',
    };

    for (let roll = 1; roll <= 10; roll++) {
      // Trigger roll: 2, halved = 1, angst = 5 → always triggers
      // Scene roll = roll
      const rng = mockRng([2, roll]);
      const result = checkForRandomScene(5, rng);

      expect(result.triggered).toBe(true);
      expect(result.scene!.type).toBe(typeMap[roll]);
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// NPC GENERATION TESTS
// ════════════════════════════════════════════════════════════════════

describe('generateNpc', () => {
  it('should return power level and narrative hooks', () => {
    // Power roll=5 (similar), descriptor idx=3, motivation idx=7
    const rng = mockRng([5, 3, 7]);
    const result = generateNpc(rng);

    expect(result.powerLevel.level).toBe('similar');
    expect(result.powerLevel.dicePool).toEqual([4, 5]);
    expect(result.powerLevel.willpower).toBe(4);
    expect(result.descriptor).toBeTruthy();
    expect(result.motivation).toBeTruthy();
  });

  it('should return much_weaker for low rolls', () => {
    const rng = mockRng([1, 1, 1]);
    const result = generateNpc(rng);

    expect(result.powerLevel.level).toBe('much_weaker');
    expect(result.powerLevel.expertiseDifficulty).toBe(4);
    expect(result.powerLevel.weaknessDifficulty).toBe(3);
  });

  it('should return much_stronger for high rolls', () => {
    const rng = mockRng([10, 1, 1]);
    const result = generateNpc(rng);

    expect(result.powerLevel.level).toBe('much_stronger');
    expect(result.powerLevel.dicePool).toEqual([7, 8]);
    expect(result.powerLevel.expertiseDifficulty).toBe(8);
    expect(result.powerLevel.weaknessDifficulty).toBe(6);
  });
});

describe('describeNpcPowerLevel', () => {
  it('should return descriptive labels for all levels', () => {
    expect(describeNpcPowerLevel('much_weaker')).toContain('Drone');
    expect(describeNpcPowerLevel('slightly_weaker')).toContain('Grunt');
    expect(describeNpcPowerLevel('similar')).toContain('Rival');
    expect(describeNpcPowerLevel('slightly_stronger')).toContain('Veteran');
    expect(describeNpcPowerLevel('much_stronger')).toContain('Elder');
  });
});

// ════════════════════════════════════════════════════════════════════
// SHADOW INTERJECTION TESTS
// ════════════════════════════════════════════════════════════════════

describe('determineShadowInterjection', () => {
  it('should coerce dark passion on low rolls', () => {
    const shadow = createTestShadow();
    // roll=1 → dark passion; select rng=1 → passion index 0
    const rng = mockRng([1, 1]);
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('coerce_dark_passion');
    expect(result.description).toContain('Destroy my killer');
    expect(result.darkPassionIndex).toBe(0);
  });

  it('should activate a thorn on rolls 3-4', () => {
    const shadow = createTestShadow();
    // roll=3 → thorn; select rng=1 → thorn index 0
    const rng = mockRng([3, 1]);
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('use_thorn');
    expect(result.thornUsed).toBe('whispers');
    expect(result.description).toContain('Whispers');
  });

  it('should offer dice on rolls 5-6', () => {
    const shadow = createTestShadow();
    // roll=5 → offer dice; dice rng=3 → ceil(3/3) = 1 die
    const rng = mockRng([5, 3]);
    const result = determineShadowInterjection(shadow, 10, rng);

    expect(result.type).toBe('offer_dice');
    expect(result.diceOffer).toBeDefined();
    expect(result.diceOffer!.diceOffered).toBeGreaterThan(0);
    expect(result.diceOffer!.shadowPointsGained).toBe(
      result.diceOffer!.diceOffered,
    );
  });

  it('should return dark comment on rolls 7-8', () => {
    const shadow = createTestShadow();
    const rng = mockRng([7]);
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('dark_comment');
    expect(result.description.length).toBeGreaterThan(0);
  });

  it('should return whisper doubt on rolls 9-10', () => {
    const shadow = createTestShadow();
    const rng = mockRng([9]);
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('whisper_doubt');
    expect(result.description).toContain('Shadow whispers');
  });

  it('should fall through to other types when no dark passions', () => {
    const shadow = createTestShadow({ darkPassions: [] });
    // roll=1 would be dark passion, but none available → falls to thorn check
    const rng = mockRng([1, 1]);
    const result = determineShadowInterjection(shadow, 1, rng);

    // Should NOT be coerce_dark_passion since there are none
    expect(result.type).not.toBe('coerce_dark_passion');
  });

  it('should fall through to other types when no thorns', () => {
    const shadow = createTestShadow({ thorns: [] });
    // roll=3 would be thorn, but none available → falls to dice offer
    const rng = mockRng([3, 3]);
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).not.toBe('use_thorn');
  });

  it('should use archetype-flavored comments for known archetypes', () => {
    const shadow = createTestShadow({ archetype: 'The Monster' });
    const rng = mockRng([7]); // dark comment
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('dark_comment');
    // Should use Monster-specific comment
    expect(
      result.description.includes('snarls') ||
        result.description.includes('cruel laugh'),
    ).toBe(true);
  });

  it('should use generic comments for unknown archetypes', () => {
    const shadow = createTestShadow({ archetype: 'The Unknown Custom' });
    const rng = mockRng([7]); // dark comment
    const result = determineShadowInterjection(shadow, 1, rng);

    expect(result.type).toBe('dark_comment');
    expect(result.description.length).toBeGreaterThan(0);
  });
});

describe('resolveShadowDiceOffer', () => {
  it('should return no bonus when rejected', () => {
    const result = resolveShadowDiceOffer(
      { diceOffered: 2, accepted: false, shadowPointsGained: 2 },
      false,
      1,
    );

    expect(result.accepted).toBe(false);
    expect(result.bonusDice).toBe(0);
    expect(result.newTemporaryAngst).toBe(1); // unchanged
    expect(result.shadowPointsGained).toBe(0);
  });

  it('should increase angst and grant dice when accepted', () => {
    const result = resolveShadowDiceOffer(
      { diceOffered: 3, accepted: false, shadowPointsGained: 3 },
      true,
      2,
    );

    expect(result.accepted).toBe(true);
    expect(result.bonusDice).toBe(3);
    expect(result.newTemporaryAngst).toBe(3); // 2 + 1
    expect(result.shadowPointsGained).toBe(3);
  });

  it('should handle zero angst', () => {
    const result = resolveShadowDiceOffer(
      { diceOffered: 1, accepted: false, shadowPointsGained: 1 },
      true,
      0,
    );

    expect(result.newTemporaryAngst).toBe(1); // 0 + 1
  });
});
