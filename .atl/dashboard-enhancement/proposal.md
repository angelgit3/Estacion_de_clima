# Proposal: dashboard-enhancement

## Summary
Transform the monolithic weather station dashboard into a production-grade monitoring application by adding missing sensor charts (pressure, light, sound), trend indicators with statistics, time-range selection with data aggregation, real-time heartbeat detection, error handling with retry, threshold-based color coding, loading skeletons, and a full component/hook refactor.

## Scope

### In Scope
- **Missing charts**: Add AreaChart visualizations for pressure, light level, and sound level sensors (matching existing chart style)
- **Trend indicators & statistics**: Up/down arrows + min/max/avg computed over selected time range on every sensor card
- **Time range selector**: 5min, 1h, 24h, 7d picker with automatic data aggregation (raw → avg buckets for >1h ranges)
- **Heartbeat detection**: Real "last update" indicator that turns red/yellow/green based on seconds-since-last-reading; auto-detects offline state
- **Error handling**: Supabase query failure states, auto-retry with exponential backoff, user-facing error banner with manual retry button
- **Threshold color coding**: Sensor values colored by range (e.g., temperature: blue→green→orange→red) defined in a configurable thresholds map
- **Component refactoring**: Split `page.tsx` (~300 lines) into composable components (`SensorCard`, `SensorChart`, `TimeRangePicker`, `HeartbeatStatus`, `ErrorBanner`) and custom hooks (`useWeatherData`, `useTimeRange`, `useHeartbeat`)
- **Loading skeletons**: Shimmer/placeholder skeletons for cards and charts during initial load and time-range transitions

### Out of Scope
- Adding new sensor types or hardware changes
- Modifying Supabase schema or RLS policies
- Adding unit/integration test framework (no test runner installed — separate change)
- Server-side rendering or API routes (dashboard remains fully client-side)
- Mobile app or PWA conversion
- Historical data export/CSV download
- User authentication or multi-tenant support

## Approach

### Architecture Decision: Custom Hooks as Data Layer
Following the exploration analysis, the primary issue is that all data fetching, state management, realtime subscription, and business logic live in a single `Home` component. We extract three custom hooks:

| Hook | Responsibility |
|------|---------------|
| `useWeatherData(range)` | Fetches data for time range, handles aggregation, manages loading/error state, auto-retry |
| `useTimeRange()` | Manages selected range state, persists to `localStorage` |
| `useHeartbeat(latestTimestamp)` | Computes seconds since last reading, derives status (online/stale/offline) |

This separates concerns cleanly: hooks manage data/state, components handle rendering.

### Data Aggregation Strategy
For time ranges >1 hour, raw 30-second readings would overload the chart. We aggregate client-side:
- **5min**: Raw data (last ~10 records)
- **1h**: Raw data (last ~120 records — acceptable for Recharts)
- **24h**: Average every 15 minutes (~96 data points)
- **7d**: Average every 1 hour (~168 data points)

Aggregation uses `Array.reduce` to bucket records by time window and compute averages per bucket. This keeps all logic client-side — no API changes needed.

### Component Hierarchy (Post-Refactor)
```
app/page.tsx (orchestrator, ~40 lines)
├── DashboardHeader
│   ├── TimeRangePicker
│   └── HeartbeatStatus
├── ErrorBanner
├── SensorCard (×6)
│   ├── TrendArrow
│   └── MiniStats (min/max/avg)
├── SensorChart (×6) — pressure, light, sound added
└── SystemStatusSidebar
```

### Threshold Color System
A centralized `sensorThresholds` map in `lib/thresholds.ts` defines normal/warning/critical ranges per sensor. Cards and charts reference this for dynamic color coding:

```ts
export const sensorThresholds = {
  temperature:   { normal: [-5, 35], warning: [-10, 45], unit: '°C' },
  humidity:      { normal: [20, 80], warning: [5, 95], unit: '%' },
  pressure:      { normal: [1000, 1030], warning: [980, 1050], unit: 'hPa' },
  wind_speed:    { normal: [0, 30], warning: [0, 60], unit: 'km/h' },
  light_level:   { normal: [100, 50000], warning: [0, 100000], unit: 'lux' },
  sound_level:   { normal: [20, 70], warning: [10, 90], unit: 'dB' },
};
```

