# Types Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: WeatherLog Interface

The system SHALL define a `WeatherLog` interface in `types/weather.ts` that represents a single reading from any sensor source, matching the `weather_logs` Supabase table schema. All sensor value fields SHALL be typed as `number | null` to account for missing or uninitialized sensors.

```ts
export interface WeatherLog {
  id: string;
  created_at: string;
  source: 'esp32' | 'mydaq' | string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  light_level: number | null;
  sound_level: number | null;
  status: 'ok' | 'alert' | string;
}
```

#### Scenario: WeatherLog with all sensors populated

- GIVEN a complete reading from the ESP32 source
- WHEN the reading is typed as `WeatherLog`
- THEN all sensor fields contain non-null numbers, `source` is `'esp32'`, and `status` is `'ok'`

#### Scenario: WeatherLog with null sensor values

- GIVEN a partial reading where the sound sensor is disconnected
- WHEN the reading is typed as `WeatherLog`
- THEN `sound_level` is `null` and all other sensor fields contain valid numbers

#### Scenario: WeatherLog rejects invalid source type

- GIVEN a `WeatherLog` object is created with `source: 123`
- WHEN TypeScript compilation runs
- THEN it MUST produce a type error since `source` must be a string

### Requirement: TimeRange Type

The system SHALL define a `TimeRange` union type representing the four supported time window selections. The type SHALL be a string literal union to enable exhaustive type checking.

```ts
export type TimeRange = '5min' | '1h' | '24h' | '7d';
```

#### Scenario: TimeRange accepts valid value

- GIVEN a variable typed as `TimeRange`
- WHEN assigned `'24h'`
- THEN TypeScript accepts the assignment without error

#### Scenario: TimeRange rejects invalid value

- GIVEN a variable typed as `TimeRange`
- WHEN assigned `'30min'`
- THEN TypeScript MUST produce a type error

### Requirement: TimeRangeConfig Interface

The system SHALL define a `TimeRangeConfig` interface that maps each `TimeRange` value to its query parameters and aggregation settings.

```ts
export interface TimeRangeConfig {
  label: string;           // Display label (e.g., "5 min", "1 h")
  minutes: number;         // Total minutes in the range
  bucketMinutes: number;   // Aggregation bucket size (0 = no aggregation)
  maxRecords: number;      // Maximum records to fetch from Supabase
}

export const TIME_RANGE_CONFIGS: Record<TimeRange, TimeRangeConfig> = {
  '5min': { label: '5 min',  minutes: 5,     bucketMinutes: 0,  maxRecords: 20 },
  '1h':   { label: '1 h',    minutes: 60,    bucketMinutes: 0,  maxRecords: 200 },
  '24h':  { label: '24 h',   minutes: 1440,  bucketMinutes: 15, maxRecords: 5000 },
  '7d':   { label: '7 d',    minutes: 10080, bucketMinutes: 60, maxRecords: 20160 },
};
```

#### Scenario: 5min config has no aggregation

- GIVEN `TIME_RANGE_CONFIGS['5min']`
- WHEN inspected
- THEN `bucketMinutes` is `0` and `maxRecords` is `20`

#### Scenario: 24h config uses 15-minute buckets

- GIVEN `TIME_RANGE_CONFIGS['24h']`
- WHEN inspected
- THEN `bucketMinutes` is `15` and `maxRecords` is `5000`

#### Scenario: 7d config uses 1-hour buckets

- GIVEN `TIME_RANGE_CONFIGS['7d']`
- WHEN inspected
- THEN `bucketMinutes` is `60` and `maxRecords` is `20160`

### Requirement: SensorMetadata Interface

The system SHALL define a `SensorMetadata` interface that describes each sensor's display properties, data key, and unit.

```ts
export interface SensorMetadata {
  key: keyof Pick<WeatherLog, 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'light_level' | 'sound_level'>;
  label: string;
  unit: string;
  chartColor: string;
  gradientId: string;
  gradientStops: { offset: string; color: string; opacity: number }[];
}

export const SENSORS: SensorMetadata[] = [
  {
    key: 'temperature', label: 'Temperatura', unit: '°C',
    chartColor: '#f97316', gradientId: 'gradTemp',
    gradientStops: [
      { offset: '5%', color: '#f97316', opacity: 0.35 },
      { offset: '95%', color: '#f97316', opacity: 0.02 },
    ],
  },
  {
    key: 'humidity', label: 'Humedad', unit: '%',
    chartColor: '#0ea5e9', gradientId: 'gradHum',
    gradientStops: [
      { offset: '5%', color: '#0ea5e9', opacity: 0.35 },
      { offset: '95%', color: '#0ea5e9', opacity: 0.02 },
    ],
  },
  {
    key: 'pressure', label: 'Presión', unit: 'hPa',
    chartColor: '#10b981', gradientId: 'gradPres',
    gradientStops: [
      { offset: '5%', color: '#10b981', opacity: 0.35 },
      { offset: '95%', color: '#10b981', opacity: 0.02 },
    ],
  },
  {
    key: 'wind_speed', label: 'Viento', unit: 'km/h',
    chartColor: '#8b5cf6', gradientId: 'gradWind',
    gradientStops: [
      { offset: '5%', color: '#8b5cf6', opacity: 0.35 },
      { offset: '95%', color: '#8b5cf6', opacity: 0.02 },
    ],
  },
  {
    key: 'light_level', label: 'Luz', unit: 'lux',
    chartColor: '#f59e0b', gradientId: 'gradLight',
    gradientStops: [
      { offset: '5%', color: '#f59e0b', opacity: 0.35 },
      { offset: '95%', color: '#f59e0b', opacity: 0.02 },
    ],
  },
  {
    key: 'sound_level', label: 'Sonido', unit: 'dB',
    chartColor: '#ec4899', gradientId: 'gradSound',
    gradientStops: [
      { offset: '5%', color: '#ec4899', opacity: 0.35 },
      { offset: '95%', color: '#ec4899', opacity: 0.02 },
    ],
  },
];
```

