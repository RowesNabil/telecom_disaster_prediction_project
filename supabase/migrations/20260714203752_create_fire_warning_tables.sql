/*
# Fire Early-Warning System Schema (single-tenant, no auth)

1. Purpose
   This schema supports a Telecom Central Fire Early-Warning System dashboard.
   All data is pre-exported and read-only from the frontend. No authentication
   is required — the app is a single-tenant, public-data monitoring dashboard.

2. New Tables
   - `sensor_readings`: 48 hours of hourly sensor readings with computed risk probability and level.
     Columns: id, temperature, humidity, power_load, network_traffic, smoke_level,
     voltage_fluctuation, risk_probability, risk_level, timestamp.
   - `daily_risk_calendar`: One row per day with max/avg risk and warning/critical flags.
     Columns: id, date, max_risk, avg_risk, had_critical, had_warning.
   - `incidents`: Historical incident records with peak readings.
     Columns: id, start_time, end_time, peak_temperature, peak_smoke, peak_risk.
   - `model_metrics`: Single-row model performance metrics for the XGBoost model.
     Columns: id, model_name, auc, threshold, precision_risk, recall_risk, horizon_hours, total_records_trained.
   - `feature_importance`: Top 10 feature importance scores from the model.
     Columns: id, feature, importance.
   - `hourly_risk_pattern`: Average risk by hour of day (0-23).
     Columns: id, hour, avg_risk.
   - `ml_vs_dl_comparison`: Comparison of XGBoost vs LSTM model performance.
     Columns: id, model, auc, recall, precision.

3. Security
   - RLS enabled on ALL tables.
   - All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
     because this is a single-tenant, no-auth, public-data app. The anon-key frontend
     must be able to read all data. Only SELECT is needed (read-only dashboard);
     INSERT/UPDATE/DELETE policies are included for completeness but the frontend
     only reads.

4. Important Notes
   - No user_id columns, no auth.users references — this is a single-tenant dashboard.
   - All tables have an auto-incrementing bigint id as primary key (simpler than UUID for imported data).
   - Timestamps stored as timestamptz; dates as date type.
*/

-- sensor_readings: 48 hours of hourly sensor data
CREATE TABLE IF NOT EXISTS sensor_readings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  temperature double precision NOT NULL,
  humidity double precision NOT NULL,
  power_load double precision NOT NULL,
  network_traffic double precision NOT NULL,
  smoke_level double precision NOT NULL,
  voltage_fluctuation double precision NOT NULL,
  risk_probability double precision NOT NULL,
  risk_level text NOT NULL,
  timestamp timestamptz NOT NULL
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_select_sensor_readings" ON sensor_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_insert_sensor_readings" ON sensor_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_update_sensor_readings" ON sensor_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_delete_sensor_readings" ON sensor_readings FOR DELETE
  TO anon, authenticated USING (true);

-- daily_risk_calendar: one row per day
CREATE TABLE IF NOT EXISTS daily_risk_calendar (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date date NOT NULL,
  max_risk double precision NOT NULL,
  avg_risk double precision NOT NULL,
  had_critical boolean NOT NULL DEFAULT false,
  had_warning boolean NOT NULL DEFAULT false
);

ALTER TABLE daily_risk_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_daily_risk_calendar" ON daily_risk_calendar;
CREATE POLICY "anon_select_daily_risk_calendar" ON daily_risk_calendar FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_risk_calendar" ON daily_risk_calendar;
CREATE POLICY "anon_insert_daily_risk_calendar" ON daily_risk_calendar FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_risk_calendar" ON daily_risk_calendar;
CREATE POLICY "anon_update_daily_risk_calendar" ON daily_risk_calendar FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_risk_calendar" ON daily_risk_calendar;
CREATE POLICY "anon_delete_daily_risk_calendar" ON daily_risk_calendar FOR DELETE
  TO anon, authenticated USING (true);

-- incidents: historical incident records
CREATE TABLE IF NOT EXISTS incidents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  peak_temperature double precision NOT NULL,
  peak_smoke double precision NOT NULL,
  peak_risk double precision NOT NULL
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated USING (true);

