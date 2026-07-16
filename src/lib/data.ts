import { supabase } from './supabase';
import type {
  SensorReading,
  DailyRisk,
  Incident,
  ModelMetric,
  FeatureImportance,
  HourlyRiskPattern,
  MlVsDlComparison,
} from './types';

export async function fetchSensorReadings(): Promise<SensorReading[]> {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDailyRiskByMonth(year: number, month: number): Promise<DailyRisk[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  const { data, error } = await supabase
    .from('daily_risk_calendar')
    .select('*')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDailyRiskByDate(date: string): Promise<DailyRisk | null> {
  const { data, error } = await supabase
    .from('daily_risk_calendar')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchIncidentsByDateRange(start: string, end: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .gte('start_time', start)
    .lte('start_time', end)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchModelMetrics(): Promise<ModelMetric | null> {
  const { data, error } = await supabase
    .from('model_metrics')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFeatureImportance(): Promise<FeatureImportance[]> {
  const { data, error } = await supabase
    .from('feature_importance')
    .select('*')
    .order('importance', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHourlyRiskPattern(): Promise<HourlyRiskPattern[]> {
  const { data, error } = await supabase
    .from('hourly_risk_pattern')
    .select('*')
    .order('hour', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMlVsDlComparison(): Promise<MlVsDlComparison[]> {
  const { data, error } = await supabase
    .from('ml_vs_dl_comparison')
    .select('*')
    .order('auc', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
