"use client";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";

import React, { useState, useEffect } from "react";
import DualPdfButton from "@/components/DualPdfButton";
import { STATES_LIST } from "@/lib/siteData";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import { Languages } from "lucide-react";

export default function MonthlyMagazinePage() {
  const [category, setCategory] = useState<"eca" | "state">("eca");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [statesList, setStatesList] = useState<string[]>(STATES_LIST);
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");

  useEffect(() => {
    const sync = () => {
      const dynamicStates = loadNoCodeCms().states;
      if (dynamicStates.length > 0) setStatesList(dynamicStates);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const ecaMagazines = [
    {
      month: "November 2026",
      titleEn: "ECA Monthly Current Affairs Magazine — November 2026",
      titleHi: "ECA मासिक करंट अफेयर्स मैगज़ीन — नवंबर 2026 (हिन्दी)",
      pages: "96 Pages • Includes 300 MCQs",
    },
    {
      month: "October 2026",
      titleEn: "ECA Monthly Current Affairs Magazine — October 2026",
      titleHi: "ECA मासिक करंट अफेयर्स मैगज़ीन — अक्टूबर 2026 (हिन्दी)",
      pages: "102 Pages • Includes 300 MCQs",
    },
    {
      month: "September 2026",
      titleEn: "ECA Monthly Current Affairs Magazine — September 2026",
      titleHi: "ECA मासिक करंट अफेयर्स मैगज़ीन — सितंबर 2026 (हिन्दी)",
      pages: "94 Pages • Includes 300 MCQs",
    },
  ];

  const stateMagazines = [
    {
      month: "November 2026",
      titleEn: `${selectedState} Special Current Affairs Magazine — November 2026`,
      titleHi: `${selectedState} स्पेशल करंट अफेयर्स मैगज़ीन — नवंबर 2026 (हिन्दी)`,
      pages: "68 Pages • State Schemes & MCQs",
    },
    {
      month: "October 2026",
      titleEn: `${selectedState} Special Current Affairs Magazine — October 2026`,
      titleHi: `${selectedState} स्पेशल करंट अफेयर्स मैगज़ीन — अक्टूबर 2026 (हिन्दी)`,
      pages: "72 Pages • State Schemes & MCQs",
    },
    {
      month: "September 2026",
      titleEn: `${selectedState} Special Current Affairs Magazine — September 2026`,
      titleHi: `${selectedState} स्पेशल करंट अफेयर्स मैगज़ीन — सितंबर 2026 (हिन्दी)`,
      pages: "64 Pages • State Schemes & MCQs",
    },
  ];

  const list = category === "eca" ? ecaMagazines : stateMagazines;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Monthly Magazine
        </h1>

        {/* Language Filter: English | Hindi */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-extrabold">
          <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
          <button
            onClick={() => setLang("en")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              lang === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Category Filter: ECA Monthly vs State Special Monthly */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setCategory("eca")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
            category === "eca"
              ? "bg-[#E60000] text-white border-[#E60000]"
              : "bg-white text-[#0B1B3D] border-slate-200 hover:border-slate-400"
          }`}
        >
          ECA Monthly Current Affairs Magazine
        </button>
        <button
          onClick={() => setCategory("state")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
            category === "state"
              ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
              : "bg-white text-[#0B1B3D] border-slate-200 hover:border-slate-400"
          }`}
        >
          State Special Current Affairs Magazine
        </button>
      </div>

      {/* State Sub-Filter when State Special Magazine is selected */}
      {category === "state" && (
        <div className="flex flex-wrap gap-2 mb-6">
          {statesList.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                selectedState === st
                  ? "bg-[#E60000] text-white border-[#E60000]"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {list.map((mag, idx) => {
          const title = lang === "hi" ? mag.titleHi : mag.titleEn;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-red-50 text-[#E60000] text-xs font-extrabold px-3 py-1 rounded-full">
                    {mag.month}
                  </span>
                  <span className="bg-slate-100 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    {lang === "hi" ? "Hindi" : "English"}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] mt-3 leading-snug">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">{mag.pages}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <DualPdfButton title={title} />
              </div>
            </div>
          );
        })}
      </div>
          <LiveAdminSectionFeed sectionMatch="Monthly Magazine" />
    </div>
  );
}
