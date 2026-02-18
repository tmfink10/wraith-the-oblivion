import { DotRating } from '../ui/DotRating';

interface FetterItem {
  id: string;
  description: string;
  type: string;
  rating: number;
}

interface FetterListProps {
  fetters: FetterItem[];
  onChange?: (id: string, rating: number) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  readonly?: boolean;
}

const FETTER_TYPE_LABELS: Record<string, string> = {
  relative: 'Relative',
  friend_foe: 'Friend/Foe',
  place: 'Place',
  possession: 'Possession',
  cause_of_death: 'Cause of Death',
  loved_one: 'Loved One',
  place_of_death: 'Place of Death',
  childhood_home: 'Childhood Home',
  symbolic_fragment: 'Symbolic Fragment',
  personal_document: 'Document/Project',
};

export function FetterList({
  fetters,
  onChange,
  onAdd,
  onRemove,
  readonly = false,
}: FetterListProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
          Fetters
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
      {fetters.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No fetters defined</p>
      ) : (
        <div className="space-y-3">
          {fetters.map((fetter) => (
            <div key={fetter.id} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-sm text-gray-200">{fetter.description}</div>
                <div className="text-xs text-wraith-500">
                  {FETTER_TYPE_LABELS[fetter.type] || fetter.type}
                </div>
              </div>
              <DotRating
                value={fetter.rating}
                max={5}
                onChange={onChange ? (v) => onChange(fetter.id, v) : undefined}
                readonly={readonly}
                size="sm"
              />
              {onRemove && !readonly && (
                <button
                  onClick={() => onRemove(fetter.id)}
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
