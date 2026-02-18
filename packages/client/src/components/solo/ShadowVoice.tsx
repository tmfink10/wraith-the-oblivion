import type { ShadowInterjection } from '@wraith/shared';

interface ShadowVoiceProps {
  interjection: ShadowInterjection;
  hasDiceOffer: boolean;
  onAcceptDice: () => void;
  onRejectDice: () => void;
  onDismiss: () => void;
}

export function ShadowVoice({
  interjection,
  hasDiceOffer,
  onAcceptDice,
  onRejectDice,
  onDismiss,
}: ShadowVoiceProps) {
  const typeLabels: Record<string, string> = {
    dark_comment: 'Dark Whisper',
    coerce_dark_passion: 'Dark Passion',
    use_thorn: 'Thorn Activated',
    offer_dice: 'Shadow\'s Bargain',
    whisper_doubt: 'Seeds of Doubt',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full mx-4 bg-gradient-to-b from-gray-950 to-red-950/30 border border-red-800/50 rounded-xl shadow-2xl shadow-red-900/30 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-red-900/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">
              {typeLabels[interjection.type] ?? 'Shadow Interjection'}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-red-200/80 italic text-lg leading-relaxed">
            {interjection.description}
          </p>

          {interjection.thornUsed && (
            <div className="mt-3 px-3 py-2 rounded bg-red-900/20 border border-red-800/30">
              <span className="text-xs text-red-400 uppercase tracking-wider">
                Thorn: {interjection.thornUsed.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {interjection.darkPassionIndex !== undefined && (
            <div className="mt-3 px-3 py-2 rounded bg-red-900/20 border border-red-800/30">
              <span className="text-xs text-red-400 uppercase tracking-wider">
                Dark Passion #{interjection.darkPassionIndex + 1} stirred
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5">
          {hasDiceOffer && interjection.diceOffer ? (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-400">
                The Shadow offers{' '}
                <span className="text-red-300 font-bold">
                  {interjection.diceOffer.diceOffered}
                </span>{' '}
                bonus {interjection.diceOffer.diceOffered === 1 ? 'die' : 'dice'}.
                Accepting gives the Shadow{' '}
                <span className="text-red-300 font-bold">
                  {interjection.diceOffer.shadowPointsGained}
                </span>{' '}
                point{interjection.diceOffer.shadowPointsGained !== 1 ? 's' : ''} and increases Temporary Angst by 1.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onAcceptDice}
                  className="flex-1 py-2.5 rounded-lg bg-red-900/60 hover:bg-red-800/70 border border-red-700/50 text-red-200 font-semibold transition-colors"
                >
                  Accept the Deal
                </button>
                <button
                  onClick={onRejectDice}
                  className="flex-1 py-2.5 rounded-lg bg-wraith-800/60 hover:bg-wraith-700/70 border border-wraith-700/50 text-gray-300 font-semibold transition-colors"
                >
                  Refuse
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-lg bg-wraith-800/60 hover:bg-wraith-700/70 border border-wraith-700/50 text-gray-300 font-semibold transition-colors"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
