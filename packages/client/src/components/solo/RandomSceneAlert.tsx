import type { RandomSceneCheckResult } from '@wraith/shared';

interface RandomSceneAlertProps {
  check: RandomSceneCheckResult;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RandomSceneAlert({
  check,
  onAccept,
  onDismiss,
}: RandomSceneAlertProps) {
  if (!check.triggered || !check.scene) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full mx-4 bg-gradient-to-b from-gray-950 to-amber-950/20 border border-amber-700/50 rounded-xl shadow-2xl shadow-amber-900/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-amber-800/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Random Scene Triggered
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Roll Math */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-1">Trigger Check</div>
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="text-gray-300">Roll: {check.triggerRoll}</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="text-amber-300 font-bold">
                {check.halvedValue}
              </span>
              <span className="text-gray-500 text-sm">(halved)</span>
              <span className="text-gray-600">&le;</span>
              <span className="text-amber-400 font-bold">Angst</span>
            </div>
          </div>

          {/* Scene Type */}
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4 text-center">
            <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">
              Roll: {check.scene.roll}
            </div>
            <div className="text-xl font-bold text-amber-200">
              {check.scene.label}
            </div>
            <div className="text-sm text-amber-400/70 mt-1">
              {check.scene.type.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 font-semibold transition-colors"
          >
            Play This Scene
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-lg bg-wraith-800/60 hover:bg-wraith-700/70 border border-wraith-700/50 text-gray-300 font-semibold transition-colors"
          >
            Skip & Continue
          </button>
        </div>
      </div>

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
