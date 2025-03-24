import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff with jitter
const getRetryDelay = (attempt: number, initialDelay: number, maxDelay: number) => {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 200; // Add up to 200ms of random jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

// Create Supabase client with custom fetch implementation
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Utility function to retry failed requests with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY,
  maxDelay = MAX_RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await operation();
      // If we get here, the operation was successful
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // If this was our last attempt, throw the error
      if (attempt === retries) {
        console.error('All retry attempts failed:', lastError);
        throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.');
      }
      
      // Calculate delay for next attempt
      const delay = getRetryDelay(attempt, initialDelay, maxDelay);
      console.warn(`Intento ${attempt + 1} falló, reintentando en ${delay}ms...`, error);
      await sleep(delay);
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
}

// Add connection health check with retry
export async function checkConnection() {
  try {
    const result = await retryOperation(async () => {
      const { error } = await supabase.from('maquilas').select('id').limit(1);
      if (error) throw error;
      return true;
    });
    return result;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}