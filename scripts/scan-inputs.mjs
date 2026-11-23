import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
    else if (p.endsWith(".tsx")) res.push(p);
  }
  return res;
}

const files = walk("src");
const results = [];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const tagRegex = /<(input|textarea|select)\b[\s\S]*?(?:\/>|>)/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[0];
    if (tag.includes('type="checkbox"') || tag.includes('type="radio"') || tag.includes('type="hidden"')) continue;
    const classMatch = tag.match(/className=["']([^"']*)["']|className=\{`([^`]*)`\}|className=\{cn\(([\s\S]*?)\)\}/);
    if (classMatch) {
      const cls = classMatch[1] || classMatch[2] || classMatch[3] || "";
      if ((cls.includes("text-sm") || cls.includes("text-xs")) && !cls.includes("text-base") && !cls.includes("text-[16px]")) {
        const line = content.slice(0, match.index).split("\n").length;
        results.push({
          file: path.relative(".", f).replace(/\\/g, "/"),
          line,
          element: match[1],
          fontClass: cls.includes("text-xs") ? "text-xs" : "text-sm",
        });
      }
    }
  }
}

console.log(JSON.stringify(results, null, 2));
