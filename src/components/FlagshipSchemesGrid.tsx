"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Landmark, Star } from "lucide-react";
import { FLAGSHIP_SCHEMES_10 } from "@/lib/flagshipSchemesData";

export default function FlagshipSchemesGrid({ lang }: { lang: "en" | "hi" }) {
  const [openId, setOpenId] = useState<string>(FLAGSHIP_SCHEMES_10[0].id);
  const isHi = lang === "hi";

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isHi ? "20 प्रमुख केंद्रीय योजनाएं (PIB सत्यापित)" : "20 Flagship Central Schemes (PIB Verified)"}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">
            {isHi ? "UPSC / UPPSC / BPSC के लिए विस्तृत सरकारी योजनाएं" : "Comprehensive Government Schemes for Prelims & Mains"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {FLAGSHIP_SCHEMES_10.map((s, idx) => {
          const isOpen = openId === s.id;
          const provisions = isHi ? s.keyProvisionsHi : s.keyProvisionsEn;
          const facts = isHi ? s.prelimsFactsHi : s.prelimsFactsEn;
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : s.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="bg-[#0B1B3D] text-white font-extrabold px-2.5 py-0.5 rounded-md">
                      #{idx + 1} &bull; {s.category}
                    </span>
                    <span className="bg-red-50 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded-md">
                      {isHi ? "शुभारंभ:" : "Launched:"} {s.launched}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
                      <Landmark className="w-3.5 h-3.5 text-[#0B1B3D]" />
                      {isHi ? s.ministryHi : s.ministryEn}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">
                    {isHi ? s.titleHi : s.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isHi ? s.summaryHi : s.summaryEn}
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-slate-100 text-[#0B1B3D] shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1B3D] mb-2">
                        {isHi ? "मुख्य प्रावधान एवं लाभ" : "Key Provisions & Benefits"}
                      </h4>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc pl-4">
                        {provisions.map((p, pi) => (
                          <li key={pi}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#E60000] mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> {isHi ? "प्रीलिम्स विशेष तथ्य" : "Prelims Key Facts"}
                      </h4>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-800 list-disc pl-4">
                        {facts.map((f, fi) => (
                          <li key={fi}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#0B1B3D] text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm leading-relaxed">
                      <span className="font-extrabold text-yellow-300 uppercase mr-1.5">
                        {isHi ? "मुख्य परीक्षा दृष्टिकोण:" : "Mains Relevance:"}
                      </span>
                      {isHi ? s.mainsAngleHi : s.mainsAngleEn}
                    </div>
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-lg shrink-0 transition"
                    >
                      PIB Source <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
