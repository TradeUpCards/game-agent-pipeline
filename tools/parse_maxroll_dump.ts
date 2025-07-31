#!/usr/bin/env tsx

/**
 * Sample script for parsing Maxroll scraped data
 * 
 * This script demonstrates how to use the parser package to convert
 * scraped JSON content into structured training blocks.
 * 
 * Usage:
 *   tsx tools/parse_maxroll_dump.ts [input-file] [options]
 */

import { ContentParser } from '../packages/parser/src/parser';
import { ParseOptions } from '../packages/parser/src/types';
import * as path from 'path';

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  // Parse arguments
  let inputFile = '';
  let outputDir = './diablo-agent-training';
  let dryRun = false;
  let verbose = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i] || './diablo-agent-training';
    } else if (!inputFile) {
      inputFile = arg;
    } else if (!outputDir || outputDir === './diablo-agent-training') {
      outputDir = arg;
    }
  }

  if (!inputFile) {
    console.error('Usage: tsx tools/parse_maxroll_dump.ts <input-file> [output-dir] [--dry-run] [--verbose]');
    console.error('');
    console.error('Examples:');
    console.error('  tsx tools/parse_maxroll_dump.ts data/raw-scrapes/maxroll-dump.json');
    console.error('  tsx tools/parse_maxroll_dump.ts data/raw-scrapes/maxroll-dump.json ./custom-output --dry-run');
    console.error('  tsx tools/parse_maxroll_dump.ts data/raw-scrapes/maxroll-dump.json -v');
    process.exit(1);
  }

  const parseOptions: ParseOptions = {
    inputFile: path.resolve(inputFile),
    outputDir: path.resolve(outputDir),
    dryRun,
    verbose
  };

  if (verbose) {
    console.log('Parser Options:', parseOptions);
  }

  try {
    const parser = new ContentParser(parseOptions);
    const result = await parser.parse();

    if (result.errors.length > 0) {
      console.error(`\nParsing completed with ${result.errors.length} errors.`);
      process.exit(1);
    }

    console.log(`\n✅ Parsing completed successfully!`);
    console.log(`📁 Output directory: ${outputDir}`);
  } catch (error) {
    console.error('❌ Parsing failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 