import * as cheerio from 'cheerio';
import { SearchPageResult, SearchResultItem } from '../types';
import { logger } from '../utils/logger';

/**
 * Parse the search results page HTML and extract product items
 */
export function parseSearchPage(html: string, query: string): SearchPageResult {
  const $ = cheerio.load(html);

  // Find the product list container
  const productList = $('.product-item-list.js-product-item-list');

  if (productList.length === 0) {
    logger.debug(`No product list found for query: ${query}`);
    return {
      query,
      hasResults: false,
      totalResults: 0,
      items: [],
    };
  }

  // Find all product items
  const productItems = productList.find('.product-item');
  const items: SearchResultItem[] = [];

  productItems.each((_, element) => {
    const $item = $(element);

    // Extract product ID from the product-header-id element
    const productIdElement = $item.find('.product-header-id');
    const productId = productIdElement.attr('id') || productIdElement.text().replace('#', '').trim();

    // Extract product title and URL
    const titleLink = $item.find('.item-title a');
    const title = titleLink.text().trim();
    const productUrl = titleLink.attr('href')?.trim() || '';

    // Extract manufacturer info
    const headerItems = $item.find('.product-header li');
    let manufacturerNumber: string | undefined;
    let manufacturer: string | undefined;

    headerItems.each((_, li) => {
      const text = $(li).text().trim();
      // Skip the product ID item
      if (!$(li).hasClass('product-header-id') && text.includes('#')) {
        // Format: "Manufacturer Name #MFR123"
        const match = text.match(/(.+?)\s*#(.+)/);
        if (match) {
          manufacturer = match[1].replace(/&nbsp;/g, ' ').trim();
          manufacturerNumber = match[2].trim();
        }
      }
    });

    if (productId) {
      items.push({
        productId,
        title,
        productUrl,
        manufacturerNumber,
        manufacturer,
      });
    }
  });

  // Try to get total results from the paging container
  const pagingContainer = $('#catalog');
  const totalElements = parseInt(pagingContainer.attr('data-total-elements') || '0', 10);

  logger.debug(`Found ${items.length} products for query: ${query}`);

  return {
    query,
    hasResults: items.length > 0,
    totalResults: totalElements || items.length,
    items,
  };
}

/**
 * Find the best matching product from search results
 * Returns the exact match if found, otherwise the first result
 */
export function findBestMatch(
  searchResult: SearchPageResult,
  query: string
): { item: SearchResultItem | null; isExactMatch: boolean } {
  if (!searchResult.hasResults || searchResult.items.length === 0) {
    return { item: null, isExactMatch: false };
  }

  // Normalize the query for comparison
  const normalizedQuery = query.toLowerCase().trim();

  // Try to find an exact match by product ID
  const exactMatch = searchResult.items.find(
    (item) => item.productId.toLowerCase() === normalizedQuery
  );

  if (exactMatch) {
    logger.debug(`Exact match found for query ${query}: ${exactMatch.productId}`);
    return { item: exactMatch, isExactMatch: true };
  }

  // Also check manufacturer number for exact match
  const mfrMatch = searchResult.items.find(
    (item) => item.manufacturerNumber?.toLowerCase() === normalizedQuery
  );

  if (mfrMatch) {
    logger.debug(`Exact manufacturer match found for query ${query}: ${mfrMatch.manufacturerNumber}`);
    return { item: mfrMatch, isExactMatch: true };
  }

  // Return the first result as a partial match
  logger.debug(`No exact match for query ${query}, using first result: ${searchResult.items[0].productId}`);
  return { item: searchResult.items[0], isExactMatch: false };
}
