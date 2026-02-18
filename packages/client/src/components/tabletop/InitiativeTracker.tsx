import { useSocket } from '../../hooks/useSocket';
import { useSessionStore } from '../../stores/sessionStore';
import { ClientEvents } from '@wraith/shared';

interface InitiativeTrackerProps {
  sessionId: string;
}

export function InitiativeTracker({ sessionId }: InitiativeTrackerProps) {
  const { emit } = useSocket();
  const { combatState, isStoryteller } = useSessionStore();

  if (!combatState || !combatState.isActive) return null;

  const { round, initiativeOrder, currentTurn } = combatState;

  const handleAdvanceTurn = () => {
    emit(ClientEvents.ADVANCE_TURN, { sessionId });
  };

  const handleEndCombat = () => {
    emit(ClientEvents.END_COMBAT, { sessionId });
  };

  return (
    <div className="border border-orange-800/50 rounded-lg bg-orange-950/20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-orange-800/30 bg-orange-950/30 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
          Combat — Round {round}
        </h3>
        {isStoryteller && (
          <div className="flex gap-1">
            <button
              onClick={handleAdvanceTurn}
              className="px-2 py-0.5 text-xs rounded bg-orange-900/50 hover:bg-orange-800/60 text-orange-300 transition-colors"
            >
              Next Turn
            </button>
            <button
              onClick={handleEndCombat}
              className="px-2 py-0.5 text-xs rounded bg-red-900/50 hover:bg-red-800/60 text-red-300 transition-colors"
            >
              End
            </button>
          </div>
        )}
      </div>

      {/* Initiative Order */}
      <div className="px-3 py-2 space-y-1">
        {initiativeOrder.length === 0 ? (
          <div className="text-xs text-gray-600 italic text-center py-2">
            Waiting for initiative rolls...
          </div>
        ) : (
          initiativeOrder.map((entry, idx) => {
            const isCurrent = idx === currentTurn;
            return (
              <div
                key={entry.characterId}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                  isCurrent
                    ? 'bg-orange-900/40 border border-orange-700/50'
                    : entry.hasActed
                      ? 'opacity-40'
                      : 'bg-wraith-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  )}
                  <span
                    className={
                      isCurrent
                        ? 'text-orange-200 font-semibold'
                        : entry.hasActed
                          ? 'text-gray-600 line-through'
                          : 'text-gray-300'
                    }
                  >
                    {entry.characterName}
                  </span>
                </div>
                <span
                  className={`text-xs font-mono ${
                    isCurrent ? 'text-orange-400' : 'text-gray-600'
                  }`}
                >
                  {entry.initiative}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
