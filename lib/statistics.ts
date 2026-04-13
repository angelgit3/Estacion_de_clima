import { WeatherLog, SensorStatistics } from './types';

// ============================================================
// Sensor Statistics Calculator
// Computes min, max, avg, current, and trend from weather logs
// ============================================================

/**
 * Calculate statistics for a specific sensor from weather logs
 */
export function calculateSensorStatistics(
  logs: WeatherLog[],
  sensorKey: keyof Pick<WeatherLog, 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'light_level' | 'sound_level'>
): SensorStatistics {
  if (!logs || logs.length === 0) {
    return {
      current: null,
      min: null,
      max: null,
      avg: null,
      trend: null,
      trendPercentage: null,
    };
  }

  // Extract non-null values
  const values = logs
    .map((log) => log[sensorKey])
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return {
      current: null,
      min: null,
      max: null,
      avg: null,
      trend: null,
      trendPercentage: null,
    };
  }

  // Current value (latest)
  const current = values[values.length - 1];

  // Min and Max
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Average
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Trend calculation (compare first half vs second half)
  let trend: 'up' | 'down' | 'stable' | null = null;
  let trendPercentage: number | null = null;

  if (values.length >= 4) {
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    const avgFirstHalf = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    if (avgFirstHalf !== 0) {
      trendPercentage = ((avgSecondHalf - avgFirstHalf) / Math.abs(avgFirstHalf)) * 100;

      // Determine trend direction with threshold to avoid noise
      const threshold = Math.abs(avgFirstHalf) * 0.02; // 2% change threshold
      const diff = avgSecondHalf - avgFirstHalf;

      if (Math.abs(diff) > threshold) {
        trend = diff > 0 ? 'up' : 'down';
      } else {
        trend = 'stable';
      }
    }
  }

  return {
    current,
    min,
    max,
    avg,
    trend,
    trendPercentage,
  };
}

/**
 * Format trend arrow with percentage
 */
export function formatTrend(trend: 'up' | 'down' | 'stable' | null, percentage: number | null): string {
  if (!trend || percentage === null) return '';
  
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  return `${arrow} ${Math.abs(percentage).toFixed(1)}%`;
}

/**
 * Get trend color class
 */
export function getTrendColorClass(trend: 'up' | 'down' | 'stable' | null): string {
  if (!trend) return 'text-slate-400';
  
  switch (trend) {
    case 'up':
      return 'text-orange-500';
    case 'down':
      return 'text-sky-500';
    case 'stable':
      return 'text-emerald-500';
  }
}
