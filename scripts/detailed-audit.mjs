import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
    else if (f.endsWith(".tsx") || f.endsWith(".ts")) res.push(p);
  }
  return res;
}

const files = walk("src");
const report = [];

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  const rel = path.relative(".", file).replace(/\\/g, "/");

  // 1. Raw <img>
  const imgMatches = code.match(/<img\b[^>]*>/g);
  if (imgMatches) {
    for (const m of imgMatches) {
      report.push({
        file: rel,
        category: "Performance / Image",
        issue: "Raw <img> tag without Next.js Image optimization",
        snippet: m.slice(0, 60),
        severity: "High",
        fix: "Replace with `next/image` (<Image />) with explicit dimensions/fill and priority on LCP",
      });
    }
  }

  // 2. Form inputs with text-sm or text-xs (iOS 16px auto-zoom trigger)
  const inputMatches = code.match(/<(?:input|textarea|select)\b[^>]*(?:\/>|>)/g);
  if (inputMatches) {
    for (const tag of inputMatches) {
      if (tag.includes('type="checkbox"') || tag.includes('type="radio"') || tag.includes('type="hidden"')) continue;
      if (/text-(?:xs|sm|\[1[0-4]px\])/.test(tag) && !/text-(?:base|\[16px\])/.test(tag)) {
        report.push({
          file: rel,
          category: "Forms / iOS Zoom",
          issue: "Input font size is below 16px (triggers iOS automatic viewport zoom on focus)",
          snippet: tag.slice(0, 70),
          severity: "High",
          fix: "Use `text-base sm:text-sm` so mobile is 16px (no zoom) and desktop remains compact 14px",
        });
      }
    }
  }

  // 3. 100vh usage
  if (/100vh/.test(code) || /h-screen(?!\S)/.test(code) || /min-h-screen(?!\S)/.test(code)) {
    report.push({
      file: rel,
      category: "Viewport / Address Bar Jump",
      issue: "Uses 100vh / min-h-screen instead of dynamic viewport units (100dvh / min-h-[100dvh])",
      snippet: code.match(/(?:100vh|h-screen|min-h-screen)/)?.[0] || "",
      severity: "Medium",
      fix: "Replace with `100dvh` / `min-h-[100dvh]` to account for dynamic mobile address bar",
    });
  }

  // 4. Fixed width > 320px on mobile
  const fixedWidths = code.match(/w-\[(?:3[3-9]\d|[4-9]\d\d|\d{4,})px\]/g);
  if (fixedWidths) {
    for (const w of fixedWidths) {
      // check if it has a breakpoint prefix like sm:, md:, lg:
      const fullMatch = code.match(new RegExp(`(?:sm:|md:|lg:|xl:)?${w.replace(/\[/g, "\\[").replace(/\]/g, "\\]")}`, "g"));
      const unqualified = fullMatch?.filter(m => !m.includes(":"));
      if (unqualified && unqualified.length > 0) {
        report.push({
          file: rel,
          category: "Layout / Horizontal Overflow",
          issue: `Fixed width ${w} without responsive breakpoint causes horizontal blowout at 320px viewport`,
          snippet: unqualified[0],
          severity: "Critical",
          fix: "Change to `w-full max-w-[...px]` or constrain with `max-w-full` / `sm:${w}`",
        });
      }
    }
  }

  // 5. Tables without horizontal overflow scroll wrapper
  if (code.includes("<table") && !code.includes("overflow-x-auto")) {
    report.push({
      file: rel,
      category: "Layout / Data Table",
      issue: "Data <table> element lacking overflow-x-auto container wrapper causes table overflow on 320px-390px screens",
      snippet: "<table",
      severity: "High",
      fix: "Wrap table in `<div className=\"overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0\">`",
    });
  }

  // 6. Fixed/sticky bottom elements missing safe-area inset
  if (/(?:fixed|sticky)\s+bottom-0/.test(code) || /bottom-0\s+(?:fixed|sticky)/.test(code)) {
    if (!code.includes("safe-area-inset-bottom") && !code.includes("pb-safe")) {
      report.push({
        file: rel,
        category: "Viewport / Safe Area Inset",
        issue: "Fixed/sticky bottom bar missing safe-area-inset-bottom padding for modern iPhone home gesture indicator",
        snippet: "bottom-0",
        severity: "High",
        fix: "Add `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]` or `.pb-safe` to avoid gesture indicator overlap",
      });
    }
  }

  // 7. Touch targets < 44px
  const buttonTags = code.match(/<(?:button|a)\b[^>]*(?:\/>|>)/g);
  if (buttonTags) {
    for (const tag of buttonTags) {
      if (tag.includes("hidden sm:") || tag.includes("hidden md:") || tag.includes("hidden lg:")) continue;
      const hMatch = tag.match(/\b(h-[678]|h-9|h-10|h-\[([1-3]\d|4[0-3])px\])\b/);
      if (hMatch && !tag.includes("min-h-[44px]") && !tag.includes("min-h-11")) {
        report.push({
          file: rel,
          category: "Touch Target / Accessibility",
          issue: `Touch target height ${hMatch[1]} < 44px violates WCAG 2.5.5 / 2.1 AA target size minimum`,
          snippet: tag.slice(0, 60),
          severity: "Medium",
          fix: "Add `min-h-[44px] min-w-[44px]` touch target area or increase padding",
        });
      }
    }
  }
}

console.log(`Total Findings: ${report.length}`);
console.log(JSON.stringify(report.slice(0, 30), null, 2));
fs.writeFileSync("ux-audit-findings.json", JSON.stringify(report, null, 2));
