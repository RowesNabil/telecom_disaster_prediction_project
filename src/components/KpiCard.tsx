import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  color: 'green' | 'yellow' | 'red' | 'accent' | 'orange' | 'purple';
}

const colorMap: Record<KpiCardProps['color'], { text: string; bg: string; border: string }> = {
  green: { text: 'text-scada-green', bg: 'bg-scada-green/10', border: 'border-scada-green/20' },
  yellow: { text: 'text-scada-yellow', bg: 'bg-scada-yellow/10', border: 'border-scada-yellow/20' },
  red: { text: 'text-scada-red', bg: 'bg-scada-red/10', border: 'border-scada-red/20' },
  accent: { text: 'text-scada-accent', bg: 'bg-scada-accent/10', border: 'border-scada-accent/20' },
  orange: { text: 'text-scada-orange', bg: 'bg-scada-orange/10', border: 'border-scada-orange/20' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

export default function KpiCard({ icon: Icon, label, value, unit, color }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <div className={`kpi-card ${c.text}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-scada-textDim uppercase tracking-wide font-medium">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`font-mono font-bold text-2xl ${c.text}`}>{value}</span>
            <span className="text-sm text-scada-textDim font-mono">{unit}</span>
          </div>
        </div>
        <div className={`p-2 rounded-md ${c.bg} ${c.border} border`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}
