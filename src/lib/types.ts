export interface SensorReading {
  id: number;
  temperature: number;
  humidity: number;
  power_load: number;
  network_traffic: number;
  smoke_level: number;
  voltage_fluctuation: number;
  risk_probability: number;
  risk_level: string;
  timestamp: string;
}

export interface DailyRisk {
  id: number;
  date: string;
  max_risk: number;
  avg_risk: number;
  had_critical: boolean;
  had_warning: boolean;
}

export interface Incident {
  id: number;
  start_time: string;
  end_time: string;
  peak_temperature: number;
  peak_smoke: number;
  peak_risk: number;
}

export interface ModelMetric {
  id: number;
  model_name: string;
  auc: number;
  threshold: number;
  precision_risk: number;
  recall_risk: number;
  horizon_hours: number;
  total_records_trained: number;
}

export interface FeatureImportance {
  id: number;
  feature: string;
  importance: number;
}

export interface HourlyRiskPattern {
  id: number;
  hour: number;
  avg_risk: number;
}

export interface MlVsDlComparison {
  id: number;
  model: string;
  auc: number;
  recall: number;
  precision: number;
}
