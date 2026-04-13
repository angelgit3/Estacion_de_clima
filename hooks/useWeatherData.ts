import { useState, useEffect, useRef, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { WeatherLog, TimeRangeConfig } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { safeQuery } from '@/lib/safe-query';

// ============================================================
// useWeatherData Hook
// Fetches, aggregates, and manages weather data with realtime
// ============================================================

interface UseWeatherDataReturn {
  data: WeatherLog[];
  latest: WeatherLog | null;
  loading: boolean;
  error: Error | null;
  hasAlert: boolean;
  retry: () => void;
}

/**
 * Aggregate data points into time buckets
 * Reduces large datasets for better chart performance
 */
function aggregateData(
  logs: WeatherLog[],
  bucketMinutes: number
): WeatherLog[] {
  if (!bucketMinutes || logs.length === 0) return logs;

  const buckets = new Map<string, WeatherLog[]>();

  logs.forEach((log) => {
    const date = new Date(log.created_at);
    // Round down to nearest bucket
    const bucketTime = new Date(
      Math.floor(date.getTime() / (bucketMinutes * 60 * 1000)) *
        bucketMinutes *
        60 *
        1000
    );
    const bucketKey = bucketTime.toISOString();

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(log);
  });

  // Average each bucket
  return Array.from(buckets.entries()).map(([time, bucketLogs]) => {
    const numericFields = [
      'temperature',
      'humidity',
      'pressure',
      'wind_speed',
      'light_level',
      'sound_level',
    ] as const;

    const averaged: WeatherLog = {
      id: `bucket-${time}`,
      created_at: time,
      source: 'aggregated',
      status: bucketLogs.some((l) => l.status === 'alert') ? 'alert' : 'ok',
    } as WeatherLog;

    // Calculate averages for numeric fields
    numericFields.forEach((field) => {
      const values = bucketLogs
        .map((l) => l[field])
        .filter((v): v is number => v !== null);

      (averaged as any)[field] =
        values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : null;
    });

    return averaged;
  });
}

export function useWeatherData(config: TimeRangeConfig): UseWeatherDataReturn {
  const [data, setData] = useState<WeatherLog[]>([]);
  const [latest, setLatest] = useState<WeatherLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<any>(null);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setError(new Error('Supabase client not available'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await safeQuery<WeatherLog[]>(
      client,
      async (client) => {
        const { data, error } = await client
          .from('weather_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(config.limit);
        return { data, error };
      },
      { maxRetries: 3 }
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    let logs = result.data || [];

    // Filter by time range if needed
    if (config.minutes < 1440) {
      // For ranges < 24h, filter by actual time
      const cutoff = new Date(Date.now() - config.minutes * 60 * 1000);
      logs = logs.filter((log) => new Date(log.created_at) >= cutoff);
    }

    // Reverse to chronological order
    logs = logs.reverse();

    // Aggregate if needed
    if (config.aggregateMinutes) {
      logs = aggregateData(logs, config.aggregateMinutes);
    }

    setData(logs);
    setLatest(logs[logs.length - 1] || null);
    setLoading(false);
  }, [config]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    // Clean up old channel
    if (channelRef.current) {
      client.removeChannel(channelRef.current);
    }

    const channel = client
      .channel('weather_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'weather_logs' },
        (payload) => {
          const newLog = payload.new as WeatherLog;

          // Check if within time range
          const logTime = new Date(newLog.created_at).getTime();
          const cutoff = Date.now() - config.minutes * 60 * 1000;

          if (logTime >= cutoff) {
            setData((prev) => {
              const updated = [...prev, newLog];

              // Aggregate if needed
              if (config.aggregateMinutes) {
                return aggregateData(updated, config.aggregateMinutes);
              }

              // Keep only last N records
              return updated.slice(-config.limit);
            });

            setLatest(newLog);

            // Re-trigger alert if needed
            if (newLog.status === 'alert') {
              // Will be picked up by hasAlert calculation
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error');
          // Will be handled by error recovery
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [config.minutes, config.limit, config.aggregateMinutes]);

  // Calculate if there's an alert
  const hasAlert = data.some((log) => log.status === 'alert');

  // Manual retry function
  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchData();
  }, [fetchData]);

  return {
    data,
    latest,
    loading,
    error,
    hasAlert,
    retry,
  };
}
