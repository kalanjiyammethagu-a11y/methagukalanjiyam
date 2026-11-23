import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

const files = walk("src");
const issues = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(".", file).replace(/\\/g, "/");

  // 1. Raw <img> tags instead of next/image
  const imgMatches = content.match(/<img\s+[^>]*>/g);
  if (imgMatches) {
    for (const m of imgMatches) {
      issues.push({
        file: rel,
        category: "Performance",
        issue: "Raw <img> tag used instead of next/image: " + m.slice(0, 50) + "...",
        severity: "Medium",
        fix: "Replace with Next.js <Image /> component for automated webp conversion, responsive srcSet, and lazy loading",
      });
    }
  }

  // 2. Input font size < 16px (iOS zoom on focus)
  const inputMatches = content.match(/<(?:input|textarea|select)[^>]*className=["'][^"']*(?:text-xs|text-sm|text-\[1[0-4]px\])[^"']*["']/g);
  if (inputMatches) {
    for (const m of inputMatches) {
      issues.push({
        file: rel,
        category: "Forms / iOS Zoom",
        issue: "Input with font size < 16px (causes unwanted iOS viewport auto-zoom on focus): " + m.slice(0, 70) + "...",
        severity: "High",
        fix: "Change to `text-base sm:text-sm` (16px on mobile prevents iOS zoom, standard 14px on desktop)",
      });
    }
  }

  // 3. Buttons or tap targets with explicit height < 44px without min-h-[44px]
  const smallTapMatches = content.match(/<(?:button|a)\s+[^>]*className=["'][^"']*(?:h-[678]|h-9|h-10)(?![^"']*min-h-\[44px\])[^"']*["']/g);
  if (smallTapMatches) {
    for (const m of smallTapMatches) {
      // ignore if hidden on mobile
      if (!m.includes("hidden sm:") && !m.includes("hidden md:") && !m.includes("hidden lg:")) {
        issues.push({
          file: rel,
          category: "Touch Target",
          issue: "Interactive element has height < 44px without min-h-[44px]: " + m.slice(0, 80) + "...",
          severity: "Medium",
          fix: "Add `min-h-[44px] min-w-[44px]` touch target sizing (WCAG 2.1 AA)",
        });
      }
    }
  }

  // 4. Fixed pixel widths > 320px
  const fixedWidthMatches = content.match(/className=["'][^"']*(?:w-\[(?:3[3-9]\d|[4-9]\d\d|\d{4,})px\])[^"']*["']/g);
  if (fixedWidthMatches) {
    for (const m of fixedWidthMatches) {
      // check if preceded by sm:, md:, lg:
      const raw = m.split(" ").filter(c => /w-\[\d+px\]/.test(c) && !c.includes(":"));
      if (raw.length > 0) {
        issues.push({
          file: rel,
          category: "Layout / Overflow",
          issue: "Fixed width > 320px on mobile (" + raw.join(", ") + ") causes horizontal scroll at 320px",
          severity: "Critical",
          fix: "Change to max-w-full or responsive breakpoint (e.g. `w-full max-w-[...px]` or `sm:w-[...px]`)",
        });
      }
    }
  }

  // 5. <table> elements without overflow container
  if (content.includes("<table") && !content.includes("overflow-x-auto") && !content.includes("overflow-hidden")) {
    issues.push({
      file: rel,
      category: "Layout / Table",
      issue: "Data table present without an overflow-x-auto container wrapper",
      severity: "High",
      fix: "Wrap <table> in `<div className=\"overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0\">` or use mobile card representation",
    });
  }

  // 6. Missing safe-area inset on fixed/sticky elements at bottom
  if (/className=["'][^"']*(?:fixed|sticky)[^"']*bottom-0[^"']*["']/.test(content)) {
    if (!content.includes("safe-area-inset-bottom") && !content.includes("pb-safe")) {
      issues.push({
        file: rel,
        category: "Viewport / Safe Area",
        issue: "Fixed/sticky bottom bar missing safe-area-inset-bottom padding for modern iPhone gesture home bar",
        severity: "High",
        fix: "Add `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]` or `.pb-safe` to prevent collision with iOS home indicator",
      });
    }
  }

  // 7. Modals/Drawers missing body scroll lock or max-h-[100dvh]
  if (content.includes("role=\"dialog\"") || content.includes("aria-modal=\"true\"")) {
    if (!content.includes("100dvh") && !content.includes("max-h-screen") && !content.includes("h-full")) {
      issues.push({
        file: rel,
        category: "Modals / Drawers",
        issue: "Dialog modal or drawer without explicit dynamic height constraint for mobile viewport",
        severity: "Medium",
        fix: "Apply `max-h-[100dvh]` and `overflow-y-auto` with safe-area insets",
      });
    }
  }
}

console.log(JSON.stringify(issues, null, 2));
