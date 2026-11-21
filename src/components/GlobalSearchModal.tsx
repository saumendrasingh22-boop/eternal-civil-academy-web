"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, GraduationCap, Newspaper, BookOpen, Bell } from "lucide-react";
import { STRUCTURED_CURRENT_AFFAIRS, PREMIUM_BOOK_COVERS, STATES_LIST } from "@/lib/siteData";
import { loadBatches } from "@/lib/batchesStore";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import { STUDENT_HUB_TOOLS } from "@/lib/studentHubCatalog";

export default function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const batches = loadBatches()
      .filter((b) => `${b.title} ${b.examTag} ${b.batchType}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((b) => ({
        type: "Batch",
        title: b.title,
        subtitle: `${b.examTag} • ${b.isPaid ? `₹${b.priceInr}` : "FREE"}`,
        href: `/batches/${b.slug}`,
      }));

    const ca = STRUCTURED_CURRENT_AFFAIRS.filter((a) =>
      `${a.title} ${a.examRelevance} ${a.stateName || ""} ${a.whyInNews}`.toLowerCase().includes(q)
    )
      .slice(0, 4)
      .map((a) => ({
        type: "Current Affairs",
        title: a.title,
        subtitle: `${a.examRelevance} • ${a.date}`,
        href: `/current-affairs/${a.slug}`,
      }));

    const books = PREMIUM_BOOK_COVERS.filter((bk) =>
      `${bk.title} ${bk.subject}`.toLowerCase().includes(q)
    )
      .slice(0, 4)
      .map((bk) => ({
        type: "Material",
        title: bk.title,
        subtitle: `${bk.subject} • ${bk.isPaid ? `₹${bk.priceInr}` : "FREE"}`,
        href: "/material",
      }));

    const notifs = loadNoCodeCms()
      .notifications.filter((n) => `${n.title} ${n.commission}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map((n) => ({
        type: "Notification",
        title: n.title,
        subtitle: `${n.commission} • ${n.date}`,
        href: "/notifications",
      }));

    const tools = STUDENT_HUB_TOOLS.filter((t) =>
      `${t.title} ${t.description} ${t.badge} ${t.keywords.join(" ")}`.toLowerCase().includes(q)
    ).slice(0, 6).map((t) => ({
      type: "Student Tool",
      title: t.title,
      subtitle: `${t.category} • ${t.badge}`,
      href: `/student-hub/${t.slug}`,
    }));
    const statePages = STATES_LIST.filter((st) =>
      `${st} state special current affairs gk`.toLowerCase().includes(q)
    ).map((st) => ({
      type: "State Special",
      title: `${st} Special Current Affairs & State GS`,
      subtitle: "Bilingual (English & हिन्दी)",
      href: `/state-special/${st.toLowerCase().replace(/\s+/g, "-")}`,
    }));
    return [...tools, ...statePages, ...batches, ...ca, ...books, ...notifs];
  }, [query, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
        aria-label="Search Website"
        title="Search Batches, Current Affairs, Notes..."
      >
        <Search className="w-3.5 h-3.5 text-yellow-400" />
        <span className="hidden xl:inline">Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-200">
              <Search className="w-4 h-4 text-[#E60000] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search Batches, Current Affairs, Polity, UPPSC, Notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm text-slate-900 focus:outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {!query.trim() ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Type keywords like <strong>UPSC</strong>, <strong>UPPSC</strong>,{" "}
                  <strong>Polity</strong>, <strong>Green Hydrogen</strong>, or <strong>NCERT</strong>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No matching items found for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {results.map((r, idx) => (
                    <Link
                      key={idx}
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
                    >
                      <div className="mt-0.5 text-[#E60000] shrink-0">
                        {r.type === "Batch" ? (
                          <GraduationCap className="w-4 h-4" />
                        ) : r.type === "Current Affairs" ? (
                          <Newspaper className="w-4 h-4" />
                        ) : r.type === "Material" ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase text-[#E60000]">
                          {r.type}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#0B1B3D] truncate">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{r.subtitle}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
