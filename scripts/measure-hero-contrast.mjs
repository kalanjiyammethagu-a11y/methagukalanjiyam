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
      // 1. BEFORE: Dark ink color cascade hijacking (#191614 for H1, #4A443E for Subtitle)
      // combined with the crushed 3-layer heavy overlay
      const hijackedHeadlineColor = [25, 22, 20]; // #191614
      const hijackedSubtitleColor = [74, 68, 62]; // #4A443E
      
      // Heavy 3-layer scrim background:
      const heavyVert = normYFromBottom <= 0.35 ? (0.96 - (normYFromBottom / 0.35) * 0.14) : (0.82 - ((normYFromBottom - 0.35) / 0.35) * 0.40);
      const heavyHoriz = normXFromLeft <= 0.40 ? (0.92 - (normXFromLeft / 0.40) * 0.27) : (0.65 - ((normXFromLeft - 0.40) / 0.35) * 0.45);
      const heavyCombinedAlpha = Math.min(0.99, 1 - (1 - Math.max(0, heavyVert)) * (1 - Math.max(0, heavyHoriz)) * 0.7);
      const beforeBg = blend([rawR, rawG, rawB], [0, 0, 0], heavyCombinedAlpha);

      const beforeHeadlineContrast = getContrastRatio(beforeBg, hijackedHeadlineColor);
      const beforeSubContrast = getContrastRatio(beforeBg, hijackedSubtitleColor);
      const beforeEyebrowContrast = getContrastRatio(beforeBg, [110, 231, 183]);

      // 2. AFTER: Soft directional gradient scrim + Pure White text (#FFFFFF / #FFFFFF@95%)
      // Vertical: from-black/72 via-black/32 at 42% to-transparent at 78%
      let softVertAlpha = 0;
      if (normYFromBottom <= 0.42) {
        softVertAlpha = 0.72 - (normYFromBottom / 0.42) * (0.72 - 0.32);
      } else if (normYFromBottom <= 0.78) {
        softVertAlpha = 0.32 - ((normYFromBottom - 0.42) / 0.36) * 0.32;
      }
      softVertAlpha = Math.max(0, Math.min(1, softVertAlpha));

      // Horizontal: from-black/68 via-black/22 at 45% to-transparent at 75%
      let softHorizAlpha = 0;
      if (normXFromLeft <= 0.45) {
        softHorizAlpha = 0.68 - (normXFromLeft / 0.45) * (0.68 - 0.22);
      } else if (normXFromLeft <= 0.75) {
        softHorizAlpha = 0.22 - ((normXFromLeft - 0.45) / 0.30) * 0.22;
      }
      softHorizAlpha = Math.max(0, Math.min(1, softHorizAlpha));

      const afterScrimAlpha = 1 - (1 - softVertAlpha) * (1 - softHorizAlpha);
      const afterBg = blend([rawR, rawG, rawB], [0, 0, 0], afterScrimAlpha);

      // Contrast AFTER:
      // Headline: Pure White #FFFFFF
      const afterHeadlineContrast = getContrastRatio(afterBg, [255, 255, 255]);
      // Subtitle: White 95%
      const afterSubFg = blend(afterBg, [255, 255, 255], 0.95);
      const afterSubContrast = getContrastRatio(afterBg, afterSubFg);
      // Eyebrow: Emerald 300 #6ee7b7
      const afterEyebrowContrast = getContrastRatio(afterBg, [110, 231, 183]);

      console.log(`  Location: ${loc.name.padEnd(16)} (Raw RGB: [${rawR},${rawG},${rawB}])`);
      console.log(`    Headline (3.0:1 req) : BEFORE ${beforeHeadlineContrast.toFixed(2)}:1  --> AFTER ${afterHeadlineContrast.toFixed(2)}:1  ${afterHeadlineContrast >= 3.0 ? "PASS" : "FAIL"}`);
      console.log(`    Subtitle (4.5:1 req) : BEFORE ${beforeSubContrast.toFixed(2)}:1  --> AFTER ${afterSubContrast.toFixed(2)}:1  ${afterSubContrast >= 4.5 ? "PASS" : "FAIL"}`);
      console.log(`    Eyebrow  (4.5:1 req) : BEFORE ${beforeEyebrowContrast.toFixed(2)}:1  --> AFTER ${afterEyebrowContrast.toFixed(2)}:1  ${afterEyebrowContrast >= 4.5 ? "PASS" : "FAIL"}`);
    }
  }
}

analyze().catch(console.error);

