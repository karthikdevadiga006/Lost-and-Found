// ItemCard.jsx — Displays a post summary in search results.
// Shows category, description, location, date, status, pending count, and photo indicator.
// Used by both LostFlow (showing found items) and FoundFlow (showing lost requests).

import { useState } from "react";
import { api } from "../api";
import StatusBadge from "./StatusBadge";

export default function ItemCard({ item, actionLabel, onAction, showPending = true }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleViewPhoto() {
    if (photoUrl) {
      setShowModal(true);
      return;
    }
    setPhotoLoading(true);
    try {
      const data = await api(`/photo?id=${item.id}`);
      if (data.url) {
        setPhotoUrl(data.url);
        setShowModal(true);
      }
    } catch (err) {
      alert(err.error || "Could not load photo.");
    } finally {
      setPhotoLoading(false);
    }
  }
  return (
    <div className="card group" id={`item-card-${item.id}`}>
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
          <span className="text-sm font-bold uppercase tracking-wider text-brand-700">
            {item.category.slice(0, 2)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row: category + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-surface-900 capitalize">{item.category}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
                item.type === "found"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {item.type === "found" ? "Found" : "Lost"}
            </span>
            <StatusBadge status={item.status} />
            {item.hasPhoto && (
              <button
                type="button"
                onClick={handleViewPhoto}
                disabled={photoLoading}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 ring-1 ring-inset ring-purple-200 transition-colors cursor-pointer"
                title="Click to view photo"
              >
                {photoLoading ? "Loading…" : "View Photo"}
              </button>
            )}
            {showPending && item.pendingCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                {item.pendingCount} pending
              </span>
            )}
            {item.isMine && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200">
                Mine
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-surface-700 mb-2 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-surface-700/70">
            {item.location && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {item.location}
              </span>
            )}
            {item.date && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {item.date}
              </span>
            )}
          </div>
        </div>

        {/* Action button or Status indicator */}
        {item.isMine ? (
          <a
            href="#/profile"
            className="flex-shrink-0 btn-secondary text-xs px-3 py-1.5 self-center"
            id={`btn-profile-${item.id}`}
          >
            Your post →
          </a>
        ) : item.hasResponded ? (
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 self-center"
            id={`status-claimed-by-me-${item.id}`}
          >
            {item.type === "found" ? "Claimed (Under review)" : "Response submitted"}
          </span>
        ) : ((item.status === "pending" || item.pendingCount > 0) && item.type !== "found") ? (
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 self-center"
            id={`status-pending-${item.id}`}
          >
            {item.type === "found" ? "Claim Pending" : "Under Review"}
          </span>
        ) : (item.status === "returned" || item.status === "resolved") ? (
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 text-surface-600 ring-1 ring-inset ring-surface-200 self-center"
            id={`status-closed-${item.id}`}
          >
            {item.status === "returned" ? "Returned" : "Resolved"}
          </span>
        ) : (actionLabel && onAction) ? (
          <button
            onClick={() => onAction(item)}
            className="flex-shrink-0 btn-primary text-sm px-4 py-2 self-center"
            id={`btn-action-${item.id}`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      {/* Photo Modal */}
      {showModal && photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <h3 className="font-bold text-surface-900 capitalize">{item.category} Photo</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-700 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center bg-surface-50 rounded-xl overflow-hidden max-h-[70vh]">
              <img
                src={photoUrl}
                alt={item.category}
                className="object-contain max-h-[70vh] w-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
