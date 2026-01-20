import { Command } from 'commander';
import path from 'path';
import { createConfig, DEFAULT_CONFIG } from './config';
import { ProductScraper } from './scraper';
import {
  logger,
  readMpnList,
  writeJsonFile,
  readExistingResults,
  ensureOutputDir,
} from './utils';
import { ScraperConfig } from './types';

const program = new Command();

program
  .name('mckesson-scraper')
  .description('Scrape product information from McKesson medical supplies website')
  .version('1.0.0');

program
  .option('-i, --input <file>', 'Input file containing MPN list (one per line)', DEFAULT_CONFIG.inputFile)
  .option('-o, --output <file>', 'Output JSON file path', DEFAULT_CONFIG.outputFile)
  .option('-w, --workers <number>', 'Number of concurrent workers', String(DEFAULT_CONFIG.workers))
  .option('-d, --delay <ms>', 'Delay between requests in milliseconds', String(DEFAULT_CONFIG.delayMs))
  .option('-r, --retries <number>', 'Maximum retry attempts per request', String(DEFAULT_CONFIG.maxRetries))
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', String(DEFAULT_CONFIG.timeout))
  .option('--resume', 'Resume from previous run (skip already scraped MPNs)', false)
  .option('--limit <number>', 'Limit number of MPNs to process (for testing)')
  .option('--start <number>', 'Start index in MPN list (0-based)')
  .option('-v, --verbose', 'Enable verbose logging', false);

program.parse(process.argv);

const options = program.opts();

async function main(): Promise<void> {
  // Set log level
  if (options.verbose) {
    logger.level = 'debug';
  }

  logger.info('McKesson Product Scraper');
  logger.info('========================');

  // Build configuration
  const config: ScraperConfig = createConfig({
    inputFile: path.resolve(options.input),
    outputFile: path.resolve(options.output),
    workers: parseInt(options.workers, 10),
    delayMs: parseInt(options.delay, 10),
    maxRetries: parseInt(options.retries, 10),
    timeout: parseInt(options.timeout, 10),
  });

  // Log configuration
  logger.info(`Input file: ${config.inputFile}`);
  logger.info(`Output file: ${config.outputFile}`);
  logger.info(`Workers: ${config.workers}`);
  logger.info(`Request delay: ${config.delayMs}ms`);
  logger.info(`Max retries: ${config.maxRetries}`);
  logger.info(`Timeout: ${config.timeout}ms`);

  // Ensure output directory exists
  ensureOutputDir(config.outputFile);

  // Read MPN list
  let mpns: string[];
  try {
    mpns = readMpnList(config.inputFile);
  } catch (error) {
    logger.error(`Failed to read MPN list: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  if (mpns.length === 0) {
    logger.error('No MPNs found in input file');
    process.exit(1);
  }

  // Handle resume option
  if (options.resume) {
    const scrapedMpns = readExistingResults(config.outputFile);
    const originalCount = mpns.length;
    mpns = mpns.filter((mpn) => !scrapedMpns.has(mpn));
    logger.info(`Resuming: ${originalCount - mpns.length} MPNs already scraped, ${mpns.length} remaining`);
  }

  // Handle start index
  if (options.start) {
    const startIndex = parseInt(options.start, 10);
    mpns = mpns.slice(startIndex);
    logger.info(`Starting from index ${startIndex}, ${mpns.length} MPNs to process`);
  }

  // Handle limit option
  if (options.limit) {
    const limit = parseInt(options.limit, 10);
    mpns = mpns.slice(0, limit);
    logger.info(`Limited to ${limit} MPNs`);
  }

  if (mpns.length === 0) {
    logger.info('No MPNs to process');
    process.exit(0);
  }

  // Create scraper and run
  const scraper = new ProductScraper(config);

  try {
    const startTime = Date.now();

    const output = await scraper.scrapeAll(mpns);

    const duration = (Date.now() - startTime) / 1000;

    // Write final output
    writeJsonFile(config.outputFile, output);

    // Log summary
    logger.info('');
    logger.info('=== Scraping Complete ===');
    logger.info(`Duration: ${duration.toFixed(2)} seconds`);
    logger.info(`Total processed: ${output.totalProcessed}`);
    logger.info(`Successful: ${output.successCount}`);
    logger.info(`Failed: ${output.failureCount}`);
    logger.info(`Exact matches: ${output.exactMatches}`);
    logger.info(`Partial matches: ${output.partialMatches}`);
    logger.info(`No results: ${output.noResults}`);
    logger.info(`Output saved to: ${config.outputFile}`);
  } catch (error) {
    logger.error(`Scraping failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nReceived SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\nReceived SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Run main
main().catch((error) => {
  logger.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
