// Login.jsx — Login page.
// Reads ?next= from the URL so after login the user goes to the chosen flow.
// On success, stores the token and user, then redirects.

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setToken, setUser } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next"); // e.g. "lost" or "found"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const data = await api("/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      setToken(data.token);
      setUser(data.user);
      // Redirect to the intended flow, or home
      navigate(next ? `/${next}` : "/", { replace: true });
    } catch (err) {
      setError(err.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 hero-gradient">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Welcome back</h1>
          <p className="text-surface-700">
            Log in to your Lost & Found account
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          {/* Next-flow banner */}
          {next && (
            <div className="mb-5 p-3 rounded-xl bg-brand-50 text-brand-700 text-sm font-medium text-center ring-1 ring-brand-200">
              {next === "lost"
                ? "Log in to report or search for a lost item"
                : "Log in to post or search for a found item"}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 text-status-rejected text-sm font-medium ring-1 ring-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              id="btn-login-submit"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Logging in…
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-surface-700">
            Don't have an account?{" "}
            <Link
              to={next ? `/register?next=${next}` : "/register"}
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
              id="link-to-register"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
