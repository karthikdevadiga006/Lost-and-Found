// PostForm.jsx — Shared form for posting found items and lost requests.
// Renders category, description, location, date, optional photo, and
// (for found items) the hidden detail field + the unique-detail alert.

import { useState } from "react";
import UniqueDetailAlert from "./UniqueDetailAlert";

// Categories (mirrored from backend validators.mjs)
const CATEGORIES = [
  "bottle", "ID card", "bank card / documents", "keys", "wallet",
  "phone", "charger", "earphones", "laptop / tablet", "bag",
  "books", "stationery", "clothing", "other",
];

const SENSITIVE_CATEGORIES = ["ID card", "bank card / documents"];

const TODAY = new Date().toISOString().split("T")[0];

export default function PostForm({ type, onSubmit, loading }) {
  const isFound = type === "found";

  const [form, setForm] = useState({
    category: "",
    description: "",
    location: "",
    date: "",
    hiddenDetail: "",
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return setPhoto(null);

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Photo must be JPEG, PNG, or WebP.");
      e.target.value = "";
      return;
    }
    // Validate size (3 MB)
    if (file.size > 3 * 1024 * 1024) {
      setError("Photo must be under 3 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    setPhoto(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.category) return setError("Category is required.");

    // Found posts: either photo or description required
    // Lost posts: description always required
    if (isFound && !form.description.trim() && !photo) {
      return setError("Either a description or a photo is required.");
    }
    if (!isFound && !form.description.trim()) {
      return setError("Description is required.");
    }

    onSubmit({
      category: form.category,
      description: form.description.trim(),
      location: form.location.trim(),
      date: form.date,
      hiddenDetail: isFound ? form.hiddenDetail.trim() : "",
      photo,
    });
  }

  const isSensitive = SENSITIVE_CATEGORIES.includes(form.category);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Unique detail alert — shown at top for found items */}
      {isFound && <UniqueDetailAlert />}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium ring-1 ring-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Category */}
      <div>
        <label htmlFor="post-category" className="label">Category *</label>
        <select
          id="post-category"
          className="input"
          value={form.category}
          onChange={update("category")}
          required
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Sensitive category warning */}
      {isSensitive && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-sm ring-1 ring-amber-200">
          <strong>Sensitive item:</strong> If uploading a photo, please cover any names, numbers, or personal information visible on the item.
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="post-description" className="label">
          {isFound ? "Colour / Product Description" : "Description"} {!isFound && "*"}
        </label>
        {isFound && (
          <p className="text-xs text-surface-700/60 mb-1.5">
            Describe colour, type, brand only. Keep unique details to yourself.
          </p>
        )}
        <textarea
          id="post-description"
          className="input min-h-[100px] resize-y"
          placeholder={isFound
            ? "e.g. Blue steel bottle, medium size"
            : "Describe the item you lost…"
          }
          value={form.description}
          onChange={update("description")}
          maxLength={1000}
          required={!isFound}
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="post-location" className="label">
          Location {isFound ? "found" : "lost"}
          <span className="text-surface-700/40 font-normal ml-1">(optional)</span>
        </label>
        <input
          id="post-location"
          type="text"
          className="input"
          placeholder="e.g. Library, Cafeteria, Room 201"
          value={form.location}
          onChange={update("location")}
          maxLength={200}
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="post-date" className="label">
          Date {isFound ? "found" : "lost"}
          <span className="text-surface-700/40 font-normal ml-1">(optional)</span>
        </label>
        <input
          id="post-date"
          type="date"
          className="input"
          value={form.date}
          onChange={update("date")}
          max={TODAY}
        />
      </div>

      {/* Photo */}
      <div>
        <label htmlFor="post-photo" className="label">
          Photo
          <span className="text-surface-700/40 font-normal ml-1">(optional)</span>
        </label>
        {isFound && (
          <p className="text-xs text-amber-600 mb-1.5">
            Don't upload a photo that shows unique details, serial numbers, or sensitive text.
          </p>
        )}
        <input
          id="post-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="block w-full text-sm text-surface-700
            file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0
            file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600
            hover:file:bg-brand-100 file:cursor-pointer file:transition-colors"
        />
        {photo && (
          <p className="mt-1.5 text-xs text-emerald-600 font-medium">
            {photo.name} ({(photo.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </div>

      {/* Hidden detail (found items only) */}
      {isFound && (
        <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
          <label htmlFor="post-hidden" className="label">
            Hidden detail
            <span className="text-surface-700/40 font-normal ml-1">(only you can see this)</span>
          </label>
          <p className="text-xs text-surface-700/60 mb-2">
            Record the unique feature here so you can compare it with claimers' proofs. This is never shown in search results.
          </p>
          <textarea
            id="post-hidden"
            className="input min-h-[80px] resize-y"
            placeholder="e.g. Cat sticker on the base, scratch on the left side"
            value={form.hiddenDetail}
            onChange={update("hiddenDetail")}
            maxLength={500}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
        id="btn-post-submit"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Posting…
          </span>
        ) : (
          isFound ? "Post found item" : "Post lost request"
        )}
      </button>
    </form>
  );
}