### Heartbeat Logic
The Supabase realtime subscription already delivers INSERT events. The `useHeartbeat` hook tracks the timestamp of the most recent reading and classifies:
- **Online** (green): last reading < 90 seconds ago
- **Stale** (yellow): last reading 90–300 seconds ago
- **Offline** (red): last reading > 300 seconds ago or connection error

Replaces the current static "Monitoreo en tiempo real activo" indicator with actual connection state.

### Error Handling & Retry
- Wrap Supabase queries in try/catch with typed error state
- On failure: show `ErrorBanner` with error message and "Reintentar" button
- Auto-retry: exponential backoff (1s → 2s → 4s → 8s, max 4 attempts)
- Realtime subscription: auto-reconnect on disconnect (Supabase handles this, but we surface the state)

## Affected Areas
| Module/Package | Impact | Description |
|----------------|--------|-------------|
| `app/page.tsx` | Modify | Refactor from ~300 lines to ~40 line orchestrator using extracted components |
| `components/WeatherCard.tsx` | Modify | Add trend arrow, min/max/avg stats, threshold color coding |
| `components/SensorChart.tsx` | New | Reusable chart component (extracted from inline charts in page.tsx) |
| `components/TimeRangePicker.tsx` | New | Time range selector UI (5min/1h/24h/7d) |
| `components/HeartbeatStatus.tsx` | New | Live connection status indicator with color-coded state |
| `components/ErrorBanner.tsx` | New | Error display with retry button |
| `components/LoadingSkeleton.tsx` | New | Shimmer skeleton for cards and charts |
| `components/SystemStatusSidebar.tsx` | New | Extracted sidebar with real heartbeat data |
| `hooks/useWeatherData.ts` | New | Data fetching, aggregation, retry logic |
| `hooks/useTimeRange.ts` | New | Time range state management with localStorage persistence |
| `hooks/useHeartbeat.ts` | New | Heartbeat detection and status computation |
| `lib/thresholds.ts` | New | Sensor threshold configuration map |
| `lib/supabase.ts` | Modify | Add error-aware query wrapper function |
| `types/weather.ts` | New | Shared TypeScript types (WeatherLog, TimeRange, SensorThreshold, etc.) |

## Capabilities

### New Capabilities
- **sensor-chart-pressure**: AreaChart visualization for atmospheric pressure with gradient fill
- **sensor-chart-light**: AreaChart visualization for ambient light level with gradient fill
- **sensor-chart-sound**: AreaChart visualization for sound level (dB) with gradient fill
- **trend-indicators**: Directional arrow (↑↓→) on each sensor card showing value change vs. previous period
- **sensor-statistics**: Min, max, and average values displayed on each sensor card for the selected time range
- **time-range-selector**: UI control to switch between 5min, 1h, 24h, 7d views with automatic data aggregation
- **data-aggregation**: Client-side bucketing and averaging for longer time ranges (15min buckets for 24h, 1hr buckets for 7d)
- **heartbeat-detection**: Real-time connection health monitoring based on seconds since last reading
- **threshold-color-coding**: Dynamic card/chart colors based on configurable normal/warning/critical ranges per sensor
- **error-recovery**: Auto-retry with exponential backoff on Supabase query failures, manual retry button
- **loading-skeletons**: Animated placeholder UI during initial load and time-range transitions

### Modified Capabilities
- **system-status-sidebar**: Replaces hardcoded static status with live heartbeat-driven indicators
- **realtime-subscription**: Enhanced to track connection state and surface errors (was fire-and-forget)
- **sensor-cards**: Enhanced with trend arrows, statistics, and threshold-based color coding (was value-only)
- **dashboard-layout**: Refactored from monolithic page.tsx into composable component tree

