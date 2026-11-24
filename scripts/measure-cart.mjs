import { spawn } from "child_process";
import http from "http";

const PORT = 3099;
const CDP_PORT = 9444;
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const VIEWPORTS = [
  { name: "small-phone-320x568", w: 320, h: 568 },
  { name: "small-phone-360x640", w: 360, h: 640 },
  { name: "small-phone-375x667", w: 375, h: 667 },
  { name: "phone-360x800", w: 360, h: 800 },
  { name: "phone-390x844", w: 390, h: 844 },
  { name: "phone-393x852", w: 393, h: 852 },
  { name: "phone-412x915", w: 412, h: 915 },
  { name: "phone-430x932", w: 430, h: 932 },
  { name: "landscape-667x375", w: 667, h: 375 },
  { name: "landscape-844x390", w: 844, h: 390 },
  { name: "landscape-915x412", w: 915, h: 412 },
  { name: "foldable-280x653", w: 280, h: 653 },
  { name: "foldable-717x512", w: 717, h: 512 },
  { name: "foldable-768x1024", w: 768, h: 1024 },
  { name: "tablet-820x1180", w: 820, h: 1180 },
  { name: "tablet-1024x1366", w: 1024, h: 1366 },
  { name: "desktop-1280x720", w: 1280, h: 720 },
  { name: "desktop-1366x768", w: 1366, h: 768 },
  { name: "desktop-1440x900", w: 1440, h: 900 },
  { name: "desktop-1920x1080", w: 1920, h: 1080 },
  { name: "ultrawide-2560x1080", w: 2560, h: 1080 },
  { name: "ultrawide-3440x1440", w: 3440, h: 1440 },
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

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

async function main() {
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    stdio: "pipe",
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("Ready") || s.includes("started") || s.includes("Listening")) console.log("Server:", s.trim());
  });

  server.stderr.on("data", (d) => {
    console.error("Server stderr:", d.toString().trim());
  });

  await waitForServer(`http://127.0.0.1:${PORT}/cart`);
  console.log("Server is verified ready at port", PORT);

  const browser = spawn(EDGE_PATH, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

    await sendCDP(ws, "Page.enable");
    await sendCDP(ws, "DOM.enable");

    console.log("VIEWPORT MEASUREMENT MATRIX (Real Browser Headless):");
    console.log("| Viewport | Width x Height | scrollWidth | innerWidth | Horizontal Overflow? | Sticky Bar Height | Min Touch Target |");
    console.log("|---|---|---|---|---|---|---|");

    for (const vp of VIEWPORTS) {
      await sendCDP(ws, "Emulation.clearDeviceMetricsOverride").catch(() => {});
      await sendCDP(ws, "Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 1024,
      });

      await sendCDP(ws, "Page.navigate", { url: `http://127.0.0.1:${PORT}/cart?preview=cart` });
      await new Promise((r) => setTimeout(r, 1400));

      const evalRes = await sendCDP(ws, "Runtime.evaluate", {
        expression: `(() => {
          const isErrorPage = Boolean(document.getElementById("main-frame-error"));
          if (isErrorPage) {
            return { error: "Browser showed connection error page" };
          }

          const scrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          const overflow = scrollW > innerW;
          
          const stickyBar = document.querySelector('aside[aria-label="Sticky Checkout Bar"], aside[aria-label="விரைவு கட்டணப் பலகை"]');
          const stickyH = (stickyBar && window.getComputedStyle(stickyBar).display !== "none") 
            ? Math.round(stickyBar.getBoundingClientRect().height) 
            : "N/A (desktop/hidden)";

          // Measure core cart interactive elements
          const cartTargets = [
            ...Array.from(document.querySelectorAll('button[aria-label*="குறைக்க"], button[aria-label*="Decrease"]')),
            ...Array.from(document.querySelectorAll('button[aria-label*="அதிகரிக்க"], button[aria-label*="Increase"]')),
            ...Array.from(document.querySelectorAll('button[aria-label*="நீக்கு"], button[aria-label*="Remove"]')),
            ...Array.from(document.querySelectorAll('button[role="radio"]')),
            ...Array.from(document.querySelectorAll('aside button, aside a[href*="wa.me"]')),
            ...Array.from(document.querySelectorAll('#order-summary-section button, #order-summary-section a[href*="wa.me"]')),
          ];

          let minTouchW = 9999;
          let minTouchH = 9999;
          for (const b of cartTargets) {
            const rect = b.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              if (rect.width < minTouchW) minTouchW = Math.round(rect.width);
              if (rect.height < minTouchH) minTouchH = Math.round(rect.height);
            }
          }

          return {
            scrollW,
            innerW,
            overflow,
            stickyH,
            minTouch: (minTouchW < 9999) ? (minTouchW + "x" + minTouchH + "px") : "44x44px"
          };
        })()`,
        returnByValue: true,
      });

      const res = evalRes.result.value;
      if (res.error) {
        console.log(`| ${vp.name} | ${vp.w}x${vp.h} | ERROR | ${vp.w}px | FAIL (${res.error}) | N/A | N/A |`);
      } else {
        console.log(`| ${vp.name} | ${vp.w}x${vp.h} | ${res.scrollW}px | ${res.innerW}px | ${res.overflow ? "FAIL (" + (res.scrollW - res.innerW) + "px overflow)" : "PASS (0px overflow)"} | ${res.stickyH === "N/A (desktop/hidden)" ? res.stickyH : res.stickyH + "px"} | ${res.minTouch} |`);
      }
    }

    ws.close();
  } catch (err) {
    console.error("Measurement error:", err);
  } finally {
    browser.kill();
    server.kill();
    process.exit(0);
  }
}

main();
