"use client";
import {
  Thermometer, Wind, Droplets, Gauge,
  Sun, Mic, Sparkles, AlertTriangle, Activity
} from "lucide-react";
import { TimeRange } from "@/lib/types";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { calculateSensorStatistics } from "@/lib/statistics";
import WeatherCard from "@/components/WeatherCard";
import SensorChart from "@/components/SensorChart";
import TimeRangePicker from "@/components/TimeRangePicker";
import SystemStatusSidebar from "@/components/SystemStatusSidebar";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// ============================================================
// Sensor Configuration
// ============================================================
const SENSORS = [
  {
    key: 'temperature' as const,
    title: 'Temperatura',
    unit: '°C',
    icon: Thermometer,
    gradient: 'from-orange-400 to-rose-500',
    strokeColor: '#f97316',
    gradientId: 'gradTemp',
    chartIconColor: 'text-amber-500',
  },
  {
    key: 'humidity' as const,
    title: 'Humedad',
    unit: '%',
    icon: Droplets,
    gradient: 'from-sky-400 to-blue-500',
    strokeColor: '#0ea5e9',
    gradientId: 'gradHum',
    chartIconColor: 'text-sky-500',
  },
  {
    key: 'pressure' as const,
    title: 'Presión',
    unit: 'hPa',
    icon: Gauge,
    gradient: 'from-emerald-400 to-teal-500',
    strokeColor: '#10b981',
    gradientId: 'gradPressure',
    chartIconColor: 'text-emerald-500',
  },
  {
    key: 'wind_speed' as const,
    title: 'Viento',
    unit: 'km/h',
    icon: Wind,
    gradient: 'from-violet-400 to-purple-500',
    strokeColor: '#8b5cf6',
    gradientId: 'gradWind',
    chartIconColor: 'text-violet-500',
  },
  {
    key: 'light_level' as const,
    title: 'Luz',
    unit: 'ADC',
    icon: Sun,
    gradient: 'from-amber-400 to-yellow-500',
    strokeColor: '#f59e0b',
    gradientId: 'gradLight',
    chartIconColor: 'text-amber-500',
  },
  {
    key: 'sound_level' as const,
    title: 'Sonido',
    unit: 'dB',
    icon: Mic,
    gradient: 'from-pink-400 to-fuchsia-500',
    strokeColor: '#ec4899',
    gradientId: 'gradSound',
    chartIconColor: 'text-pink-500',
  },
];

// ============================================================
// Main Page - Dashboard Orchestrator
// ============================================================
export default function Home() {
  // Time range management
  const { timeRange, setTimeRange, config } = useTimeRange();

  // Weather data fetching with realtime
  const { data, latest, loading, error, hasAlert, retry } = useWeatherData(config);

  // Heartbeat monitoring
  const heartbeat = useHeartbeat(latest);

  // Alert dismissal
  const dismissAlert = () => {
    // Local state only - alert will reappear if new alert data arrives
    window.location.reload();
  };

  // Calculate statistics for each sensor
  const stats = SENSORS.map((sensor) => ({
    key: sensor.key,
    stats: calculateSensorStatistics(data, sensor.key),
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 text-slate-800 p-6 md:p-10 font-sans">
      {/* Error Banner */}
      <ErrorBanner error={error} onRetry={retry} />

      {/* Alert Banner */}
      {hasAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-pulse">
          <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-500 text-white px-6 py-3 shadow-lg shadow-red-500/30 flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">
              ⚠ ALERTA DE INTEGRIDAD — Se detectó una sacudida o inclinación brusca en la estación
            </span>
            <button
              onClick={dismissAlert}
              className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Estación Meteorológica Pro
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Monitoreo en tiempo real activo
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Time Range Picker */}
            <TimeRangePicker
              currentTimeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />

            {/* Last update */}
            {latest && !loading && (
              <span className="text-xs text-slate-400 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50">
                Última lectura: {new Date(latest.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Loading State */}
      {loading && data.length === 0 ? (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
            <LoadingSkeleton type="card" count={6} />
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LoadingSkeleton type="chart" />
            </div>
            <LoadingSkeleton type="sidebar" />
          </div>
        </>
      ) : (
        <>
          {/* Sensor Cards */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
            {SENSORS.map((sensor) => {
              const sensorStats = stats.find((s) => s.key === sensor.key)?.stats;
              return (
                <WeatherCard
                  key={sensor.key}
                  title={sensor.title}
                  value={latest?.[sensor.key] ?? "--"}
                  unit={sensor.unit}
                  icon={sensor.icon}
                  gradient={sensor.gradient}
                  loading={loading}
                  stats={sensorStats}
                  sensorKey={sensor.key}
                />
              );
            })}
          </div>

          {/* Charts + Sidebar */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Temperature Chart */}
            <div className="lg:col-span-2">
              <SensorChart
                title="Tendencia de Temperatura"
                icon={Sparkles}
                iconColor="text-amber-500"
                data={data}
                dataKey="temperature"
                strokeColor="#f97316"
                gradientId="gradTemp"
                unit="°C"
                label="Temperatura"
              />
            </div>

            {/* System Status Sidebar */}
            <SystemStatusSidebar
              heartbeat={heartbeat}
              latestLog={latest}
              alertActive={hasAlert}
              onAlertDismiss={dismissAlert}
            />

            {/* Humidity Chart */}
            <div className="lg:col-span-2">
              <SensorChart
                title="Tendencia de Humedad"
                icon={Droplets}
                iconColor="text-sky-500"
                data={data}
                dataKey="humidity"
                strokeColor="#0ea5e9"
                gradientId="gradHum"
                unit="%"
                label="Humedad"
              />
            </div>

            {/* Pressure Chart - NEW */}
            <div className="lg:col-span-2">
              <SensorChart
                title="Tendencia de Presión Atmosférica"
                icon={Gauge}
                iconColor="text-emerald-500"
                data={data}
                dataKey="pressure"
                strokeColor="#10b981"
                gradientId="gradPressure"
                unit="hPa"
                label="Presión"
                yDomain={[750, 830]}
              />
            </div>

            {/* Wind Chart */}
            <div>
              <SensorChart
                title="Viento"
                icon={Wind}
                iconColor="text-violet-500"
                data={data}
                dataKey="wind_speed"
                strokeColor="#8b5cf6"
                gradientId="gradWind"
                unit="km/h"
                label="Viento"
              />
            </div>

            {/* Light Chart - NEW */}
            <div className="lg:col-span-2">
              <SensorChart
                title="Nivel de Luz (ADC)"
                icon={Sun}
                iconColor="text-amber-500"
                data={data}
                dataKey="light_level"
                strokeColor="#f59e0b"
                gradientId="gradLight"
                unit="ADC"
                label="Luz"
              />
            </div>

            {/* Sound Chart - NEW */}
            <div>
              <SensorChart
                title="Nivel de Sonido"
                icon={Mic}
                iconColor="text-pink-500"
                data={data}
                dataKey="sound_level"
                strokeColor="#ec4899"
                gradientId="gradSound"
                unit="dB"
                label="Sonido"
              />
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-400 pb-4">
        Estación Meteorológica Pro — Datos en tiempo real via Supabase — Sierra Hidalguense, México (2157m)
      </footer>
    </main>
  );
}
