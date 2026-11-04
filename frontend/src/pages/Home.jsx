// Home.jsx — Public landing page.
// Shows project name, "how it works", two large CTA buttons, and an
// optional "N items returned" counter from /stats.
// Clicking a button when logged out goes to #/login?next=lost or ?next=found.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../api";

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  // Fetch public stats on mount
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {}); // silent fail — stats are optional
  }, []);

  function handleClick(flow) {
    if (isLoggedIn()) {
      navigate(`/${flow}`);
    } else {
      navigate(`/login?next=${flow}`);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="hero-gradient">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          {/* Animated icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-100 mb-6">
            <span className="text-xl font-bold tracking-widest text-brand-700">L&F</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-surface-900 leading-tight mb-4">
            Campus{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Lost & Found
            </span>
          </h1>

          <p className="text-lg md:text-xl text-surface-700 max-w-2xl mx-auto mb-10 leading-relaxed">
            One searchable portal to reunite you with your stuff.
            Find it, claim it, prove it — simple.
          </p>

          {/* Stats counter */}
          {stats && stats.itemsReturned > 0 && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-10 ring-1 ring-emerald-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {stats.itemsReturned} item{stats.itemsReturned !== 1 ? "s" : ""} returned so far
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => handleClick("lost")}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-600 text-white font-bold text-lg px-8 py-4 hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-300/40 hover:shadow-xl hover:shadow-brand-400/40 transition-all duration-200 cursor-pointer"
              id="btn-lost"
            >
              <span className="text-xs font-bold uppercase tracking-widest">Lost</span>
              I lost something
            </button>

            <button
              onClick={() => handleClick("found")}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-brand-600 text-brand-600 font-bold text-lg px-8 py-4 hover:bg-brand-50 active:bg-brand-100 shadow-lg shadow-surface-200/40 hover:shadow-xl transition-all duration-200 cursor-pointer"
              id="btn-found"
            >
              <span className="text-xs font-bold uppercase tracking-widest">Found</span>
              I found something
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-surface-900 mb-12">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              index: "01",
              title: "Search first",
              desc: "Check if someone has already posted about the item you lost or found. No duplicate posts.",
            },
            {
              index: "02",
              title: "Post or claim",
              desc: "If there's no match, post a request or item listing. If there is, claim it with proof only you'd know.",
            },
            {
              index: "03",
              title: "Connect & return",
              desc: "The finder reviews claims, accepts the real owner, and contact details are released to both sides.",
            },
          ].map((step, i) => (
            <div key={i} className="card text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-50 text-sm font-bold tracking-widest text-brand-700 mb-4">
                {step.index}
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">{step.title}</h3>
              <p className="text-surface-700 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick stats */}
      {stats && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { label: "Total Posts", value: stats.totalPosts, icon: "Posts" },
              { label: "Open Now", value: stats.openPosts, icon: "Active" },
              { label: "Returned", value: stats.itemsReturned, icon: "Closed" },
            ].map((s, i) => (
              <div key={i} className="card text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1 block">{s.icon}</span>
                <div className="text-3xl font-extrabold text-brand-600">{s.value}</div>
                <div className="text-sm text-surface-700 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-surface-200 py-6 text-center text-sm text-surface-700">
        <p>
          Campus Lost & Found Portal — Cloud Computing Course Project
          <span className="mx-2 text-surface-300">·</span>
          <a href="#/admin" className="text-surface-400 hover:text-surface-600 transition-colors">
            Admin
          </a>
        </p>
      </footer>

      {/* Custom animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
