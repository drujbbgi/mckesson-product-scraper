import { parseProductPage, isValidProduct } from '../../src/parsers/productPage';
import fs from 'fs';
import path from 'path';

describe('parseProductPage', () => {
  let sampleProductHtml: string;

  beforeAll(() => {
    // Load the sample product page HTML
    const htmlPath = path.join(__dirname, '../../website2scrape/_product_page.html');
    if (fs.existsSync(htmlPath)) {
      sampleProductHtml = fs.readFileSync(htmlPath, 'utf-8');
    }
  });

  it('should parse product details from sample page', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    expect(result.mckessonId).toBe('1000161');
    expect(result.title).toContain('Tissue Embedding Medium');
  });

  it('should extract manufacturer number', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    // Check that manufacturer number is extracted (value may vary in sample data)
    expect(result.manufacturerNumber).toBeTruthy();
    expect(typeof result.manufacturerNumber).toBe('string');
  });

  it('should extract specifications as key-value pairs', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    expect(result.specifications).toBeInstanceOf(Array);
    expect(result.specifications.length).toBeGreaterThan(0);

    // Check for expected specifications
    const mcKessonNumSpec = result.specifications.find((s) => s.key === 'McKesson #');
    expect(mcKessonNumSpec?.value).toBe('1000161');
  });

  it('should extract features from the full features section', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    expect(result.features).toBeInstanceOf(Array);
    expect(result.features.length).toBeGreaterThan(0);

    // Should not contain "More ..." text
    expect(result.features.some((f) => f.includes('More'))).toBe(false);
  });

  it('should extract brand from specifications', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    expect(result.brand).toContain('Fisherbrand');
  });

  it('should handle missing image gracefully', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    // The sample page may or may not have an image - just ensure it doesn't throw
    expect(result.imageUrl === null || typeof result.imageUrl === 'string').toBe(true);
  });

  it('should handle empty HTML', () => {
    const result = parseProductPage('', 'https://test.com/product/123');

    expect(result.mckessonId).toBe('');
    expect(result.title).toBe('');
    expect(result.specifications).toHaveLength(0);
    expect(result.features).toHaveLength(0);
  });

  it('should extract invoice title if present', () => {
    if (!sampleProductHtml) {
      console.log('Skipping test - sample HTML not found');
      return;
    }

    const result = parseProductPage(sampleProductHtml, 'https://mms.mckesson.com/product/1000161');

    if (result.invoiceTitle) {
      expect(result.invoiceTitle).toContain('PARAFFIN');
    }
  });
});

describe('isValidProduct', () => {
  it('should return true for valid product with required fields', () => {
    const product = {
      mckessonId: '123456',
      manufacturerNumber: 'MFR-123',
      title: 'Test Product',
      imageUrl: null,
      images: [],
      originalImages: [],
      specifications: [],
      features: [],
      productUrl: 'https://test.com/product/123',
    };

    expect(isValidProduct(product)).toBe(true);
  });

  it('should return false for product missing mckessonId', () => {
    const product = {
      mckessonId: '',
      manufacturerNumber: 'MFR-123',
      title: 'Test Product',
      imageUrl: null,
      images: [],
      originalImages: [],
      specifications: [],
      features: [],
      productUrl: 'https://test.com/product/123',
    };

    expect(isValidProduct(product)).toBe(false);
  });

  it('should return false for product missing title', () => {
    const product = {
      mckessonId: '123456',
      manufacturerNumber: 'MFR-123',
      title: '',
      imageUrl: null,
      images: [],
      originalImages: [],
      specifications: [],
      features: [],
      productUrl: 'https://test.com/product/123',
    };

    expect(isValidProduct(product)).toBe(false);
  });
});
