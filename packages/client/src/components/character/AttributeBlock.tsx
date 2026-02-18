import { DotRating } from '../ui/DotRating';

interface AttributeBlockProps {
  category: string;
  categoryLabel: string;
  priority?: string;
  attributes: Record<string, number>;
  onChange?: (key: string, value: number) => void;
  readonly?: boolean;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  stamina: 'Stamina',
  charisma: 'Charisma',
  manipulation: 'Manipulation',
  appearance: 'Appearance',
  perception: 'Perception',
  intelligence: 'Intelligence',
  wits: 'Wits',
};

export function AttributeBlock({
  category,
  categoryLabel,
  priority,
  attributes,
  onChange,
  readonly = false,
}: AttributeBlockProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
          {categoryLabel}
        </h3>
        {priority && (
          <span className="text-xs px-2 py-0.5 rounded bg-wraith-700 text-wraith-300">
            {priority}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {Object.entries(attributes).map(([key, value]) => (
          <DotRating
            key={key}
            label={ATTRIBUTE_LABELS[key] || key}
            value={value}
            max={5}
            onChange={onChange ? (v) => onChange(key, v) : undefined}
            readonly={readonly}
          />
        ))}
      </div>
    </div>
  );
}
