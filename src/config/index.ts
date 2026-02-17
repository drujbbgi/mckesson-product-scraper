import path from 'path';
import { ScraperConfig } from '../types';

/**
 * Default configuration values for the scraper
 */
export const DEFAULT_CONFIG: ScraperConfig = {
  baseUrl: 'https://mms.mckesson.com',
  delayMs: 1500, // 1.5 second delay to avoid rate limiting
  maxRetries: 3,
  workers: 1,
  inputFile: path.join(process.cwd(), 'mpn_list.txt'),
  outputFile: path.join(process.cwd(), 'output', 'products.json'),
  timeout: 30000, // 30 second timeout
};

/**
 * Creates a scraper configuration by merging defaults with provided options
 */
export function createConfig(options: Partial<ScraperConfig> = {}): ScraperConfig {
  return {
    ...DEFAULT_CONFIG,
    ...options,
  };
}

/**
 * Constructs the search URL for a given MPN query
 */
export function getSearchUrl(config: ScraperConfig, mpn: string): string {
  const encodedQuery = encodeURIComponent(mpn);
  return `${config.baseUrl}/catalog?query=${encodedQuery}&sort=Mf`;
}

/**
 * Constructs the full product URL from a relative path
 */
export function getProductUrl(config: ScraperConfig, relativePath: string): string {
  const cleanPath = relativePath.trim();
  if (cleanPath.startsWith('http')) {
    return cleanPath;
  }
  return `${config.baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}

/**
 * User agent string to use for requests
 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Common request headers
 */
export const REQUEST_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};
