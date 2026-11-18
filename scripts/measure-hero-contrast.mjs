import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// WCAG 2.1 relative luminance calculation
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Alpha blend color onto background: C_out = C_fg * alpha + C_bg * (1 - alpha)
function blend(bg, fg, alpha) {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

const slides = [
  {
    id: "flagship-archives",
    title: "Slide 1: Flagship Archives",
    image: "public/images/brand/banner-1600.webp",
  },
  {
    id: "thileepan-satyagraha",
    title: "Slide 2: Thileepan Satyagraha",
    image: "public/images/blogs/deelipan-widescreen.webp",
  },
  {
    id: "katunayake-victory",
    title: "Slide 3: Katunayake Victory",
    image: "public/images/blogs/saanthi-nesakaram-banner-1.webp",
  },
  {
    id: "leader-thoughts",
    title: "Slide 4: Leader Thoughts",
    image: "public/images/blogs/prabakaran-dad-banner.webp",
  },
];

// Test sampling points across the caption area (left 10%-45%, bottom 10%-40%)
// Normalized coordinates (xNorm, yNorm) from top-left (0,0) to bottom-right (1,1)
const sampleLocations = [
  { name: "Eyebrow Area", x: 0.15, y: 0.62 },
  { name: "Headline Top", x: 0.20, y: 0.68 },
  { name: "Headline Center", x: 0.28, y: 0.75 },
  { name: "Subtitle Area", x: 0.22, y: 0.83 },
  { name: "CTA / Bottom", x: 0.18, y: 0.90 },
];

async function analyze() {
  console.log("================================================================================");
  console.log(" WCAG CONTRAST AUDIT: HERO SLIDES (BEFORE & AFTER)");
  console.log(" Targets: Headline >= 3.0:1 (Large Text), Subtitle & Eyebrow >= 4.5:1 (Normal Text)");
  console.log("================================================================================\n");

  for (const slide of slides) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`Analyzing ${slide.title} (${slide.image})`);
    console.log(`--------------------------------------------------------------------------------`);

    if (!fs.existsSync(slide.image)) {
      console.log(`  [WARN] Image not found: ${slide.image}`);
      continue;
    }

    // Load and extract raw pixel data from image resized to 1280x600 (card dimensions)
    const { data, info } = await sharp(slide.image)
      .resize(1280, 600, { fit: "cover", position: "center" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (const loc of sampleLocations) {
      const px = Math.floor(loc.x * info.width);
      const py = Math.floor(loc.y * info.height);
      const idx = (py * info.width + px) * 4;
      const rawR = data[idx];
      const rawG = data[idx + 1];
      const rawB = data[idx + 2];

      // Normalized coordinates from bottom (0 at bottom, 1 at top)
      const normYFromBottom = 1 - loc.y;
      const normXFromLeft = loc.x;

      // 1. Current Scrim Model:
      // Vertical: from-black/92 via-black/45 (at y=0.5) to-transparent
      let currVertAlpha = 0;
      if (normYFromBottom <= 0.5) {
        currVertAlpha = 0.92 - (normYFromBottom / 0.5) * (0.92 - 0.45);
      } else {
        currVertAlpha = 0.45 - ((normYFromBottom - 0.5) / 0.5) * 0.45;
      }
      currVertAlpha = Math.max(0, Math.min(1, currVertAlpha));

      // Horizontal: from-black/75 via-black/25 to-transparent
      let currHorizAlpha = 0;
      if (normXFromLeft <= 0.5) {
        currHorizAlpha = 0.75 - (normXFromLeft / 0.5) * (0.75 - 0.25);
      } else {
        currHorizAlpha = 0.25 - ((normXFromLeft - 0.5) / 0.5) * 0.25;
      }
      currHorizAlpha = Math.max(0, Math.min(1, currHorizAlpha));

      // Combined current scrim
      const currScrimAlpha = 1 - (1 - currVertAlpha) * (1 - currHorizAlpha);
      const currBg = blend([rawR, rawG, rawB], [0, 0, 0], currScrimAlpha);

      // Contrast BEFORE:
      // Headline (White #FFFFFF)
      const currHeadlineContrast = getContrastRatio(currBg, [255, 255, 255]);
      // Subtitle (White/75 -> blend white with 0.75 alpha over currBg)
      const currSubFg = blend(currBg, [255, 255, 255], 0.75);
      const currSubContrast = getContrastRatio(currBg, currSubFg);
      // Eyebrow (Emerald 300: #6ee7b7 = [110, 231, 183])
      const currEyebrowContrast = getContrastRatio(currBg, [110, 231, 183]);

      // 2. Enhanced Optical Scrim Model (Proposed Fix):
      // Multi-stop progressive gradient:
      // Vertical: from-black/96 via-black/82 at 35% via-black/45 at 70% to-transparent
      let newVertAlpha = 0;
      if (normYFromBottom <= 0.35) {
        newVertAlpha = 0.96 - (normYFromBottom / 0.35) * (0.96 - 0.82);
      } else if (normYFromBottom <= 0.70) {
        newVertAlpha = 0.82 - ((normYFromBottom - 0.35) / 0.35) * (0.82 - 0.45);
      } else {
        newVertAlpha = 0.45 - ((normYFromBottom - 0.70) / 0.30) * 0.45;
      }
      newVertAlpha = Math.max(0, Math.min(1, newVertAlpha));

      // Horizontal: from-black/92 via-black/65 at 40% via-black/25 at 75% to-transparent
      let newHorizAlpha = 0;
      if (normXFromLeft <= 0.40) {
        newHorizAlpha = 0.92 - (normXFromLeft / 0.40) * (0.92 - 0.65);
      } else if (normXFromLeft <= 0.75) {
        newHorizAlpha = 0.65 - ((normXFromLeft - 0.40) / 0.35) * (0.65 - 0.25);
      } else {
        newHorizAlpha = 0.25 - ((normXFromLeft - 0.75) / 0.25) * 0.25;
      }
      newHorizAlpha = Math.max(0, Math.min(1, newHorizAlpha));

      // Localized subtle text-backing radial scrim (0.25 max at center-left):
      const radialDist = Math.hypot(normXFromLeft - 0.15, normYFromBottom - 0.25);
      const newRadialAlpha = Math.max(0, 0.35 * (1 - radialDist / 0.6));

      // Combined new scrim
      const newCombinedAlpha = 1 - (1 - newVertAlpha) * (1 - newHorizAlpha) * (1 - newRadialAlpha);
      const newBg = blend([rawR, rawG, rawB], [0, 0, 0], newCombinedAlpha);

      // Contrast AFTER:
      // Headline (White #FFFFFF with drop shadow)
      const newHeadlineContrast = getContrastRatio(newBg, [255, 255, 255]);
      // Subtitle (Solid Zinc-100 / White 95% -> [244, 244, 245])
      const newSubFg = blend(newBg, [255, 255, 255], 0.95);
      const newSubContrast = getContrastRatio(newBg, newSubFg);
      // Eyebrow (Emerald 300: #6ee7b7 = [110, 231, 183])
      const newEyebrowContrast = getContrastRatio(newBg, [110, 231, 183]);

      console.log(`  Location: ${loc.name.padEnd(16)} (Raw RGB: [${rawR},${rawG},${rawB}])`);
      console.log(`    Headline (3.0:1 req) : BEFORE ${currHeadlineContrast.toFixed(2)}:1  --> AFTER ${newHeadlineContrast.toFixed(2)}:1  ${newHeadlineContrast >= 3.0 ? "PASS" : "FAIL"}`);
      console.log(`    Subtitle (4.5:1 req) : BEFORE ${currSubContrast.toFixed(2)}:1  --> AFTER ${newSubContrast.toFixed(2)}:1  ${newSubContrast >= 4.5 ? "PASS" : "FAIL"}`);
      console.log(`    Eyebrow  (4.5:1 req) : BEFORE ${currEyebrowContrast.toFixed(2)}:1  --> AFTER ${newEyebrowContrast.toFixed(2)}:1  ${newEyebrowContrast >= 4.5 ? "PASS" : "FAIL"}`);
    }
  }
}

analyze().catch(console.error);
