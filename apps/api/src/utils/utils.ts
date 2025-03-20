import { nanoid } from 'nanoid';
import { v7 as uuidv7 } from 'uuid';

// Generate a unique UUID
export function generateUUID(): string {
  return uuidv7();
}

// Generate a Short ID
export function generateShortID(size: number): string {
  return nanoid(size);
}

// Interface for retry configuration
export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

/**
 * Helper method to wait for the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generic method to handle retry logic with exponential backoff
 * @param operation The async operation to retry
 * @param isRetryable Function to determine if an error should be retried
 * @param retryConfig The retry configuration
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  isRetryable: (error: any) => boolean,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let delayMs = config.initialDelayMs!;
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts!; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // If this is the last attempt, or the error is not retryable, throw the error
      if (attempt >= config.maxAttempts! || !isRetryable(error)) {
        throw error;
      }

      // Wait before the next retry with exponential backoff
      await delay(delayMs);

      // Increase delay for next attempt with exponential backoff
      delayMs = Math.min(delayMs * config.backoffFactor!, config.maxDelayMs!);
    }
  }

  throw lastError;
}

/**
 * Common implementation for determining if database errors are retryable
 */
export function isRetryableDatabaseError(error: any): boolean {
  // Common transient errors that should be retried for databases
  const retryableErrors = [
    'database is locked',
    'busy',
    'connection',
    'timeout',
    'network',
    'SQLITE_BUSY',
    'SQLITE_LOCKED',
  ];

  if (error && error.message) {
    return retryableErrors.some(retryErr =>
      error.message.toLowerCase().includes(retryErr.toLowerCase())
    );
  }

  return false;
}

/**
 * Common implementation for determining if KV storage errors are retryable
 */
export function isRetryableKVError(error: any): boolean {
  // Common transient errors that should be retried for KV stores
  const retryableErrors = [
    'timeout',
    'network',
    'connection',
    'temporarily unavailable',
    'service unavailable',
    'rate limit',
    'too many requests',
  ];

  if (error && error.message) {
    return retryableErrors.some(retryErr =>
      error.message.toLowerCase().includes(retryErr.toLowerCase())
    );
  }

  return false;
}
