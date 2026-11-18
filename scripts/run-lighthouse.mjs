import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const REPORT_PATH = path.resolve("lighthouse-report.json");

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

async function run() {
  console.log("================================================================================");
  console.log(" RUNNING LIGHTHOUSE AUDIT ON PRODUCTION BUILD");
  console.log(" Target: http://127.0.0.1:" + PORT);
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
    console.log("[Setup] Server is ready! Executing Lighthouse...\n");

    await new Promise((resolve, reject) => {
      const lhArgs = [
        "lighthouse",
        `http://127.0.0.1:${PORT}/`,
        "--output=json",
        `--output-path=${REPORT_PATH}`,
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--only-categories=performance,accessibility,best-practices,seo",
      ];

      const lh = spawn("npx", lhArgs, { stdio: "inherit", shell: true });
      lh.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Lighthouse exited with code ${code}`));
      });
      lh.on("error", reject);
    });

    if (fs.existsSync(REPORT_PATH)) {
      const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
      const categories = report.categories;
      console.log("\n================================================================================");
      console.log(" LIGHTHOUSE AUDIT RESULTS:");
      console.log("================================================================================");
      console.log(`  Performance    : ${Math.round((categories.performance?.score || 0) * 100)} / 100`);
      console.log(`  Accessibility  : ${Math.round((categories.accessibility?.score || 0) * 100)} / 100`);
      console.log(`  Best Practices : ${Math.round((categories["best-practices"]?.score || 0) * 100)} / 100`);
      console.log(`  SEO            : ${Math.round((categories.seo?.score || 0) * 100)} / 100`);
      console.log("================================================================================\n");

      // Extract key metrics
      const audits = report.audits;
      console.log(" Core Web Vitals / Key Metrics:");
      console.log(`  - FCP (First Contentful Paint) : ${audits["first-contentful-paint"]?.displayValue}`);
      console.log(`  - LCP (Largest Contentful Paint): ${audits["largest-contentful-paint"]?.displayValue}`);
      console.log(`  - TBT (Total Blocking Time)    : ${audits["total-blocking-time"]?.displayValue}`);
      console.log(`  - CLS (Cumulative Layout Shift): ${audits["cumulative-layout-shift"]?.displayValue}`);
      console.log(`  - Speed Index                  : ${audits["speed-index"]?.displayValue}`);
    }
  } catch (err) {
    console.error("[FATAL ERROR]", err);
  } finally {
    console.log("\n[Teardown] Shutting down Next.js server...");
    server.kill();
  }
}

run();
