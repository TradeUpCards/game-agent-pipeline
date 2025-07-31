#!/usr/bin/env tsx

/**
 * Script to analyze URLs with parameters from the scraped data
 */

import * as fs from 'fs';

function decodeUrlParams(search: string): string {
  try {
    const params = new URLSearchParams(search);
    const filters: string[] = [];
    
    // Extract class filter
    const classValue = params.get('filter[classes][value]');
    if (classValue) {
      const className = classValue.replace('d4-', '');
      filters.push(className);
    }
    
    // Extract meta filter
    const metaValue = params.get('filter[metas][value]');
    if (metaValue) {
      const metaName = metaValue.replace('d4-', '');
      filters.push(metaName);
    }
    
    // Extract build guide type filter
    const buildGuideValue = params.get('filter[build_guide_type][filters][0][value]');
    if (buildGuideValue) {
      filters.push(buildGuideValue);
    }
    
    return filters.join('-');
  } catch (error) {
    return 'unknown';
  }
}

async function analyzeUrls() {
  try {
    const data = fs.readFileSync('data/raw-scrapes/output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250728.json', 'utf8');
    const lines = data.split('\n');
    
    const buildGuideUrls = new Set<string>();
    
    for (const line of lines) {
      if (line.includes('"url"') && line.includes('build-guides')) {
        const urlMatch = line.match(/"url": "([^"]+)"/);
        if (urlMatch) {
          buildGuideUrls.add(urlMatch[1]);
        }
      }
    }
    
    console.log('=== Build Guide URLs with Parameters (Decoded) ===\n');
    
    const urlsWithParams = Array.from(buildGuideUrls)
      .filter(url => url.includes('?'))
      .sort();
    
    for (const url of urlsWithParams) {
      const urlObj = new URL(url);
      const decodedParams = decodeUrlParams(urlObj.search);
      console.log(`Base: ${urlObj.pathname}`);
      console.log(`Decoded: ${decodedParams}`);
      console.log(`Raw: ${urlObj.search.substring(0, 100)}...`);
      console.log('---');
    }
    
    console.log(`\nTotal build guide URLs with parameters: ${urlsWithParams.length}`);
    
    // Show suggested filename patterns
    console.log('\n=== Suggested Filename Patterns ===\n');
    for (const url of urlsWithParams.slice(0, 5)) {
      const urlObj = new URL(url);
      const decodedParams = decodeUrlParams(urlObj.search);
      const suggestedName = `build-guides-${decodedParams}`;
      console.log(`${suggestedName}.json`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeUrls(); 