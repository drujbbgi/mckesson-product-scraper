import pLimit from 'p-limit';
import { ScraperConfig, ScrapedProduct, MatchType, ScraperOutput } from '../types';
import { getSearchUrl, getProductUrl } from '../config';
import { parseSearchPage, findBestMatch, parseProductPage } from '../parsers';
import {
  fetchWithRetry,
  sleep,
  isRateLimitError,
  logger,
  logProgress,
  logError,
  logSuccess,
  appendToJsonl,
  ensureOutputDir,
} from '../utils';

/**
 * Scrape a single MPN and return the product details
 */
export async function scrapeMpn(
  mpn: string,
  config: ScraperConfig
): Promise<ScrapedProduct> {
  const startTime = Date.now();

  try {
    // Step 1: Search for the MPN
    const searchUrl = getSearchUrl(config, mpn);
    logger.debug(`Fetching search page: ${searchUrl}`);

    const searchHtml = await fetchWithRetry(searchUrl, {
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    });

    // Step 2: Parse search results
    const searchResult = parseSearchPage(searchHtml, mpn);

    if (!searchResult.hasResults) {
      return {
        mpn,
        matchType: 'none',
        product: null,
        scrapedAt: new Date().toISOString(),
      };
    }

    // Step 3: Find the best matching product
    const { item, isExactMatch } = findBestMatch(searchResult, mpn);

    if (!item) {
      return {
        mpn,
        matchType: 'none',
        product: null,
        scrapedAt: new Date().toISOString(),
      };
    }

    // Step 4: Fetch the product page
    const productFullUrl = getProductUrl(config, item.productUrl);
    logger.debug(`Fetching product page: ${productFullUrl}`);

    const productHtml = await fetchWithRetry(productFullUrl, {
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    });

    // Step 5: Parse product details
    const productDetails = parseProductPage(productHtml, productFullUrl);

    const matchType: MatchType = isExactMatch ? 'exact' : 'partial';

    logger.debug(`Scraped ${mpn} in ${Date.now() - startTime}ms`);

    return {
      mpn,
      matchType,
      product: productDetails,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(mpn, errorMessage);

    return {
      mpn,
      matchType: 'none',
      product: null,
      error: errorMessage,
      scrapedAt: new Date().toISOString(),
    };
  }
}

/**
 * Main scraper class that orchestrates the scraping process
 */
export class ProductScraper {
  private config: ScraperConfig;
  private results: ScrapedProduct[] = [];
  private startTime: Date = new Date();

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Scrape all MPNs from the list
   */
  async scrapeAll(
    mpns: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<ScraperOutput> {
    this.startTime = new Date();
    this.results = [];

    const jsonlPath = this.config.outputFile.replace('.json', '.jsonl');
    ensureOutputDir(jsonlPath);

    // Create a concurrency limiter
    const limit = pLimit(this.config.workers);

    logger.info(`Starting scraper with ${this.config.workers} worker(s)`);
    logger.info(`Processing ${mpns.length} MPNs`);
    logger.info(`Delay between requests: ${this.config.delayMs}ms`);

    let completed = 0;

    // Create tasks for all MPNs
    const tasks = mpns.map((mpn, index) =>
      limit(async () => {
        // Add delay between requests to avoid rate limiting
        if (index > 0) {
          await sleep(this.config.delayMs);
        }

        let result: ScrapedProduct;

        try {
          result = await scrapeMpn(mpn, this.config);

          if (result.error && isRateLimitError(new Error(result.error))) {
            // If rate limited, wait longer and retry once
            logger.warn(`Rate limited on ${mpn}, waiting 10 seconds...`);
            await sleep(10000);
            result = await scrapeMpn(mpn, this.config);
          }
        } catch (error) {
          result = {
            mpn,
            matchType: 'none',
            product: null,
            error: error instanceof Error ? error.message : String(error),
            scrapedAt: new Date().toISOString(),
          };
        }

        // Save result incrementally
        appendToJsonl(jsonlPath, result);
        this.results.push(result);

        completed++;
        logProgress(completed, mpns.length, mpn);

        if (result.matchType !== 'none') {
          logSuccess(mpn, result.matchType);
        }

        if (onProgress) {
          onProgress(completed, mpns.length);
        }

        return result;
      })
    );

    // Wait for all tasks to complete
    await Promise.all(tasks);

    return this.generateOutput();
  }

  /**
   * Generate the final output object
   */
  private generateOutput(): ScraperOutput {
    const successCount = this.results.filter((r) => r.product !== null).length;
    const failureCount = this.results.filter((r) => r.error !== undefined).length;
    const exactMatches = this.results.filter((r) => r.matchType === 'exact').length;
    const partialMatches = this.results.filter((r) => r.matchType === 'partial').length;
    const noResults = this.results.filter((r) => r.matchType === 'none').length;

    return {
      startedAt: this.startTime.toISOString(),
      completedAt: new Date().toISOString(),
      totalProcessed: this.results.length,
      successCount,
      failureCount,
      exactMatches,
      partialMatches,
      noResults,
      config: {
        baseUrl: this.config.baseUrl,
        workers: this.config.workers,
        delayMs: this.config.delayMs,
        maxRetries: this.config.maxRetries,
      },
      products: this.results,
    };
  }

  /**
   * Get current results
   */
  getResults(): ScrapedProduct[] {
    return this.results;
  }
}
