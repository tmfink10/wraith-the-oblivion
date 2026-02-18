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
import {
  ARCHETYPES,
  EXPERIENCE_TEMPLATES,
  getStepIndex,
  getTotalSteps,
  countAttributeDotsSpent,
  getAttributePoints,
  countAbilityDotsSpent,
  getAbilityPoints,
} from '@wraith/shared';
import type {
  AttributeCategory,
  AbilityCategory,
  Priority,
  ExperienceTemplate,
  DotRating,
} from '@wraith/shared';

const STEPS = ['Concept', 'Attributes', 'Abilities', 'Advantages', 'Shadow', 'Finishing'];

export function CharacterCreate() {
  const {
    creationState,
    startCreation,
    cancelCreation,
    nextStep,
    prevStep,
    setConceptField,
    setAttributePriority,
    setAttribute,
    setAbilityPriority,
    setAbility,
    addBackground,
    removeBackground,
    setBackgroundRating,
    addArcanos,
    removeArcanos,
    setArcanosRating,
    addPassion,
    removePassion,
    setPassionRating,
    addFetter,
    removeFetter,
    setFetterRating,
    setShadowArchetype,
    addDarkPassion: addShadowDarkPassion,
    removeDarkPassion: removeShadowDarkPassion,
    addThorn,
    removeThorn,
    finishCreation,
    saveCharacterToServer,
  } = useCharacterStore();

  const { getAuthHeaders } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!creationState) {
      startCreation('standard');
    }
  }, []);

  if (!creationState) return null;

  const { step, character, template, attributePriorities, abilityPriorities, freebiePointsRemaining } = creationState;
  const stepIndex = getStepIndex(step);
  const totalSteps = getTotalSteps();

  const handleFinish = async () => {
    const result = finishCreation();
    if (result) {
      setSaving(true);
      setSaveError(null);
      const ok = await saveCharacterToServer(result, getAuthHeaders());
      setSaving(false);
      if (!ok) {
        setSaveError('Character created locally but failed to save to server. Your data may be lost on refresh.');
      }
      window.location.href = `/characters/${result.id}`;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-wraith-200">Create Character</h1>
        <button
          onClick={cancelCreation}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              i <= stepIndex ? 'bg-wraith-400' : 'bg-wraith-800'
            }`}
          />
        ))}
      </div>
      <div className="text-xs text-wraith-500 mb-6">
        Step {stepIndex + 1} of {totalSteps}: <span className="text-wraith-300">{STEPS[stepIndex]}</span>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {step === 'concept' && (
          <ConceptStep
            character={character}
            template={template}
            onChange={setConceptField}
          />
        )}
        {step === 'attributes' && (
          <AttributesStep
            attributes={character.attributes!}
            priorities={attributePriorities}
            template={template}
            onPriorityChange={setAttributePriority}
            onAttributeChange={setAttribute}
          />
        )}
        {step === 'abilities' && (
          <AbilitiesStep
            abilities={character.abilities!}
            priorities={abilityPriorities}
            template={template}
            onPriorityChange={setAbilityPriority}
            onAbilityChange={setAbility}
          />
        )}
        {step === 'advantages' && (
          <AdvantagesStep
            backgrounds={character.backgrounds || []}
            arcanoi={character.arcanoi || []}
            passions={character.passions || []}
            fetters={character.fetters || []}
            onAddBackground={addBackground}
            onRemoveBackground={removeBackground}
            onBackgroundRating={setBackgroundRating}
            onAddArcanos={addArcanos}
            onRemoveArcanos={removeArcanos}
            onArcanosRating={setArcanosRating}
            onAddPassion={addPassion}
            onRemovePassion={removePassion}
            onPassionRating={setPassionRating}
            onAddFetter={addFetter}
            onRemoveFetter={removeFetter}
            onFetterRating={setFetterRating}
          />
        )}
        {step === 'shadow' && (
          <ShadowStep
            shadow={character.shadow!}
            onArchetypeChange={setShadowArchetype}
            onAddDarkPassion={addShadowDarkPassion}
            onRemoveDarkPassion={removeShadowDarkPassion}
            onAddThorn={addThorn}
            onRemoveThorn={removeThorn}
          />
        )}
        {step === 'finishing' && (
          <FinishingStep
            character={character}
            freebiePointsRemaining={freebiePointsRemaining}
          />
        )}
      </div>

      {/* Save Error */}
      {saveError && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
          {saveError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-wraith-800 pt-4">
        <button
          onClick={prevStep}
          disabled={stepIndex === 0 || saving}
          className="px-4 py-2 text-sm bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {step === 'finishing' ? (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-6 py-2 text-sm bg-wraith-500 hover:bg-wraith-400 text-white rounded font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create Character'}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="px-4 py-2 text-sm bg-wraith-700 hover:bg-wraith-600 text-gray-200 rounded transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────

function ConceptStep({
  character,
  template,
  onChange,
}: {
  character: any;
  template: ExperienceTemplate;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Character Name</label>
          <input
            type="text"
            value={character.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
            placeholder="Enter name..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Player Name</label>
          <input
            type="text"
            value={character.player || ''}
            onChange={(e) => onChange('player', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
            placeholder="Your name..."
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Concept</label>
        <input
          type="text"
          value={character.concept || ''}
          onChange={(e) => onChange('concept', e.target.value)}
          className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
          placeholder="e.g., Murdered delivery driver"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Nature</label>
          <select
            value={character.nature || ''}
            onChange={(e) => onChange('nature', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
          >
            <option value="">Select Nature...</option>
            {ARCHETYPES.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Demeanor</label>
          <select
            value={character.demeanor || ''}
            onChange={(e) => onChange('demeanor', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
          >
            <option value="">Select Demeanor...</option>
            {ARCHETYPES.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Cause of Death</label>
          <select
            value={character.causeOfDeath || ''}
            onChange={(e) => onChange('causeOfDeath', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
          >
            <option value="">Select...</option>
            <option value="old_age">Old Age</option>
            <option value="disease">Disease</option>
            <option value="violence">Violence</option>
            <option value="madness">Madness</option>
            <option value="happenstance">Happenstance</option>
            <option value="despair">Despair</option>
            <option value="mystery">Mystery</option>
            <option value="fate">Fate</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Experience Template</label>
          <select
            value={template}
            onChange={(e) => onChange('experienceTemplate', e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-wraith-500"
          >
            <option value="standard">Standard (new wraith)</option>
            <option value="experienced">Experienced (50-200 years)</option>
            <option value="old">Old (200-600 years)</option>
            <option value="ancient">Ancient (600+ years)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AttributesStep({
  attributes,
  priorities,
  template,
  onPriorityChange,
  onAttributeChange,
}: {
  attributes: any;
  priorities: Record<AttributeCategory, Priority>;
  template: ExperienceTemplate;
  onPriorityChange: (cat: AttributeCategory, pri: Priority) => void;
  onAttributeChange: (cat: AttributeCategory, key: string, value: number) => void;
}) {
  const categories: AttributeCategory[] = ['physical', 'social', 'mental'];
  const labels: Record<AttributeCategory, string> = {
    physical: 'Physical', social: 'Social', mental: 'Mental',
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 mb-4">
        Prioritize your attribute categories, then distribute dots. All attributes start at 1.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => {
          const spent = countAttributeDotsSpent(attributes[cat]);
          const allowed = getAttributePoints(priorities[cat], template);
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={priorities[cat]}
                  onChange={(e) => onPriorityChange(cat, e.target.value as Priority)}
                  className="bg-wraith-900 border border-wraith-700 rounded px-2 py-1 text-xs text-gray-200"
                >
                  <option value="primary">Primary ({getAttributePoints('primary', template)})</option>
                  <option value="secondary">Secondary ({getAttributePoints('secondary', template)})</option>
                  <option value="tertiary">Tertiary ({getAttributePoints('tertiary', template)})</option>
                </select>
                <span className={`text-xs ${spent > allowed ? 'text-red-400' : 'text-wraith-500'}`}>
                  {spent}/{allowed}
                </span>
              </div>
              <AttributeBlock
                category={cat}
                categoryLabel={labels[cat]}
                attributes={attributes[cat]}
                onChange={(key, value) => onAttributeChange(cat, key, value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbilitiesStep({
  abilities,
  priorities,
  template,
  onPriorityChange,
  onAbilityChange,
}: {
  abilities: any;
  priorities: Record<AbilityCategory, Priority>;
  template: ExperienceTemplate;
  onPriorityChange: (cat: AbilityCategory, pri: Priority) => void;
  onAbilityChange: (cat: AbilityCategory, key: string, value: number) => void;
}) {
  const categories: AbilityCategory[] = ['talents', 'skills', 'knowledges'];
  const labels: Record<AbilityCategory, string> = {
    talents: 'Talents', skills: 'Skills', knowledges: 'Knowledges',
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 mb-4">
        Prioritize ability categories and distribute dots. Max 3 per ability at creation.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => {
          const spent = countAbilityDotsSpent(abilities[cat]);
          const allowed = getAbilityPoints(priorities[cat], template);
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={priorities[cat]}
                  onChange={(e) => onPriorityChange(cat, e.target.value as Priority)}
                  className="bg-wraith-900 border border-wraith-700 rounded px-2 py-1 text-xs text-gray-200"
                >
                  <option value="primary">Primary ({getAbilityPoints('primary', template)})</option>
                  <option value="secondary">Secondary ({getAbilityPoints('secondary', template)})</option>
                  <option value="tertiary">Tertiary ({getAbilityPoints('tertiary', template)})</option>
                </select>
                <span className={`text-xs ${spent > allowed ? 'text-red-400' : 'text-wraith-500'}`}>
                  {spent}/{allowed}
                </span>
              </div>
              <AbilityList
                category={cat}
                categoryLabel={labels[cat]}
                abilities={abilities[cat]}
                onChange={(key, value) => onAbilityChange(cat, key, value)}
                maxAtCreation={3}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdvantagesStep({
  backgrounds, arcanoi, passions, fetters,
  onAddBackground, onRemoveBackground, onBackgroundRating,
  onAddArcanos, onRemoveArcanos, onArcanosRating,
  onAddPassion, onRemovePassion, onPassionRating,
  onAddFetter, onRemoveFetter, onFetterRating,
}: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 mb-4">
        Distribute dots among Backgrounds (5), Arcanoi (5), Passions (5), and Fetters (10).
      </p>
      <div className="grid grid-cols-2 gap-4">
        <BackgroundList
          backgrounds={backgrounds}
          onChange={onBackgroundRating}
          onAdd={() => {
            const name = prompt('Background name (allies, eidolon, eminence, haunt, legacy, mentor, memoriam, notoriety, relic, status):');
            if (name) onAddBackground(name);
          }}
          onRemove={onRemoveBackground}
        />
        <ArcanaiPanel
          arcanoi={arcanoi}
          onChange={onArcanosRating}
          onAdd={() => {
            const name = prompt('Arcanos name (argos, castigate, embody, fatalism, flux, inhabit, intimation, keening, lifeweb, mnemosynis, moliate, outrage, pandemonium, phantasm, puppetry, usury):');
            if (name) onAddArcanos(name);
          }}
          onRemove={onRemoveArcanos}
        />
        <PassionList
          passions={passions}
          onChange={onPassionRating}
          onAdd={() => {
            const desc = prompt('Passion description (e.g., "Find my killer"):');
            const emotion = prompt('Emotion (e.g., "Anger"):');
            if (desc && emotion) onAddPassion(desc, emotion, 1);
          }}
          onRemove={onRemovePassion}
        />
        <FetterList
          fetters={fetters}
          onChange={onFetterRating}
          onAdd={() => {
            const desc = prompt('Fetter description (e.g., "My childhood home"):');
            const type = prompt('Type (relative, friend_foe, place, possession, cause_of_death, loved_one, place_of_death, childhood_home, symbolic_fragment, personal_document):');
            if (desc && type) onAddFetter(desc, type, 1);
          }}
          onRemove={onRemoveFetter}
        />
      </div>
    </div>
  );
}

function ShadowStep({
  shadow,
  onArchetypeChange,
  onAddDarkPassion,
  onRemoveDarkPassion,
  onAddThorn,
  onRemoveThorn,
}: any) {
  return (
    <div className="max-w-xl">
      <p className="text-sm text-gray-400 mb-4">
        Define your Shadow — the dark side of your psyche that fights for control.
      </p>
      <ShadowPanel
        archetype={shadow.archetype}
        angst={shadow.angst}
        darkPassions={shadow.darkPassions}
        thorns={shadow.thorns}
        onArchetypeChange={onArchetypeChange}
        onAddDarkPassion={() => {
          const desc = prompt('Dark Passion description:');
          const emotion = prompt('Emotion:');
          if (desc && emotion) onAddDarkPassion(desc, emotion, 1);
        }}
        onRemoveDarkPassion={onRemoveDarkPassion}
        onAddThorn={() => {
          const name = prompt('Thorn name (whispers, bad_luck, nightmares, etc.):');
          if (name) onAddThorn(name, 1);
        }}
        onRemoveThorn={onRemoveThorn}
      />
    </div>
  );
}

function FinishingStep({
  character,
  freebiePointsRemaining,
}: {
  character: any;
  freebiePointsRemaining: number;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-wraith-200 mb-4">Character Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name:</span>{' '}
            <span className="text-gray-200">{character.name || 'Unnamed'}</span>
          </div>
          <div>
            <span className="text-gray-400">Concept:</span>{' '}
            <span className="text-gray-200">{character.concept || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-400">Nature:</span>{' '}
            <span className="text-gray-200">{character.nature || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-400">Demeanor:</span>{' '}
            <span className="text-gray-200">{character.demeanor || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-400">Cause of Death:</span>{' '}
            <span className="text-gray-200">{character.causeOfDeath || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-400">Shadow:</span>{' '}
            <span className="text-gray-200">{character.shadow?.archetype || 'None'}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-wraith-800">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Freebie Points Remaining:</span>
            <span className={`text-lg font-bold ${
              freebiePointsRemaining > 0 ? 'text-yellow-400' : freebiePointsRemaining < 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {freebiePointsRemaining}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 italic">
        Review your character above. Click "Create Character" to finalize.
      </p>
    </div>
  );
}
