// Profile.jsx — User profile page with four tabs.
// My Found Items | My Lost Requests | My Responses | Responses on my posts
// Shows Accept/Reject buttons on the last tab, and contact details on accepted responses.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import ResponseList from "../components/ResponseList";

const TABS = [
  { key: "found", label: "My Found Items", icon: "Found" },
  { key: "lost", label: "My Lost Requests", icon: "Lost" },
  { key: "sent", label: "My Responses", icon: "Sent" },
  { key: "received", label: "Responses on my posts", icon: "Received" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("found");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    api("/me")
      .then(d => {
        if (!ignore) {
          setData(d);
          setError("");
        }
      })
      .catch(err => {
        if (!ignore) setError(err.error || "Failed to load profile.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  function refreshProfile() {
    setRefreshKey(k => k + 1);
  }

  const [closing, setClosing] = useState(false);

  // Owner closes their own post (mark returned / resolved)
  async function handleClosePost(postId) {
    if (!window.confirm("Are you sure you want to mark this post as closed?")) return;
    setClosing(true);
    setActionMsg("");
    try {
      const result = await api("/close", {
        method: "POST",
        body: { postId },
      });
      setActionMsg(result.message || "Post closed successfully.");
      refreshProfile();
    } catch (err) {
      setActionMsg(err.error || "Failed to close post.");
    } finally {
      setClosing(false);
    }
  }

  // Accept or reject a response on one of my posts
  async function handleDecide(postId, responseId, decision) {
    setDeciding(true);
    setActionMsg("");
    try {
      const result = await api("/decide", {
        method: "POST",
        body: { postId, responseId, decision },
      });
      setActionMsg(result.message || `Response ${decision}ed.`);
      // Reload profile to get updated statuses
      refreshProfile();
    } catch (err) {
      setActionMsg(err.error || "Action failed.");
    } finally {
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <div className="page text-center py-20">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full" />
        <p className="text-surface-700 mt-4">Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page text-center py-20">
        <p className="text-status-rejected font-medium">{error}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={refreshProfile} className="btn-primary">Retry</button>
          <button onClick={() => navigate("/")} className="btn-secondary">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, myFoundPosts, myLostPosts, myResponses, responsesOnMyPosts } = data;

  // Badge counts
  const pendingReceived = responsesOnMyPosts.filter(r => r.status === "pending").length;

  // Group received responses by post
  const receivedByPost = {};
  for (const resp of responsesOnMyPosts) {
    if (!receivedByPost[resp.postId]) {
      receivedByPost[resp.postId] = {
        postId: resp.postId,
        postCategory: resp.postCategory,
        postDescription: resp.postDescription,
        postType: resp.postType,
        responses: [],
      };
    }
    receivedByPost[resp.postId].responses.push(resp);
  }

  return (
    <div className="page">
      {/* Back button to homepage */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-brand-600 hover:text-brand-700 text-sm font-medium mb-4 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
        id="btn-back-home"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Home
      </button>

      {/* User header */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">{user.name}</h1>
            <p className="text-sm text-surface-700">{user.email}</p>
            {user.phone && <p className="text-xs text-surface-700/60">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium ring-1 ring-emerald-200">
          {actionMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {TABS.map(t => {
          const isActive = tab === t.key;
          let badge = 0;
          if (t.key === "received") badge = pendingReceived;
          if (t.key === "found") badge = myFoundPosts.filter(p => p.pendingCount > 0).length;
          if (t.key === "lost") badge = myLostPosts.filter(p => p.pendingCount > 0).length;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-brand-600 text-white shadow-md shadow-brand-300/40"
                  : "text-surface-700 hover:bg-surface-100"
              }`}
              id={`tab-${t.key}`}
            >
              <span className="mr-1.5">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ").slice(-1)}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-amber-400 text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {/* My Found Items */}
        {tab === "found" && (
          <div className="space-y-4">
            {myFoundPosts.length === 0 ? (
              <EmptyState message="You haven't posted any found items yet." />
            ) : (
              myFoundPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClosePost={handleClosePost}
                  closing={closing}
                />
              ))
            )}
          </div>
        )}

        {/* My Lost Requests */}
        {tab === "lost" && (
          <div className="space-y-4">
            {myLostPosts.length === 0 ? (
              <EmptyState message="You haven't posted any lost requests yet." />
            ) : (
              myLostPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClosePost={handleClosePost}
                  closing={closing}
                />
              ))
            )}
          </div>
        )}

        {/* My Responses (claims / found reports I sent) */}
        {tab === "sent" && (
          <div className="space-y-4">
            {myResponses.length === 0 ? (
              <EmptyState message="You haven't sent any responses yet." />
            ) : (
              myResponses.map(resp => (
                <div key={resp.responseId} className="card" id={`sent-${resp.responseId}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={resp.status} />
                    <span className="text-xs text-surface-700/50">
                      {resp.postType === "found" ? "Claim" : "Found report"} on{" "}
                      <strong>{resp.postCategory}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-surface-700 mb-2">{resp.postDescription}</p>
                  <p className="text-xs text-surface-700/60 italic">Your message: "{resp.message}"</p>

                  {/* Contact info (released on accepted) */}
                  {resp.status === "accepted" && (resp.ownerName || resp.responderName) && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 text-sm ring-1 ring-emerald-200">
                      <p className="font-semibold text-emerald-700 mb-1">Contact details</p>
                      <p className="text-emerald-800"><strong>Name:</strong> {resp.ownerName}</p>
                      <p className="text-emerald-800"><strong>Email:</strong> {resp.ownerEmail}</p>
                      {resp.ownerPhone && (
                        <p className="text-emerald-800"><strong>Phone:</strong> {resp.ownerPhone}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Responses on my posts */}
        {tab === "received" && (
          <div className="space-y-6">
            {Object.keys(receivedByPost).length === 0 ? (
              <EmptyState message="No one has responded to your posts yet." />
            ) : (
              Object.values(receivedByPost).map(group => (
                <div key={group.postId} className="card" id={`received-post-${group.postId}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-surface-900 capitalize">
                      {group.postCategory}
                    </span>
                    <span className="text-xs text-surface-700/50">
                      ({group.postType === "found" ? "Found item" : "Lost request"})
                    </span>
                  </div>
                  <p className="text-sm text-surface-700 mb-3">{group.postDescription}</p>

                  <ResponseList
                    responses={group.responses}
                    postType={group.postType}
                    onDecide={(responseId, decision) =>
                      handleDecide(group.postId, responseId, decision)
                    }
                    deciding={deciding}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function PostCard({ post, onClosePost, closing }) {
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
      const data = await api(`/photo?id=${post.id}`);
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

  const isOpenOrPending = post.status === "open" || post.status === "pending";

  return (
    <div className="card" id={`post-${post.id}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-surface-900 capitalize">{post.category}</span>
          <StatusBadge status={post.status} />
          {post.hasPhoto && (
            <button
              type="button"
              onClick={handleViewPhoto}
              disabled={photoLoading}
              className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-0.5 rounded-full ring-1 ring-inset ring-purple-200 font-medium transition-colors cursor-pointer"
            >
              {photoLoading ? "Loading…" : "View Photo"}
            </button>
          )}
          {post.pendingCount > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-200 font-semibold">
              {post.pendingCount} pending
            </span>
          )}
        </div>

        {onClosePost && isOpenOrPending && (
          <button
            type="button"
            onClick={() => onClosePost(post.id)}
            disabled={closing}
            className="text-xs font-medium text-surface-700 hover:text-surface-900 bg-surface-100 hover:bg-surface-200 px-2.5 py-1 rounded-lg border border-surface-200 transition-colors cursor-pointer"
          >
            {closing ? "Closing…" : post.type === "found" ? "Mark Returned" : "Mark Resolved"}
          </button>
        )}
      </div>

      {post.description && (
        <p className="text-sm text-surface-700 mb-1">{post.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-surface-700/50">
        {post.location && <span>Location: {post.location}</span>}
        {post.date && <span>Date: {post.date}</span>}
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Hidden detail (only on found posts, only visible to owner) */}
      {post.hiddenDetail && (
        <div className="mt-3 p-3 rounded-lg bg-surface-50 text-sm border border-surface-200">
          <span className="font-medium text-surface-700">Your hidden detail:</span>{" "}
          <span className="text-surface-700/80">{post.hiddenDetail}</span>
        </div>
      )}

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
              <h3 className="font-bold text-surface-900 capitalize">{post.category} Photo</h3>
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
                alt={post.category}
                className="object-contain max-h-[70vh] w-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12">
      <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-brand-300" />
      <p className="text-surface-700">{message}</p>
    </div>
  );
}
