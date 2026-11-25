"use client";

import { useEffect, useState } from "react";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";

export default function MonthlyMagazinePage() {
  const [hasItems, setHasItems] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/cms-state?key=custom_content&_t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const arr = Array.isArray(d?.value) ? d.value : [];
        const matched = arr.some(
          (item: { section?: string }) =>
            typeof item?.section === "string" &&
            item.section.toLowerCase().includes("monthly magazine")
        );
        setHasItems(matched);
      })
      .catch(() => {
        if (active) setHasItems(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <span className="inline-block bg-red-50 text-[#E60000] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          Bilingual Monthly Compilation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-3">
          Monthly Current Affairs Magazine &amp; 300-MCQ Bank
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
          Every 1st of the month, our automated editorial pipeline publishes the complete
          English &amp; Hindi Monthly Current Affairs Magazine along with the 300 Objective
          Questions Bank right here for UPSC, UPPCS, BPSC, and State PCS preparation.
        </p>
      </div>

      <LiveAdminSectionFeed sectionMatch="Monthly Magazine" />

      {hasItems === false && (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-base font-bold text-[#0B1B3D]">
            New Monthly Editions Auto-Publish on the 1st of Every Month
          </p>
          <p className="text-sm text-slate-600 mt-1">
            The upcoming bilingual Monthly Magazine &amp; 300-MCQ PDFs will appear here automatically once published.
          </p>
        </div>
      )}
    </div>
  );
}
