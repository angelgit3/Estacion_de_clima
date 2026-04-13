# Components Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: SensorCard Component (Modified)

The system SHALL modify `components/WeatherCard.tsx` (renamed conceptually to `SensorCard`) to accept extended props including trend indicators, statistics, threshold-based coloring, and null handling. The component SHALL maintain backward compatibility with existing props while adding new optional fields.

```ts
interface SensorCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
  thresholdLevel?: ThresholdLevel;  // NEW: 'normal' | 'warning' | 'critical'
  statistics?: SensorStatistics;     // NEW: { min, max, avg, trend, trendDelta }
}
```

The card SHALL display:
1. Current value with threshold-based text color (blue/green/orange/red per `thresholdLevel`)
2. Trend arrow (↑ green, ↓ blue, → gray) when `statistics.trend` is not null
3. Mini statistics bar showing min/max/avg below the main value when `statistics` is provided
4. Loading state with skeleton placeholder when `loading` is `true`

Threshold color mapping for value text:
| Level       | Tailwind Class             | Visual  |
|-------------|---------------------------|---------|
| `'normal'`  | `text-slate-800`          | Default |
| `'warning'` | `text-orange-500`         | Orange  |
| `'critical'`| `text-red-600`            | Red     |
| `'null'`    | `text-slate-800`          | Default |

#### Scenario: Card displays value with normal threshold

- GIVEN `value: 22`, `unit: '°C'`, `thresholdLevel: 'normal'`
- WHEN the card renders
- THEN the value text uses `text-slate-800` color (default)

#### Scenario: Card displays value with warning threshold

- GIVEN `value: 42`, `unit: '°C'`, `thresholdLevel: 'warning'`
- WHEN the card renders
- THEN the value text uses `text-orange-500` color

#### Scenario: Card displays value with critical threshold

- GIVEN `value: 55`, `unit: '°C'`, `thresholdLevel: 'critical'`
- WHEN the card renders
- THEN the value text uses `text-red-600` color

#### Scenario: Card shows upward trend arrow

- GIVEN `statistics: { trend: 'up', trendDelta: 4, ... }`
- WHEN the card renders
- THEN a green upward arrow (↑) is displayed next to the value

#### Scenario: Card shows downward trend arrow

- GIVEN `statistics: { trend: 'down', trendDelta: 3, ... }`
- WHEN the card renders
- THEN a blue downward arrow (↓) is displayed next to the value

#### Scenario: Card shows stable trend indicator

- GIVEN `statistics: { trend: 'stable', trendDelta: 0, ... }`
- WHEN the card renders
- THEN a gray horizontal arrow (→) is displayed

#### Scenario: Card hides trend when null

- GIVEN `statistics: { trend: null, ... }`
- WHEN the card renders
- THEN no trend arrow is displayed

#### Scenario: Card shows mini statistics bar

- GIVEN `statistics: { min: 15, max: 28, avg: 22.5, ... }`
- WHEN the card renders
- THEN a bar below the value shows "Min: 15  Max: 28  Avg: 22.5" in small muted text

#### Scenario: Card hides statistics when not provided

- GIVEN no `statistics` prop
- WHEN the card renders
- THEN no statistics bar is displayed

#### Scenario: Null value displays as "--"

- GIVEN `value: null` and `loading: false`
- WHEN the card renders
- THEN the display value shows `"--"`

#### Scenario: Loading state shows placeholder

- GIVEN `loading: true`
- WHEN the card renders
- THEN the value shows `"..."` or a skeleton animation

### Requirement: SensorChart Component

The system SHALL provide a new `components/SensorChart.tsx` reusable chart component that renders a Recharts `AreaChart` for any sensor metric with configurable styling.

```ts
interface SensorChartProps {
  data: WeatherLog[] | ChartDataPoint[];
  sensor: SensorMetadata;
  title?: string;
  height?: number;       // Default: 260
  loading?: boolean;
  className?: string;
}
```

The component SHALL render:
1. A card container matching existing dashboard style (`rounded-3xl bg-white/70 backdrop-blur-md`)
2. A title header with the sensor's Lucide icon
3. A `ResponsiveContainer` wrapping an `AreaChart` with `monotone` interpolation
4. A `<linearGradient>` definition using the sensor's `gradientStops`
5. `CartesianGrid` with `strokeDasharray="3 3"`, `stroke="#e2e8f0"`, `vertical={false}`
6. `XAxis` with `tickFormatter` using `formatTime`, `stroke="#94a3b8"`, `fontSize={11}`, `tickLine={false}`
7. `YAxis` with `stroke="#94a3b8"`, `fontSize={11}`, `orientation="right"`, `tickLine={false}`
8. `Tooltip` with glass-morphism styling matching existing design
9. A single `<Area>` with the sensor's `chartColor` and gradient fill

When `loading` is `true`, the component SHALL render a `LoadingSkeleton` instead of the chart.

