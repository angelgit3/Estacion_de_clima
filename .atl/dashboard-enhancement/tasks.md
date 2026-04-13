# Tasks: dashboard-enhancement

## Phase 1: Infrastructure (Types, Utilities, Data Layer)

### Task 1.1: Create centralized type definitions
- **Description**: Create `types/weather.ts` with all shared TypeScript interfaces and constants: `WeatherLog`, `TimeRange`, `TimeRangeConfig`, `TIME_RANGE_CONFIGS`, `SensorMetadata`, `SENSORS`, `HeartbeatStatus`, `HeartbeatInfo`, `SensorThreshold`, `ThresholdLevel`, `UseWeatherDataReturn`, `SensorStatistics`, `ChartDataPoint`.
- **Files**: `types/weather.ts` (new)
- **Dependencies**: None
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] `WeatherLog` interface matches spec with all sensor fields typed as `number | null` and `source` as `'esp32' | 'mydaq' | string`
  - [ ] `TimeRange` is a string literal union: `'5min' | '1h' | '24h' | '7d'`
  - [ ] `TimeRangeConfig` interface and `TIME_RANGE_CONFIGS` constant with correct values for all 4 ranges
  - [ ] `SensorMetadata` interface and `SENSORS` array with all 6 sensors, each having unique `gradientId`
  - [ ] `HeartbeatStatus` type (`'online' | 'stale' | 'offline'`) and `HeartbeatInfo` interface
  - [ ] `SensorThreshold` interface and `ThresholdLevel` type
  - [ ] `UseWeatherDataReturn` interface with `data`, `latest`, `loading`, `error`, `retry`
  - [ ] `SensorStatistics` interface with `min`, `max`, `avg`, `trend`, `trendDelta`
  - [ ] `ChartDataPoint` interface with index signature
  - [ ] TypeScript compilation passes with no errors

### Task 1.2: Create threshold configuration and utility functions
- **Description**: Create `lib/thresholds.ts` with `sensorThresholds` configuration map for all 6 sensors, `classifyThreshold(sensorKey, value)` function, and `getThresholdColor(level)` function.
- **Files**: `lib/thresholds.ts` (new)
- **Dependencies**: Task 1.1 (types must exist first)
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] `sensorThresholds` object contains entries for all 6 sensor keys with correct ranges
  - [ ] Pressure thresholds are altitude-adjusted: `normal: [780, 820]`, `warning: [760, 840]`
  - [ ] `classifyThreshold('temperature', 22)` returns `'normal'`
  - [ ] `classifyThreshold('temperature', 45)` returns `'warning'`
  - [ ] `classifyThreshold('temperature', 50)` returns `'critical'`
  - [ ] `classifyThreshold('temperature', -15)` returns `'critical'`
  - [ ] `classifyThreshold('temperature', null)` returns `'normal'`
  - [ ] `classifyThreshold('pressure', 800)` returns `'normal'`
  - [ ] `classifyThreshold('humidity', 15)` returns `'warning'`
  - [ ] `classifyThreshold('sound_level', 85)` returns `'warning'`
  - [ ] `getThresholdColor('normal')` returns `'#1e293b'`
  - [ ] `getThresholdColor('warning')` returns `'#f97316'`
  - [ ] `getThresholdColor('critical')` returns `'#dc2626'`
  - [ ] Range checks are inclusive on both ends

### Task 1.3: Create statistics computation utility
- **Description**: Create `lib/statistics.ts` with a `computeStatistics(data: WeatherLog[], sensorKey: SensorMetadata['key']): SensorStatistics` function implementing min/max/avg/trend computation per spec.
- **Files**: `lib/statistics.ts` (new)
- **Dependencies**: Task 1.1 (types must exist first)
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] `min` returns the minimum non-null value, or `null` if all values are null
  - [ ] `max` returns the maximum non-null value, or `null` if all values are null
  - [ ] `avg` returns arithmetic mean of non-null values, or `null` if all values are null
  - [ ] `trend` is `'up'` when last-quarter avg > first-quarter avg + 1% threshold
  - [ ] `trend` is `'down'` when last-quarter avg < first-quarter avg - 1% threshold
  - [ ] `trend` is `'stable'` when within 1% threshold
  - [ ] `trend` is `null` when fewer than 4 data points exist
  - [ ] `trendDelta` is absolute difference between quarter averages, or `null`
  - [ ] Empty array input returns all fields as `null`
  - [ ] Null sensor values are excluded from all computations

