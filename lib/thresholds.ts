import { WeatherLog } from './types';

// ============================================================
// Sensor Threshold Configuration
// Calibrated for Sierra Hidalguense, Mexico (2157m altitude)
// ============================================================

export type ThresholdLevel = 'normal' | 'warning' | 'critical';

export interface SensorThreshold {
  normal: [number, number];      // [min, max] for normal range
  warning: [number, number];     // [min, max] for warning range
  critical: [number, number];    // [min, max] for critical range
}

/**
 * Threshold map for all sensors
 * Values calibrated for typical conditions at 2157m altitude
 */
export const SENSOR_THRESHOLDS: Record<
  keyof Pick<WeatherLog, 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'light_level' | 'sound_level'>,
  SensorThreshold
> = {
  temperature: {
    normal: [5, 30],        // °C: typical mountain range
    warning: [0, 35],       // °C: cold snaps or heat waves
    critical: [-10, 45],    // °C: extreme conditions
  },
  humidity: {
    normal: [20, 80],       // %: comfortable range
    warning: [10, 90],      // %: dry or very humid
    critical: [0, 100],     // %: extreme
  },
  pressure: {
    normal: [780, 810],     // hPa: station pressure at 2157m (~790 hPa typical)
    warning: [770, 820],    // hPa: weather system changes
    critical: [760, 830],   // hPa: significant weather events
  },
  wind_speed: {
    normal: [0, 25],        // km/h: light to moderate breeze
    warning: [25, 50],      // km/h: strong breeze to moderate wind
    critical: [50, 120],    // km/h: strong wind to storm
  },
  light_level: {
    normal: [100, 3500],    // ADC: typical day range (not calibrated to lux)
    warning: [50, 4000],    // ADC: dawn/dusk or very bright
    critical: [0, 4095],    // ADC: full range
  },
  sound_level: {
    normal: [20, 70],       // dB: quiet to moderate noise
    warning: [70, 90],      // dB: loud
    critical: [90, 120],    // dB: very loud, potentially harmful
  },
};

/**
 * Color mapping for threshold levels
 */
export const THRESHOLD_COLORS: Record<ThresholdLevel, string> = {
  normal: 'text-slate-800',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

export const THRESHOLD_BG_COLORS: Record<ThresholdLevel, string> = {
  normal: 'bg-emerald-50',
  warning: 'bg-amber-50',
  critical: 'bg-red-50',
};

/**
 * Classify a sensor value into a threshold level
 */
export function classifySensorValue(
  sensorKey: keyof typeof SENSOR_THRESHOLDS,
  value: number | null
): ThresholdLevel {
  if (value === null) return 'normal';

  const thresholds = SENSOR_THRESHOLDS[sensorKey];
  
  // Check if in normal range
  if (value >= thresholds.normal[0] && value <= thresholds.normal[1]) {
    return 'normal';
  }
  
  // Check if in warning range
  if (value >= thresholds.warning[0] && value <= thresholds.warning[1]) {
    return 'warning';
  }
  
  // Otherwise critical
  return 'critical';
}

/**
 * Get CSS class for a sensor value's threshold level
 */
export function getThresholdColorClass(
  sensorKey: keyof typeof SENSOR_THRESHOLDS,
  value: number | null
): string {
  const level = classifySensorValue(sensorKey, value);
  return THRESHOLD_COLORS[level];
}