-- model_metrics: single-row model performance
CREATE TABLE IF NOT EXISTS model_metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_name text NOT NULL,
  auc double precision NOT NULL,
  threshold double precision NOT NULL,
  precision_risk double precision NOT NULL,
  recall_risk double precision NOT NULL,
  horizon_hours integer NOT NULL,
  total_records_trained integer NOT NULL
);

ALTER TABLE model_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_model_metrics" ON model_metrics;
CREATE POLICY "anon_select_model_metrics" ON model_metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_model_metrics" ON model_metrics;
CREATE POLICY "anon_insert_model_metrics" ON model_metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_model_metrics" ON model_metrics;
CREATE POLICY "anon_update_model_metrics" ON model_metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_model_metrics" ON model_metrics;
CREATE POLICY "anon_delete_model_metrics" ON model_metrics FOR DELETE
  TO anon, authenticated USING (true);

-- feature_importance: top 10 features
CREATE TABLE IF NOT EXISTS feature_importance (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature text NOT NULL,
  importance double precision NOT NULL
);

ALTER TABLE feature_importance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_feature_importance" ON feature_importance;
CREATE POLICY "anon_select_feature_importance" ON feature_importance FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_feature_importance" ON feature_importance;
CREATE POLICY "anon_insert_feature_importance" ON feature_importance FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_feature_importance" ON feature_importance;
CREATE POLICY "anon_update_feature_importance" ON feature_importance FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_feature_importance" ON feature_importance;
CREATE POLICY "anon_delete_feature_importance" ON feature_importance FOR DELETE
  TO anon, authenticated USING (true);

-- hourly_risk_pattern: average risk by hour of day
CREATE TABLE IF NOT EXISTS hourly_risk_pattern (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hour integer NOT NULL,
  avg_risk double precision NOT NULL
);

ALTER TABLE hourly_risk_pattern ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hourly_risk_pattern" ON hourly_risk_pattern;
CREATE POLICY "anon_select_hourly_risk_pattern" ON hourly_risk_pattern FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hourly_risk_pattern" ON hourly_risk_pattern;
CREATE POLICY "anon_insert_hourly_risk_pattern" ON hourly_risk_pattern FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hourly_risk_pattern" ON hourly_risk_pattern;
CREATE POLICY "anon_update_hourly_risk_pattern" ON hourly_risk_pattern FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hourly_risk_pattern" ON hourly_risk_pattern;
CREATE POLICY "anon_delete_hourly_risk_pattern" ON hourly_risk_pattern FOR DELETE
  TO anon, authenticated USING (true);

-- ml_vs_dl_comparison: XGBoost vs LSTM
CREATE TABLE IF NOT EXISTS ml_vs_dl_comparison (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model text NOT NULL,
  auc double precision NOT NULL,
  recall double precision NOT NULL,
  precision double precision NOT NULL
);

ALTER TABLE ml_vs_dl_comparison ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ml_vs_dl_comparison" ON ml_vs_dl_comparison;
CREATE POLICY "anon_select_ml_vs_dl_comparison" ON ml_vs_dl_comparison FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ml_vs_dl_comparison" ON ml_vs_dl_comparison;
CREATE POLICY "anon_insert_ml_vs_dl_comparison" ON ml_vs_dl_comparison FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ml_vs_dl_comparison" ON ml_vs_dl_comparison;
CREATE POLICY "anon_update_ml_vs_dl_comparison" ON ml_vs_dl_comparison FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ml_vs_dl_comparison" ON ml_vs_dl_comparison;
CREATE POLICY "anon_delete_ml_vs_dl_comparison" ON ml_vs_dl_comparison FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings (timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_risk_calendar_date ON daily_risk_calendar (date);
CREATE INDEX IF NOT EXISTS idx_incidents_start_time ON incidents (start_time);
CREATE INDEX IF NOT EXISTS idx_hourly_risk_pattern_hour ON hourly_risk_pattern (hour);