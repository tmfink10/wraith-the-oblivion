import { useState, useEffect } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useAuth } from '../hooks/useAuth';
import { useSoloStore } from '../stores/soloStore';
import { ScenePanel } from '../components/solo/ScenePanel';
import { OraclePanel } from '../components/solo/OraclePanel';
import { ShadowVoice } from '../components/solo/ShadowVoice';
import { RandomSceneAlert } from '../components/solo/RandomSceneAlert';

export function SoloPlay() {
  const { characters, loadCharacters, isLoading } = useCharacterStore();
  const { getAuthHeaders, isAuthenticated } = useAuth();

  // Load characters from server on mount
  useEffect(() => {
    loadCharacters(getAuthHeaders());
  }, [isAuthenticated]);
  const {
    phase,
    session,
    character,
    pendingScene,
    randomSceneCheck,
    shadowInterjection,
    pendingDiceOffer,
    eventLog,
    startSession,
    endSession,
    addGoal,
    removeGoal,
    finishGoalSetup,
    generateNewScene,
    acceptGeneratedScene,
    startCustomScene,
    endScene,
    acceptRandomScene,
    dismissRandomScene,
    addNarrativeEvent,
    dismissShadowInterjection,
    acceptShadowDiceOffer,
    rejectShadowDiceOffer,
  } = useSoloStore();

  // ─── Idle: Character Selection ─────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-wraith-100 mb-2">
            Solo Play
          </h1>
          <p className="text-gray-400">
            Select a character to begin a solo session using The Hopeful Damned oracle system.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-wraith-900/30 border border-wraith-800 rounded-lg">
            <p className="text-gray-500">Loading characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-12 bg-wraith-900/30 border border-wraith-800 rounded-lg">
            <p className="text-gray-500 mb-3">No characters available.</p>
            <a
              href="/create"
              className="inline-block px-6 py-2 rounded-lg bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold transition-colors"
            >
              Create a Character
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => startSession(char)}
                className="p-5 text-left bg-wraith-900/40 border border-wraith-800 rounded-lg hover:border-wraith-600 hover:bg-wraith-900/60 transition-all group"
              >
                <h3 className="text-lg font-bold text-wraith-200 group-hover:text-wraith-100 mb-1">
                  {char.name || 'Unnamed Wraith'}
                </h3>
                {char.concept && (
                  <p className="text-sm text-gray-500 mb-2">{char.concept}</p>
                )}
                <div className="flex gap-3 text-xs text-gray-600">
                  {char.nature && <span>Nature: {char.nature}</span>}
                  {char.shadow?.archetype && (
                    <span>Shadow: {char.shadow.archetype}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Goal Setup ────────────────────────────────────────────────

  if (phase === 'goal_setup') {
    return (
      <GoalSetupPhase
        goals={session?.goals ?? []}
        characterName={character?.name ?? 'Wraith'}
        onAddGoal={addGoal}
        onRemoveGoal={removeGoal}
        onFinish={finishGoalSetup}
        onCancel={endSession}
      />
    );
  }

  // ─── Scene Generate ────────────────────────────────────────────

  if (phase === 'scene_generate') {
    return (
      <SceneGeneratePhase
        sceneNumber={(session?.sceneHistory.length ?? 0) + 1}
        pendingScene={pendingScene}
        onGenerate={generateNewScene}
        onAccept={acceptGeneratedScene}
        onCustomScene={startCustomScene}
        onEndSession={endSession}
        shadowInterjection={shadowInterjection}
        pendingDiceOffer={pendingDiceOffer}
        onDismissShadow={dismissShadowInterjection}
        onAcceptDice={acceptShadowDiceOffer}
        onRejectDice={rejectShadowDiceOffer}
      />
    );
  }

  // ─── Scene Active ──────────────────────────────────────────────

  if (phase === 'scene_active' && session) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        {/* Session Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-wraith-200">
              {character?.name ?? 'Solo Session'}
            </h2>
            <span className="text-xs text-gray-500">
              Scene {session.currentScene.number} of {session.sceneHistory.length + 1}
            </span>
          </div>
          <button
            onClick={endSession}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            End Session
          </button>
        </div>

        {/* Main Layout: Scene Panel + Oracle Panel */}
        <div className="flex gap-4 h-[calc(100%-3rem)]">
          {/* Scene Panel (2/3) */}
          <div className="flex-[2] min-w-0">
            <ScenePanel
              scene={session.currentScene}
              events={eventLog}
              onAddNote={addNarrativeEvent}
              onEndScene={endScene}
            />
          </div>

          {/* Oracle Panel (1/3) */}
          <div className="flex-1 min-w-[280px]">
            <OraclePanel />
          </div>
        </div>

        {/* Shadow Voice Overlay */}
        {shadowInterjection && (
          <ShadowVoice
            interjection={shadowInterjection}
            hasDiceOffer={pendingDiceOffer !== null}
            onAcceptDice={acceptShadowDiceOffer}
            onRejectDice={rejectShadowDiceOffer}
            onDismiss={dismissShadowInterjection}
          />
        )}
      </div>
    );
  }

  // ─── Scene End Check (Random Scene) ────────────────────────────

  if (phase === 'scene_end_check' && randomSceneCheck) {
    return (
      <div>
        <RandomSceneAlert
          check={randomSceneCheck}
          onAccept={acceptRandomScene}
          onDismiss={dismissRandomScene}
        />
      </div>
    );
  }

  // Fallback
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────

