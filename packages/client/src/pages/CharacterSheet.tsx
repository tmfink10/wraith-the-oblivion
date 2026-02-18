import { useEffect, useState } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useAuth } from '../hooks/useAuth';
import { AttributeBlock } from '../components/character/AttributeBlock';
import { AbilityList } from '../components/character/AbilityList';
import { BackgroundList } from '../components/character/BackgroundList';
import { ArcanaiPanel } from '../components/character/ArcanaiPanel';
import { PassionList } from '../components/character/PassionList';
import { FetterList } from '../components/character/FetterList';
import { ShadowPanel } from '../components/character/ShadowPanel';
import { ResourceTracker } from '../components/character/ResourceTracker';
import { exportCharacterPdf } from '../utils/characterPdf';
import type { Character } from '@wraith/shared';

interface CharacterSheetProps {
  characterId?: string;
}

export function CharacterSheet({ characterId }: CharacterSheetProps) {
  const { characters, selectedCharacterId, loadCharacter, deleteCharacterFromServer, isLoading } = useCharacterStore();
  const { getAuthHeaders } = useAuth();
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = characterId || selectedCharacterId;
  const character = characters.find((c) => c.id === id);

  // Fetch character from server if not in local store
  useEffect(() => {
    if (id && !character && !fetchAttempted && !isLoading) {
      setFetchAttempted(true);
      loadCharacter(id, getAuthHeaders());
    }
  }, [id, character, fetchAttempted, isLoading]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Loading character...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-gray-400">
          {fetchAttempted ? 'Character not found' : 'No character selected'}
        </h2>
        <a
          href="/create"
          className="mt-4 inline-block px-4 py-2 bg-wraith-700 hover:bg-wraith-600 text-gray-200 rounded transition-colors"
        >
          Create New Character
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-wraith-200">{character.name}</h1>
            <p className="text-gray-400 mt-1">{character.concept}</p>
          </div>
          <div className="text-right text-sm space-y-1 flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => exportCharacterPdf(character as Character)}
                className="px-3 py-1.5 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded text-xs transition-colors"
              >
                Export PDF
              </button>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-wraith-800 hover:bg-red-900/60 text-gray-500 hover:text-red-400 border border-wraith-700 hover:border-red-800 rounded text-xs transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-red-400 text-xs mr-1">Delete?</span>
                  <button
                    onClick={async () => {
                      if (!id) return;
                      setDeleting(true);
                      const ok = await deleteCharacterFromServer(id, getAuthHeaders());
                      setDeleting(false);
                      if (ok) {
                        window.location.href = '/characters';
                      }
                    }}
                    disabled={deleting}
                    className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 rounded text-xs transition-colors disabled:opacity-50"
                  >
                    {deleting ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 bg-wraith-800 hover:bg-wraith-700 text-gray-400 rounded text-xs transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
            <div>
              <span className="text-gray-500">Player:</span>{' '}
              <span className="text-gray-300">{character.player}</span>
            </div>
            <div>
              <span className="text-gray-500">Template:</span>{' '}
              <span className="text-gray-300 capitalize">{character.experienceTemplate}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Nature:</span>{' '}
            <span className="text-gray-300">{character.nature}</span>
          </div>
          <div>
            <span className="text-gray-500">Demeanor:</span>{' '}
            <span className="text-gray-300">{character.demeanor}</span>
          </div>
          <div>
            <span className="text-gray-500">Cause of Death:</span>{' '}
            <span className="text-gray-300 capitalize">{character.causeOfDeath.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-gray-500">Legion:</span>{' '}
            <span className="text-gray-300 capitalize">{character.legion}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left Column — Attributes */}
        <div className="space-y-4">
          <AttributeBlock
            category="physical"
            categoryLabel="Physical"
            attributes={character.attributes.physical as unknown as Record<string, number>}
            readonly
          />
          <AttributeBlock
            category="social"
            categoryLabel="Social"
            attributes={character.attributes.social as unknown as Record<string, number>}
            readonly
          />
          <AttributeBlock
            category="mental"
            categoryLabel="Mental"
            attributes={character.attributes.mental as unknown as Record<string, number>}
            readonly
          />
        </div>

        {/* Center Column — Abilities */}
        <div className="space-y-4">
          <AbilityList
            category="talents"
            categoryLabel="Talents"
            abilities={character.abilities.talents as unknown as Record<string, number>}
            readonly
          />
          <AbilityList
            category="skills"
            categoryLabel="Skills"
            abilities={character.abilities.skills as unknown as Record<string, number>}
            readonly
          />
          <AbilityList
            category="knowledges"
            categoryLabel="Knowledges"
            abilities={character.abilities.knowledges as unknown as Record<string, number>}
            readonly
          />
        </div>

        {/* Right Column — Advantages & Resources */}
        <div className="space-y-4">
          <ResourceTracker
            pathos={character.resources.pathos}
            willpower={character.resources.willpower}
            corpus={character.resources.corpus}
            readonly
          />
          <BackgroundList backgrounds={character.backgrounds} readonly />
          <ArcanaiPanel arcanoi={character.arcanoi} readonly />
        </div>
      </div>

      {/* Bottom Row — Passions, Fetters, Shadow */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <PassionList passions={character.passions} readonly />
        <FetterList fetters={character.fetters} readonly />
        <ShadowPanel
          archetype={character.shadow.archetype}
          angst={character.shadow.angst}
          darkPassions={character.shadow.darkPassions}
          thorns={character.shadow.thorns}
          readonly
        />
      </div>

      {/* Experience */}
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4 mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300 mb-2">
          Experience
        </h3>
        <div className="flex gap-8 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>{' '}
            <span className="text-gray-200">{character.experience.total}</span>
          </div>
          <div>
            <span className="text-gray-500">Spent:</span>{' '}
            <span className="text-gray-200">{character.experience.spent}</span>
          </div>
          <div>
            <span className="text-gray-500">Available:</span>{' '}
            <span className="text-wraith-300 font-medium">{character.experience.available}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
