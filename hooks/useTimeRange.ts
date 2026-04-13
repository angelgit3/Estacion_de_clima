import { useState, useCallback, useEffect } from 'react';
import { TimeRange, TimeRangeConfig } from '@/lib/types';

// ============================================================
// useTimeRange Hook
// Manages time range selection with localStorage persistence
// ============================================================

const TIME_RANGES: Record<TimeRange, TimeRangeConfig> = {
  '5m': {
    label: '5 min',
    minutes: 5,
    limit: 10, // ~10 records at 30s intervals
  },
  '1h': {
    label: '1 hora',
    minutes: 60,
    limit: 120, // ~120 records
  },
  '24h': {
    label: '24 horas',
    minutes: 1440,
    limit: 500, // Aggregate to ~500 records
    aggregateMinutes: 15, // Bucket into 15-min averages
  },
  '7d': {
    label: '7 días',
    minutes: 10080,
    limit: 1000, // Aggregate to ~1000 records
    aggregateMinutes: 60, // Bucket into 1-hour averages
  },
};

const STORAGE_KEY = 'weather-dashboard-time-range';

export function useTimeRange() {
  // Load from localStorage or default to '5m'
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    if (typeof window === 'undefined') return '5m';
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in TIME_RANGES) {
        return stored as TimeRange;
      }
    } catch {
      // localStorage not available or invalid
    }
    
    return '5m';
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, timeRange);
    } catch {
      // localStorage not available
    }
  }, [timeRange]);

  const setTimeRangeAndSave = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const config = TIME_RANGES[timeRange];

  return {
    timeRange,
    setTimeRange: setTimeRangeAndSave,
    config,
    allRanges: TIME_RANGES,
  };
}

export { TIME_RANGES };
