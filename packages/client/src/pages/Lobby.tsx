import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';
import { ClientEvents } from '@wraith/shared';
import type {
  CreateSessionResponse,
  JoinSessionResponse,
  SessionListItem,
} from '@wraith/shared';

export function Lobby() {
  const { emit, connected } = useSocket();
  const { identity, setDisplayName, lobbyList, setLobbyList } =
    useSessionStore();

  const [sessionName, setSessionName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [nameInput, setNameInput] = useState(identity.displayName);

  // Load available sessions on mount
  const refreshSessions = useCallback(() => {
    if (!connected) return;
    emit<SessionListItem[]>(ClientEvents.LIST_SESSIONS).then(setLobbyList);
  }, [connected, emit, setLobbyList]);

  useEffect(() => {
    refreshSessions();
    const interval = setInterval(refreshSessions, 5000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  // Name validation
  const hasName = nameInput.trim().length > 0;

  const saveName = () => {
    if (hasName) setDisplayName(nameInput.trim());
  };

  // Create session
  const handleCreate = async () => {
    if (!hasName) return;
    saveName();
    setError('');

    const response = await emit<CreateSessionResponse>(
      ClientEvents.CREATE_SESSION,
      {
        name: sessionName.trim() || 'New Session',
        storytellerIdentity: {
          clientId: identity.clientId,
          displayName: nameInput.trim(),
        },
      },
    );

    if (response?.sessionId) {
      window.location.href = `/session/${response.sessionId}`;
    }
  };

  // Join session
  const handleJoin = async (targetId?: string) => {
    if (!hasName) return;
    saveName();
    setError('');

    const sessionId = targetId || roomCode.trim().toUpperCase();
    if (!sessionId) {
      setError('Enter a room code');
      return;
    }

    const response = await emit<JoinSessionResponse>(
      ClientEvents.JOIN_SESSION,
      {
        sessionId,
        identity: {
          clientId: identity.clientId,
          displayName: nameInput.trim(),
        },
      },
    );

    if (response?.success) {
      window.location.href = `/session/${sessionId}`;
    } else {
      setError(response?.error || 'Failed to join session');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-wraith-200 tracking-wider">
        Multiplayer Lobby
      </h1>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
          }`}
        />
        <span className="text-gray-500">
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Display Name */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
        <label className="block text-sm font-bold uppercase tracking-wider text-wraith-300 mb-2">
          Your Display Name
        </label>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={saveName}
          placeholder="Enter your name..."
          className="w-full px-4 py-2.5 bg-wraith-800 border border-wraith-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500"
        />
        {!hasName && (
          <p className="text-red-400 text-xs mt-1">
            Name is required to create or join a session
          </p>
        )}
      </div>

      {/* Create Session */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          Create Session (Storyteller)
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Session name..."
            className="flex-1 px-4 py-2.5 bg-wraith-800 border border-wraith-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500"
          />
          <button
            onClick={handleCreate}
            disabled={!hasName || !connected}
            className="px-6 py-2.5 rounded-lg bg-wraith-700 hover:bg-wraith-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 font-semibold transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      {/* Join Session */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
          Join by Room Code
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Enter room code (e.g., A1B2C3)"
            maxLength={6}
            className="flex-1 px-4 py-2.5 bg-wraith-800 border border-wraith-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 uppercase tracking-widest text-center font-mono text-lg"
          />
          <button
            onClick={() => handleJoin()}
            disabled={!hasName || !connected}
            className="px-6 py-2.5 rounded-lg bg-wraith-700 hover:bg-wraith-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 font-semibold transition-colors"
          >
            Join
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Available Sessions */}
      {lobbyList.length > 0 && (
        <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-3">
            Available Sessions
          </h2>
          <div className="space-y-2">
            {lobbyList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-wraith-800/50 border border-wraith-700/50 hover:border-wraith-600/50 transition-colors"
              >
                <div>
                  <div className="text-gray-200 font-semibold">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ST: {item.storytellerName} &bull;{' '}
                    {item.playerCount} player
                    {item.playerCount !== 1 ? 's' : ''} &bull;{' '}
                    <span className="capitalize">{item.state}</span> &bull;{' '}
                    <span className="font-mono text-wraith-400">
                      {item.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(item.id)}
                  disabled={!hasName || !connected}
                  className="px-4 py-1.5 rounded bg-wraith-700 hover:bg-wraith-600 disabled:opacity-40 text-gray-300 text-sm font-semibold transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
