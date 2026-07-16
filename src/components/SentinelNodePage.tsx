import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Thermometer,
  Wind,
  Zap,
  TrendingUp,
  AlertTriangle,
  Radio,
  Square,
  Clock,
  Cpu,
  Send,
} from 'lucide-react';
import { fetchSensorReadings } from '../lib/data';
import { runInferenceWithAlert, getCooldownRemaining, type PredictionResult } from '../lib/model';
import type { SensorReading } from '../lib/types';
import KpiCard from './KpiCard';

interface StreamRow {
  reading: SensorReading;
  prediction: PredictionResult;
  alertSent: boolean;
  cooldownRemaining: number;
}

const CRITICAL_THRESHOLD = 0.7;

interface SentinelNodePageProps {
  onAlert: (toast: { type: 'alert' | 'info'; title: string; message: string }) => void;
}

export default function SentinelNodePage({ onAlert }: SentinelNodePageProps) {
  const [allReadings, setAllReadings] = useState<SensorReading[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [streamRows, setStreamRows] = useState<StreamRow[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceId] = useState('CO-001');
  const [cooldownTick, setCooldownTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    fetchSensorReadings()
      .then((data) => {
        setAllReadings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Cooldown ticker
  useEffect(() => {
    const t = setInterval(() => setCooldownTick((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStreamTick = useCallback(
    async (readings: SensorReading[], idx: number) => {
      const reading = readings[idx];
      if (!reading) return;
      const { result, alertSent, cooldownRemaining } = await runInferenceWithAlert(reading, deviceId);
      setCurrentPrediction(result);
      if (alertSent) {
        onAlert({
          type: 'alert',
          title: 'FAILURE DETECTED',
          message: `Device ${deviceId} · Prob: ${(result.probability * 100).toFixed(1)}% · Webhook dispatched`,
        });
      }
      setStreamRows((prev) => {
        const next = [...prev, { reading, prediction: result, alertSent, cooldownRemaining }];
        return next.slice(-20);
      });
    },
    [deviceId, onAlert],
  );

  const startStream = () => {
    if (allReadings.length === 0) return;
    setStreaming(true);
    indexRef.current = 0;
    setStreamIndex(0);
    setStreamRows([]);
    intervalRef.current = setInterval(() => {
      const idx = indexRef.current;
      if (idx >= allReadings.length) {
        indexRef.current = 0;
      }
      handleStreamTick(allReadings, indexRef.current);
      setStreamIndex(indexRef.current);
      indexRef.current++;
    }, 1000);
  };

  const stopStream = () => {
    setStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const latestReading = streamRows.length > 0 ? streamRows[streamRows.length - 1].reading : null;
  const latestPred = currentPrediction;
  const status = !latestPred
    ? 'idle'
    : latestPred.prediction === 1
    ? latestPred.probability >= CRITICAL_THRESHOLD
      ? 'critical'
      : 'warning'
    : 'normal';

  const statusLabel =
    status === 'critical' ? 'DANGER' : status === 'warning' ? 'WARNING' : status === 'idle' ? 'IDLE' : 'NORMAL';

  const cooldownRemaining = getCooldownRemaining(deviceId);
  void cooldownTick;

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
          <AlertTriangle className="w-5 h-5" />
          <span className="font-mono text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-scada-textBright flex items-center gap-2">
            <Radio className="w-5 h-5 text-scada-accent" />
            SentinelNode — Live DL Inference
          </h2>
          <p className="text-sm text-scada-textDim mt-1">
            Deep Learning model streaming predictions · Device: {deviceId} ·{' '}
            {streaming ? (
              <span className="text-scada-green font-mono">STREAMING ({streamIndex + 1}/{allReadings.length})</span>
            ) : (
              <span className="text-scada-textDim font-mono">PAUSED</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!streaming ? (
            <button
              onClick={startStream}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-scada-green/10 border border-scada-green/30 text-scada-green text-sm font-mono font-bold hover:bg-scada-green/20 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Start Stream
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-scada-red/10 border border-scada-red/30 text-scada-red text-sm font-mono font-bold hover:bg-scada-red/20 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Stream
            </button>
          )}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-md border font-mono text-sm font-bold ${
              status === 'critical'
                ? 'border-scada-red/50 bg-scada-red/10 text-scada-red animate-pulse-glow-red'
                : status === 'warning'
                ? 'border-scada-yellow/40 bg-scada-yellow/10 text-scada-yellow'
                : status === 'idle'
                ? 'border-scada-border bg-scada-panel2 text-scada-textDim'
                : 'border-scada-green/40 bg-scada-green/10 text-scada-green'
            }`}
          >
            <span className={`status-dot bg-current ${status === 'critical' ? 'animate-pulse' : ''}`} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Cooldown indicator */}
      {cooldownRemaining > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-scada-yellow/5 border border-scada-yellow/20 text-xs font-mono text-scada-yellow">
          <Clock className="w-3 h-3" />
          Alert cooldown active for {deviceId}: {cooldownRemaining}s remaining
        </div>
      )}

      {/* KPI cards */}
      {latestReading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Thermometer}
            label="Temperature"
            value={latestReading.temperature.toFixed(1)}
            unit="°C"
            color="orange"
          />
          <KpiCard
            icon={Wind}
            label="Smoke Level"
            value={latestReading.smoke_level.toFixed(2)}
            unit="ppm"
            color="yellow"
          />
          <KpiCard
            icon={Zap}
            label="Power Load"
            value={latestReading.power_load.toFixed(1)}
            unit="kW"
            color="accent"
          />
          <KpiCard
            icon={TrendingUp}
            label="Voltage Fluct."
            value={latestReading.voltage_fluctuation.toFixed(2)}
            unit="V"
            color="purple"
          />
        </div>
      )}

      {/* Prediction panel */}
      {latestPred && (
        <div
          className={`panel p-6 ${
            latestPred.prediction === 1
              ? 'border-scada-red/40 glow-red'
              : 'border-scada-green/20'
          }`}
        >
          <div className="panel-header -mt-6 -mx-6 mb-4">
            <Cpu className="w-4 h-4" />
            DL Model Prediction
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-scada-panel2 rounded-md p-4 text-center">
              <p className="text-xs text-scada-textDim uppercase">Prediction</p>
              <p
                className={`font-mono font-bold text-3xl mt-2 ${
                  latestPred.prediction === 1 ? 'text-scada-red' : 'text-scada-green'
                }`}
              >
                {latestPred.prediction === 1 ? 'FAILURE' : 'NORMAL'}
              </p>
            </div>
            <div className="bg-scada-panel2 rounded-md p-4 text-center">
              <p className="text-xs text-scada-textDim uppercase">Probability</p>
              <p className="font-mono font-bold text-3xl text-scada-accent mt-2">
                {(latestPred.probability * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-scada-panel2 rounded-md p-4 text-center">
              <p className="text-xs text-scada-textDim uppercase">Device</p>
              <p className="font-mono font-bold text-xl text-scada-text mt-2">{latestPred.device_id}</p>
            </div>
            <div className="bg-scada-panel2 rounded-md p-4 text-center">
              <p className="text-xs text-scada-textDim uppercase">Timestamp</p>
              <p className="font-mono text-xs text-scada-text mt-2">
                {new Date(latestPred.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhook log */}
      <div className="panel p-6">
        <div className="panel-header -mt-6 -mx-6 mb-4">
          <Send className="w-4 h-4" />
          Webhook Alert Log
        </div>
        {streamRows.length === 0 ? (
          <p className="text-sm text-scada-textDim font-mono text-center py-8">
            No data streamed yet. Click "Start Stream" to begin live inference.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-scada-border">
                  <th className="px-3 py-2 text-left text-xs font-mono text-scada-textDim uppercase">#</th>
                  <th className="px-3 py-2 text-left text-xs font-mono text-scada-textDim uppercase">Timestamp</th>
                  <th className="px-3 py-2 text-left text-xs font-mono text-scada-textDim uppercase">Prediction</th>
                  <th className="px-3 py-2 text-left text-xs font-mono text-scada-textDim uppercase">Probability</th>
                  <th className="px-3 py-2 text-left text-xs font-mono text-scada-textDim uppercase">Webhook</th>
                </tr>
              </thead>
              <tbody>
                {streamRows.map((row, i) => (
                  <tr key={i} className="border-b border-scada-border/50 hover:bg-scada-panel2 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-scada-textDim">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-scada-text">
                      {new Date(row.reading.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          row.prediction.prediction === 1
                            ? 'bg-scada-red/15 text-scada-red'
                            : 'bg-scada-green/15 text-scada-green'
                        }`}
                      >
                        {row.prediction.prediction === 1 ? 'FAILURE' : 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-scada-textDim">
                      {(row.prediction.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      {row.alertSent ? (
                        <span className="flex items-center gap-1 font-mono text-xs text-scada-green">
                          <Send className="w-3 h-3" /> Sent
                        </span>
                      ) : row.prediction.prediction === 1 && row.cooldownRemaining > 0 ? (
                        <span className="font-mono text-xs text-scada-yellow">
                          Cooldown ({row.cooldownRemaining}s)
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-scada-textDim">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mini trend chart */}
      {streamRows.length > 1 && (
        <div className="panel p-6">
          <div className="panel-header -mt-6 -mx-6 mb-4">
            <TrendingUp className="w-4 h-4" />
            Live Prediction Probability
          </div>
          <svg viewBox="0 0 800 200" className="w-full" style={{ minWidth: 400 }}>
            <defs>
              <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line
                key={t}
                x1={40}
                y1={20 + t * 160}
                x2={780}
                y2={20 + t * 160}
                stroke="#2d3a48"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
            ))}
            <line x1={40} y1={20 + (1 - 0.5) * 160} x2={780} y2={20 + (1 - 0.5) * 160} stroke="#ef4444" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />
            <text x={775} y={20 + (1 - 0.5) * 160 - 4} fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="end">
              THRESHOLD 50%
            </text>
            {(() => {
              const pts = streamRows.map((r, i) => ({
                x: 40 + (i / Math.max(streamRows.length - 1, 1)) * 740,
                y: 20 + (1 - r.prediction.probability) * 160,
                pred: r.prediction.prediction,
              }));
              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
              const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} 180 L ${pts[0].x.toFixed(1)} 180 Z`;
              return (
                <>
                  <path d={areaPath} fill="url(#streamGrad)" />
                  <path d={linePath} fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill={p.pred === 1 ? '#ef4444' : '#22c55e'}
                    />
                  ))}
                </>
              );
            })()}
            {[0, 0.5, 1].map((t) => (
              <text key={t} x={32} y={20 + t * 160 + 4} fill="#6b7d8f" fontSize="10" fontFamily="monospace" textAnchor="end">
                {Math.round(t * 100)}%
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
