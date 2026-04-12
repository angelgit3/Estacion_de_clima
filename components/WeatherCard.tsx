"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface WeatherCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
}

export default function WeatherCard({
  title, value, unit, icon: Icon, gradient, loading = false,
}: WeatherCardProps) {
  const displayValue = loading ? "..." : (value ?? "--");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
      className="relative overflow-hidden group p-5 rounded-3xl bg-white/70 backdrop-blur-md border border-white/50 shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-slate-800 leading-none truncate">
              {displayValue}
            </h3>
            <span className="text-sm font-medium text-slate-400">{unit}</span>
          </div>
        </div>
        <div
          className={`flex-shrink-0 p-2.5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Decorative gradient flare */}
      <div
        className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradient} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity duration-500`}
      />
    </motion.div>
  );
}