### Task 1.4: Add safeQuery wrapper to Supabase client
- **Description**: Add `safeQuery<T>` function to `lib/supabase.ts` that wraps Supabase queries with typed error handling, formatting Supabase errors and network exceptions into user-facing Spanish messages.
- **Files**: `lib/supabase.ts` (modify)
- **Dependencies**: None
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] `safeQuery` accepts a Supabase query promise and returns `{ data: T | null; error: string | null }`
  - [ ] Successful query returns `{ data: [...], error: null }`
  - [ ] Supabase error returns `{ data: null, error: "Error al obtener datos: {message}" }`
  - [ ] Network exception returns `{ data: null, error: "No se pudo conectar al servidor. Verifica tu conexión a internet." }`
  - [ ] Function is async and properly awaits the query
  - [ ] TypeScript types are generic and preserve the data type

---

## Phase 2: Custom Hooks

### Task 2.1: Create `useTimeRange` hook
- **Description**: Create `hooks/useTimeRange.ts` custom React hook managing selected time range state with `localStorage` persistence (`'weather-dashboard-time-range'` key), defaulting to `'1h'`, with fallback to in-memory state on localStorage failure.
- **Files**: `hooks/useTimeRange.ts` (new)
- **Dependencies**: Task 1.1 (types)
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Hook returns `{ timeRange, setTimeRange, config }` conforming to `UseTimeRangeReturn`
  - [ ] Default value is `'1h'` when localStorage is empty
  - [ ] Persisted value is restored from localStorage on initialization
  - [ ] Invalid localStorage value falls back to `'1h'`
  - [ ] `setTimeRange('7d')` updates state and persists to localStorage
  - [ ] localStorage SecurityError (private browsing) falls back to in-memory state with no thrown error
  - [ ] `config` matches the correct `TimeRangeConfig` for current `timeRange`

### Task 2.2: Create `useHeartbeat` hook
- **Description**: Create `hooks/useHeartbeat.ts` custom React hook that computes connection health status from a timestamp. Returns `{ status, secondsSinceLastReading, lastReadingAt }` with 5-second interval updates. Status thresholds: online < 90s, stale 90-300s, offline > 300s or null.
- **Files**: `hooks/useHeartbeat.ts` (new)
- **Dependencies**: Task 1.1 (types)
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Hook accepts `latestTimestamp: string | null` parameter
  - [ ] Returns `{ status, secondsSinceLastReading, lastReadingAt }`
  - [ ] Status is `'online'` when seconds < 90
  - [ ] Status is `'stale'` when 90 <= seconds <= 300
  - [ ] Status is `'offline'` when seconds > 300
  - [ ] Status is `'offline'` with sentinel value when `latestTimestamp` is `null`
  - [ ] `secondsSinceLastReading` updates approximately every 5 seconds via `setInterval`
  - [ ] Interval is cleaned up on unmount (no memory leaks)

### Task 2.3: Create `useWeatherData` hook (core data fetching)
- **Description**: Create `hooks/useWeatherData.ts` custom React hook managing all weather data fetching from Supabase. Handles initial fetch, data sorting, loading state, error state, and retry. Returns `UseWeatherDataReturn`.
- **Files**: `hooks/useWeatherData.ts` (new)
- **Dependencies**: Task 1.1 (types), Task 1.4 (safeQuery)
- **Complexity**: High
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Hook accepts `timeRange: TimeRange` parameter
  - [ ] On mount, fetches data from Supabase for the given time range
  - [ ] Data is sorted ascending by `created_at` (Supabase returns descending, so reverse)
  - [ ] `loading` is `true` during fetch, `false` after completion
  - [ ] `latest` contains the most recent record
  - [ ] Query failure sets `error` with descriptive message, `data` stays empty
  - [ ] `retry()` resets error, sets loading, and re-fetches
  - [ ] TimeRange change triggers re-fetch with cleared data
  - [ ] Hook uses `safeQuery` for error handling

### Task 2.4: Add realtime subscription to `useWeatherData`
- **Description**: Extend `useWeatherData` hook to subscribe to Supabase realtime INSERT events on `weather_logs`. New records append to data array and update `latest`. Cleanup on unmount.
- **Files**: `hooks/useWeatherData.ts` (modify)
- **Dependencies**: Task 2.3
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Realtime subscription fires on INSERT events for `weather_logs` table
  - [ ] New records are appended to `data` array
  - [ ] `latest` is updated with the new record
  - [ ] `loading` remains `false` during realtime updates (no loading flash)
  - [ ] Subscription is cleaned up on unmount via `removeChannel`
  - [ ] Max data size is maintained (no unbounded growth)

