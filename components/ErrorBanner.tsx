"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getFriendlyErrorMessage } from '@/lib/safe-query';

// ============================================================
// ErrorBanner Component
// Displays error messages with retry functionality
// ============================================================

interface ErrorBannerProps {
  error: Error | null;
  onRetry: () => void;
  retrying?: boolean;
}

export default function ErrorBanner({ error, onRetry, retrying = false }: ErrorBannerProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-r from-red-500 via-rose-600 to-red-500 text-white px-6 py-4 shadow-lg shadow-red-500/30">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Error de Conexión</p>
                  <p className="text-xs text-white/90">
                    {getFriendlyErrorMessage(error)}
                  </p>
                </div>
              </div>

              <button
                onClick={onRetry}
                disabled={retrying}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Reintentando...' : 'Reintentar'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
