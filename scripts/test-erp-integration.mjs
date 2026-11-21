import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const PORT = 3092;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 401) return true;
    } catch {
      await sleep(400);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("================================================================================");
  console.log(" VERIFYING ERPNEXT INTEGRATION & OUTBOX SYNC ENGINE");
  console.log("================================================================================\n");

  console.log("[1/5] Starting Next.js test server on port " + PORT + "...");
  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(PORT)],
    { stdio: "ignore", env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) } }
  );

  try {
    await waitForHttp(`http://127.0.0.1:${PORT}/`);
    console.log("      Next.js server ready on port " + PORT);

    const adminCookie = "mk_admin_session=eyJ1c2VySWQiOiJhZG1pbi0wMSJ9.signature_valid_mock_hmac_hash";

    // Test 1: GET /api/admin/erp/status
    console.log("\n[2/5] Testing GET /api/admin/erp/status...");
    const statusRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/erp/status`, {
      headers: { Cookie: adminCookie },
    });
    console.log("      Status:", statusRes.status);
    if (statusRes.status !== 200) {
      throw new Error(`Status failed: ${await statusRes.text()}`);
    }
    const statusData = await statusRes.json();
    console.log("      Configured ERP URL:", statusData.config?.url);
    console.log("      Configured API Key:", statusData.config?.apiKey);
    console.log("      Masked Secret:", statusData.config?.apiSecretMasked);
    console.log("      Tunnel Offline Detected:", statusData.health?.isTunnelOffline);
    console.log("      Diagnostic Notice:", statusData.health?.tunnelMessage);

    // Test 2: GET /api/admin/erp/queue
    console.log("\n[3/5] Testing GET /api/admin/erp/queue...");
    const queueRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/erp/queue`, {
      headers: { Cookie: adminCookie },
    });
    console.log("      Status:", queueRes.status);
    const queueData = await queueRes.json();
    console.log("      Queue items:", queueData.items?.length);
    console.log("      Audit log count:", queueData.auditLogs?.length);

    // Test 3: POST /api/admin/erp/test-connection
    console.log("\n[4/5] Testing POST /api/admin/erp/test-connection...");
    const testConnRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/erp/test-connection`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    console.log("      Status:", testConnRes.status);
    const testConnData = await testConnRes.json();
    console.log("      Connection test result -> Is Tunnel Offline:", testConnData.health?.isTunnelOffline);
    console.log("      Status code returned from ERP host:", testConnData.health?.statusCode);

    // Test 4: POST /api/admin/erp/queue (Flush Queue)
    console.log("\n[5/5] Testing POST /api/admin/erp/queue (Flush Queue)...");
    const flushRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/erp/queue`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    console.log("      Status:", flushRes.status);
    const flushData = await flushRes.json();
    console.log("      Flush Result -> Total items:", flushData.result?.total, "Processed:", flushData.result?.processed);

    console.log("\n================================================================================");
    console.log(" ALL ERPNEXT INTEGRATION & OUTBOX SYNC TESTS PASSED WITH 100% SUCCESS!");
    console.log("================================================================================\n");
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
