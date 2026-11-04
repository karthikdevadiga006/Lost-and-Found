// Register.jsx — Registration page.
// Fields: name, email, password, optional phone.
// On success, stores the token and user, then redirects to the ?next= flow.

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setToken, setUser } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.password) return setError("Password is required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      if (form.phone.trim()) body.phone = form.phone.trim();

      const data = await api("/register", {
        method: "POST",
        body,
      });
      setToken(data.token);
      setUser(data.user);
      navigate(next ? `/${next}` : "/", { replace: true });
    } catch (err) {
      setError(err.error || "Registration failed. Please try again.");
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
            <span className="text-sm font-bold uppercase tracking-widest text-brand-700">Join</span>
          </div>
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Create account</h1>
          <p className="text-surface-700">
            Join the campus Lost & Found community
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          {next && (
            <div className="mb-5 p-3 rounded-xl bg-brand-50 text-brand-700 text-sm font-medium text-center ring-1 ring-brand-200">
              {next === "lost"
                ? "Sign up to report or search for a lost item"
                : "Sign up to post or search for a found item"}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 text-status-rejected text-sm font-medium ring-1 ring-red-200" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="label">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={update("name")}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@college.edu"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={update("password")}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="mt-1 text-xs text-surface-700/60">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="reg-phone" className="label">
                Phone <span className="text-surface-700/40 font-normal">(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={update("phone")}
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              id="btn-register-submit"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-700">
            Already have an account?{" "}
            <Link
              to={next ? `/login?next=${next}` : "/login"}
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
              id="link-to-login"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
