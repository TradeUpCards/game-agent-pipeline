# Maxroll Scrape Parser

## Overview

This parser processes the full output JSON from the Maxroll Diablo IV “Getting Started” spider and organizes it into a structured content directory under `diablo-agent-training/`, categorized by topic and section. The output files are used to fine-tune or context-train an AI game agent.

---

## Goals

- ✅ Read the full JSON scrape from Maxroll (one entry per page)
- ✅ Extract per-page content (`heading` + `content` blocks)
- ✅ Derive slug and section from each page's URL
- ✅ Categorize pages into mapped folders based on section
- ✅ Output one clean `.json` file per page for training/annotation
- ✅ Skip or log any pages with missing/empty contentBlocks

---

## Input

- **Source file**:  
  `output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250728.json`  
  (JSON array; each entry is a scraped page with fields like `title`, `url`, `contentBlocks[]`)

---

## Output

Creates a directory tree like:

```
diablo-agent-training/
├── gameplay_mechanics/
│   ├── first-steps-in-diablo-4.json
│   ├── renown.json
│   └── leveling-tips.json
├── leveling/
│   └── altars-of-lilith.json
├── core_systems/
│   └── aspects.json
├── world/
│   └── strongholds.json
...
```

Each file contains:

```json
[
  {
    "heading": "Intro to Renown",
    "content": "Renown gives you permanent account-wide bonuses..."
  },
  {
    "heading": "How to Earn Renown",
    "content": "Complete side quests, find Lilith Altars, and explore."
  }
]
```

---

## Section Mapping

Maxroll’s `/d4/{section}/{slug}` format will be mapped as follows:

| Maxroll Section     | Target Folder             |
|---------------------|---------------------------|
| `getting-started`   | `gameplay_mechanics`       |
| `classes`           | `classes`                  |
| `leveling`          | `leveling`                 |
| `systems`           | `core_systems`             |
| `world`             | `world`                    |
| `endgame`           | `endgame`                  |
| `tips`              | `gameplay_mechanics`       |
| `builds`            | `builds`                   |
| `economy`           | `economy`                  |
| `progression`       | `gear`                     |
| (none/malformed)    | `misc`                     |

---

## Requirements

- 🧠 Extract `slug` from:  
  `slug = new URL(url).pathname.split("/d4/")[1]`

- 🧱 Target filename:  
  `${slug.replace("/", "__")}.json` inside mapped folder  
  (Use `__` if slug has multiple path parts to avoid nested folders)

- 🛑 If no `contentBlocks` or blocks are empty, log and skip

- 🧪 Each output JSON must be an array of:
  ```ts
  { heading: string; content: string; }
  ```

---

## Bonus (Optional)

- Log a summary at the end:
  - Total pages parsed
  - Pages skipped
  - Output folders created
- Validate that no output file is empty
- Add `--dry-run` mode to preview folder+file mapping without writing

---

## File Location

Place the script in:

```
tools/parse_maxroll_dump.ts
```

---

## Execution

From project root:

```bash
pnpm dlx tsx tools/parse_maxroll_dump.ts
```

---

Let me know if you want this turned into a full working TypeScript script.