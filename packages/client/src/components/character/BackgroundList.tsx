import { DotRating } from '../ui/DotRating';

interface BackgroundItem {
  name: string;
  rating: number;
  description?: string;
}

interface BackgroundListProps {
  backgrounds: BackgroundItem[];
  onChange?: (name: string, rating: number) => void;
  onAdd?: () => void;
  onRemove?: (name: string) => void;
  readonly?: boolean;
}

const BACKGROUND_LABELS: Record<string, string> = {
  allies: 'Allies',
  eidolon: 'Eidolon',
  eminence: 'Eminence',
  haunt: 'Haunt',
  legacy: 'Legacy',
  mentor: 'Mentor',
  memoriam: 'Memoriam',
  notoriety: 'Notoriety',
  relic: 'Relic',
  status: 'Status',
};

export function BackgroundList({
  backgrounds,
  onChange,
  onAdd,
  onRemove,
  readonly = false,
}: BackgroundListProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
          Backgrounds
        </h3>
        {onAdd && !readonly && (
          <button
            onClick={onAdd}
            className="text-xs px-2 py-1 bg-wraith-700 hover:bg-wraith-600 text-gray-300 rounded transition-colors"
          >
            + Add
          </button>
        )}
      </div>
      {backgrounds.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No backgrounds selected</p>
      ) : (
        <div className="space-y-2">
          {backgrounds.map((bg) => (
            <div key={bg.name} className="flex items-center gap-2">
              <span className="text-sm text-gray-200 flex-1">
                {BACKGROUND_LABELS[bg.name] || bg.name}
              </span>
              <DotRating
                value={bg.rating}
                max={5}
                onChange={onChange ? (v) => onChange(bg.name, v) : undefined}
                readonly={readonly}
                size="sm"
              />
              {onRemove && !readonly && (
                <button
                  onClick={() => onRemove(bg.name)}
                  className="text-red-500/50 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
