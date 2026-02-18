import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';
import { ClientEvents } from '@wraith/shared';
import type { Character, CreateSessionResponse } from '@wraith/shared';

interface CampaignData {
  id: string;
  name: string;
  description: string;
  storytellerId: string | null;
  inviteCode: string | null;
  characterIds: string[];
  createdAt: string;
}

interface CampaignDetailProps {
  campaignId: string;
}

interface SessionData {
  id: string;
  name: string;
  campaignId: string | null;
  mode: string;
  state: string;
  createdAt: string;
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const { emit, connected } = useSocket();
  const { identity, setDisplayName } = useSessionStore();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [campaignSessions, setCampaignSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [addingChar, setAddingChar] = useState(false);
  const [removingCharId, setRemovingCharId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  const isStoryteller = campaign?.storytellerId === user?.id;

  useEffect(() => {
    fetchCampaign();
    fetchMyCharacters();
    fetchCampaignSessions();
  }, [campaignId, isAuthenticated]);

  // Sync display name from auth user
  useEffect(() => {
    if (user?.displayName && !identity.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setError('Campaign not found');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCampaign(data);

      // Fetch character details
      if (data.characterIds?.length > 0) {
        const charPromises = data.characterIds.map((id: string) =>
          fetch(`/api/characters/${id}`, { headers: getAuthHeaders() }).then((r) =>
            r.ok ? r.json() : null,
          ),
        );
        const chars = (await Promise.all(charPromises)).filter(Boolean);
        setCharacters(chars);
      } else {
        setCharacters([]);
      }
    } catch {
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCharacters = async () => {
    try {
      const res = await fetch('/api/characters', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMyCharacters(data);
      }
    } catch {
      // Silently fail — characters just won't be available to add
    }
  };

  const handleAddCharacter = async (charId: string) => {
    setAddingChar(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/characters/${charId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        // Refresh campaign data to get updated characterIds
        await fetchCampaign();
      }
    } catch {
      // Silently fail
    } finally {
      setAddingChar(false);
    }
  };

  const handleRemoveCharacter = async (charId: string) => {
    setRemovingCharId(charId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/characters/${charId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        // Refresh campaign data
        await fetchCampaign();
      }
    } catch {
      // Silently fail
    } finally {
      setRemovingCharId(null);
    }
  };

  const fetchCampaignSessions = async () => {
    try {
      const res = await fetch('/api/sessions', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const allSessions: SessionData[] = await res.json();
        // Filter to only sessions belonging to this campaign
        const filtered = allSessions.filter((s) => s.campaignId === campaignId);
        setCampaignSessions(filtered);
      }
    } catch {
      // Silently fail
    }
  };

  const handleCreateSession = async () => {
    if (!connected) return;
    setCreatingSession(true);

    // Ensure we have a display name
    const displayName = user?.displayName || identity.displayName || user?.username || 'Storyteller';
    if (!identity.displayName) {
      setDisplayName(displayName);
    }

    try {
      const response = await emit<CreateSessionResponse>(
        ClientEvents.CREATE_SESSION,
        {
          name: sessionName.trim() || `${campaign?.name ?? 'Campaign'} Session`,
          campaignId,
          storytellerIdentity: {
            clientId: identity.clientId,
            displayName,
          },
        },
      );

      if (response?.sessionId) {
        window.location.href = `/session/${response.sessionId}`;
      }
    } catch {
      setCreatingSession(false);
    }
  };

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaign((prev) => (prev ? { ...prev, inviteCode: data.inviteCode } : prev));
      }
    } catch {
      // Silently fail
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!campaign?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(campaign.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      // Fallback — select text
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-12">Loading campaign…</p>;
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Campaign not found'}</p>
        <a href="/campaigns" className="text-wraith-400 hover:text-wraith-300 text-sm">
          Back to Campaigns
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Back link */}
      <a
        href="/campaigns"
        className="inline-block text-sm text-wraith-400 hover:text-wraith-300 mb-4 transition-colors"
      >
        &larr; All Campaigns
      </a>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif text-wraith-200 mb-1">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-gray-400">{campaign.description}</p>
            )}
          </div>
          {isStoryteller && (
            <span className="px-3 py-1 text-sm bg-amber-900/40 text-amber-300 border border-amber-800/50 rounded">
              Storyteller
            </span>
          )}
        </div>
      </div>

      {/* Invite Section (ST only) */}
      {isStoryteller && isAuthenticated && (
        <div className="mb-6 p-4 rounded-lg border border-wraith-800 bg-wraith-900/50">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Invite Players</h2>
          {campaign.inviteCode ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-wraith-200 tracking-widest">
                {campaign.inviteCode}
              </span>
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1 text-xs bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded transition-colors"
              >
                {copiedInvite ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleGenerateInvite}
                disabled={inviteLoading}
                className="px-3 py-1 text-xs bg-wraith-800 hover:bg-wraith-700 text-gray-400 rounded transition-colors"
              >
                Regenerate
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateInvite}
              disabled={inviteLoading}
              className="px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm transition-colors disabled:opacity-50"
            >
              {inviteLoading ? 'Generating…' : 'Generate Invite Code'}
            </button>
          )}
        </div>
      )}

