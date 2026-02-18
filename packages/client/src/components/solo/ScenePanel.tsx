import type { Scene, SceneEvent } from '@wraith/shared';

interface ScenePanelProps {
  scene: Scene;
  events: SceneEvent[];
  onAddNote: (note: string) => void;
  onEndScene: () => void;
}

const eventIcons: Record<string, string> = {
  binary_roll: '\u{1F3B2}',       // dice
  shadow_interjection: '\u{1F47B}', // ghost
  random_scene_trigger: '\u26A1',    // lightning
  combat: '\u2694\uFE0F',            // swords
  arcanos_use: '\u2728',             // sparkles
  passion_pursuit: '\u2764\uFE0F',   // heart
  narrative: '\u{1F4DD}',            // memo
};

const eventColors: Record<string, string> = {
  binary_roll: 'border-l-blue-500',
  shadow_interjection: 'border-l-red-500',
  random_scene_trigger: 'border-l-amber-500',
  combat: 'border-l-orange-500',
  arcanos_use: 'border-l-cyan-500',
  passion_pursuit: 'border-l-pink-500',
  narrative: 'border-l-gray-500',
};

export function ScenePanel({
  scene,
  events,
  onAddNote,
  onEndScene,
}: ScenePanelProps) {
  const handleNoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('note') as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      onAddNote(value);
      input.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-wraith-900/30 border border-wraith-800 rounded-lg overflow-hidden">
      {/* Scene Header */}
      <div className="px-5 py-4 border-b border-wraith-800 bg-wraith-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Scene {scene.number}
            </span>
            {scene.isRandom && (
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-900/50 border border-red-800/50 text-red-300">
                Random
              </span>
            )}
          </div>
        </div>

        {/* Activity + Focus prompt */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-wraith-100">
            <span className="text-wraith-300">{scene.activity}</span>
            {scene.activity && scene.focus && (
              <span className="text-wraith-600 mx-2">&bull;</span>
            )}
            <span className="text-wraith-300">{scene.focus}</span>
          </h2>
          {scene.description && scene.description !== `${scene.activity} ${scene.focus}` && (
            <p className="text-sm text-gray-500 mt-1">{scene.description}</p>
          )}
        </div>
      </div>

      {/* Event Log */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8 italic">
            No events yet. Use the oracle tools to begin...
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border-l-2 ${eventColors[event.type] ?? 'border-l-gray-600'} pl-3 py-1.5`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0" role="img">
                  {eventIcons[event.type] ?? '\u{1F4AC}'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 break-words">
                    {event.description}
                  </p>
                  <span className="text-xs text-gray-600">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Bar: Add Note + End Scene */}
      <div className="px-4 py-3 border-t border-wraith-800 bg-wraith-900/50">
        <form onSubmit={handleNoteSubmit} className="flex gap-2 mb-2">
          <input
            name="note"
            type="text"
            placeholder="Add a narrative note..."
            className="flex-1 px-3 py-2 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded bg-wraith-700 hover:bg-wraith-600 text-gray-300 transition-colors"
          >
            Add
          </button>
        </form>
        <button
          onClick={onEndScene}
          className="w-full py-2 text-sm rounded-lg bg-wraith-800 hover:bg-red-900/50 border border-wraith-700 hover:border-red-800/50 text-gray-400 hover:text-red-300 font-semibold transition-all"
        >
          End Scene
        </button>
      </div>
    </div>
  );
}
