"use client";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";

import React, { useState, useEffect } from "react";
import { COMMISSIONS_LIST } from "@/lib/siteData";
import { loadNoCodeCms } from "@/lib/noCodeCmsStore";
import DualPdfButton from "@/components/DualPdfButton";
import SmartQuizzesFeed from "@/components/SmartQuizzesFeed";
import { Languages } from "lucide-react";

export default function PyqPage() {
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

  const papers = [
    {
      year: "2025",
      titleEn: `${selectedComm} Prelims General Studies Paper-I (Solved)`,
      titleHi: `${selectedComm} प्रारंभिक परीक्षा सामान्य अध्ययन पेपर-I (हल सहित)`,
    },
    {
      year: "2024",
      titleEn: `${selectedComm} Prelims General Studies Paper-I (Solved)`,
      titleHi: `${selectedComm} प्रारंभिक परीक्षा सामान्य अध्ययन पेपर-I (हल सहित)`,
    },
    {
      year: "2023",
      titleEn: `${selectedComm} Prelims General Studies Paper-I (Solved)`,
      titleHi: `${selectedComm} प्रारंभिक परीक्षा सामान्य अध्ययन पेपर-I (हल सहित)`,
    },
    {
      year: "2011–2025",
      titleEn: `${selectedComm} 15 Years Subject-Wise PYQ Compilation`,
      titleHi: `${selectedComm} पिछले 15 वर्षों का विषयवार PYQ संकलन`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">PYQ</h1>

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
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {commissions.map((comm) => (
          <button
            key={comm}
            onClick={() => setSelectedComm(comm)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
              selectedComm === comm
                ? "bg-[#E60000] text-white border-[#E60000]"
                : "bg-white text-[#0B1B3D] border-slate-200 hover:border-red-300"
            }`}
          >
            {comm}
          </button>
        ))}
      </div>
      <SmartQuizzesFeed targetSection="pyq" lang={lang} commissionFilter={selectedComm} />


      <div className="space-y-4">
        {papers.map((p, i) => {
          const title = lang === "hi" ? p.titleHi : p.titleEn;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <span className="bg-blue-50 text-[#0B1B3D] text-xs font-extrabold px-2.5 py-0.5 rounded">
                  {selectedComm} • {p.year} • {lang === "hi" ? "हिन्दी" : "English"}
                </span>
                <h2 className="text-base font-extrabold text-[#0B1B3D] mt-1">{title}</h2>
              </div>
              <DualPdfButton title={title} compact />
            </div>
          );
        })}
      </div>
          <LiveAdminSectionFeed sectionMatch="PYQ" />
    </div>
  );
}