### Task 2.5: Add auto-retry with exponential backoff to `useWeatherData`
- **Description**: Implement automatic retry logic in `useWeatherData` with exponential backoff: 1s → 2s → 4s → 8s (4 attempts max). After exhaustion, error is set. Counter resets on timeRange change or manual retry.
- **Files**: `hooks/useWeatherData.ts` (modify)
- **Dependencies**: Task 2.4
- **Complexity**: Medium
- **Priority**: P1
- **Acceptance Criteria**:
  - [ ] First retry occurs after 1 second delay
  - [ ] Second retry occurs after 2 seconds delay
  - [ ] Third retry occurs after 4 seconds delay
  - [ ] Fourth retry occurs after 8 seconds delay
  - [ ] After 4th failure, `error` is set and no more auto-retries occur
  - [ ] Retry counter resets when `timeRange` changes
  - [ ] Retry counter resets when `retry()` is called manually
  - [ ] Retry counter resets when a fetch succeeds
  - [ ] Manual retry after exhaustion starts a fresh sequence of 4 auto-retries

### Task 2.6: Add client-side data aggregation to `useWeatherData`
- **Description**: Implement client-side time bucket aggregation in `useWeatherData`. When `bucketMinutes > 0`, group records into buckets and average sensor fields, ignoring nulls.
- **Files**: `hooks/useWeatherData.ts` (modify)
- **Dependencies**: Task 2.4
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] `bucketMinutes: 0` (5min, 1h) returns raw unmodified records
  - [ ] `bucketMinutes: 15` (24h) produces ~96 aggregated records from 24h of raw data
  - [ ] `bucketMinutes: 60` (7d) produces ~168 aggregated records from 7d of raw data
  - [ ] Records are grouped by flooring `created_at` to nearest bucket boundary
  - [ ] Numeric sensor fields are averaged within each bucket
  - [ ] Null values are excluded from averages
  - [ ] Buckets with all-null values for a sensor produce `null` average
  - [ ] Each bucket's `created_at` is set to the bucket start time

---

## Phase 3: UI Components

### Task 3.1: Create `LoadingSkeleton` component
- **Description**: Create `components/LoadingSkeleton.tsx` with animated shimmer placeholders for both `'card'` and `'chart'` variants. Card variant supports `count` prop. Uses CSS animation or Framer Motion.
- **Files**: `components/LoadingSkeleton.tsx` (new)
- **Dependencies**: None
- **Complexity**: Low
- **Priority**: P1
- **Acceptance Criteria**:
  - [ ] `variant: 'card'` renders card-shaped skeleton placeholders
  - [ ] `count` prop controls number of card skeletons rendered
  - [ ] `variant: 'chart'` renders a single wide chart-sized skeleton
  - [ ] Shimmer/sweeping gradient animation is visible
  - [ ] Skeleton dimensions match WeatherCard and chart container dimensions respectively
  - [ ] Supports optional `className` prop

### Task 3.2: Enhance `WeatherCard` component with thresholds, statistics, and trends
- **Description**: Modify `components/WeatherCard.tsx` to accept `thresholdLevel` and `statistics` props. Add threshold-based text coloring, trend arrow indicators, and mini statistics bar (min/max/avg). Maintain backward compatibility.
- **Files**: `components/WeatherCard.tsx` (modify)
- **Dependencies**: Task 1.1 (types), Task 1.2 (thresholds)
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Accepts `thresholdLevel?: ThresholdLevel` and `statistics?: SensorStatistics` props
  - [ ] Value text uses `text-slate-800` for `'normal'`, `text-orange-500` for `'warning'`, `text-red-600` for `'critical'`
  - [ ] Null value (non-loading) displays `"--"`
  - [ ] Loading state displays `"..."`
  - [ ] Green upward arrow (↑) shown when `trend: 'up'`
  - [ ] Blue downward arrow (↓) shown when `trend: 'down'`
  - [ ] Gray horizontal arrow (→) shown when `trend: 'stable'`
  - [ ] No trend indicator when `trend: null`
  - [ ] Mini stats bar shows "Min: X  Max: Y  Avg: Z" in small muted text when `statistics` provided
  - [ ] No stats bar when `statistics` is not provided
  - [ ] Icon gradient background unchanged regardless of threshold
  - [ ] Backward compatible with existing props (thresholdLevel/statistics are optional)

