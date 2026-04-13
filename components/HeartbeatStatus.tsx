"use client";
import { HeartbeatStatus as HeartbeatStatusType } from '@/lib/types';
import { Wifi, WifiOff } from 'lucide-react';

// ============================================================
// HeartbeatStatus Component
// Displays real-time ESP32 connectivity status
// ============================================================

interface HeartbeatStatusProps {
  status: HeartbeatStatusType;
}

export default function HeartbeatStatus({ status }: HeartbeatStatusProps) {
  const { isOnline, statusText } = status;

  return (
    <div className="flex items-center gap-3">
      {/* Status icon */}
      <div
        className={`
        flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300
        ${isOnline ? 'bg-emerald-100' : 'bg-red-100'}
      `}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">ESP32</span>
        <span
          className={`
          text-sm font-semibold transition-colors duration-300
          ${isOnline ? 'text-emerald-600' : 'text-red-600'}
        `}
        >
          {statusText}
        </span>
      </div>

      {/* Pulse indicator */}
      {isOnline && (
        <div className="ml-auto">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}
