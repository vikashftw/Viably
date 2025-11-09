import StatusBadge from './StatusBadge';

interface AgentCardProps {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  icon: string;
  description: string;
  dependencies?: string[];
  onClick: () => void;
}

export default function AgentCard({
  name,
  status,
  progress,
  icon,
  description,
  dependencies,
  onClick
}: AgentCardProps) {
  const statusColors = {
    pending: 'border-gray-600 bg-gray-800/50',
    running: 'border-blue-500 bg-blue-500/10 animate-pulse',
    completed: 'border-green-500 bg-green-500/10',
    failed: 'border-red-500 bg-red-500/10'
  };

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 cursor-pointer
        hover:scale-105 transition-all duration-200
        ${statusColors[status]}
      `}
      onClick={onClick}
    >
      {/* Agent Icon + Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        <StatusBadge status={status} />
      </div>

      {/* Agent Name */}
      <h3 className="text-white font-bold text-lg mb-2">{name}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>

      {/* Progress Bar (if running) */}
      {status === 'running' && (
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Dependencies (if any) */}
      {dependencies && dependencies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">Depends on:</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {dependencies.map(dep => (
              <span
                key={dep}
                className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Click to view reasoning */}
      {status === 'completed' && (
        <div className="mt-3 text-green-400 text-sm">
          Click to view reasoning →
        </div>
      )}
    </div>
  );
}
