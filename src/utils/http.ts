import { REQUEST_HEADERS } from '../config';
import { logger } from './logger';

/**
 * Custom error for HTTP requests
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public url: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Options for HTTP fetch requests
 */
export interface FetchOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Fetch a URL with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const { timeout = 30000, maxRetries = 3, retryDelay = 1000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: REQUEST_HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        logger.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${url}: ${lastError.message}. Retrying in ${waitTime}ms...`
        );
        await sleep(waitTime);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: Error): boolean {
  if (error instanceof HttpError) {
    return error.statusCode === 429 || error.statusCode === 503;
  }
  return false;
}
