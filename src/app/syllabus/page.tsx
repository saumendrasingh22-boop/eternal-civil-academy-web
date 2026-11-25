"use client";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";

import React, { useState, useEffect } from "react";
import { COMMISSIONS_LIST } from "@/lib/siteData";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import DualPdfButton from "@/components/DualPdfButton";
import { Languages } from "lucide-react";

export default function SyllabusPage() {
  const [commissions, setCommissions] = useState<string[]>(COMMISSIONS_LIST);
  const [selectedComm, setSelectedComm] = useState("UPSC");
  const [lang, setLang] = useState<"en" | "hi">("en");

  useEffect(() => {
    const sync = () => {
      const list = loadNoCodeCms().commissions;
      if (list.length > 0) setCommissions(list);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const stages = [
    {
      stage: "Prelims",
      titleEn: `${selectedComm} Preliminary Examination Syllabus`,
      titleHi: `${selectedComm} प्रारंभिक परीक्षा पाठ्यक्रम (हिन्दी)`,
    },
    {
      stage: "Mains",
      titleEn: `${selectedComm} Mains General Studies Syllabus`,
      titleHi: `${selectedComm} मुख्य परीक्षा सामान्य अध्ययन पाठ्यक्रम (हिन्दी)`,
    },
    {
      stage: "Optional",
      titleEn: `${selectedComm} Optional Subjects Syllabus`,
      titleHi: `${selectedComm} वैकल्पिक विषय पाठ्यक्रम (हिन्दी)`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Syllabus
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

      <div className="flex flex-wrap gap-2 mb-6">
        {commissions.map((comm) => (
          <button
            key={comm}
            onClick={() => setSelectedComm(comm)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
              selectedComm === comm
                ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            {comm}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {stages.map((s, idx) => {
          const title = lang === "hi" ? s.titleHi : s.titleEn;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <span className="bg-red-50 text-[#E60000] text-xs font-extrabold px-2.5 py-0.5 rounded">
                  {selectedComm} • {s.stage} • {lang === "hi" ? "हिन्दी" : "English"}
                </span>
                <h2 className="text-base font-extrabold text-[#0B1B3D] mt-1">{title}</h2>
              </div>
              <DualPdfButton title={title} compact />
            </div>
          );
        })}
      </div>
          <LiveAdminSectionFeed sectionMatch="Syllabus" />
    </div>
  );
}
