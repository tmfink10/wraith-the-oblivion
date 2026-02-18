import { DotRating } from '../ui/DotRating';

interface PassionItem {
  id: string;
  description: string;
  emotion: string;
  rating: number;
}

interface PassionListProps {
  passions: PassionItem[];
  onChange?: (id: string, rating: number) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  readonly?: boolean;
  title?: string;
}

export function PassionList({
  passions,
  onChange,
  onAdd,
  onRemove,
  readonly = false,
  title = 'Passions',
}: PassionListProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
          {title}
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
      {passions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No passions defined</p>
      ) : (
        <div className="space-y-3">
          {passions.map((passion) => (
            <div key={passion.id} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-sm text-gray-200">{passion.description}</div>
                <div className="text-xs text-wraith-500">({passion.emotion})</div>
              </div>
              <DotRating
                value={passion.rating}
                max={5}
                onChange={onChange ? (v) => onChange(passion.id, v) : undefined}
                readonly={readonly}
                size="sm"
              />
              {onRemove && !readonly && (
                <button
                  onClick={() => onRemove(passion.id)}
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
