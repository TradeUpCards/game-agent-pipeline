# Game Agent Pipeline — Monorepo PRD

## Overview

This monorepo provides a modular pipeline for building AI-powered game agents for different titles (e.g., Diablo IV, Fortnite). It consists of apps and packages that handle scraping, content processing, annotation, training preparation, and (eventually) a GUI frontend.

---

## Structure

```
game-agent-pipeline/
├── apps/
│   └── gui/                   # Next.js app (future) for dashboard + annotation UI
├── packages/
│   ├── annotator/             # Annotates cleaned content using OpenAI/LLM APIs
│   └── [others TBD]/          # Future shared tools or logic (e.g., tokenizer, file utils)
├── diablo-agent-training/     # Game-specific training data output (parsed .json content blocks)
├── tools/
│   ├── scrapy/                # Crawler project that scrapes maxroll.gg and other sites
│   ├── parse_maxroll_dump.ts  # Parses full spider JSON output into training JSONs
│   └── [more scripts here]    # Utility tools for converting, summarizing, validating
├── pnpm-workspace.yaml
└── package.json
```

---

## Goals

- ✅ Create a reusable pipeline for preparing structured training data per game
- ✅ Support scraping -> parsing -> annotating -> training
- ✅ Allow modular game-specific training data output
- ✅ Enable centralized management of shared logic (via packages)
- ✅ Add GUI frontend for visualization, QA review, tagging (future)

---

## Packages

### `annotator/`
- CLI tool that reads training JSON blocks and calls LLM APIs (OpenAI for now)
- Generates Q&A data for each block at 3 difficulty tiers (beginner, intermediate, expert)
- Supports `--dry-run` to estimate token/cost without using the API
- Future: Add model adapters (Ollama, Claude), add tagging/metadata support

### `[future]/parser`
- Shared logic for parsing scraped page content into `{ heading, content }[]` format

---

## Tools

### `scrapy/`
- Full Scrapy project for crawling game content (e.g., maxroll.gg)
- Outputs JSON dump with one entry per scraped page
- Future: Add spider for other games (Fortnite, LoL, etc.)

### `parse_maxroll_dump.ts`
- Converts full spider output into structured per-guide training blocks
- Organizes files by folder based on Maxroll section
- Used for building out `diablo-agent-training/`

---

## Apps

### `gui/` (Planned)
- Next.js app to display and annotate training content
- Show blocks, questions, and allow manual edits or overrides
- Live token estimate + model cost preview
- Will use Tailwind, shadcn/ui, and possibly integrate OpenAI moderation or scoring

---

## Usage Flow

1. `scrapy crawl maxroll` → outputs raw JSON file
2. `tsx tools/parse_maxroll_dump.ts` → creates game-agent blocks
3. `pnpm --filter annotator start diablo ./<block.json>` → annotates blocks into Q&A
4. [Optional] GUI frontend for tagging/approval
5. Output → used for fine-tuning or in-context embedding for game agent

---

## Future Plans

- 🧠 Add additional games (e.g., Fortnite) as parallel pipelines
- 🔁 Support embedding vector store (e.g., for retrieval-augmented agents)
- 🛠 Add versioning, history, and block-level annotations
- 🎨 Add UI/UX for agent trainers and player QA review
- 🧪 Add automated tests and content validators

---

## Tech Stack

- Node.js (v20+)
- pnpm workspaces
- tsx (TypeScript execution)
- Scrapy (Python spider)
- OpenAI API (GPT-4o or GPT-3.5)
- @dqbd/tiktoken (token estimation)
- (GUI planned with Next.js, Tailwind, shadcn/ui)

---

## Setup

```bash
# Install deps
pnpm install

# Run parser on raw scrape
pnpm dlx tsx tools/parse_maxroll_dump.ts

# Annotate a file (real run)
pnpm --filter annotator start diablo ./diablo-agent-training/gameplay_mechanics/renown.json

# Dry run cost estimate
pnpm --filter annotator start diablo ./... --dry-run --model=gpt-4o
```

---

Let me know when you're ready to build the GUI app and I'll scaffold it with Tailwind and shadcn/ui.