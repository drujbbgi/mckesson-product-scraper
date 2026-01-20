import { sleep, HttpError, isRateLimitError } from '../../src/utils/http';

describe('sleep', () => {
  it('should delay execution', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    expect(elapsed).toBeLessThan(200);
  });
});

describe('HttpError', () => {
  it('should create error with status code and url', () => {
    const error = new HttpError('Not Found', 404, 'https://test.com/page');

    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
    expect(error.url).toBe('https://test.com/page');
    expect(error.name).toBe('HttpError');
  });
});

describe('isRateLimitError', () => {
  it('should return true for 429 status', () => {
    const error = new HttpError('Too Many Requests', 429, 'https://test.com');
    expect(isRateLimitError(error)).toBe(true);
  });

  it('should return true for 503 status', () => {
    const error = new HttpError('Service Unavailable', 503, 'https://test.com');
    expect(isRateLimitError(error)).toBe(true);
  });

  it('should return false for other status codes', () => {
    const error = new HttpError('Internal Server Error', 500, 'https://test.com');
    expect(isRateLimitError(error)).toBe(false);
  });

  it('should return false for non-HttpError', () => {
    const error = new Error('Network error');
    expect(isRateLimitError(error)).toBe(false);
  });
});
