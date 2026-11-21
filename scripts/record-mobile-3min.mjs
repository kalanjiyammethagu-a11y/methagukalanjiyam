import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3095;
const CDP_PORT = 9230;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FRAMES_DIR = path.resolve("temp-mobile-3min-frames");
const OUTPUT_VIDEO = path.resolve("recordings/mobile-ui-3min-walkthrough.mp4");
const ARTIFACT_DIR = "C:\\Users\\madha\\.gemini\\antigravity\\brain\\52ccce1b-fadc-48a3-8d75-215141fc2e85\\recordings";

for (const dir of ["recordings", FRAMES_DIR, ARTIFACT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status) return true;
    } catch (err) {
      lastErr = err;
    }
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}: ${lastErr?.message || lastErr}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" RECORDING 3-MINUTE MOBILE UI WALKTHROUGH");
  console.log(" Target: 180 seconds (3 minutes) covering Consumer Storefront + Admin Mobile");
  console.log(" Viewport: 390x844 (Mobile Smartphone Retina 2x)");
  console.log(" Output: " + OUTPUT_VIDEO);
  console.log("================================================================================\n");

  console.log("[1/6] Launching Next.js production server on port " + PORT + "...");
  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  let browser;

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("      Next.js server is active.");

    console.log("[2/6] Launching Microsoft Edge in Mobile Emulation mode...");
    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--window-size=430,932",
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-edge-profile-mobile-3min"),
        `http://127.0.0.1:${PORT}/`,
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
    await new Promise((resolve) => (ws.onopen = resolve));

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

    // Enable CDP domains
    await sendCommand("Page.enable");
    await sendCommand("DOM.enable");
    await sendCommand("Network.enable");

    // Configure exact mobile device metrics (390x844 iPhone 14/15/16)
    await sendCommand("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    // Helper: evaluate JS in page
    async function evalCode(expression) {
      return await sendCommand("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
    }

    // Helper: inject touch cursor and smooth scroll scripts into page
    async function injectMobileTouchHelpers() {
      await evalCode(`
        (function() {
          if (document.getElementById('mobile-touch-cursor')) return;
          const dot = document.createElement('div');
          dot.id = 'mobile-touch-cursor';
          dot.style.cssText = 'position:fixed;width:28px;height:28px;border-radius:50%;background:rgba(10,104,71,0.45);border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 0 14px rgba(10,104,71,0.65);pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:transform 0.12s ease, background 0.12s ease;display:none;';
          document.body.appendChild(dot);

          window.touchAt = function(x, y) {
            dot.style.display = 'block';
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
          };

          window.tap = function(x, y) {
            window.touchAt(x, y);
            dot.style.transform = 'translate(-50%,-50%) scale(0.8)';
            dot.style.background = 'rgba(10,104,71,0.85)';
            const el = document.elementFromPoint(x, y);
            if (el) {
              el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
              el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
              el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
            }
            setTimeout(() => {
              dot.style.transform = 'translate(-50%,-50%) scale(1)';
              dot.style.background = 'rgba(10,104,71,0.45)';
            }, 180);
          };

          window.hideTouch = function() {
            dot.style.display = 'none';
          };

          window.smoothScroll = function(targetY, durationMs = 1500) {
            return new Promise((resolve) => {
              const startY = window.scrollY;
              const diff = targetY - startY;
              const startTime = performance.now();
              function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                window.scrollTo(0, startY + diff * ease);
                if (progress < 1) requestAnimationFrame(step);
                else resolve();
              }
              requestAnimationFrame(step);
            });
          };
        })();
      `);
    }

    async function navigateMobile(urlPath, delayMs = 1200) {
      await sendCommand("Page.navigate", { url: `http://127.0.0.1:${PORT}${urlPath}` });
      await sleep(delayMs);
      await injectMobileTouchHelpers();
    }

    console.log("[3/6] Starting screencast capturing at 390x844...");
    await sendCommand("Page.startScreencast", {
      format: "jpeg",
      quality: 90,
      maxWidth: 780,
      maxHeight: 1688,
      everyNthFrame: 1,
    });

    // =========================================================================
    // PART 1: MOBILE CONSUMER STOREFRONT (0:00 - 1:30 = 90s)
    // =========================================================================
    console.log("\n--- PART 1: CONSUMER STOREFRONT MOBILE EXPERIENCE ---");

    // 1. Home Page & Hero Slider (0:00 - 0:32, 32s)
    console.log("[P1-1] Storefront Homepage & Vivid Hero Slider...");
    await navigateMobile("/");
    await sleep(2000);

    // Showcase hero slider controls and cycle through all 4 slides
    console.log("      Cycling Slide 1 -> Slide 2...");
    await evalCode("window.touchAt(345, 620)");
    await sleep(1000);
    await evalCode("window.tap(345, 620)"); // Next slide button
    await sleep(4000);

    console.log("      Cycling Slide 2 -> Slide 3...");
    await evalCode("window.tap(345, 620)");
    await sleep(4000);

    console.log("      Cycling Slide 3 -> Slide 4...");
    await evalCode("window.tap(345, 620)");
    await sleep(4000);

    console.log("      Tapping Hero CTA 'நூல்களைக் காண்க'...");
    await evalCode("window.tap(145, 550)");
    await sleep(3500);

    // 2. Curated Pillars, Category Filter & Featured Catalog (0:32 - 1:00, 28s)
    console.log("[P1-2] Exploring Curated Pillars & Interactive Categories...");
    await evalCode("window.smoothScroll(650, 1600)");
    await sleep(2500);

    await evalCode("window.smoothScroll(1150, 1600)");
    await sleep(2500);

    // Tap category pill tabs
    console.log("      Tapping Category: ஆவணத் தொகுப்பு...");
    await evalCode("window.tap(120, 260)");
    await sleep(3500);

    console.log("      Tapping Category: நினைவுக் குறிப்புகள்...");
    await evalCode("window.tap(240, 260)");
    await sleep(3500);

    console.log("      Tapping Category: All Books...");
    await evalCode("window.tap(45, 260)");
    await sleep(3500);

    await evalCode("window.smoothScroll(1800, 1800)");
    await sleep(3000);

    // 3. Book Detail Page & Add to Cart (1:00 - 1:18, 18s)
    console.log("[P1-3] Viewing Book Detail & Adding to Cart...");
    await navigateMobile("/books/katunayake-attack-victory");
    await sleep(2000);

    await evalCode("window.smoothScroll(350, 1400)");
    await sleep(2000);

    // Tap quantity selector '+'
    console.log("      Increasing quantity...");
    await evalCode("window.tap(235, 595)");
    await sleep(1500);
    await evalCode("window.tap(235, 595)");
    await sleep(1500);

    // Tap Add to Cart
    console.log("      Tapping Add to Cart...");
    await evalCode("window.tap(195, 655)");
    await sleep(3500);

    // 4. Shopping Cart & Supporters Showcase (1:18 - 1:32, 14s)
    console.log("[P1-4] Shopping Cart & Public Team Roster...");
    await navigateMobile("/cart");
    await sleep(2500);

    await evalCode("window.smoothScroll(250, 1200)");
    await sleep(2500);

    // Open mobile supporters roster
    await navigateMobile("/supporters");
    await sleep(2000);
    await evalCode("window.smoothScroll(400, 1500)");
    await sleep(3000);

    // =========================================================================
    // PART 2: MOBILE ADMIN EXPERIENCE & ERP INTEGRATION (1:32 - 3:00 = 88s)
    // =========================================================================
    console.log("\n--- PART 2: MOBILE ADMIN & ERPNEXT INTEGRATION ---");

    // Set admin mock cookie for admin pages
    await sendCommand("Network.setCookie", {
      name: "mk_admin_session",
      value: "eyJ1c2VySWQiOiJhZG1pbi0wMSJ9.signature_valid_mock_hmac_hash",
      domain: "127.0.0.1",
      path: "/admin",
      httpOnly: true,
      secure: false,
    });

    // 5. Admin Login & Dashboard Overview (1:32 - 1:52, 20s)
    console.log("[P2-1] Admin Dashboard & Frosted Mobile Bottom Navigation...");
    await navigateMobile("/admin");
    await sleep(2500);

    // Scroll through KPI metric cards on mobile
    await evalCode("window.smoothScroll(380, 1500)");
    await sleep(3000);

    await evalCode("window.smoothScroll(720, 1500)");
    await sleep(3000);

    await evalCode("window.smoothScroll(0, 1200)");
    await sleep(2000);

    // 6. Mobile Orders Management (1:52 - 2:12, 20s)
    console.log("[P2-2] Mobile Orders Management & Filter Tabs...");
    // Tap Orders icon in bottom bar (x=115, y=815)
    await evalCode("window.tap(115, 815)");
    await sleep(1500);
    await navigateMobile("/admin/orders");
    await sleep(2000);

    // Showcase order filter tabs on mobile
    console.log("      Tapping 'Confirmed' filter tab...");
    await evalCode("window.tap(195, 230)");
    await sleep(3000);

    console.log("      Tapping 'All Orders' filter tab...");
    await evalCode("window.tap(55, 230)");
    await sleep(3000);

    // Scroll order list
    await evalCode("window.smoothScroll(450, 1500)");
    await sleep(3000);

    // 7. Mobile Supporters & Team CRUD (2:12 - 2:38, 26s)
    console.log("[P2-3] Mobile Team CRUD & Modal Ergonomics...");
    // Tap Team icon in bottom bar (x=345, y=815)
    await evalCode("window.tap(345, 815)");
    await sleep(1500);
    await navigateMobile("/admin/supporters");
    await sleep(2000);

    // Tap "Add New Member" button (x=195, y=250)
    console.log("      Tapping 'Add New Member' button...");
    await evalCode("window.tap(195, 250)");
    await sleep(2000);

    // Showcase the newly pinned modal footer with Cancel and Add to Roster buttons
    console.log("      Demonstrating scrollable modal with pinned footer...");
    await evalCode(`
      const modalBody = document.querySelector('form .overflow-y-auto');
      if (modalBody) {
        modalBody.scrollTo({ top: 200, behavior: 'smooth' });
      }
    `);
    await sleep(3000);

    await evalCode(`
      const modalBody = document.querySelector('form .overflow-y-auto');
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
    `);
    await sleep(2000);

    // Tap Cancel button in pinned footer (x=160, y=700)
    console.log("      Tapping pinned Cancel button...");
    await evalCode(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(2500);

    // 8. Mobile ERPNext Integration & Outbox Sync (2:38 - 2:54, 16s)
    console.log("[P2-4] Mobile ERPNext Integration & Outbox Sync...");
    await navigateMobile("/admin/erp");
    await sleep(2500);

    // Showcase Cloudflare Error 1033 notice and Outbox status
    await evalCode("window.smoothScroll(280, 1400)");
    await sleep(2500);

    // Tap "Test Connection" button (x=110, y=280)
    console.log("      Tapping 'Test Connection' button...");
    await evalCode("window.tap(110, 280)");
    await sleep(3500);

    await evalCode("window.smoothScroll(650, 1500)");
    await sleep(3000);

    // 9. Store Settings & Wrap-up (2:54 - 3:00, 6s)
    console.log("[P2-5] Concluding tour on Store Settings...");
    await navigateMobile("/admin/settings");
    await sleep(2500);

    await evalCode("window.smoothScroll(300, 1200)");
    await sleep(3000);

    // =========================================================================
    // FINALIZE & ENCODE MP4
    // =========================================================================
    console.log("\n[4/6] Stopping screencast capture...");
    await sendCommand("Page.stopScreencast");
    ws.close();

    const targetSeconds = 180; // Exact 3 minutes
    const computedFramerate = frameCount / targetSeconds;
    console.log(`[5/6] Total frames captured: ${frameCount}. Encoding exact 3-minute (${targetSeconds}s) MP4 video with ffmpeg...`);
    console.log(`      Computed framerate: ${computedFramerate.toFixed(3)} fps for 180s duration.`);

    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-y",
        "-framerate", computedFramerate.toFixed(4),
        "-i", path.join(FRAMES_DIR, "frame_%06d.jpg"),
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=24",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-t", "180",
        OUTPUT_VIDEO,
      ], { stdio: "inherit" });
      ff.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("ffmpeg exited with code " + code));
      });
      ff.on("error", reject);
    });

    const stats = fs.statSync(OUTPUT_VIDEO);
    const artifactDest = path.join(ARTIFACT_DIR, "mobile-ui-3min-walkthrough.mp4");
    fs.copyFileSync(OUTPUT_VIDEO, artifactDest);

    console.log("\n================================================================================");
    console.log(`[6/6] SUCCESS: Full 3-minute mobile UI video recorded successfully!`);
    console.log(`      File: ${OUTPUT_VIDEO}`);
    console.log(`      Artifact: ${artifactDest}`);
    console.log(`      Duration: 180.0 seconds (3 minutes 00 seconds)`);
    console.log(`      Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
    console.log("================================================================================\n");

  } finally {
    if (browser) browser.kill();
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile-mobile-3min", { recursive: true, force: true });
      fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
