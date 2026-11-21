"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Bookmark } from "lucide-react";
import { loadBookmarks } from "@/components/BookmarkButton";
import { loadNoCodeCms, DEFAULT_EXAM_COUNTDOWNS, ExamCountdownItem } from "@/lib/noCodeCmsStore";

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function ExamCountdownBar() {
  const [savedCount, setSavedCount] = useState(0);
  const [countdowns, setCountdowns] = useState<ExamCountdownItem[]>(DEFAULT_EXAM_COUNTDOWNS);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setSavedCount(loadBookmarks().length);
    const sync = () => {
      const cms = loadNoCodeCms();
      setVisible(cms.homeSections.examCountdown !== false);
      setCountdowns(cms.examCountdowns.filter((c) => c.active));
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  if (!visible) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0B1B3D]">
            <CalendarClock className="w-4 h-4 text-[#E60000]" /> Exam Countdown:
          </span>
          {countdowns.map((cd, i) => (
            <span
              key={cd.id}
              className={`font-extrabold px-2.5 py-1 rounded-lg ${
                i % 2 === 0 ? "bg-red-50 text-[#E60000]" : "bg-blue-50 text-[#0B1B3D]"
              }`}
            >
              {cd.title}: {daysUntil(cd.examDate)} Days
            </span>
          ))}
        </div>

        <Link
          href="/bookmarks"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0B1B3D] hover:text-[#E60000] bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl transition"
        >
          <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
          <span>Saved Revision ({savedCount})</span>
        </Link>
      </div>
    </section>
  );
}
