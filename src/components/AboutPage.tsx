import { useEffect, useState } from 'react';
import { BarChart3, Cpu, GitCompare, Target, Database, Clock, TrendingUp, Info } from 'lucide-react';
import {
  fetchModelMetrics,
  fetchFeatureImportance,
  fetchMlVsDlComparison,
} from '../lib/data';
import type { ModelMetric, FeatureImportance, MlVsDlComparison } from '../lib/types';

export default function AboutPage() {
  const [metrics, setMetrics] = useState<ModelMetric | null>(null);
  const [features, setFeatures] = useState<FeatureImportance[]>([]);
  const [comparison, setComparison] = useState<MlVsDlComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchModelMetrics(), fetchFeatureImportance(), fetchMlVsDlComparison()])
      .then(([m, f, c]) => {
        setMetrics(m);
        setFeatures(f);
        setComparison(c);
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
        <div className="text-scada-textDim font-mono text-sm animate-pulse">Loading model insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-scada-red font-mono text-sm">{error}</div>
      </div>
    );
  }

  const maxImportance = features.length > 0 ? Math.max(...features.map((f) => f.importance)) : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-scada-textBright">Model Insights</h2>
        <p className="text-sm text-scada-textDim mt-1">
          XGBoost-based fire risk prediction model · Trained on {metrics?.total_records_trained.toLocaleString()} records
        </p>
      </div>

      {/* Model metrics card */}
      {metrics && (
        <div className="panel p-6">
          <div className="panel-header -mt-6 -mx-6 mb-4">
            <Cpu className="w-4 h-4" />
            Model Performance — {metrics.model_name}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox icon={Target} label="AUC Score" value={metrics.auc.toFixed(4)} color="accent" />
            <MetricBox icon={TrendingUp} label="Precision" value={metrics.precision_risk.toFixed(2)} color="green" />
            <MetricBox icon={TrendingUp} label="Recall" value={metrics.recall_risk.toFixed(2)} color="yellow" />
            <MetricBox icon={Clock} label="Horizon" value={`${metrics.horizon_hours}h`} color="purple" />
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-scada-textDim">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              Threshold: {metrics.threshold}
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              Training Records: {metrics.total_records_trained.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Feature importance bar chart */}
      <div className="panel p-6">
        <div className="panel-header -mt-6 -mx-6 mb-4">
          <BarChart3 className="w-4 h-4" />
          Top 10 Feature Importance
        </div>
        <div className="space-y-3">
          {features.map((f, i) => {
            const pct = (f.importance / maxImportance) * 100;
            return (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-48 text-xs font-mono text-scada-textDim truncate flex-shrink-0 text-right">
                  <span className="text-scada-textDim mr-2">#{i + 1}</span>
                  {f.feature}
                </div>
                <div className="flex-1 h-7 bg-scada-panel2 rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, #00b8d4, #00b8d4aa)`,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-scada-textDim">
                    {(f.importance * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ML vs DL comparison */}
      <div className="panel p-6">
        <div className="panel-header -mt-6 -mx-6 mb-4">
          <GitCompare className="w-4 h-4" />
          XGBoost vs LSTM Comparison
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparison.map((model) => {
            const isWinner = model.auc === Math.max(...comparison.map((c) => c.auc));
            return (
              <div
                key={model.id}
                className={`rounded-md p-4 border ${
                  isWinner
                    ? 'border-scada-accent/40 bg-scada-accent/5 glow-accent'
                    : 'border-scada-border bg-scada-panel2'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-scada-textBright">{model.model}</span>
                  {isWinner && (
                    <span className="text-xs font-mono text-scada-accent px-2 py-0.5 rounded bg-scada-accent/10">
                      BEST
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold text-3xl text-scada-accent">
                    {model.auc.toFixed(4)}
                  </span>
                  <span className="text-xs font-mono text-scada-textDim uppercase">AUC</span>
                </div>
                <div className="mt-2 h-2 bg-scada-panel rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${model.auc * 100}%`, backgroundColor: '#00b8d4' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="panel p-6">
        <div className="panel-header -mt-6 -mx-6 mb-4">
          <Info className="w-4 h-4" />
          About the Model
        </div>
        <div className="space-y-3 text-sm text-scada-text leading-relaxed">
          <p>
            The Telecom Central Fire Early-Warning System uses an XGBoost gradient-boosted
            tree model to predict fire and major failure risk in telecom central offices up to
            6 hours in advance. The model was trained on {metrics?.total_records_trained.toLocaleString()} historical
            sensor records, including temperature, humidity, smoke level, power load, voltage
            fluctuation, and network traffic data.
          </p>
          <p>
            With an AUC of {metrics?.auc.toFixed(4)}, the model achieves a precision of{' '}
            {metrics?.precision_risk.toFixed(2)} and recall of {metrics?.recall_risk.toFixed(2)} on
            the risk prediction task. The decision threshold is set at {metrics?.threshold},
            classifying risk probabilities above this value as positive fire-risk predictions.
          </p>
          <p>
            Feature importance analysis reveals that the pre-computed risk score, smoke level,
            and humidity mean are the strongest predictors. An LSTM deep learning model was also
            evaluated but underperformed the XGBoost model significantly (AUC 0.50 vs{' '}
            {metrics?.auc.toFixed(4)}), likely due to the smaller training dataset and the
            gradient-boosted model's superior handling of tabular sensor data.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'red' | 'accent' | 'purple';
}) {
  const colorMap: Record<string, string> = {
    green: 'text-scada-green',
    yellow: 'text-scada-yellow',
    red: 'text-scada-red',
    accent: 'text-scada-accent',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-scada-panel2 rounded-md p-4">
      <div className="flex items-center gap-2 text-xs text-scada-textDim uppercase">
        <Icon className={`w-3 h-3 ${colorMap[color]}`} />
        {label}
      </div>
      <p className={`font-mono font-bold text-2xl mt-2 ${colorMap[color]}`}>{value}</p>
    </div>
  );
}


