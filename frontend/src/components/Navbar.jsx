// Navbar.jsx — Top navigation bar.
// Shows Login/Sign up when logged out; Profile (with user initials avatar) and Logout when logged in.

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

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <nav className="sticky top-0 z-50 bg-surface-50/95 backdrop-blur border-b border-surface-200 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-900/15 group-hover:bg-brand-800 transition-colors">
            <span className="text-sm font-semibold tracking-tight font-sans">L/F</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-semibold tracking-tight text-surface-900 group-hover:text-brand-700 transition-colors">
              Lost & Found
            </span>
            <span className="text-[11px] text-surface-500 -mt-1 hidden sm:block">
              Campus exchange
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loggedIn ? (
            <>
              {/* Profile link */}
              <Link
                to="/profile"
                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive("/profile")
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200/80 shadow-xs"
                    : "text-surface-700 hover:bg-surface-100/80 hover:text-surface-900"
                }`}
                id="nav-profile"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                  {initial}
                </div>
                <span className="hidden sm:inline">{user?.name || "Profile"}</span>
                <span className="sm:hidden">Profile</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-surface-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
                id="nav-logout"
                title="Log out of your account"
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
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive("/login")
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200/80"
                    : "text-surface-700 hover:bg-surface-100/80 hover:text-surface-900"
                }`}
                id="nav-login"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn-primary text-xs sm:text-sm py-2 px-3.5 sm:px-4 shadow-sm"
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
