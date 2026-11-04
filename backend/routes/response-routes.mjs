// routes/response-routes.mjs — /respond and /decide routes.

import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "../storage.mjs";
import { validateString, MAX_MESSAGE_LENGTH } from "../validators.mjs";

// --- POST /respond (protected) ---
// Creates a claim (on a found post) or a found report (on a lost post).
// Body: { postId, message }

export async function respond(user, body) {
  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });

  const postId = body.postId;
  if (!postId || typeof postId !== "string") return reply(400, { error: "postId is required." });

  const message = validateString(body.message, MAX_MESSAGE_LENGTH);
  if (!message) return reply(400, { error: "Message is required (max 1000 characters)." });

  // Load the post
  const item = await readJson(`items/${postId}.json`, null);
  if (!item) return reply(404, { error: "Post not found." });

  // Rule: cannot respond to your own post
  if (item.ownerId === user.userId) {
    return reply(403, { error: "You cannot respond to your own post." });
  }

  // Rule: only one response per user per post
  const alreadyResponded = (item.responses || []).some(r => r.responderId === user.userId);
  if (alreadyResponded) {
    return reply(409, { error: "You have already responded to this post." });
  }

  // Responses can be added while a post is open or while existing responses
  // are under review. Accepting one response closes the post.
  if (item.status !== "open" && item.status !== "pending") {
    return reply(400, { error: "This post is no longer open." });
  }

  // Create the response
  const response = {
    responseId: randomUUID(),
    responderId: user.userId,
    message,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  item.responses = item.responses || [];
  item.responses.push(response);

  // Set post status to pending
  item.status = "pending";

  // Save the updated item
  await writeJson(`items/${postId}.json`, item);

  // Update the pending count and status in the index
  const index = await readJson("index.json", []);
  const entry = index.find(e => e.id === postId);
  if (entry) {
    entry.status = item.status;
    entry.pendingCount = item.responses.filter(r => r.status === "pending").length;
    await writeJson("index.json", index);
  }

  return reply(201, {
    responseId: response.responseId,
    status: "pending",
    message: "Response submitted.",
  });
}

// --- POST /decide (protected) ---
// Accept or reject a response on a post the user owns.
// Body: { postId, responseId, decision: "accept" | "reject" }

export async function decide(user, body) {
  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });

  const { postId, responseId, decision } = body;
  if (!postId || typeof postId !== "string") return reply(400, { error: "postId is required." });
  if (!responseId || typeof responseId !== "string") return reply(400, { error: "responseId is required." });
  if (decision !== "accept" && decision !== "reject") {
    return reply(400, { error: "Decision must be 'accept' or 'reject'." });
  }

  // Load the post
  const item = await readJson(`items/${postId}.json`, null);
  if (!item) return reply(404, { error: "Post not found." });

  // Rule: only the post owner can decide
  if (item.ownerId !== user.userId) {
    return reply(403, { error: "Only the post owner can accept or reject responses." });
  }

  // Find the target response
  const resp = (item.responses || []).find(r => r.responseId === responseId);
  if (!resp) return reply(404, { error: "Response not found." });

  // Rule: can only decide on pending responses
  if (resp.status !== "pending") {
    return reply(400, { error: `This response is already ${resp.status}.` });
  }

  if (decision === "accept") {
    // Accept this response
    resp.status = "accepted";

    // Auto-reject all other pending responses
    for (const r of item.responses) {
      if (r.responseId !== responseId && r.status === "pending") {
        r.status = "rejected";
      }
    }

    // Close the post: found → "returned", lost → "resolved"
    item.status = item.type === "found" ? "returned" : "resolved";
  } else {
    // Reject — the post stays open for others
    resp.status = "rejected";
    const remainingPending = (item.responses || []).filter(r => r.status === "pending").length;
    item.status = remainingPending > 0 ? "pending" : "open";
  }

  // Save the updated item
  await writeJson(`items/${postId}.json`, item);

  // Update the index
  const index = await readJson("index.json", []);
  const entry = index.find(e => e.id === postId);
  if (entry) {
    entry.status = item.status;
    entry.pendingCount = item.responses.filter(r => r.status === "pending").length;
    await writeJson("index.json", index);
  }

  return reply(200, {
    decision,
    postStatus: item.status,
    message: decision === "accept"
      ? "Response accepted. Contact details are now visible to both sides."
      : "Response rejected. The post remains open.",
  });
}

// --- Helper ---

function reply(status, data) {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}
