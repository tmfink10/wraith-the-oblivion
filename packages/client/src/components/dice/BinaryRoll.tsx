import type { BinaryRollWithOblivionResult } from '@wraith/shared';
import { describeBinaryOutcome } from '@wraith/shared';

interface BinaryRollProps {
  result: BinaryRollWithOblivionResult;
  label?: string;
  compact?: boolean;
}

const outcomeColors: Record<string, string> = {
  exceptional_positive: 'text-green-300',
  positive: 'text-green-400',
  negative: 'text-red-400',
  exceptional_negative: 'text-red-300',
  tie_reroll: 'text-yellow-400',
};

export function BinaryRoll({ result, label, compact }: BinaryRollProps) {
  const { binaryRoll, oblivionDie, tieHistory, isDoubleTie } = result;
  const outcomeLabel = describeBinaryOutcome(binaryRoll.outcome, isDoubleTie);
  const outcomeColor = isDoubleTie
    ? 'text-purple-300'
    : outcomeColors[binaryRoll.outcome] ?? 'text-gray-300';

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        {label && (
          <span className="text-gray-500 truncate max-w-[120px]">{label}:</span>
        )}
        <span className="w-6 h-6 flex items-center justify-center rounded bg-green-900/50 text-green-300 font-bold text-xs">
          {binaryRoll.positiveDie}
        </span>
        <span className="text-gray-600 text-xs">vs</span>
        <span className="w-6 h-6 flex items-center justify-center rounded bg-red-900/50 text-red-300 font-bold text-xs">
          {binaryRoll.negativeDie}
        </span>
        {oblivionDie.shadowInterjects && (
          <span className="w-6 h-6 flex items-center justify-center rounded bg-purple-900/50 text-purple-300 font-bold text-xs animate-pulse">
            {oblivionDie.value}
          </span>
        )}
        <span className={`font-semibold ${outcomeColor}`}>{outcomeLabel}</span>
      </div>
    );
  }

  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      {label && (
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </div>
      )}

      {/* Dice Display */}
      <div className="flex items-center justify-center gap-4 mb-3">
        {/* Positive Die */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-green-900/40 border-2 border-green-700/60 text-green-300 font-bold text-2xl shadow-lg shadow-green-900/30">
            {binaryRoll.positiveDie}
          </div>
          <span className="text-xs text-green-500 mt-1">Positive</span>
        </div>

        <span className="text-gray-600 font-bold text-lg">vs</span>

        {/* Negative Die */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-red-900/40 border-2 border-red-700/60 text-red-300 font-bold text-2xl shadow-lg shadow-red-900/30">
            {binaryRoll.negativeDie}
          </div>
          <span className="text-xs text-red-500 mt-1">Negative</span>
        </div>

        {/* Oblivion Die */}
        <div className="flex flex-col items-center">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 font-bold text-2xl shadow-lg ${
              oblivionDie.shadowInterjects
                ? 'bg-purple-900/60 border-purple-500/80 text-purple-200 shadow-purple-900/50 animate-pulse'
                : 'bg-purple-900/30 border-purple-800/50 text-purple-400 shadow-purple-900/20'
            }`}
          >
            {oblivionDie.value}
          </div>
          <span className="text-xs text-purple-500 mt-1">Oblivion</span>
        </div>
      </div>

      {/* Outcome */}
      <div className={`text-center text-lg font-bold ${outcomeColor}`}>
        {outcomeLabel}
      </div>

      {/* Tie History */}
      {tieHistory.length > 0 && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            {tieHistory.length} tie{tieHistory.length > 1 ? 's' : ''} rerolled
            {tieHistory.map((tie, i) => (
              <span key={i} className="ml-1 text-yellow-600">
                ({tie.positiveDie}={tie.negativeDie})
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Shadow Alert */}
      {oblivionDie.shadowInterjects && (
        <div className="mt-3 px-3 py-2 rounded bg-purple-900/30 border border-purple-800/50 text-center">
          <span className="text-xs text-purple-300 italic">
            The Shadow stirs... (Oblivion Die: {oblivionDie.value})
          </span>
        </div>
      )}
    </div>
  );
}
