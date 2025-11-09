interface StatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed';
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    wrapper: 'bg-white/10 text-slate-200 border border-white/20',
    dot: 'bg-slate-400'
  },
  running: {
    label: 'Running',
    wrapper: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40',
    dot: 'bg-cyan-300 animate-pulse'
  },
  completed: {
    label: 'Complete',
    wrapper: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40',
    dot: 'bg-emerald-300'
  },
  failed: {
    label: 'Failed',
    wrapper: 'bg-red-500/20 text-red-200 border border-red-500/40',
    dot: 'bg-red-300'
  }
} as const;

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.wrapper}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
