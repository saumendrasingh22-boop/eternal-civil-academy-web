"use client";
import SmartQuizzesFeed from "@/components/SmartQuizzesFeed";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import { STUDENT_HUB_TOOLS } from "@/lib/studentHubCatalog";

export default function StudentHubPage() {
  const [cat, setCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const categories = [
    "ALL",
    "Exam Calculators & Predictors",
    "Smart Study & Revision",
    "Interactive Practice & Battle",
    "Career & Job Utilities",
  ];

  const filtered = STUDENT_HUB_TOOLS.filter((t) => {
    const matchCat = cat === "ALL" || t.category === cat;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      `${t.title} ${t.description} ${t.badge} ${t.keywords.join(" ")}`.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#08132B] via-[#0B1B3D] to-[#162F66] text-white rounded-2xl p-6 sm:p-8 mb-6 border-b-4 border-[#E60000] shadow">
        <span className="inline-flex items-center gap-1.5 bg-[#E60000] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase">
          <Sparkles className="w-3.5 h-3.5" /> 14 Free Student Facilities & Exam Tools
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
          Student Hub — Smart UPSC & State PCS Utilities
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl">
          Everything an aspirant needs in one organized place: Calculators, All India Rank Predictor, 1-3-7-15-30 Day Automatic Revision, OMR Generator & Checker, 1 vs 1 Quiz Battle, Score Card Maker & Daily Current Affairs Quiz.
        </p>

        <div className="mt-4 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find a tool (e.g. Cut-Off, OMR, Salary, Revision, Battle)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
              cat === c
                ? "bg-[#E60000] text-white border-[#E60000]"
                : "bg-white text-[#0B1B3D] border-slate-200 hover:border-slate-400"
            }`}
          >
            {c === "ALL" ? `All Tools (${STUDENT_HUB_TOOLS.length})` : c}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tool) => (
          <Link
            key={tool.slug}
            href={`/student-hub/${tool.slug}`}
            className="bg-white rounded-2xl border border-slate-200 hover:border-[#E60000]/50 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="bg-red-50 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded uppercase">
                  {tool.badge}
                </span>
                <span className="text-slate-400 font-bold">{tool.category.split(" ")[0]}</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] group-hover:text-[#E60000] mt-2.5 transition">
                {tool.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{tool.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#0B1B3D] group-hover:text-[#E60000]">
              <span>Open Free Tool</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    
      <SmartQuizzesFeed targetSection="student_hub" />
</div>
  );
}
