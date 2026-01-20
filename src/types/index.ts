/**
 * Configuration options for the scraper
 */
export interface ScraperConfig {
  /** Base URL for the McKesson website */
  baseUrl: string;
  /** Delay between requests in milliseconds */
  delayMs: number;
  /** Number of retry attempts for failed requests */
  maxRetries: number;
  /** Number of concurrent workers */
  workers: number;
  /** Input file path for MPN list */
  inputFile: string;
  /** Output file path for results */
  outputFile: string;
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Search result item from the catalog search page
 */
export interface SearchResultItem {
  /** Product ID (McKesson #) */
  productId: string;
  /** Product title/name */
  title: string;
  /** URL path to the product page */
  productUrl: string;
  /** Manufacturer part number */
  manufacturerNumber?: string;
  /** Manufacturer name */
  manufacturer?: string;
}

/**
 * Search page result containing all products found
 */
export interface SearchPageResult {
  /** The MPN query used */
  query: string;
  /** Whether products were found */
  hasResults: boolean;
  /** Total number of results */
  totalResults: number;
  /** List of product items found */
  items: SearchResultItem[];
}

/**
 * Product specification key-value pair
 */
export interface ProductSpecification {
  /** Specification label */
  key: string;
  /** Specification value */
  value: string;
}

/**
 * Full product details from the product page
 */
export interface ProductDetails {
  /** McKesson product ID */
  mckessonId: string;
  /** Manufacturer part number */
  manufacturerNumber: string;
  /** Product title */
  title: string;
  /** Product invoice title */
  invoiceTitle?: string;
  /** Brand name */
  brand?: string;
  /** Manufacturer name */
  manufacturer?: string;
  /** Main product image URL (first high-res image) */
  imageUrl: string | null;
  /** All high-res product images */
  images: string[];
  /** All original/full-size product images */
  originalImages: string[];
  /** Product specifications as key-value pairs */
  specifications: ProductSpecification[];
  /** Full feature list (from the specifications section) */
  features: string[];
  /** Product page URL */
  productUrl: string;
}

/**
 * Match type for query matching
 */
export type MatchType = 'exact' | 'partial' | 'none';

/**
 * Final scraped product result
 */
export interface ScrapedProduct {
  /** Original MPN query */
  mpn: string;
  /** Type of match found */
  matchType: MatchType;
  /** Product details if found */
  product: ProductDetails | null;
  /** Error message if scraping failed */
  error?: string;
  /** Timestamp of when the product was scraped */
  scrapedAt: string;
}

/**
 * Scraper output file format
 */
export interface ScraperOutput {
  /** When the scrape was started */
  startedAt: string;
  /** When the scrape completed */
  completedAt: string;
  /** Total MPNs processed */
  totalProcessed: number;
  /** Number of successful scrapes */
  successCount: number;
  /** Number of failed scrapes */
  failureCount: number;
  /** Number of exact matches */
  exactMatches: number;
  /** Number of partial matches */
  partialMatches: number;
  /** Number of no results */
  noResults: number;
  /** Configuration used */
  config: Partial<ScraperConfig>;
  /** All scraped products */
  products: ScrapedProduct[];
}

/**
 * Logger levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Progress callback for reporting scraping progress
 */
export type ProgressCallback = (current: number, total: number, mpn: string) => void;
