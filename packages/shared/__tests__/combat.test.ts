import { describe, it, expect } from 'vitest';

// ─── Combat Engine ─────────────────────────────────────────────────
import {
  rollInitiative,
  createCombatState,
  advanceToNextTurn,
  endCombat,
  resolveAttack,
  resolveDodge,
  resolveParry,
  createWoundTrack,
  applyDamageToWoundTrack,
  applyWoundPenalty,
  getWoundLevelName,
  isIncapacitated,
  countWounds,
  healWoundTrack,
  STANDARD_MANEUVERS,
} from '../src/engine/combat.js';

// ─── Arcanoi Engine ────────────────────────────────────────────────
import {
  ARCANOI_DEFINITIONS,
  getArcanosLevel,
  getArcanosDefinition,
  canActivateArcanos,
  activateArcanos,
  getAvailableArcanoi,
} from '../src/engine/arcanoi.js';

// ─── Harrowing Engine ──────────────────────────────────────────────
import {
  checkHarrowingTrigger,
  createHarrowingState,
  resolveHarrowingChallenge,
  advanceHarrowing,
  resolveHarrowing,
  getHarrowingOutcomeDescription,
  getHarrowingEffects,
} from '../src/engine/harrowing.js';

import type { Character, DotRating, ExtendedDotRating } from '../src/types/character.js';

// ─── Test Helpers ──────────────────────────────────────────────────

/** Create an rng that returns a sequence of values then cycles. */
function mockRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

