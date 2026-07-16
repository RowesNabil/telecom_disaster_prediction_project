import { useMemo } from 'react';
import type { SensorReading } from '../lib/types';

interface TrendChartProps {
  readings: SensorReading[];
}

const WARNING_THRESHOLD = 0.3;
const CRITICAL_THRESHOLD = 0.7;

export default function TrendChart({ readings }: TrendChartProps) {
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (readings.length < 2) return [];
    return readings.map((r, i) => ({
      x: padding.left + (i / (readings.length - 1)) * chartWidth,
      y: padding.top + (1 - r.risk_probability) * chartHeight,
      risk: r.risk_probability,
      timestamp: r.timestamp,
      temp: r.temperature,
      smoke: r.smoke_level,
    }));
  }, [readings, chartWidth, chartHeight]);

  if (points.length < 2) return null;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartHeight} L ${points[0].x.toFixed(1)} ${padding.top + chartHeight} Z`;

  const warningY = padding.top + (1 - WARNING_THRESHOLD) * chartHeight;
  const criticalY = padding.top + (1 - CRITICAL_THRESHOLD) * chartHeight;

  const xLabels = points.filter((_, i) => i % 6 === 0 || i === points.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 600 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding.left}
            y1={padding.top + t * chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + t * chartHeight}
            stroke="#2d3a48"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text
            key={t}
            x={padding.left - 8}
            y={padding.top + t * chartHeight + 4}
            fill="#6b7d8f"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(t * 100)}%
          </text>
        ))}

        {/* Warning threshold line */}
        <line
          x1={padding.left}
          y1={warningY}
          x2={padding.left + chartWidth}
          y2={warningY}
          stroke="#eab308"
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.6"
        />
        <text x={padding.left + chartWidth - 4} y={warningY - 4} fill="#eab308" fontSize="9" fontFamily="monospace" textAnchor="end">
          WARNING 30%
        </text>

        {/* Critical threshold line */}
        <line
          x1={padding.left}
          y1={criticalY}
          x2={padding.left + chartWidth}
          y2={criticalY}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.6"
        />
        <text x={padding.left + chartWidth - 4} y={criticalY - 4} fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="end">
          CRITICAL 70%
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#riskGradient)" />

        {/* Risk line */}
        <path d={linePath} fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => {
          const color =
            p.risk >= CRITICAL_THRESHOLD
              ? '#ef4444'
              : p.risk >= WARNING_THRESHOLD
              ? '#eab308'
              : '#22c55e';
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.8" />
              {(i % 6 === 0 || i === points.length - 1) && (
                <circle cx={p.x} cy={p.y} r="4" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((p, i) => {
          const d = new Date(p.timestamp);
          const label = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
          return (
            <text
              key={i}
              x={p.x}
              y={height - 10}
              fill="#6b7d8f"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
