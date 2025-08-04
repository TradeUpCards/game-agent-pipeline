const fs = require('fs');
const path = require('path');

// Read the first few lines of the scraped data
const filePath = path.join(__dirname, '..', 'data', 'raw-scrapes', 'output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250731.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Look at a page with good content
  const parsed = JSON.parse(lines[2]); // Page 3 (Ashava boss guide)
  
  console.log('Sample page structure:');
  console.log('=====================');
  console.log('Title:', parsed.title);
  console.log('URL:', parsed.url);
  console.log(`Headings count: ${parsed.content.headings.length}`);
  console.log(`Paragraphs count: ${parsed.content.paragraphs.length}`);
  
  console.log('\nFirst 5 headings:');
  parsed.content.headings.slice(0, 5).forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.text}`);
  });
  
  console.log('\nFirst 5 paragraphs:');
  parsed.content.paragraphs.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.substring(0, 100)}...`);
  });
  
} catch (error) {
  console.error('Error reading file:', error.message);
} 