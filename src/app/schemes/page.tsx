"use client";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";
import FlagshipSchemesGrid from "@/components/FlagshipSchemesGrid";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { STATES_LIST, STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { getLocalizedCa } from "@/lib/bilingualCaMap";
import RichText from "@/components/RichText";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import DualPdfButton from "@/components/DualPdfButton";
import { Languages } from "lucide-react";

export default function SchemesPage() {
  const [scope, setScope] = useState<"central" | "state">("central");
  const [lang, setLang] = useState<"en" | "hi">("hi");
  const [statesList, setStatesList] = useState<string[]>(STATES_LIST);
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");

  useEffect(() => {
    const sync = () => {
      const list = loadNoCodeCms().states;
      if (list.length > 0) setStatesList(list);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const schemeItems = STRUCTURED_CURRENT_AFFAIRS.filter((item) =>
    scope === "central"
      ? false
      : item.sectionType === "state_scheme" && item.stateName === selectedState
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Schemes
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-extrabold">
            <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-700"
              }`}
            >
              हिन्दी
            </button>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setScope("central")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                scope === "central" ? "bg-[#0B1B3D] text-white" : "text-slate-700"
              }`}
            >
              Central Schemes
            </button>
            <button
              onClick={() => setScope("state")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                scope === "state" ? "bg-[#E60000] text-white" : "text-slate-700"
              }`}
            >
              State Schemes
            </button>
          </div>
        </div>
      </div>

      {scope === "state" && (
        <div className="flex flex-wrap gap-2 mb-6">
          {statesList.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
                selectedState === st
                  ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {scope !== 'state' ? null : schemeItems.length > 0 ? (
          schemeItems.map((sc) => {
            const loc = getLocalizedCa(sc, lang);
            return (
              <div
                key={sc.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-red-50 text-[#E60000] text-xs font-extrabold px-2.5 py-0.5 rounded">
                    {sc.stateName || "Central"} • {sc.examRelevance}
                  </span>
                  <DualPdfButton article={sc} title={loc.title.replace(/\*\*/g, "")} compact />
                </div>
                <Link href={`/current-affairs/${sc.slug}?lang=${lang}`}>
                  <h2 className="text-lg font-extrabold text-[#0B1B3D] hover:text-[#E60000]">
                    <RichText text={loc.title} />
                  </h2>
                </Link>
                <p className="text-sm text-slate-700 mt-2"><RichText text={loc.whyInNews} boldClassName="font-bold text-[#0B1B3D]" /></p>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-[#E60000]">
                {selectedState} • {lang === "hi" ? "हिन्दी" : "English"}
              </span>
              <h2 className="text-base font-extrabold text-[#0B1B3D]">
                {selectedState} Government Schemes Compilation
              </h2>
            </div>
            <DualPdfButton title={`${selectedState} Schemes`} compact />
          </div>
        )}
      </div>
          {scope === "central" && <FlagshipSchemesGrid lang={lang} />}
      <LiveAdminSectionFeed sectionMatch="Schemes" />
    </div>
  );
}
