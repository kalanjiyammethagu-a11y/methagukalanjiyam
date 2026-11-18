import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        return true;
      }
    } catch {
      await sleep(500);
    }
  }
  throw new Error(`Server failed to respond at ${url} within ${timeoutMs}ms`);
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
    child.on("close", () => {
      resolve();
    });
    child.on("error", () => {
      resolve();
    });
  });
}

async function run() {
  console.log("================================================================================");
  console.log(" CAPTURING RESPONSIVE SCREENSHOTS FOR HERO SLIDER");
  console.log(" Target: Next.js Production Build on Port " + PORT);
  console.log("================================================================================\n");

  const server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
    }
  );

  server.stdout.on("data", (d) => {
    const text = d.toString();
    if (text.includes("Ready")) console.log("       [Server]", text.trim());
  });

  try {
    console.log("[Setup] Waiting for server at http://127.0.0.1:" + PORT + "...");
    await waitForServer(`http://127.0.0.1:${PORT}/`);
    console.log("[Setup] Server is ready! Capturing screenshots...\n");

    // Allow Next.js client hydration and initial image decode
    await sleep(2000);

    const breakpoints = [
      { label: "360px", width: 360, height: 740, desc: "Mobile Viewport (360px)" },
      { label: "768px", width: 768, height: 1024, desc: "Tablet Viewport (768px)" },
      { label: "1280px", width: 1280, height: 800, desc: "Desktop Viewport (1280px)" },
      { label: "1920px", width: 1920, height: 1080, desc: "Widescreen Viewport (1920px)" },
      { label: "landscape-phone", width: 844, height: 390, desc: "Landscape Phone Viewport (844x390px)" },
    ];

    for (const bp of breakpoints) {
      const fileOut = path.join(OUTPUT_DIR, `hero-slider-${bp.label}.png`);
      console.log(`[Capture] ${bp.desc} -> ${path.basename(fileOut)}`);
      await captureScreenshot(`http://127.0.0.1:${PORT}/`, fileOut, bp.width, bp.height);
      await sleep(800);
    }

    console.log("\n[Success] All responsive hero slider screenshots captured in " + OUTPUT_DIR);
  } catch (err) {
    console.error("[FATAL ERROR]", err);
  } finally {
    console.log("\n[Teardown] Shutting down Next.js server...");
    server.kill();
  }
}

run();

