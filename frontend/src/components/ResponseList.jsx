// ResponseList.jsx — Lists responses on a post with Accept/Reject buttons.
// Used in the Profile page under "Responses on my posts" tab.

import StatusBadge from "./StatusBadge";

export default function ResponseList({ responses, postType, onDecide, deciding }) {
  if (!responses || responses.length === 0) {
    return (
      <p className="text-sm text-surface-500 italic py-3">No responses received yet.</p>
    );
  }

  // Wording depends on the post type
  const isFoundPost = postType === "found";

  return (
    <div className="space-y-3">
      {responses.map(resp => (
        <div
          key={resp.responseId}
          className="p-4 sm:p-5 rounded-2xl border border-surface-200/90 bg-white/95 transition-all shadow-xs hover:shadow-md"
          id={`response-${resp.responseId}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status + type label */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={resp.status} />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-100 text-surface-700">
                  {isFoundPost ? "Claim proof submitted" : "Found item location report"}
                </span>
                <span className="text-xs text-surface-400">
                  {new Date(resp.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Message / proof */}
              <div className="bg-surface-50/80 p-3 rounded-xl border border-surface-200/60 mb-3">
                <span className="block text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-1">
                  {isFoundPost ? "Claimant's Proof of Ownership" : "Finder's Location Note"}
                </span>
                <p className="text-sm text-surface-800 leading-relaxed font-normal">
                  "{resp.message}"
                </p>
              </div>

              {/* Contact info (only shown when accepted) */}
              {resp.status === "accepted" && (resp.responderName || resp.ownerName) && (
                <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-sm shadow-xs">
                  <p className="font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                    Contact details unlocked
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                      <span className="text-surface-500 block text-[11px] font-semibold">Name</span>
                      <span className="font-bold text-surface-900">{resp.responderName || resp.ownerName}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                      <span className="text-surface-500 block text-[11px] font-semibold">Email</span>
                      <a
                        href={`mailto:${resp.responderEmail || resp.ownerEmail}`}
                        className="font-bold text-brand-600 hover:underline break-all"
                      >
                        {resp.responderEmail || resp.ownerEmail}
                      </a>
                    </div>
                    {(resp.responderPhone || resp.ownerPhone) && (
                      <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60 sm:col-span-2">
                        <span className="text-surface-500 block text-[11px] font-semibold">Phone</span>
                        <a
                          href={`tel:${resp.responderPhone || resp.ownerPhone}`}
                          className="font-bold text-brand-600 hover:underline"
                        >
                          {resp.responderPhone || resp.ownerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accept / Reject buttons (only for pending, only for post owner) */}
            {resp.status === "pending" && onDecide && (
              <div className="flex-shrink-0 flex sm:flex-col gap-2 pt-1 sm:pt-0">
                <button
                  onClick={() => onDecide(resp.responseId, "accept")}
                  disabled={deciding}
                  className="btn-primary text-xs px-3.5 py-1.5 rounded-xl shadow-xs whitespace-nowrap"
                  id={`btn-accept-${resp.responseId}`}
                >
                  ✓ Accept Claim
                </button>
                <button
                  onClick={() => onDecide(resp.responseId, "reject")}
                  disabled={deciding}
                  className="btn-danger text-xs px-3.5 py-1.5 rounded-xl shadow-xs whitespace-nowrap"
                  id={`btn-reject-${resp.responseId}`}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
