import { useEffect } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useAuth } from '../hooks/useAuth';

export function CharacterList() {
  const { characters, isLoading, error, loadCharacters } = useCharacterStore();
  const { isAuthenticated, getAuthHeaders } = useAuth();

  useEffect(() => {
    loadCharacters(getAuthHeaders());
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-wraith-200">My Characters</h1>
        <a
          href="/create"
          className="px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-sm transition-colors"
        >
          + New Character
        </a>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading characters…</p>
      ) : characters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No characters yet.</p>
          <p className="text-sm">
            <a href="/create" className="text-wraith-400 hover:text-wraith-300 underline transition-colors">
              Create your first character
            </a>{' '}
            to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {characters.map((c) => (
            <a
              key={c.id}
              href={`/characters/${c.id}`}
              className="block p-4 rounded-lg border border-wraith-800 bg-wraith-900/50 hover:border-wraith-600 hover:bg-wraith-900/80 transition-colors"
            >
              <h2 className="text-lg font-bold text-wraith-200">{c.name}</h2>
              <p className="text-sm text-gray-400 mt-1">{c.concept}</p>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Nature: {c.nature}</span>
                <span>Demeanor: {c.demeanor}</span>
                <span className="capitalize">Legion: {c.legion}</span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-600">
                <span className="capitalize">Template: {c.experienceTemplate}</span>
                {c.guild && <span className="capitalize">Guild: {c.guild}</span>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
