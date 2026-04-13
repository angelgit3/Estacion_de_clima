# Data Layer Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: useWeatherData Hook

The system SHALL provide a `useWeatherData(timeRange: TimeRange)` custom React hook in `hooks/useWeatherData.ts` that manages all data fetching, aggregation, realtime subscription, loading state, error state, and auto-retry for weather sensor data.

The hook SHALL return an object conforming to `UseWeatherDataReturn`:
```ts
{
  data: WeatherLog[];       // Sorted ascending by created_at
  latest: WeatherLog | null;
  loading: boolean;
  error: string | null;     // Null when no error
  retry: () => void;        // Manual retry trigger
}
```

#### Scenario: Initial data fetch on mount

- GIVEN the hook is called with `timeRange: '5min'` and Supabase client is available
- WHEN the component mounts
- THEN `loading` is `true`, a query is sent to Supabase for the last 5 minutes of data, and on success `loading` becomes `false` and `data` is populated

#### Scenario: Data is sorted ascending by created_at

- GIVEN Supabase returns records in descending order (per `.order('created_at', { ascending: false })`)
- WHEN the hook processes the results
- THEN `data` is reversed so records are in ascending chronological order

#### Scenario: Realtime INSERT updates data array

- GIVEN the hook has loaded initial data
- WHEN a new `INSERT` event arrives on the `weather_logs` table via Supabase realtime
- THEN the new record is appended to `data` (keeping max size), `latest` is updated, and `loading` remains `false`

#### Scenario: Query failure sets error state

- GIVEN the Supabase server is unreachable
- WHEN the initial fetch attempt fails
- THEN `error` contains a descriptive message, `data` remains empty, `loading` is `false`, and `retry` is available

#### Scenario: Manual retry re-fetches data

- GIVEN `error` is non-null after a failed query
- WHEN `retry()` is called
- THEN `error` is reset to `null`, `loading` becomes `true`, and a new query is initiated

#### Scenario: TimeRange change triggers re-fetch

- GIVEN the hook was called with `'5min'` and data is loaded
- WHEN `timeRange` changes to `'24h'`
- THEN `loading` becomes `true`, `data` is cleared, a new query is made for 24h of data, and on success `loading` becomes `false` with aggregated data

#### Scenario: Realtime subscription is cleaned up on unmount

- GIVEN the hook is active with a realtime subscription
- WHEN the component unmounts
- THEN the Supabase channel is removed and no further updates are processed

### Requirement: Data Aggregation Logic

The system SHALL aggregate raw weather data into time buckets when the selected time range's `bucketMinutes` is greater than zero. Aggregation SHALL occur client-side after data is fetched from Supabase.

For each bucket:
1. Records are grouped by floor-ing `created_at` to the nearest `bucketMinutes` boundary
2. Numeric sensor fields (`temperature`, `humidity`, `pressure`, `wind_speed`, `light_level`, `sound_level`) are averaged across all records in the bucket, ignoring `null` values
3. Each bucket produces a single `WeatherLog` with `created_at` set to the bucket start time

Aggregation configuration per range:
| Range     | bucketMinutes | Expected output points |
|-----------|--------------|------------------------|
| `'5min'`  | 0 (raw)      | ~10                    |
| `'1h'`    | 0 (raw)      | ~120                   |
| `'24h'`   | 15           | ~96                    |
| `'7d'`    | 60           | ~168                   |

#### Scenario: 5min range returns raw data

- GIVEN `timeRange` is `'5min'` with `bucketMinutes: 0`
- WHEN data is fetched
- THEN no aggregation is applied and all raw records are returned

#### Scenario: 24h range aggregates into 15-minute buckets

- GIVEN 200 raw records spanning 24 hours
- WHEN aggregation is applied with `bucketMinutes: 15`
- THEN approximately 96 bucketed records are produced, each with averaged sensor values

#### Scenario: Null sensor values are excluded from averages

- GIVEN a bucket containing 10 records where 3 have `temperature: null`
- WHEN the average temperature for the bucket is computed
- THEN the average is calculated from only the 7 non-null values

#### Scenario: Bucket with all null values produces null average

- GIVEN a bucket where all records have `pressure: null`
- WHEN the average pressure is computed
- THEN the result is `null`

### Requirement: Auto-Retry with Exponential Backoff

The system SHALL automatically retry failed Supabase queries with exponential backoff. The retry sequence SHALL be: 1s → 2s → 4s → 8s (4 attempts maximum). After the 4th failure, `error` SHALL be set and no further automatic retries SHALL occur until `retry()` is called manually.

The retry counter SHALL reset on each new time range change or manual retry call.

#### Scenario: Successful fetch requires no retries

- GIVEN Supabase is reachable
- WHEN the hook fetches data
- THEN the query succeeds on the first attempt with no retries

#### Scenario: Transient failure triggers backoff retries

- GIVEN Supabase is temporarily unreachable
- WHEN the first fetch attempt fails
- THEN the hook retries at 1s, then 2s, then 4s, then 8s intervals
- IF the 3rd attempt (4s delay) succeeds, THEN `error` is `null` and data is populated

#### Scenario: All retries exhausted sets permanent error

- GIVEN Supabase remains unreachable for all 4 attempts
- WHEN the 4th retry fails
- THEN `error` is set with the failure message, `loading` is `false`, and no further automatic retries occur

#### Scenario: Manual retry resets auto-retry counter

