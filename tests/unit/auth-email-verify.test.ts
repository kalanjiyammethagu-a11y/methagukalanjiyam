import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  constantTimeEqual,
  generateSecureOtp,
  generateSecureToken,
  hashSecret,
  signToken,
  verifySecretHash,
  verifySignedToken,
} from "../../src/lib/auth-crypto.ts";
import "../../src/lib/auth-service.ts";
import {
  _setEmailTransportForTests,
  sendVerificationEmail,
  sendAlreadyRegisteredEmail,
  type EmailSendPayload,
} from "../../src/lib/email.ts";

afterEach(() => {
  _setEmailTransportForTests(null);
});

describe("Web Crypto auth primitives (Workers-compatible)", () => {
  it("generates uniform 6-digit OTPs and unique 256-bit hex tokens via Web Crypto", () => {
    const otps = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const otp = generateSecureOtp();
      assert.match(otp, /^[0-9]{6}$/);
      assert.ok(Number(otp) >= 100_000 && Number(otp) <= 999_999);
      otps.add(otp);
    }
    assert.ok(otps.size > 40);

    const t1 = generateSecureToken(32);
    const t2 = generateSecureToken(32);
    assert.match(t1, /^[a-f0-9]{64}$/);
    assert.notEqual(t1, t2);
  });

  it("computes and verifies HMAC-SHA256 digests and signed tokens in constant time", async () => {
    const secret = "test-auth-secret-never-used-in-prod-0123456789";
    const token = generateSecureToken(32);
    const digest = await hashSecret(token, secret);

    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(await verifySecretHash(token, digest, secret), true);
    assert.equal(await verifySecretHash(`${token}x`, digest, secret), false);
    assert.equal(await verifySecretHash(token, digest, "wrong-secret"), false);

    assert.equal(constantTimeEqual("abc123", "abc123"), true);
    assert.equal(constantTimeEqual("abc123", "abc124"), false);
    assert.equal(constantTimeEqual("abc123", "abc"), false);

    const signed = await signToken("user-123:session-raw", secret);
    assert.equal(await verifySignedToken(signed, secret), "user-123:session-raw");
    assert.equal(await verifySignedToken(`${signed}0`, secret), null);
    assert.equal(await verifySignedToken(signed, "other-secret"), null);
  });
});

describe("Resend email verification dispatch & secret-redaction guarantees", () => {
  it("dispatches bilingual verification email via mocked Resend without logging tokens", async () => {
    const captured: EmailSendPayload[] = [];
    const logged: string[] = [];
    const origInfo = console.info;
    console.info = (...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    };

    try {
      _setEmailTransportForTests({
        async send(payload) {
          captured.push(payload);
          return { data: { id: "resend-mock-verify-1" }, error: null };
        },
      });

      const fakeToken = "mock_verify_token_should_never_hit_logs_998877665544";
      const result = await sendVerificationEmail({
        to: "reader@example.com",
        name: "கவிதா",
        verifyUrl: `https://methagukalanjiyam.in/verify-email?token=${fakeToken}`,
      });

      assert.equal(result.success, true);
      assert.equal(result.id, "resend-mock-verify-1");
      assert.equal(captured.length, 1);
      assert.equal(captured[0].to, "reader@example.com");
      assert.ok(captured[0].html.includes("மின்னஞ்சலை உறுதிப்படுத்துக"));
      assert.ok(captured[0].html.includes(fakeToken));

      // Verify zero console token/URL leakage
      assert.equal(logged.join("\n").includes(fakeToken), false);
    } finally {
      console.info = origInfo;
    }
  });

  it("handles mocked Resend sendAlreadyRegisteredEmail safely", async () => {
    const sent: EmailSendPayload[] = [];
    _setEmailTransportForTests({
      async send(payload) {
        sent.push(payload);
        return { data: { id: "resend-mock-notice-1" }, error: null };
      },
    });

    const res = await sendAlreadyRegisteredEmail({
      to: "existing@example.com",
      loginUrl: "https://methagukalanjiyam.in/login",
    });

    assert.equal(res.success, true);
    assert.equal(sent.length, 1);
    assert.ok(sent[0].html.includes("existing@example.com"));
  });

  it("enforces email_confirm: false on signup and blocks unverified login without auto-signin", () => {
    const signupSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/signup/route.ts"),
      "utf8"
    );
    const loginSrc = readFileSync(
      path.resolve(process.cwd(), "src/app/api/auth/login/route.ts"),
      "utf8"
    );
    const authServiceSrc = readFileSync(
      path.resolve(process.cwd(), "src/lib/auth-service.ts"),
      "utf8"
    );
    const authCryptoSrc = readFileSync(
      path.resolve(process.cwd(), "src/lib/auth-crypto.ts"),
      "utf8"
    );

    assert.ok(signupSrc.includes("email_confirm: false"));
    assert.ok(!signupSrc.includes("signInWithPassword"));
    assert.ok(signupSrc.includes("autoSignedIn: false"));
    assert.ok(loginSrc.includes("email_unverified"));
    assert.ok(loginSrc.includes("signOut()"));
    assert.ok(!authServiceSrc.includes("from \"crypto\""));
    assert.ok(!authCryptoSrc.includes("from \"crypto\""));
    assert.ok(authCryptoSrc.includes("globalThis.crypto.subtle"));
  });
});
