import { DotRating } from '../ui/DotRating';

interface DarkPassionItem {
  id: string;
  description: string;
  emotion: string;
  rating: number;
}

interface ThornItem {
  name: string;
  rating: number;
}

interface ShadowPanelProps {
  archetype: string;
  angst: { permanent: number; temporary: number };
  darkPassions: DarkPassionItem[];
  thorns: ThornItem[];
  onArchetypeChange?: (archetype: string) => void;
  onAngstChange?: (temporary: number) => void;
  onDarkPassionChange?: (id: string, rating: number) => void;
  onAddDarkPassion?: () => void;
  onRemoveDarkPassion?: (id: string) => void;
  onThornChange?: (name: string, rating: number) => void;
  onAddThorn?: () => void;
  onRemoveThorn?: (name: string) => void;
  readonly?: boolean;
}

const THORN_LABELS: Record<string, string> = {
  aura_of_corruption: 'Aura of Corruption',
  bad_luck: 'Bad Luck',
  dark_allies: 'Dark Allies',
  deaths_sigil: "Death's Sigil",
  devils_dare: "Devil's Dare",
  freudian_slip: 'Freudian Slip',
  honeyed_tongue: 'Honeyed Tongue',
  infamy: 'Infamy',
  manifestation: 'Manifestation',
  mirror_mirror: 'Mirror, Mirror',
  nightmares: 'Nightmares',
  pact_of_doom: 'Pact of Doom',
  shadow_call: 'Shadow Call',
  shadow_familiar: 'Shadow Familiar',
  shadow_life: 'Shadow Life',
  shadowed_face: 'Shadowed Face',
  spectre_prestige: 'Spectre Prestige',
  tainted_relic: 'Tainted Relic',
  trick_of_the_light: 'Trick of the Light',
  vampiric_nature: 'Vampiric Nature',
  whispers: 'Whispers',
};

export function ShadowPanel({
  archetype,
  angst,
  darkPassions,
  thorns,
  onArchetypeChange,
  onAngstChange,
  onDarkPassionChange,
  onAddDarkPassion,
  onRemoveDarkPassion,
  onThornChange,
  onAddThorn,
  onRemoveThorn,
  readonly = false,
}: ShadowPanelProps) {
  return (
    <div className="bg-wraith-950 border border-red-900/30 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-red-400/80">
        The Shadow
      </h3>

      {/* Archetype */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Archetype</label>
        {readonly ? (
          <span className="text-sm text-gray-200">{archetype || 'None'}</span>
        ) : (
          <input
            type="text"
            value={archetype}
            onChange={(e) => onArchetypeChange?.(e.target.value)}
            className="w-full bg-wraith-900 border border-wraith-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-red-700"
            placeholder="e.g., The Monster"
          />
        )}
      </div>

      {/* Angst */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Angst</span>
          <span className="text-xs text-red-500/60">
            {angst.temporary}/{angst.permanent}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Permanent</span>
            <DotRating value={angst.permanent} max={10} readonly size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Current</span>
            <DotRating
              value={angst.temporary}
              max={10}
              onChange={onAngstChange}
              readonly={readonly}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Dark Passions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Dark Passions</span>
          {onAddDarkPassion && !readonly && (
            <button
              onClick={onAddDarkPassion}
              className="text-xs px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50 text-red-400/80 rounded transition-colors"
            >
              + Add
            </button>
          )}
        </div>
        {darkPassions.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No dark passions</p>
        ) : (
          <div className="space-y-2">
            {darkPassions.map((dp) => (
              <div key={dp.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm text-gray-300">{dp.description}</div>
                  <div className="text-xs text-red-500/50">({dp.emotion})</div>
                </div>
                <DotRating
                  value={dp.rating}
                  max={5}
                  onChange={onDarkPassionChange ? (v) => onDarkPassionChange(dp.id, v) : undefined}
                  readonly={readonly}
                  size="sm"
                />
                {onRemoveDarkPassion && !readonly && (
                  <button
                    onClick={() => onRemoveDarkPassion(dp.id)}
                    className="text-red-500/30 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thorns */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Thorns</span>
          {onAddThorn && !readonly && (
            <button
              onClick={onAddThorn}
              className="text-xs px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50 text-red-400/80 rounded transition-colors"
            >
              + Add
            </button>
          )}
        </div>
        {thorns.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No thorns</p>
        ) : (
          <div className="space-y-2">
            {thorns.map((thorn) => (
              <div key={thorn.name} className="flex items-center gap-2">
                <span className="text-sm text-gray-300 flex-1">
                  {THORN_LABELS[thorn.name] || thorn.name}
                </span>
                <DotRating
                  value={thorn.rating}
                  max={3}
                  onChange={onThornChange ? (v) => onThornChange(thorn.name, v) : undefined}
                  readonly={readonly}
                  size="sm"
                />
                {onRemoveThorn && !readonly && (
                  <button
                    onClick={() => onRemoveThorn(thorn.name)}
                    className="text-red-500/30 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
