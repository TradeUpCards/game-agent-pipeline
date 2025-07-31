import { SectionMapping } from './types';

export const MAXROLL_SECTION_MAPPING: SectionMapping = {
  // Core sections
  'getting-started': 'gameplay_mechanics',
  'classes': 'classes',
  'leveling': 'leveling',
  'systems': 'core_systems',
  'world': 'world',
  'endgame': 'endgame',
  'tips': 'gameplay_mechanics',
  'builds': 'builds',
  'economy': 'economy',
  'progression': 'gear',
  
  // Additional sections from actual URLs
  'bosses': 'bosses',
  'build-guides': 'builds',
  'tierlists': 'tier_lists',
  'meta': 'meta',
  'news': 'news',
  'database': 'database',
  'map-tool': 'tools',
  'planner': 'tools',
  'resources': 'resources',
  'wiki': 'wiki',
  'guides': 'guides',
  
  // Specific game mechanics
  'dungeons': 'dungeons',
  'strongholds': 'strongholds',
  'events': 'events',
  'seasons': 'seasons',
  'pvp': 'pvp',
  'crafting': 'crafting',
  'items': 'items',
  'uniques': 'items',
  'aspects': 'items',
  'runes': 'items',
  'runewords': 'items',
  
  // Class-specific
  'barbarian': 'classes',
  'sorcerer': 'classes',
  'rogue': 'classes',
  'druid': 'classes',
  'necromancer': 'classes',
  'spiritborn': 'classes',
  
  // Content types
  'side-quests': 'quests',
  'side-quest': 'quests',  // Added this pattern
  'main-quest': 'quests',
  'quests': 'quests',
  'regions': 'world',
  'areas': 'world',
  'locations': 'world',
};

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

export function getTargetFolder(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Look for /d4/ pattern in the URL
    const d4Index = pathParts.findIndex((part: string) => part === 'd4');
    if (d4Index === -1 || d4Index + 1 >= pathParts.length) {
      return 'misc';
    }
    
    const section = pathParts[d4Index + 1];
    return MAXROLL_SECTION_MAPPING[section] || 'misc';
  } catch (error) {
    return 'misc';
  }
}

export function extractSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Handle main category pages
    if (pathParts.length === 1 && pathParts[0] === 'd4') {
      return 'diablo-4-home';
    }
    
    // Look for /d4/ pattern
    const d4Index = pathParts.findIndex((part: string) => part === 'd4');
    if (d4Index === -1) {
      return 'unknown';
    }
    
    let slug: string;
    
    // If it's just /d4/section, use the section name
    if (d4Index + 1 < pathParts.length && d4Index + 2 >= pathParts.length) {
      slug = pathParts[d4Index + 1];
    }
    // If it's /d4/section/slug, use the slug
    else if (d4Index + 2 < pathParts.length) {
      slug = pathParts[d4Index + 2];
    }
    else {
      return 'unknown';
    }
    
    // Add meaningful parameter names if they exist
    if (urlObj.search) {
      const decodedParams = decodeUrlParams(urlObj.search);
      if (decodedParams && decodedParams !== 'unknown') {
        slug = `${slug}-${decodedParams}`;
      }
    }
    
    return slug;
  } catch (error) {
    return 'unknown';
  }
} 