import { useSessionStore } from '../../stores/sessionStore';

export function PlayerList() {
  const { currentSession } = useSessionStore();

  if (!currentSession) return null;

  return (
    <div className="border border-wraith-800 rounded-lg bg-wraith-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-wraith-800 bg-wraith-900/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-wraith-300">
          Players ({currentSession.players.length})
        </h3>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {currentSession.players.map((player) => (
          <div
            key={player.userId}
            className="flex items-center gap-2 py-1"
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                player.isConnected
                  ? 'bg-green-500'
                  : 'bg-gray-600'
              }`}
            />
            <span
              className={`text-sm truncate ${
                player.isConnected ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {player.displayName}
            </span>
            {player.isStoryteller && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-wraith-700 text-wraith-300 font-bold uppercase tracking-wider flex-shrink-0">
                ST
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
