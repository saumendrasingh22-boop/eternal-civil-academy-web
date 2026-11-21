"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ArrowLeft } from "lucide-react";
import { loadBookmarks, SavedBookmarkItem } from "@/components/BookmarkButton";

export default function BookmarksPage() {
  const [items, setItems] = useState<SavedBookmarkItem[]>([]);

  useEffect(() => {
    setItems(loadBookmarks());
  }, []);

  const removeItem = (slug: string) => {
    const next = items.filter((i) => i.slug !== slug);
    window.localStorage.setItem("eca_saved_bookmarks_v1", JSON.stringify(next));
    setItems(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] flex items-center gap-2 mb-6">
        <Bookmark className="w-6 h-6 text-[#E60000]" /> Saved Revision Bookmarks
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-bold text-slate-600">
            No articles bookmarked yet. Click &ldquo;Bookmark&rdquo; on any Current Affairs article to save it here for quick revision.
          </p>
          <Link
            href="/current-affairs"
            className="inline-block mt-4 bg-[#E60000] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
          >
            Browse Daily Current Affairs →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.slug}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="bg-red-50 text-[#E60000] font-extrabold px-2 py-0.5 rounded">
                    {item.examRelevance}
                  </span>
                  <span className="text-slate-400 font-semibold">{item.date}</span>
                </div>
                <Link
                  href={`/current-affairs/${item.slug}`}
                  className="text-sm sm:text-base font-extrabold text-[#0B1B3D] hover:text-[#E60000] mt-1 block"
                >
                  {item.title}
                </Link>
              </div>
              <button
                onClick={() => removeItem(item.slug)}
                className="p-2 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"
                title="Remove Bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
