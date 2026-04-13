# Thresholds Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: Sensor Threshold Configuration Map

The system SHALL provide a centralized `sensorThresholds` configuration object in `lib/thresholds.ts` that defines normal, warning, and critical ranges for all six sensor types. The configuration SHALL use the `SensorThreshold` interface from `types/weather.ts`.

```ts
export const sensorThresholds: Record<keyof typeof SENSORS[number]['key'], SensorThreshold> = {
  temperature: {
    normal: [-5, 35],
    warning: [-10, 45],
    unit: '°C',
  },
  humidity: {
    normal: [20, 80],
    warning: [5, 95],
    unit: '%',
  },
  pressure: {
    normal: [780, 820],       // Calibrated for ~2157m altitude (Sierra Hidalguense)
    warning: [760, 840],
    unit: 'hPa',
  },
  wind_speed: {
    normal: [0, 30],
    warning: [0, 60],
    unit: 'km/h',
  },
  light_level: {
    normal: [100, 50000],
    warning: [0, 100000],
    unit: 'lux',
  },
  sound_level: {
    normal: [20, 70],
    warning: [10, 90],
    unit: 'dB',
  },
};
```

Pressure values SHALL be calibrated for the station's altitude of approximately 2157 meters above sea level, where atmospheric pressure averages ~800 hPa instead of sea-level 1013 hPa.

#### Scenario: All six sensors have threshold definitions

- GIVEN the `sensorThresholds` object
- WHEN inspected
- THEN it contains entries for: `temperature`, `humidity`, `pressure`, `wind_speed`, `light_level`, `sound_level`

#### Scenario: Pressure threshold is altitude-adjusted

- GIVEN the `sensorThresholds.pressure` entry
- WHEN inspected
- THEN `normal` range is `[780, 820]` (not sea-level `[1000, 1030]`)

#### Scenario: Each threshold entry has all required fields

- GIVEN any entry in `sensorThresholds`
- WHEN inspected
- THEN it contains `normal` (tuple), `warning` (tuple), and `unit` (string)

### Requirement: Threshold Level Classification Function

The system SHALL provide a `classifyThreshold(sensorKey, value)` function in `lib/thresholds.ts` that returns the `ThresholdLevel` for a given sensor reading.

```ts
export function classifyThreshold(
  sensorKey: SensorMetadata['key'],
  value: number | null
): ThresholdLevel;
```

Classification rules:
1. If `value` is `null`, return `'normal'` (no classification possible)
2. If `value` is within `normal` range (inclusive), return `'normal'`
3. If `value` is within `warning` range (inclusive) but outside `normal`, return `'warning'`
4. If `value` is outside `warning` range, return `'critical'`

Range check is inclusive: `normal[0] <= value <= normal[1]`.

#### Scenario: Temperature within normal range

- GIVEN `classifyThreshold('temperature', 22)`
- WHEN evaluated
- THEN it returns `'normal'` (22 is between -5 and 35)

#### Scenario: Temperature at upper normal boundary

- GIVEN `classifyThreshold('temperature', 35)`
- WHEN evaluated
- THEN it returns `'normal'` (boundary is inclusive)

#### Scenario: Temperature at upper warning boundary

- GIVEN `classifyThreshold('temperature', 45)`
- WHEN evaluated
- THEN it returns `'warning'` (45 is between 35 and 45, outside normal but within warning)

#### Scenario: Temperature above warning range

- GIVEN `classifyThreshold('temperature', 50)`
- WHEN evaluated
- THEN it returns `'critical'` (50 exceeds warning max of 45)

#### Scenario: Temperature below warning range

- GIVEN `classifyThreshold('temperature', -15)`
- WHEN evaluated
- THEN it returns `'critical'` (-15 is below warning min of -10)

#### Scenario: Null value returns normal

- GIVEN `classifyThreshold('temperature', null)`
- WHEN evaluated
- THEN it returns `'normal'`

#### Scenario: Pressure at altitude-appropriate normal

- GIVEN `classifyThreshold('pressure', 800)`
- WHEN evaluated
- THEN it returns `'normal'` (800 is between 780 and 820)

#### Scenario: Humidity at low boundary

- GIVEN `classifyThreshold('humidity', 15)`
- WHEN evaluated
- THEN it returns `'warning'` (15 is below normal min of 20 but above warning min of 5)

#### Scenario: Sound level at upper warning boundary

- GIVEN `classifyThreshold('sound_level', 85)`
- WHEN evaluated
- THEN it returns `'warning'` (85 is between 70 and 90)

### Requirement: Threshold Color Mapping

The system SHALL provide a `getThresholdColor(level)` function that maps a `ThresholdLevel` to a visual color value for use in component styling.

```ts
export function getThresholdColor(level: ThresholdLevel): string;
```

Color mapping:
| Level       | Hex Color | Tailwind Equivalent |
|-------------|-----------|---------------------|
| `'normal'`  | `'#1e293b'` | `text-slate-800` |
| `'warning'` | `'#f97316'` | `text-orange-500` |
| `'critical'`| `'#dc2626'` | `text-red-600`   |

#### Scenario: Normal returns slate color

- GIVEN `getThresholdColor('normal')`
- WHEN called
- THEN it returns `'#1e293b'`

#### Scenario: Warning returns orange color

- GIVEN `getThresholdColor('warning')`
- WHEN called
- THEN it returns `'#f97316'`

#### Scenario: Critical returns red color

- GIVEN `getThresholdColor('critical')`
- WHEN called
- THEN it returns `'#dc2626'`

### Requirement: Threshold-Driven Card Color Application

The system SHALL apply threshold-based coloring to sensor card value text by calling `classifyThreshold` with the current sensor value and using `getThresholdColor` for the text color style.

The coloring SHALL apply only to the numeric value text element, NOT to the card title, unit, icon, or background gradient.

#### Scenario: Card value color updates on threshold change

- GIVEN a temperature card currently showing 22°C (normal, slate color)
- WHEN the value updates to 42°C (warning)
- THEN the value text color changes from slate to orange

#### Scenario: Card retains gradient regardless of threshold

- GIVEN a temperature card with `gradient: "from-orange-400 to-rose-500"`
- WHEN the value enters critical threshold
- THEN the icon gradient background remains unchanged (only value text color changes)

### Requirement: Threshold Configuration Extensibility

The system SHALL design the threshold configuration so that adding or modifying thresholds requires changes only to `lib/thresholds.ts`. Components SHALL NOT hardcode threshold values — they SHALL always reference the centralized configuration.

#### Scenario: Changing a threshold affects all consumers

- GIVEN the temperature `normal` range is changed from `[-5, 35]` to `[0, 30]` in `lib/thresholds.ts`
- WHEN the dashboard re-renders
- THEN all sensor cards use the new range for classification without code changes

#### Scenario: Adding a new sensor requires only threshold config update

- GIVEN a new sensor type is added to the dashboard
- WHEN its threshold entry is added to `sensorThresholds`
- THEN the `classifyThreshold` function works for the new sensor without modification
