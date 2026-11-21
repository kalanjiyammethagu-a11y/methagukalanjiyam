import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const CDP_PORT = 9222;
const BROWSER_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FRAMES_DIR = path.resolve("temp-product-frames");
const OUTPUT_VIDEO = path.resolve("recordings/product-side-walkthrough.mp4");

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
  console.log(" RECORDING PRODUCT SIDE WALKTHROUGH (5 PRODUCTS + STOREFRONT + CART)");
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
        "--user-data-dir=" + path.resolve("temp-edge-profile-prod"),
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
          cur.style.cssText = 'position:fixed;width:24px;height:24px;border-radius:50%;background:rgba(13,92,58,0.88);border:2.5px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.45);pointer-events:none;z-index:999999;transition:left 0.4s cubic-bezier(0.16,1,0.3,1),top 0.4s cubic-bezier(0.16,1,0.3,1),transform 0.15s ease;top:200px;left:200px;transform:translate(-50%,-50%);';
          document.body.appendChild(cur);

          window.moveCursor = function(x, y) {
            cur.style.left = x + 'px';
            cur.style.top = y + 'px';
          };

          window.clickCursor = function() {
            cur.style.transform = 'translate(-50%, -50%) scale(0.7)';
            setTimeout(() => { cur.style.transform = 'translate(-50%, -50%) scale(1)'; }, 180);
          };

          window.smoothScroll = function(targetY, durationMs = 1200) {
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
      await sleep(1500);
      await setupPageHelpers();
      await sleep(800);
    }

    await sendCommand("Page.enable");
    await sendCommand("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
    console.log("[3/6] Screencast stream started. Beginning choreographed walkthrough...\n");

    // -------------------------------------------------------------------------
    // SCENE 1: HOMEPAGE & HERO ARCHIVAL SLIDER (0:00 - 0:35)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 1: Homepage & Editorial Hero Carousel");
    await navigateTo("/?slide=0");
    await evalCode("window.moveCursor(350, 450)");
    await sleep(2500);

    // Slide 2: Thileepan
    await evalCode("window.moveCursor(1200, 750); window.clickCursor();");
    await evalCode("document.querySelector('button[aria-label*=\"Next\"]')?.click();");
    await sleep(3500);

    // Slide 3: Katunayake Air Base
    await evalCode("window.moveCursor(1200, 750); window.clickCursor();");
    await evalCode("document.querySelector('button[aria-label*=\"Next\"]')?.click();");
    await sleep(3500);

    // Slide 4: Leader Thoughts
    await evalCode("window.moveCursor(1200, 750); window.clickCursor();");
    await evalCode("document.querySelector('button[aria-label*=\"Next\"]')?.click();");
    await sleep(3500);

    // Scroll through Bento grid
    console.log("   -> Scrolling through Homepage Bento Showcase");
    await evalCode("window.smoothScroll(650, 2000)");
    await evalCode("window.moveCursor(600, 400)");
    await sleep(2500);

    await evalCode("window.smoothScroll(1300, 2000)");
    await evalCode("window.moveCursor(450, 350)");
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 2: BOOKS ARCHIVE CATALOG (/books) (0:35 - 1:10)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 2: Full Archival Catalog (/books)");
    await navigateTo("/books");
    await evalCode("window.moveCursor(400, 220)");
    await sleep(2000);

    // Scroll through catalog grid
    await evalCode("window.smoothScroll(500, 1800)");
    await evalCode("window.moveCursor(650, 380)");
    await sleep(2500);

    await evalCode("window.smoothScroll(1100, 1800)");
    await sleep(2500);

    await evalCode("window.smoothScroll(0, 1200)");
    await sleep(1500);

    // -------------------------------------------------------------------------
    // SCENE 3: PRODUCT 1 — கட்டுநாயக்கா தாக்குதல் வெற்றி (1:10 - 1:45)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 3: Product 1: Katunayake Victory (/books/katunayake-attack-victory)");
    await navigateTo("/books/katunayake-attack-victory");
    await evalCode("window.moveCursor(400, 350)");
    await sleep(2500);

    await evalCode("window.smoothScroll(350, 1500)");
    await evalCode("window.moveCursor(850, 420)");
    await sleep(2000);

    // Add to cart
    console.log("      Adding Product 1 to cart...");
    await evalCode("window.moveCursor(950, 520); window.clickCursor();");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('கூடையில்') || b.textContent.includes('Cart') || b.textContent.includes('வாங்குக'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 4: PRODUCT 2 — திலீபனுடன் 12 நாட்கள் (1:45 - 2:20)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 4: Product 2: Thileepan Satyagraha (/books/thileepanudan-12-naatkal)");
    await navigateTo("/books/thileepanudan-12-naatkal");
    await evalCode("window.moveCursor(450, 300)");
    await sleep(2500);

    await evalCode("window.smoothScroll(300, 1500)");
    await evalCode("window.moveCursor(900, 480); window.clickCursor();");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('கூடையில்') || b.textContent.includes('Cart') || b.textContent.includes('வாங்குக'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 5: PRODUCT 3 — புறநானூற்று வீரன் (2:20 - 2:55)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 5: Product 3: Purananooru Veeran (/books/purananooru-veeran)");
    await navigateTo("/books/purananooru-veeran");
    await evalCode("window.moveCursor(400, 320)");
    await sleep(2500);

    await evalCode("window.moveCursor(900, 480); window.clickCursor();");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('கூடையில்') || b.textContent.includes('Cart') || b.textContent.includes('வாங்குக'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 6: PRODUCT 4 — தலைவர் சிந்தனைகள் (2:55 - 3:30)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 6: Product 4: Leader Thoughts (/books/leader-thoughts)");
    await navigateTo("/books/leader-thoughts");
    await evalCode("window.moveCursor(420, 320)");
    await sleep(2500);

    await evalCode("window.moveCursor(900, 480); window.clickCursor();");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('கூடையில்') || b.textContent.includes('Cart') || b.textContent.includes('வாங்குக'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 7: PRODUCT 5 — நெஞ்சுரம் (3:30 - 4:05)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 7: Product 5: Nenjuram (/books/nenjuram)");
    await navigateTo("/books/nenjuram");
    await evalCode("window.moveCursor(400, 320)");
    await sleep(2500);

    await evalCode("window.moveCursor(900, 480); window.clickCursor();");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('கூடையில்') || b.textContent.includes('Cart') || b.textContent.includes('வாங்குக'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // SCENE 8: CART EXPERIENCE & PINCODE SHIPPING EVALUATION (4:05 - 4:45)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 8: Cart Management & Shipping Calculation (/cart)");
    await navigateTo("/cart");
    await evalCode("window.moveCursor(500, 300)");
    await sleep(2500);

    // Scroll through 5 cart items
    await evalCode("window.smoothScroll(350, 1500)");
    await evalCode("window.moveCursor(850, 400)");
    await sleep(2500);

    // Test Tamil Nadu pincode (600001 -> ST Courier ₹60)
    console.log("      Testing Tamil Nadu Pincode 600001 (₹60 delivery)...");
    await evalCode(`
      const pinInput = document.querySelector('input[placeholder*="Pincode"]') || document.querySelector('input[name="pincode"]') || document.querySelectorAll('input')[0];
      if (pinInput) {
        pinInput.value = '600001';
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        pinInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await sleep(2500);

    // Scroll down to Order Summary
    await evalCode("window.smoothScroll(650, 1500)");
    await evalCode("window.moveCursor(950, 550)");
    await sleep(3000);

    // -------------------------------------------------------------------------
    // SCENE 9: CUSTOMER ORDER RECEIPT CONFIRMATION (4:45 - 5:15)
    // -------------------------------------------------------------------------
    console.log("   -> Scene 9: Order Confirmation Receipt (/orders/ORD-2026-8942)");
    await navigateTo("/orders/ORD-2026-8942");
    await evalCode("window.moveCursor(600, 250)");
    await sleep(2500);

    await evalCode("window.smoothScroll(400, 1800)");
    await evalCode("window.moveCursor(650, 450)");
    await sleep(3000);

    await evalCode("window.smoothScroll(0, 1200)");
    await sleep(2000);

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
    console.log(`[6/6] SUCCESS: Product side video recorded successfully!`);
    console.log(`      File: ${OUTPUT_VIDEO}`);
    console.log(`      Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
    console.log("================================================================================\n");

  } finally {
    if (browser) {
      browser.kill();
      await sleep(1000);
    }
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile-prod", { recursive: true, force: true });
      fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);

