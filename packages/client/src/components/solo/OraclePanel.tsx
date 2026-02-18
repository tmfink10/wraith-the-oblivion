import { useState, useCallback } from 'react';
import { useSoloStore } from '../../stores/soloStore';
import { BinaryRoll } from '../dice/BinaryRoll';
import { describeNpcPowerLevel } from '@wraith/shared';

export function OraclePanel() {
  const [binaryLabel, setBinaryLabel] = useState('');

  const {
    session,
    latestBinaryRoll,
    latestNpc,
    rollBinary,
    rollForNpc,
    adjustTemporaryAngst,
    adjustTemporaryShadowPoints,
    updateGoalProgress,
    completeGoal,
  } = useSoloStore();

  const handleBinaryRoll = useCallback(() => {
    rollBinary(binaryLabel || undefined);
    setBinaryLabel('');
  }, [binaryLabel, rollBinary]);

  if (!session) return null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Binary Roll Section */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          Binary Roll (Oracle)
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={binaryLabel}
            onChange={(e) => setBinaryLabel(e.target.value)}
            placeholder="What are you asking?"
            onKeyDown={(e) => e.key === 'Enter' && handleBinaryRoll()}
            className="flex-1 px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
          />
          <button
            onClick={handleBinaryRoll}
            className="px-4 py-2 rounded bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold text-sm transition-colors"
          >
            Roll
          </button>
        </div>
        {latestBinaryRoll && (
          <BinaryRoll result={latestBinaryRoll} compact />
        )}
      </div>

      {/* NPC Generator */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          NPC Generator
        </h3>
        <button
          onClick={rollForNpc}
          className="w-full py-2 rounded bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold text-sm transition-colors mb-3"
        >
          Generate NPC
        </button>
        {latestNpc && (
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Power:</span>
              <span className="text-wraith-200 font-semibold">
                {describeNpcPowerLevel(latestNpc.powerLevel.level)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dice Pool:</span>
              <span className="text-wraith-300">
                {latestNpc.powerLevel.dicePool[0]}-{latestNpc.powerLevel.dicePool[1]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Willpower:</span>
              <span className="text-wraith-300">{latestNpc.powerLevel.willpower}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expertise Diff:</span>
              <span className="text-wraith-300">{latestNpc.powerLevel.expertiseDifficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Weakness Diff:</span>
              <span className="text-wraith-300">{latestNpc.powerLevel.weaknessDifficulty}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-wraith-800">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Narrative Hooks</div>
              <div className="text-wraith-300">{latestNpc.descriptor}</div>
              <div className="text-gray-400 text-xs">Motivated by: {latestNpc.motivation}</div>
            </div>
          </div>
        )}
      </div>

      {/* Session Trackers */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          Session Trackers
        </h3>

        {/* Temporary Angst */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Temp Angst</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustTemporaryAngst(-1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-lg font-bold text-red-300">
              {session.temporaryAngst}
            </span>
            <button
              onClick={() => adjustTemporaryAngst(1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Shadow Points */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Shadow Points</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustTemporaryShadowPoints(-1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-lg font-bold text-purple-300">
              {session.temporaryShadowPoints}
            </span>
            <button
              onClick={() => adjustTemporaryShadowPoints(1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-wraith-800 hover:bg-wraith-700 text-gray-300 text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Goals */}
      {session.goals.length > 0 && (
        <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
            Goals
          </h3>
          <div className="space-y-2">
            {session.goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-2 rounded border ${
                  goal.isComplete
                    ? 'border-green-800/50 bg-green-900/20'
                    : 'border-wraith-700 bg-wraith-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm ${
                      goal.isComplete ? 'text-green-400 line-through' : 'text-gray-300'
                    }`}
                  >
                    {goal.description}
                  </span>
                  {!goal.isComplete && (
                    <button
                      onClick={() => completeGoal(goal.id)}
                      className="text-xs text-green-600 hover:text-green-400 transition-colors"
                    >
                      Done
                    </button>
                  )}
                </div>
                {!goal.isComplete && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-wraith-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-wraith-500 rounded-full transition-all"
                        style={{ width: `${(goal.progress / 10) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateGoalProgress(goal.id, goal.progress - 1)}
                        className="text-xs text-gray-600 hover:text-gray-400"
                      >
                        -
                      </button>
                      <span className="text-xs text-gray-500 w-6 text-center">
                        {goal.progress}/10
                      </span>
                      <button
                        onClick={() => updateGoalProgress(goal.id, goal.progress + 1)}
                        className="text-xs text-gray-600 hover:text-gray-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
