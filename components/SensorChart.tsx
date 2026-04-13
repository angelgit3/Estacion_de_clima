"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LucideIcon } from 'lucide-react';
import { WeatherLog } from '@/lib/types';

// ============================================================
// SensorChart Component
// Reusable chart component for any sensor data
// ============================================================

interface SensorChartProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  data: WeatherLog[];
  dataKey: keyof Pick<WeatherLog, 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'light_level' | 'sound_level'>;
  strokeColor: string;
  gradientId: string;
  unit: string;
  label: string;
  height?: number;
  yDomain?: [number, number] | string[];
}

function formatTime(iso: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function SensorChart({
  title,
  icon: Icon,
  iconColor,
  data,
  dataKey,
  strokeColor,
  gradientId,
  unit,
  label,
  height = 260,
  yDomain,
}: SensorChartProps) {
  return (
    <div className="p-7 rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h2>

      <div className={`h-[${height}px]`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
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
              domain={yDomain || ['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                color: '#1e293b',
                fontSize: '13px',
              }}
              labelFormatter={(label) => formatTime(label as string)}
              formatter={(value: any) => [`${Number(value).toFixed(1)} ${unit}`, label]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
