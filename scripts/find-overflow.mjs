import { spawn } from "child_process";
import http from "http";

const PORT = 3099;
const CDP_PORT = 9334;
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

async function main() {
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });

  await new Promise((r) => setTimeout(r, 3000));

  const browser = spawn(EDGE_PATH, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === "page");
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

    await sendCDP(ws, "Page.enable");
    await sendCDP(ws, "DOM.enable");

    await sendCDP(ws, "Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 1,
      mobile: true,
    });

    await sendCDP(ws, "Page.navigate", { url: `http://127.0.0.1:${PORT}/cart?preview=cart` });
    await new Promise((r) => setTimeout(r, 1200));

    const evalRes = await sendCDP(ws, "Runtime.evaluate", {
      expression: `(() => {
        const docW = window.innerWidth;
        const badElements = [];
        const all = document.querySelectorAll('#content *');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.right > docW + 1) {
            badElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className?.toString().slice(0, 100),
              right: Math.round(r.right),
              width: Math.round(r.width),
              text: el.innerText?.slice(0, 40)
            });
          }
        }
        return { docW, badElements: badElements.slice(0, 20) };
      })()`,
      returnByValue: true,
    });

    console.log("Analysis at 667px:", evalRes.result.value);

    ws.close();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    browser.kill();
    server.kill();
    process.exit(0);
  }
}

main();
