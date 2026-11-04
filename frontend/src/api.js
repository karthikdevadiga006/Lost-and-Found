// api.js — Single fetch helper for all API calls.
// Adds the auth token, handles JSON, and on 401 clears the token + redirects to login.

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Make an authenticated API request.
 * @param {string}  path    — route path, e.g. "/login"
 * @param {object}  options — { method, body, headers }
 * @returns {Promise<object>} parsed JSON response
 * @throws {{ status, error }} on non-2xx responses
 */
export async function api(path, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const token = getToken();
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401: For protected routes, clear token and redirect with "Session expired".
  // For /login or /register, return the backend's error (e.g. "Invalid email or password.").
  if (res.status === 401) {
    if (path === "/login" || path === "/register") {
      const data = await res.json().catch(() => ({}));
      throw { status: 401, error: data.error || "Invalid email or password." };
    }

    clearToken();
    const currentHash = window.location.hash.slice(1); // remove #
    if (currentHash && currentHash !== "/login" && currentHash !== "/register") {
      window.location.hash = `/login?next=${encodeURIComponent(currentHash)}`;
    } else {
      window.location.hash = "/login";
    }
    throw { status: 401, error: "Session expired. Please log in again." };
  }

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, error: data.error || "Something went wrong." };
  }

  return data;
}

export async function uploadFile(upload, file) {
  if (!upload?.url || !file) {
    throw { error: "Photo upload could not be prepared." };
  }

  const res = await fetch(upload.url, {
    method: upload.method || "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw { status: res.status, error: "Photo upload failed. Please try again." };
  }
}

// --- Token management (localStorage) ---

const TOKEN_KEY = "lf_token";
const USER_KEY = "lf_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedIn() {
  return !!getToken();
}
