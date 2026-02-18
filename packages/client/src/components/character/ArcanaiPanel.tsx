import { DotRating } from '../ui/DotRating';

interface ArcanosItem {
  name: string;
  rating: number;
}

interface ArcanaiPanelProps {
  arcanoi: ArcanosItem[];
  onChange?: (name: string, rating: number) => void;
  onAdd?: () => void;
  onRemove?: (name: string) => void;
  readonly?: boolean;
}

const ARCANOS_LABELS: Record<string, string> = {
  argos: 'Argos',
  castigate: 'Castigate',
  embody: 'Embody',
  fatalism: 'Fatalism',
  flux: 'Flux',
  inhabit: 'Inhabit',
  intimation: 'Intimation',
  keening: 'Keening',
  lifeweb: 'Lifeweb',
  mnemosynis: 'Mnemosynis',
  moliate: 'Moliate',
  outrage: 'Outrage',
  pandemonium: 'Pandemonium',
  phantasm: 'Phantasm',
  puppetry: 'Puppetry',
  usury: 'Usury',
  way_of_the_scholar: 'Way of the Scholar',
  way_of_the_artisan: 'Way of the Artisan',
  way_of_the_farmer: 'Way of the Farmer',
  way_of_the_merchant: 'Way of the Merchant',
  way_of_the_soul: 'Way of the Soul',
  chains_of_the_emperor: 'Chains of the Emperor',
  tvashtriya: 'Tvashtriya',
  moriman: 'Moriman',
};

export function ArcanaiPanel({
  arcanoi,
  onChange,
  onAdd,
  onRemove,
  readonly = false,
}: ArcanaiPanelProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
          Arcanoi
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
      {arcanoi.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No arcanoi learned</p>
      ) : (
        <div className="space-y-2">
          {arcanoi.map((arc) => (
            <div key={arc.name} className="flex items-center gap-2">
              <span className="text-sm text-gray-200 flex-1">
                {ARCANOS_LABELS[arc.name] || arc.name}
              </span>
              <DotRating
                value={arc.rating}
                max={5}
                onChange={onChange ? (v) => onChange(arc.name, v) : undefined}
                readonly={readonly}
                size="sm"
              />
              {onRemove && !readonly && (
                <button
                  onClick={() => onRemove(arc.name)}
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
