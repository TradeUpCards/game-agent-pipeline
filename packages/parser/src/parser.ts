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
          
          // Check if this is an array of ScrapedPage objects or just content blocks
          if (jsonArray.length > 0 && jsonArray[0].title && jsonArray[0].url) {
            // This is an array of ScrapedPage objects
            return jsonArray;
          } else {
            // This is an array of content blocks, wrap it in a ScrapedPage object
            const fileName = path.basename(this.options.inputFile, '.json');
            const scrapedPage: ScrapedPage = {
              title: fileName,
              url: `https://maxroll.gg/d4/bosses/${fileName}`,
              contentBlocks: jsonArray
            };
            return [scrapedPage];
          }
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
      console.log(`- Sections:`);
      if (hierarchicalContent.sections) {
        Object.entries(hierarchicalContent.sections).forEach(([sectionType, items]) => {
          if (items && items.length > 0) {
            console.log(`  - ${sectionType}: ${items.length} items`);
          }
        });
      }
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

    // Handle different content formats
    let contentBlocks: any[] = [];

    if (Array.isArray(page.content)) {
      // Check if it's the new format with type/text fields
      const hasTypeField = page.content.some(item => item.type);
      
      if (hasTypeField) {
        return this.processHierarchicalWithTypeFields(page.content, page.title, page.url);
      } else {
        // Simple format: array of {heading, content} objects
        contentBlocks = page.content;
      }
    } else if (page.content?.headings && page.content?.paragraphs) {
      // Old format: structured with headings and paragraphs arrays
      return this.processHierarchicalWithTypeFields(page.content, page.title, page.url);
    } else if (page.contentBlocks) {
      // Direct contentBlocks format
      contentBlocks = page.contentBlocks;
    }

    // Process simple content blocks format
    if (contentBlocks.length > 0) {
      return this.processHierarchicalWithContentBlocks(contentBlocks, page.title);
    }

    // Fallback to standard content blocks
    const fallbackBlocks = this.extractContentBlocks(page);
    content.generalContent = fallbackBlocks.map(block => ({
      heading: block.heading,
      content: block.content
    }));
    return content;
  }

  private processHierarchicalWithTypeFields(contentArray: any[], pageTitle: string, pageUrl: string): HierarchicalContent {
    const content: HierarchicalContent = {
      title: pageTitle,
      url: pageUrl,
      bossVersions: [],
      generalContent: [],
      sections: {
        introduction: [],
        mechanics: [],
        fightProgression: [],
        advancedStrategy: [],
        summary: [],
        footer: []
      }
    };

    // Extract boss name from page title (e.g., "Echo of Lilith" from "Echo of Lilith - D4 Maxroll.gg")
    const bossName = this.extractBossNameFromTitle(pageTitle);

    // First, identify boss versions by scanning for figcaptions and their associated stats
    const bossVersions = this.identifyBossVersionsFromContent(contentArray, bossName);
    content.bossVersions = bossVersions;

    // Extract headings and paragraphs
    const headings = contentArray.filter(item => item.type === 'heading');
    const paragraphs = contentArray.filter(item => item.type === 'paragraph');

    // Group content by boss versions
    let currentBossVersion: BossVersion | null = null;
    let currentAbility: BossAbility | null = null;

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];

      // Find paragraphs that belong to this heading
      const headingParagraphs = this.getParagraphsForHeading(heading, contentArray, nextHeading);

      // Check if this heading matches one of our pre-identified boss versions
      const matchingBossVersion = content.bossVersions!.find(bv => bv.name === heading.text);
      
      if (heading.level === 3 && matchingBossVersion) {
        // Save current ability before switching boss versions
        if (currentAbility && currentBossVersion) {
          currentBossVersion.abilities.push(currentAbility);
        }
        
        // Switch to this boss version
        currentBossVersion = matchingBossVersion;
        currentAbility = null;

      } else if (heading.level === 3 && currentBossVersion && !matchingBossVersion) {
        // Check if this is actually an ability or general content
        const isAbility = this.isAbilityHeading(heading.text);
        
        if (isAbility) {
          // Save previous ability if exists
          if (currentAbility) {
            currentBossVersion.abilities.push(currentAbility);
          }

          // Start new ability
          currentAbility = {
            name: heading.text,
            description: headingParagraphs.join(' ').trim()
          };
        } else {
          // This is general content, not an ability - categorize it
          const sectionType = this.categorizeSection(heading.text);
          const sectionContent = {
            heading: heading.text,
            content: headingParagraphs.join(' ').trim()
          };
          
          if (sectionType !== 'general') {
            content.sections![sectionType]!.push(sectionContent);
          } else {
            content.generalContent!.push(sectionContent);
          }
        }

      } else if (heading.level === 4 && heading.text.toLowerCase().includes('strategy') && currentBossVersion) {
        // Assign strategy to current ability or last ability
        const targetAbility = currentAbility || (currentBossVersion.abilities.length > 0 ? currentBossVersion.abilities[currentBossVersion.abilities.length - 1] : null);
        if (targetAbility) {
          targetAbility.strategy = headingParagraphs.join(' ').trim();
        }

      } else if (currentAbility && headingParagraphs.length > 0) {
        // Add content to current ability
        currentAbility.description += ' ' + headingParagraphs.join(' ').trim();

      } else if (heading.level === 2) {
        // Categorize H2 headings into appropriate sections
        const sectionType = this.categorizeSection(heading.text);
        const sectionContent = {
          heading: heading.text,
          content: headingParagraphs.join(' ').trim()
        };
        
        if (sectionType !== 'general') {
          content.sections![sectionType]!.push(sectionContent);
        } else {
          content.generalContent!.push(sectionContent);
        }
      }
    }

    // Save final ability
    if (currentAbility && currentBossVersion) {
      currentBossVersion.abilities.push(currentAbility);
    }

    return content;
  }

  private extractBossNameFromTitle(pageTitle: string): string {
    // Extract boss name from page title (e.g., "Echo of Lilith" from "Echo of Lilith - D4 Maxroll.gg")
    const match = pageTitle.match(/^([^-]+)/);
    return match ? match[1].trim() : pageTitle;
  }

  private hasBossStatsInContent(content: string): boolean {
    // Check if content contains boss stats patterns
    return /level:\s*\d+.*hp:\s*[~]?[\d,]+.*stagger hp:\s*\d+/i.test(content);
  }

  private identifyBossVersionsFromContent(contentArray: any[], bossName: string): BossVersion[] {
    const bossVersions: BossVersion[] = [];
    let currentBossName: string | null = null;
    let lastProcessedBossName: string | null = null;
    
    for (let i = 0; i < contentArray.length; i++) {
      const item = contentArray[i];
      
      // Look for figcaptions that contain the boss name
      if (item.type === 'figcaption' && item.text.toLowerCase().includes(bossName.toLowerCase())) {
        // Only update currentBossName if it's different from the last processed one
        if (item.text !== lastProcessedBossName) {
          currentBossName = item.text;
        }
        continue;
      }
      
      // If we found a boss name, look for stats in the next paragraph
      if (currentBossName && item.type === 'paragraph' && this.hasBossStatsInContent(item.text)) {
        const stats = this.extractBossStatsFromContent(item.text);
        if (stats) {
          // Check if this boss version already exists to avoid duplicates
          const existingBossVersion = bossVersions.find(bv => bv.name === currentBossName);
          if (!existingBossVersion) {
            bossVersions.push({
              name: currentBossName,
              level: stats.level,
              hp: stats.hp,
              staggerHp: stats.staggerHp,
              abilities: []
            });
            lastProcessedBossName = currentBossName;
          }
        }
        currentBossName = null; // Reset for next boss version
      }
    }
    
    return bossVersions;
  }

  private isAbilityHeading(headingText: string): boolean {
    // Check if this heading represents an ability vs general content
    const abilityKeywords = [
      'blood orb creation', 'melee combo', 'fissure', 'wave of spikes', 
      'death from above', 'ground slam', 'shadow clone', 'flight'
    ];
    
    const generalContentKeywords = [
      'minion phase', 'platform break', 'lilith, mother of mankind',
      'fight progression', 'general strategy', 'tips', 'tricks', 'cheese',
      'credits', 'echo of andariel', 'echo of varshan', 'boss guide',
      'terms of service', 'privacy policy', 'accessibility', 'refund policy',
      'imprint', 'contact us', 'cookie policy'
    ];
    
    const lowerHeading = headingText.toLowerCase();
    
    // Check for general content keywords first
    for (const keyword of generalContentKeywords) {
      if (lowerHeading.includes(keyword)) {
        return false;
      }
    }
    
    // Check for ability keywords
    for (const keyword of abilityKeywords) {
      if (lowerHeading.includes(keyword)) {
        return true;
      }
    }
    
    // Default to ability if it's a short, specific heading (likely an ability)
    return headingText.length < 50 && !lowerHeading.includes('phase') && !lowerHeading.includes('break');
  }

  private categorizeSection(headingText: string): 'introduction' | 'mechanics' | 'fightProgression' | 'advancedStrategy' | 'summary' | 'footer' | 'general' {
    const lowerHeading = headingText.toLowerCase();
    
    // Introduction sections
    if (lowerHeading.includes('table of contents') || 
        lowerHeading === 'echo of lilith' ||
        lowerHeading.includes('recommended stats') ||
        lowerHeading.includes('overview')) {
      return 'introduction';
    }
    
    // Mechanics sections
    if (lowerHeading.includes('tormented debuff') ||
        lowerHeading.includes('attacks and abilities') ||
        lowerHeading.includes('mechanics')) {
      return 'mechanics';
    }
    
    // Fight progression sections
    if (lowerHeading.includes('fight progression') ||
        lowerHeading.includes('general strategy') ||
        lowerHeading.includes('minion phase') ||
        lowerHeading.includes('platform break') ||
        lowerHeading.includes('lilith, mother of mankind')) {
      return 'fightProgression';
    }
    
    // Advanced strategy sections
    if (lowerHeading.includes('tips') ||
        lowerHeading.includes('tricks') ||
        lowerHeading.includes('cheese') ||
        lowerHeading.includes('advanced')) {
      return 'advancedStrategy';
    }
    
    // Summary sections
    if (lowerHeading.includes('summary') ||
        lowerHeading.includes('conclusion') ||
        lowerHeading.includes('key points')) {
      return 'summary';
    }
    
    // Footer sections
    if (lowerHeading.includes('credits') ||
        lowerHeading.includes('echo of andariel') ||
        lowerHeading.includes('echo of varshan') ||
        lowerHeading.includes('terms of service') ||
        lowerHeading.includes('privacy policy') ||
        lowerHeading.includes('accessibility') ||
        lowerHeading.includes('refund policy') ||
        lowerHeading.includes('imprint') ||
        lowerHeading.includes('contact us') ||
        lowerHeading.includes('cookie policy')) {
      return 'footer';
    }
    
    return 'general';
  }

  private processHierarchicalWithContentBlocks(contentBlocks: any[], pageTitle?: string): HierarchicalContent {
    const content: HierarchicalContent = {
      title: '',
      url: '',
      bossVersions: [],
      generalContent: []
    };

    let currentBossVersion: BossVersion | null = null;
    let currentAbility: BossAbility | null = null;

    for (const block of contentBlocks) {
      const heading = block.heading;
      const blockContent = block.content;

      // Special handling for the first content block that contains multiple boss versions
      if (heading === "Echo of Lilith" && blockContent.includes("Caption: Echo of Lilith, Hatred Incarnate")) {
        // Extract both boss versions from this content block
        const bossVersions = this.extractMultipleBossVersionsFromContent(blockContent);
        content.bossVersions!.push(...bossVersions);
        
        // Set the first boss version as current for subsequent content
        if (bossVersions.length > 0) {
          currentBossVersion = bossVersions[0];
        }
        continue;
      }

      // Detect transition to second boss version based on content patterns
      if (heading === "Blood Orb Creation (single)" && currentBossVersion && 
          currentBossVersion.name === "Echo of Lilith, Hatred Incarnate") {
        // Switch to the second boss version
        const secondBossVersion = content.bossVersions!.find(bv => bv.name === "Echo of Lilith, Mother of Mankind");
        if (secondBossVersion) {
          currentBossVersion = secondBossVersion;
          console.log(`Switched to boss version: ${currentBossVersion.name}`);
        }
      }

      const category = this.categorizeContent(heading, blockContent, pageTitle);
      
      if (category === 'boss-version') {
        // Save previous boss version if exists
        if (currentBossVersion) {
          content.bossVersions!.push(currentBossVersion);
        }

        // Find the boss version by name in both the array and the current boss version
        let existingBossVersion = content.bossVersions!.find(bv => bv.name === heading);
        if (!existingBossVersion && currentBossVersion && currentBossVersion.name === heading) {
          existingBossVersion = currentBossVersion;
        }
        
        if (existingBossVersion) {
          currentBossVersion = existingBossVersion;
        } else {
          // Start new boss version and extract its stats
          const bossStats = this.extractBossStatsFromContent(blockContent);
          if (this.options.verbose) {
            console.log(`Found boss version: ${heading}`);
            console.log(`Content: ${blockContent}`);
            console.log(`Extracted stats:`, bossStats);
          }
          currentBossVersion = {
            name: heading,
            level: bossStats?.level,
            hp: bossStats?.hp,
            staggerHp: bossStats?.staggerHp,
            abilities: []
          };
        }
        currentAbility = null;

      } else if (category === 'ability' && currentBossVersion) {
        // Save previous ability if exists
        if (currentAbility) {
          currentBossVersion.abilities.push(currentAbility);
        }

        // Start new ability
        currentAbility = {
          name: heading,
          description: blockContent
        };
      } else if (category === 'strategy' && currentBossVersion) {
        // Strategy always goes with the previous ability
        if (currentAbility) {
          // If we have a current ability, attach strategy to it
          currentAbility.strategy = blockContent;
        } else {
          // If no current ability, attach to the last ability in the list
          const lastAbility = currentBossVersion.abilities[currentBossVersion.abilities.length - 1];
          if (lastAbility && !lastAbility.strategy) {
            lastAbility.strategy = blockContent;
                  } else {
          // If no current ability and no last ability, create a new ability with this strategy
          currentAbility = {
            name: heading,
            description: '',
            strategy: blockContent
          };
        }
        }

      } else if (currentAbility) {
        // Add content to current ability
        currentAbility.description += ' ' + blockContent;

      } else {
        // General content
        content.generalContent!.push({
          heading: heading,
          content: blockContent
        });
      }
    }

    // Save final boss version and ability
    if (currentAbility && currentBossVersion) {
      currentBossVersion.abilities.push(currentAbility);
    }
    if (currentBossVersion) {
      content.bossVersions!.push(currentBossVersion);
    }

    return content;
  }

  private extractBossStatsFromContent(content: string): { level: number; hp: string; staggerHp: number } | undefined {
    // Look for boss stats patterns in the content
    const levelMatch = content.match(/level:\s*(\d+)/i);
    const hpMatch = content.match(/hp:\s*(~?[\d,]+)/i);
    const staggerMatch = content.match(/stagger hp:\s*(\d+)/i);
    
    if (levelMatch || hpMatch || staggerMatch) {
      return {
        level: levelMatch ? parseInt(levelMatch[1]) : 0,
        hp: hpMatch ? hpMatch[1].trim() : '',
        staggerHp: staggerMatch ? parseInt(staggerMatch[1]) : 0
      };
    }
    
    return undefined;
  }

  private extractMultipleBossVersionsFromContent(content: string): BossVersion[] {
    const bossVersions: BossVersion[] = [];
    
    // Split content by "Caption:" to find boss versions
    const parts = content.split(/Caption:\s*/);
    
    for (let i = 1; i < parts.length; i++) { // Skip first part (before first Caption)
      const part = parts[i].trim();
      
      // Look for boss version names
      if (part.includes("Echo of Lilith, Hatred Incarnate")) {
        // Extract stats for Hatred Incarnate
        const statsMatch = part.match(/Level:\s*(\d+)\s*HP:\s*(~?[\d,]+)\s*Stagger HP:\s*(\d+)/i);
        if (statsMatch) {
          bossVersions.push({
            name: "Echo of Lilith, Hatred Incarnate",
            level: parseInt(statsMatch[1]),
            hp: statsMatch[2].trim(),
            staggerHp: parseInt(statsMatch[3]),
            abilities: []
          });
        }
      } else if (part.includes("Echo of Lilith, Mother of Mankind")) {
        // Extract stats for Mother of Mankind
        const statsMatch = part.match(/Level:\s*(\d+)\s*HP:\s*(~?[\d,]+)\s*Stagger HP:\s*(\d+)/i);
        if (statsMatch) {
          bossVersions.push({
            name: "Echo of Lilith, Mother of Mankind",
            level: parseInt(statsMatch[1]),
            hp: statsMatch[2].trim(),
            staggerHp: parseInt(statsMatch[3]),
            abilities: []
          });
        }
      }
    }
    
    return bossVersions;
  }

  private categorizeContent(heading: string, content: string, pageTitle?: string): 'boss-version' | 'ability' | 'strategy' | 'general' {
    // Check if content contains boss stats (level, HP, stagger HP)
    const hasBossStats = /level:\s*\d+.*hp:\s*[~]?[\d,]+.*stagger hp:\s*\d+/i.test(content);
    
    // Check if heading contains a comma (likely "Boss Name, Version" format)
    const hasCommaInHeading = heading.includes(',');
    
    // Dynamic boss version detection based on page title and common patterns
    const isBossVersion = hasBossStats || 
                         ((hasCommaInHeading || heading === "Echo of Lilith, Hatred Incarnate" || heading === "Echo of Lilith, Mother of Mankind") && 
                          !heading.toLowerCase().includes('tips') &&
                          !heading.toLowerCase().includes('tricks') &&
                          !heading.toLowerCase().includes('progression') &&
                          !heading.toLowerCase().includes('platform') &&
                          !heading.toLowerCase().includes('minion') &&
                          ((pageTitle && heading.toLowerCase().includes(pageTitle.toLowerCase().replace(/-/g, ' ').replace('d4 maxroll.gg', '').trim())) ||
                           // Also detect boss version names that are variations of the main boss
                           (pageTitle && pageTitle.toLowerCase().includes('lilith') && heading.toLowerCase().includes('lilith'))));
    
    // Simple heading-based categorization
    if (isBossVersion) {
      return 'boss-version';
    } else if (heading.toLowerCase() === 'strategy') {
      return 'strategy';
    } else if (heading.toLowerCase() !== 'strategy') {
      return 'ability';
    } else {
      return 'general';
    }
  }

  private extractBossStatsForVersion(bossName: string, contentArray: any[]): { level: number; hp: string; staggerHp: number } | undefined {
    // Look for boss stats in the early paragraphs of the page
    // The stats are typically found after figcaption elements with the boss name
    let foundBossCaption = false;
    let statsParagraph: string | null = null;
    
    for (const item of contentArray) {
      // Check if we've found the figcaption for our target boss version
      if (item.type === 'figcaption' && item.text === bossName) {
        foundBossCaption = true;
        continue;
      }
      
      // If we found our boss caption, look for the next paragraph with stats
      if (foundBossCaption && item.type === 'paragraph' && item.text) {
        // Check if this paragraph contains boss stats
        if (item.text.match(/Level:\s*\d+.*HP:\s*[~]?[\d,]+.*Stagger HP:\s*\d+/i)) {
          statsParagraph = item.text;
          break;
        }
      }
      
      // Stop looking if we hit another figcaption (next boss version)
      if (foundBossCaption && item.type === 'figcaption') {
        break;
      }
    }
    
    if (statsParagraph) {
      // Extract stats from the paragraph
      const levelMatch = statsParagraph.match(/Level:\s*(\d+)/i);
      const hpMatch = statsParagraph.match(/HP:\s*(~?[\d,]+)/i);
      const staggerMatch = statsParagraph.match(/Stagger HP:\s*(\d+)/i);
      
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