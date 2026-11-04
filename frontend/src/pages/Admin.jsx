// Admin.jsx — Admin page.
// Requires login AND the admin key typed into the page.
// Key is sent in x-admin-key header, never stored in frontend code.

import { useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [postId, setPostId] = useState("");
  const [action, setAction] = useState("delete");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!adminKey.trim()) return setError("Admin key is required.");
    if (!postId.trim()) return setError("Post ID is required.");

    setLoading(true);
    try {
      const data = await api("/admin", {
        method: "POST",
        body: { action, postId: postId.trim() },
        headers: { "x-admin-key": adminKey.trim() },
      });
      setMessage(data.message || "Done.");
      setPostId("");
    } catch (err) {
      setError(err.error || "Admin action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-3">
            <span className="text-sm font-bold uppercase tracking-wider text-red-700">ADM</span>
          </div>
          <h1 className="heading">Admin</h1>
          <p className="text-surface-700 mt-2 text-sm">
            Delete spam posts or force-close stuck posts.
          </p>
        </div>

        <div className="card">
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium ring-1 ring-emerald-200">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium ring-1 ring-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-key" className="label">Admin Key *</label>
              <input
                id="admin-key"
                type="password"
                className="input"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-post-id" className="label">Post ID *</label>
              <input
                id="admin-post-id"
                type="text"
                className="input"
                placeholder="UUID of the post"
                value={postId}
                onChange={e => setPostId(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="admin-action" className="label">Action</label>
              <select
                id="admin-action"
                className="input"
                value={action}
                onChange={e => setAction(e.target.value)}
              >
                <option value="delete">Delete post</option>
                <option value="force-close">Force close post</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-danger w-full"
              id="btn-admin-submit"
            >
              {loading ? "Processing…" : "Execute"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
