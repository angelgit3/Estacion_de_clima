# Chart Specification — dashboard-enhancement

## ADDED Requirements

### Requirement: Pressure Chart

The system SHALL render an AreaChart visualization for atmospheric pressure data. The chart SHALL use the `SensorChart` component with the pressure sensor metadata.

Chart configuration:
- `dataKey`: `"pressure"`
- `chartColor`: `"#10b981"` (emerald)
- `gradientId`: `"gradPres"`
- Gradient stops: 5% opacity 0.35 → 95% opacity 0.02
- `title`: "Tendencia de Presión"
- `icon`: `Gauge` from lucide-react

#### Scenario: Pressure chart renders with gradient fill

- GIVEN pressure data with 50 records
- WHEN the chart renders
- THEN an emerald-green AreaChart with gradient fill is displayed

#### Scenario: Pressure chart handles null values

- GIVEN a dataset where some `pressure` values are `null`
- WHEN the chart renders
- THEN the line connects only valid data points without breaking

#### Scenario: Pressure chart YAxis scales to data range

- GIVEN pressure values ranging from 790 to 820 hPa (altitude-adjusted)
- WHEN the chart renders
- THEN the YAxis domain encompasses the full data range with appropriate padding

### Requirement: Light Level Chart

The system SHALL render an AreaChart visualization for ambient light level data. The chart SHALL use the `SensorChart` component with the light level sensor metadata.

Chart configuration:
- `dataKey`: `"light_level"`
- `chartColor`: `"#f59e0b"` (amber)
- `gradientId`: `"gradLight"`
- Gradient stops: 5% opacity 0.35 → 95% opacity 0.02
- `title`: "Tendencia de Luz"
- `icon`: `Sun` from lucide-react

#### Scenario: Light chart renders with amber gradient fill

- GIVEN light level data with 50 records
- WHEN the chart renders
- THEN an amber AreaChart with gradient fill is displayed

#### Scenario: Light chart shows day/night transition

- GIVEN data spanning sunset (values dropping from 30000 to 200 lux)
- WHEN the chart renders
- THEN the area chart shows a descending curve from high to low values

#### Scenario: Light chart handles wide value range

- GIVEN values from 0 to 100000 lux
- WHEN the chart renders
- THEN the YAxis scales to accommodate the full range

### Requirement: Sound Level Chart

The system SHALL render an AreaChart visualization for sound level data (decibels). The chart SHALL use the `SensorChart` component with the sound level sensor metadata.

Chart configuration:
- `dataKey`: `"sound_level"`
- `chartColor`: `"#ec4899"` (pink)
- `gradientId`: `"gradSound"`
- Gradient stops: 5% opacity 0.35 → 95% opacity 0.02
- `title`: "Tendencia de Sonido"
- `icon`: `Mic` from lucide-react

#### Scenario: Sound chart renders with pink gradient fill

- GIVEN sound level data with 50 records
- WHEN the chart renders
- THEN a pink AreaChart with gradient fill is displayed

#### Scenario: Sound chart tooltip shows correct format

- GIVEN a data point with `sound_level: 65.3`
- WHEN the tooltip is triggered
- THEN it displays `"65.3 dB"` with the label "Sonido"

#### Scenario: Sound chart handles quiet environment

- GIVEN values ranging from 20 to 40 dB
- WHEN the chart renders
- THEN the YAxis scales appropriately for the low range

### Requirement: Temperature Chart (Modified)

(Previously: Inline AreaChart directly in page.tsx)

The system SHALL replace the inline temperature chart in `page.tsx` with the `SensorChart` component, preserving exact visual appearance.

#### Scenario: Temperature chart appearance is unchanged

- GIVEN the refactored chart renders
- WHEN compared to the original inline chart
- THEN the visual appearance (colors, gradients, grid, tooltip) is identical

### Requirement: Humidity Chart (Modified)

(Previously: Inline AreaChart directly in page.tsx)

The system SHALL replace the inline humidity chart in `page.tsx` with the `SensorChart` component, preserving exact visual appearance.

#### Scenario: Humidity chart appearance is unchanged

- GIVEN the refactored chart renders
- WHEN compared to the original inline chart
- THEN the visual appearance (colors, gradients, grid, tooltip) is identical

### Requirement: Wind Speed Chart (Modified)

(Previously: Inline AreaChart directly in page.tsx)

The system SHALL replace the inline wind speed chart in `page.tsx` with the `SensorChart` component, preserving exact visual appearance.

#### Scenario: Wind chart appearance is unchanged

- GIVEN the refactored chart renders
- WHEN compared to the original inline chart
- THEN the visual appearance (colors, gradients, grid, tooltip) is identical

### Requirement: Chart Data Filtering

The system SHALL filter out records with `null` values for the specific sensor being charted before passing data to Recharts. This prevents rendering artifacts from null data points.

For each chart, only records where the sensor's `dataKey` value is non-null SHALL be included.

#### Scenario: Null temperature records are excluded from temperature chart

- GIVEN data array contains 50 records where 5 have `temperature: null`
- WHEN the temperature chart is rendered
- THEN only 45 data points are passed to the AreaChart

#### Scenario: Mixed nulls across different sensors

- GIVEN a record with `temperature: 22` but `pressure: null`
- WHEN the temperature chart and pressure chart render
- THEN the record IS included in the temperature chart but NOT in the pressure chart

### Requirement: Chart Grid Layout

The system SHALL arrange all six sensor charts in a responsive grid layout within the dashboard. The layout SHALL follow a 3-column grid on large screens where the first chart (temperature) spans 2 columns, followed by the sidebar, then subsequent charts in 2-column spans.

Chart order:
1. Temperature (2-col) | Sidebar (1-col)
2. Humidity (2-col)
3. Wind (1-col)
4. Pressure (2-col)
5. Light (1-col) | Sound (1-col)

On medium screens: all charts stack in single-column layout.
On small screens: same as medium, with reduced chart height.

#### Scenario: Desktop grid shows 3-column layout

- GIVEN viewport width >= 1024px
- WHEN charts render
- THEN temperature chart spans columns 1-2, sidebar is in column 3

#### Scenario: Mobile layout stacks all charts

- GIVEN viewport width < 768px
- WHEN charts render
- THEN all charts stack vertically in single-column layout

### Requirement: Chart Tooltip Styling

The system SHALL apply consistent glass-morphism tooltip styling across all sensor charts. The tooltip SHALL match the existing design from page.tsx.

```
contentStyle: {
  backgroundColor: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  color: '#1e293b',
  fontSize: '13px'
}
```

#### Scenario: Tooltip shows formatted timestamp

- GIVEN a data point with `created_at: "2026-04-12T10:15:00Z"`
- WHEN the tooltip renders
- THEN the label displays `"10:15"` (formatted via `formatTime`)

#### Scenario: Tooltip shows value with unit

- GIVEN a humidity value of `72.5`
- WHEN the tooltip renders for the humidity chart
- THEN the value displays `"72.5 %"` with label "Humedad"
