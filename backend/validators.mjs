// validators.mjs — Input validation, shared constants (categories, limits).
// Used by both route handlers and the frontend (categories list is duplicated there).

// --- Categories (shared constant) ---

export const CATEGORIES = [
  "bottle",
  "ID card",
  "bank card / documents",
  "keys",
  "wallet",
  "phone",
  "charger",
  "earphones",
  "laptop / tablet",
  "bag",
  "books",
  "stationery",
  "clothing",
  "other",
];

// Categories where names / numbers might be visible on the item.
export const SENSITIVE_CATEGORIES = ["ID card", "bank card / documents"];

// --- Limits ---

export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_NAME_LENGTH = 100;
export const MAX_LOCATION_LENGTH = 200;
export const MAX_HIDDEN_DETAIL_LENGTH = 500;
export const MAX_BODY_SIZE = 50_000; // ~50 KB JSON body limit
export const MAX_PHOTO_SIZE = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const TOKEN_TTL = 2 * 60 * 60; // 2 hours in seconds
export const POST_EXPIRY_DAYS = 60;
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

// --- Validation helpers ---

/**
 * Validate an email address (basic format check).
 * Returns the email in lowercase, or null if invalid.
 */
export function validateEmail(email, allowedDomain) {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  // Basic email regex: something@something.something
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  if (trimmed.length > 254) return null;
  // If an allowed domain is configured, enforce it
  if (allowedDomain && !trimmed.endsWith(`@${allowedDomain.toLowerCase()}`)) {
    return null;
  }
  return trimmed;
}

/**
 * Validate a non-empty string field within a length limit.
 * Returns the trimmed string, or null if invalid.
 */
export function validateString(value, maxLength) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

/**
 * Validate an optional string field (empty / missing is OK).
 * Returns trimmed string or empty string. Returns null only if over the limit.
 */
export function validateOptionalString(value, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

/**
 * Check that a category is in the allowed list.
 */
export function validateCategory(cat) {
  if (!cat || typeof cat !== "string") return null;
  const trimmed = cat.trim();
  return CATEGORIES.includes(trimmed) ? trimmed : null;
}

/**
 * Validate an ISO date string (YYYY-MM-DD format).
 * Returns the string if valid, null otherwise.
 */
export function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return dateStr;
}

/**
 * Validate a password (minimum 8 characters).
 */
export function validatePassword(pw) {
  if (!pw || typeof pw !== "string") return null;
  if (pw.length < 8 || pw.length > 128) return null;
  return pw; // Do not trim passwords
}

/**
 * Check if a post has expired (older than POST_EXPIRY_DAYS).
 */
export function isExpired(createdAt) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > POST_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Return only the allowed keys from an object.
 * Rejects the request body if unknown keys are present.
 */
export function pickKnownFields(obj, allowed) {
  if (!obj || typeof obj !== "object") return null;
  const unknownKeys = Object.keys(obj).filter(k => !allowed.includes(k));
  if (unknownKeys.length > 0) return null;
  const result = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}
