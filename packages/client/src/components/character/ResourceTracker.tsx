import { DotRating } from '../ui/DotRating';

interface ResourceTrackerProps {
  pathos: { current: number; max: number };
  willpower: { permanent: number; temporary: number };
  corpus: { current: number; max: number };
  onPathosChange?: (value: number) => void;
  onWillpowerChange?: (value: number) => void;
  onCorpusChange?: (value: number) => void;
  readonly?: boolean;
}

export function ResourceTracker({
  pathos,
  willpower,
  corpus,
  onPathosChange,
  onWillpowerChange,
  onCorpusChange,
  readonly = false,
}: ResourceTrackerProps) {
  return (
    <div className="bg-wraith-900/50 border border-wraith-800 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-wraith-300">
        Resources
      </h3>

      {/* Pathos */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">Pathos</span>
          <span className="text-xs text-wraith-500">
            {pathos.current}/{pathos.max}
          </span>
        </div>
        <DotRating
          value={pathos.current}
          max={pathos.max}
          onChange={onPathosChange}
          readonly={readonly}
        />
      </div>

      {/* Willpower */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">Willpower</span>
          <span className="text-xs text-wraith-500">
            {willpower.temporary}/{willpower.permanent}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Permanent</span>
            <DotRating value={willpower.permanent} max={10} readonly size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Current</span>
            <DotRating
              value={willpower.temporary}
              max={willpower.permanent}
              onChange={onWillpowerChange}
              readonly={readonly}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Corpus */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">Corpus</span>
          <span className="text-xs text-wraith-500">
            {corpus.current}/{corpus.max}
          </span>
        </div>
        <DotRating
          value={corpus.current}
          max={corpus.max}
          onChange={onCorpusChange}
          readonly={readonly}
        />
      </div>
    </div>
  );
}
