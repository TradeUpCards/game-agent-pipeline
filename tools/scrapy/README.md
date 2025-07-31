# Scrapy Web Scraper

This is the integrated scrapy tool for the Game Agent Pipeline monorepo. It provides web scraping capabilities for collecting training data from gaming websites.

## Structure

```
tools/scrapy/
├── scraper/                 # Main scrapy project
│   ├── spiders/            # Spider definitions
│   │   └── maxroll.py      # Maxroll.gg spider
│   ├── settings.py         # Scrapy settings
│   ├── middlewares.py      # Custom middlewares
│   ├── pipelines.py        # Data processing pipelines
│   └── items.py           # Data item definitions
├── scrapy.cfg             # Scrapy configuration
├── dedupe.py              # Deduplication utilities
├── dedupe_compact.py      # Compact deduplication
├── dedupe_simple.py       # Simple deduplication
└── analyze_duplicates.py  # Duplicate analysis tool
```

## Usage

### Running the Maxroll Spider

From the monorepo root directory:

```bash
# Basic crawl of Maxroll D4 content
cd tools/scrapy
scrapy crawl maxroll

# Crawl with custom parameters
scrapy crawl maxroll -a start_urls="https://maxroll.gg/d4/getting-started" -a output_file="../../data/raw-scrapes/maxroll_d4_getting_started.json"

# Crawl with depth filtering
scrapy crawl maxroll -a filter_depth=2 -a max_pages=1000

# Crawl specific sections
scrapy crawl maxroll -a start_urls="https://maxroll.gg/d4/builds,https://maxroll.gg/d4/classes" -a output_file="../../data/raw-scrapes/maxroll_d4_builds_classes.json"
```

### Spider Parameters

- `start_urls`: Comma-separated list of starting URLs (default: D4 getting started)
- `filter_depth`: Number of path levels to match for filtering (default: 1)
- `max_depth`: Maximum crawl depth (default: no limit)
- `max_pages`: Maximum pages to scrape (default: 10000)
- `output_file`: Output file path (default: `../../data/raw-scrapes/output.json`)

### Deduplication Tools

```bash
# Simple deduplication by URL
python dedupe_simple.py input.json -o output_deduped.json

# Compact deduplication with filtering
python dedupe_compact.py input.json -u "https://maxroll.gg/d4" -o output_compact.json

# Full deduplication with content analysis
python dedupe.py input.json -o output_full_deduped.json

# Analyze duplicates without removing them
python analyze_duplicates.py input.json
```

## Output

All scraped data is saved to `data/raw-scrapes/` in the monorepo root. The spider outputs:

- **JSON format**: Structured data with headings, paragraphs, links, images
- **Deduplicated**: Automatic removal of duplicate content
- **Sorted**: Content organized by URL structure
- **Compact**: Efficient storage format

## Integration with Pipeline

1. **Scrape**: Run scrapy to collect raw data
2. **Parse**: Use the parser package to convert to training blocks
3. **Annotate**: Use the annotator package to generate Q&A data
4. **Train**: Use the structured data for AI model training

## Configuration

The spider is configured for:
- **Respectful crawling**: 0.2s delay between requests
- **Concurrent requests**: 16 total, 8 per domain
- **Robots.txt compliance**: Enabled
- **Error handling**: Retry on 5xx and 429 errors
- **Performance**: Optimized for speed and reliability

## Dependencies

- Python 3.8+
- Scrapy
- BeautifulSoup4
- lxml

Install dependencies:
```bash
pip install scrapy beautifulsoup4 lxml
``` 