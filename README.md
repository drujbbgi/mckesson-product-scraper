# McKesson Product Scraper

A Node.js CLI tool for scraping product information from the McKesson medical supplies website. Given a list of Manufacturer Part Numbers (MPNs), it searches the McKesson catalog and extracts detailed product information.

## Features

- Search McKesson catalog by MPN
- Extract comprehensive product details including:
  - McKesson ID and manufacturer number
  - Product title and invoice title
  - Brand and manufacturer information
  - Multiple product images (high-res and original quality)
  - Full specifications table
  - Product features
- Concurrent scraping with configurable workers
- Resume capability for interrupted scrapes
- Rate limiting to avoid overloading the server
- Detailed logging with Winston

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Basic Usage

1. Create a text file with MPNs (one per line):

```
MFR-12345
ABC-67890
XYZ-11111
```

2. Run the scraper:

```bash
npm run scrape
```

By default, it reads from `mpn_list.txt` and outputs to `output/products.json`.

### Command Line Options

```bash
node dist/index.js [options]

Options:
  -i, --input <file>     Input file containing MPN list (default: "mpn_list.txt")
  -o, --output <file>    Output JSON file path (default: "output/products.json")
  -w, --workers <number> Number of concurrent workers (default: 1)
  -d, --delay <ms>       Delay between requests in milliseconds (default: 1500)
  -r, --retries <number> Maximum retry attempts per request (default: 3)
  -t, --timeout <ms>     Request timeout in milliseconds (default: 30000)
  --resume               Resume from previous run (skip already scraped MPNs)
  --limit <number>       Limit number of MPNs to process (for testing)
  --start <number>       Start index in MPN list (0-based)
  -v, --verbose          Enable verbose logging
  -h, --help             Display help
```

### NPM Scripts

```bash
# Standard scrape (1 worker, 1.5s delay)
npm run scrape

# Faster scrape with 3 workers
npm run scrape:workers

# Fast scrape (5 workers, 1s delay) - use with caution
npm run scrape:fast

# Safe/slow scrape (1 worker, 2s delay)
npm run scrape:safe

# Development mode (no build required)
npm run start:dev
```

### Examples

```bash
# Scrape from custom input file
node dist/index.js -i my_mpns.txt -o results.json

# Resume an interrupted scrape
node dist/index.js --resume

# Test with first 10 MPNs
node dist/index.js --limit 10 -v

# Start from MPN #50 with 3 workers
node dist/index.js --start 50 -w 3
```

## Output Format

The scraper outputs a JSON file with the following structure:

```json
{
  "startedAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T11:45:00.000Z",
  "totalProcessed": 500,
  "successCount": 480,
  "failureCount": 20,
  "exactMatches": 450,
  "partialMatches": 30,
  "noResults": 20,
  "config": {
    "workers": 3,
    "delayMs": 1500
  },
  "products": [
    {
      "mpn": "MFR-12345",
      "matchType": "exact",
      "product": {
        "mckessonId": "123456",
        "manufacturerNumber": "MFR-12345",
        "title": "Product Name",
        "invoiceTitle": "Short Name",
        "brand": "Brand Name",
        "manufacturer": "Manufacturer Inc",
        "imageUrl": "https://imgcdn.mckesson.com/.../High_Res/123456_front.jpg",
        "images": [
          "https://imgcdn.mckesson.com/.../High_Res/123456_front.jpg",
          "https://imgcdn.mckesson.com/.../High_Res/123456_pkgfront.jpg"
        ],
        "originalImages": [
          "https://imgcdn.mckesson.com/.../Original_Image/123456_front.jpg",
          "https://imgcdn.mckesson.com/.../Original_Image/123456_pkgfront.jpg"
        ],
        "specifications": [
          { "key": "Material", "value": "Stainless Steel" },
          { "key": "Size", "value": "Large" }
        ],
        "features": [
          "Feature 1",
          "Feature 2"
        ],
        "productUrl": "https://mms.mckesson.com/product/123456"
      },
      "scrapedAt": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```

### Match Types

- `exact` - MPN exactly matches the manufacturer number
- `partial` - Product found but MPN doesn't exactly match
- `none` - No products found for the MPN

## Project Structure

```
├── src/
│   ├── index.ts          # CLI entry point
│   ├── config/           # Configuration and constants
│   ├── parsers/          # HTML parsing (search & product pages)
│   ├── scraper/          # Main scraper logic
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Utilities (HTTP, file I/O, logging)
├── tests/                # Jest tests
├── output/               # Default output directory
└── mpn_list.txt          # Default input file
```

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Configuration Defaults

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `https://mms.mckesson.com` | McKesson website URL |
| `delayMs` | `1500` | Delay between requests (ms) |
| `maxRetries` | `3` | Retry attempts for failed requests |
| `workers` | `1` | Concurrent scraping workers |
| `timeout` | `30000` | Request timeout (ms) |

## License

ISC
