import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { CampaignCard } from '../components/campaign/CampaignCard';

interface CampaignRow {
  id: string;
  name: string;
  description: string;
  storytellerId: string | null;
  inviteCode: string | null;
  createdAt: string;
  characterIds?: string[];
}

export function Campaigns() {
  const { isAuthenticated, getAuthHeaders, user, isLoading: authLoading } = useAuth();
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Join form
  const [inviteInput, setInviteInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authIsLoading) {
      fetchCampaigns();
    }
  }, [isAuthenticated, authIsLoading]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        setNewName('');
        setNewDesc('');
        setShowCreate(false);
        fetchCampaigns();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to create campaign (${res.status})`);
      }
    } catch {
      setError('Failed to create campaign — network error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    setJoinError(null);
    try {
      const res = await fetch(`/api/campaigns/join/${inviteInput.trim().toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setInviteInput('');
        window.location.href = `/campaigns/${data.campaignId}`;
      } else {
        const data = await res.json();
        setJoinError(data.error || 'Invalid invite code');
      }
    } catch {
      setJoinError('Failed to join campaign');
    }
  };

  // Wait for auth to finish loading before showing "sign in" screen
  if (authIsLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <h1 className="text-3xl font-serif text-wraith-200 mb-4">Campaigns</h1>
        <p className="text-gray-400 mb-6">Sign in to create and manage campaigns.</p>
        <a
          href="/auth"
          className="inline-block px-6 py-3 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-wraith-200">Campaigns</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {/* Create Campaign Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 rounded-lg border border-wraith-800 bg-wraith-900/50 space-y-3"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1">Campaign Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500"
              placeholder="e.g. Shadows Over Stygia"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 h-20 resize-none"
              placeholder="Brief description of your chronicle..."
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Campaign'}
          </button>
        </form>
      )}

      {/* Join Campaign */}
      <div className="mb-6 p-4 rounded-lg border border-wraith-800 bg-wraith-900/30">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Join a Campaign</h2>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 font-mono uppercase text-sm"
            placeholder="Invite code"
            maxLength={6}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded text-sm transition-colors"
          >
            Join
          </button>
        </form>
        {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No campaigns yet.</p>
          <p className="text-sm">Create one to start your chronicle, or join one with an invite code.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              playerCount={c.characterIds?.length}
              inviteCode={c.inviteCode}
              isStoryteller={c.storytellerId === user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
