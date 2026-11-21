import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const CDP_PORT = 9225;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve("screenshots");
const ARTIFACT_DIR = path.resolve("C:\\Users\\madha\\.gemini\\antigravity\\brain\\52ccce1b-fadc-48a3-8d75-215141fc2e85\\screenshots");

for (const dir of [OUTPUT_DIR, ARTIFACT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      await sleep(400);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" CAPTURING ACCURATE RESPONSIVE SCREENSHOTS VIA DEVTOOLS PROTOCOL");
  console.log(" Target: Next.js Production Build on Port " + PORT);
  console.log("================================================================================\n");

  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  let browser;

  try {
    console.log("[1/4] Waiting for server at http://127.0.0.1:" + PORT + "...");
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("      Server is ready!");

    console.log("[2/4] Launching Microsoft Edge with CDP on port " + CDP_PORT + "...");
    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-edge-profile-shots"),
        `http://127.0.0.1:${PORT}/`,
      ],
      { stdio: "ignore" }
    );

    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await versionRes.json();
    const targetPage = pages.find((p) => p.type === "page") || pages[0];
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise((resolve) => (ws.onopen = resolve));

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");

    async function capture(fileName, width, height) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await sleep(1400); // allow font rendering, layout, and slide fade-in transition
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      const buf = Buffer.from(data, "base64");
      const localFile = path.join(OUTPUT_DIR, fileName);
      const artifactFile = path.join(ARTIFACT_DIR, fileName);
      fs.writeFileSync(localFile, buf);
      fs.writeFileSync(artifactFile, buf);
      console.log(`      Saved ${fileName} (${width}x${height}, ${(buf.length / 1024).toFixed(1)} KB)`);
    }

    console.log("[3/4] Capturing responsive viewport breakpoints...");
    // 360px Mobile
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?slide=0` });
    await capture("hero-slider-360px.png", 360, 740);

    // 768px Tablet
    await capture("hero-slider-768px.png", 768, 1024);

    // 1280px Desktop
    await capture("hero-slider-1280px.png", 1280, 800);

    // 1920px Widescreen
    await capture("hero-slider-1920px.png", 1920, 1080);

    console.log("[4/4] Capturing each active slide at 1280px desktop...");
    // Slide 1 (Flagship Archives)
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?slide=0` });
    await capture("hero-slider-slide-1.png", 1280, 800);

    // Slide 2 (Thileepan Satyagraha)
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?slide=1` });
    await capture("hero-slider-slide-2.png", 1280, 800);

    // Slide 3 (Katunayake Victory)
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?slide=2` });
    await capture("hero-slider-slide-3.png", 1280, 800);

    // Slide 4 (Leader Thoughts)
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?slide=3` });
    await capture("hero-slider-slide-4.png", 1280, 800);

    ws.close();
    console.log("\nAll 8 responsive screenshots successfully captured with exact live rendering!\n");

  } finally {
    if (browser) browser.kill();
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile-shots", { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