#### Scenario: Temperature chart renders with correct styling

- GIVEN `data` contains 50 temperature records and `sensor` is the temperature metadata
- WHEN the component renders
- THEN an AreaChart with orange gradient fill (`#f97316`) and `dataKey="temperature"` is displayed

#### Scenario: Pressure chart renders with correct data key

- GIVEN `data` contains pressure records and `sensor.key` is `'pressure'`
- WHEN the component renders
- THEN the `<Area>` uses `dataKey="pressure"` and green color (`#10b981`)

#### Scenario: Loading state shows skeleton

- GIVEN `loading: true`
- WHEN the component renders
- THEN a skeleton placeholder is shown instead of the chart area

#### Scenario: Custom height overrides default

- GIVEN `height: 320`
- WHEN the component renders
- THEN the chart container height is `320px` instead of the default `260px`

#### Scenario: Custom title overrides sensor label

- GIVEN `title: "Presión Atmosférica"` and `sensor.label` is `"Presión"`
- WHEN the component renders
- THEN the header displays "Presión Atmosférica"

#### Scenario: Tooltip formats value with correct unit

- GIVEN a data point with `pressure: 1013.25` and `sensor.unit` is `'hPa'`
- WHEN the tooltip is triggered
- THEN it displays `"1013.2 hPa"` (one decimal place + unit)

#### Scenario: XAxis formats timestamps correctly

- GIVEN a data point with `created_at: "2026-04-12T14:30:00Z"`
- WHEN the XAxis renders the tick
- THEN it displays `"14:30"` (hours:minutes in `es-AR` locale)

### Requirement: TimeRangePicker Component

The system SHALL provide a new `components/TimeRangePicker.tsx` component that renders a segmented control for selecting between the four supported time ranges.

```ts
interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  configs: Record<TimeRange, TimeRangeConfig>;
}
```

The component SHALL render four pill-shaped buttons labeled "5 min", "1 h", "24 h", "7 d". The active button SHALL have a filled background (`bg-sky-500 text-white`). Inactive buttons SHALL have a subtle background (`bg-white/50 text-slate-500`).

#### Scenario: Renders all four time range options

- GIVEN the component renders
- WHEN inspected
- THEN four buttons are visible with labels "5 min", "1 h", "24 h", "7 d"

#### Scenario: Active range is visually highlighted

- GIVEN `value: '24h'`
- WHEN the component renders
- THEN the "24 h" button has `bg-sky-500` and white text

#### Scenario: Clicking a different range triggers onChange

- GIVEN `value: '1h'`
- WHEN the user clicks the "7 d" button
- THEN `onChange('7d')` is called

#### Scenario: Clicking the active range does not trigger onChange

- GIVEN `value: '1h'`
- WHEN the user clicks the "1 h" button (already active)
- THEN `onChange` is NOT called

### Requirement: HeartbeatStatus Component

The system SHALL provide a new `components/HeartbeatStatus.tsx` component that displays the real-time connection health indicator.

```ts
interface HeartbeatStatusProps {
  heartbeat: HeartbeatInfo;
  compact?: boolean;  // For header bar vs. sidebar display
}
```

The component SHALL render:
1. A colored dot indicator (green/yellow/red based on status)
2. A status label: "En línea" / "Datos antiguos" / "Sin conexión"
3. In non-compact mode: the seconds since last reading

Status display mapping:
| Status     | Dot Color       | Label              | Animation       |
|------------|-----------------|--------------------|-----------------|
| `'online'` | `bg-emerald-500`| "En línea"        | `animate-pulse` |
| `'stale'`  | `bg-yellow-500` | "Datos antiguos"  | None            |
| `'offline'`| `bg-red-500`    | "Sin conexión"    | `animate-pulse` |

#### Scenario: Online status displays green pulsing dot

- GIVEN `heartbeat: { status: 'online', secondsSinceLastReading: 30, ... }`
- WHEN the component renders
- THEN a green dot with `animate-pulse` and "En línea" label is shown

#### Scenario: Stale status displays yellow dot without animation

- GIVEN `heartbeat: { status: 'stale', secondsSinceLastReading: 150, ... }`
- WHEN the component renders
- THEN a yellow dot without animation and "Datos antiguos" label is shown

#### Scenario: Offline status displays red pulsing dot

- GIVEN `heartbeat: { status: 'offline', secondsSinceLastReading: 600, ... }`
- WHEN the component renders
- THEN a red dot with `animate-pulse` and "Sin conexión" label is shown

#### Scenario: Compact mode hides seconds counter

- GIVEN `compact: true`
- WHEN the component renders
- THEN only the dot and label are shown (no "hace X segundos" text)

#### Scenario: Non-compact mode shows seconds

- GIVEN `compact: false` and `secondsSinceLastReading: 45`
- WHEN the component renders
- THEN "hace 45 s" or equivalent is displayed

### Requirement: ErrorBanner Component

