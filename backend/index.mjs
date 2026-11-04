// index.mjs — Lambda handler and route tables.
// Uses Function URL payload v2. Routes are keyed by "METHOD /path".
// A route is protected (needs a valid token) unless listed in publicRoutes.

import { verifyToken } from "./auth.mjs";
import { readJson } from "./storage.mjs";
import { MAX_BODY_SIZE } from "./validators.mjs";

// --- Route imports ---
import { register, login } from "./routes/auth-routes.mjs";
import { getMe, getStats } from "./routes/user-routes.mjs";
import { createFound, createLost, search, getPhoto, closeItem } from "./routes/item-routes.mjs";
import { respond, decide } from "./routes/response-routes.mjs";
import { admin } from "./routes/admin-routes.mjs";

// --- Route tables ---

// Public routes: no token required.
const publicRoutes = {
  "POST /register": register,
  "POST /login":    login,
  "GET /stats":     getStats,
};

// Protected routes: token verified, handler receives (user, body, event).
const protectedRoutes = {
  "GET /me":      getMe,
  "POST /found":  createFound,
  "POST /lost":   createLost,
  "GET /search":  search,
  "GET /photo":   getPhoto,
  "POST /respond": respond,
  "POST /decide":  decide,
  "POST /close":   closeItem,
  "POST /admin":   admin,
};

// --- Main handler ---

export async function handler(event) {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const routeKey = `${method} ${path}`;

    // Parse body (may be base64-encoded by Lambda)
    let body = null;
    if (event.body) {
      let raw = event.body;
      if (event.isBase64Encoded) {
        raw = Buffer.from(raw, "base64").toString("utf-8");
      }
      // Enforce body size limit
      if (Buffer.byteLength(raw, "utf-8") > MAX_BODY_SIZE) {
        return reply(413, { error: "Request body too large." });
      }
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(400, { error: "Invalid JSON body." });
      }
    }

    // Handle OPTIONS (preflight) — should not be needed if CORS is on the
    // Function URL, but included as a safety net.
    if (method === "OPTIONS") {
      return { statusCode: 204, body: "" };
    }

    // --- Public route ---
    if (publicRoutes[routeKey]) {
      return await publicRoutes[routeKey](null, body, event);
    }

    // --- Protected route ---
    if (protectedRoutes[routeKey]) {
      const user = await authenticate(event);
      if (!user) return reply(401, { error: "Unauthorized." });
      return await protectedRoutes[routeKey](user, body, event);
    }

    // --- Unknown route ---
    return reply(404, { error: "Not found." });

  } catch (err) {
    // Never expose internal details
    console.error("Unhandled error:", err);
    return reply(500, { error: "Internal server error." });
  }
}

// --- Authentication helper ---

async function authenticate(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload; // { userId, email, name, exp }
}

// --- Response helper ---

function reply(status, data) {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}
