const TEXT_ENCODER = new TextEncoder();

/**
 * Derives the server authentication secret from runtime environment variables.
 * Uses env variable names only; secret values are never logged or exported.
 */
export function getAuthSecret(explicitSecret?: string): string {
  const secret =
    explicitSecret ??
    (process.env.AUTH_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.RAZORPAY_KEY_SECRET);

  if (!secret) {
    throw new Error("Server authentication secret is missing from environment.");
  }
  return secret;
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i] ?? 0).toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Constant-time string comparison across UTF-8 byte lengths using XOR accumulation.
 * Never returns early on byte mismatch to mitigate timing side-channels.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bytesA = TEXT_ENCODER.encode(a);
  const bytesB = TEXT_ENCODER.encode(b);
  const maxLen = Math.max(bytesA.length, bytesB.length);
  let diff = bytesA.length ^ bytesB.length;

  for (let i = 0; i < maxLen; i++) {
    const ba = bytesA[i] ?? 0;
    const bb = bytesB[i] ?? 0;
    diff |= ba ^ bb;
  }

  return diff === 0;
}

/**
 * Generates a cryptographically secure 6-digit OTP using Web Crypto CSPRNG
 * with rejection sampling to eliminate modulo bias.
 */
export function generateSecureOtp(): string {
  const range = 900_000; // 100000..999999 inclusive
  const maxUnbiased = Math.floor(0x1_0000_0000 / range) * range;
  const buf = new Uint32Array(1);

  while (true) {
    globalThis.crypto.getRandomValues(buf);
    const sample = buf[0] ?? maxUnbiased;
    if (sample < maxUnbiased) {
      return String(100_000 + (sample % range));
    }
  }
}

/**
 * Generates a CSPRNG hex token using Web Crypto (default 256-bit / 32 bytes).
 */
export function generateSecureToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

/**
 * Computes an HMAC-SHA256 hex digest using Web Crypto SubtleCrypto.
 */
export async function hashSecret(value: string, explicitSecret?: string): Promise<string> {
  const secret = getAuthSecret(explicitSecret);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    TEXT_ENCODER.encode(value)
  );
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Constant-time HMAC-SHA256 verification of a candidate value against a stored hash.
 */
export async function verifySecretHash(
  value: string,
  expectedHash: string,
  explicitSecret?: string
): Promise<boolean> {
  if (!expectedHash) return false;
  const computed = await hashSecret(value, explicitSecret);
  return constantTimeEqual(computed, expectedHash.toLowerCase());
}

/**
 * Signs a payload string with Web Crypto HMAC-SHA256 (`payload.signature`).
 */
export async function signToken(payload: string, explicitSecret?: string): Promise<string> {
  const signature = await hashSecret(payload, explicitSecret);
  return `${payload}.${signature}`;
}

/**
 * Verifies and unpacks an HMAC-SHA256 signed token using constant-time comparison.
 */
export async function verifySignedToken(
  signedToken: string,
  explicitSecret?: string
): Promise<string | null> {
  const parts = signedToken.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, signature] = parts;
  const expectedSig = await hashSecret(payload, explicitSecret);
  return constantTimeEqual(signature.toLowerCase(), expectedSig) ? payload : null;
}

const BACKUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates readable single-use backup recovery codes (default: 8 codes formatted XXXX-XXXX)
 * using unbiased Web Crypto rejection sampling.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const alphabetLen = BACKUP_CODE_ALPHABET.length; // 32 (divides 256 cleanly!)
  const buf = new Uint8Array(8);

  for (let i = 0; i < count; i++) {
    globalThis.crypto.getRandomValues(buf);
    let raw = "";
    for (let j = 0; j < 8; j++) {
      const idx = (buf[j] ?? 0) % alphabetLen;
      raw += BACKUP_CODE_ALPHABET[idx] ?? "A";
    }
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }

  return codes;
}

export function normalizeBackupCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
