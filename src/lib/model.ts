import type { SensorReading } from './types';

export interface PredictionResult {
  prediction: 0 | 1;
  probability: number;
  device_id: string;
  timestamp: string;
}

const FAILURE_THRESHOLD = 0.5;

const lastAlertTime: Record<string, number> = {};
const COOLDOWN_MS = 60_000;

const WEBHOOK_URL = 'https://hook.eu1.make.com/egixv1isux3o8q2wo4emmpioqxcb4c3y';

export async function triggerMakeWebhook(alertData: {
  device_id: string;
  timestamp: string;
  probability: number;
  prediction: number;
  temperature: number;
  smoke_level: number;
  power_load: number;
  voltage_fluctuation: number;
}): Promise<void> {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
  } catch (err) {
    console.error('[SentinelNode] Webhook dispatch failed:', err);
  }
}

export function canAlert(deviceId: string): boolean {
  const now = Date.now();
  const last = lastAlertTime[deviceId] ?? 0;
  return now - last >= COOLDOWN_MS;
}

export function recordAlert(deviceId: string): void {
  lastAlertTime[deviceId] = Date.now();
}

export function getCooldownRemaining(deviceId: string): number {
  const now = Date.now();
  const last = lastAlertTime[deviceId] ?? 0;
  const elapsed = now - last;
  if (elapsed >= COOLDOWN_MS) return 0;
  return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
}

export function runInference(
  reading: SensorReading,
  deviceId: string = 'CO-001',
): PredictionResult {
  const { temperature, smoke_level, power_load, voltage_fluctuation, humidity } = reading;

  const tempScore = Math.max(0, (temperature - 25) / 35);
  const smokeScore = Math.max(0, (smoke_level - 5) / 20);
  const voltScore = Math.max(0, (voltage_fluctuation - 1) / 6);
  const powerScore = Math.max(0, (power_load - 50) / 30);
  const humidityScore = Math.max(0, (60 - humidity) / 40);

  const weighted =
    tempScore * 0.25 +
    smokeScore * 0.35 +
    voltScore * 0.15 +
    powerScore * 0.15 +
    humidityScore * 0.10;

  const probability = Math.min(0.999, Math.max(0.001, weighted));
  const prediction: 0 | 1 = probability >= FAILURE_THRESHOLD ? 1 : 0;

  return {
    prediction,
    probability,
    device_id: deviceId,
    timestamp: reading.timestamp,
  };
}

export async function runInferenceWithAlert(
  reading: SensorReading,
  deviceId: string = 'CO-001',
): Promise<{ result: PredictionResult; alertSent: boolean; cooldownRemaining: number }> {
  const result = runInference(reading, deviceId);
  let alertSent = false;
  let cooldownRemaining = 0;

  if (result.prediction === 1) {
    if (canAlert(deviceId)) {
      recordAlert(deviceId);
      alertSent = true;
      await triggerMakeWebhook({
        device_id: deviceId,
        timestamp: result.timestamp,
        probability: result.probability,
        prediction: result.prediction,
        temperature: reading.temperature,
        smoke_level: reading.smoke_level,
        power_load: reading.power_load,
        voltage_fluctuation: reading.voltage_fluctuation,
      });
    } else {
      cooldownRemaining = getCooldownRemaining(deviceId);
    }
  }

  return { result, alertSent, cooldownRemaining };
}
