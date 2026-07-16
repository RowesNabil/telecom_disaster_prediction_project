interface RiskGaugeProps {
  value: number;
  status: 'normal' | 'warning' | 'critical';
}

export default function RiskGauge({ value, status }: RiskGaugeProps) {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  const colorClass =
    status === 'critical'
      ? '#ef4444'
      : status === 'warning'
      ? '#eab308'
      : '#22c55e';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2d3a48"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${colorClass}80)`,
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 2 * Math.PI;
          const x1 = size / 2 + (radius - strokeWidth / 2 - 4) * Math.cos(angle);
          const y1 = size / 2 + (radius - strokeWidth / 2 - 4) * Math.sin(angle);
          const x2 = size / 2 + (radius - strokeWidth / 2 + 4) * Math.cos(angle);
          const y2 = size / 2 + (radius - strokeWidth / 2 + 4) * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3a4a5c"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold text-4xl"
          style={{ color: colorClass, textShadow: `0 0 12px ${colorClass}60` }}
        >
          {value}%
        </span>
        <span className="text-xs text-scada-textDim uppercase tracking-widest mt-1">
          Risk Score
        </span>
      </div>
    </div>
  );
}
