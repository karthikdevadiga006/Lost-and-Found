// LostFlow.jsx — "I lost something" flow.
// Step 1: Pick category, keyword, location, date, or type (default all / found).
// Step 2: If item is listed → Claim it (found) or view / respond (lost). If not → Post a lost request.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, uploadFile } from "../api";
import ItemCard from "../components/ItemCard";
import PostForm from "../components/PostForm";

const CATEGORIES = [
  "bottle", "ID card", "bank card / documents", "keys", "wallet",
  "phone", "charger", "earphones", "laptop / tablet", "bag",
  "books", "stationery", "clothing", "other",
];

export default function LostFlow() {
  const navigate = useNavigate();
  // View state: "search" | "results" | "claim" | "respond" | "post"
  const [view, setView] = useState("search");

  // Search state
  const [filters, setFilters] = useState({ type: "all", category: "", location: "", from: "", to: "", q: "" });
  const [results, setResults] = useState([]);
  const [resultTab, setResultTab] = useState("all");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Claim state (on found items)
  const [claimTarget, setClaimTarget] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Respond state (on lost requests)
  const [respondTarget, setRespondTarget] = useState(null);
  const [respondMessage, setRespondMessage] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);
  const [respondError, setRespondError] = useState("");
  const [respondSuccess, setRespondSuccess] = useState(false);

  // Post state
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postError, setPostError] = useState("");

  function updateFilter(field) {
    return e => setFilters(prev => ({ ...prev, [field]: e.target.value }));
  }

  // Search for open items
  async function handleSearch(e) {
    e.preventDefault();
    setSearchError("");
    setSearching(true);

    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);
      if (filters.location) params.set("location", filters.location);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.q) params.set("q", filters.q);

      const data = await api(`/search?${params.toString()}`);
      setResults(data.results || []);
      setResultTab(filters.type === "lost" ? "lost" : filters.type === "found" ? "found" : "all");
      setView("results");
    } catch (err) {
      setSearchError(err.error || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  // Claim a found item
  function startClaim(item) {
    setClaimTarget(item);
    setClaimMessage("");
    setClaimError("");
    setClaimSuccess(false);
    setView("claim");
  }

  async function submitClaim(e) {
    e.preventDefault();
    if (!claimMessage.trim()) return setClaimError("Please describe proof of ownership.");
    setClaimError("");
    setClaimLoading(true);

    try {
      await api("/respond", {
        method: "POST",
        body: { postId: claimTarget.id, message: claimMessage.trim() },
      });
      setClaimSuccess(true);
    } catch (err) {
      setClaimError(err.error || "Failed to submit claim.");
    } finally {
      setClaimLoading(false);
    }
  }

  // Respond to a lost request ("I found this")
  function startRespond(item) {
    setRespondTarget(item);
    setRespondMessage("");
    setRespondError("");
    setRespondSuccess(false);
    setView("respond");
  }

  async function submitRespond(e) {
    e.preventDefault();
    if (!respondMessage.trim()) return setRespondError("Please provide details.");
    setRespondError("");
    setRespondLoading(true);

    try {
      await api("/respond", {
        method: "POST",
        body: { postId: respondTarget.id, message: respondMessage.trim() },
      });
      setRespondSuccess(true);
      setResults(prev =>
        prev.map(item =>
          item.id === respondTarget.id
            ? {
                ...item,
                hasResponded: true,
                myResponseStatus: "pending",
                status: "pending",
                pendingCount: (item.pendingCount || 0) + 1,
              }
            : item
        )
      );
    } catch (err) {
      setRespondError(err.error || "Failed to submit response.");
    } finally {
      setRespondLoading(false);
    }
  }

  // Post a lost request
  async function handlePost(formData) {
    setPostError("");
    setPostLoading(true);

    try {
      const body = {
        category: formData.category,
        description: formData.description,
        location: formData.location || undefined,
        date: formData.date || undefined,
      };

      if (formData.photo) {
        body.wantsPhoto = true;
        body.photoContentType = formData.photo.type;
      }

      const data = await api("/lost", { method: "POST", body });

      if (formData.photo) {
        await uploadFile(data.upload, formData.photo);
      }

      setPostSuccess(true);
    } catch (err) {
      setPostError(err.error || "Failed to post.");
    } finally {
      setPostLoading(false);
    }
  }

  // Filter results by sub-tab
  const displayedResults = results.filter(item => {
    if (resultTab === "found") return item.type === "found";
    if (resultTab === "lost") return item.type === "lost";
    return true;
  });
  const foundCount = results.filter(r => r.type === "found").length;
  const lostCount = results.filter(r => r.type === "lost").length;

  // ── Search form ──
  if (view === "search") {
    return (
      <div className="page">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-brand-600 hover:text-brand-700 text-sm font-medium mb-4 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
          id="btn-back-home"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-100 mb-3">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-700">Lost</span>
          </div>
          <h1 className="heading">I lost something</h1>
          <p className="text-surface-700 mt-2">
            Search existing posts first to see if someone already found your item or reported it.
          </p>
        </div>

        <div className="card max-w-2xl mx-auto">
          {searchError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium ring-1 ring-red-200">
              {searchError}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search-type" className="label">Search in</label>
                <select id="search-type" className="input" value={filters.type} onChange={updateFilter("type")}>
                  <option value="all">All items (Found & Lost)</option>
                  <option value="found">Found items only (Check if someone found it)</option>
                  <option value="lost">Lost requests only (Check existing lost posts)</option>
                </select>
              </div>

              <div>
                <label htmlFor="search-category" className="label">Category</label>
                <select id="search-category" className="input" value={filters.category} onChange={updateFilter("category")}>
                  <option value="">All categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search-keyword" className="label">
                  Keyword / Description <span className="text-surface-700/40 font-normal">(optional)</span>
                </label>
                <input
                  id="search-keyword"
                  className="input"
                  placeholder="e.g. blue bottle, metal flask"
                  value={filters.q}
                  onChange={updateFilter("q")}
                />
              </div>

              <div>
                <label htmlFor="search-location" className="label">
                  Location <span className="text-surface-700/40 font-normal">(optional)</span>
                </label>
                <input
                  id="search-location"
                  className="input"
                  placeholder="e.g. Library, Parking"
                  value={filters.location}
                  onChange={updateFilter("location")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search-from" className="label">From date</label>
                <input id="search-from" type="date" className="input" value={filters.from} onChange={updateFilter("from")} />
              </div>
              <div>
                <label htmlFor="search-to" className="label">To date</label>
                <input id="search-to" type="date" className="input" value={filters.to} onChange={updateFilter("to")} />
              </div>
            </div>

            <button type="submit" disabled={searching} className="btn-primary w-full" id="btn-search-lost">
              {searching ? "Searching…" : "Search posts"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Search results ──
  if (view === "results") {
    return (
      <div className="page">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="heading">Search Results</h1>
            <p className="text-sm text-surface-600 mt-1">
              Found {results.length} post{results.length !== 1 ? "s" : ""} matching your search.
            </p>
          </div>
          <button onClick={() => setView("search")} className="btn-secondary text-sm px-4 py-2">
            ← Modify search
          </button>
        </div>

        {/* Sub-tabs to filter by type */}
        {results.length > 0 && (
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setResultTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${resultTab === "all" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
            >
              All ({results.length})
            </button>
            <button
              type="button"
              onClick={() => setResultTab("found")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${resultTab === "found" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                }`}
            >
              Found Items ({foundCount})
            </button>
            <button
              type="button"
              onClick={() => setResultTab("lost")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${resultTab === "lost" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200"
                }`}
            >
              Lost Requests ({lostCount})
            </button>
          </div>
        )}

        {displayedResults.length === 0 ? (
          <div className="card text-center py-12">
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-brand-300" />
            <p className="text-surface-700 font-medium mb-1">
              {results.length === 0 ? "No matching items found." : `No items in "${resultTab === "found" ? "Found items" : "Lost requests"}".`}
            </p>
            <p className="text-surface-500 text-sm mb-6">
              Didn't find what you're looking for? You can post a lost request below so anyone who finds it can reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setView("search")} className="btn-secondary">
                Modify search
              </button>
              <button
                onClick={() => { setPostSuccess(false); setPostError(""); setView("post"); }}
                className="btn-primary"
                id="btn-post-lost"
              >
                Post a lost request
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {displayedResults.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  actionLabel={item.type === "found" ? "Claim" : "I found this"}
                  onAction={item.type === "found" ? startClaim : startRespond}
                />
              ))}
            </div>

            <div className="text-center pt-6 mt-6 border-t border-surface-200">
              <p className="text-surface-700 text-sm mb-3">Still don't see your item listed?</p>
              <button
                onClick={() => { setPostSuccess(false); setPostError(""); setView("post"); }}
                className="btn-secondary"
                id="btn-post-lost-alt"
              >
                Post a lost request
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Claim form (on found items) ──
  if (view === "claim") {
    if (claimSuccess) {
      return (
        <div className="page">
          <div className="card max-w-lg mx-auto text-center py-10">
            <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Claim submitted!</h2>
            <p className="text-surface-700 mb-6">The finder will review your proof and get back to you.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => navigate("/")} className="btn-secondary">Back to Dashboard</button>
              <button onClick={() => setView("results")} className="btn-primary">Back to results</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page">
        <button onClick={() => setView("results")} className="text-brand-600 text-sm font-medium hover:text-brand-700 mb-4 inline-flex items-center gap-1">
          ← Back to results
        </button>

        <div className="card max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-surface-900 mb-1">Claim this item</h2>
          <div className="mb-4 p-3 rounded-xl bg-surface-50 text-sm text-surface-700">
            <strong>{claimTarget?.category}</strong>: {claimTarget?.description || "No description"}
          </div>

          {claimError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm ring-1 ring-red-200">
              {claimError}
            </div>
          )}

          <form onSubmit={submitClaim} className="space-y-4">
            <div>
              <label htmlFor="claim-proof" className="label">Proof of ownership *</label>
              <p className="text-xs text-surface-700/60 mb-1.5">
                Describe something specific about the item that is not visible in the post.
              </p>
              <textarea
                id="claim-proof"
                className="input min-h-[100px] resize-y"
                placeholder="e.g. There's a cat sticker on the bottom, scratch on the side…"
                value={claimMessage}
                onChange={e => setClaimMessage(e.target.value)}
                maxLength={1000}
                required
              />
            </div>

            <button type="submit" disabled={claimLoading} className="btn-primary w-full" id="btn-submit-claim">
              {claimLoading ? "Submitting…" : "Submit claim"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Respond form ("I found this" on lost requests) ──
  if (view === "respond") {
    if (respondSuccess) {
      return (
        <div className="page">
          <div className="card max-w-lg mx-auto text-center py-10">
            <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Response submitted!</h2>
            <p className="text-surface-700 mb-6">The person who lost this item will review your response.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => navigate("/")} className="btn-secondary">Back to Dashboard</button>
              <button onClick={() => setView("results")} className="btn-primary">Back to results</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page">
        <button onClick={() => setView("results")} className="text-brand-600 text-sm font-medium hover:text-brand-700 mb-4 inline-flex items-center gap-1">
          ← Back to results
        </button>

        <div className="card max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-surface-900 mb-1">I found this item</h2>
          <div className="mb-4 p-3 rounded-xl bg-surface-50 text-sm text-surface-700">
            <strong>{respondTarget?.category}</strong>: {respondTarget?.description || "No description"}
          </div>

          {respondError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm ring-1 ring-red-200">
              {respondError}
            </div>
          )}

          <form onSubmit={submitRespond} className="space-y-4">
            <div>
              <label htmlFor="respond-msg" className="label">Details *</label>
              <p className="text-xs text-surface-700/60 mb-1.5">
                Tell them where the item is being kept and how to reach you.
              </p>
              <textarea
                id="respond-msg"
                className="input min-h-[100px] resize-y"
                placeholder="e.g. Found near the cafeteria, I've kept it at the front desk…"
                value={respondMessage}
                onChange={e => setRespondMessage(e.target.value)}
                maxLength={1000}
                required
              />
            </div>

            <button type="submit" disabled={respondLoading} className="btn-primary w-full" id="btn-submit-respond">
              {respondLoading ? "Submitting…" : "Submit response"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Post lost request ──
  if (view === "post") {
    if (postSuccess) {
      return (
        <div className="page">
          <div className="card max-w-lg mx-auto text-center py-10">
            <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-brand-300" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Lost request posted!</h2>
            <p className="text-surface-700 mb-6">If someone finds your item, they'll be able to respond.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => navigate("/")} className="btn-primary" id="btn-back-dashboard">
                Back to Dashboard
              </button>
              <button onClick={() => navigate("/profile")} className="btn-secondary" id="btn-my-profile">
                My profile
              </button>
              <button onClick={() => setView("search")} className="btn-secondary" id="btn-search-again">
                Search again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page">
        <button onClick={() => setView("results")} className="text-brand-600 text-sm font-medium hover:text-brand-700 mb-4 inline-flex items-center gap-1">
          ← Back to results
        </button>

        <div className="card max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-surface-900 mb-4">Post a lost request</h2>
          {postError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm ring-1 ring-red-200">
              {postError}
            </div>
          )}
          <PostForm type="lost" onSubmit={handlePost} loading={postLoading} />
        </div>
      </div>
    );
  }

  return null;
}
