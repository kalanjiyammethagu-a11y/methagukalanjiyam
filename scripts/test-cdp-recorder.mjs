import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const CDP_PORT = 9222;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FRAMES_DIR = path.resolve("temp-frames");
const TEST_VIDEO = path.resolve("recordings/test-sample.mp4");

for (const dir of ["recordings", FRAMES_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {}
    await sleep(300);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("1. Starting Next.js server on port " + PORT + "...");
  const server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  let browser;

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("   Next.js server is ready.");

    console.log("2. Launching headless Edge with CDP on port " + CDP_PORT + "...");
    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--window-size=1280,800",
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-edge-profile"),
        `http://127.0.0.1:${PORT}/`,
      ],
      { stdio: "ignore" }
    );

    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    console.log("   Edge CDP endpoint is ready.");

    const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await versionRes.json();
    const targetPage = pages.find((p) => p.type === "page") || pages[0];
    const wsUrl = targetPage.webSocketDebuggerUrl;
    console.log("3. Connecting WebSocket to " + wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === msgId) {
            ws.removeEventListener("message", handler);
            resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    let frameCount = 0;
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === "Page.screencastFrame") {
        const { data: base64, sessionId } = data.params;
        frameCount++;
        const frameFile = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(5, "0")}.jpg`);
        fs.writeFileSync(frameFile, Buffer.from(base64, "base64"));
        ws.send(JSON.stringify({ id: id++, method: "Page.screencastFrameAck", params: { sessionId } }));
      }
    };

    await sendCommand("Page.enable");
    await sendCommand("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });

    console.log("4. Waiting for 3 seconds while recording homepage...");
    await sleep(3000);

    console.log("5. Stopping screencast...");
    await sendCommand("Page.stopScreencast");
    ws.close();

    console.log(`6. Captured ${frameCount} frames. Encoding with ffmpeg...`);
    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-y",
        "-framerate", "10",
        "-i", path.join(FRAMES_DIR, "frame_%05d.jpg"),
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        TEST_VIDEO,
      ], { stdio: "inherit" });
      ff.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("ffmpeg exited with code " + code));
      });
      ff.on("error", reject);
    });

    console.log("7. Recording successfully completed! File size:", fs.statSync(TEST_VIDEO).size, "bytes");

  } finally {
    if (browser) {
      browser.kill();
      await sleep(1000);
    }
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile", { recursive: true, force: true });
      fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
