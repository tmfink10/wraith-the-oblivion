import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { useSessionStore } from '../stores/sessionStore';
import { useCharacterStore } from '../stores/characterStore';
import { useAuth } from '../hooks/useAuth';
import { ClientEvents } from '@wraith/shared';
import type { JoinSessionResponse } from '@wraith/shared';
import { ChatLog } from '../components/tabletop/ChatLog';
import { PlayerList } from '../components/tabletop/PlayerList';
import { DicePanel } from '../components/tabletop/DicePanel';
import { InitiativeTracker } from '../components/tabletop/InitiativeTracker';
import { GameMap } from '../components/tabletop/GameMap';

interface GameSessionProps {
  sessionId: string;
}

export function GameSession({ sessionId }: GameSessionProps) {
  const { emit, connected } = useSocket();
  const {
    identity,
    currentSession,
    isStoryteller,
    setCurrentSession,
    leaveSession,
  } = useSessionStore();
  const { characters, loadCharacters } = useCharacterStore();
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  // Load characters from server so they're available for selection
  useEffect(() => {
    loadCharacters(getAuthHeaders());
  }, [isAuthenticated]);

  // Wire all socket events
  useSessionSocket(sessionId);

  // Join session on mount (or rejoin on page refresh)
  useEffect(() => {
    if (!connected || !sessionId || !identity.displayName) return;

    const join = async () => {
      const response = await emit<JoinSessionResponse>(
        ClientEvents.JOIN_SESSION,
        {
          sessionId,
          identity: {
            clientId: identity.clientId,
            displayName: identity.displayName,
          },
        },
      );

      if (response?.success) {
        setCurrentSession(response.session);
      } else {
        setError(response?.error || 'Failed to join session');
      }
      setJoining(false);
    };

    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        emit(ClientEvents.LEAVE_SESSION, { sessionId });
        leaveSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── No name guard ────────────────────────────────────────
  if (!identity.displayName) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Set your display name in the lobby first.
          </p>
          <a
            href="/lobby"
            className="px-4 py-2 rounded bg-wraith-700 hover:bg-wraith-600 text-gray-200 transition-colors"
          >
            Go to Lobby
          </a>
        </div>
      </div>
    );
  }

  // ─── Loading / Error ──────────────────────────────────────
  if (joining) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-gray-500 text-lg animate-pulse">
          Joining session...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a
            href="/lobby"
            className="px-4 py-2 rounded bg-wraith-700 hover:bg-wraith-600 text-gray-200 transition-colors"
          >
            Back to Lobby
          </a>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return null;
  }

  // ─── LOBBY STATE ──────────────────────────────────────────
  if (currentSession.state === 'lobby') {
    return <LobbyWaiting sessionId={sessionId} />;
  }

  // ─── ACTIVE STATE ─────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Left: Map + Dice (2/3) */}
      <div className="flex-[2] flex flex-col gap-3 min-w-0">
        <GameMap sessionId={sessionId} />
        <DicePanel sessionId={sessionId} />
      </div>

      {/* Right: Chat + Initiative + Players (1/3) */}
      <div className="flex-1 flex flex-col gap-3 min-w-[280px] max-w-[360px]">
        <PlayerList />
        <InitiativeTracker sessionId={sessionId} />
        <div className="flex-1 min-h-0">
          <ChatLog sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

// ─── Lobby Waiting Room ────────────────────────────────────────

function LobbyWaiting({ sessionId }: { sessionId: string }) {
  const { emit } = useSocket();
  const { currentSession, isStoryteller, identity } = useSessionStore();
  const { characters } = useCharacterStore();
  const [selectedChar, setSelectedChar] = useState('');

  if (!currentSession) return null;

  const handleStartGame = () => {
    emit(ClientEvents.UPDATE_STATE, {
      sessionId,
      newState: 'active',
    });
  };

  const handleSelectCharacter = (charId: string) => {
    setSelectedChar(charId);
    emit(ClientEvents.SELECT_CHARACTER, {
      sessionId,
      characterId: charId,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Session Info */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-wraith-200 mb-2">
          {currentSession.name}
        </h1>
        <div className="text-lg font-mono text-wraith-400 tracking-[0.3em]">
          Room Code: {currentSession.id}
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Share this code with other players so they can join
        </p>
      </div>

      {/* Player List */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          Players ({currentSession.players.length})
        </h2>
        <div className="space-y-2">
          {currentSession.players.map((player) => (
            <div
              key={player.userId}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-wraith-800/30"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    player.isConnected ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
                <span className="text-gray-300">{player.displayName}</span>
                {player.isStoryteller && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-wraith-700 text-wraith-300 font-bold uppercase">
                    ST
                  </span>
                )}
              </div>
              {player.characterId && (
                <span className="text-xs text-gray-500">
                  Character selected
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Character Selection (non-ST) */}
      {!isStoryteller && characters.length > 0 && (
        <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
            Select Your Character
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelectCharacter(char.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedChar === char.id
                    ? 'border-wraith-500 bg-wraith-800/60'
                    : 'border-wraith-700/50 bg-wraith-800/30 hover:border-wraith-600'
                }`}
              >
                <div className="text-sm font-semibold text-gray-200">
                  {char.name}
                </div>
                <div className="text-xs text-gray-500">{char.concept}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ST Start Button */}
      {isStoryteller && (
        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="px-8 py-3 rounded-lg bg-wraith-600 hover:bg-wraith-500 text-white font-bold text-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Waiting indicator for non-ST */}
      {!isStoryteller && (
        <div className="text-center text-gray-500 text-sm animate-pulse">
          Waiting for the Storyteller to start the game...
        </div>
      )}
    </div>
  );
}
