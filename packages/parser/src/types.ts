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

export interface SectionMapping {
  [maxrollSection: string]: string;
}

export interface ParseOptions {
  inputFile: string;
  outputDir: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface ParseResult {
  totalPages: number;
  pagesParsed: number;
  pagesSkipped: number;
  outputFolders: string[];
  errors: string[];
} 