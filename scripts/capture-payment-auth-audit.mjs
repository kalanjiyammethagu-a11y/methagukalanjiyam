import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function captureScreenshot(url, outputPath, width, height) {
  return new Promise((resolve) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      url,
    ];

    const child = spawn(BROWSER_PATH, args, { stdio: "ignore" });
    child.on("close", () => resolve());
    child.on("error", () => resolve());
  });
}

async function run() {
  console.log("================================================================================");
  console.log(" CAPTURING AUTH AND PAYMENT BROWSER CHECKS");
  console.log(" Target: http://localhost:3000");
  console.log("================================================================================\n");

  const targets = [
    { name: "browser-check-auth-login", url: "http://localhost:3000/login", w: 1280, h: 800 },
    { name: "browser-check-cart-desktop", url: "http://localhost:3000/cart", w: 1280, h: 900 },
    { name: "browser-check-cart-mobile", url: "http://localhost:3000/cart", w: 390, h: 844 },
  ];

  for (const t of targets) {
    const out = path.join(OUTPUT_DIR, `${t.name}.png`);
    console.log(`[Capture] ${t.url} (${t.w}x${t.h}) -> ${path.basename(out)}`);
    await captureScreenshot(t.url, out, t.w, t.h);
  }

  console.log("\n[Success] All browser check screenshots captured.");
}

run();

