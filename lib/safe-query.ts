import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Safe Query Wrapper with Exponential Backoff Retry
// Provides resilient database queries with automatic retry
// ============================================================

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  retries: number;
}

/**
 * Execute a Supabase query with automatic retry and exponential backoff
 */
export async function safeQuery<T>(
  client: SupabaseClient | null,
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<QueryResult<T>> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    timeoutMs = 10000,
  } = options;

  // Check if client is available
  if (!client) {
    return {
      data: null,
      error: new Error('Supabase client not available'),
      retries: 0,
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
      });

      // Execute the query with race against timeout
      const result = await Promise.race([
        queryFn(client),
        timeoutPromise,
      ]);

      if (result.error) {
        throw new Error(
          typeof result.error === 'string' ? result.error : result.error?.message || 'Unknown query error'
        );
      }

      return {
        data: result.data,
        error: null,
        retries: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 500ms, 1s, 2s, 4s...
      const delay = initialDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  return {
    data: null,
    error: lastError || new Error('Unknown error'),
    retries: maxRetries,
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a network/connection error
 */
export function isConnectionError(error: Error | null): boolean {
  if (!error) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('fetch') ||
    message.includes('timeout')
  );
}

/**
 * Get user-friendly error message
 */
export function getFriendlyErrorMessage(error: Error | null): string {
  if (!error) return '';
  
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) {
    return 'La conexión tardó demasiado. Verifica tu conexión a internet.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'No tienes permisos para acceder a estos datos.';
  }
  
  return `Error: ${error.message}`;
}