      {/* Character Roster */}
      <div className="mb-6">
        <h2 className="text-xl font-serif text-wraith-300 mb-3 border-b border-wraith-800 pb-2">
          Character Roster
        </h2>
        {characters.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            No characters assigned to this campaign yet.
          </p>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="p-3 rounded border border-wraith-800 bg-wraith-900/30 hover:border-wraith-600 transition-colors flex items-center justify-between"
              >
                <a href={`/characters/${char.id}`} className="flex-1 min-w-0">
                  <div className="font-serif text-wraith-200">{char.name}</div>
                  <div className="text-xs text-gray-500">
                    {char.concept} {char.nature ? `\u00B7 ${char.nature}` : ''}
                  </div>
                </a>
                {isStoryteller && (
                  <button
                    onClick={() => handleRemoveCharacter(char.id)}
                    disabled={removingCharId === char.id}
                    className="ml-2 px-2 py-1 text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Remove from campaign"
                  >
                    {removingCharId === char.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Character Section */}
        {isAuthenticated && (
          <div className="mt-4">
            {(() => {
              const campaignCharIds = campaign?.characterIds ?? [];
              const available = myCharacters.filter(
                (c) => !campaignCharIds.includes(c.id),
              );
              if (available.length === 0 && myCharacters.length === 0) {
                return (
                  <div className="text-sm text-gray-500">
                    <a
                      href="/create"
                      className="text-wraith-400 hover:text-wraith-300 transition-colors"
                    >
                      Create a character
                    </a>{' '}
                    to add to this campaign.
                  </div>
                );
              }
              if (available.length === 0) {
                return (
                  <p className="text-xs text-gray-600">
                    All your characters are already in this campaign.
                  </p>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <select
                    id="add-char-select"
                    className="flex-1 px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 focus:outline-none focus:border-wraith-600"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a character to add...
                    </option>
                    {available.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || 'Unnamed'} {c.concept ? `— ${c.concept}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById(
                        'add-char-select',
                      ) as HTMLSelectElement;
                      if (select?.value) {
                        handleAddCharacter(select.value);
                      }
                    }}
                    disabled={addingChar}
                    className="px-4 py-2 text-sm bg-wraith-700 hover:bg-wraith-600 text-gray-200 rounded transition-colors disabled:opacity-50"
                  >
                    {addingChar ? 'Adding...' : 'Add'}
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="mb-6">
        <h2 className="text-xl font-serif text-wraith-300 mb-3 border-b border-wraith-800 pb-2">
          Sessions
        </h2>

        {/* Existing Sessions */}
        {campaignSessions.length > 0 && (
          <div className="space-y-2 mb-4">
            {campaignSessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3 rounded-lg bg-wraith-900/30 border border-wraith-800 hover:border-wraith-600 transition-colors"
              >
                <div>
                  <div className="text-gray-200 font-semibold text-sm">
                    {sess.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="capitalize">{sess.state}</span>
                    {' \u00B7 '}
                    <span className="font-mono text-wraith-400">{sess.id}</span>
                  </div>
                </div>
                <a
                  href={`/session/${sess.id}`}
                  className="px-3 py-1 text-xs bg-wraith-700 hover:bg-wraith-600 text-gray-200 rounded transition-colors"
                >
                  {sess.state === 'lobby' ? 'Join Lobby' : 'Rejoin'}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Create New Session (ST only) */}
        {isStoryteller && (
          <div className="bg-wraith-900/40 border border-wraith-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="text-xs text-gray-500">
                {connected ? 'Connected' : 'Connecting to server...'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                placeholder={`${campaign?.name ?? 'Campaign'} Session`}
                className="flex-1 px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
              />
              <button
                onClick={handleCreateSession}
                disabled={!connected || creatingSession}
                className="px-5 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSession ? 'Creating...' : 'Start New Session'}
              </button>
            </div>
          </div>
        )}

        {/* Non-ST: show link to lobby if no sessions */}
        {!isStoryteller && campaignSessions.length === 0 && (
          <p className="text-gray-500 text-sm py-2">
            No active sessions. The Storyteller can start a new session.
          </p>
        )}
      </div>
    </div>
  );
}
