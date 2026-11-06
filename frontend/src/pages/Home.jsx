// Home.jsx — Public landing page.
// Shows project name, how it works, two primary flows, and optional public stats.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../api";

const STEPS = [
  {
    number: "01",
    title: "Search the board",
    desc: "Start with recent lost requests and found listings before posting something new.",
  },
  {
    number: "02",
    title: "Share what only you know",
    desc: "Use a hidden detail to prove ownership without exposing sensitive information publicly.",
  },
  {
    number: "03",
    title: "Make the handoff",
    desc: "Once a match is accepted, contact details are shared so the item can get home.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/stats`)
      .then(response => response.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  function handleClick(flow) {
    navigate(isLoggedIn() ? `/${flow}` : `/login?next=${flow}`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <main>
        <section className="border-b border-surface-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-sm font-medium text-brand-700 mb-6">
                  A better way to return what matters
                </p>
                <h1 className="max-w-xl text-5xl sm:text-6xl font-medium leading-[1.02] tracking-[-0.04em] text-surface-900">
                  The campus board for things that went missing.
                </h1>
                <p className="max-w-lg mt-6 text-lg leading-8 text-surface-600">
                  Lost a daily essential or found something someone is looking for? Search the board, share a careful description, and make the right connection.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-9">
                  <button
                    onClick={() => handleClick("lost")}
                    className="btn-primary min-h-12"
                    id="btn-lost"
                  >
                    I lost something
                    <span aria-hidden="true">→</span>
                  </button>
                  <button
                    onClick={() => handleClick("found")}
                    className="btn-secondary min-h-12"
                    id="btn-found"
                  >
                    I found something
                  </button>
                </div>

                {stats && stats.itemsReturned > 0 && (
                  <p className="mt-6 text-sm text-surface-500">
                    <span className="font-semibold text-brand-700">{stats.itemsReturned}</span> items have found their way back on campus
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute -inset-4 border border-brand-200/70 rounded-2xl -rotate-2" aria-hidden="true" />
                <div className="relative bg-brand-900 rounded-xl p-5 sm:p-7 shadow-lg shadow-brand-900/15">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <span className="text-sm font-medium text-white">Campus board</span>
                    <span className="text-xs text-brand-200">Today</span>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-surface-900">Blue water bottle</span>
                        <span className="text-xs text-emerald-700">Found</span>
                      </div>
                      <p className="mt-2 text-xs text-surface-500">Library · 11:40 am</p>
                    </div>
                    <div className="bg-brand-800 border border-brand-700 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white">Black card holder</span>
                        <span className="text-xs text-amber-200">Lost</span>
                      </div>
                      <p className="mt-2 text-xs text-brand-200">Student centre · Yesterday</p>
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-lg p-4">
                      <p className="text-xs text-brand-200">Private proof stays private</p>
                      <p className="mt-1 text-sm text-white">The right person can describe the detail no one else sees.</p>
                    </div>
                  </div>
                </div>
                <p className="relative text-xs text-surface-500 mt-4 text-center">
                  Search first. Share carefully. Return it safely.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="max-w-xl mb-10">
            <p className="text-sm font-medium text-brand-700 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-[-0.03em] text-surface-900">
              A simple handoff, with the right safeguards.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-surface-200 border border-surface-200 rounded-xl overflow-hidden">
            {STEPS.map(step => (
              <article key={step.number} className="bg-white p-6 sm:p-8">
                <span className="text-sm font-medium text-brand-700">{step.number}</span>
                <h3 className="mt-12 text-lg font-medium text-surface-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-surface-600">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {stats && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            <div className="grid grid-cols-3 border-y border-surface-200">
              {[
                { label: "Total cases", value: stats.totalPosts },
                { label: "Active listings", value: stats.openPosts },
                { label: "Returned", value: stats.itemsReturned },
              ].map(stat => (
                <div key={stat.label} className="py-6 first:pl-0 px-4 sm:px-8 border-l first:border-l-0 border-surface-200">
                  <div className="text-3xl sm:text-4xl font-medium tracking-[-0.03em] text-surface-900">{stat.value}</div>
                  <div className="mt-1 text-sm text-surface-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-surface-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-surface-500">
          <p>Campus Lost & Found</p>
          <div className="flex items-center gap-5">
            <a href="#/lost" className="hover:text-brand-700 transition-colors">Search lost</a>
            <a href="#/found" className="hover:text-brand-700 transition-colors">Search found</a>
            <a href="#/admin" className="hover:text-brand-700 transition-colors">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