- GIVEN all 4 auto-retries have failed and `error` is set
- WHEN `retry()` is called
- THEN a fresh sequence of up to 4 auto-retries begins with the same backoff intervals

### Requirement: useTimeRange Hook

The system SHALL provide a `useTimeRange()` custom React hook in `hooks/useTimeRange.ts` that manages the selected time range state with `localStorage` persistence.

```ts
interface UseTimeRangeReturn {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  config: TimeRangeConfig;
}
```

The hook SHALL read from `localStorage` key `'weather-dashboard-time-range'` on initialization. If the stored value is not a valid `TimeRange`, it SHALL default to `'1h'`. If `localStorage` throws (private browsing), the hook SHALL fall back to in-memory state with default `'1h'`.

#### Scenario: Default time range on first visit

- GIVEN no value exists in localStorage
- WHEN the hook initializes
- THEN `timeRange` is `'1h'` and `config` matches `TIME_RANGE_CONFIGS['1h']`

#### Scenario: Persisted time range is restored

- GIVEN localStorage contains `'24h'` under key `'weather-dashboard-time-range'`
- WHEN the hook initializes
- THEN `timeRange` is `'24h'`

#### Scenario: setTimeRange updates and persists

- GIVEN current `timeRange` is `'1h'`
- WHEN `setTimeRange('7d')` is called
- THEN `timeRange` becomes `'7d'` and localStorage is updated

#### Scenario: Invalid localStorage value falls back to default

- GIVEN localStorage contains `'invalid'` (not a valid TimeRange)
- WHEN the hook initializes
- THEN `timeRange` defaults to `'1h'`

#### Scenario: localStorage failure does not crash

- GIVEN localStorage throws a SecurityError (private browsing)
- WHEN the hook initializes
- THEN it falls back to in-memory state with `timeRange: '1h'` and no error is thrown

### Requirement: useHeartbeat Hook

The system SHALL provide a `useHeartbeat(latestTimestamp: string | null)` custom React hook in `hooks/useHeartbeat.ts` that computes the connection health status based on the time elapsed since the most recent sensor reading.

Status thresholds:
| Status     | Condition                        | Color   |
|------------|----------------------------------|---------|
| `'online'` | seconds < 90                     | Green   |
| `'stale'`  | 90 <= seconds <= 300             | Yellow  |
| `'offline'`| seconds > 300 or no timestamp    | Red     |

The hook SHALL return `{ status, secondsSinceLastReading, lastReadingAt }`.

The `secondsSinceLastReading` SHALL update every 5 seconds via `setInterval` to provide a live count.

#### Scenario: Online status for recent reading

- GIVEN `latestTimestamp` is 30 seconds ago
- WHEN the hook computes status
- THEN `status` is `'online'` and `secondsSinceLastReading` is approximately `30`

#### Scenario: Stale status for moderately old reading

- GIVEN `latestTimestamp` is 150 seconds ago
- WHEN the hook computes status
- THEN `status` is `'stale'` and `secondsSinceLastReading` is approximately `150`

#### Scenario: Offline status for very old reading

- GIVEN `latestTimestamp` is 600 seconds ago
- WHEN the hook computes status
- THEN `status` is `'offline'` and `secondsSinceLastReading` is approximately `600`

#### Scenario: Offline status for null timestamp

- GIVEN `latestTimestamp` is `null` (no data loaded yet)
- WHEN the hook computes status
- THEN `status` is `'offline'` and `secondsSinceLastReading` is `-1` or a sentinel value

#### Scenario: Seconds counter updates live

- GIVEN `latestTimestamp` is fixed at a point 60 seconds ago
- WHEN 10 seconds pass
- THEN `secondsSinceLastReading` has increased by approximately 10 (within ±5s tolerance for interval timing)

#### Scenario: Interval is cleaned up on unmount

- GIVEN the hook is active with a running interval
- WHEN the component unmounts
- THEN the `setInterval` is cleared and no further updates occur

### Requirement: Sensor Statistics Computation

The system SHALL compute `SensorStatistics` for any sensor key over a `WeatherLog[]` array. The computation rules are:

- `min`: Minimum non-null value for the sensor key, or `null` if all values are null
- `max`: Maximum non-null value for the sensor key, or `null` if all values are null
- `avg`: Arithmetic mean of non-null values, or `null` if all values are null
- `trend`: Comparison of the average of the last 25% of readings vs the average of the first 25%:
  - `'up'` if last-quarter avg > first-quarter avg + 1% threshold
  - `'down'` if last-quarter avg < first-quarter avg - 1% threshold
  - `'stable'` otherwise
  - `null` if fewer than 4 data points exist
- `trendDelta`: Absolute difference between last-quarter avg and first-quarter avg, or `null`

#### Scenario: Statistics for increasing temperature trend

- GIVEN 20 readings where the first 5 average 18°C and the last 5 average 22°C
- WHEN statistics are computed
- THEN `trend` is `'up'` and `trendDelta` is approximately `4`

#### Scenario: Stable trend for constant values

- GIVEN 20 readings all with value 22.0
- WHEN statistics are computed
- THEN `trend` is `'stable'` and `trendDelta` is `0`

#### Scenario: Null statistics for empty data

- GIVEN an empty array
- WHEN statistics are computed
- THEN all fields are `null`

#### Scenario: Trend null for insufficient data

- GIVEN only 3 data points
- WHEN statistics are computed
- THEN `trend` is `null` (fewer than 4 required for quarter comparison)
