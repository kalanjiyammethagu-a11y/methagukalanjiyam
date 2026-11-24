import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 3099;
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const TARGET_DIR = process.argv[2] || "before"; // "before" or "after"
const OUTPUT_DIR = path.resolve(process.cwd(), "audit", "cart-screenshots", TARGET_DIR);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  // Small phones
  { name: "small-phone-320x568", w: 320, h: 568 },
  { name: "small-phone-360x640", w: 360, h: 640 },
  { name: "small-phone-375x667", w: 375, h: 667 },
  // Modern phones
  { name: "phone-360x800", w: 360, h: 800 },
  { name: "phone-390x844", w: 390, h: 844 },
  { name: "phone-393x852", w: 393, h: 852 },
  { name: "phone-412x915", w: 412, h: 915 },
  { name: "phone-430x932", w: 430, h: 932 },
  // Phone landscape
  { name: "landscape-667x375", w: 667, h: 375 },
  { name: "landscape-844x390", w: 844, h: 390 },
  { name: "landscape-915x412", w: 915, h: 412 },
  // Foldables
  { name: "foldable-280x653", w: 280, h: 653 },
  { name: "foldable-717x512", w: 717, h: 512 },
  { name: "foldable-768x1024", w: 768, h: 1024 },
  // Tablets
  { name: "tablet-820x1180", w: 820, h: 1180 },
  { name: "tablet-1024x1366", w: 1024, h: 1366 },
  // Laptops / Desktops
  { name: "desktop-1280x720", w: 1280, h: 720 },
  { name: "desktop-1366x768", w: 1366, h: 768 },
  { name: "desktop-1440x900", w: 1440, h: 900 },
  { name: "desktop-1920x1080", w: 1920, h: 1080 },
  // Ultrawide
  { name: "ultrawide-2560x1080", w: 2560, h: 1080 },
  { name: "ultrawide-3440x1440", w: 3440, h: 1440 },
];

async function waitForServer(url, timeout = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) {
        return true;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server failed to start at ${url} within ${timeout}ms`);
}

function captureScreenshot(url, outputPath, width, height) {
  return new Promise((resolve) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      url,
    ];

    const child = spawn(EDGE_PATH, args, { stdio: "ignore" });
    child.on("close", () => {
      resolve();
    });
    child.on("error", () => resolve());
  });
}

async function run() {
  console.log(`Starting Next.js production server on 127.0.0.1:${PORT}...`);
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => {
    const msg = d.toString();
    if (msg.includes("Ready") || msg.includes("started") || msg.includes("Listening")) {
      console.log("Server output:", msg.trim());
    }
  });

  server.stderr.on("data", (d) => {
    console.error("Server stderr:", d.toString().trim());
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/cart`);
    console.log(`Next.js server is ready. Capturing ${TARGET_DIR} screenshots across ${VIEWPORTS.length} viewports...`);

    let count = 0;
    for (const vp of VIEWPORTS) {
      // 1. Empty cart state
      const emptyFile = path.join(OUTPUT_DIR, `cart-empty-${vp.w}x${vp.h}.png`);
      await captureScreenshot(`http://127.0.0.1:${PORT}/cart`, emptyFile, vp.w, vp.h);

      // 2. Cart with items state
      const itemsFile = path.join(OUTPUT_DIR, `cart-items-${vp.w}x${vp.h}.png`);
      await captureScreenshot(`http://127.0.0.1:${PORT}/cart?preview=cart`, itemsFile, vp.w, vp.h);

      count += 2;
      console.log(`[${TARGET_DIR}] Captured ${vp.w}x${vp.h} (${vp.name}): empty + items`);
    }

    console.log(`Screenshot capture complete! Total ${count} screenshots saved in ${OUTPUT_DIR}`);
  } catch (err) {
    console.error("Screenshot error:", err);
  } finally {
    console.log("Stopping server...");
    server.kill("SIGTERM");
    setTimeout(() => {
      try {
        server.kill("SIGKILL");
      } catch {}
      process.exit(0);
    }, 1000);
  }
}

run();
