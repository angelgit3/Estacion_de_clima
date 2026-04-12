"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import WeatherCard from "@/components/WeatherCard";
import {
  Thermometer, Wind, Droplets, Gauge,
  Sun, Mic, Sparkles, AlertTriangle, Activity
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  Tooltip, XAxis, YAxis
} from "recharts";

// ============================================================
// Types
// ============================================================
interface WeatherLog {
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

// ============================================================
// Helpers
// ============================================================
function formatTime(iso: string): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function hasAnyAlert(logs: WeatherLog[]): boolean {
  return logs.some((log) => log.status === 'alert');
}

// ============================================================
// Main Page
// ============================================================
export default function Home() {
  const [data, setData] = useState<WeatherLog[]>([]);
  const [latest, setLatest] = useState<WeatherLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertActive, setAlertActive] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    const fetchData = async () => {
      const { data: logs } = await client
        .from('weather_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logs) {
        const reversed = logs.reverse();
        setData(reversed);
        setLatest(reversed[reversed.length - 1]);
        setAlertActive(hasAnyAlert(reversed));
      }
      setLoading(false);
    };
    fetchData();

    // Realtime subscription
    const channel = client
      .channel('weather_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'weather_logs' },
        (payload) => {
          const newLog = payload.new as WeatherLog;
          setLatest(newLog);
          setData((prev) => [...prev.slice(-49), newLog]);
          if (newLog.status === 'alert') setAlertActive(true);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Dismiss alert
  const dismissAlert = () => setAlertActive(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 text-slate-800 p-6 md:p-10 font-sans">

      {/* ========== ALERT BANNER ========== */}
      {alertActive && (
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

      {/* ========== HEADER ========== */}
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
          <div className="flex items-center gap-3">
            {latest && (
              <span className="text-xs text-slate-400 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50">
                Última lectura: {formatTime(latest.created_at)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ========== SENSOR CARDS (6) ========== */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
        <WeatherCard
          title="Temperatura"
          value={latest?.temperature ?? "--"}
          unit="°C"
          icon={Thermometer}
          gradient="from-orange-400 to-rose-500"
          loading={loading}
        />
        <WeatherCard
          title="Humedad"
          value={latest?.humidity ?? "--"}
          unit="%"
          icon={Droplets}
          gradient="from-sky-400 to-blue-500"
          loading={loading}
        />
        <WeatherCard
          title="Presión"
          value={latest?.pressure ?? "--"}
          unit="hPa"
          icon={Gauge}
          gradient="from-emerald-400 to-teal-500"
          loading={loading}
        />
        <WeatherCard
          title="Viento"
          value={latest?.wind_speed ?? "--"}
          unit="km/h"
          icon={Wind}
          gradient="from-violet-400 to-purple-500"
          loading={loading}
        />
        <WeatherCard
          title="Luz"
          value={latest?.light_level ?? "--"}
          unit="lux"
          icon={Sun}
          gradient="from-amber-400 to-yellow-500"
          loading={loading}
        />
        <WeatherCard
          title="Sonido"
          value={latest?.sound_level ?? "--"}
          unit="dB"
          icon={Mic}
          gradient="from-pink-400 to-fuchsia-500"
          loading={loading}
        />
      </div>

      {/* ========== CHARTS + SIDEBAR ========== */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Temperature Chart */}
        <div className="lg:col-span-2 p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Tendencia de Temperatura
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  tickFormatter={formatTime}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  orientation="right"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    color: '#1e293b',
                    fontSize: '13px'
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                  formatter={(value) => [`${Number(value).toFixed(1)} °C`, 'Temperatura']}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradTemp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Sidebar */}
        <div className="p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
            <Activity className="w-5 h-5 text-emerald-500" />
            Estado del Sistema
          </h2>
          <ul className="space-y-5">
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Microcontrolador</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-mono text-xs font-semibold">
                ESP32 Online
              </span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-500">NI MyDAQ Node</span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60 font-mono text-xs font-semibold">
                Activo
              </span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Micrófono I2S</span>
              <span className="text-slate-700 text-xs font-medium">INMP441</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-500">MPU6500 IMU</span>
              <span className="text-slate-700 text-xs font-medium">Integridad activa</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Fotoresistencia</span>
              <span className="text-slate-700 text-xs font-medium">
                {latest?.light_level != null
                  ? (latest.light_level > 1500 ? "☀️ Día" : "🌙 Noche")
                  : "--"}
              </span>
            </li>

            {/* Alert indicator */}
            <li className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  alertActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
                }`} />
                <span className={`text-xs font-semibold ${
                  alertActive ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {alertActive ? 'ALERTA ACTIVA' : 'Todo normal'}
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Humidity Chart */}
        <div className="lg:col-span-2 p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
            <Droplets className="w-5 h-5 text-sky-500" />
            Tendencia de Humedad
          </h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  tickFormatter={formatTime}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  orientation="right"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    color: '#1e293b',
                    fontSize: '13px'
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                  formatter={(value) => [`${Number(value).toFixed(1)} %`, 'Humedad']}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradHum)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wind Chart */}
        <div className="p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
            <Wind className="w-5 h-5 text-violet-500" />
            Viento
          </h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gradWind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  tickFormatter={formatTime}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  orientation="right"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    color: '#1e293b',
                    fontSize: '13px'
                  }}
                  labelFormatter={(label) => formatTime(label as string)}
                  formatter={(value) => [`${Number(value).toFixed(1)} km/h`, 'Viento']}
                />
                <Area
                  type="monotone"
                  dataKey="wind_speed"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradWind)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-400 pb-4">
        Estación Meteorológica Pro — Datos en tiempo real via Supabase
      </footer>
    </main>
  );
}