#### Scenario: All six sensors are defined

- GIVEN the `SENSORS` array
- WHEN counting its elements
- THEN it contains exactly 6 entries

#### Scenario: Each sensor has a unique gradient ID

- GIVEN the `SENSORS` array
- WHEN collecting all `gradientId` values
- THEN all 6 values are unique (no duplicates)

### Requirement: HeartbeatStatus Type

The system SHALL define a `HeartbeatStatus` union type representing the three possible connection health states.

```ts
export type HeartbeatStatus = 'online' | 'stale' | 'offline';

export interface HeartbeatInfo {
  status: HeartbeatStatus;
  secondsSinceLastReading: number;
  lastReadingAt: string | null;
}
```

#### Scenario: Online status for recent reading

- GIVEN the last reading was 30 seconds ago
- WHEN heartbeat status is computed
- THEN `status` is `'online'` and `secondsSinceLastReading` is `30`

#### Scenario: Offline status for missing readings

- GIVEN the last reading was 600 seconds ago
- WHEN heartbeat status is computed
- THEN `status` is `'offline'` and `secondsSinceLastReading` is `600`

### Requirement: SensorThreshold Interface

The system SHALL define a `SensorThreshold` interface for threshold-based color coding of sensor values.

```ts
export type ThresholdLevel = 'normal' | 'warning' | 'critical';

export interface SensorThreshold {
  normal: [number, number];    // [min, max] for normal range
  warning: [number, number];   // [min, max] for warning range (superset of normal)
  unit: string;
}
```

#### Scenario: Threshold level determination for temperature

- GIVEN temperature threshold: `normal: [-5, 35], warning: [-10, 45]`
- WHEN value is `38`
- THEN the level is `'warning'` (within warning range but outside normal)

#### Scenario: Threshold level for value outside all ranges

- GIVEN temperature threshold: `normal: [-5, 35], warning: [-10, 45]`
- WHEN value is `50`
- THEN the level is `'critical'` (outside warning range)

### Requirement: UseWeatherDataReturn Interface

The system SHALL define the return type for the `useWeatherData` hook.

```ts
export interface UseWeatherDataReturn {
  data: WeatherLog[];
  latest: WeatherLog | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}
```

#### Scenario: Return object contains all required fields

- GIVEN `useWeatherData` hook is called
- WHEN the return value is destructured
- THEN it provides `data`, `latest`, `loading`, `error`, and `retry`

### Requirement: SensorStatistics Interface

The system SHALL define a `SensorStatistics` interface for computed statistics over a time range.

```ts
export interface SensorStatistics {
  min: number | null;
  max: number | null;
  avg: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  trendDelta: number | null;
}
```

#### Scenario: Statistics with valid data

- GIVEN an array of 10 temperature readings ranging from 18 to 25
- WHEN statistics are computed
- THEN `min` is `18`, `max` is `25`, `avg` is between 18 and 25, and `trend` reflects the direction

#### Scenario: Statistics with empty data

- GIVEN an empty data array
- WHEN statistics are computed
- THEN all numeric fields are `null` and `trend` is `null`

### Requirement: ChartDataPoint Interface

The system SHALL define a `ChartDataPoint` interface for aggregated chart data.

```ts
export interface ChartDataPoint {
  timestamp: string;
  [sensorKey: string]: number | null | string;
}
```

#### Scenario: ChartDataPoint for raw data

- GIVEN a raw weather log entry
- WHEN converted to `ChartDataPoint`
- THEN `timestamp` contains the ISO datetime string and sensor keys map to their numeric values

#### Scenario: ChartDataPoint for aggregated bucket

- GIVEN a 15-minute aggregation bucket of 30 readings
- WHEN converted to `ChartDataPoint`
- THEN `timestamp` is the bucket start time and sensor values are averaged
