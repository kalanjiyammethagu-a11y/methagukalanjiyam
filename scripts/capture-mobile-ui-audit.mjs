import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3089;
const CDP_PORT = 9226;
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
  console.log(" CAPTURING MOBILE UI AUDIT SCREENSHOTS (ADMIN & PRODUCT)");
  console.log("================================================================================\n");

  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  let browser;

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("      Next.js server ready on port " + PORT);

    browser = spawn(
      BROWSER_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        "--disable-gpu",
        "--hide-scrollbars",
        "--user-data-dir=" + path.resolve("temp-edge-profile-mobile"),
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
    await send("Network.enable");

    // Set mock admin cookie so admin routes can be accessed
    await send("Network.setCookie", {
      name: "mk_admin_session",
      value: "eyJ1c2VySWQiOiJhZG1pbi0wMSJ9.signature_valid_mock_hmac_hash",
      domain: "127.0.0.1",
      path: "/admin",
      httpOnly: true,
      secure: false,
    });

    async function capture(fileName, urlPath, width = 390, height = 844) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await send("Page.navigate", { url: `http://127.0.0.1:${PORT}${urlPath}` });
      await sleep(1500);
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      const buf = Buffer.from(data, "base64");
      const localFile = path.join(OUTPUT_DIR, fileName);
      const artifactFile = path.join(ARTIFACT_DIR, fileName);
      fs.writeFileSync(localFile, buf);
      fs.writeFileSync(artifactFile, buf);
      console.log(`      Saved ${fileName} (${width}x${height}, ${(buf.length / 1024).toFixed(1)} KB)`);
    }

    console.log("Capturing Mobile Admin Supporters / Team CRUD...");
    await capture("mobile-admin-supporters.png", "/admin/supporters", 390, 844);

    // Open Add Member modal and capture
    console.log("Capturing Mobile Add Member Modal...");
    await send("Runtime.evaluate", {
      expression: `
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add New Member'));
        if (addBtn) addBtn.click();
      `,
    });
    await sleep(600);
    const { data: modalData } = await send("Page.captureScreenshot", { format: "png" });
    const modalBuf = Buffer.from(modalData, "base64");
    fs.writeFileSync(path.join(OUTPUT_DIR, "mobile-admin-supporters-modal.png"), modalBuf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, "mobile-admin-supporters-modal.png"), modalBuf);
    console.log("      Saved mobile-admin-supporters-modal.png");

    console.log("Capturing Mobile Admin Dashboard with Bottom Nav...");
    await capture("mobile-admin-dashboard.png", "/admin", 390, 844);

    console.log("Capturing Mobile Consumer Home with Refined Hero Typography...");
    await capture("mobile-consumer-home.png", "/", 390, 844);

    console.log("Capturing Mobile Consumer Supporters Roster...");
    await capture("mobile-consumer-supporters.png", "/supporters", 390, 844);

    ws.close();
    console.log("\nMobile UI audit screenshots successfully captured!\n");
  } finally {
    if (browser) browser.kill();
    if (server) server.kill();
    try {
      fs.rmSync("temp-edge-profile-mobile", { recursive: true, force: true });
    } catch {}
  }
}

run().catch(console.error);
