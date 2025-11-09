interface StatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: {
      color: 'bg-gray-600 text-gray-300',
      icon: '⏳',
      text: 'Pending'
    },
    running: {
      color: 'bg-blue-500 text-white animate-pulse',
      icon: '⚡',
      text: 'Running'
    },
    completed: {
      color: 'bg-green-500 text-white',
      icon: '✅',
      text: 'Done'
    },
    failed: {
      color: 'bg-red-500 text-white',
      icon: '❌',
      text: 'Failed'
    }
  };

  const { color, icon, text } = config[status];

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${color}`}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
