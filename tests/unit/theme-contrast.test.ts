import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function srgbToLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const [lr, lg, lb] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = srgbToLuminance(hexA);
  const l2 = srgbToLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test("globals.css binds Tailwind dark variant to .dark / [data-theme='night'] instead of OS media query", () => {
  const css = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");
  assert.match(css, /@custom-variant\s+dark\s+\(:is\(\.dark,\s*\[data-theme="night"\]\)\s+&\);/);
  assert.doesNotMatch(css, /\.text-zinc-600\s*\{[^}]*!important/);
  assert.match(css, /\[data-admin-surface="true"\]/);
});

test("LanguageContext isolates /admin routes to light tokens while preserving readingTheme", () => {
  const ctx = fs.readFileSync(path.join(ROOT, "src/context/LanguageContext.tsx"), "utf8");
  assert.match(ctx, /usePathname/);
  assert.match(ctx, /isAdminRoute/);
  assert.match(ctx, /pathname\?\.startsWith\("\/admin"\)/);
});

test("theme palette tokens meet WCAG AA contrast across parchment, white, and night modes", () => {
  // Parchment theme
  assert.ok(contrastRatio("#191614", "#FAF8F5") >= 4.5);
  assert.ok(contrastRatio("#4A443E", "#FAF8F5") >= 4.5);
  assert.ok(contrastRatio("#665F57", "#FAF8F5") >= 4.5);
  assert.ok(contrastRatio("#FFFFFF", "#0D5C3A") >= 4.5);

  // Night theme
  assert.ok(contrastRatio("#F4F4F5", "#121212") >= 4.5);
  assert.ok(contrastRatio("#D4D4D8", "#1F1F23") >= 4.5);
  assert.ok(contrastRatio("#A1A1AA", "#1F1F23") >= 4.5);
  assert.ok(contrastRatio("#22C55E", "#1F1F23") >= 4.5);
  assert.ok(contrastRatio("#052814", "#22C55E") >= 4.5);
  assert.ok(contrastRatio("#FFFFFF", "#0A6847") >= 4.5);
});
