import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3000;
const CDP_PORT = 9235;
const BROWSER_PATH = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const UX_AUDIT_DIR = path.resolve("ux-audit/screenshots");
const ARTIFACT_DIR = path.resolve("C:\\Users\\madha\\.gemini\\antigravity\\brain\\52ccce1b-fadc-48a3-8d75-215141fc2e85\\screenshots");

for (const dir of [UX_AUDIT_DIR, ARTIFACT_DIR]) {
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
      await sleep(300);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" SENIOR MOBILE UX AUDIT: EMPIRICAL MEASUREMENT & SCREENSHOT VERIFICATION");
  console.log("================================================================================\n");

  let browser;
  const metrics = [];

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/api/health`);
    console.log(`[1] Server active at http://127.0.0.1:${PORT}`);

    console.log(`[2] Launching browser: ${BROWSER_PATH}`);
    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-ux-profile"),
        `http://127.0.0.1:${PORT}/`,
      ],
      { stdio: "ignore" }
    );

    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await listRes.json();
    const target = pages.find((p) => p.type === "page") || pages[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
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
    await send("Network.enable");

    const routes = [
      { name: "home", path: "/" },
      { name: "books-catalog", path: "/books" },
      { name: "book-detail", path: "/books/katunayake-attack-victory" },
      { name: "cart", path: "/cart" },
      { name: "login", path: "/login" },
      { name: "signup", path: "/signup" },
      { name: "blog", path: "/blog" },
      { name: "videos", path: "/videos" },
      { name: "supporters", path: "/supporters" },
      { name: "certificate", path: "/certificate" }
    ];

    const viewports = [
      { label: "360x800", width: 360, height: 800 },
      { label: "390x844", width: 390, height: 844 },
    ];

    for (const r of routes) {
      console.log(`\nTesting route: ${r.path} (${r.name})`);
      for (const vp of viewports) {
        await send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 2,
          mobile: true,
        });

        await send("Page.navigate", { url: `http://127.0.0.1:${PORT}${r.path}` });
        await sleep(1500);

        // Evaluate layout overflow and input font sizes
        const evalRes = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const scrollWidth = document.documentElement.scrollWidth;
              const innerWidth = window.innerWidth;
              const hasOverflow = scrollWidth > innerWidth;
              const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea'));
              const fontSizes = inputs.map(el => {
                const style = window.getComputedStyle(el);
                return {
                  tag: el.tagName.toLowerCase(),
                  type: el.type,
                  fontSize: style.fontSize,
                  fontSizePx: parseFloat(style.fontSize)
                };
              });
              return JSON.stringify({
                scrollWidth,
                innerWidth,
                hasOverflow,
                inputsCount: inputs.length,
                minFontSizePx: fontSizes.length > 0 ? Math.min(...fontSizes.map(f => f.fontSizePx)) : null,
                fontSizes: fontSizes.slice(0, 5)
              });
            })()
          `,
          returnByValue: true
        });

        const dataParsed = JSON.parse(evalRes.result.value || "{}");
        const filename = `${r.name}-${vp.label}.png`;

        const { data } = await send("Page.captureScreenshot", { format: "png" });
        const buf = Buffer.from(data, "base64");
        fs.writeFileSync(path.join(UX_AUDIT_DIR, filename), buf);
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);

        const metric = {
          route: r.path,
          name: r.name,
          viewport: vp.label,
          scrollWidth: dataParsed.scrollWidth,
          innerWidth: dataParsed.innerWidth,
          overflow: dataParsed.hasOverflow,
          inputsCount: dataParsed.inputsCount,
          minFontSizePx: dataParsed.minFontSizePx,
          screenshot: filename,
          sizeKb: (buf.length / 1024).toFixed(1)
        };
        metrics.push(metric);

        console.log(`  [${vp.label}] Overflow: ${dataParsed.hasOverflow ? "FAIL" : "PASS"} (${dataParsed.scrollWidth}px vs ${dataParsed.innerWidth}px) | Inputs: ${dataParsed.inputsCount} (Min Font: ${dataParsed.minFontSizePx ? dataParsed.minFontSizePx + "px" : "N/A"}) -> Saved ${filename}`);
      }
    }

    ws.close();
    fs.writeFileSync(path.resolve("ux-audit/measured-metrics.json"), JSON.stringify(metrics, null, 2));
    console.log("\n[3] Empirical measurements saved to ux-audit/measured-metrics.json");

  } finally {
    if (browser) browser.kill();
    try {
      fs.rmSync("temp-ux-profile", { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
