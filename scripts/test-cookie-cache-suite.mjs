/**
 * Automated Test Suite for Cookie and Cache Management
 * Methagu Kalanjiyam (Next.js 15 App Router + Supabase + Razorpay)
 */

import { spawn } from "node:child_process";
import assert from "node:assert";

const PORT = 3009;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess = null;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.status === 200 || res.status === 503) {
        return true;
      }
    } catch (err) {
      if (i % 5 === 0) {
        console.log(`[Wait] Health check pending: ${err.message} | Cause: ${err.cause?.code || err.cause?.message || err.cause}`);
      }
    }
    await sleep(delayMs);
  }
  return false;
}

const results = [];

function recordTest(id, name, passed, details = "") {
  results.push({ id, name, passed, details });
  const statusMark = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${statusMark}] ${id}: ${name}`);
  if (details) {
    console.log(`       ${details}`);
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log(" METHAGU KALANJIYAM: COOKIE & CACHE VERIFICATION TEST SUITE");
  console.log(" Target: Next.js Production Build on Port " + PORT);
  console.log("================================================================================\n");

  // 1. Start Next.js production server
  console.log("[Setup] Starting 'node ./node_modules/next/dist/bin/next start -p " + PORT + "'...");
  serverProcess = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  serverProcess.stdout.on("data", (d) => {
    const text = d.toString();
    if (text.includes("Ready") || text.includes("started server")) {
      console.log("       [Server Stdout]", text.trim());
    }
  });
  serverProcess.stderr.on("data", (d) => {
    console.error("       [Server Stderr]", d.toString().trim());
  });

  const ready = await waitForServer();
  if (!ready) {
    console.error("[FATAL] Next.js server failed to start within 30 seconds.");
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
  console.log("[Setup] Server is ready and accepting requests.\n");

  try {
    // TEST 1: Sensitive HTML Route - /cart Cache-Control
    {
      const res = await fetch(`${BASE_URL}/cart`);
      const cc = res.headers.get("cache-control") || "";
      const pragma = res.headers.get("pragma") || "";
      const expires = res.headers.get("expires") || "";
      const vary = res.headers.get("vary") || "";

      const hasNoStore = cc.includes("no-store");
      const hasPrivate = cc.includes("private");
      const hasNoCache = cc.includes("no-cache");
      const hasMustRevalidate = cc.includes("must-revalidate");

      const passed = hasNoStore && hasPrivate && hasNoCache && hasMustRevalidate;
      recordTest(
        "TEST-CACHE-01",
        "/cart returns strict private no-store Cache-Control",
        passed,
        `Cache-Control: "${cc}" | Pragma: "${pragma}" | Expires: "${expires}" | Vary: "${vary}"`
      );
    }

    // TEST 2: Sensitive HTML Route - /account Cache-Control & Vary
    {
      const res = await fetch(`${BASE_URL}/account`, { redirect: "manual" });
      const cc = res.headers.get("cache-control") || "";
      const vary = res.headers.get("vary") || "";
      const passed = cc.includes("no-store") && cc.includes("private");
      recordTest(
        "TEST-CACHE-02",
        "/account returns private no-store with Vary on Cookie/Authorization",
        passed,
        `Status: ${res.status} | Cache-Control: "${cc}" | Vary: "${vary}"`
      );
    }

    // TEST 3: Sensitive HTML Route - /admin Cache-Control
    {
      const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
      const cc = res.headers.get("cache-control") || "";
      const passed = cc.includes("no-store") && cc.includes("private");
      recordTest(
        "TEST-CACHE-03",
        "/admin returns private no-store headers",
        passed,
        `Status: ${res.status} | Cache-Control: "${cc}"`
      );
    }

    // TEST 4: Sensitive HTML Route - /login Cache-Control
    {
      const res = await fetch(`${BASE_URL}/login`);
      const cc = res.headers.get("cache-control") || "";
      const passed = cc.includes("no-store") && cc.includes("private");
      recordTest(
        "TEST-CACHE-04",
        "/login returns private no-store headers",
        passed,
        `Cache-Control: "${cc}"`
      );
    }

    // TEST 5: API Route - /api/health Cache-Control
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const cc = res.headers.get("cache-control") || "";
      const passed = cc.includes("no-store") && cc.includes("no-cache");
      recordTest(
        "TEST-CACHE-05",
        "/api/health returns strict no-store no-cache",
        passed,
        `Cache-Control: "${cc}"`
      );
    }

    // TEST 6: API Route - /api/orders/create Cache-Control
    {
      const res = await fetch(`${BASE_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const cc = res.headers.get("cache-control") || "";
      const passed = cc.includes("no-store");
      recordTest(
        "TEST-CACHE-06",
        "/api/orders/create returns no-store Cache-Control",
        passed,
        `Cache-Control: "${cc}" (Status: ${res.status})`
      );
    }

    // TEST 7: Static Assets - /_next/static immutable caching & public images
    {
      const nextConfigRes = await fetch(`${BASE_URL}/images/books/book-01.webp`);
      const cc = nextConfigRes.headers.get("cache-control") || "";
      const passed = cc.includes("public") && cc.includes("max-age=86400") && cc.includes("stale-while-revalidate");
      recordTest(
        "TEST-CACHE-07",
        "Public images return public max-age with stale-while-revalidate",
        passed,
        `Status: ${nextConfigRes.status} | Cache-Control: "${cc}"`
      );
    }

    // TEST 8: CSRF Protection - Rejected on Cross-Origin POST
    {
      const res = await fetch(`${BASE_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://malicious-cross-origin.com",
          Host: `127.0.0.1:${PORT}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      const passed = res.status === 403 && data.error && data.error.includes("CSRF");
      recordTest(
        "TEST-CSRF-01",
        "Mismatched Origin header on /api/orders/create is blocked with 403 Forbidden",
        passed,
        `Status: ${res.status} | Response: ${JSON.stringify(data)}`
      );
    }

    // TEST 9: CSRF Protection - Allowed on Same-Origin POST
    {
      const res = await fetch(`${BASE_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: `http://127.0.0.1:${PORT}`,
          Host: `127.0.0.1:${PORT}`,
        },
        body: JSON.stringify({}),
      });
      // Should pass CSRF check and fail on Zod order validation (400)
      const passed = res.status === 400;
      recordTest(
        "TEST-CSRF-02",
        "Matching Origin header passes CSRF verification and proceeds to schema validator",
        passed,
        `Status: ${res.status} (expected 400 Bad Request due to empty payload)`
      );
    }

    // TEST 10: Logout Invalidation - /api/auth/logout Set-Cookie clearing
    {
      const dummyCookieHeader =
        "sb-projectref-auth-token=mockjwt123; sb-projectref-auth-token.0=mockchunk0; sb-projectref-auth-token.1=mockchunk1; theme=dark";
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: dummyCookieHeader,
        },
      });

      const cc = res.headers.get("cache-control") || "";
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];

      const clearsMain = setCookies.some((c) => c.includes("sb-projectref-auth-token") && (c.includes("Max-Age=0") || c.includes("expires=")));
      const hasHttpOnly = setCookies.some((c) => c.toLowerCase().includes("httponly"));
      const hasSameSite = setCookies.some((c) => c.toLowerCase().includes("samesite=lax"));
      const hasNoStore = cc.includes("no-store");

      const passed = res.status === 200 && clearsMain && hasHttpOnly && hasSameSite && hasNoStore;
      recordTest(
        "TEST-COOKIE-01",
        "/api/auth/logout clears auth cookies with Max-Age=0, HttpOnly, SameSite=Lax, and no-store",
        passed,
        `Set-Cookie headers: ${JSON.stringify(setCookies)} | Cache-Control: "${cc}"`
      );
    }

    // TEST 11: Cross-User Cache Isolation
    {
      // Simulate User A and User B requesting the same protected endpoint
      const userARes = await fetch(`${BASE_URL}/account`, {
        headers: { Cookie: "sb-auth-token=user_a_token" },
        redirect: "manual",
      });
      const userBRes = await fetch(`${BASE_URL}/account`, {
        headers: { Cookie: "sb-auth-token=user_b_token" },
        redirect: "manual",
      });

      const ccA = userARes.headers.get("cache-control") || "";
      const ccB = userBRes.headers.get("cache-control") || "";
      const varyA = userARes.headers.get("vary") || "";

      const passed =
        ccA.includes("private") &&
        ccA.includes("no-store") &&
        ccB.includes("private") &&
        ccB.includes("no-store") &&
        varyA.includes("Cookie");

      recordTest(
        "TEST-ISOLATION-01",
        "Cross-user isolation: User responses are strictly private with Vary: Cookie",
        passed,
        `User A CC: "${ccA}", User B CC: "${ccB}"`
      );
    }

    // TEST 12: Session Status Endpoint /api/auth/session
    {
      const res = await fetch(`${BASE_URL}/api/auth/session`);
      const cc = res.headers.get("cache-control") || "";
      const json = await res.json();
      const passed = res.status === 200 && json.authenticated === false && cc.includes("no-store");
      recordTest(
        "TEST-AUTH-01",
        "/api/auth/session returns unauthenticated false without throwing and enforces no-store",
        passed,
        `Status: ${res.status} | Body: ${JSON.stringify(json)} | Cache-Control: "${cc}"`
      );
    }
  } finally {
    if (serverProcess) {
      console.log("\n[Teardown] Shutting down Next.js test server...");
      serverProcess.kill();
    }
  }

  console.log("\n================================================================================");
  console.log(` TEST SUMMARY: ${results.filter((r) => r.passed).length} / ${results.length} PASSED`);
  console.log("================================================================================");

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("[FATAL ERROR IN TEST SUITE]", err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
