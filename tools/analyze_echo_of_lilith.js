const fs = require('fs');
const path = require('path');

// Read the scraped data file
const filePath = path.join(__dirname, '..', 'data', 'raw-scrapes', 'output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250801.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  // Find the Echo of Lilith page
  let echoOfLilithPage = null;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.url === 'https://maxroll.gg/d4/bosses/echo-of-lilith') {
        echoOfLilithPage = parsed;
        break;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }

  if (!echoOfLilithPage) {
    console.log('❌ Echo of Lilith page not found in scraped data');
    process.exit(1);
  }

  console.log('✅ Found Echo of Lilith page');
  console.log('📄 Title:', echoOfLilithPage.title);
  console.log('🔗 URL:', echoOfLilithPage.url);
  console.log(`📊 Content items: ${echoOfLilithPage.content.length}`);

  // Analyze content structure
  console.log('\n📋 Content Structure Analysis:');
  console.log('================================');

  const contentTypes = {};
  const headings = [];
  const lists = [];
  const paragraphs = [];

  echoOfLilithPage.content.forEach((item, index) => {
    // Count content types
    contentTypes[item.type] = (contentTypes[item.type] || 0) + 1;

    // Collect headings
    if (item.type === 'heading') {
      headings.push({
        level: item.level,
        text: item.text,
        index
      });
    }

    // Collect lists
    if (item.type === 'list') {
      lists.push({
        list_type: item.list_type,
        items: item.items,
        index
      });
    }

    // Collect paragraphs (first 100 chars)
    if (item.type === 'paragraph') {
      paragraphs.push({
        text: item.text.substring(0, 100) + (item.text.length > 100 ? '...' : ''),
        index
      });
    }
  });

  console.log('\n📈 Content Type Distribution:');
  Object.entries(contentTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n🏷️  Headings Found:');
  headings.forEach((heading, i) => {
    console.log(`  ${i + 1}. H${heading.level}: ${heading.text}`);
  });

  console.log('\n📝 Sample Paragraphs:');
  paragraphs.slice(0, 5).forEach((para, i) => {
    console.log(`  ${i + 1}. ${para.text}`);
  });

  console.log('\n📋 Lists Found:');
  lists.forEach((list, i) => {
    console.log(`  ${i + 1}. ${list.list_type} (${list.items.length} items):`);
    list.items.slice(0, 3).forEach(item => {
      console.log(`    - ${item}`);
    });
    if (list.items.length > 3) {
      console.log(`    ... and ${list.items.length - 3} more`);
    }
  });

  // Check for specific issues
  console.log('\n🔍 Specific Issues Check:');
  console.log('========================');

  // Check for Table of Contents
  const tocHeading = headings.find(h => h.text.toLowerCase().includes('table of contents'));
  if (tocHeading) {
    console.log('✅ Table of Contents heading found');
  } else {
    console.log('❌ Table of Contents heading not found');
  }

  // Check for boss stats
  const statsParagraph = paragraphs.find(p => 
    p.text.includes('Level:') || p.text.includes('HP:') || p.text.includes('Stagger HP:')
  );
  if (statsParagraph) {
    console.log('✅ Boss stats found in paragraph');
  } else {
    console.log('❌ Boss stats not found');
  }

  // Check for bold text formatting
  const boldText = paragraphs.find(p => p.text.includes('**'));
  if (boldText) {
    console.log('✅ Bold text formatting found');
  } else {
    console.log('❌ Bold text formatting not found');
  }

  // Check for strategy sections
  const strategyHeading = headings.find(h => 
    h.text.toLowerCase().includes('strategy') || h.text.toLowerCase().includes('tips')
  );
  if (strategyHeading) {
    console.log('✅ Strategy section found');
  } else {
    console.log('❌ Strategy section not found');
  }

  console.log('\n🎯 Recommendations:');
  console.log('===================');
  console.log('1. Use the debug tool at http://localhost:3000/debug');
  console.log('2. Select the scraped file: output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250801.json');
  console.log('3. Select the "Echo of Lilith" page from the dropdown');
  console.log('4. Compare scraped vs parsed content');
  console.log('5. Check for missing content and formatting issues');

} catch (error) {
  console.error('❌ Error reading file:', error.message);
} 