// App.jsx — Root component with HashRouter and route guard.
// Public routes: Home, Login, Register.
// Protected routes redirect to /login?next=... when not logged in.
// The route guard is for convenience only — real protection is the token check in Lambda.

import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./api";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LostFlow from "./pages/LostFlow";
import FoundFlow from "./pages/FoundFlow";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

// --- Route guard ---
// Redirects to login if not authenticated, preserving the intended route in ?next=

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    // Extract the path without leading / for the next param
    const intended = location.pathname.slice(1) || "";
    return <Navigate to={`/login${intended ? `?next=${intended}` : ""}`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/lost"
          element={
            <ProtectedRoute>
              <LostFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/found"
          element={
            <ProtectedRoute>
              <FoundFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
