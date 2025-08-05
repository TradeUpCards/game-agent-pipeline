const fs = require('fs');

const INPUT = 'data/raw-scrapes/output_maxroll_gg_d4_getting_started_first_steps_in_diablo_4_20250801.json';
const OUTPUT = 'tmp/echo-of-lilith-page.json';
const TARGET_URL = 'https://maxroll.gg/d4/bosses/echo-of-lilith';

function findEchoOfLilithInObject(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.url === TARGET_URL && Array.isArray(obj.content)) return obj;
    for (const key of Object.keys(obj)) {
      const found = findEchoOfLilithInObject(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

function main() {
  const lines = fs.readFileSync(INPUT, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      continue;
    }
    const found = findEchoOfLilithInObject(obj);
    if (found) {
      fs.mkdirSync('tmp', { recursive: true });
      fs.writeFileSync(OUTPUT, JSON.stringify(found, null, 2), 'utf8');
      console.log('Extracted Echo of Lilith page to', OUTPUT);
      return;
    }
  }
  console.error('Echo of Lilith page with content array not found.');
  process.exit(1);
}

main();