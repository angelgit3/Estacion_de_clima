// ============================================================
// Core Types for Weather Station Dashboard
// ============================================================

/**
 * Raw weather log from Supabase
 */
export interface WeatherLog {
  id: string;
  created_at: string;
  source: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  light_level: number | null;
  sound_level: number | null;
  status: string;
}

/**
 * Available time ranges for data viewing
 */
export type TimeRange = '5m' | '1h' | '24h' | '7d';

/**
 * Configuration for each time range
 */
export interface TimeRangeConfig {
  label: string;
  minutes: number;
  limit: number;
  aggregateMinutes?: number; // For data bucketing (undefined = no aggregation)
}

/**
 * Metadata for each sensor type
 */
export interface SensorMetadata {
  key: keyof Pick<WeatherLog, 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'light_level' | 'sound_level'>;
  label: string;
  unit: string;
  color: string;
  gradient: string;
}

/**
 * Heartbeat status indicators
 */
export interface HeartbeatStatus {
  isOnline: boolean;
  lastSeen: Date | null;
  secondsAgo: number | null;
  statusText: string;
}

/**
 * Statistics for a sensor over a time range
 */
export interface SensorStatistics {
  current: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  trendPercentage: number | null;
}

/**
 * Chart data point (aggregated or raw)
 */
export interface ChartDataPoint {
  time: string;
  [key: string]: string | number | null;
}
