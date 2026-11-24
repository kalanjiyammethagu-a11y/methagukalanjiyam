#!/usr/bin/env node
/**
 * Methagu Kalanjiyam — Local ERPNext Auto-Sync Utility
 *
 * Runs on the host computer running ERPNext (or inside a Docker cron container).
 * Every interval (default: 5 minutes) or on-demand:
 * 1. Checks if Cloudflare Tunnel / ERPNext is reachable.
 * 2. Flushes any pending or offline-queued orders from the website database into ERPNext.
 *
 * Usage:
 *   node scripts/auto-sync-erp-orders.mjs               (runs once)
 *   node scripts/auto-sync-erp-orders.mjs --watch       (runs continuously every 5 mins)
 *   node scripts/auto-sync-erp-orders.mjs --interval 10 (runs every 10 mins)
 */

import http from "node:http";
import https from "node:https";

const SITE_URL = process.env.SITE_URL || "https://methagukalanjiyam.in";
const SYNC_TOKEN = process.env.AUTH_SECRET || "placeholder_auth_secret_minimum_32_characters_long";

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");
const intervalIdx = args.indexOf("--interval");
const intervalMinutes = intervalIdx !== -1 && args[intervalIdx + 1] ? parseInt(args[intervalIdx + 1], 10) : 5;

function flushQueue() {
  const parsed = new URL(`${SITE_URL}/api/admin/erp/queue`);
  const client = parsed.protocol === "https:" ? https : http;

  const req = client.request(
    parsed,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-erp-sync-token": SYNC_TOKEN,
        "User-Agent": "Methagu-ERP-AutoSync/1.0",
      },
      timeout: 30000,
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const time = new Date().toLocaleTimeString();
        try {
          const json = JSON.parse(data);
          if (json.result?.isTunnelOffline) {
            console.log(
              `[${time}] ⚠️ ERP/Tunnel offline (Error 1033). Orders remain safely queued on website.`
            );
          } else if (json.success) {
            const { succeeded, failed, total } = json.result || {};
            console.log(
              `[${time}] ✅ Sync complete! ${succeeded} order(s) pushed to ERPNext (${failed} failed, ${total} total).`
            );
          } else {
            console.log(`[${time}] ℹ️ Response: ${json.error || data}`);
          }
        } catch {
          console.log(`[${time}] Response (${res.statusCode}): ${data.slice(0, 150)}`);
        }
      });
    }
  );

  req.on("error", (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Network error reaching website:`, err.message);
  });

  req.end(JSON.stringify({}));
}

console.log("==================================================");
console.log(" மேதகு களஞ்சியம் — ERPNext Auto-Sync Client");
console.log(` Target Site: ${SITE_URL}`);
console.log(` Mode: ${isWatch ? `Looping every ${intervalMinutes} minute(s)` : "Single Run"}`);
console.log("==================================================");

flushQueue();

if (isWatch) {
  setInterval(flushQueue, intervalMinutes * 60 * 1000);
}
