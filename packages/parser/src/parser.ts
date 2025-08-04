import * as fs from 'fs';
import * as path from 'path';
import { ScrapedPage, ParsedContent, ParseOptions, ParseResult, HierarchicalContent, BossVersion, BossAbility, BossStrategy } from './types';
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
      // Check if this is a boss page that should use hierarchical parsing
      const isBossPage = this.isBossPage(page);
      
      if (this.options.verbose) {
        console.log(`Processing page: ${page.title}`);
        console.log(`- Is boss page: ${isBossPage}`);
        console.log(`- Preserve hierarchy: ${this.options.preserveHierarchy}`);
      }
      
      // Always create content blocks version
      await this.processPageStandard(page);
      
      // Additionally create hierarchical version for boss pages when preserveHierarchy is enabled
      if (isBossPage && this.options.preserveHierarchy) {
        await this.processBossPageHierarchically(page);
      }

    } catch (error) {
      this.result.pagesSkipped++;
      this.result.errors.push(`Failed to process page "${page.title}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isBossPage(page: ScrapedPage): boolean {
    // Check if this is a boss guide page
    const bossKeywords = ['boss', 'echo', 'lilith', 'duriel', 'andariel', 'varshan', 'grigoire', 'ashava'];
    const title = page.title.toLowerCase();
    const url = page.url.toLowerCase();
    
    return bossKeywords.some(keyword => title.includes(keyword) || url.includes(keyword));
  }

  private async processBossPageHierarchically(page: ScrapedPage): Promise<void> {
    if (this.options.verbose) {
      console.log(`Processing boss page hierarchically: ${page.title}`);
    }

    // Extract hierarchical content
    const hierarchicalContent = this.extractHierarchicalContent(page);
    
    // Debug: Log the hierarchical content structure
    if (this.options.verbose) {
      console.log(`Hierarchical content for ${page.title}:`);
      console.log(`- Boss versions: ${hierarchicalContent.bossVersions?.length || 0}`);
      console.log(`- General content: ${hierarchicalContent.generalContent?.length || 0}`);
      console.log(`- Boss stats: Will be extracted per version`);
      
      if (hierarchicalContent.bossVersions && hierarchicalContent.bossVersions.length > 0) {
        hierarchicalContent.bossVersions.forEach((version, index) => {
          console.log(`  Boss version ${index + 1}: ${version.name} - ${version.abilities?.length || 0} abilities`);
        });
      }
    }

    // Extract target folder and slug
    const targetFolder = getTargetFolder(page.url);
    const slug = extractSlug(page.url);

    if (slug === 'unknown') {
      this.result.pagesSkipped++;
      this.result.errors.push(`Could not extract slug from URL: ${page.url}`);
      return;
    }

    // Create output path for hierarchical version
    const outputPath = path.join(this.options.outputDir, targetFolder);
    const outputFile = path.join(outputPath, `${slug}-hierarchical.json`);

    if (this.options.dryRun) {
      if (this.options.verbose) {
        console.log(`[DRY RUN] Would write hierarchical content to: ${outputFile}`);
        console.log(`[DRY RUN] Boss versions: ${hierarchicalContent.bossVersions?.length || 0}`);
        console.log(`[DRY RUN] General content blocks: ${hierarchicalContent.generalContent?.length || 0}`);
      }
    } else {
      // Ensure output directory exists
      await fs.promises.mkdir(outputPath, { recursive: true });

      // Write the hierarchical content
      await fs.promises.writeFile(
        outputFile,
        JSON.stringify(hierarchicalContent, null, 2),
        'utf-8'
      );

      // Track created folders
      if (!this.result.outputFolders.includes(targetFolder)) {
        this.result.outputFolders.push(targetFolder);
      }
    }

    this.result.pagesParsed++;
  }

  private extractHierarchicalContent(page: ScrapedPage): HierarchicalContent {
    const content: HierarchicalContent = {
      title: page.title,
      url: page.url,
      bossVersions: [],
      generalContent: []
    };

    // Handle both old and new content formats
    let headings: any[] = [];
    let paragraphs: any[] = [];

    if (Array.isArray(page.content)) {
      // New format: flat array of content items
      headings = page.content.filter(item => item.type === 'heading');
      paragraphs = page.content.filter(item => item.type === 'paragraph');
    } else if (page.content?.headings && page.content?.paragraphs) {
      // Old format: structured with headings and paragraphs arrays
      headings = page.content.headings;
      paragraphs = page.content.paragraphs;
    }

    if (headings.length === 0 || paragraphs.length === 0) {
      // Fallback to standard content blocks
      const contentBlocks = this.extractContentBlocks(page);
      content.generalContent = contentBlocks.map(block => ({
        heading: block.heading,
        content: block.content
      }));
      return content;
    }

    // Remove global boss stats extraction - will extract per version instead

    // Group content by boss versions
    let currentBossVersion: BossVersion | null = null;
    let currentAbility: BossAbility | null = null;
    let currentStrategy: BossStrategy | null = null;

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];

      // Find paragraphs that belong to this heading
      const headingParagraphs = this.getParagraphsForHeading(heading, page.content, nextHeading);

      if (heading.level === 3 && this.isBossVersionHeading(heading.text)) {
        // Save previous boss version if exists
        if (currentBossVersion) {
          content.bossVersions!.push(currentBossVersion);
        }

        // Start new boss version and extract its stats
        const bossStats = this.extractBossStatsForVersion(heading.text, page.content);
        currentBossVersion = {
          name: heading.text,
          level: bossStats?.level,
          hp: bossStats?.hp,
          staggerHp: bossStats?.staggerHp,
          abilities: [],
          strategies: []
        };
        currentAbility = null;
        currentStrategy = null;

      } else if (heading.level === 3 && currentBossVersion && this.isAbilityHeading(heading.text)) {
        // Save previous ability if exists
        if (currentAbility) {
          currentBossVersion.abilities.push(currentAbility);
        }

        // Start new ability
        currentAbility = {
          name: heading.text,
          description: headingParagraphs.join(' ').trim()
        };

      } else if (heading.level === 4 && heading.text.toLowerCase().includes('strategy') && currentBossVersion) {
        // Save previous strategy if exists
        if (currentStrategy) {
          currentBossVersion.strategies!.push(currentStrategy);
        }

        // Start new strategy
        currentStrategy = {
          name: heading.text,
          description: headingParagraphs.join(' ').trim()
        };

      } else if (currentAbility && headingParagraphs.length > 0) {
        // Add content to current ability
        currentAbility.description += ' ' + headingParagraphs.join(' ').trim();

      } else if (currentStrategy && headingParagraphs.length > 0) {
        // Add content to current strategy
        currentStrategy.description += ' ' + headingParagraphs.join(' ').trim();

      } else if (heading.level === 2 && !this.isBossVersionHeading(heading.text)) {
        // General content (H2 headings that aren't boss versions)
        content.generalContent!.push({
          heading: heading.text,
          content: headingParagraphs.join(' ').trim()
        });
      }
    }

    // Save final boss version, ability, and strategy
    if (currentAbility && currentBossVersion) {
      currentBossVersion.abilities.push(currentAbility);
    }
    if (currentStrategy && currentBossVersion) {
      currentBossVersion.strategies!.push(currentStrategy);
    }
    if (currentBossVersion) {
      content.bossVersions!.push(currentBossVersion);
    }

    return content;
  }

  private isBossVersionHeading(text: string): boolean {
    const bossVersionPatterns = [
      /echo of lilith/i,
      /hatred incarnate/i,
      /mother of mankind/i,
      /phase \d+/i
    ];
    return bossVersionPatterns.some(pattern => pattern.test(text));
  }

  private isAbilityHeading(text: string): boolean {
    const abilityPatterns = [
      /blood orb/i,
      /melee combo/i,
      /fissure/i,
      /ground slam/i,
      /waves/i,
      /homing souls/i,
      /tormented debuff/i
    ];
    return abilityPatterns.some(pattern => pattern.test(text));
  }

  private extractBossStatsForVersion(bossName: string, contentArray: any[]): { level: number; hp: string; staggerHp: number } | undefined {
    // Find content that comes after this boss version heading
    let foundBoss = false;
    let bossContent: string[] = [];
    
    for (const item of contentArray) {
      // Check if we've found our target boss version
      if (item.type === 'heading' && item.text === bossName) {
        foundBoss = true;
        continue;
      }
      
      // If we found our boss, collect content until next heading
      if (foundBoss) {
        if (item.type === 'heading') {
          break; // Stop at next heading
        }
        
        if (item.type === 'paragraph' && item.text) {
          bossContent.push(item.text);
        }
      }
    }
    
    // Look for boss stats in the collected content
    const combinedText = bossContent.join(' ');
    
    // Look for level, HP, and stagger HP patterns
    const levelMatch = combinedText.match(/Level:\s*(\d+)/i);
    const hpMatch = combinedText.match(/HP:\s*(~?[\d,]+)/i);
    const staggerMatch = combinedText.match(/Stagger HP:\s*(\d+)/i);
    
    if (levelMatch || hpMatch || staggerMatch) {
      return {
        level: levelMatch ? parseInt(levelMatch[1]) : 0,
        hp: hpMatch ? hpMatch[1].trim() : '',
        staggerHp: staggerMatch ? parseInt(staggerMatch[1]) : 0
      };
    }
    
    return undefined;
  }

  private extractBossStats(paragraphs: any[]): { level: number; hp: string; staggerHp: number } | undefined {
    for (const paragraph of paragraphs) {
      const text = paragraph.text || paragraph;
      const statsMatch = text.match(/Level:\s*(\d+)\s*HP:\s*(~?[\d,]+)\s*Stagger HP:\s*(\d+)/i);
      if (statsMatch) {
        return {
          level: parseInt(statsMatch[1]),
          hp: statsMatch[2],
          staggerHp: parseInt(statsMatch[3])
        };
      }
    }
    return undefined;
  }

  private getParagraphsForHeading(heading: any, contentArray: any[], nextHeading?: any): string[] {
    // Extract actual content for this heading
    const content: string[] = [];
    
    // Find content that comes after this heading until the next heading
    let foundHeading = false;
    
    for (const item of contentArray) {
      // Check if we've found our target heading
      if (item.type === 'heading' && item.text === heading.text) {
        foundHeading = true;
        continue;
      }
      
      // If we found our heading, start collecting content
      if (foundHeading) {
        // Stop if we hit another heading
        if (item.type === 'heading') {
          break;
        }
        
        // Collect non-heading content
        if (item.type === 'paragraph' && item.text) {
          content.push(item.text);
        } else if (item.type === 'list' && item.items) {
          content.push(item.items.join('. '));
        } else if (item.type === 'blockquote' && item.text) {
          content.push(`"${item.text}"`);
        } else if (item.type === 'figcaption' && item.text) {
          content.push(`Caption: ${item.text}`);
        }
      }
    }
    
    // If we didn't find any content, return a fallback
    if (content.length === 0) {
      return [`Content for ${heading.text}`];
    }
    
    return content;
  }

  private async processPageStandard(page: ScrapedPage): Promise<void> {
    // Handle different content structures
    let contentBlocks: any[] = [];
    
    // Check for contentBlocks (our expected format)
    if (page.contentBlocks && page.contentBlocks.length > 0) {
      contentBlocks = page.contentBlocks;
    }
    // Check for new format: content as array of objects with type/text/level
    else if (page.content && Array.isArray(page.content)) {
      // Convert new scraped format to content blocks
      let currentHeading = page.title || 'Content';
      let currentContent: string[] = [];
      
      for (const item of page.content) {
        if (item.type === 'heading') {
          // Save previous content block if we have content
          if (currentContent.length > 0) {
            contentBlocks.push({
              heading: currentHeading,
              content: currentContent.join(' ').trim()
            });
            currentContent = [];
          }
          // Start new heading
          currentHeading = item.text;
        } else if (item.type === 'paragraph') {
          currentContent.push(item.text);
        } else if (item.type === 'list') {
          currentContent.push(item.items.join(', '));
        } else if (item.type === 'blockquote') {
          currentContent.push(`"${item.text}"`);
        } else if (item.type === 'figcaption') {
          currentContent.push(`Caption: ${item.text}`);
        }
      }
      
      // Add final content block
      if (currentContent.length > 0) {
        contentBlocks.push({
          heading: currentHeading,
          content: currentContent.join(' ').trim()
        });
      }
    }
    // Check for old content.headings + content.paragraphs format
    else if (page.content && page.content.headings && page.content.paragraphs) {
      // Convert headings and paragraphs to content blocks
      const headings = page.content.headings || [];
      const paragraphs = page.content.paragraphs || [];
      
      // Simple approach: create a content block for each heading with all paragraphs
      // This assumes the paragraphs are general content for the page
      if (headings.length > 0) {
        for (const heading of headings) {
          if (paragraphs.length > 0) {
            contentBlocks.push({
              heading: heading.text,
              content: paragraphs.join(' ').trim()
            });
          }
        }
      }
      
      // If no headings but we have paragraphs, create a single block
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
  }

  private extractContentBlocks(page: ScrapedPage): any[] {
    // Handle different content structures
    let contentBlocks: any[] = [];
    
    // Check for contentBlocks (our expected format)
    if (page.contentBlocks && page.contentBlocks.length > 0) {
      contentBlocks = page.contentBlocks;
    }
    // Check for new format: content as array of objects with type/text/level
    else if (page.content && Array.isArray(page.content)) {
      // Convert new scraped format to content blocks
      let currentHeading = page.title || 'Content';
      let currentContent: string[] = [];
      
      for (const item of page.content) {
        if (item.type === 'heading') {
          // Save previous content block if we have content
          if (currentContent.length > 0) {
            contentBlocks.push({
              heading: currentHeading,
              content: currentContent.join(' ').trim()
            });
            currentContent = [];
          }
          // Start new heading
          currentHeading = item.text;
        } else if (item.type === 'paragraph') {
          currentContent.push(item.text);
        } else if (item.type === 'list') {
          currentContent.push(item.items.join(', '));
        } else if (item.type === 'blockquote') {
          currentContent.push(`"${item.text}"`);
        } else if (item.type === 'figcaption') {
          currentContent.push(`Caption: ${item.text}`);
        }
      }
      
      // Add final content block
      if (currentContent.length > 0) {
        contentBlocks.push({
          heading: currentHeading,
          content: currentContent.join(' ').trim()
        });
      }
    }
    // Check for old content.headings + content.paragraphs format
    else if (page.content && page.content.headings && page.content.paragraphs) {
      // Convert headings and paragraphs to content blocks
      const headings = page.content.headings || [];
      const paragraphs = page.content.paragraphs || [];
      
      // Simple approach: create a content block for each heading with all paragraphs
      // This assumes the paragraphs are general content for the page
      if (headings.length > 0) {
        for (const heading of headings) {
          if (paragraphs.length > 0) {
            contentBlocks.push({
              heading: heading.text,
              content: paragraphs.join(' ').trim()
            });
          }
        }
      }
      
      // If no headings but we have paragraphs, create a single block
      if (contentBlocks.length === 0 && paragraphs.length > 0) {
        contentBlocks.push({
          heading: page.title || 'Content',
          content: paragraphs.join(' ').trim()
        });
      }
    }

    return contentBlocks;
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