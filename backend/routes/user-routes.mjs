// routes/user-routes.mjs — /me and /stats routes.

import { readJson } from "../storage.mjs";

// --- GET /me (protected) ---
// Returns the logged-in user's profile data: their posts, responses sent,
// and responses received, with contact details only where accepted.

export async function getMe(user) {
  // Load the full user record
  const userData = await readJson(`users/${user.userId}.json`, null);
  if (!userData) return reply(404, { error: "User not found." });

  // Load the global post index
  const index = await readJson("index.json", []);

  // My found posts and my lost posts (from the index)
  const myFoundSummaries = [];
  const myLostSummaries = [];

  // We also need to load full items for posts that are mine (to get responses on them)
  // and find responses I've sent on other people's posts.
  const responsesOnMyPosts = [];
  const myResponses = [];

  // Collect post IDs that belong to me
  const myPostIds = [];
  for (const entry of index) {
    // Load the full item to check ownership and responses
    // (index doesn't store ownerId for privacy, so we load the full item)
  }

  // Since index.json doesn't have ownerId, we need to scan items.
  // For a campus pilot (hundreds of posts) this is acceptable.
  // We'll iterate the index and load each item. With reserved concurrency = 1,
  // and hundreds of posts, this is fine.

  // Optimisation: load all items in parallel (small files)
  const fullItems = await Promise.all(
    index.map(entry => readJson(`items/${entry.id}.json`, null))
  );

  for (const item of fullItems) {
    if (!item) continue;

    const isMine = item.ownerId === user.userId;

    if (isMine) {
      // Build a summary of my post
      const postSummary = {
        id: item.id,
        type: item.type,
        category: item.category,
        description: item.description,
        location: item.location,
        date: item.date,
        status: item.status,
        hasPhoto: !!item.photoKey,
        hiddenDetail: item.hiddenDetail || "",
        createdAt: item.createdAt,
        pendingCount: (item.responses || []).filter(r => r.status === "pending").length,
      };

      if (item.type === "found") myFoundSummaries.push(postSummary);
      else myLostSummaries.push(postSummary);

      // Responses others sent on this post
      for (const resp of item.responses || []) {
        const responder = await readJson(`users/${resp.responderId}.json`, null);
        const entry = {
          postId: item.id,
          postCategory: item.category,
          postDescription: item.description,
          postType: item.type,
          responseId: resp.responseId,
          message: resp.message,
          status: resp.status,
          createdAt: resp.createdAt,
        };
        // Release contact details only if accepted
        if (resp.status === "accepted" && responder) {
          entry.responderName = responder.name;
          entry.responderEmail = responder.email;
          entry.responderPhone = responder.phone || "";
        }
        responsesOnMyPosts.push(entry);
      }
    }

    // Check if I sent a response on this item
    for (const resp of item.responses || []) {
      if (resp.responderId === user.userId) {
        const entry = {
          postId: item.id,
          postCategory: item.category,
          postDescription: item.description,
          postType: item.type,
          responseId: resp.responseId,
          message: resp.message,
          status: resp.status,
          createdAt: resp.createdAt,
        };
        // Release post owner's contact details only if accepted
        if (resp.status === "accepted") {
          const owner = await readJson(`users/${item.ownerId}.json`, null);
          if (owner) {
            entry.ownerName = owner.name;
            entry.ownerEmail = owner.email;
            entry.ownerPhone = owner.phone || "";
          }
        }
        myResponses.push(entry);
      }
    }
  }

  return reply(200, {
    user: {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || "",
    },
    myFoundPosts: myFoundSummaries,
    myLostPosts: myLostSummaries,
    myResponses,
    responsesOnMyPosts,
  });
}

// --- GET /stats (public) ---
// Returns only aggregate numbers (no personal data).

export async function getStats() {
  const index = await readJson("index.json", []);

  let totalPosts = index.length;
  let openPosts = 0;
  let returnedOrResolved = 0;

  for (const item of index) {
    if (item.status === "open") openPosts++;
    if (item.status === "returned" || item.status === "resolved") returnedOrResolved++;
  }

  // Count total responses across all items
  // We only have pendingCount in the index; for total responses we'd
  // need to load items. For stats, just report what we have.
  return reply(200, {
    totalPosts,
    openPosts,
    itemsReturned: returnedOrResolved,
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
