import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  generateBackupCodes,
  hashSecret,
  normalizeBackupCode,
  verifySecretHash,
  verifySignedToken,
} from "../../src/lib/auth-crypto.ts";
import { requireAdmin } from "../../src/lib/auth-service.ts";
import { adminStep2ChallengeSchema } from "../../src/lib/validators/auth.ts";
import {
  _setEmailTransportForTests,
  sendAdminOtpEmail,
  type EmailSendPayload,
} from "../../src/lib/email.ts";

afterEach(() => {
  _setEmailTransportForTests(null);
});

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkFiles(full));
    } else if (full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

describe("Admin 2FA Web Crypto OTP & Single-Use Backup Codes", () => {
  it("generates 8 distinct XXXX-XXXX backup codes, hashes cleanly, and validates normalized input", async () => {
    const secret = "test-2fa-secret-for-unit-tests-only-987654321";
    const codes = generateBackupCodes(8);

    assert.equal(codes.length, 8);
    assert.equal(new Set(codes).size, 8);
    for (const c of codes) {
      assert.match(c, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    }

    const firstCode = codes[0];
    const hash = await hashSecret(normalizeBackupCode(firstCode), secret);
    assert.equal(await verifySecretHash(normalizeBackupCode(firstCode.toLowerCase()), hash, secret), true);
    assert.equal(
      await verifySecretHash(normalizeBackupCode(firstCode.replace("-", "")), hash, secret),
      true
    );
    assert.equal(await verifySecretHash("ZZZZ-ZZZZ", hash, secret), false);
  });

  it("validates Step 2 challenge schemas for 6-digit OTP and XXXX-XXXX backup codes", () => {
    assert.equal(adminStep2ChallengeSchema.safeParse({ otp_code: "482910" }).success, true);
    assert.equal(adminStep2ChallengeSchema.safeParse({ otp_code: "12345" }).success, false);
    assert.equal(adminStep2ChallengeSchema.safeParse({ backup_code: "ABCD-EF23" }).success, true);
    assert.equal(adminStep2ChallengeSchema.safeParse({ backup_code: "12" }).success, false);
  });

  it("dispatches Admin OTP via mocked Resend without printing or logging the OTP", async () => {
    const sent: EmailSendPayload[] = [];
    const logged: string[] = [];
    const origInfo = console.info;
    console.info = (...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    };

    try {
      _setEmailTransportForTests({
        async send(payload) {
          sent.push(payload);
          return { data: { id: "resend-mock-admin-otp-1" }, error: null };
        },
      });

      const ephemeralTestOtp = "739204";
      const result = await sendAdminOtpEmail({
        to: "admin@example.com",
        otpCode: ephemeralTestOtp,
        expiresInMinutes: 10,
      });

      assert.equal(result.success, true);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].to, "admin@example.com");
      assert.ok(sent[0].html.includes(ephemeralTestOtp));
      assert.equal(logged.join("\n").includes(ephemeralTestOtp), false);
    } finally {
      console.info = origInfo;
    }
  });
});

describe("Fail-closed admin guard & anti-bypass audit", () => {
  it("fails closed with 401 when admin session cookie is missing or forged", async () => {
    const origSecret = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "test-unit-secret-0123456789-abcdef";
    try {
      const missingRes = await requireAdmin({
        cookies: { get: () => undefined },
      });
      assert.equal(missingRes.authorized, false);
      assert.equal(missingRes.status, 401);

      const forgedRes = await requireAdmin({
        cookies: { get: () => ({ value: "forged-user-id:raw.badsignature" }) },
      });
      assert.equal(forgedRes.authorized, false);
      assert.equal(forgedRes.status, 401);

      assert.equal(await verifySignedToken("forged.bad", process.env.AUTH_SECRET), null);
    } finally {
      if (origSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = origSecret;
    }
  });

  it("enforces mandatory 2FA (no bypass, no simulatedOtp) and requireAdmin across every admin API route", () => {
    const adminLoginSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/admin/login/route.ts"),
      "utf8"
    );
    assert.ok(!adminLoginSrc.includes("ADMIN_2FA_ENABLED"));
    assert.ok(!adminLoginSrc.includes("simulatedOtp"));
    assert.ok(adminLoginSrc.includes("issueAdminOtp"));

    const sessionSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/session/route.ts"),
      "utf8"
    );
    assert.ok(sessionSrc.includes("requireAdmin(req)"));
    assert.ok(!sessionSrc.includes('includes(".")'));

    const backupCodesSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/admin/backup-codes/route.ts"),
      "utf8"
    );
    assert.ok(backupCodesSrc.includes("requireAdmin(req)"));

    const adminSessionApiSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/admin/session/route.ts"),
      "utf8"
    );
    assert.ok(adminSessionApiSrc.includes("requireAdmin(req)"));

    const adminApiDir = path.resolve(process.cwd(), "src/app/api/admin");
    const routeFiles = walkFiles(adminApiDir).filter((f) => f.endsWith("route.ts"));
    assert.ok(routeFiles.length >= 13);
    for (const file of routeFiles) {
      const content = readFileSync(file, "utf8");
      assert.ok(
        content.includes("requireAdmin(req)"),
        `Missing requireAdmin(req) guard in ${path.relative(process.cwd(), file)}`
      );
    }
  });
});