### Task 3.3: Create `TimeRangePicker` component
- **Description**: Create `components/TimeRangePicker.tsx` segmented control with four pill buttons: "5 min", "1 h", "24 h", "7 d". Active button has `bg-sky-500 text-white`, inactive has `bg-white/50 text-slate-500`.
- **Files**: `components/TimeRangePicker.tsx` (new)
- **Dependencies**: Task 1.1 (types)
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Renders four buttons labeled "5 min", "1 h", "24 h", "7 d"
  - [ ] Active button matches `value` prop and has `bg-sky-500 text-white`
  - [ ] Inactive buttons have `bg-white/50 text-slate-500`
  - [ ] Clicking inactive button calls `onChange` with the new range
  - [ ] Clicking already-active button does NOT call `onChange`
  - [ ] Pill-shaped button styling

### Task 3.4: Create `HeartbeatStatus` component
- **Description**: Create `components/HeartbeatStatus.tsx` displaying connection health with colored dot, status label (Spanish), and optional seconds counter. Supports `compact` mode.
- **Files**: `components/HeartbeatStatus.tsx` (new)
- **Dependencies**: Task 1.1 (types)
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Accepts `heartbeat: HeartbeatInfo` and `compact?: boolean` props
  - [ ] `'online'` status: green dot (`bg-emerald-500`) with `animate-pulse`, label "En línea"
  - [ ] `'stale'` status: yellow dot (`bg-yellow-500`) without animation, label "Datos antiguos"
  - [ ] `'offline'` status: red dot (`bg-red-500`) with `animate-pulse`, label "Sin conexión"
  - [ ] Non-compact mode shows seconds counter ("hace X s")
  - [ ] Compact mode hides seconds counter, shows only dot and label

### Task 3.5: Create `ErrorBanner` component
- **Description**: Create `components/ErrorBanner.tsx` full-width error banner with red gradient background, AlertTriangle icon, error message text, "Reintentar" button, and optional dismiss button.
- **Files**: `components/ErrorBanner.tsx` (new)
- **Dependencies**: None
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Accepts `message`, `onRetry`, and optional `onDismiss` props
  - [ ] Positioned as `fixed top-0 left-0 right-0 z-50`
  - [ ] Red gradient background: `from-red-500 via-red-600 to-red-500`
  - [ ] AlertTriangle icon from lucide-react is displayed
  - [ ] Error message text is visible
  - [ ] "Reintentar" button calls `onRetry` when clicked
  - [ ] Dismiss button renders only when `onDismiss` is provided
  - [ ] Dismiss button calls `onDismiss` when clicked

### Task 3.6: Create `SystemStatusSidebar` component
- **Description**: Create `components/SystemStatusSidebar.tsx` replacing hardcoded sidebar with live heartbeat-driven indicators: ESP32 status, IMU integrity, light level day/night, and alert indicator.
- **Files**: `components/SystemStatusSidebar.tsx` (new)
- **Dependencies**: Task 1.1 (types)
- **Complexity**: Medium
- **Priority**: P1
- **Acceptance Criteria**:
  - [ ] Accepts `heartbeat`, `alertActive`, `onDismissAlert`, `latestLightLevel` props
  - [ ] ESP32 status shows green badge for `'online'`, yellow for `'stale'`, red for `'offline'`
  - [ ] Badge text reads "ESP32 Online", "ESP32 Stale", or "ESP32 Offline" accordingly
  - [ ] NI MyDAQ Node shows "Activo" status
  - [ ] MPU6500 IMU shows integrity status based on `alertActive`
  - [ ] Photoresistor shows "☀️ Día" when `latestLightLevel > 1500`, "🌙 Noche" otherwise
  - [ ] Alert indicator shows pulsing red dot when `alertActive` is true
  - [ ] Visual styling matches existing sidebar design (rounded-3xl, backdrop-blur, etc.)

