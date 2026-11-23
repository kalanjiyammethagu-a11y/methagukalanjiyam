import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('./src');
const missingBase = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<input') || line.includes('<select') || line.includes('<textarea')) {
      if (line.includes('type="checkbox"') || line.includes('type="radio"') || line.includes('type="hidden"') || line.includes('hidden')) continue;
      const block = lines.slice(i, Math.min(lines.length, i + 15)).join('\n');
      if ((block.includes('text-sm') || block.includes('text-xs')) && !block.includes('text-base') && !block.includes('text-lg') && !block.includes('text-xl')) {
        missingBase.push({ file: file.replace(/\\/g, '/'), line: i + 1, tag: line.trim() });
      }
    }
  }
});

console.log(JSON.stringify(missingBase, null, 2));
