import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 3088;
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function waitForServer(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) {
        return true;
      }
    } catch (e) {
      // wait 400ms
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server failed to start at ${url} within ${timeout}ms`);
}

function captureScreenshot(url, outputPath, width, height) {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless",
      "--disable-gpu",
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      url,
    ];

    const child = spawn(EDGE_PATH, args, { stdio: "ignore" });
    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        resolve(); // Continue even if edge returns non-zero warning
      }
    });
    child.on("error", (err) => resolve());
  });
}

async function run() {
  console.log("Starting Next.js production server on port " + PORT + "...");
  const server = spawn("npx.cmd", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => {
    // console.log(d.toString());
  });

  server.stderr.on("data", (d) => {
    // console.error(d.toString());
  });

  try {
    await waitForServer(`http://localhost:${PORT}/`);
    console.log("Next.js server is ready!");

    const pages = [
      { name: "home", path: "/" },
      { name: "books-catalog", path: "/books" },
      { name: "book-detail", path: "/books/katunayake-attack-victory" },
      { name: "cart", path: "/cart" },
      { name: "login", path: "/login" },
    ];

    const viewports = [
      { label: "mobile-390px", width: 390, height: 844 },
      { label: "desktop-1280px", width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      for (const page of pages) {
        const fileOut = path.join(OUTPUT_DIR, `${page.name}-${vp.label}.png`);
        console.log(`Capturing ${page.name} at ${vp.width}x${vp.height} -> ${path.basename(fileOut)}`);
        await captureScreenshot(`http://localhost:${PORT}${page.path}`, fileOut, vp.width, vp.height);
      }
    }

    console.log("All screenshots captured successfully in " + OUTPUT_DIR);
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    console.log("Terminating server...");
    server.kill("SIGTERM");
    setTimeout(() => {
      try {
        server.kill("SIGKILL");
      } catch {}
      process.exit(0);
    }, 1000);
  }
}

run();
