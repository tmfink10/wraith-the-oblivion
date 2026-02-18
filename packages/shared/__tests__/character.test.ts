import { describe, it, expect } from 'vitest';
import {
  createCharacterCreationState,
  createEmptyAttributes,
  createEmptyAbilities,
  createDefaultResources,
  countAttributeDotsSpent,
  countAbilityDotsSpent,
  countBackgroundDotsSpent,
  countArcanoidotsSpent,
  validateAttributeAllocation,
  validateAbilityAllocation,
  validateAdvantages,
  validateCharacter,
  getAttributePoints,
  getAbilityPoints,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  getTotalSteps,
  finalizeCharacter,
  getFreebiePointCost,
} from '../src/engine/character';
import {
  createShadow,
  addDarkPassion,
  removeDarkPassion,
  addThorn,
  removeThorn,
  gainAngst,
  spendAngst,
  validateShadow,
  calculateShadowTrade,
  getCatharsisDifficulty,
} from '../src/engine/shadow';
import {
  spendPathos,
  gainPathos,
  spendWillpower,
  restoreWillpower,
  takeCorpusDamage,
  healCorpus,
  isDestroyed,
} from '../src/engine/resources';
import {
  calculateXpCost,
  awardXp,
  spendXp,
} from '../src/engine/experience';
import {
  createPassion,
  createFetter,
} from '../src/engine/passions';
import {
  rollRandomCharacterConcept,
} from '../src/engine/generation';

// ─── Character Creation State ─────────────────────────────────────

describe('Character Creation State', () => {
  it('creates a default state with standard template', () => {
    const state = createCharacterCreationState('standard');
    expect(state.step).toBe('concept');
    expect(state.template).toBe('standard');
    expect(state.freebiePointsRemaining).toBe(15);
    expect(state.character.id).toBeDefined();
  });

  it('creates state with experienced template', () => {
    const state = createCharacterCreationState('experienced');
    expect(state.freebiePointsRemaining).toBe(18);
  });

  it('creates state with ancient template', () => {
    const state = createCharacterCreationState('ancient');
    expect(state.freebiePointsRemaining).toBe(35);
  });
});

// ─── Point Allocation ─────────────────────────────────────────────

describe('Point Allocation', () => {
  it('returns correct attribute points for each priority', () => {
    expect(getAttributePoints('primary', 'standard')).toBe(7);
    expect(getAttributePoints('secondary', 'standard')).toBe(5);
    expect(getAttributePoints('tertiary', 'standard')).toBe(3);
  });

  it('returns scaled points for experienced template', () => {
    expect(getAttributePoints('primary', 'experienced')).toBe(8);
    expect(getAbilityPoints('primary', 'experienced')).toBe(14);
  });

  it('returns scaled points for ancient template', () => {
    expect(getAttributePoints('primary', 'ancient')).toBe(12);
    expect(getAbilityPoints('primary', 'ancient')).toBe(20);
  });

  it('counts attribute dots spent correctly', () => {
    // Default physical starts at {1,1,1}, so 0 dots spent
    const empty = { strength: 1 as const, dexterity: 1 as const, stamina: 1 as const };
    expect(countAttributeDotsSpent(empty)).toBe(0);

    // Spent 7 dots: {4, 3, 2} → (4-1)+(3-1)+(2-1) = 3+2+1 = 6... wait
    const allocated = { strength: 4 as const, dexterity: 3 as const, stamina: 2 as const };
    expect(countAttributeDotsSpent(allocated)).toBe(6);
  });

  it('counts ability dots spent correctly', () => {
    const empty = { alertness: 0, athletics: 0, awareness: 0, brawl: 0, dodge: 0, empathy: 0, expression: 0, intimidation: 0, streetwise: 0, subterfuge: 0 };
    expect(countAbilityDotsSpent(empty)).toBe(0);

    const partial = { ...empty, alertness: 3, athletics: 2, brawl: 1 };
    expect(countAbilityDotsSpent(partial)).toBe(6);
  });
});

// ─── Attribute Validation ─────────────────────────────────────────

