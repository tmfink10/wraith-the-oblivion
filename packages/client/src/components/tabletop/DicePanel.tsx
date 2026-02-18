import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { ClientEvents } from '@wraith/shared';

interface DicePanelProps {
  sessionId: string;
}

export function DicePanel({ sessionId }: DicePanelProps) {
  const { emit } = useSocket();
  const [poolSize, setPoolSize] = useState(5);
  const [difficulty, setDifficulty] = useState(6);
  const [isSpecialty, setIsSpecialty] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [label, setLabel] = useState('');

  const handleRoll = () => {
    emit(ClientEvents.ROLL_DICE, {
      sessionId,
      poolSize,
      difficulty,
      isSpecialty,
      isPrivate,
      label: label.trim() || undefined,
    });
    setLabel('');
  };

  return (
    <div className="border border-wraith-800 rounded-lg bg-wraith-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-wraith-800 bg-wraith-900/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-wraith-300">
          Dice Roller
        </h3>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Label */}
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          placeholder="Roll label (optional)"
          className="w-full px-3 py-1.5 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
        />

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Pool */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Pool</label>
            <button
              onClick={() => setPoolSize(Math.max(1, poolSize - 1))}
              className="w-6 h-6 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-400 text-sm"
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-bold text-wraith-200">
              {poolSize}
            </span>
            <button
              onClick={() => setPoolSize(Math.min(20, poolSize + 1))}
              className="w-6 h-6 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-400 text-sm"
            >
              +
            </button>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Diff</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="px-2 py-1 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 focus:outline-none"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Specialty */}
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpecialty}
              onChange={(e) => setIsSpecialty(e.target.checked)}
              className="rounded border-wraith-700 bg-wraith-800 text-wraith-500 focus:ring-wraith-600"
            />
            Spec
          </label>

          {/* Private */}
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-wraith-700 bg-wraith-800 text-wraith-500 focus:ring-wraith-600"
            />
            Private
          </label>
        </div>

        {/* Roll button */}
        <button
          onClick={handleRoll}
          className="w-full py-2 rounded-lg bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold text-sm transition-colors"
        >
          Roll {poolSize}d10
        </button>
      </div>
    </div>
  );
}
