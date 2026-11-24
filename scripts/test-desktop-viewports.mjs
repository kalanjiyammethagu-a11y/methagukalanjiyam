import { spawn } from "child_process";
import http from "http";

const PORT = 3099;
const CDP_PORT = 9555;
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

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

const DESKTOPS = [
  { name: "desktop-1366x768", w: 1366, h: 768 },
];

async function main() {
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    stdio: "pipe",
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
  });

  await new Promise((r) => setTimeout(r, 3000));

  for (const vp of DESKTOPS) {
    const browser = spawn(EDGE_PATH, [
      "--headless=new",
      `--window-size=${vp.w},${vp.h}`,
      `--remote-debugging-port=${CDP_PORT}`,
      "about:blank",
    ]);

    await new Promise((r) => setTimeout(r, 1500));

    try {
      const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const pageTarget = targets.find((t) => t.type === "page");
      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

      await sendCDP(ws, "Page.navigate", { url: `http://127.0.0.1:${PORT}/cart?preview=cart` });
      await new Promise((r) => setTimeout(r, 1500));

      const evalRes = await sendCDP(ws, "Runtime.evaluate", {
        expression: `(() => {
          const docW = window.innerWidth;
          const bad = [];
          for (const el of document.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.right > docW + 1) {
              bad.push({
                tag: el.tagName,
                id: el.id,
                className: el.className?.toString().slice(0, 80),
                right: Math.round(r.right),
                width: Math.round(r.width),
              });
            }
          }
          return {
            scrollW: document.documentElement.scrollWidth,
            innerW: window.innerWidth,
            bad: bad.slice(0, 10),
          };
        })()`,
        returnByValue: true,
      });

      console.log(`[Fresh Browser] ${vp.name}:`, JSON.stringify(evalRes.result.value, null, 2));
      ws.close();
    } catch (e) {
      console.error(e);
    } finally {
      browser.kill();
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  server.kill();
  process.exit(0);
}

main();
