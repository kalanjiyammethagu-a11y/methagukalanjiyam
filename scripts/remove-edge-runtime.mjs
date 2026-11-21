import fs from "fs";
import path from "path";

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes('export const runtime = "edge"') || content.includes("export const runtime = 'edge'")) {
        content = content
          .replace(/export const runtime = ["']edge["'];\r?\n\r?\n?/g, "")
          .replace(/export const runtime = ["']edge["'];?/g, "");
        fs.writeFileSync(fullPath, content, "utf8");
        console.log("Removed edge runtime from:", fullPath);
      }
    }
  }
}

walk(path.resolve("src"));
console.log("Edge runtime cleanup complete.");
