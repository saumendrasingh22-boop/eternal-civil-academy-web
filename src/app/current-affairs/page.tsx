"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { BilingualCurrentAffairItem, getLocalizedCa } from "@/lib/bilingualCaMap";
import DualPdfButton from "@/components/DualPdfButton";
import { Star, Languages, FileText } from "lucide-react";

export default function CurrentAffairsPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [gsFilter, setGsFilter] = useState("ALL");
  const [allArticles, setAllArticles] = useState<BilingualCurrentAffairItem[]>(
    STRUCTURED_CURRENT_AFFAIRS
  );

  useEffect(() => {
    fetch("/api/current-affairs")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.articles) && d.articles.length > 0) {
          setAllArticles(d.articles);
        }
      })
      .catch(() => {});
  }, []);

  const articles = allArticles.filter((item) =>
    gsFilter === "ALL" ? true : item.examRelevance === gsFilter
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Row 1: Heading + Language Filter (English / Hindi) + Essay Material Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Daily Current Affairs
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Top Language Filter */}
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-extrabold">
            <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Dedicated Essay Material Shortcut -> Material Section */}
          <Link
            href="/material?tab=essay-material"
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold px-3.5 py-2 rounded-xl transition"
          >
            <FileText className="w-3.5 h-3.5 text-[#E60000]" />
            <span>Essay Material</span>
          </Link>
        </div>
      </div>

      {/* Row 2: GS-1, GS-2, GS-3, GS-4, State Special Filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {["ALL", "GS-1", "GS-2", "GS-3", "GS-4", "State Special"].map((tag) => (
          <button
            key={tag}
            onClick={() => setGsFilter(tag)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              gsFilter === tag
                ? "bg-[#E60000] text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {articles.map((item) => {
          const loc = getLocalizedCa(item, lang);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-red-50 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded">
                    Exam Relevance: {item.examRelevance}
                  </span>
                  {item.stateName && (
                    <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      {item.stateName}
                    </span>
                  )}
                  <span className="text-slate-400 font-semibold">{item.date}</span>
                </div>
                <DualPdfButton
                  title={loc.title}
                  englishUrl={item.englishPdfUrl}
                  hindiUrl={item.hindiPdfUrl}
                  compact
                />
              </div>

              <Link href={`/current-affairs/${item.slug}`}>
                <h2 className="text-lg sm:text-xl font-bold text-[#0B1B3D] hover:text-[#E60000] transition">
                  {loc.title}
                </h2>
              </Link>

              <div className="mt-3 bg-slate-50 border-l-4 border-[#0B1B3D] p-3.5 rounded-r-xl">
                <div className="text-xs font-extrabold text-[#0B1B3D] uppercase">
                  {lang === "hi" ? "खबरों में क्यों है (Why in News)" : "Why in News"}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-1">{loc.whyInNews}</p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {loc.prelimsFacts.length} Prelims Facts
                </span>
                <Link
                  href={`/current-affairs/${item.slug}`}
                  className="text-xs font-extrabold text-[#E60000] hover:underline"
                >
                  {lang === "hi" ? "पूरी व्याख्या पढ़ें →" : "Full Structured Analysis →"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
