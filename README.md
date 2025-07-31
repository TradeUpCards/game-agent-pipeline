# Game Agent Pipeline

A modular pipeline for building AI-powered game agents for different titles (e.g., Diablo IV, Fortnite). This monorepo provides tools for scraping, content processing, annotation, and training preparation.

## 🏗️ Structure

```
game-agent-pipeline/
├── apps/
│   └── gui/                   # Next.js app (future) for dashboard + annotation UI
├── packages/
│   ├── parser/               # Converts scraped content into structured training blocks
│   └── annotator/            # Generates Q&A data using LLM APIs (future)
├── tools/
│   ├── scrapy/               # Web scraping tool for collecting game content
│   └── parse_maxroll_dump.ts # Legacy parser script
├── data/
│   └── raw-scrapes/          # Raw scraped data from scrapy
├── diablo-agent-training/    # Processed training data output
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies for scrapy
cd tools/scrapy
pip install -r requirements.txt
cd ../..
```

### 2. Scrape Game Content

```bash
# Scrape Maxroll D4 content
cd tools/scrapy
scrapy crawl maxroll -a output_file="../../data/raw-scrapes/maxroll_d4.json"
cd ../..
```

### 3. Parse Scraped Data

```bash
# Parse raw scraped data into training blocks
pnpm dlx tsx tools/parse_maxroll_dump.ts data/raw-scrapes/maxroll_d4.json
```

### 4. View Results

The parsed data will be available in `diablo-agent-training/` organized by content type:
- `gameplay_mechanics/` - Core game systems
- `builds/` - Character builds and guides
- `classes/` - Class-specific content
- `quests/` - Quest guides
- `news/` - Game news and updates
- And more...

## 🛠️ Tools

### Scrapy Tool (`tools/scrapy/`)

Web scraping tool for collecting game content from websites like Maxroll.gg.

**Features:**
- Configurable depth and page limits
- Automatic deduplication
- Respectful crawling (respects robots.txt)
- Multiple output formats

**Usage:**
```bash
cd tools/scrapy
scrapy crawl maxroll -a start_urls="https://maxroll.gg/d4/builds" -a output_file="../../data/raw-scrapes/builds.json"
```

### Parser Package (`packages/parser/`)

Converts raw scraped data into structured training blocks.

**Features:**
- Handles JSONL and JSON array formats
- Intelligent content categorization
- Meaningful filename generation
- Dry-run mode for testing

**Usage:**
```bash
pnpm --filter @game-agent-pipeline/parser parse:maxroll data/raw-scrapes/input.json
```

## 📋 Usage Flow

1. **Scrape**: Use scrapy to collect raw content from gaming websites
2. **Parse**: Convert raw data into structured training blocks
3. **Annotate**: Generate Q&A data using LLM APIs (future)
4. **Train**: Use structured data for AI model training

## 🔧 Development

### Adding New Games

1. Create a new spider in `tools/scrapy/scraper/spiders/`
2. Update section mapping in `packages/parser/src/section-mapping.ts`
3. Test with sample data
4. Add to the pipeline

### Adding New Content Types

1. Update the section mapping in the parser
2. Test categorization logic
3. Verify output structure

## 📚 Documentation

- [Product Requirements Document](game_agent_pipeline.prd.md)
- [Parser Package Documentation](packages/parser/README.md)
- [Scrapy Tool Documentation](tools/scrapy/README.md)

## 🎯 Future Plans

- [ ] GUI frontend for visualization and annotation
- [ ] Support for additional games (Fortnite, LoL, etc.)
- [ ] Vector store integration for retrieval-augmented agents
- [ ] Automated content validation and quality checks
- [ ] Versioning and history tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 