# @game-agent-pipeline/parser

A parser for converting scraped game content into structured training blocks for AI game agents.

## Features

- Parses scraped JSON content from game websites (e.g., Maxroll.gg)
- Organizes content by game sections and topics
- Extracts structured content blocks with headings and content
- Supports dry-run mode for previewing changes
- Provides detailed parsing statistics and error reporting

## Usage

### CLI Usage

```bash
# Parse a scraped JSON file
pnpm --filter @game-agent-pipeline/parser parse:maxroll ./data/raw-scrapes/maxroll-dump.json

# With custom output directory
pnpm --filter @game-agent-pipeline/parser parse:maxroll ./data/raw-scrapes/maxroll-dump.json -o ./custom-output

# Dry run to preview changes
pnpm --filter @game-agent-pipeline/parser parse:maxroll ./data/raw-scrapes/maxroll-dump.json --dry-run

# Verbose logging
pnpm --filter @game-agent-pipeline/parser parse:maxroll ./data/raw-scrapes/maxroll-dump.json -v
```

### Programmatic Usage

```typescript
import { ContentParser } from '@game-agent-pipeline/parser';

const parser = new ContentParser({
  inputFile: './data/raw-scrapes/maxroll-dump.json',
  outputDir: './diablo-agent-training',
  dryRun: false,
  verbose: true
});

const result = await parser.parse();
console.log(`Parsed ${result.pagesParsed} pages`);
```

## Input Format

The parser expects a JSON array of scraped pages with the following structure:

```json
[
  {
    "title": "Page Title",
    "url": "https://maxroll.gg/d4/getting-started/first-steps",
    "contentBlocks": [
      {
        "heading": "Introduction",
        "content": "This guide will help you get started..."
      },
      {
        "heading": "Getting Started",
        "content": "First, you'll want to..."
      }
    ]
  }
]
```

## Output Format

The parser creates a directory structure organized by game sections:

```
diablo-agent-training/
├── gameplay_mechanics/
│   ├── first-steps-in-diablo-4.json
│   └── renown.json
├── classes/
│   └── barbarian-guide.json
└── ...
```

Each output file contains an array of content blocks:

```json
[
  {
    "heading": "Introduction",
    "content": "This guide will help you get started..."
  },
  {
    "heading": "Getting Started", 
    "content": "First, you'll want to..."
  }
]
```

## Section Mapping

The parser maps Maxroll URL sections to target folders:

| Maxroll Section | Target Folder |
|----------------|---------------|
| `getting-started` | `gameplay_mechanics` |
| `classes` | `classes` |
| `leveling` | `leveling` |
| `systems` | `core_systems` |
| `world` | `world` |
| `endgame` | `endgame` |
| `tips` | `gameplay_mechanics` |
| `builds` | `builds` |
| `economy` | `economy` |
| `progression` | `gear` |

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev

# Run tests
pnpm test
``` 