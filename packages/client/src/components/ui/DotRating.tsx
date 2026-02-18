import { useCallback } from 'react';

interface DotRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showEmpty?: boolean;
}

export function DotRating({
  value,
  max = 5,
  onChange,
  readonly = false,
  size = 'md',
  label,
  showEmpty = true,
}: DotRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleClick = useCallback(
    (dotIndex: number) => {
      if (readonly || !onChange) return;
      // Clicking the current value deselects it (sets to index - 1)
      const newValue = dotIndex + 1 === value ? dotIndex : dotIndex + 1;
      onChange(newValue);
    },
    [value, onChange, readonly],
  );

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-gray-300 min-w-[120px]">{label}</span>
      )}
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(i)}
            className={`
              ${sizeClasses[size]}
              rounded-full border-2 transition-colors
              ${
                i < value
                  ? 'bg-wraith-300 border-wraith-300'
                  : showEmpty
                  ? 'bg-transparent border-wraith-600'
                  : 'invisible'
              }
              ${
                !readonly
                  ? 'cursor-pointer hover:border-wraith-400'
                  : 'cursor-default'
              }
            `}
            aria-label={`Set ${label || 'rating'} to ${i + 1}`}
          />
        ))}
      </div>
      {!readonly && (
        <span className="text-xs text-wraith-500 ml-1">{value}</span>
      )}
    </div>
  );
}