describe('Attribute Validation', () => {
  it('validates correct allocation', () => {
    const attrs = {
      physical: { strength: 4, dexterity: 3, stamina: 2 } as any,
      social: { charisma: 3, manipulation: 2, appearance: 2 } as any,
      mental: { perception: 2, intelligence: 2, wits: 1 } as any,
    };
    const priorities = { physical: 'primary' as const, social: 'secondary' as const, mental: 'tertiary' as const };
    const result = validateAttributeAllocation(attrs, priorities);
    // Physical: (4-1)+(3-1)+(2-1) = 3+2+1 = 6, expected 7 → warning
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects over-allocation', () => {
    const attrs = {
      physical: { strength: 5, dexterity: 5, stamina: 5 } as any, // 12 dots, way over
      social: { charisma: 1, manipulation: 1, appearance: 1 } as any,
      mental: { perception: 1, intelligence: 1, wits: 1 } as any,
    };
    const priorities = { physical: 'primary' as const, social: 'secondary' as const, mental: 'tertiary' as const };
    const result = validateAttributeAllocation(attrs, priorities);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('detects duplicate priorities', () => {
    const attrs = createEmptyAttributes();
    const priorities = { physical: 'primary' as const, social: 'primary' as const, mental: 'tertiary' as const };
    const result = validateAttributeAllocation(attrs, priorities);
    expect(result.isValid).toBe(false);
  });
});

// ─── Advantages Validation ────────────────────────────────────────

describe('Advantages Validation', () => {
  it('validates backgrounds within budget', () => {
    const bgs = [
      { name: 'memoriam' as const, rating: 3 as const },
      { name: 'haunt' as const, rating: 2 as const },
    ];
    const result = validateAdvantages(bgs, [], [], []);
    // 5 background dots allowed, 5 spent → valid for backgrounds
    expect(result.errors.filter(e => e.startsWith('Backgrounds'))).toHaveLength(0);
  });

  it('detects over-spending on arcanoi', () => {
    const arcanoi = [
      { name: 'argos' as const, rating: 3 as const },
      { name: 'castigate' as const, rating: 3 as const },
    ];
    // 6 dots, only 5 allowed → error
    const result = validateAdvantages([], arcanoi, [], []);
    expect(result.errors.some(e => e.startsWith('Arcanoi'))).toBe(true);
  });
});

// ─── Shadow System ────────────────────────────────────────────────

describe('Shadow System', () => {
  it('creates a shadow with archetype', () => {
    const shadow = createShadow('The Monster');
    expect(shadow.archetype).toBe('The Monster');
    expect(shadow.angst.permanent).toBe(1);
    expect(shadow.darkPassions).toHaveLength(0);
    expect(shadow.thorns).toHaveLength(0);
  });

  it('adds and removes dark passions', () => {
    let shadow = createShadow('The Monster');
    shadow = addDarkPassion(shadow, 'Destroy art', 'Hatred', 3 as any);
    expect(shadow.darkPassions).toHaveLength(1);
    expect(shadow.darkPassions[0].description).toBe('Destroy art');

    shadow = addDarkPassion(shadow, 'Isolate from friends', 'Jealousy', 2 as any);
    expect(shadow.darkPassions).toHaveLength(2);

    shadow = removeDarkPassion(shadow, shadow.darkPassions[0].id);
    expect(shadow.darkPassions).toHaveLength(1);
    expect(shadow.darkPassions[0].description).toBe('Isolate from friends');
  });

  it('adds and removes thorns', () => {
    let shadow = createShadow('The Monster');
    shadow = addThorn(shadow, 'whispers', 2 as any);
    expect(shadow.thorns).toHaveLength(1);

    // Duplicate should be ignored
    shadow = addThorn(shadow, 'whispers', 3 as any);
    expect(shadow.thorns).toHaveLength(1);

    shadow = addThorn(shadow, 'bad_luck', 1 as any);
    expect(shadow.thorns).toHaveLength(2);

    shadow = removeThorn(shadow, 'whispers');
    expect(shadow.thorns).toHaveLength(1);
    expect(shadow.thorns[0].name).toBe('bad_luck');
  });

  it('manages angst', () => {
    let shadow = createShadow('The Monster');
    shadow = gainAngst(shadow, 3);
    expect(shadow.angst.temporary).toBe(3);

    shadow = spendAngst(shadow, 1);
    expect(shadow.angst.temporary).toBe(2);

    // Can't go below 0
    shadow = spendAngst(shadow, 10);
    expect(shadow.angst.temporary).toBe(0);

    // Can't go above 10
    shadow = gainAngst(shadow, 15);
    expect(shadow.angst.temporary).toBe(10);
  });

  it('validates shadow correctly', () => {
    const validShadow = createShadow('The Monster');
    const result1 = validateShadow(validShadow);
    expect(result1.isValid).toBe(true);
    expect(result1.warnings.length).toBeGreaterThan(0); // No dark passions

    const invalid = createShadow('');
    const result2 = validateShadow(invalid);
    expect(result2.isValid).toBe(false);
  });

  it('calculates shadow trade correctly', () => {
    const trade = calculateShadowTrade(5);
    expect(trade.isValid).toBe(true);
    expect(trade.playerFreebies).toBe(5);

    const overTrade = calculateShadowTrade(10);
    expect(overTrade.isValid).toBe(false);
  });

  it('returns correct catharsis difficulties', () => {
    expect(getCatharsisDifficulty('corpus_destroyed')).toBe(8);
    expect(getCatharsisDifficulty('willpower_zero')).toBe(6);
    expect(getCatharsisDifficulty('fetter_lost')).toBe(7);
  });
});

// ─── Resources ────────────────────────────────────────────────────

describe('Resources', () => {
  it('creates default resources with memoriam bonus', () => {
    const r = createDefaultResources(3);
    expect(r.pathos.max).toBe(8); // 5 + 3
    expect(r.willpower.permanent).toBe(5);
    expect(r.corpus.max).toBe(10);
  });

  it('caps pathos max at 10', () => {
    const r = createDefaultResources(8);
    expect(r.pathos.max).toBe(10);
  });

  it('spends and gains pathos', () => {
    let r = createDefaultResources(0);
    expect(r.pathos.current).toBe(5);

    const after = spendPathos(r, 3);
    expect(after).not.toBeNull();
    expect(after!.pathos.current).toBe(2);

    const overspend = spendPathos(r, 10);
    expect(overspend).toBeNull();

    const gained = gainPathos(after!, 5);
    expect(gained.pathos.current).toBe(5); // Capped at max
  });

  it('spends and restores willpower', () => {
    let r = createDefaultResources();
    const after = spendWillpower(r, 1);
    expect(after).not.toBeNull();
    expect(after!.willpower.temporary).toBe(4);

    const restored = restoreWillpower(after!, 1);
    expect(restored.willpower.temporary).toBe(5);
  });

  it('handles corpus damage and healing', () => {
    let r = createDefaultResources();
    r = takeCorpusDamage(r, 4);
    expect(r.corpus.current).toBe(6);

    expect(isDestroyed(r)).toBe(false);

    r = takeCorpusDamage(r, 10);
    expect(r.corpus.current).toBe(0);
    expect(isDestroyed(r)).toBe(true);
  });

  it('heals corpus using pathos', () => {
    let r = createDefaultResources();
    r = takeCorpusDamage(r, 4);
    expect(r.corpus.current).toBe(6);

    // Heal 2 levels of normal damage costs 1 pathos
    const healed = healCorpus(r, 2, 'lethal');
    expect(healed).not.toBeNull();
    expect(healed!.corpus.current).toBe(8);
    expect(healed!.pathos.current).toBe(4); // 5 - 1
  });
});

// ─── Experience System ────────────────────────────────────────────

describe('Experience System', () => {
  it('calculates correct XP costs', () => {
    expect(calculateXpCost('attribute', 3)).toBe(12); // 3 × 4
    expect(calculateXpCost('ability', 2)).toBe(2);    // 2 × 1
    expect(calculateXpCost('new_ability', 0)).toBe(3);
    expect(calculateXpCost('arcanos', 3)).toBe(21);   // 3 × 7
    expect(calculateXpCost('willpower', 5)).toBe(15);  // 5 × 3
  });
});

// ─── Passion & Fetter Creation ────────────────────────────────────

describe('Passions and Fetters', () => {
  it('creates a passion with unique id', () => {
    const p = createPassion('Find my killer', 'Anger', 3 as any);
    expect(p.id).toBeDefined();
    expect(p.description).toBe('Find my killer');
    expect(p.emotion).toBe('Anger');
    expect(p.rating).toBe(3);
  });

  it('creates a fetter with unique id', () => {
    const f = createFetter('My childhood home', 'place', 2 as any);
    expect(f.id).toBeDefined();
    expect(f.type).toBe('place');
    expect(f.rating).toBe(2);
  });
});

// ─── THD Random Generation ────────────────────────────────────────

describe('THD Random Character Generation', () => {
  it('generates a complete random concept', () => {
    const concept = rollRandomCharacterConcept();
    expect(concept.age.label).toBeDefined();
    expect(concept.gender.label).toBeDefined();
    expect(concept.upbringing.label).toBeDefined();
    expect(concept.occupation.label).toBeDefined();
    expect(concept.causeOfDeath.label).toBeDefined();
    expect(concept.causeOfDeath.legion).toBeDefined();
    expect(concept.haunt.type.label).toBeDefined();
    expect(concept.haunt.size.label).toBeDefined();
    expect(concept.appearance.hairstyle.label).toBeDefined();
    expect(concept.appearance.hairLength.label).toBeDefined();
    expect(concept.appearance.hairTexture.label).toBeDefined();
    expect(concept.appearance.fashion.label).toBeDefined();
    expect(concept.regret.label).toBeDefined();
    expect(concept.personOfImportance.label).toBeDefined();
    expect(concept.passionSeed.action.label).toBeDefined();
    expect(concept.passionSeed.emotion.label).toBeDefined();
    expect(concept.fetterSeed.label).toBeDefined();
  });

  it('generates valid cause of death keys', () => {
    // Run 20 times to check randomness
    const validCauses = ['old_age', 'disease', 'violence', 'madness', 'happenstance', 'despair', 'mystery', 'fate'];
    for (let i = 0; i < 20; i++) {
      const concept = rollRandomCharacterConcept();
      expect(validCauses).toContain(concept.causeOfDeath.causeKey);
    }
  });
});

// ─── Step Navigation ──────────────────────────────────────────────

describe('Step Navigation', () => {
  it('navigates forward through steps', () => {
    expect(getNextStep('concept')).toBe('attributes');
    expect(getNextStep('attributes')).toBe('abilities');
    expect(getNextStep('abilities')).toBe('advantages');
    expect(getNextStep('advantages')).toBe('shadow');
    expect(getNextStep('shadow')).toBe('finishing');
    expect(getNextStep('finishing')).toBeNull();
  });

  it('navigates backward through steps', () => {
    expect(getPreviousStep('concept')).toBeNull();
    expect(getPreviousStep('attributes')).toBe('concept');
    expect(getPreviousStep('finishing')).toBe('shadow');
  });

  it('returns correct step indices', () => {
    expect(getStepIndex('concept')).toBe(0);
    expect(getStepIndex('finishing')).toBe(5);
    expect(getTotalSteps()).toBe(6);
  });
});

// ─── Freebie Point Costs ──────────────────────────────────────────

describe('Freebie Point Costs', () => {
  it('returns correct costs per type', () => {
    expect(getFreebiePointCost({ type: 'attribute', category: 'physical', key: 'strength' })).toBe(5);
    expect(getFreebiePointCost({ type: 'ability', category: 'talents', key: 'alertness' })).toBe(2);
    expect(getFreebiePointCost({ type: 'arcanos', name: 'argos' })).toBe(5);
    expect(getFreebiePointCost({ type: 'background', name: 'haunt' })).toBe(1);
    expect(getFreebiePointCost({ type: 'willpower' })).toBe(2);
    expect(getFreebiePointCost({ type: 'passion', id: 'x' })).toBe(2);
    expect(getFreebiePointCost({ type: 'fetter', id: 'x' })).toBe(2);
  });

  it('returns negative cost for shadow trade (gives freebies)', () => {
    expect(getFreebiePointCost({ type: 'shadow_trade', points: 5 })).toBe(-5);
  });
});

// ─── Finalize Character ───────────────────────────────────────────

describe('Finalize Character', () => {
  it('builds a complete character from creation state', () => {
    const state = createCharacterCreationState('standard');
    state.character.name = 'Marcus Cole';
    state.character.player = 'Trevor';
    state.character.concept = 'Murdered delivery driver';
    state.character.nature = 'Survivor';
    state.character.demeanor = 'Rebel';
    state.character.causeOfDeath = 'violence';
    state.character.legion = 'grim';
    state.character.shadow = createShadow('The Monster');

    const character = finalizeCharacter(state);

    expect(character.name).toBe('Marcus Cole');
    expect(character.player).toBe('Trevor');
    expect(character.causeOfDeath).toBe('violence');
    expect(character.legion).toBe('grim');
    expect(character.shadow.archetype).toBe('The Monster');
    expect(character.woundTrack).toHaveLength(7);
    expect(character.resources.willpower.permanent).toBe(5);
    expect(character.createdAt).toBeDefined();
    expect(character.updatedAt).toBeDefined();
  });

  it('applies memoriam bonus to pathos', () => {
    const state = createCharacterCreationState('standard');
    state.character.backgrounds = [{ name: 'memoriam', rating: 3 as any }];
    const character = finalizeCharacter(state);
    expect(character.resources.pathos.max).toBe(8); // 5 + 3
  });
});