### Task 3.7: Create `SensorChart` component
- **Description**: Create `components/SensorChart.tsx` reusable Recharts AreaChart component. Accepts `data`, `sensor` metadata, optional `title`, `height`, `loading`, `className`. Renders card container with header, chart, tooltip, and loading skeleton.
- **Files**: `components/SensorChart.tsx` (new)
- **Dependencies**: Task 1.1 (types), Task 3.1 (LoadingSkeleton)
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Accepts `data`, `sensor`, optional `title`, `height` (default 260), `loading`, `className`
  - [ ] Card container uses `rounded-3xl bg-white/70 backdrop-blur-md` styling
  - [ ] Header shows sensor icon and label (or custom title)
  - [ ] ResponsiveContainer wraps AreaChart with `monotone` interpolation
  - [ ] LinearGradient uses sensor's `gradientStops` for fill
  - [ ] CartesianGrid: `strokeDasharray="3 3"`, `stroke="#e2e8f0"`, `vertical={false}`
  - [ ] XAxis uses `formatTime` for tick labels, `stroke="#94a3b8"`, `fontSize={11}`
  - [ ] YAxis: `stroke="#94a3b8"`, `fontSize={11}`, `orientation="right"`, `tickLine={false}`
  - [ ] Tooltip uses glass-morphism styling (rgba background, backdrop blur, border radius 14px)
  - [ ] Area uses sensor's `chartColor` and gradient fill
  - [ ] Tooltip formats values to 1 decimal place + unit
  - [ ] Loading state renders skeleton instead of chart
  - [ ] Custom `height` overrides default 260
  - [ ] Custom `title` overrides sensor label

---

## Phase 4: Dashboard Integration

### Task 4.1: Refactor `page.tsx` as thin orchestrator
- **Description**: Refactor `app/page.tsx` into a ~40-60 line orchestrator that calls hooks (`useWeatherData`, `useTimeRange`, `useHeartbeat`), passes results to components (`SensorCard`, `SensorChart`, `HeartbeatStatus`, `TimeRangePicker`, `ErrorBanner`, `SystemStatusSidebar`), and contains no direct Supabase calls or inline charts.
- **Files**: `app/page.tsx` (modify)
- **Dependencies**: Tasks 2.1, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
- **Complexity**: Medium
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] File is under 60 lines (excluding imports and blank lines)
  - [ ] No direct `supabase`, `.from(`, or `.channel(` calls
  - [ ] No inline `<AreaChart>` definitions
  - [ ] No direct `useState` for data arrays (uses `useWeatherData`)
  - [ ] No direct `useEffect` for subscriptions (uses hooks)
  - [ ] No static status indicators (uses `HeartbeatStatus`)
  - [ ] `ErrorBanner` renders above header when `error` is non-null
  - [ ] `TimeRangePicker` is in header, aligned right
  - [ ] Header is responsive (stacks vertically on mobile)
  - [ ] All 6 sensor cards render with threshold/states from hooks
  - [ ] All 6 charts render via `SensorChart` component

### Task 4.2: Integrate all six sensor charts in responsive grid layout
- **Description**: Within `page.tsx`, arrange all 6 charts in the specified responsive grid layout: temperature (2-col) + sidebar (1-col), humidity (2-col), wind (1-col), pressure (2-col), light (1-col) + sound (1-col). Mobile stacks single-column.
- **Files**: `app/page.tsx` (modify)
- **Dependencies**: Task 4.1, Task 3.7
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Desktop (>=1024px): temperature chart spans 2 columns, sidebar in column 3
  - [ ] Desktop: humidity spans 2 columns
  - [ ] Desktop: wind in 1 column
  - [ ] Desktop: pressure spans 2 columns
  - [ ] Desktop: light and sound share a row (1 col each)
  - [ ] Mobile (<768px): all charts stack vertically in single column
  - [ ] Chart order matches spec: Temp → Humidity → Wind → Pressure → Light → Sound
  - [ ] Null sensor records are filtered per-chart before passing to SensorChart

### Task 4.3: Wire threshold coloring to sensor cards
- **Description**: In `page.tsx`, compute `classifyThreshold` for each sensor's current value and pass the result to each SensorCard. Connect `computeStatistics` for each sensor and pass results as `statistics` prop.
- **Files**: `app/page.tsx` (modify)
- **Dependencies**: Task 4.1, Task 1.2, Task 1.3
- **Complexity**: Low
- **Priority**: P0
- **Acceptance Criteria**:
  - [ ] Each of the 6 sensor cards receives correct `thresholdLevel` prop
  - [ ] Each card receives `statistics` prop with computed min/max/avg/trend
  - [ ] Value text color changes based on threshold (slate/orange/red)
  - [ ] Trend arrows appear correctly on cards with trend data
  - [ ] Mini statistics bars appear below values
  - [ ] Cards with null values show "--" and no threshold coloring

