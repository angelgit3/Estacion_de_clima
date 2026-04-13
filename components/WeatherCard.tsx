"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { SensorStatistics } from "@/lib/types";
import { formatTrend, getTrendColorClass } from "@/lib/statistics";
import { getThresholdColorClass, classifySensorValue, SENSOR_THRESHOLDS } from "@/lib/thresholds";

interface WeatherCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
  stats?: SensorStatistics;
  sensorKey?: keyof typeof SENSOR_THRESHOLDS;
}

export default function WeatherCard({
  title, value, unit, icon: Icon, gradient, loading = false, stats, sensorKey,
}: WeatherCardProps) {
  const displayValue = loading ? "..." : (value ?? "--");
  
  // Get threshold color if sensorKey is provided
  const valueColor = (sensorKey && typeof value === 'number')
    ? getThresholdColorClass(sensorKey, value)
    : 'text-slate-800';
  
  const thresholdLevel = (sensorKey && typeof value === 'number')
    ? classifySensorValue(sensorKey, value)
    : 'normal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
      className="relative overflow-hidden group p-5 rounded-3xl bg-white/70 backdrop-blur-md border border-white/50 shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className={`text-2xl font-bold leading-none truncate ${valueColor}`}>
              {displayValue}
            </h3>
            <span className="text-sm font-medium text-slate-400">{unit}</span>
          </div>
          
          {/* Trend indicator */}
          {stats && !loading && stats.trend && (
            <div className={`text-xs font-semibold mt-1 ${getTrendColorClass(stats.trend)}`}>
              {formatTrend(stats.trend, stats.trendPercentage)}
            </div>
          )}
        </div>
        <div
          className={`flex-shrink-0 p-2.5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Min/Max stats */}
      {stats && !loading && stats.min !== null && stats.max !== null && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-slate-400 mb-0.5">Mín</div>
            <div className="font-semibold text-slate-700">
              {stats.min.toFixed(1)}{unit}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Prom</div>
            <div className="font-semibold text-slate-700">
              {stats.avg?.toFixed(1)}{unit}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Máx</div>
            <div className="font-semibold text-slate-700">
              {stats.max.toFixed(1)}{unit}
            </div>
          </div>
        </div>
      )}

      {/* Decorative gradient flare */}
      <div
        className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradient} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity duration-500`}
      />
      
      {/* Threshold warning indicator */}
      {thresholdLevel === 'warning' && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      )}
      {thresholdLevel === 'critical' && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </motion.div>
  );
}
