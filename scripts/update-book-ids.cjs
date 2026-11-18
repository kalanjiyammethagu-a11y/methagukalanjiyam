const fs = require('fs');
let code = fs.readFileSync('src/data/books.ts', 'utf8');

for (let i = 20; i >= 1; i--) {
  const uuid = 'b0000000-0000-0000-0000-' + i.toString().padStart(12, '0');
  // Match `id: "${i}",` exactly
  const target = `id: "${i}",`;
  const replacement = `id: "${uuid}",`;
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log(`Replaced [${i}] with [${uuid}]`);
  } else {
    console.warn(`Target not found: ${target}`);
  }
}

fs.writeFileSync('src/data/books.ts', code, 'utf8');
console.log('src/data/books.ts successfully updated.');

