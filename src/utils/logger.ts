import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

/**
 * Application logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

/**
 * Log scraping progress
 */
export function logProgress(current: number, total: number, mpn: string): void {
  const percentage = ((current / total) * 100).toFixed(1);
  logger.info(`Progress: ${current}/${total} (${percentage}%) - Processing MPN: ${mpn}`);
}

/**
 * Log scraping error
 */
export function logError(mpn: string, error: Error | string): void {
  const message = error instanceof Error ? error.message : error;
  logger.error(`Failed to scrape MPN ${mpn}: ${message}`);
}

/**
 * Log scraping success
 */
export function logSuccess(mpn: string, matchType: string): void {
  logger.info(`Successfully scraped MPN ${mpn} - Match type: ${matchType}`);
}
