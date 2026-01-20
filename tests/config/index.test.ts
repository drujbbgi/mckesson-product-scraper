import { createConfig, getSearchUrl, getProductUrl, DEFAULT_CONFIG } from '../../src/config';

describe('createConfig', () => {
  it('should return default config when no options provided', () => {
    const config = createConfig();

    expect(config.baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    expect(config.delayMs).toBe(DEFAULT_CONFIG.delayMs);
    expect(config.maxRetries).toBe(DEFAULT_CONFIG.maxRetries);
    expect(config.workers).toBe(DEFAULT_CONFIG.workers);
  });

  it('should merge provided options with defaults', () => {
    const config = createConfig({
      workers: 5,
      delayMs: 2000,
    });

    expect(config.workers).toBe(5);
    expect(config.delayMs).toBe(2000);
    expect(config.maxRetries).toBe(DEFAULT_CONFIG.maxRetries); // Default
  });

  it('should override all provided options', () => {
    const customConfig = {
      baseUrl: 'https://custom.example.com',
      delayMs: 3000,
      maxRetries: 5,
      workers: 10,
      inputFile: '/custom/input.txt',
      outputFile: '/custom/output.json',
      timeout: 60000,
    };

    const config = createConfig(customConfig);

    expect(config.baseUrl).toBe(customConfig.baseUrl);
    expect(config.delayMs).toBe(customConfig.delayMs);
    expect(config.maxRetries).toBe(customConfig.maxRetries);
    expect(config.workers).toBe(customConfig.workers);
    expect(config.inputFile).toBe(customConfig.inputFile);
    expect(config.outputFile).toBe(customConfig.outputFile);
    expect(config.timeout).toBe(customConfig.timeout);
  });
});

describe('getSearchUrl', () => {
  const config = createConfig();

  it('should construct search URL with encoded query', () => {
    const url = getSearchUrl(config, 'ABC123');
    expect(url).toBe('https://mms.mckesson.com/catalog?query=ABC123');
  });

  it('should encode special characters in query', () => {
    const url = getSearchUrl(config, 'ABC 123');
    expect(url).toBe('https://mms.mckesson.com/catalog?query=ABC%20123');
  });

  it('should encode URL-special characters', () => {
    const url = getSearchUrl(config, 'A&B=C');
    expect(url).toBe('https://mms.mckesson.com/catalog?query=A%26B%3DC');
  });
});

describe('getProductUrl', () => {
  const config = createConfig();

  it('should construct full URL from relative path', () => {
    const url = getProductUrl(config, '/product/123/Test-Product');
    expect(url).toBe('https://mms.mckesson.com/product/123/Test-Product');
  });

  it('should handle path without leading slash', () => {
    const url = getProductUrl(config, 'product/123/Test-Product');
    expect(url).toBe('https://mms.mckesson.com/product/123/Test-Product');
  });

  it('should return full URL unchanged', () => {
    const fullUrl = 'https://other.example.com/product/123';
    const url = getProductUrl(config, fullUrl);
    expect(url).toBe(fullUrl);
  });

  it('should trim whitespace from path', () => {
    const url = getProductUrl(config, '  /product/123  ');
    expect(url).toBe('https://mms.mckesson.com/product/123');
  });
});
