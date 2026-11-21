import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const CDP_PORT = 9223;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FRAMES_DIR = path.resolve("temp-admin-frames");
const OUTPUT_VIDEO = path.resolve("recordings/admin-side-walkthrough.mp4");

for (const dir of ["recordings", FRAMES_DIR]) {
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
    } catch {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" RECORDING FULL 2-MINUTE ADMIN SIDE WALKTHROUGH");
  console.log(" Target Duration: ~120-130 seconds @ 10 fps");
  console.log(" Output: " + OUTPUT_VIDEO);
  console.log("================================================================================\n");

  console.log("[1/6] Launching Next.js production server on port " + PORT + "...");
  const server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  let browser;

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("      Next.js server is active.");

    console.log("[2/6] Launching Microsoft Edge with DevTools Protocol...");
    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--window-size=1440,900",
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-edge-profile-admin"),
        `http://127.0.0.1:${PORT}/admin/login`,
      ],
      { stdio: "ignore" }
    );

    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    console.log("      Edge CDP endpoint connected.");

    const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await versionRes.json();
    const targetPage = pages.find((p) => p.type === "page") || pages[0];
    const wsUrl = targetPage.webSocketDebuggerUrl;

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
        const frameFile = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(6, "0")}.jpg`);
        fs.writeFileSync(frameFile, Buffer.from(base64, "base64"));
        ws.send(JSON.stringify({ id: id++, method: "Page.screencastFrameAck", params: { sessionId } }));
      }
    };

    async function evalCode(expression) {
      return sendCommand("Runtime.evaluate", { expression, awaitPromise: true });
    }

    async function setupPageHelpers() {
      await evalCode(`
        (function() {
          if (document.getElementById('demo-cursor')) return;
          const cur = document.createElement('div');
          cur.id = 'demo-cursor';
          cur.style.cssText = 'position:fixed;width:24px;height:24px;border-radius:50%;background:rgba(180,83,9,0.92);border:2.5px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.45);pointer-events:none;z-index:999999;transition:left 0.4s cubic-bezier(0.16,1,0.3,1),top 0.4s cubic-bezier(0.16,1,0.3,1),transform 0.15s ease;top:200px;left:200px;transform:translate(-50%,-50%);';
          document.body.appendChild(cur);

          window.moveCursor = function(x, y) {
            cur.style.left = x + 'px';
            cur.style.top = y + 'px';
          };

          window.clickCursor = function() {
            cur.style.transform = 'translate(-50%, -50%) scale(0.7)';
            setTimeout(() => { cur.style.transform = 'translate(-50%, -50%) scale(1)'; }, 180);
          };

          window.smoothScroll = function(targetY, durationMs = 1500) {
            const startY = window.scrollY;
            const diff = targetY - startY;
            const startTime = performance.now();
            return new Promise((resolve) => {
              function step(now) {
                const progress = Math.min((now - startTime) / durationMs, 1);
                const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
                window.scrollTo(0, startY + diff * ease);
                if (progress < 1) requestAnimationFrame(step);
                else resolve();
              }
              requestAnimationFrame(step);
            });
          };
        })()
      `);
    }

    async function navigateTo(urlPath) {
      await sendCommand("Page.navigate", { url: `http://127.0.0.1:${PORT}${urlPath}` });
      await sleep(2000);
      await setupPageHelpers();
      await sleep(1000);
    }

    await sendCommand("Page.enable");
    await sendCommand("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
    console.log("[3/6] Screencast stream started. Running 2-minute choreographed walkthrough...\n");

    // -------------------------------------------------------------------------
    // SCENE 1: ADMIN LOGIN PORTAL (/admin/login) (0:00 - 0:20, 20 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 1: Dedicated Admin Login Portal (/admin/login) [20s]");
    await navigateTo("/admin/login");
    await evalCode("window.moveCursor(720, 320)");
    await sleep(4000);

    // Type Admin Email
    console.log("      Entering admin email...");
    await evalCode("window.moveCursor(720, 360)");
    await evalCode(`
      const emailInput = document.querySelector('input[type="email"]') || document.querySelectorAll('input')[0];
      if (emailInput) {
        emailInput.value = 'admin.audit@methagukalanjiyam.in';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(4000);

    // Type Admin Password
    console.log("      Entering admin password...");
    await evalCode("window.moveCursor(720, 440);");
    await evalCode(`
      const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
      if (passInput) {
        passInput.value = '••••••••••••••••';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(4000);

    // Click Submit
    console.log("      Submitting credentials...");
    await evalCode("window.moveCursor(720, 520); window.clickCursor();");
    await sleep(4000);

    // -------------------------------------------------------------------------
    // SCENE 2: ADMIN TWO-FACTOR OTP VERIFICATION (0:20 - 0:35, 15 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 2: 2FA Email OTP Verification Step [15s]");
    await evalCode("window.moveCursor(720, 440);");
    await evalCode(`
      const otpInput = document.querySelector('input[placeholder*="OTP"]') || document.querySelector('input[maxLength="6"]') || document.querySelector('input');
      if (otpInput) {
        otpInput.value = '849201';
        otpInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(5000);

    await evalCode("window.moveCursor(720, 520); window.clickCursor();");
    await sleep(5000);

    // -------------------------------------------------------------------------
    // SCENE 3: ADMIN MAIN DASHBOARD & REVENUE KPIS (/admin) (0:35 - 1:00, 25 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 3: Enterprise Admin Dashboard & KPIs (/admin) [25s]");
    await navigateTo("/admin");
    await evalCode("window.moveCursor(350, 220)");
    await sleep(5000);

    // Inspect Metric Cards
    await evalCode("window.moveCursor(600, 220)");
    await sleep(4000);

    await evalCode("window.moveCursor(920, 220)");
    await sleep(4000);

    // Smooth scroll through revenue charts and recent orders
    console.log("      Reviewing revenue analytics and recent transactions...");
    await evalCode("window.smoothScroll(400, 2000)");
    await evalCode("window.moveCursor(720, 380)");
    await sleep(5000);

    await evalCode("window.smoothScroll(850, 2000)");
    await sleep(4000);

    await evalCode("window.smoothScroll(0, 1500)");
    await sleep(3000);

    // -------------------------------------------------------------------------
    // SCENE 4: ORDERS FULFILLMENT & DISPATCH (/admin/orders) (1:00 - 1:30, 30 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 4: Orders Management & Courier Dispatch (/admin/orders) [30s]");
    await navigateTo("/admin/orders");
    await evalCode("window.moveCursor(400, 220)");
    await sleep(5000);

    // Scroll through orders table
    await evalCode("window.smoothScroll(350, 2000)");
    await evalCode("window.moveCursor(650, 350)");
    await sleep(6000);

    // Move to status filters
    console.log("      Testing Order status filters...");
    await evalCode("window.moveCursor(320, 170); window.clickCursor();");
    await sleep(5000);

    await evalCode("window.smoothScroll(650, 2000)");
    await evalCode("window.moveCursor(800, 480)");
    await sleep(6000);

    await evalCode("window.smoothScroll(0, 1500)");
    await sleep(4000);

    // -------------------------------------------------------------------------
    // SCENE 5: CATALOG & INVENTORY MANAGEMENT (/admin/books) (1:30 - 1:55, 25 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 5: Book Catalog & Live Inventory (/admin/books) [25s]");
    await navigateTo("/admin/books");
    await evalCode("window.moveCursor(380, 200)");
    await sleep(5000);

    // Scroll through inventory items
    await evalCode("window.smoothScroll(450, 2000)");
    await evalCode("window.moveCursor(720, 350)");
    await sleep(5000);

    await evalCode("window.smoothScroll(950, 2000)");
    await evalCode("window.moveCursor(950, 420)");
    await sleep(5000);

    await evalCode("window.smoothScroll(0, 1500)");
    await sleep(4000);

    // -------------------------------------------------------------------------
    // SCENE 6: PLATFORM & SHIPPING SETTINGS (/admin/settings) (1:55 - 2:20, 25 seconds)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 6: Shipping Rates & Deliverable Pincodes (/admin/settings) [25s]");
    await navigateTo("/admin/settings");
    await evalCode("window.moveCursor(450, 250)");
    await sleep(5000);

    // Inspect delivery charges (TN ₹60 vs Other States ₹100)
    console.log("      Inspecting Tamil Nadu ₹60 & Rest of India ₹100 delivery settings...");
    await evalCode("window.smoothScroll(350, 2000)");
    await evalCode("window.moveCursor(650, 380)");
    await sleep(6000);

    // Inspect deliverable pincodes
    await evalCode("window.smoothScroll(700, 2000)");
    await evalCode("window.moveCursor(650, 480)");
    await sleep(5000);

    // WhatsApp notifications toggle
    await evalCode("window.smoothScroll(1050, 2000)");
    await evalCode("window.moveCursor(720, 520)");
    await sleep(5000);

    await evalCode("window.smoothScroll(0, 1500)");
    await sleep(4000);

    // -------------------------------------------------------------------------
    // FINALIZE RECORDING
    // -------------------------------------------------------------------------
    console.log("[4/6] Stopping screencast capture...");
    await sendCommand("Page.stopScreencast");
    ws.close();

    console.log(`[5/6] Total frames captured: ${frameCount}. Encoding MP4 video with ffmpeg...`);
    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-y",
        "-framerate", "10",
        "-i", path.join(FRAMES_DIR, "frame_%06d.jpg"),
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUTPUT_VIDEO,
      ], { stdio: "inherit" });
      ff.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("ffmpeg exited with code " + code));
      });
      ff.on("error", reject);
    });

    const stats = fs.statSync(OUTPUT_VIDEO);
    console.log("\n================================================================================");
    console.log(`[6/6] SUCCESS: Full 2-minute admin side video recorded successfully!`);
    console.log(`      File: ${OUTPUT_VIDEO}`);
    console.log(`      Duration: ${(frameCount / 10).toFixed(1)} seconds (~${(frameCount / 600).toFixed(1)} minutes)`);
    console.log(`      Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
    console.log("================================================================================\n");

  } finally {
    if (browser) {
      browser.kill();
      await sleep(1000);
    }
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile-admin", { recursive: true, force: true });
      fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
