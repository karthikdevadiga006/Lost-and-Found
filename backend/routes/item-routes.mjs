// routes/item-routes.mjs — /found, /lost, /search routes.

import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "../storage.mjs";
import {
  validateCategory, validateString, validateOptionalString, validateDate,
  isExpired, CATEGORIES, SENSITIVE_CATEGORIES,
  MAX_DESCRIPTION_LENGTH, MAX_LOCATION_LENGTH, MAX_HIDDEN_DETAIL_LENGTH,
  ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE,
} from "../validators.mjs";

// --- POST /found (protected) ---
// Create a found-item post. Optionally requests a presigned upload URL for a photo.

export async function createFound(user, body) {
  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });

  // Validate fields
  const category = validateCategory(body.category);
  if (!category) return reply(400, { error: `Invalid category. Choose from: ${CATEGORIES.join(", ")}` });

  const description = validateOptionalString(body.description, MAX_DESCRIPTION_LENGTH);
  if (description === null) return reply(400, { error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters.` });

  const location = validateOptionalString(body.location, MAX_LOCATION_LENGTH);
  if (location === null) return reply(400, { error: "Location is too long." });

  const date = body.date ? validateDate(body.date) : null;
  if (body.date && !date) return reply(400, { error: "Date must be in YYYY-MM-DD format." });

  const hiddenDetail = validateOptionalString(body.hiddenDetail, MAX_HIDDEN_DETAIL_LENGTH);
  if (hiddenDetail === null) return reply(400, { error: "Hidden detail is too long." });

  const wantsPhoto = !!body.wantsPhoto;
  const photoContentType = body.photoContentType || "";

  // Either a photo or a text description is required (a post is never empty)
  if (!description && !wantsPhoto) {
    return reply(400, { error: "Either a description or a photo is required." });
  }

  // If photo requested, validate content type
  if (wantsPhoto && !ALLOWED_PHOTO_TYPES.includes(photoContentType)) {
    return reply(400, { error: "Photo must be JPEG, PNG, or WebP." });
  }

  // Build the post
  const postId = randomUUID();
  const ext = photoContentType ? photoContentType.split("/")[1] : "";
  const photoKey = wantsPhoto ? `photos/${postId}.${ext}` : "";

  const post = {
    id: postId,
    type: "found",
    ownerId: user.userId,
    category,
    description: description || "",
    location: location || "",
    date: date || "",
    photoKey,
    hiddenDetail: hiddenDetail || "",
    status: "open",
    createdAt: new Date().toISOString(),
    responses: [],
  };

  let uploadData = null;
  if (wantsPhoto && photoKey) {
    uploadData = await generatePresignedUpload(photoKey, photoContentType);
    if (!uploadData) {
      return reply(500, { error: "Could not prepare the photo upload. Please try again." });
    }
  }

  // Save the item
  await writeJson(`items/${postId}.json`, post);

  // Update the global index
  const index = await readJson("index.json", []);
  index.push({
    id: postId,
    type: "found",
    category,
    description: description || "",
    location: location || "",
    date: date || "",
    status: "open",
    hasPhoto: !!photoKey,
    createdAt: post.createdAt,
    pendingCount: 0,
  });
  await writeJson("index.json", index);

  // Build response
  const result = { post: { id: postId, type: "found", category, status: "open" } };

  // Generate presigned upload URL if a photo is requested
  if (uploadData) result.upload = uploadData;

  return reply(201, result);
}

// --- POST /lost (protected) ---
// Create a lost-item request. Optionally requests a presigned upload URL for a photo.

export async function createLost(user, body) {
  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });

  const category = validateCategory(body.category);
  if (!category) return reply(400, { error: `Invalid category. Choose from: ${CATEGORIES.join(", ")}` });

  const description = validateString(body.description, MAX_DESCRIPTION_LENGTH);
  if (!description) return reply(400, { error: "Description is required for lost requests." });

  const location = validateOptionalString(body.location, MAX_LOCATION_LENGTH);
  if (location === null) return reply(400, { error: "Location is too long." });

  const date = body.date ? validateDate(body.date) : null;
  if (body.date && !date) return reply(400, { error: "Date must be in YYYY-MM-DD format." });

  const wantsPhoto = !!body.wantsPhoto;
  const photoContentType = body.photoContentType || "";

  if (wantsPhoto && !ALLOWED_PHOTO_TYPES.includes(photoContentType)) {
    return reply(400, { error: "Photo must be JPEG, PNG, or WebP." });
  }

  const postId = randomUUID();
  const ext = photoContentType ? photoContentType.split("/")[1] : "";
  const photoKey = wantsPhoto ? `photos/${postId}.${ext}` : "";

  const post = {
    id: postId,
    type: "lost",
    ownerId: user.userId,
    category,
    description,
    location: location || "",
    date: date || "",
    photoKey,
    hiddenDetail: "", // lost posts don't have hidden details
    status: "open",
    createdAt: new Date().toISOString(),
    responses: [],
  };

  let uploadData = null;
  if (wantsPhoto && photoKey) {
    uploadData = await generatePresignedUpload(photoKey, photoContentType);
    if (!uploadData) {
      return reply(500, { error: "Could not prepare the photo upload. Please try again." });
    }
  }

  await writeJson(`items/${postId}.json`, post);

  const index = await readJson("index.json", []);
  index.push({
    id: postId,
    type: "lost",
    category,
    description,
    location: location || "",
    date: date || "",
    status: "open",
    hasPhoto: !!photoKey,
    createdAt: post.createdAt,
    pendingCount: 0,
  });
  await writeJson("index.json", index);

  const result = { post: { id: postId, type: "lost", category, status: "open" } };

  if (uploadData) result.upload = uploadData;

  return reply(201, result);
}

// --- GET /search (protected) ---
// Query params: type (found|lost), category, location, from, to, q (keyword).
// Returns open posts, public fields only. Cleans up expired posts.

export async function search(user, body, event) {
  const params = event.queryStringParameters || {};
  const typeFilter = params.type || "";           // "found", "lost", "all", or ""
  const categoryFilter = params.category || "";
  const locationFilter = (params.location || "").toLowerCase().trim();
  const fromDate = params.from || "";
  const toDate = params.to || "";
  const keyword = (params.q || "").toLowerCase().trim();

  if (typeFilter && typeFilter !== "found" && typeFilter !== "lost" && typeFilter !== "all") {
    return reply(400, { error: "Type must be 'found', 'lost', or 'all'." });
  }

  let index = await readJson("index.json", []);

  // Expire old posts (remove from index, delete item files)
  const expired = [];
  const active = [];
  for (const entry of index) {
    if (isExpired(entry.createdAt)) {
      expired.push(entry);
    } else {
      active.push(entry);
    }
  }
  if (expired.length > 0) {
    // Write cleaned index and delete expired items in background
    await writeJson("index.json", active);
    for (const entry of expired) {
      try { await (await import("../storage.mjs")).deleteKey(`items/${entry.id}.json`); } catch {}
    }
    index = active;
  }

  // Multi-term matching for keywords and location
  const keywordTerms = keyword ? keyword.split(/\s+/).filter(Boolean) : [];
  const locationTerms = locationFilter ? locationFilter.split(/\s+/).filter(Boolean) : [];

  // Filter
  let results = index.filter(entry => {
    if (entry.status !== "open" && entry.status !== "pending") return false;
    if (typeFilter && typeFilter !== "all" && entry.type !== typeFilter) return false;
    if (categoryFilter && entry.category !== categoryFilter) return false;
    if (locationTerms.length > 0) {
      const entryLoc = (entry.location || "").toLowerCase();
      if (!locationTerms.every(term => entryLoc.includes(term))) return false;
    }
    if (fromDate && entry.date && entry.date < fromDate) return false;
    if (toDate && entry.date && entry.date > toDate) return false;
    if (keywordTerms.length > 0) {
      const text = `${entry.category} ${entry.description} ${entry.location}`.toLowerCase();
      if (!keywordTerms.every(term => text.includes(term))) return false;
    }
    return true;
  });

  // Enrich with ownership, claim status, and user-specific response state
  const enriched = await Promise.all(
    results.map(async entry => {
      const item = await readJson(`items/${entry.id}.json`, null);
      const myResp = item?.responses?.find(r => r.responderId === user.userId);
      return {
        id: entry.id,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        location: entry.location,
        date: entry.date,
        status: entry.status,
        hasPhoto: entry.hasPhoto,
        pendingCount: entry.pendingCount || 0,
        isMine: item ? item.ownerId === user.userId : false,
        hasResponded: !!myResp,
        myResponseStatus: myResp ? myResp.status : null,
        createdAt: entry.createdAt,
      };
    })
  );

  // Sort by newest first
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return reply(200, { results: enriched });
}

// --- Presigned upload helper ---
// For local dev, returns a mock. For Lambda, uses S3 presigned PUT.

async function generatePresignedUpload(key, contentType) {
  if (process.env.LOCAL_DATA_DIR) {
    // Local dev mode: return a mock upload URL pointing to the dev server
    return {
      url: `http://localhost:3000/_upload/${key}`,
      method: "PUT",
      contentType,
      maxSize: MAX_PHOTO_SIZE,
    };
  }

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3 = new S3Client({});
    const command = new PutObjectCommand({
      Bucket: process.env.DATA_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    return { url, method: "PUT", contentType, maxSize: MAX_PHOTO_SIZE };
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return null;
  }
}

