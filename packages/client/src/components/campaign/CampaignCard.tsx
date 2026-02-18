interface CampaignCardProps {
  id: string;
  name: string;
  description: string;
  playerCount?: number;
  inviteCode?: string | null;
  isStoryteller?: boolean;
}

export function CampaignCard({
  id,
  name,
  description,
  playerCount,
  inviteCode,
  isStoryteller,
}: CampaignCardProps) {
  return (
    <a
      href={`/campaigns/${id}`}
      className="block p-4 rounded-lg border border-wraith-800 bg-wraith-900/50 hover:border-wraith-600 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-serif text-wraith-200 group-hover:text-wraith-100 transition-colors">
          {name}
        </h3>
        {isStoryteller && (
          <span className="px-2 py-0.5 text-xs bg-amber-900/40 text-amber-300 border border-amber-800/50 rounded">
            Storyteller
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        {playerCount !== undefined && (
          <span>{playerCount} character{playerCount !== 1 ? 's' : ''}</span>
        )}
        {inviteCode && (
          <span className="font-mono text-wraith-400">{inviteCode}</span>
        )}
      </div>
    </a>
  );
}
