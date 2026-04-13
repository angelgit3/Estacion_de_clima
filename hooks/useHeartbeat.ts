import { useState, useEffect, useRef } from 'react';
import { HeartbeatStatus, WeatherLog } from '@/lib/types';

// ============================================================
// useHeartbeat Hook
// Monitors ESP32 connectivity by checking last data timestamp
// ============================================================

const OFFLINE_THRESHOLD_SECONDS = 90; // 1.5 minutes without data = offline
const UPDATE_INTERVAL_MS = 10000; // Update status every 10 seconds

export function useHeartbeat(latestLog: WeatherLog | null): HeartbeatStatus {
  const [status, setStatus] = useState<HeartbeatStatus>({
    isOnline: false,
    lastSeen: null,
    secondsAgo: null,
    statusText: 'Verificando...',
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update heartbeat status
    const updateStatus = () => {
      if (!latestLog) {
        setStatus({
          isOnline: false,
          lastSeen: null,
          secondsAgo: null,
          statusText: 'Sin datos',
        });
        return;
      }

      const lastSeen = new Date(latestLog.created_at);
      const now = new Date();
      const secondsAgo = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);

      const isOnline = secondsAgo < OFFLINE_THRESHOLD_SECONDS;

      let statusText: string;
      if (secondsAgo < 10) {
        statusText = 'En línea';
      } else if (secondsAgo < 60) {
        statusText = `Hace ${secondsAgo}s`;
      } else {
        const minutes = Math.floor(secondsAgo / 60);
        const seconds = secondsAgo % 60;
        statusText = `Hace ${minutes}m ${seconds}s`;
      }

      setStatus({
        isOnline,
        lastSeen,
        secondsAgo,
        statusText,
      });
    };

    // Initial update
    updateStatus();

    // Set up interval for continuous monitoring
    intervalRef.current = setInterval(updateStatus, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [latestLog]);

  return status;
}
