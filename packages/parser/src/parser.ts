import * as fs from 'fs';
import * as path from 'path';
import { ScrapedPage, ParsedContent, ParseOptions, ParseResult } from './types';
import { getTargetFolder, extractSlug } from './section-mapping';

export class ContentParser {
  private options: ParseOptions;
  private result: ParseResult;

  constructor(options: ParseOptions) {
    this.options = options;
    this.result = {
      totalPages: 0,
      pagesParsed: 0,
      pagesSkipped: 0,
      outputFolders: [],
      errors: []
    };
  }

  async parse(): Promise<ParseResult> {
    try {
      // Read and parse the input JSON file
      const inputData = await this.readInputFile();
      this.result.totalPages = inputData.length;

      if (this.options.verbose) {
        console.log(`Processing ${this.result.totalPages} pages...`);
      }

      // Process each page
      for (const page of inputData) {
        await this.processPage(page);
      }

      // Log summary
      this.logSummary();

      return this.result;
    } catch (error) {
      this.result.errors.push(`Failed to parse: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async readInputFile(): Promise<ScrapedPage[]> {
    try {
      const fileContent = await fs.promises.readFile(this.options.inputFile, 'utf-8');
      
      // Try to parse as JSON array first
      try {
        const jsonArray = JSON.parse(fileContent);
        if (Array.isArray(jsonArray)) {
          if (this.options.verbose) {
            console.log('Detected JSON array format');
          }
          return jsonArray;
        }
      } catch (jsonError) {
        // Not a JSON array, continue to JSONL parsing
      }

      // Parse as JSONL (JSON Lines) format
      if (this.options.verbose) {
        console.log('Detected JSONL format, parsing line by line...');
      }

      const lines = fileContent.trim().split('\n');
      const pages: ScrapedPage[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const page = JSON.parse(line);
          pages.push(page);
        } catch (lineError) {
          this.result.errors.push(`Failed to parse line ${i + 1}: ${lineError instanceof Error ? lineError.message : String(lineError)}`);
        }
      }

      if (pages.length === 0) {
        throw new Error('No valid JSON objects found in the file');
      }

      return pages;
    } catch (error) {
      throw new Error(`Failed to read input file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processPage(page: ScrapedPage): Promise<void> {
    try {
      // Handle different content structures
      let contentBlocks: any[] = [];
      
      // Check for contentBlocks (our expected format)
      if (page.contentBlocks && page.contentBlocks.length > 0) {
        contentBlocks = page.contentBlocks;
      }
      // Check for content.headings + content.paragraphs (actual scraped format)
      else if (page.content && page.content.headings && page.content.paragraphs) {
        // Convert headings and paragraphs to content blocks
        const headings = page.content.headings || [];
        const paragraphs = page.content.paragraphs || [];
        
        // Create content blocks from headings and paragraphs
        for (let i = 0; i < headings.length; i++) {
          const heading = headings[i];
          const nextHeading = headings[i + 1];
          
          // Find paragraphs that belong to this heading
          const startIndex = i;
          const endIndex = nextHeading ? paragraphs.findIndex((p: string, idx: number) => 
            p.includes(nextHeading.text)
          ) : paragraphs.length;
          
          const relevantParagraphs = paragraphs.slice(startIndex, endIndex);
          const content = relevantParagraphs.join(' ').trim();
          
          if (content) {
            contentBlocks.push({
              heading: heading.text,
              content: content
            });
          }
        }
        
        // If no headings, create a single block with all paragraphs
        if (contentBlocks.length === 0 && paragraphs.length > 0) {
          contentBlocks.push({
            heading: page.title || 'Content',
            content: paragraphs.join(' ').trim()
          });
        }
      }

      // Validate page has required content
      if (contentBlocks.length === 0) {
        this.result.pagesSkipped++;
        if (this.options.verbose) {
          console.log(`Skipping page "${page.title}" - no content blocks`);
        }
        return;
      }

      // Extract target folder and slug
      const targetFolder = getTargetFolder(page.url);
      const slug = extractSlug(page.url);

      if (slug === 'unknown') {
        this.result.pagesSkipped++;
        this.result.errors.push(`Could not extract slug from URL: ${page.url}`);
        return;
      }

      // Create output path
      const outputPath = path.join(this.options.outputDir, targetFolder);
      const outputFile = path.join(outputPath, `${slug}.json`);

      // Convert content blocks to parsed format
      const parsedContent: ParsedContent[] = contentBlocks.map(block => ({
        heading: block.heading,
        content: block.content
      }));

      if (this.options.dryRun) {
        if (this.options.verbose) {
          console.log(`[DRY RUN] Would write ${parsedContent.length} blocks to: ${outputFile}`);
        }
      } else {
        // Ensure output directory exists
        await fs.promises.mkdir(outputPath, { recursive: true });

        // Write the parsed content
        await fs.promises.writeFile(
          outputFile,
          JSON.stringify(parsedContent, null, 2),
          'utf-8'
        );

        // Track created folders
        if (!this.result.outputFolders.includes(targetFolder)) {
          this.result.outputFolders.push(targetFolder);
        }
      }

      this.result.pagesParsed++;

    } catch (error) {
      this.result.pagesSkipped++;
      this.result.errors.push(`Failed to process page "${page.title}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private logSummary(): void {
    console.log('\n=== Parse Summary ===');
    console.log(`Total pages: ${this.result.totalPages}`);
    console.log(`Pages parsed: ${this.result.pagesParsed}`);
    console.log(`Pages skipped: ${this.result.pagesSkipped}`);
    console.log(`Output folders: ${this.result.outputFolders.length}`);
    
    if (this.result.outputFolders.length > 0) {
      console.log('Folders created:');
      this.result.outputFolders.forEach(folder => console.log(`  - ${folder}`));
    }

    if (this.result.errors.length > 0) {
      console.log(`\nErrors encountered: ${this.result.errors.length}`);
      this.result.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
} 