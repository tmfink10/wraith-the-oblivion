import type { DiceRollResult } from '@wraith/shared';

interface DiceResultProps {
  result: DiceRollResult;
  label?: string;
  compact?: boolean;
}

/**
 * Display a single dice roll result with color-coded individual dice.
 * - Success (>= difficulty): green
 * - Failure (< difficulty, not 1): gray
 * - One (1): red
 * - Ten (10): gold (especially if specialty)
 */
export function DiceResult({ result, label, compact = false }: DiceResultProps) {
  const getDieColor = (value: number): string => {
    if (value === 1) return 'bg-red-900/60 text-red-300 border-red-700';
    if (value === 10 && result.isSpecialty)
      return 'bg-yellow-900/60 text-yellow-300 border-yellow-600';
    if (value >= result.difficulty)
      return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
    return 'bg-gray-800/60 text-gray-500 border-gray-700';
  };

  const getSummaryText = (): string => {
    if (result.isBotch) return 'BOTCH!';
    if (result.successes === 0) return 'Failure';
    if (result.successes === 1) return '1 success';
    return `${result.successes} successes`;
  };

  const getSummaryColor = (): string => {
    if (result.isBotch) return 'text-red-400 font-bold';
    if (result.successes === 0) return 'text-gray-400';
    if (result.successes >= 5) return 'text-yellow-300 font-bold';
    return 'text-emerald-400 font-medium';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {label && <span className="text-gray-500">{label}:</span>}
        <span className={getSummaryColor()}>{getSummaryText()}</span>
        <span className="text-gray-600 text-xs">
          ({result.poolSize}d vs {result.difficulty})
        </span>
      </div>
    );
  }

  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-3">
      {label && (
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </div>
      )}

      {/* Individual dice */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {result.dice.map((value, i) => (
          <div
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-mono font-bold ${getDieColor(value)}`}
          >
            {value}
          </div>
        ))}
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-sm">
        <span className={getSummaryColor()}>{getSummaryText()}</span>
        <span className="text-gray-600 text-xs">
          Pool: {result.poolSize} | Diff: {result.difficulty}
          {result.isSpecialty && ' | Specialty'}
          {result.ones > 0 && ` | ${result.ones} one${result.ones > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}
