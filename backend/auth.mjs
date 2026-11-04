// auth.mjs — Password hashing with PBKDF2 and HMAC-signed tokens.
// Uses only Node's built-in `crypto`. No external auth library.

import { randomBytes, pbkdf2Sync, timingSafeEqual, createHmac } from "node:crypto";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

// --- Password hashing (PBKDF2-SHA256) ---

/**
 * Hash a plain-text password. Returns "saltHex:hashHex".
 */
export function hashPassword(password) {
  const salt = randomBytes(32);
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha256");
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a plain-text password against a stored "saltHex:hashHex" string.
 * Uses timingSafeEqual to avoid timing attacks.
 */
export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = pbkdf2Sync(password, salt, 100_000, 64, "sha256");
  return timingSafeEqual(expected, actual);
}

// --- Token creation and verification (HMAC-SHA256) ---

/**
 * Create a signed token containing `payload` that expires in `ttlSeconds`.
 * Format: base64url(JSON payload with exp) + "." + base64url(HMAC signature)
 */
export function createToken(payload, ttlSeconds) {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = toBase64Url(JSON.stringify(data));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify and decode a token. Returns the payload object, or null if
 * the signature is invalid or the token has expired.
 */
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;

  // Check signature with timingSafeEqual
  const expected = sign(payloadB64);
  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig, "utf-8");
  const expBuf = Buffer.from(expected, "utf-8");
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  // Decode payload and check expiry
  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Helpers ---

function sign(data) {
  return createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
}

function toBase64Url(str) {
  return Buffer.from(str, "utf-8").toString("base64url");
}

function fromBase64Url(b64) {
  return Buffer.from(b64, "base64url").toString("utf-8");
}
