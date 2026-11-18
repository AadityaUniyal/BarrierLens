import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat && stat.isDirectory()) results = results.concat(walk(full));
      else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(full);
    });
  } catch {}
  return results;
}

const files = [...walk('components'), ...walk('app')];
const calls = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /fetch\s*\(\s*[`'"](\/api\/[^`'"?#]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    calls.push({ endpoint: match[1], file: path.relative(process.cwd(), f) });
  }
});

console.log(`Found ${calls.length} frontend fetch calls:`);
calls.sort((a, b) => a.endpoint.localeCompare(b.endpoint)).forEach(c => {
  console.log(`  ${c.endpoint.padEnd(30)} in ${c.file}`);
});
