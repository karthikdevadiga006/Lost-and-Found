// routes/admin-routes.mjs — /admin route.
// Requires login + admin key in x-admin-key header.
// Can delete posts or force-close them.

import { timingSafeEqual } from "node:crypto";
import { readJson, writeJson, deleteKey } from "../storage.mjs";

const ADMIN_KEY = process.env.ADMIN_KEY;

// --- POST /admin (protected + admin key) ---
// Body: { action: "delete" | "force-close", postId }

export async function admin(user, body, event) {
  // Verify admin key with timingSafeEqual
  const providedKey = event.headers?.["x-admin-key"] || "";
  if (!providedKey || !safeCompare(providedKey, ADMIN_KEY)) {
    return reply(403, { error: "Invalid admin key." });
  }

  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });

  const { action, postId } = body;
  if (!postId || typeof postId !== "string") return reply(400, { error: "postId is required." });
  if (action !== "delete" && action !== "force-close") {
    return reply(400, { error: "Action must be 'delete' or 'force-close'." });
  }

  // Load the post
  const item = await readJson(`items/${postId}.json`, null);
  if (!item) return reply(404, { error: "Post not found." });

  if (action === "delete") {
    // Remove the item file
    await deleteKey(`items/${postId}.json`);
    // Remove photo if exists
    if (item.photoKey) {
      try { await deleteKey(item.photoKey); } catch {}
    }
    // Remove from index
    const index = await readJson("index.json", []);
    const updated = index.filter(e => e.id !== postId);
    await writeJson("index.json", updated);

    return reply(200, { message: "Post deleted." });
  }

  if (action === "force-close") {
    // Close the post without accepting any response
    item.status = item.type === "found" ? "returned" : "resolved";
    // Reject all pending responses
    for (const r of item.responses || []) {
      if (r.status === "pending") r.status = "rejected";
    }
    await writeJson(`items/${postId}.json`, item);

    // Update index
    const index = await readJson("index.json", []);
    const entry = index.find(e => e.id === postId);
    if (entry) {
      entry.status = item.status;
      entry.pendingCount = 0;
      await writeJson("index.json", index);
    }

    return reply(200, { message: "Post force-closed." });
  }
}

// Safe string comparison
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf-8"), Buffer.from(b, "utf-8"));
}

function reply(status, data) {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}