---

## Phase 5: Error Handling & Realtime Resilience

### Task 5.1: Implement realtime subscription error recovery
- **Description**: Enhance the Supabase realtime subscription in `useWeatherData` to handle CHANNEL_ERROR, TIMED_OUT, and CLOSED events. On error, update heartbeat to offline and set error message. On reconnection, re-fetch to fill gaps.
- **Files**: `hooks/useWeatherData.ts` (modify)
- **Dependencies**: Task 2.4
- **Complexity**: Medium
- **Priority**: P1
- **Acceptance Criteria**:
  - [ ] Subscription listens for CHANNEL_ERROR, TIMED_OUT, and CLOSED events
  - [ ] On error events, error state reflects disconnection
  - [ ] On reconnection, a fresh data fetch fills any missed records
  - [ ] Error message: "Error de conexión en tiempo real. Reconectando..."
  - [ ] Heartbeat transitions to `'offline'` on subscription error

### Task 5.2: Integrate loading state management across all scenarios
- **Description**: Ensure loading state correctly handles: initial load (skeletons shown), time range transitions (skeletons shown), and realtime updates (no loading flash). Loading state is independent of error state.
- **Files**: `hooks/useWeatherData.ts` (modify), `app/page.tsx` (modify)
- **Dependencies**: Task 2.3, Task 4.1
- **Complexity**: Low
- **Priority**: P1
- **Acceptance Criteria**:
  - [ ] Initial mount: `loading: true`, skeletons visible
  - [ ] Time range change: `loading: true`, skeletons shown during fetch
  - [ ] Realtime INSERT: `loading` remains `false` (no loading flash)
  - [ ] Fetch completion (success or failure): `loading` becomes `false`
  - [ ] Loading and error states can coexist (`loading: true`, `error: null`)
  - [ ] ErrorBanner only renders when `error` is non-null
  - [ ] ErrorBanner disappears when `error` becomes `null` after successful retry
  - [ ] Header content is positioned below ErrorBanner (not underneath)

---

## Dependency Graph
```
1.1 ──┬── 1.2 ──┬── 3.2 ──┬── 4.1 ──┬── 4.2
      │         │         │         └── 4.3
      │         │         ├── 3.6 ──┘
      │         │         ├── 3.3 ──┘
      │         │         ├── 3.4 ──┘
      │         │         ├── 3.5 ──┘
      │         │         └── 3.7 ──┘
      │         │
      │         └── 3.2 (thresholds)
      │
      ├── 1.3 ──┬── 4.3
      │         └── (used by hooks for aggregation)
      │
      └── 1.4 ── 2.3 ──┬── 2.4 ──┬── 2.5 ──┬── 4.1
                       │         │         └── 5.1
                       │         │
                       │         └── 2.6 ── 4.1
                       │
                       └── 5.2

2.1 ──────────────────────────────────── 4.1
2.2 ──────────────────────────────────── 4.1 (via sidebar/heartbeat)

3.1 ──────────────────────────────────── 3.7
```

## Summary
- **Total Tasks**: 19
- **Infrastructure (Phase 1)**: 4 tasks — Types, thresholds, statistics, safeQuery
- **Custom Hooks (Phase 2)**: 6 tasks — useTimeRange, useHeartbeat, useWeatherData (core + realtime + retry + aggregation)
- **UI Components (Phase 3)**: 7 tasks — LoadingSkeleton, WeatherCard, TimeRangePicker, HeartbeatStatus, ErrorBanner, SystemStatusSidebar, SensorChart
- **Dashboard Integration (Phase 4)**: 3 tasks — page.tsx orchestrator, chart grid layout, threshold wiring
- **Error Handling & Resilience (Phase 5)**: 2 tasks — realtime error recovery, loading state management

**Priority Breakdown**:
- P0: 14 tasks (must-have for core functionality)
- P1: 5 tasks (auto-retry, loading skeletons, sidebar, error recovery, loading integration)

**Estimated Complexity**: Medium-High — significant refactor involving hooks architecture, chart extraction, and state management overhaul.

**Ready for**: sdd-apply
