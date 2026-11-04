// routes/auth-routes.mjs — /register and /login routes.

import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword, createToken } from "../auth.mjs";
import { readJson, writeJson } from "../storage.mjs";
import {
  validateEmail, validatePassword, validateString, validateOptionalString,
  pickKnownFields, MAX_NAME_LENGTH, TOKEN_TTL, MAX_FAILED_LOGINS, LOCKOUT_MINUTES,
} from "../validators.mjs";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "";

// --- POST /register ---

export async function register(_user, body) {
  // Validate known fields only
  const cleaned = pickKnownFields(body, ["name", "email", "password", "phone"]);
  if (!cleaned) return reply(400, { error: "Unknown fields in request body." });

  const name = validateString(cleaned.name, MAX_NAME_LENGTH);
  if (!name) return reply(400, { error: "Name is required (max 100 characters)." });

  const email = validateEmail(cleaned.email, ALLOWED_DOMAIN);
  if (!email) {
    const msg = ALLOWED_DOMAIN
      ? `A valid @${ALLOWED_DOMAIN} email is required.`
      : "A valid email is required.";
    return reply(400, { error: msg });
  }

  const password = validatePassword(cleaned.password);
  if (!password) return reply(400, { error: "Password must be 8–128 characters." });

  const phone = validateOptionalString(cleaned.phone, 20);
  if (phone === null) return reply(400, { error: "Phone number is too long." });

  // Check for duplicate email
  const usersIndex = await readJson("users-index.json", {});
  if (usersIndex[email]) {
    return reply(409, { error: "An account with this email already exists." });
  }

  // Create user
  const userId = randomUUID();
  const user = {
    userId,
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    failedLogins: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  };

  // Write user file and update the index
  await writeJson(`users/${userId}.json`, user);
  usersIndex[email] = userId;
  await writeJson("users-index.json", usersIndex);

  // Return a token so the user is logged in immediately
  const token = createToken({ userId, email, name }, TOKEN_TTL);
  return reply(201, { token, user: { userId, name, email, phone } });
}

// --- POST /login ---

export async function login(_user, body) {
  const cleaned = pickKnownFields(body, ["email", "password"]);
  if (!cleaned) return reply(400, { error: "Unknown fields in request body." });

  const email = validateEmail(cleaned.email, "");
  if (!email) return reply(400, { error: "A valid email is required." });

  const password = cleaned.password;
  if (!password || typeof password !== "string") {
    return reply(400, { error: "Password is required." });
  }

  const GENERIC = "Invalid email or password.";

  // Look up the user
  const usersIndex = await readJson("users-index.json", {});
  const userId = usersIndex[email];
  if (!userId) return reply(401, { error: GENERIC });

  const user = await readJson(`users/${userId}.json`, null);
  if (!user) return reply(401, { error: GENERIC });

  // Check lockout
  if (user.lockedUntil) {
    const lockEnd = new Date(user.lockedUntil).getTime();
    if (Date.now() < lockEnd) {
      return reply(403, { error: "Account temporarily locked. Try again later." });
    }
    // Lock period expired — reset counters
    user.failedLogins = 0;
    user.lockedUntil = null;
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    user.failedLogins = (user.failedLogins || 0) + 1;
    if (user.failedLogins >= MAX_FAILED_LOGINS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
    }
    await writeJson(`users/${userId}.json`, user);
    return reply(401, { error: GENERIC });
  }

  // Successful login — reset failed counter
  user.failedLogins = 0;
  user.lockedUntil = null;
  await writeJson(`users/${userId}.json`, user);

  const token = createToken({ userId: user.userId, email: user.email, name: user.name }, TOKEN_TTL);
  return reply(200, { token, user: { userId: user.userId, name: user.name, email: user.email, phone: user.phone } });
}

// --- Helper (same as index.mjs reply, duplicated for standalone use) ---

function reply(status, data) {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}
