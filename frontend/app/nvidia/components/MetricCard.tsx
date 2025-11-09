interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  subtitle?: string;
}

export default function MetricCard({ label, value, icon, subtitle }: MetricCardProps) {
  return (
    <div className="p-4 bg-gray-800/50 border border-green-500/20 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
