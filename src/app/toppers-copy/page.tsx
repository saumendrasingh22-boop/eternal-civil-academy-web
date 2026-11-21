"use client";

import React, { useState } from "react";
import DualPdfButton from "@/components/DualPdfButton";
import { Languages } from "lucide-react";

export default function ToppersCopyPage() {
  const [medium, setMedium] = useState<"en" | "hi">("en");

  const copies = [
    {
      exam: "UPSC CSE",
      paper: "GS-1 & GS-2 Topper Copy",
      titleEn: "Rank-12 General Studies Evaluated Copy (English Medium)",
      titleHi: "रैंक-12 सामान्य अध्ययन मूल्यांकित कॉपी (हिन्दी माध्यम)",
    },
    {
      exam: "UPSC CSE",
      paper: "Essay Topper Copy",
      titleEn: "145+ Marks Essay Evaluated Copy (English Medium)",
      titleHi: "145+ अंक निबंध मूल्यांकित कॉपी (हिन्दी माध्यम)",
    },
    {
      exam: "UPPSC PCS",
      paper: "GS-5 & GS-6 UP Special",
      titleEn: "UPPSC Topper Evaluated Answer Booklet (English Medium)",
      titleHi: "UPPSC टॉपर उत्तर पुस्तिका — यूपी स्पेशल (हिन्दी माध्यम)",
    },
    {
      exam: "BPSC",
      paper: "GS-1 & GS-2 Mains",
      titleEn: "BPSC Topper Evaluated Copy (English Medium)",
      titleHi: "BPSC टॉपर मूल्यांकित कॉपी (हिन्दी माध्यम)",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Toppers&apos; Copy
        </h1>

        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-extrabold">
          <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
          <button
            onClick={() => setMedium("en")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              medium === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            English Medium
          </button>
          <button
            onClick={() => setMedium("hi")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              medium === "hi" ? "bg-[#E60000] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Hindi Medium (हिन्दी)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {copies.map((item, idx) => {
          const title = medium === "hi" ? item.titleHi : item.titleEn;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="bg-purple-50 text-purple-800 text-xs font-extrabold px-2.5 py-1 rounded">
                  {item.exam} • {item.paper}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] mt-2">
                  {title}
                </h2>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <DualPdfButton title={title} compact />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
