import { useEffect, useState } from 'react';
import { Thermometer, Wind, Zap, Gauge, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchSensorReadings } from '../lib/data';
import type { SensorReading } from '../lib/types';
import RiskGauge from './RiskGauge';
import KpiCard from './KpiCard';
import TrendChart from './TrendChart';

const WARNING_THRESHOLD = 0.3;
const CRITICAL_THRESHOLD = 0.7;

export default function HomePage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSensorReadings()
      .then((data) => {
        setReadings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-scada-textDim font-mono text-sm animate-pulse">Loading sensor data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-scada-red">
          <AlertCircle className="w-5 h-5" />
          <span className="font-mono text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const latest = readings[readings.length - 1];
  if (!latest) return null;

  const riskPct = Math.round(latest.risk_probability * 100);
  const status =
    latest.risk_probability >= CRITICAL_THRESHOLD
      ? 'critical'
      : latest.risk_probability >= WARNING_THRESHOLD
      ? 'warning'
      : 'normal';

  const statusLabel = status === 'critical' ? 'CRITICAL' : status === 'warning' ? 'WARNING' : 'NORMAL';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-scada-textBright">Live Status Monitor</h2>
          <p className="text-sm text-scada-textDim mt-1">
            Real-time sensor readings · Last update: {(() => {
              const d = new Date(latest.timestamp);
              const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
              const date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
              return `${time} ,${date}`;
            })()}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-md border font-mono text-sm font-bold ${
            status === 'critical'
              ? 'border-scada-red/40 bg-scada-red/10 text-scada-red animate-pulse-glow-red'
              : status === 'warning'
              ? 'border-scada-yellow/40 bg-scada-yellow/10 text-scada-yellow'
              : 'border-scada-green/40 bg-scada-green/10 text-scada-green'
          }`}
        >
          <span className={`status-dot bg-current ${status === 'critical' ? 'animate-pulse' : ''}`} />
          {statusLabel}
        </div>
      </div>

      {/* Gauge + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular gauge */}
        <div className="panel flex flex-col items-center justify-center p-6 lg:col-span-1">
          <div className="panel-header w-full -mt-6 -mx-6 mb-4">
            <Gauge className="w-4 h-4" />
            Risk Probability
          </div>
          <RiskGauge value={riskPct} status={status} />
          <div className="mt-4 flex gap-6 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-green" />
              <span className="text-scada-textDim">Normal &lt; 30%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-yellow" />
              <span className="text-scada-textDim">Warning ≥ 30%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-scada-red" />
              <span className="text-scada-textDim">Critical ≥ 70%</span>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <KpiCard
            icon={Thermometer}
            label="Temperature"
            value={latest.temperature.toFixed(1)}
            unit="°C"
            color="orange"
          />
          <KpiCard
            icon={Wind}
            label="Smoke Level"
            value={latest.smoke_level.toFixed(2)}
            unit="ppm"
            color="yellow"
          />
          <KpiCard
            icon={Zap}
            label="Power Load"
            value={latest.power_load.toFixed(1)}
            unit="kW"
            color="accent"
          />
          <KpiCard
            icon={TrendingUp}
            label="Voltage Fluctuation"
            value={latest.voltage_fluctuation.toFixed(2)}
            unit="V"
            color="purple"
          />
        </div>
      </div>

      {/* Trend chart */}
      <div className="panel p-6">
        <div className="panel-header -mt-6 -mx-6 mb-4">
          <TrendingUp className="w-4 h-4" />
          Risk Trend — Last 48 Hours
        </div>
        <TrendChart readings={readings} />
      </div>
    </div>
  );
}
