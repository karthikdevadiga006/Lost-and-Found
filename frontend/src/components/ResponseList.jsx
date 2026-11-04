// ResponseList.jsx — Lists responses on a post with Accept/Reject buttons.
// Used in the Profile page under "Responses on my posts" tab.

import StatusBadge from "./StatusBadge";

export default function ResponseList({ responses, postType, onDecide, deciding }) {
  if (!responses || responses.length === 0) {
    return (
      <p className="text-sm text-surface-700/60 italic py-3">No responses yet.</p>
    );
  }

  // Wording depends on the post type
  const isFoundPost = postType === "found";

  return (
    <div className="space-y-3">
      {responses.map(resp => (
        <div
          key={resp.responseId}
          className="p-4 rounded-xl border border-surface-200 bg-white transition-all hover:shadow-sm"
          id={`response-${resp.responseId}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Status + type label */}
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={resp.status} />
                <span className="text-xs text-surface-700/50">
                  {isFoundPost ? "Claim" : "Found report"}
                </span>
                <span className="text-xs text-surface-700/50">
                  {new Date(resp.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Message / proof */}
              <p className="text-sm text-surface-700 leading-relaxed mb-2">
                {resp.message}
              </p>

              {/* Contact info (only shown when accepted) */}
              {resp.status === "accepted" && (resp.responderName || resp.ownerName) && (
                <div className="p-3 rounded-lg bg-emerald-50 text-sm ring-1 ring-emerald-200">
                  <p className="font-semibold text-emerald-700 mb-1">
                    Contact details
                  </p>
                  <p className="text-emerald-800">
                    <strong>Name:</strong> {resp.responderName || resp.ownerName}
                  </p>
                  <p className="text-emerald-800">
                    <strong>Email:</strong> {resp.responderEmail || resp.ownerEmail}
                  </p>
                  {(resp.responderPhone || resp.ownerPhone) && (
                    <p className="text-emerald-800">
                      <strong>Phone:</strong> {resp.responderPhone || resp.ownerPhone}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Accept / Reject buttons (only for pending, only for post owner) */}
            {resp.status === "pending" && onDecide && (
              <div className="flex-shrink-0 flex flex-col gap-2">
                <button
                  onClick={() => onDecide(resp.responseId, "accept")}
                  disabled={deciding}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                  id={`btn-accept-${resp.responseId}`}
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecide(resp.responseId, "reject")}
                  disabled={deciding}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 transition-colors cursor-pointer disabled:opacity-50"
                  id={`btn-reject-${resp.responseId}`}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