// --- GET /photo (protected) ---
// Returns a presigned download URL for a photo.

export async function getPhoto(user, body, event) {
  const params = event.queryStringParameters || {};
  const postId = params.id;

  if (!postId) return reply(400, { error: "Post ID is required." });

  const item = await readJson(`items/${postId}.json`, null);
  if (!item || !item.photoKey) return reply(404, { error: "Photo not found." });

  if (process.env.LOCAL_DATA_DIR) {
    // Local dev: serve via dev server
    return reply(200, { url: `http://localhost:3000/_photo/${item.photoKey}` });
  }

  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3 = new S3Client({});
    const command = new GetObjectCommand({
      Bucket: process.env.DATA_BUCKET,
      Key: item.photoKey,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // ~5 minutes
    return reply(200, { url });
  } catch (err) {
    console.error("Failed to generate download URL:", err);
    return reply(500, { error: "Could not generate photo URL." });
  }
}

// --- POST /close (protected) ---
// Allows the post owner to close their own post at any time.

export async function closeItem(user, body) {
  if (!body || typeof body !== "object") return reply(400, { error: "Request body is required." });
  const postId = body.postId;
  if (!postId || typeof postId !== "string") return reply(400, { error: "postId is required." });

  const item = await readJson(`items/${postId}.json`, null);
  if (!item) return reply(404, { error: "Post not found." });

  if (item.ownerId !== user.userId) {
    return reply(403, { error: "Only the post owner can close this post." });
  }

  if (item.status === "returned" || item.status === "resolved") {
    return reply(400, { error: "This post is already closed." });
  }

  item.status = item.type === "found" ? "returned" : "resolved";
  for (const r of item.responses || []) {
    if (r.status === "pending") r.status = "rejected";
  }

  await writeJson(`items/${postId}.json`, item);

  const index = await readJson("index.json", []);
  const entry = index.find(e => e.id === postId);
  if (entry) {
    entry.status = item.status;
    entry.pendingCount = 0;
    await writeJson("index.json", index);
  }

  return reply(200, {
    message: item.type === "found" ? "Item marked as returned." : "Request marked as resolved.",
    status: item.status,
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
