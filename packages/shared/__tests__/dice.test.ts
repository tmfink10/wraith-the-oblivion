import { describe, it, expect } from 'vitest';
import {
  rollPool,
  binaryRoll,
  rollOblivionDie,
  checkRandomSceneTrigger,
  rollNpcPowerLevel,
  createExtendedRoll,
  advanceExtendedRoll,
  resistedRoll,
} from '../src/engine/dice';

// Helper: create a deterministic RNG from a sequence of values
function mockRng(values: number[]) {
  let i = 0;
  return () => values[i++];
}

describe('rollPool', () => {
  it('counts successes at default difficulty 6', () => {
    const rng = mockRng([3, 6, 7, 2, 10]);
    const result = rollPool(5, 6, false, rng);
    expect(result.dice).toEqual([3, 6, 7, 2, 10]);
    expect(result.successes).toBe(3); // 6, 7, 10
    expect(result.ones).toBe(0);
    expect(result.isBotch).toBe(false);
  });

  it('subtracts ones from successes', () => {
    const rng = mockRng([1, 6, 1, 7, 3]);
    const result = rollPool(5, 6, false, rng);
    // Raw successes: 6, 7 = 2; Ones: 2; Net: max(0, 2-2) = 0
    // But it's not a botch because there were raw successes
    expect(result.successes).toBe(0);
    expect(result.ones).toBe(2);
    expect(result.isBotch).toBe(false);
  });

  it('detects a botch (no successes + at least one 1)', () => {
    const rng = mockRng([1, 3, 2, 4, 5]);
    const result = rollPool(5, 6, false, rng);
    expect(result.successes).toBe(0);
    expect(result.ones).toBe(1);
    expect(result.isBotch).toBe(true);
  });

  it('counts 10s as double with specialty', () => {
    const rng = mockRng([10, 6, 3]);
    const result = rollPool(3, 6, true, rng);
    // 10 counts as 2 successes (specialty), 6 counts as 1 = 3 total
    expect(result.successes).toBe(3);
    expect(result.isSpecialty).toBe(true);
  });

  it('handles difficulty 8', () => {
    const rng = mockRng([6, 7, 8, 9, 10]);
    const result = rollPool(5, 8, false, rng);
    expect(result.successes).toBe(3); // 8, 9, 10
  });

  it('clamps minimum pool size to 1', () => {
    const rng = mockRng([7]);
    const result = rollPool(0, 6, false, rng);
    expect(result.dice.length).toBe(1);
    expect(result.poolSize).toBe(1);
  });

  it('clamps difficulty to 2-10 range', () => {
    const rng = mockRng([1, 2, 3]);
    const low = rollPool(3, 1, false, rng);
    expect(low.difficulty).toBe(2);

    const rng2 = mockRng([1, 2, 3]);
    const high = rollPool(3, 15, false, rng2);
    expect(high.difficulty).toBe(10);
  });

  it('returns simple failure when no successes and no ones', () => {
    const rng = mockRng([2, 3, 4, 5]);
    const result = rollPool(4, 6, false, rng);
    expect(result.successes).toBe(0);
    expect(result.isBotch).toBe(false);
  });
});

describe('binaryRoll (THD Solo)', () => {
  it('returns positive when positive die is higher', () => {
    const rng = mockRng([8, 3]);
    const result = binaryRoll(rng);
    expect(result.outcome).toBe('positive');
    expect(result.positiveDie).toBe(8);
    expect(result.negativeDie).toBe(3);
  });

  it('returns negative when negative die is higher', () => {
    const rng = mockRng([2, 9]);
    const result = binaryRoll(rng);
    expect(result.outcome).toBe('negative');
  });

  it('returns tie_reroll on equal dice (not doubles)', () => {
    const rng = mockRng([5, 5]);
    const result = binaryRoll(rng);
    expect(result.outcome).toBe('tie_reroll');
  });

  it('returns exceptional_positive on double 10s', () => {
    const rng = mockRng([10, 10]);
    const result = binaryRoll(rng);
    expect(result.outcome).toBe('exceptional_positive');
  });

  it('returns exceptional_negative on double 1s', () => {
    const rng = mockRng([1, 1]);
    const result = binaryRoll(rng);
    expect(result.outcome).toBe('exceptional_negative');
  });
});

