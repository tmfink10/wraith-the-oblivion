import type { Resources, ExtendedDotRating } from '../types/character.js';
import type { DamageType } from '../types/dice.js';

// ─── Pathos ───────────────────────────────────────────────────────

export function spendPathos(resources: Resources, amount: number): Resources | null {
  if (resources.pathos.current < amount) return null;
  return {
    ...resources,
    pathos: {
      ...resources.pathos,
      current: (resources.pathos.current - amount) as ExtendedDotRating,
    },
  };
}

export function gainPathos(resources: Resources, amount: number): Resources {
  const newCurrent = Math.min(resources.pathos.max, resources.pathos.current + amount) as ExtendedDotRating;
  return {
    ...resources,
    pathos: { ...resources.pathos, current: newCurrent },
  };
}

// ─── Willpower ────────────────────────────────────────────────────

export function spendWillpower(resources: Resources, amount: number = 1): Resources | null {
  if (resources.willpower.temporary < amount) return null;
  return {
    ...resources,
    willpower: {
      ...resources.willpower,
      temporary: (resources.willpower.temporary - amount) as ExtendedDotRating,
    },
  };
}

export function restoreWillpower(resources: Resources, amount: number = 1): Resources {
  const newTemp = Math.min(
    resources.willpower.permanent,
    resources.willpower.temporary + amount,
  ) as ExtendedDotRating;
  return {
    ...resources,
    willpower: { ...resources.willpower, temporary: newTemp },
  };
}

export function restoreAllWillpower(resources: Resources): Resources {
  return {
    ...resources,
    willpower: { ...resources.willpower, temporary: resources.willpower.permanent },
  };
}

// ─── Corpus (Health) ──────────────────────────────────────────────

export function takeCorpusDamage(resources: Resources, amount: number): Resources {
  const newCurrent = Math.max(0, resources.corpus.current - amount) as ExtendedDotRating;
  return {
    ...resources,
    corpus: { ...resources.corpus, current: newCurrent },
  };
}

/**
 * Heal Corpus damage.
 * Normal damage: 1 Pathos heals 2 levels.
 * Aggravated damage: 1 Pathos heals 1 level.
 */
export function healCorpus(
  resources: Resources,
  levels: number,
  damageType: DamageType = 'lethal',
): Resources | null {
  const pathosCost = damageType === 'aggravated' ? levels : Math.ceil(levels / 2);
  const afterPathos = spendPathos(resources, pathosCost);
  if (!afterPathos) return null;

  const newCurrent = Math.min(afterPathos.corpus.max, afterPathos.corpus.current + levels) as ExtendedDotRating;
  return {
    ...afterPathos,
    corpus: { ...afterPathos.corpus, current: newCurrent },
  };
}

export function isDestroyed(resources: Resources): boolean {
  return resources.corpus.current <= 0;
}

// ─── Resource Summary ─────────────────────────────────────────────

export function getResourceSummary(resources: Resources): {
  pathos: string;
  willpower: string;
  corpus: string;
  isInDanger: boolean;
} {
  return {
    pathos: `${resources.pathos.current}/${resources.pathos.max}`,
    willpower: `${resources.willpower.temporary}/${resources.willpower.permanent}`,
    corpus: `${resources.corpus.current}/${resources.corpus.max}`,
    isInDanger:
      resources.corpus.current <= 2 ||
      resources.pathos.current <= 1 ||
      resources.willpower.temporary <= 1,
  };
}
