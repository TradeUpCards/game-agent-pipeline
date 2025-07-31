#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { ContentParser } from './parser';
import { ParseOptions } from './types';

const program = new Command();

program
  .name('game-agent-parser')
  .description('Parse scraped game content into structured training blocks')
  .version('1.0.0');

program
  .command('parse')
  .description('Parse a scraped JSON file into structured training blocks')
  .argument('<input-file>', 'Path to the scraped JSON file')
  .option('-o, --output <dir>', 'Output directory', './diablo-agent-training')
  .option('--dry-run', 'Preview what would be written without actually writing files')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (inputFile: string, options: any) => {
    try {
      const parseOptions: ParseOptions = {
        inputFile: path.resolve(inputFile),
        outputDir: path.resolve(options.output),
        dryRun: options.dryRun || false,
        verbose: options.verbose || false
      };

      if (parseOptions.verbose) {
        console.log('Parser Options:', parseOptions);
      }

      const parser = new ContentParser(parseOptions);
      const result = await parser.parse();

      if (result.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Default command for backward compatibility
program
  .argument('[input-file]', 'Path to the scraped JSON file')
  .option('-o, --output <dir>', 'Output directory', './diablo-agent-training')
  .option('--dry-run', 'Preview what would be written without actually writing files')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (inputFile: string, options: any) => {
    if (!inputFile) {
      console.error('Error: Input file is required');
      program.help();
      process.exit(1);
    }

    try {
      const parseOptions: ParseOptions = {
        inputFile: path.resolve(inputFile),
        outputDir: path.resolve(options.output),
        dryRun: options.dryRun || false,
        verbose: options.verbose || false
      };

      if (parseOptions.verbose) {
        console.log('Parser Options:', parseOptions);
      }

      const parser = new ContentParser(parseOptions);
      const result = await parser.parse();

      if (result.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(); 