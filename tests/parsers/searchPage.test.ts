import { parseSearchPage, findBestMatch } from '../../src/parsers/searchPage';
import fs from 'fs';
import path from 'path';

describe('parseSearchPage', () => {
  let sampleSearchHtml: string;

  beforeAll(() => {
    // Load the sample search page HTML
    const htmlPath = path.join(__dirname, '../../website2scrape/_search_page.html');
    if (fs.existsSync(htmlPath)) {
      sampleSearchHtml = fs.readFileSync(htmlPath, 'utf-8');
    }
  });

  it('should parse search results with products', () => {
    if (!sampleSearchHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseSearchPage(sampleSearchHtml, '1000161');

    expect(result.query).toBe('1000161');
    expect(result.hasResults).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should extract product ID correctly', () => {
    if (!sampleSearchHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseSearchPage(sampleSearchHtml, '1000161');

    expect(result.items[0].productId).toBe('1000161');
  });

  it('should extract product URL correctly', () => {
    if (!sampleSearchHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseSearchPage(sampleSearchHtml, '1000161');

    expect(result.items[0].productUrl).toContain('/product/1000161');
  });

  it('should return empty results for empty HTML', () => {
    const result = parseSearchPage('', 'test');

    expect(result.hasResults).toBe(false);
    expect(result.items).toHaveLength(0);
  });

  it('should handle HTML without product list container', () => {
    const html = '<html><body><div class="no-products">No products found</div></body></html>';
    const result = parseSearchPage(html, 'test');

    expect(result.hasResults).toBe(false);
    expect(result.items).toHaveLength(0);
  });
});

describe('findBestMatch', () => {
  it('should return null for no results', () => {
    const searchResult = {
      query: 'test',
      hasResults: false,
      totalResults: 0,
      items: [],
    };

    const { item, isExactMatch } = findBestMatch(searchResult, 'test');

    expect(item).toBeNull();
    expect(isExactMatch).toBe(false);
  });

  it('should find exact match by product ID', () => {
    const searchResult = {
      query: 'ABC123',
      hasResults: true,
      totalResults: 3,
      items: [
        { productId: 'XYZ789', title: 'Product 1', productUrl: '/product/xyz789' },
        { productId: 'ABC123', title: 'Product 2', productUrl: '/product/abc123' },
        { productId: 'DEF456', title: 'Product 3', productUrl: '/product/def456' },
      ],
    };

    const { item, isExactMatch } = findBestMatch(searchResult, 'ABC123');

    expect(item?.productId).toBe('ABC123');
    expect(isExactMatch).toBe(true);
  });

  it('should find exact match case-insensitively', () => {
    const searchResult = {
      query: 'abc123',
      hasResults: true,
      totalResults: 1,
      items: [{ productId: 'ABC123', title: 'Product 1', productUrl: '/product/abc123' }],
    };

    const { item, isExactMatch } = findBestMatch(searchResult, 'abc123');

    expect(item?.productId).toBe('ABC123');
    expect(isExactMatch).toBe(true);
  });

  it('should return first item as partial match when no exact match', () => {
    const searchResult = {
      query: 'TEST',
      hasResults: true,
      totalResults: 2,
      items: [
        { productId: 'FIRST', title: 'First Product', productUrl: '/product/first' },
        { productId: 'SECOND', title: 'Second Product', productUrl: '/product/second' },
      ],
    };

    const { item, isExactMatch } = findBestMatch(searchResult, 'TEST');

    expect(item?.productId).toBe('FIRST');
    expect(isExactMatch).toBe(false);
  });

  it('should find exact match by manufacturer number', () => {
    const searchResult = {
      query: 'MFR-456',
      hasResults: true,
      totalResults: 2,
      items: [
        {
          productId: 'PROD1',
          title: 'Product 1',
          productUrl: '/product/1',
          manufacturerNumber: 'MFR-123',
        },
        {
          productId: 'PROD2',
          title: 'Product 2',
          productUrl: '/product/2',
          manufacturerNumber: 'MFR-456',
        },
      ],
    };

    const { item, isExactMatch } = findBestMatch(searchResult, 'MFR-456');

    expect(item?.productId).toBe('PROD2');
    expect(isExactMatch).toBe(true);
  });
});
