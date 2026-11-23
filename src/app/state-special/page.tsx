"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { STATES_LIST, STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { BilingualCurrentAffairItem, getLocalizedCa } from "@/lib/bilingualCaMap";
import RichText from "@/components/RichText";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import DualPdfButton from "@/components/DualPdfButton";
import { Star, Languages } from "lucide-react";

export default function StateSpecialPage() {
  const [statesList, setStatesList] = useState<string[]>(STATES_LIST);
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [sectionTab, setSectionTab] = useState<"state_ca" | "state_gs">("state_ca");
  const [allArticles, setAllArticles] = useState<BilingualCurrentAffairItem[]>(
    STRUCTURED_CURRENT_AFFAIRS
  );

  useEffect(() => {
    const syncStates = () => {
      const dynamicStates = loadNoCodeCms().states;
      if (dynamicStates.length > 0) setStatesList(dynamicStates);
    };
    syncStates();
    window.addEventListener("eca-nocode-cms-updated", syncStates);
    return () => window.removeEventListener("eca-nocode-cms-updated", syncStates);
  }, []);

  useEffect(() => {
    fetch(`/api/current-affairs?state=${encodeURIComponent(selectedState)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.articles)) {
          setAllArticles(d.articles);
        }
      })
      .catch(() => {});
  }, [selectedState]);

  const stateNews = allArticles.filter((item) => item.stateName === selectedState);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header + Language Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          State Special Current Affairs
        </h1>

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
      </div>

      {/* State Selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {statesList.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedState(st)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
              selectedState === st
                ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Separate Tabs: State Current Affairs vs State GS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSectionTab("state_ca")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
            sectionTab === "state_ca"
              ? "bg-[#E60000] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          State Current Affairs
        </button>
        <button
          onClick={() => setSectionTab("state_gs")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
            sectionTab === "state_gs"
              ? "bg-[#E60000] text-white"
              : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          State GS
        </button>
      </div>

      {sectionTab === "state_ca" ? (
        <div className="space-y-4">
          {stateNews.length > 0 ? (
            stateNews.map((news) => {
              const loc = getLocalizedCa(news, lang);
              return (
                <div
                  key={news.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="bg-red-50 text-[#E60000] text-xs font-extrabold px-2.5 py-0.5 rounded">
                      {selectedState} • {news.date}
                    </span>
                    <DualPdfButton
                      title={loc.title.replace(/\*\*/g, "")}
                      englishUrl={news.englishPdfUrl}
                      hindiUrl={news.hindiPdfUrl}
                      compact
                    />
                  </div>
                  <Link href={`/current-affairs/${news.slug}?lang=${lang}`}>
                    <h2 className="text-lg font-extrabold text-[#0B1B3D] hover:text-[#E60000]">
                      <RichText text={loc.title} />
                    </h2>
                  </Link>
                  <div className="mt-2.5 bg-slate-50 border-l-4 border-[#0B1B3D] p-3 rounded-r-xl">
                    <div className="text-[11px] font-extrabold text-[#0B1B3D] uppercase">
                      {lang === "hi" ? "खबरों में क्यों है (Why in News)" : "Why in News"}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1"><RichText text={loc.whyInNews} boldClassName="font-bold text-[#0B1B3D]" /></p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      {loc.prelimsFacts.length} Prelims Facts
                    </span>
                    <Link
                      href={`/current-affairs/${news.slug}?lang=${lang}`}
                      className="text-xs font-extrabold text-[#E60000] hover:underline"
                    >
                      {lang === "hi" ? "पूरी व्याख्या पढ़ें →" : "Full Structured Analysis →"}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-[#E60000]">
                  {selectedState} • {lang === "hi" ? "हिन्दी माध्यम" : "English Medium"}
                </span>
                <h2 className="text-base font-extrabold text-[#0B1B3D] mt-1">
                  {selectedState} Daily & Monthly State Current Affairs Compilation
                </h2>
              </div>
              <DualPdfButton title={`${selectedState} State Current Affairs`} compact />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            `${selectedState} History, Art & Culture`,
            `${selectedState} Geography, Rivers & Minerals`,
            `${selectedState} Polity, Governance & Districts`,
            `${selectedState} Budget, Economy & Census`,
          ].map((topic, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-3 shadow-sm"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-500">
                  State GS • {lang === "hi" ? "हिन्दी" : "English"}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[#0B1B3D]">{topic}</h3>
              </div>
              <DualPdfButton title={topic} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
