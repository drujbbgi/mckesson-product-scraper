import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Read MPN list from a text file
 * Expects one MPN per line
 */
export function readMpnList(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MPN list file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const mpns = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  logger.info(`Loaded ${mpns.length} MPNs from ${filePath}`);
  return mpns;
}

/**
 * Write JSON data to a file
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created output directory: ${dir}`);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  logger.info(`Results written to ${filePath}`);
}

/**
 * Append a single product result to a JSONL file (for incremental saves)
 */
export function appendToJsonl(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.appendFileSync(filePath, JSON.stringify(data) + '\n', 'utf-8');
}

/**
 * Ensure output directory exists
 */
export function ensureOutputDir(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created output directory: ${dir}`);
  }
}

/**
 * Read previously scraped results to support resumption
 */
export function readExistingResults(filePath: string): Set<string> {
  const scrapedMpns = new Set<string>();

  const jsonlPath = filePath.replace('.json', '.jsonl');
  if (fs.existsSync(jsonlPath)) {
    const content = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const product = JSON.parse(line);
        if (product.mpn) {
          scrapedMpns.add(product.mpn);
        }
      } catch {
        // Skip invalid lines
      }
    }

    logger.info(`Found ${scrapedMpns.size} previously scraped MPNs`);
  }

  return scrapedMpns;
}