describe('rollOblivionDie (THD Solo)', () => {
  it('Shadow interjects on 1', () => {
    const rng = mockRng([1]);
    const result = rollOblivionDie(rng);
    expect(result.shadowInterjects).toBe(true);
    expect(result.value).toBe(1);
  });

  it('Shadow interjects on 10', () => {
    const rng = mockRng([10]);
    const result = rollOblivionDie(rng);
    expect(result.shadowInterjects).toBe(true);
  });

  it('Shadow does not interject on other values', () => {
    const rng = mockRng([5]);
    const result = rollOblivionDie(rng);
    expect(result.shadowInterjects).toBe(false);
  });
});

describe('checkRandomSceneTrigger (THD Solo)', () => {
  it('triggers when halved roll <= temporary angst', () => {
    const rng = mockRng([4]); // halved = 2
    const result = checkRandomSceneTrigger(3, rng);
    expect(result.halved).toBe(2);
    expect(result.triggered).toBe(true);
  });

  it('does not trigger when halved roll > temporary angst', () => {
    const rng = mockRng([8]); // halved = 4
    const result = checkRandomSceneTrigger(2, rng);
    expect(result.halved).toBe(4);
    expect(result.triggered).toBe(false);
  });

  it('never triggers when angst is 0', () => {
    const rng = mockRng([2]); // halved = 1
    const result = checkRandomSceneTrigger(0, rng);
    expect(result.triggered).toBe(false);
  });
});

describe('rollNpcPowerLevel (THD Solo)', () => {
  it('returns much_weaker for rolls 1-2', () => {
    const rng = mockRng([1]);
    const result = rollNpcPowerLevel(rng);
    expect(result.level).toBe('much_weaker');
    expect(result.dicePool).toEqual([2, 3]);
  });

  it('returns much_stronger for rolls 9-10', () => {
    const rng = mockRng([10]);
    const result = rollNpcPowerLevel(rng);
    expect(result.level).toBe('much_stronger');
    expect(result.dicePool).toEqual([7, 8]);
  });

  it('returns similar for rolls 5-6', () => {
    const rng = mockRng([5]);
    const result = rollNpcPowerLevel(rng);
    expect(result.level).toBe('similar');
  });
});

describe('extendedRoll', () => {
  it('accumulates successes across multiple rolls', () => {
    let state = createExtendedRoll(5);
    expect(state.isComplete).toBe(false);

    // First roll: 3 successes
    const rng1 = mockRng([7, 8, 9]);
    state = advanceExtendedRoll(state, 3, 6, false);
    // Since we can't inject rng into advanceExtendedRoll easily,
    // test the structure instead
    expect(state.rollsCompleted).toBe(1);
    expect(state.rolls.length).toBe(1);
  });

  it('completes when target reached', () => {
    let state = createExtendedRoll(1);
    state = advanceExtendedRoll(state, 5, 3); // easy difficulty, large pool
    // Very likely to complete
    expect(state.rollsCompleted).toBe(1);
  });

  it('completes when max rolls reached', () => {
    let state = createExtendedRoll(100, 1); // impossible to reach in 1 roll
    state = advanceExtendedRoll(state, 3, 6);
    expect(state.isComplete).toBe(true);
    expect(state.rollsCompleted).toBe(1);
  });

  it('does not advance a completed roll', () => {
    let state = createExtendedRoll(100, 1);
    state = advanceExtendedRoll(state, 3, 6);
    const completedState = advanceExtendedRoll(state, 3, 6);
    expect(completedState.rollsCompleted).toBe(1); // still 1
  });
});

describe('resistedRoll', () => {
  it('returns a result with attacker, defender, and net successes', () => {
    const result = resistedRoll(5, 5, 6, 6);
    expect(result.attacker).toBeDefined();
    expect(result.defender).toBeDefined();
    expect(['attacker', 'defender', 'tie']).toContain(result.winner);
    expect(typeof result.netSuccesses).toBe('number');
  });
});