/** Create a minimal character for arcanoi testing. */
function createTestCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-char',
    name: 'Test Wraith',
    player: 'Tester',
    concept: 'Test concept',
    nature: 'Architect',
    demeanor: 'Director',
    causeOfDeath: 'violence',
    legion: 'grim',
    experienceTemplate: 'standard',
    attributes: {
      physical: { strength: 3 as DotRating, dexterity: 3 as DotRating, stamina: 3 as DotRating },
      social: { charisma: 2 as DotRating, manipulation: 3 as DotRating, appearance: 2 as DotRating },
      mental: { perception: 3 as DotRating, intelligence: 3 as DotRating, wits: 3 as DotRating },
    },
    abilities: {
      talents: {
        alertness: 2 as DotRating, athletics: 1 as DotRating, awareness: 2 as DotRating,
        brawl: 3 as DotRating, dodge: 2 as DotRating, empathy: 0 as DotRating,
        expression: 0 as DotRating, intimidation: 1 as DotRating, streetwise: 0 as DotRating,
        subterfuge: 0 as DotRating,
      },
      skills: {
        animalKen: 0 as DotRating, archery: 0 as DotRating, drive: 0 as DotRating,
        firearms: 0 as DotRating, larceny: 0 as DotRating, leadership: 0 as DotRating,
        melee: 2 as DotRating, performance: 0 as DotRating, stealth: 1 as DotRating,
        survival: 0 as DotRating,
      },
      knowledges: {
        bureaucracy: 0 as DotRating, cosmology: 1 as DotRating, cryptography: 0 as DotRating,
        hypnosis: 0 as DotRating, investigation: 1 as DotRating, linguistics: 0 as DotRating,
        medicine: 0 as DotRating, metallurgy: 0 as DotRating, occult: 2 as DotRating,
        politics: 0 as DotRating, science: 0 as DotRating, technology: 0 as DotRating,
      },
    },
    backgrounds: [{ name: 'haunt', rating: 2 as DotRating }],
    arcanoi: [
      { name: 'outrage', rating: 3 as DotRating },
      { name: 'embody', rating: 2 as DotRating },
    ],
    passions: [],
    fetters: [],
    resources: {
      corpus: { max: 10 as ExtendedDotRating, current: 10 as ExtendedDotRating },
      pathos: { max: 10 as ExtendedDotRating, current: 7 as ExtendedDotRating },
      willpower: { permanent: 5 as ExtendedDotRating, temporary: 5 as ExtendedDotRating },
    },
    woundTrack: createWoundTrack(),
    shadow: {
      archetype: 'The Beast',
      angst: { permanent: 2 as ExtendedDotRating, temporary: 1 },
      darkPassions: [],
      thorns: [],
      freebiePointsSpent: 0,
    },
    experience: { total: 0, spent: 0, available: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════
// COMBAT ENGINE TESTS
// ════════════════════════════════════════════════════════════════════

describe('Combat Engine', () => {
  describe('rollInitiative', () => {
    it('should roll initiative using Dex + Wits pool', () => {
      // 6 dice (3 Dex + 3 Wits), all 6s = 6 successes
      const rng = mockRng([6, 6, 6, 6, 6, 6]);
      const entry = rollInitiative('char-1', 'Ghost A', 3, 3, rng);

      expect(entry.characterId).toBe('char-1');
      expect(entry.characterName).toBe('Ghost A');
      expect(entry.roll.poolSize).toBe(6);
      expect(entry.roll.difficulty).toBe(6);
      expect(entry.initiative).toBe(6);
      expect(entry.hasActed).toBe(false);
    });

    it('should handle low initiative (all failures)', () => {
      const rng = mockRng([2, 3, 4, 5]);
      const entry = rollInitiative('char-1', 'Slow Ghost', 2, 2, rng);

      expect(entry.initiative).toBe(0);
    });
  });

  describe('createCombatState', () => {
    it('should create combat state sorted by initiative (descending)', () => {
      let callCount = 0;
      // First character (2+2=4 dice): 8, 7, 6, 5 → 3 successes
      // Second character (3+3=6 dice): 10, 9, 8, 7, 6, 5 → 5 successes
      const rng = () => {
        callCount++;
        // First 4 calls: char A's dice
        if (callCount <= 4) return [8, 7, 6, 5][callCount - 1];
        // Next 6 calls: char B's dice
        return [10, 9, 8, 7, 6, 5][callCount - 5];
      };

      const state = createCombatState(
        [
          { characterId: 'a', characterName: 'Ghost A', dexterity: 2, wits: 2 },
          { characterId: 'b', characterName: 'Ghost B', dexterity: 3, wits: 3 },
        ],
        rng,
      );

      expect(state.round).toBe(1);
      expect(state.currentTurn).toBe(0);
      expect(state.isActive).toBe(true);
      expect(state.initiativeOrder.length).toBe(2);
      // B should be first (higher initiative)
      expect(state.initiativeOrder[0].characterId).toBe('b');
      expect(state.initiativeOrder[1].characterId).toBe('a');
    });
  });

  describe('advanceToNextTurn', () => {
    it('should advance to next turn and mark current as acted', () => {
      const rng = mockRng([8, 6]); // simple inits
      const state = createCombatState(
        [
          { characterId: 'a', characterName: 'A', dexterity: 1, wits: 0 },
          { characterId: 'b', characterName: 'B', dexterity: 1, wits: 0 },
        ],
        rng,
      );

      const advanced = advanceToNextTurn(state);
      expect(advanced.currentTurn).toBe(1);
      expect(advanced.initiativeOrder[0].hasActed).toBe(true);
    });

    it('should start new round when all have acted', () => {
      const rng = mockRng([8, 6]);
      let state = createCombatState(
        [
          { characterId: 'a', characterName: 'A', dexterity: 1, wits: 0 },
          { characterId: 'b', characterName: 'B', dexterity: 1, wits: 0 },
        ],
        rng,
      );

      state = advanceToNextTurn(state); // A acts
      state = advanceToNextTurn(state); // B acts → new round

      expect(state.round).toBe(2);
      expect(state.currentTurn).toBe(0);
      // All hasActed should be reset
      expect(state.initiativeOrder.every(e => !e.hasActed)).toBe(true);
    });
  });

  describe('endCombat', () => {
    it('should mark combat as inactive', () => {
      const rng = mockRng([6]);
      const state = createCombatState(
        [{ characterId: 'a', characterName: 'A', dexterity: 1, wits: 0 }],
        rng,
      );
      const ended = endCombat(state);
      expect(ended.isActive).toBe(false);
    });
  });

  describe('resolveAttack', () => {
    it('should resolve a successful attack with damage and soak', () => {
      // Attack: 5 dice → 8, 7, 6, 3, 2 = 3 successes (diff 6)
      // Damage: 3 base + 3 bonus = 6 dice → 9, 8, 7, 6, 5, 4 = 4 successes (diff 6)
      // Soak: 3 dice → 7, 6, 5 = 2 successes (diff 6)
      const rng = mockRng([8, 7, 6, 3, 2, 9, 8, 7, 6, 5, 4, 7, 6, 5]);

      const result = resolveAttack(
        'Attacker', 'Defender',
        5, 6,      // attackerPool, difficulty
        3,         // damagePool (base)
        'bashing', // damageType
        3,         // soakPool
        rng,
      );

      expect(result.attackRoll.successes).toBe(3);
      expect(result.damageRoll.successes).toBe(4);
      expect(result.soakRoll.successes).toBe(2);
      expect(result.netDamage).toBe(2); // 4 - 2
      expect(result.damageType).toBe('bashing');
    });

    it('should return 0 damage on a miss', () => {
      // Attack: all failures
      const rng = mockRng([2, 3, 4]);

      const result = resolveAttack(
        'Attacker', 'Defender',
        3, 6,
        3, 'lethal', 3,
        rng,
      );

      expect(result.attackRoll.successes).toBe(0);
      expect(result.netDamage).toBe(0);
    });

    it('should return 0 damage on a botched attack', () => {
      // Attack: all 1s = botch
      const rng = mockRng([1, 1, 1]);

      const result = resolveAttack(
        'Attacker', 'Defender',
        3, 6,
        3, 'lethal', 3,
        rng,
      );

      expect(result.attackRoll.isBotch).toBe(true);
      expect(result.netDamage).toBe(0);
    });

    it('should not allow soak against aggravated damage', () => {
      // Attack: 2 successes
      // Damage: 3 successes
      // Soak should be 0 for aggravated
      const rng = mockRng([7, 8, 3, 2, 9, 8, 7, 4, 3]);

      const result = resolveAttack(
        'Attacker', 'Defender',
        4, 6,
        2, 'aggravated', 3,
        rng,
      );

      expect(result.soakRoll.poolSize).toBe(0);
      expect(result.soakRoll.successes).toBe(0);
      // All damage goes through
      expect(result.netDamage).toBe(result.damageRoll.successes);
    });
  });

  describe('resolveDodge', () => {
    it('should return successes for dodge pool', () => {
      const rng = mockRng([8, 7, 6, 3, 2]);
      const result = resolveDodge(5, 6, rng);
      expect(result.successes).toBe(3);
    });
  });

  describe('resolveParry', () => {
    it('should return successes for parry pool', () => {
      const rng = mockRng([9, 4, 3]);
      const result = resolveParry(3, 6, rng);
      expect(result.successes).toBe(1);
    });
  });

  describe('Wound Track', () => {
    it('should create a fresh wound track with 7 levels', () => {
      const track = createWoundTrack();
      expect(track.length).toBe(7);
      expect(track.every(l => !l.filled)).toBe(true);
      expect(track[0].name).toBe('Bruised');
      expect(track[6].name).toBe('Incapacitated');
    });

    it('should apply damage from top down', () => {
      let track = createWoundTrack();
      track = applyDamageToWoundTrack(track, 3, 'lethal');

      expect(track[0].filled).toBe(true);
      expect(track[1].filled).toBe(true);
      expect(track[2].filled).toBe(true);
      expect(track[3].filled).toBe(false);
      expect(track[0].damageType).toBe('lethal');
    });

    it('should calculate wound penalty correctly', () => {
      let track = createWoundTrack();

      // No wounds = 0 penalty
      expect(applyWoundPenalty(track)).toBe(0);

      // 1 wound (Bruised) = 0 penalty
      track = applyDamageToWoundTrack(track, 1);
      expect(applyWoundPenalty(track)).toBe(0);

      // 2 wounds (Hurt) = -1 penalty
      track = applyDamageToWoundTrack(createWoundTrack(), 2);
      expect(applyWoundPenalty(track)).toBe(-1);

      // 4 wounds (Wounded) = -2 penalty
      track = applyDamageToWoundTrack(createWoundTrack(), 4);
      expect(applyWoundPenalty(track)).toBe(-2);

      // 6 wounds (Crippled) = -5 penalty
      track = applyDamageToWoundTrack(createWoundTrack(), 6);
      expect(applyWoundPenalty(track)).toBe(-5);

      // 7 wounds (Incapacitated) = can't act
      track = applyDamageToWoundTrack(createWoundTrack(), 7);
      expect(applyWoundPenalty(track)).toBe(-Infinity);
    });

    it('should get wound level name', () => {
      let track = createWoundTrack();
      expect(getWoundLevelName(track)).toBe('Healthy');

      track = applyDamageToWoundTrack(track, 1);
      expect(getWoundLevelName(track)).toBe('Bruised');

      track = applyDamageToWoundTrack(createWoundTrack(), 5);
      expect(getWoundLevelName(track)).toBe('Mauled');
    });

    it('should detect incapacitation', () => {
      let track = createWoundTrack();
      expect(isIncapacitated(track)).toBe(false);

      track = applyDamageToWoundTrack(track, 7);
      expect(isIncapacitated(track)).toBe(true);
    });

    it('should count wounds', () => {
      let track = createWoundTrack();
      expect(countWounds(track)).toBe(0);

      track = applyDamageToWoundTrack(track, 4);
      expect(countWounds(track)).toBe(4);
    });

    it('should heal from most severe first', () => {
      let track = createWoundTrack();
      track = applyDamageToWoundTrack(track, 5);
      expect(countWounds(track)).toBe(5);

      track = healWoundTrack(track, 2);
      expect(countWounds(track)).toBe(3);
      // Top 3 should still be filled, bottom should be healed
      expect(track[0].filled).toBe(true);
      expect(track[1].filled).toBe(true);
      expect(track[2].filled).toBe(true);
      expect(track[3].filled).toBe(false);
      expect(track[4].filled).toBe(false);
    });
  });

  describe('Standard Maneuvers', () => {
    it('should have standard combat maneuvers defined', () => {
      expect(STANDARD_MANEUVERS.length).toBeGreaterThanOrEqual(5);

      const punch = STANDARD_MANEUVERS.find(m => m.name === 'Punch');
      expect(punch).toBeDefined();
      expect(punch!.difficulty).toBe(6);
      expect(punch!.damageType).toBe('bashing');

      const kick = STANDARD_MANEUVERS.find(m => m.name === 'Kick');
      expect(kick).toBeDefined();
      expect(kick!.difficulty).toBe(7);
      expect(kick!.damageBonus).toBe(1);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// ARCANOI ENGINE TESTS
// ════════════════════════════════════════════════════════════════════

describe('Arcanoi Engine', () => {
  describe('ARCANOI_DEFINITIONS', () => {
    it('should have all 16 Western Arcanoi defined', () => {
      const expected = [
        'argos', 'castigate', 'embody', 'fatalism', 'flux', 'inhabit',
        'intimation', 'keening', 'lifeweb', 'mnemosynis', 'moliate',
        'outrage', 'pandemonium', 'phantasm', 'puppetry', 'usury',
      ];
      for (const name of expected) {
        expect(ARCANOI_DEFINITIONS[name]).toBeDefined();
        expect(ARCANOI_DEFINITIONS[name].levels.length).toBe(5);
      }
    });

    it('should have proper level progression for each Arcanos', () => {
      for (const [name, arcanos] of Object.entries(ARCANOI_DEFINITIONS)) {
        for (let i = 0; i < arcanos.levels.length; i++) {
          expect(arcanos.levels[i].level).toBe(i + 1);
          expect(arcanos.levels[i].name).toBeTruthy();
          expect(arcanos.levels[i].difficulty).toBeGreaterThanOrEqual(5);
          expect(arcanos.levels[i].difficulty).toBeLessThanOrEqual(10);
        }
      }
    });

    it('should have increasing costs at higher levels', () => {
      for (const [name, arcanos] of Object.entries(ARCANOI_DEFINITIONS)) {
        // Generally costs should not decrease as level increases
        // (some level 1 powers may cost 0 pathos)
        const lastLevel = arcanos.levels[arcanos.levels.length - 1];
        const firstLevel = arcanos.levels[0];
        expect(lastLevel.pathosCost).toBeGreaterThanOrEqual(firstLevel.pathosCost);
      }
    });
  });

  describe('getArcanosLevel', () => {
    it('should return correct level definition', () => {
      const level = getArcanosLevel('outrage', 3);
      expect(level).not.toBeNull();
      expect(level!.name).toBe('Stonehand Punch');
      expect(level!.pathosCost).toBe(2);
    });

    it('should return null for non-existent arcanos', () => {
      expect(getArcanosLevel('nonexistent', 1)).toBeNull();
    });

    it('should return null for out-of-range level', () => {
      expect(getArcanosLevel('outrage', 6)).toBeNull();
    });
  });

  describe('getArcanosDefinition', () => {
    it('should return full definition', () => {
      const def = getArcanosDefinition('embody');
      expect(def).not.toBeNull();
      expect(def!.displayName).toBe('Embody');
      expect(def!.levels.length).toBe(5);
    });
  });

  describe('canActivateArcanos', () => {
    it('should allow activation when resources are sufficient', () => {
      const char = createTestCharacter();
      const result = canActivateArcanos(char, 'outrage', 1);
      expect(result.canActivate).toBe(true);
    });

    it('should reject when character lacks the Arcanos', () => {
      const char = createTestCharacter();
      const result = canActivateArcanos(char, 'argos', 1);
      expect(result.canActivate).toBe(false);
      expect(result.reason).toContain('does not have');
    });

    it('should reject when Arcanos level is too low', () => {
      const char = createTestCharacter(); // outrage at 3
      const result = canActivateArcanos(char, 'outrage', 5);
      expect(result.canActivate).toBe(false);
      expect(result.reason).toContain('below required level');
    });

    it('should reject when insufficient Pathos', () => {
      const char = createTestCharacter({
        resources: {
          corpus: { max: 10 as ExtendedDotRating, current: 10 as ExtendedDotRating },
          pathos: { max: 10 as ExtendedDotRating, current: 0 as ExtendedDotRating },
          willpower: { permanent: 5 as ExtendedDotRating, temporary: 5 as ExtendedDotRating },
        },
      });
      const result = canActivateArcanos(char, 'outrage', 2); // Wraithgrasp costs 1 Pathos
      expect(result.canActivate).toBe(false);
      expect(result.reason).toContain('Insufficient Pathos');
    });

    it('should reject when insufficient Willpower', () => {
      const char = createTestCharacter({
        resources: {
          corpus: { max: 10 as ExtendedDotRating, current: 10 as ExtendedDotRating },
          pathos: { max: 10 as ExtendedDotRating, current: 10 as ExtendedDotRating },
          willpower: { permanent: 5 as ExtendedDotRating, temporary: 0 as ExtendedDotRating },
        },
        arcanoi: [{ name: 'outrage', rating: 5 as DotRating }],
      });
      // Obliviate (level 5) costs 1 Willpower
      const result = canActivateArcanos(char, 'outrage', 5);
      expect(result.canActivate).toBe(false);
      expect(result.reason).toContain('Insufficient Willpower');
    });
  });

  describe('activateArcanos', () => {
    it('should deduct costs and roll dice on successful activation', () => {
      const char = createTestCharacter();
      // Outrage 2 (Wraithgrasp): costs 1 Pathos, Strength + Outrage pool, diff 6
      // Pool size 6 (Str 3 + Outrage 3), all 7s = 6 successes
      const rng = mockRng([7, 7, 7, 7, 7, 7]);

      const result = activateArcanos(char, 'outrage', 2, 6, rng);

      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.powerName).toBe('Wraithgrasp');
      expect(result!.pathosCost).toBe(1);
      expect(result!.resourcesAfter.pathos.current).toBe(6); // 7 - 1
      expect(result!.roll.successes).toBe(6);
    });

    it('should return null if activation not possible', () => {
      const char = createTestCharacter();
      const result = activateArcanos(char, 'argos', 1, 5);
      expect(result).toBeNull();
    });

    it('should report failure on botched activation roll', () => {
      const char = createTestCharacter();
      const rng = mockRng([1, 1, 1, 1, 1, 1]);

      const result = activateArcanos(char, 'outrage', 1, 6, rng);

      expect(result).not.toBeNull();
      expect(result!.success).toBe(false);
      expect(result!.roll.isBotch).toBe(true);
      // Costs are still deducted even on failure
      expect(result!.resourcesAfter.pathos.current).toBe(6); // 7 - 1
    });

    it('should deduct both Pathos and Willpower for high-level powers', () => {
      const char = createTestCharacter({
        arcanoi: [{ name: 'outrage', rating: 5 as DotRating }],
      });
      // Obliviate (level 5): 5 Pathos + 1 Willpower
      const rng = mockRng([8, 8, 8, 8, 8, 8]);

      const result = activateArcanos(char, 'outrage', 5, 6, rng);

      expect(result).not.toBeNull();
      expect(result!.pathosCost).toBe(5);
      expect(result!.willpowerCost).toBe(1);
      expect(result!.resourcesAfter.pathos.current).toBe(2); // 7 - 5
      expect(result!.resourcesAfter.willpower.temporary).toBe(4); // 5 - 1
    });
  });

  describe('getAvailableArcanoi', () => {
    it('should return all activatable powers', () => {
      const char = createTestCharacter();
      const available = getAvailableArcanoi(char);

      // Character has Outrage 3 and Embody 2
      // Outrage: levels 1, 2, 3 should be available
      // Embody: levels 1, 2 should be available
      expect(available.length).toBe(5);

      const outrageNames = available
        .filter(a => a.arcanosName === 'outrage')
        .map(a => a.powerName);
      expect(outrageNames).toContain('Ping');
      expect(outrageNames).toContain('Wraithgrasp');
      expect(outrageNames).toContain('Stonehand Punch');
    });

    it('should exclude powers character cannot afford', () => {
      const char = createTestCharacter({
        resources: {
          corpus: { max: 10 as ExtendedDotRating, current: 10 as ExtendedDotRating },
          pathos: { max: 10 as ExtendedDotRating, current: 1 as ExtendedDotRating },
          willpower: { permanent: 5 as ExtendedDotRating, temporary: 5 as ExtendedDotRating },
        },
      });
      const available = getAvailableArcanoi(char);

      // With only 1 Pathos, can only afford powers costing 0 or 1 Pathos
      const expensive = available.filter(a => a.pathosCost > 1);
      expect(expensive.length).toBe(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// HARROWING ENGINE TESTS
// ════════════════════════════════════════════════════════════════════

describe('Harrowing Engine', () => {
  describe('checkHarrowingTrigger', () => {
    it('should trigger Harrowing on failed Willpower roll', () => {
      // Willpower 3 vs difficulty 8 (corpus_destroyed), all failures
      const rng = mockRng([2, 3, 4]);
      const result = checkHarrowingTrigger('corpus_destroyed', 3, rng);

      expect(result.triggered).toBe(true);
      expect(result.difficulty).toBe(8);
      expect(result.roll.successes).toBe(0);
    });

    it('should not trigger Harrowing on successful Willpower roll', () => {
      // Willpower 5 vs difficulty 6 (trauma), all 8s = 5 successes
      const rng = mockRng([8, 8, 8, 8, 8]);
      const result = checkHarrowingTrigger('trauma', 5, rng);

      expect(result.triggered).toBe(false);
      expect(result.difficulty).toBe(6);
      expect(result.roll.successes).toBe(5);
    });

    it('should trigger on a botch', () => {
      const rng = mockRng([1, 1, 1]);
      const result = checkHarrowingTrigger('willpower_zero', 3, rng);

      expect(result.triggered).toBe(true);
      expect(result.roll.isBotch).toBe(true);
    });

    it('should use correct difficulty for different triggers', () => {
      const rng = mockRng([10]); // always succeeds

      expect(checkHarrowingTrigger('corpus_destroyed', 1, rng).difficulty).toBe(8);
      expect(checkHarrowingTrigger('fetter_lost', 1, rng).difficulty).toBe(7);
      expect(checkHarrowingTrigger('passion_lost', 1, rng).difficulty).toBe(7);
      expect(checkHarrowingTrigger('willpower_zero', 1, rng).difficulty).toBe(6);
      expect(checkHarrowingTrigger('trauma', 1, rng).difficulty).toBe(6);
    });
  });

  describe('createHarrowingState', () => {
    it('should create initial Harrowing state', () => {
      const state = createHarrowingState('trauma');

      expect(state.triggers).toBe('trauma');
      expect(state.challenges.length).toBe(0);
      expect(state.psycheWins).toBe(0);
      expect(state.shadowWins).toBe(0);
      expect(state.maxChallenges).toBe(3);
      expect(state.isComplete).toBe(false);
      expect(state.outcome).toBeNull();
    });

    it('should accept custom max challenges', () => {
      const state = createHarrowingState('corpus_destroyed', 5);
      expect(state.maxChallenges).toBe(5);
    });
  });

  describe('resolveHarrowingChallenge', () => {
    it('should resolve Psyche victory', () => {
      // Psyche: 5 dice all 8s = 5 successes
      // Shadow: 3 dice all 3s = 0 successes
      const rng = mockRng([8, 8, 8, 8, 8, 3, 3, 3]);
      const challenge = resolveHarrowingChallenge(5, 3, 6, rng);

      expect(challenge.winner).toBe('psyche');
      expect(challenge.netSuccesses).toBeGreaterThan(0);
    });

    it('should resolve Shadow victory', () => {
      // Psyche: 3 dice all 2s = 0 successes
      // Shadow: 5 dice all 9s = 5 successes
      const rng = mockRng([2, 2, 2, 9, 9, 9, 9, 9]);
      const challenge = resolveHarrowingChallenge(3, 5, 6, rng);

      expect(challenge.winner).toBe('shadow');
      expect(challenge.netSuccesses).toBeLessThan(0);
    });

    it('should resolve tie', () => {
      // Both roll same successes
      const rng = mockRng([7, 3, 7, 3]);
      const challenge = resolveHarrowingChallenge(2, 2, 6, rng);

      expect(challenge.winner).toBe('tie');
      expect(challenge.netSuccesses).toBe(0);
    });
  });

  describe('advanceHarrowing', () => {
    it('should advance through challenges', () => {
      let state = createHarrowingState('trauma');

      // Challenge 1: Psyche wins
      const rng1 = mockRng([8, 8, 8, 8, 8, 2, 2, 2]);
      state = advanceHarrowing(state, 5, 3, 6, rng1);

      expect(state.totalChallenges).toBe(1);
      expect(state.psycheWins).toBe(1);
      expect(state.isComplete).toBe(false);
    });

    it('should complete after maxChallenges', () => {
      let state = createHarrowingState('trauma', 3);

      // 3 challenges, all Psyche wins
      for (let i = 0; i < 3; i++) {
        const rng = mockRng([8, 8, 8, 8, 8, 2, 2, 2]);
        state = advanceHarrowing(state, 5, 3, 6, rng);
      }

      expect(state.totalChallenges).toBe(3);
      expect(state.isComplete).toBe(true);
      expect(state.outcome).toBe('catharsis'); // All 3 wins = catharsis
    });

    it('should not advance when already complete', () => {
      let state = createHarrowingState('trauma', 1);
      const rng = mockRng([8, 8, 2, 2]);
      state = advanceHarrowing(state, 2, 2, 6, rng);

      expect(state.isComplete).toBe(true);

      // Try advancing again
      const before = state.totalChallenges;
      state = advanceHarrowing(state, 2, 2, 6, rng);
      expect(state.totalChallenges).toBe(before);
    });
  });

  describe('resolveHarrowing', () => {
    it('should give escape when Psyche wins majority', () => {
      const state: Parameters<typeof resolveHarrowing>[0] = {
        triggers: 'trauma',
        challenges: [],
        psycheWins: 2,
        shadowWins: 1,
        totalChallenges: 3,
        maxChallenges: 3,
        isComplete: false,
        outcome: null,
      };

      const resolved = resolveHarrowing(state);
      expect(resolved.outcome).toBe('escape');
    });

    it('should give catharsis when Psyche wins ALL challenges', () => {
      const state: Parameters<typeof resolveHarrowing>[0] = {
        triggers: 'trauma',
        challenges: [],
        psycheWins: 3,
        shadowWins: 0,
        totalChallenges: 3,
        maxChallenges: 3,
        isComplete: false,
        outcome: null,
      };

      const resolved = resolveHarrowing(state);
      expect(resolved.outcome).toBe('catharsis');
    });

    it('should give shadow_gains when Shadow wins majority', () => {
      const state: Parameters<typeof resolveHarrowing>[0] = {
        triggers: 'trauma',
        challenges: [],
        psycheWins: 1,
        shadowWins: 2,
        totalChallenges: 3,
        maxChallenges: 3,
        isComplete: false,
        outcome: null,
      };

      const resolved = resolveHarrowing(state);
      expect(resolved.outcome).toBe('shadow_gains');
    });

    it('should give destruction when Shadow wins ALL challenges', () => {
      const state: Parameters<typeof resolveHarrowing>[0] = {
        triggers: 'trauma',
        challenges: [],
        psycheWins: 0,
        shadowWins: 3,
        totalChallenges: 3,
        maxChallenges: 3,
        isComplete: false,
        outcome: null,
      };

      const resolved = resolveHarrowing(state);
      expect(resolved.outcome).toBe('destruction');
    });

    it('should give escape on tie', () => {
      const state: Parameters<typeof resolveHarrowing>[0] = {
        triggers: 'trauma',
        challenges: [],
        psycheWins: 1,
        shadowWins: 1,
        totalChallenges: 3, // 1 tie
        maxChallenges: 3,
        isComplete: false,
        outcome: null,
      };

      const resolved = resolveHarrowing(state);
      expect(resolved.outcome).toBe('escape');
    });
  });

  describe('getHarrowingOutcomeDescription', () => {
    it('should return descriptions for all outcomes', () => {
      expect(getHarrowingOutcomeDescription('escape')).toBeTruthy();
      expect(getHarrowingOutcomeDescription('shadow_gains')).toBeTruthy();
      expect(getHarrowingOutcomeDescription('catharsis')).toBeTruthy();
      expect(getHarrowingOutcomeDescription('destruction')).toBeTruthy();
    });
  });

  describe('getHarrowingEffects', () => {
    it('should return correct effects for escape', () => {
      const effects = getHarrowingEffects('escape');
      expect(effects.angstChange).toBe(0);
      expect(effects.thornGained).toBe(false);
      expect(effects.destroyed).toBe(false);
    });

    it('should return correct effects for shadow_gains', () => {
      const effects = getHarrowingEffects('shadow_gains');
      expect(effects.angstChange).toBe(1);
      expect(effects.thornGained).toBe(true);
      expect(effects.destroyed).toBe(false);
    });

    it('should return correct effects for catharsis', () => {
      const effects = getHarrowingEffects('catharsis');
      expect(effects.angstChange).toBe(-1);
      expect(effects.willpowerRestored).toBe(true);
    });

    it('should return correct effects for destruction', () => {
      const effects = getHarrowingEffects('destruction');
      expect(effects.destroyed).toBe(true);
    });
  });
});
