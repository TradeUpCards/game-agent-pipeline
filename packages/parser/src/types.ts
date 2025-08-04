export interface ScrapedPage {
  title: string;
  url: string;
  contentBlocks: ContentBlock[];
  [key: string]: any; // Allow additional fields from scraper
}

export interface ContentBlock {
  heading: string;
  content: string;
}

export interface ParsedContent {
  heading: string;
  content: string;
}

// New hierarchical structure for boss content
export interface BossVersion {
  name: string;
  level?: number;
  hp?: string;
  staggerHp?: number;
  abilities: BossAbility[];
  strategies?: BossStrategy[];
}

export interface BossAbility {
  name: string;
  description: string;
  phase?: string;
  mechanics?: string[];
}

export interface BossStrategy {
  name: string;
  description: string;
  tips?: string[];
}

export interface HierarchicalContent {
  title: string;
  url: string;
  bossVersions?: BossVersion[];
  generalContent?: ParsedContent[];
}

export interface SectionMapping {
  [maxrollSection: string]: string;
}

export interface ParseOptions {
  inputFile: string;
  outputDir: string;
  dryRun?: boolean;
  verbose?: boolean;
  preserveHierarchy?: boolean; // New option to enable hierarchical parsing
}

export interface ParseResult {
  totalPages: number;
  pagesParsed: number;
  pagesSkipped: number;
  outputFolders: string[];
  errors: string[];
} 