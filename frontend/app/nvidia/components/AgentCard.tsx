import StatusBadge from './StatusBadge';

interface AgentCardProps {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  icon: string;
  description: string;
  signal?: string;
  dependencies?: string[];
  onClick: () => void;
}

export default function AgentCard({
  name,
  status,
  progress,
  icon,
  description,
  signal,
  dependencies,
  onClick
}: AgentCardProps) {
  const statusThemes = {
    pending: {
      border: 'border-white/10',
      glow: 'hover:border-white/40',
      bar: 'bg-white/40'
    },
    running: {
      border: 'border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      glow: 'hover:border-cyan-300/70',
      bar: 'bg-cyan-300'
    },
    completed: {
      border: 'border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
      glow: 'hover:border-emerald-300/70',
      bar: 'bg-emerald-300'
    },
    failed: {
      border: 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.3)]',
      glow: 'hover:border-red-400/70',
      bar: 'bg-red-400'
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex h-full flex-col rounded-2xl border bg-white/5 p-5 text-left shadow-lg transition-all duration-300
        ${statusThemes[status].border} ${statusThemes[status].glow}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-3xl">{icon}</div>
        <StatusBadge status={status} />
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">{name}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      {signal && (
        <p className="mt-3 text-xs uppercase tracking-[0.4em] text-cyan-200/80">
          {signal}
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>
            {status === 'pending' ? 'standby' : status === 'running' ? 'streaming' : status === 'completed' ? 'sealed' : 'error'}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusThemes[status].bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {dependencies && dependencies.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Depends on</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dependencies.map(dep => (
              <span
                key={dep}
                className="rounded-full border border-white/10 px-2 py-1 text-xs font-mono text-slate-200"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="mt-4 text-sm font-semibold text-emerald-300">
          View reasoning stream →
        </div>
      )}
    </button>
  );
}