The system SHALL provide a new `components/ErrorBanner.tsx` component that displays error messages with a retry button.

```ts
interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onDismiss?: () => void;
}
```

The component SHALL render:
1. A full-width banner at the top of the dashboard (`fixed top-0 left-0 right-0 z-50`)
2. A red gradient background (`from-red-500 via-red-600 to-red-500`)
3. An error icon (AlertTriangle from lucide-react)
4. The error message text
5. A "Reintentar" button that calls `onRetry`
6. An optional dismiss button if `onDismiss` is provided

#### Scenario: Banner displays error message

- GIVEN `message: "No se pudo conectar al servidor"`
- WHEN the component renders
- THEN the error text is visible in the banner

#### Scenario: Retry button triggers callback

- GIVEN the banner is visible
- WHEN the user clicks "Reintentar"
- THEN `onRetry()` is called

#### Scenario: Dismiss button hides banner

- GIVEN `onDismiss` is provided
- WHEN the user clicks the dismiss button
- THEN `onDismiss()` is called

#### Scenario: No dismiss button when onDismiss is not provided

- GIVEN `onDismiss` is `undefined`
- WHEN the component renders
- THEN no dismiss button is shown

### Requirement: LoadingSkeleton Component

The system SHALL provide a new `components/LoadingSkeleton.tsx` component that renders animated placeholder UI.

```ts
interface LoadingSkeletonProps {
  variant: 'card' | 'chart';
  count?: number;  // For card variant: how many skeletons to render
  className?: string;
}
```

The skeleton SHALL use a shimmer animation effect (CSS `@keyframes` or Framer Motion) with a gradient sweep animation. Card skeleton SHALL match WeatherCard dimensions. Chart skeleton SHALL match chart container dimensions.

#### Scenario: Card skeleton renders correct count

- GIVEN `variant: 'card'` and `count: 6`
- WHEN the component renders
- THEN 6 card-shaped skeleton placeholders are displayed

#### Scenario: Chart skeleton renders full-width placeholder

- GIVEN `variant: 'chart'`
- WHEN the component renders
- THEN a single wide skeleton matching chart dimensions is displayed

#### Scenario: Shimmer animation is visible

- GIVEN the component renders
- WHEN observed for 2 seconds
- THEN a sweeping light-to-dark gradient animation is visible on the skeleton

### Requirement: SystemStatusSidebar Component (Modified)

The system SHALL provide a new `components/SystemStatusSidebar.tsx` component that replaces the hardcoded sidebar in `page.tsx` with live heartbeat-driven indicators.

```ts
interface SystemStatusSidebarProps {
  heartbeat: HeartbeatInfo;
  alertActive: boolean;
  onDismissAlert?: () => void;
  latestLightLevel: number | null;
}
```

The sidebar SHALL display:
1. Microcontroller status driven by `heartbeat.status` (not hardcoded "ESP32 Online")
2. MPU6500 IMU integrity status (derived from `alertActive`)
3. Light level day/night indicator (based on `latestLightLevel > 1500`)
4. Alert indicator with pulsing red dot when `alertActive` is `true`

#### Scenario: Sidebar shows ESP32 status from heartbeat

- GIVEN `heartbeat.status: 'online'`
- WHEN the sidebar renders
- THEN the microcontroller line shows a green "ESP32 Online" badge

#### Scenario: Sidebar shows stale ESP32 status

- GIVEN `heartbeat.status: 'stale'`
- WHEN the sidebar renders
- THEN the microcontroller line shows a yellow "ESP32 Stale" badge

#### Scenario: Sidebar shows offline ESP32 status

- GIVEN `heartbeat.status: 'offline'`
- WHEN the sidebar renders
- THEN the microcontroller line shows a red "ESP32 Offline" badge

#### Scenario: Day/night indicator shows day

- GIVEN `latestLightLevel: 25000`
- WHEN the sidebar renders
- THEN the photoresistor line shows "☀️ Día"

#### Scenario: Day/night indicator shows night

- GIVEN `latestLightLevel: 500`
- WHEN the sidebar renders
- THEN the photoresistor line shows "🌙 Noche"

## MODIFIED Requirements

### Requirement: DashboardHeader

(Previously: Header was inline HTML in page.tsx with static status text)

The system SHALL extract the dashboard header into a composable section within `app/page.tsx` that includes:
1. The gradient title "Estación Meteorológica Pro"
2. A `HeartbeatStatus` component replacing the static "Monitoreo en tiempo real activo" text
3. A `TimeRangePicker` component aligned to the right

#### Scenario: Header shows live heartbeat instead of static text

- GIVEN the dashboard renders
- WHEN the header section is inspected
- THEN a `HeartbeatStatus` component with current connection state replaces the static green dot

#### Scenario: Header layout is responsive

- GIVEN the viewport is narrow (mobile)
- WHEN the header renders
- THEN the title, heartbeat, and time range picker stack vertically