interface GoalSetupPhaseProps {
  goals: Array<{ id: string; description: string; progress: number; isComplete: boolean }>;
  characterName: string;
  onAddGoal: (description: string) => void;
  onRemoveGoal: (id: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

function GoalSetupPhase({
  goals,
  characterName,
  onAddGoal,
  onRemoveGoal,
  onFinish,
  onCancel,
}: GoalSetupPhaseProps) {
  const [goalInput, setGoalInput] = useState('');

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      onAddGoal(goalInput.trim());
      setGoalInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-wraith-100 mb-2">
          Session Goals
        </h1>
        <p className="text-gray-400">
          What does <span className="text-wraith-300">{characterName}</span> hope
          to accomplish this session?
        </p>
      </div>

      <div className="bg-wraith-900/40 border border-wraith-800 rounded-lg p-6">
        {/* Goal Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
            placeholder="Enter a goal..."
            className="flex-1 px-4 py-3 bg-wraith-800 border border-wraith-700 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
          />
          <button
            onClick={handleAddGoal}
            disabled={!goalInput.trim()}
            className="px-5 py-3 rounded-lg bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Goal List */}
        {goals.length > 0 && (
          <div className="space-y-2 mb-6">
            {goals.map((goal, idx) => (
              <div
                key={goal.id}
                className="flex items-center justify-between px-4 py-3 bg-wraith-800/50 border border-wraith-700 rounded-lg"
              >
                <span className="text-gray-300">
                  <span className="text-gray-500 mr-2">{idx + 1}.</span>
                  {goal.description}
                </span>
                <button
                  onClick={() => onRemoveGoal(goal.id)}
                  className="text-sm text-gray-600 hover:text-red-400 transition-colors ml-3"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onFinish}
            className="flex-1 py-3 rounded-lg bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-bold text-lg transition-colors"
          >
            Begin Play
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-wraith-800 hover:bg-wraith-700 border border-wraith-700 text-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-3">
          Goals are optional. You can always add more during play.
        </p>
      </div>
    </div>
  );
}

interface SceneGeneratePhaseProps {
  sceneNumber: number;
  pendingScene: ReturnType<typeof useSoloStore.getState>['pendingScene'];
  onGenerate: () => void;
  onAccept: () => void;
  onCustomScene: (activity: string, focus: string) => void;
  onEndSession: () => void;
  shadowInterjection: ReturnType<typeof useSoloStore.getState>['shadowInterjection'];
  pendingDiceOffer: ReturnType<typeof useSoloStore.getState>['pendingDiceOffer'];
  onDismissShadow: () => void;
  onAcceptDice: () => void;
  onRejectDice: () => void;
}

function SceneGeneratePhase({
  sceneNumber,
  pendingScene,
  onGenerate,
  onAccept,
  onCustomScene,
  onEndSession,
  shadowInterjection,
  pendingDiceOffer,
  onDismissShadow,
  onAcceptDice,
  onRejectDice,
}: SceneGeneratePhaseProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [customFocus, setCustomFocus] = useState('');

  const handleCustomStart = () => {
    if (customActivity.trim() && customFocus.trim()) {
      onCustomScene(customActivity.trim(), customFocus.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-wraith-100 mb-2">
          Scene {sceneNumber}
        </h1>
        <p className="text-gray-400">
          Generate a scene prompt or create your own.
        </p>
      </div>

      <div className="space-y-4">
        {/* Generate Button */}
        <button
          onClick={onGenerate}
          className="w-full py-4 rounded-lg bg-wraith-800 hover:bg-wraith-700 border border-wraith-700 hover:border-wraith-600 text-gray-200 font-bold text-lg transition-all active:scale-[0.99]"
        >
          Roll Scene (Activity + Focus)
        </button>

        {/* Pending Scene Result */}
        {pendingScene && (
          <div className="bg-wraith-900/50 border border-wraith-700 rounded-lg p-6 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Activity ({pendingScene.activityRoll.index}) + Focus ({pendingScene.focusRoll.index})
            </div>
            <h2 className="text-3xl font-bold text-wraith-100 mb-4">
              {pendingScene.prompt}
            </h2>
            {pendingScene.oblivionDie.shadowInterjects && (
              <div className="mb-4 text-sm text-purple-400 italic">
                Oblivion Die: {pendingScene.oblivionDie.value} &mdash; The Shadow stirs...
              </div>
            )}
            <button
              onClick={onAccept}
              className="px-8 py-3 rounded-lg bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-bold transition-colors"
            >
              Play This Scene
            </button>
          </div>
        )}

        {/* Custom Scene Toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showCustom ? 'Hide custom scene' : 'Or enter a custom scene...'}
          </button>
        </div>

        {showCustom && (
          <div className="bg-wraith-900/30 border border-wraith-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Activity</label>
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="e.g., Investigating"
                  className="w-full px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Focus</label>
                <input
                  type="text"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  placeholder="e.g., A forgotten haunt"
                  className="w-full px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
                />
              </div>
            </div>
            <button
              onClick={handleCustomStart}
              disabled={!customActivity.trim() || !customFocus.trim()}
              className="w-full py-2 rounded bg-wraith-700 hover:bg-wraith-600 text-gray-200 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Custom Scene
            </button>
          </div>
        )}

        {/* End Session */}
        <div className="text-center pt-4">
          <button
            onClick={onEndSession}
            className="text-sm text-gray-600 hover:text-red-400 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Shadow Voice Overlay */}
      {shadowInterjection && (
        <ShadowVoice
          interjection={shadowInterjection}
          hasDiceOffer={pendingDiceOffer !== null}
          onAcceptDice={onAcceptDice}
          onRejectDice={onRejectDice}
          onDismiss={onDismissShadow}
        />
      )}
    </div>
  );
}
