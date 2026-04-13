"use client";
import { TimeRange } from '@/lib/types';
import { TIME_RANGES } from '@/hooks/useTimeRange';

// ============================================================
// TimeRangePicker Component
// Allows users to select different time ranges for data viewing
// ============================================================

interface TimeRangePickerProps {
  currentTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export default function TimeRangePicker({
  currentTimeRange,
  onTimeRangeChange,
}: TimeRangePickerProps) {
  const ranges: TimeRange[] = ['5m', '1h', '24h', '7d'];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 font-medium mr-2">Período:</span>
      {ranges.map((range) => {
        const config = TIME_RANGES[range];
        const isActive = range === currentTimeRange;

        return (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'bg-white/50 text-slate-600 hover:bg-white/70 border border-slate-200/60'
              }
            `}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
