const fs = require('fs');
const path = require('path');

// Test the new hierarchical parser structure
async function testHierarchicalParser() {
  console.log('🧪 Testing Hierarchical Parser Structure\n');

  // Read the Echo of Lilith data
  const filePath = path.join(__dirname, '..', 'data', 'raw-scrapes', 'output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250801.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    // Find Echo of Lilith page
    let echoOfLilithPage = null;
    for (const line of lines) {
      const page = JSON.parse(line);
      if (page.title && page.title.toLowerCase().includes('echo of lilith')) {
        echoOfLilithPage = page;
        break;
      }
    }

    if (!echoOfLilithPage) {
      console.log('❌ Echo of Lilith page not found');
      return;
    }

    console.log('✅ Found Echo of Lilith page');
    console.log(`📄 Title: ${echoOfLilithPage.title}`);
    console.log(`🔗 URL: ${echoOfLilithPage.url}\n`);

    // Analyze the structure
    const headings = echoOfLilithPage.content?.headings || [];
    const paragraphs = echoOfLilithPage.content?.paragraphs || [];

    console.log('📊 Content Analysis:');
    console.log(`   Headings: ${headings.length}`);
    console.log(`   Paragraphs: ${paragraphs.length}\n`);

    // Show the hierarchical structure that would be created
    console.log('🏗️  Hierarchical Structure (What the new parser would create):\n');

    // Extract boss versions
    const bossVersions = [];
    let currentBossVersion = null;

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      
      if (heading.level === 3 && isBossVersionHeading(heading.text)) {
        if (currentBossVersion) {
          bossVersions.push(currentBossVersion);
        }
        
        currentBossVersion = {
          name: heading.text,
          abilities: [],
          strategies: []
        };
        
        console.log(`🎯 Boss Version: ${heading.text}`);
        
      } else if (heading.level === 3 && currentBossVersion && isAbilityHeading(heading.text)) {
        const ability = {
          name: heading.text,
          description: '...' // Would contain actual description
        };
        currentBossVersion.abilities.push(ability);
        
        console.log(`   ⚔️  Ability: ${heading.text}`);
        
      } else if (heading.level === 4 && heading.text.toLowerCase().includes('strategy') && currentBossVersion) {
        const strategy = {
          name: heading.text,
          description: '...' // Would contain actual description
        };
        currentBossVersion.strategies.push(strategy);
        
        console.log(`   📋 Strategy: ${heading.text}`);
      }
    }

    if (currentBossVersion) {
      bossVersions.push(currentBossVersion);
    }

    console.log('\n📈 Expected Output Structure:');
    console.log('```json');
    console.log('{');
    console.log('  "title": "Echo of Lilith",');
    console.log('  "url": "...",');
    console.log('  "bossStats": {');
    console.log('    "level": 100,');
    console.log('    "hp": "~24,000,000",');
    console.log('    "staggerHp": 500');
    console.log('  },');
    console.log('  "bossVersions": [');
    
    bossVersions.forEach((version, index) => {
      console.log(`    {`);
      console.log(`      "name": "${version.name}",`);
      console.log(`      "abilities": [`);
      version.abilities.forEach(ability => {
        console.log(`        {`);
        console.log(`          "name": "${ability.name}",`);
        console.log(`          "description": "..."`);
        console.log(`        }`);
      });
      console.log(`      ],`);
      console.log(`      "strategies": [`);
      version.strategies.forEach(strategy => {
        console.log(`        {`);
        console.log(`          "name": "${strategy.name}",`);
        console.log(`          "description": "..."`);
        console.log(`        }`);
      });
      console.log(`      ]`);
      console.log(`    }${index < bossVersions.length - 1 ? ',' : ''}`);
    });
    
    console.log('  ],');
    console.log('  "generalContent": [');
    console.log('    {');
    console.log('      "heading": "Tormented Debuff",');
    console.log('      "content": "..."');
    console.log('    }');
    console.log('  ]');
    console.log('}');
    console.log('```');

    console.log('\n🎯 Key Benefits:');
    console.log('✅ Boss version context preserved');
    console.log('✅ Abilities grouped by boss version');
    console.log('✅ Strategies linked to specific boss versions');
    console.log('✅ Boss stats extracted as structured data');
    console.log('✅ General content separated from boss-specific content');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function isBossVersionHeading(text) {
  const bossVersionPatterns = [
    /echo of lilith/i,
    /hatred incarnate/i,
    /mother of mankind/i,
    /phase \d+/i
  ];
  return bossVersionPatterns.some(pattern => pattern.test(text));
}

function isAbilityHeading(text) {
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

testHierarchicalParser(); 