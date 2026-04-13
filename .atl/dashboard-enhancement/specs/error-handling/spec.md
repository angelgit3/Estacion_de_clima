# Error Handling & State Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: Error State Management

The system SHALL maintain a typed error state throughout the data layer. Errors SHALL be represented as `string | null` where `null` indicates no error. Error messages SHALL be user-facing strings in Spanish (matching the dashboard's locale).

Error sources and their expected messages:
| Source                          | Message Pattern                                        |
|---------------------------------|--------------------------------------------------------|
| Supabase connection failure     | `"No se pudo conectar al servidor. Verifica tu conexión a internet."` |
| Supabase query error            | `"Error al obtener datos: {detailed message}"`          |
| Realtime subscription failure   | `"Error de conexión en tiempo real. Reconectando..."`   |
| localStorage failure            | (silent — no error shown to user)                       |
| Data parsing error              | `"Error al procesar los datos recibidos."`              |

#### Scenario: No error state on successful fetch

- GIVEN data is fetched successfully
- WHEN the hook completes
- THEN `error` is `null` and no ErrorBanner is rendered

#### Scenario: Connection failure produces user-friendly message

- GIVEN the Supabase URL is unreachable
- WHEN the fetch fails
- THEN `error` is `"No se pudo conectar al servidor. Verifica tu conexión a internet."`

#### Scenario: Query error includes detail

- GIVEN Supabase is reachable but the query fails (e.g., RLS denial)
- WHEN the fetch fails
- THEN `error` starts with `"Error al obtener datos: "` followed by the technical detail

#### Scenario: Realtime subscription error surfaces state

- GIVEN the realtime WebSocket disconnects unexpectedly
- WHEN the subscription error event fires
- THEN the error state reflects the disconnection and the heartbeat transitions to `'offline'`

### Requirement: ErrorBanner Display Logic

The system SHALL render the `ErrorBanner` component at the top of the dashboard (above the header) whenever `error` is non-null. The banner SHALL be positioned as `fixed top-0 left-0 right-0 z-50` and SHALL push the header content down via top padding or margin.

The banner SHALL NOT render when `error` is `null`.

#### Scenario: Error banner appears on fetch failure

- GIVEN a fetch fails and `error` is set
- WHEN the dashboard re-renders
- THEN the ErrorBanner is visible at the top of the page

#### Scenario: Error banner disappears on success

- GIVEN the ErrorBanner is visible
- WHEN a retry succeeds and `error` becomes `null`
- THEN the ErrorBanner is no longer rendered

#### Scenario: Error banner does not overlap header

- GIVEN the ErrorBanner is visible
- WHEN the page layout is inspected
- THEN the header content is positioned below the banner (not underneath it)

### Requirement: Auto-Retry with Exponential Backoff

The system SHALL implement automatic retry for failed Supabase queries in `useWeatherData` with the following backoff schedule:

| Attempt | Delay After Failure | Cumulative Time |
|---------|-------------------|-----------------|
| 1       | 1 second          | 1s              |
| 2       | 2 seconds         | 3s              |
| 3       | 4 seconds         | 7s              |
| 4       | 8 seconds         | 15s             |

After the 4th failed attempt, automatic retries SHALL stop and `error` SHALL remain set until a manual retry is triggered via `retry()`.

The retry counter SHALL reset when:
1. `timeRange` prop changes
2. `retry()` is called manually
3. A fetch succeeds

#### Scenario: Retry backoff sequence

- GIVEN the first fetch attempt fails
- WHEN automatic retries proceed
- THEN attempts occur at ~1s, ~3s, ~7s, and ~15s from initial failure

#### Scenario: Retry counter resets on time range change

- GIVEN 2 auto-retries have failed (next would be at 4s)
- WHEN `timeRange` changes from `'1h'` to `'24h'`
- THEN the retry counter resets and a new fetch begins (fresh attempt 1)

#### Scenario: Retry counter resets on success

- GIVEN 3 auto-retries have failed (next would be at 8s)
- WHEN the 4th attempt succeeds
- THEN the retry counter is reset to 0

#### Scenario: Manual retry after exhaustion

- GIVEN all 4 auto-retries have failed
- WHEN `retry()` is called
- THEN a new fetch sequence begins with fresh retry counter starting at 0

### Requirement: Supabase Error-Aware Query Wrapper

The system SHALL add a query wrapper function to `lib/supabase.ts` that wraps Supabase queries with typed error handling.

```ts
export async function safeQuery<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<{ data: T | null; error: string | null }>
```

The wrapper SHALL:
1. Await the query and catch any thrown exceptions
2. If `error` is returned from Supabase, format it as a user-facing string
3. If an exception is thrown, return a generic connection error message
4. Return `{ data, error }` in both cases

#### Scenario: Successful query passes data through

- GIVEN a query that returns `{ data: [...], error: null }`
- WHEN wrapped with `safeQuery`
- THEN the result is `{ data: [...], error: null }`

#### Scenario: Supabase error is formatted

- GIVEN a query that returns `{ data: null, error: { message: 'relation does not exist' } }`
- WHEN wrapped with `safeQuery`
- THEN the result is `{ data: null, error: "Error al obtener datos: relation does not exist" }`

#### Scenario: Network exception is caught

- GIVEN a query that throws a network error
- WHEN wrapped with `safeQuery`
- THEN the result is `{ data: null, error: "No se pudo conectar al servidor. Verifica tu conexión a internet." }`

### Requirement: Realtime Subscription Error Recovery

The system SHALL enhance the Supabase realtime subscription to track connection state and auto-recover from disconnections. The subscription SHALL:

1. Subscribe to `INSERT` events on `weather_logs` table
2. Listen for subscription `CHANNEL_ERROR`, `TIMED_OUT`, and `CLOSED` events
3. On error events, update heartbeat to `'offline'` and set appropriate error message
4. Supabase client handles reconnection automatically; on reconnection, process any missed data by re-fetching

#### Scenario: Subscription recovers after temporary disconnect

- GIVEN the realtime subscription loses connection
- WHEN Supabase auto-reconnects
- THEN the subscription resumes and a fresh data fetch fills any gaps

#### Scenario: Subscription error updates heartbeat

- GIVEN the realtime subscription fires a `CHANNEL_ERROR` event
- WHEN the error handler runs
- THEN the heartbeat status transitions to `'offline'`

### Requirement: Loading State Management

The system SHALL manage loading state across three distinct scenarios:

1. **Initial load**: `loading: true` on component mount until first data fetch completes
2. **Time range transition**: `loading: true` when `timeRange` changes until new data is fetched
3. **Realtime update**: `loading: false` — realtime updates do NOT trigger loading state

Loading state SHALL be independent of error state. A transition can have both `loading: true` and `error: null` during an in-progress fetch.

#### Scenario: Initial load shows skeletons

- GIVEN the dashboard mounts
- WHEN data has not yet been fetched
- THEN all sensor cards show loading skeletons and `loading` is `true`

#### Scenario: Time range change shows skeletons

- GIVEN data is loaded for `'1h'`
- WHEN user switches to `'7d'`
- THEN `loading` becomes `true` and skeletons are shown during the fetch

#### Scenario: Realtime update does not show loading

- GIVEN data is loaded and `loading` is `false`
- WHEN a realtime INSERT event arrives
- THEN `loading` remains `false` (no loading flash)

#### Scenario: Loading clears on fetch completion

- GIVEN `loading: true` during a fetch
- WHEN the fetch completes (success or failure)
- THEN `loading` becomes `false`

### Requirement: Page.tsx Orchestrator Pattern

The system SHALL refactor `app/page.tsx` to serve as a thin orchestrator (~40 lines) that:
1. Calls hooks for data, time range, and heartbeat
2. Passes hook results to extracted components
3. Contains no direct Supabase calls, no inline chart definitions, no embedded state logic

The orchestrator SHALL NOT contain:
- Direct `useState` for data arrays (use `useWeatherData`)
- Direct `useEffect` for Supabase subscriptions (use `useWeatherData`)
- Inline `<AreaChart>` definitions (use `SensorChart`)
- Static status indicators (use `HeartbeatStatus`)

#### Scenario: Page.tsx is under 60 lines

- GIVEN the refactored page.tsx
- WHEN line count is measured
- THEN it contains fewer than 60 lines (excluding imports and blank lines)

#### Scenario: Page.tsx has no direct Supabase calls

- GIVEN the refactored page.tsx
- WHEN searched for `supabase`, `.from(`, or `.channel(`
- THEN no matches are found (all data access is through hooks)

#### Scenario: All six charts render via SensorChart

- GIVEN the refactored page.tsx
- WHEN rendered
- THEN all six sensor charts are rendered using the `SensorChart` component

#### Scenario: Error state propagates to ErrorBanner

- GIVEN `useWeatherData` returns an error
- WHEN page.tsx renders
- THEN `ErrorBanner` receives the error message and retry callback
