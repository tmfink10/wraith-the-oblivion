import { useState, useCallback } from 'react';
import { useDiceStore } from '../../stores/diceStore';
import { DiceResult } from './DiceResult';

export function DiceRoller() {
  const [poolSize, setPoolSize] = useState(5);
  const [difficulty, setDifficulty] = useState(6);
  const [specialty, setSpecialty] = useState(false);
  const [label, setLabel] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const { rollHistory, roll, clearHistory } = useDiceStore();

  const handleRoll = useCallback(() => {
    setIsAnimating(true);

    // Brief animation delay
    setTimeout(() => {
      roll(poolSize, difficulty, specialty, label || undefined);
      setIsAnimating(false);
    }, 400);
  }, [poolSize, difficulty, specialty, label, roll]);

  const latestRoll = rollHistory[0];

  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-4">
        Dice Roller
      </h3>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Pool Size */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Dice Pool
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPoolSize(Math.max(1, poolSize - 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-lg font-bold text-wraith-200">
              {poolSize}
            </span>
            <button
              onClick={() => setPoolSize(Math.min(20, poolSize + 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Difficulty
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDifficulty(Math.max(2, difficulty - 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-lg font-bold text-wraith-200">
              {difficulty}
            </span>
            <button
              onClick={() => setDifficulty(Math.min(10, difficulty + 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Options row */}
      <div className="flex items-center gap-4 mb-4">
        {/* Specialty toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={specialty}
            onChange={(e) => setSpecialty(e.target.checked)}
            className="rounded border-wraith-700 bg-wraith-800 text-wraith-500 focus:ring-wraith-600"
          />
          Specialty
        </label>

        {/* Label input */}
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Roll label..."
          className="flex-1 px-2 py-1 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
        />
      </div>

      {/* Roll button */}
      <button
        onClick={handleRoll}
        disabled={isAnimating}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
          isAnimating
            ? 'bg-wraith-600 text-wraith-300 cursor-wait'
            : 'bg-wraith-700 hover:bg-wraith-600 text-gray-200 hover:text-white active:scale-[0.98]'
        }`}
      >
        {isAnimating ? (
          <span className="inline-flex items-center gap-2">
            <span className="dice-tumble">&#9860;</span>
            <span className="dice-tumble-delay">&#9861;</span>
            <span className="dice-tumble">&#9856;</span>
            Rolling...
          </span>
        ) : (
          `Roll ${poolSize}d10`
        )}
      </button>

      {/* Latest Result */}
      {latestRoll && (
        <div className="mt-4">
          <DiceResult
            result={latestRoll.result}
            label={latestRoll.label}
          />
        </div>
      )}

      {/* Roll History */}
      {rollHistory.length > 1 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              History
            </span>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {rollHistory.slice(1, 11).map((entry) => (
              <DiceResult
                key={entry.id}
                result={entry.result}
                label={entry.label}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* CSS for dice animation */}
      <style>{`
        @keyframes diceTumble {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .dice-tumble {
          display: inline-block;
          animation: diceTumble 0.4s ease-in-out infinite;
        }
        .dice-tumble-delay {
          display: inline-block;
          animation: diceTumble 0.4s ease-in-out infinite;
          animation-delay: 0.1s;
        }
      `}</style>
    </div>
  );
}
