"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Landmark, Star } from "lucide-react";
import { STATE_SCHEMES_DATA } from "@/lib/stateSchemesData";

export default function StateSchemesGrid({
  lang,
  selectedState,
}: {
  lang: "en" | "hi";
  selectedState: string;
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const isHi = lang === "hi";
  const filtered = STATE_SCHEMES_DATA.filter((s) => s.state === selectedState);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isHi
              ? `${selectedState} की ${filtered.length} प्रमुख योजनाएं (सत्यापित)`
              : `${filtered.length} Flagship ${selectedState} Schemes (Verified)`}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">
            {isHi
              ? `${selectedState} PCS / राज्य परीक्षाओं के लिए विस्तृत योजनाएं`
              : `Comprehensive ${selectedState} Schemes for Prelims & Mains`}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((s, idx) => {
          const isOpen = Boolean(openIds[s.id]);
          const provisions = isHi ? s.keyProvisionsHi : s.keyProvisionsEn;
          const facts = isHi ? s.prelimsFactsHi : s.prelimsFactsEn;
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIds((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
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
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-xs font-extrabold text-[#0B1B3D] uppercase tracking-wider mb-2">
                        {isHi ? "प्रमुख प्रावधान और लाभ" : "Key Provisions & Benefits"}
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {provisions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                        {isHi ? "प्रिलिम्स विशेष तथ्य (Prelims Facts)" : "Prelims Key Facts"}
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                        {facts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1B3D]/5 rounded-xl px-4 py-3 text-xs">
                    <div>
                      <span className="font-extrabold text-[#0B1B3D]">
                        {isHi ? "मेंस दृष्टिकोण (Mains Angle): " : "Mains Angle: "}
                      </span>
                      <span className="text-slate-700">{isHi ? s.mainsAngleHi : s.mainsAngleEn}</span>
                    </div>
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-[#E60000] hover:underline shrink-0"
                    >
                      {isHi ? "आधिकारिक स्रोत" : "Official Source"} <ExternalLink className="w-3.5 h-3.5" />
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
