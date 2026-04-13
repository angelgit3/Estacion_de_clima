"use client";
import { HeartbeatStatus as HeartbeatStatusType, WeatherLog } from '@/lib/types';
import { Activity, Wifi, Cpu, Mic, Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import HeartbeatStatus from '@/components/HeartbeatStatus';

// ============================================================
// SystemStatusSidebar Component
// Shows real-time system health and sensor status
// ============================================================

interface SystemStatusSidebarProps {
  heartbeat: HeartbeatStatusType;
  latestLog: WeatherLog | null;
  alertActive: boolean;
  onAlertDismiss: () => void;
}

export default function SystemStatusSidebar({
  heartbeat,
  latestLog,
  alertActive,
  onAlertDismiss,
}: SystemStatusSidebarProps) {
  return (
    <div className="p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
        <Activity className="w-5 h-5 text-emerald-500" />
        Estado del Sistema
      </h2>

      <ul className="space-y-5">
        {/* ESP32 Heartbeat Status */}
        <li className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">Microcontrolador</span>
          <HeartbeatStatus status={heartbeat} />
        </li>

        {/* NI MyDAQ */}
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-500">NI MyDAQ Node</span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60 font-mono text-xs font-semibold">
            Activo
          </span>
        </li>

        {/* Sensor Details */}
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-500 flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" /> Micrófono I2S
          </span>
          <span className="text-slate-700 text-xs font-medium">INMP441</span>
        </li>

        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-500 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> MPU6500 IMU
          </span>
          <span className="text-slate-700 text-xs font-medium">Integridad activa</span>
        </li>

        {/* Light Level Indicator */}
        <li className="flex justify-between items-center text-sm">
          <span className="text-slate-500 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5" /> Fotoresistencia
          </span>
          <span className="text-slate-700 text-xs font-medium">
            {latestLog?.light_level != null
              ? (latestLog.light_level > 1500 ? "☀️ Día" : "🌙 Noche")
              : "--"}
          </span>
        </li>

        {/* Alert indicator */}
        <li className="pt-3 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  alertActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  alertActive ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {alertActive ? 'ALERTA ACTIVA' : 'Todo normal'}
              </span>
            </div>

            {alertActive && (
              <button
                onClick={onAlertDismiss}
                className="px-2 py-1 bg-white/50 hover:bg-white/70 rounded text-xs font-medium transition"
              >
                Descartar
              </button>
            )}
          </div>
        </li>
      </ul>
    </div>
  );
}
