import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Character } from '@wraith/shared';

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

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isStoryteller = campaign?.storytellerId === user?.id;

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

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
      }
    } catch {
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
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
              <a
                key={char.id}
                href={`/characters/${char.id}`}
                className="p-3 rounded border border-wraith-800 bg-wraith-900/30 hover:border-wraith-600 transition-colors"
              >
                <div className="font-serif text-wraith-200">{char.name}</div>
                <div className="text-xs text-gray-500">
                  {char.concept} &middot; {char.nature}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Start Session (ST only) */}
      {isStoryteller && (
        <div className="mb-6">
          <h2 className="text-xl font-serif text-wraith-300 mb-3 border-b border-wraith-800 pb-2">
            Sessions
          </h2>
          <a
            href="/lobby"
            className="inline-block px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm transition-colors"
          >
            Start New Session
          </a>
        </div>
      )}
    </div>
  );
}
