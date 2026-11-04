// Navbar.jsx — Top navigation bar.
// Shows Login/Sign up when logged out; Profile (with pending badge) and Logout when logged in.

import { Link, useNavigate, useLocation } from "react-router-dom";
import { isLoggedIn, clearToken, getUser } from "../api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const user = getUser();

  function handleLogout() {
    clearToken();
    navigate("/");
  }

  // Helper to check if a path is currently active
  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-surface-200/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-brand-600 font-extrabold text-xl hover:text-brand-700 transition-colors"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold tracking-tight text-white">L&F</span>
          <span className="hidden sm:inline">Lost & Found</span>
          <span className="sm:hidden">L&F</span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loggedIn ? (
            <>
              {/* Profile link */}
              <Link
                to="/profile"
                className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive("/profile")
                    ? "bg-brand-100 text-brand-700"
                    : "text-surface-700 hover:bg-surface-100"
                }`}
                id="nav-profile"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="hidden sm:inline">{user?.name || "Profile"}</span>
                <span className="sm:hidden">Profile</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-surface-700 hover:bg-red-50 hover:text-status-rejected transition-all duration-150 cursor-pointer"
                id="nav-logout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive("/login")
                    ? "bg-brand-100 text-brand-700"
                    : "text-surface-700 hover:bg-surface-100"
                }`}
                id="nav-login"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 transition-all duration-150"
                id="nav-register"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