## Rollback Plan
1. **Git-based rollback**: All changes are file additions and modifications tracked by Git. Revert with `git checkout HEAD -- app/ components/ hooks/ lib/ types/`
2. **Preserve original page.tsx**: Before refactoring, copy `app/page.tsx` to `app/page.tsx.bak` as an emergency fallback
3. **Feature isolation**: Each new component and hook is a separate file — removing a feature is as simple as deleting its files and reverting imports
4. **No schema changes**: This proposal does not modify the Supabase schema, so no database rollback is needed
5. **Incremental deployment**: Components can be deployed incrementally — charts work independently of time-range selector, which works independently of heartbeat detection

## Risks
- **Client-side aggregation performance on 7d view** — Fetching 7 days of 30-second readings = ~20,160 records. Mitigation: Limit initial fetch to last 500 records for 7d view; add Supabase query with `created_at > now() - interval '7 days'` and aggregate server-side via SQL if needed
- **Recharts rendering with many data points** — >500 points may cause jank. Mitigation: Aggregation reduces 7d to ~168 points and 24h to ~96 points, well within Recharts' comfort zone
- **localStorage persistence for time range** — May fail in private browsing mode. Mitigation: Wrap localStorage access in try/catch, fall back to in-memory default
- **Threshold configuration accuracy** — Default thresholds may not match Sierra Hidalguense conditions (e.g., pressure at 2157m altitude is ~800 hPa, not sea-level 1013). Mitigation: Thresholds are centralized in `lib/thresholds.ts` for easy tuning; initial values calibrated for 2157m altitude
- **Breaking existing realtime behavior** — Refactoring the subscription logic could disrupt live updates. Mitigation: Keep the subscription mechanism identical; only wrap it in a hook for state management. Test realtime updates before and after
- **Increased bundle size** — Adding 8 new components + 3 hooks + 2 lib files. Mitigation: All components are small (<50 lines each); no new npm dependencies required

## Dependencies
- None — all changes use existing dependencies (Recharts, Framer Motion, Lucide, Supabase client)
- Requires Supabase realtime to be enabled on the `weather_logs` table (already configured)
- Requires `weather_logs` table to have data in `pressure`, `light_level`, `sound_level` columns (schema supports these; firmware already sends them)

## Implementation Phases

### Phase 1: Foundation (Types, Hooks, Thresholds)
- Create `types/weather.ts` with shared interfaces
- Create `lib/thresholds.ts` with sensor threshold configuration
- Create `hooks/useTimeRange.ts` — time range state + localStorage
- Create `hooks/useHeartbeat.ts` — heartbeat detection logic
- **Gate**: Hooks compile without errors, TypeScript checks pass

### Phase 2: Data Layer
- Create `hooks/useWeatherData.ts` — fetch, aggregate, retry, realtime subscription
- Modify `lib/supabase.ts` — add error-aware query wrapper
- **Gate**: Data loads correctly for all 4 time ranges, aggregation verified

### Phase 3: Component Extraction
- Create `components/SensorChart.tsx` — reusable chart (extract from page.tsx)
- Create `components/TimeRangePicker.tsx` — range selector UI
- Create `components/HeartbeatStatus.tsx` — live connection indicator
- Create `components/ErrorBanner.tsx` — error display + retry
- Create `components/LoadingSkeleton.tsx` — shimmer placeholders
- Create `components/SystemStatusSidebar.tsx` — extracted sidebar
- Modify `components/WeatherCard.tsx` — add trend, stats, threshold colors
- **Gate**: All components render correctly, existing visual design preserved

### Phase 4: Integration & Refactor
- Refactor `app/page.tsx` to use extracted components and hooks
- Wire up missing charts (pressure, light, sound) using `SensorChart`
- Integrate time range selector with all charts and cards
- Integrate heartbeat status in header and sidebar
- Add loading skeletons for all async states
- Add error banner with retry
- **Gate**: Full dashboard functional, all 6 charts render, all features working

### Phase 5: Polish & Verify
- Run `npx tsc --noEmit` — zero errors
- Run `npx eslint` — zero errors
- Verify realtime updates work across time range changes
- Verify threshold colors trigger correctly
- Verify heartbeat transitions (online → stale → offline)
- Manual QA: responsive layout, animations, tooltips
- **Gate**: Clean build, clean lint, manual QA pass
