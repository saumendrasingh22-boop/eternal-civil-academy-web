"use client";

import React, { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

const BOOKMARKS_KEY = "eca_saved_bookmarks_v1";

export interface SavedBookmarkItem {
  slug: string;
  title: string;
  examRelevance: string;
  date: string;
}

export function loadBookmarks(): SavedBookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function BookmarkButton({ item }: { item: SavedBookmarkItem }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = loadBookmarks();
    setSaved(list.some((b) => b.slug === item.slug));
  }, [item.slug]);

  const toggle = () => {
    const list = loadBookmarks();
    const exists = list.some((b) => b.slug === item.slug);
    const next = exists ? list.filter((b) => b.slug !== item.slug) : [item, ...list];
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    setSaved(!exists);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
        saved
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-white border-slate-200 text-slate-700 hover:border-[#0B1B3D]"
      }`}
    >
      <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-500 text-amber-600" : ""}`} />
      <span>{saved ? "Saved for Revision" : "Bookmark"}</span>
    </button>
  );
}
