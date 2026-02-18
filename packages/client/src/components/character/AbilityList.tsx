import { DotRating } from '../ui/DotRating';

interface AbilityListProps {
  category: string;
  categoryLabel: string;
  priority?: string;
  abilities: Record<string, number>;
  onChange?: (key: string, value: number) => void;
  readonly?: boolean;
  maxAtCreation?: number;
}

const ABILITY_LABELS: Record<string, string> = {
  // Talents
  alertness: 'Alertness', athletics: 'Athletics', awareness: 'Awareness',
  brawl: 'Brawl', dodge: 'Dodge', empathy: 'Empathy',
  expression: 'Expression', intimidation: 'Intimidation',
  streetwise: 'Streetwise', subterfuge: 'Subterfuge',
  // Skills
  animalKen: 'Animal Ken', archery: 'Archery', drive: 'Drive',
  firearms: 'Firearms', larceny: 'Larceny', leadership: 'Leadership',
  melee: 'Melee', performance: 'Performance', stealth: 'Stealth',
  survival: 'Survival',
  // Knowledges
  bureaucracy: 'Bureaucracy', cosmology: 'Cosmology', cryptography: 'Cryptography',
  hypnosis: 'Hypnosis', investigation: 'Investigation', linguistics: 'Linguistics',
  medicine: 'Medicine', metallurgy: 'Metallurgy', occult: 'Occult',
  politics: 'Politics', science: 'Science', technology: 'Technology',
};

export function AbilityList({
  category,
  categoryLabel,
  priority,
  abilities,
  onChange,
  readonly = false,
  maxAtCreation = 5,
}: AbilityListProps) {
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
      <div className="space-y-1">
        {Object.entries(abilities).map(([key, value]) => (
          <DotRating
            key={key}
            label={ABILITY_LABELS[key] || key}
            value={value}
            max={maxAtCreation}
            onChange={onChange ? (v) => onChange(key, v) : undefined}
            readonly={readonly}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
