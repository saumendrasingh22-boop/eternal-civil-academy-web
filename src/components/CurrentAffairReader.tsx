"use client";

import React, { useState, useEffect } from "react";
import DualPdfButton from "@/components/DualPdfButton";
import { Star, Languages } from "lucide-react";
import { BilingualCurrentAffairItem, getLocalizedCa } from "@/lib/bilingualCaMap";
import RichText from "@/components/RichText";

export default function CurrentAffairReader({
  article,
}: {
  article: BilingualCurrentAffairItem;
}) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  useEffect(() => {
    try { const sl = new URLSearchParams(window.location.search).get("lang") || window.localStorage.getItem("eca_ca_lang"); if (sl === "hi" || sl === "en") setLang(sl); } catch {}
  }, []);
  const loc = getLocalizedCa(article, lang);
  const isHi = lang === "hi";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-[#E60000] text-white font-extrabold px-3 py-1 rounded">
            Exam Relevance: {article.examRelevance}
          </span>
          {article.stateName && (
            <span className="bg-indigo-50 text-indigo-800 font-bold px-2.5 py-1 rounded">
              {article.stateName}
            </span>
          )}
          <span className="text-slate-500 font-semibold">{article.date}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-extrabold">
            <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
            <button
              type="button"
              onClick={() => { setLang("en"); try { window.localStorage.setItem("eca_ca_lang", "en"); } catch {} }}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => { setLang("hi"); try { window.localStorage.setItem("eca_ca_lang", "hi"); } catch {} }}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-700"
              }`}
            >
              हिन्दी
            </button>
          </div>

          <DualPdfButton
            title={loc.title.replace(/\*\*/g, "")}
            englishUrl={article.englishPdfUrl}
            hindiUrl={article.hindiPdfUrl}
          />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-4 leading-snug">
        <RichText text={loc.title} />
      </h1>

      {/* Section 1: Why in News */}
      <section className="mt-6 bg-slate-50 border-l-4 border-[#E60000] p-4 rounded-r-xl">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#E60000]">
          {isHi ? "खबरों में क्यों है (Why in News)" : "Why in News"}
        </h2>
        <p className="text-sm sm:text-base text-slate-800 mt-1.5 leading-relaxed">
          <RichText text={loc.whyInNews} boldClassName="font-bold text-[#0B1B3D]" />
        </p>
      </section>

      {/* Section 2: Key Highlights / Detailed Explanation */}
      <section className="mt-6">
        <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] border-b border-slate-200 pb-2">
          {isHi ? "विस्तृत व्याख्या (Key Highlights)" : "Key Highlights"}
        </h2>
        <ul className="mt-3 space-y-3 text-sm sm:text-base text-slate-800 list-disc pl-5 leading-relaxed">
          {loc.keyHighlights.map((point, idx) => (
            <li key={idx}><RichText text={point} boldClassName="font-bold text-[#0B1B3D]" /></li>
          ))}
        </ul>
      </section>

      {/* Section 3: Prelims Facts */}
      <section className="mt-6 bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
        <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          {isHi ? "प्रीलिम्स के लिए महत्वपूर्ण तथ्य (Prelims Facts)" : "Prelims Facts"}
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm text-slate-900">
          {loc.prelimsFacts.map((fact, idx) => (
            <li key={idx} className="flex items-start gap-2 font-medium">
              <span className="text-[#E60000] font-extrabold shrink-0">★</span>
              <span><RichText text={fact} boldClassName="font-bold text-[#0B1B3D]" /></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Section 4: Mains Perspective */}
      <section className="mt-6 bg-[#0B1B3D] text-white rounded-2xl p-5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-yellow-300">
          {isHi ? "मुख्य परीक्षा दृष्टिकोण (Mains Perspective)" : "Mains Perspective"}
        </h2>
        <p className="text-sm mt-1.5 leading-relaxed text-slate-100">
          <RichText text={loc.mainsPerspective} boldClassName="font-bold text-yellow-200" />
        </p>
      </section>
    </div>
  );
}
