"use client";
import React, { useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { BilingualCurrentAffairItem } from "@/lib/bilingualCaMap";
import { exportArticlePdf } from "@/lib/articlePdfExport";

interface DualPdfButtonProps {
  title: string;
  englishUrl?: string;
  hindiUrl?: string;
  compact?: boolean;
  article?: BilingualCurrentAffairItem;
}

export default function DualPdfButton({ title, englishUrl = "#english-pdf", hindiUrl = "#hindi-pdf", compact = false, article }: DualPdfButtonProps) {
  const [open, setOpen] = useState(false);
  const isReal = (u?: string) => Boolean(u && /^https?:\/\//i.test(u.trim()));
  const onDl = (e: React.MouseEvent, lang: "en" | "hi", url?: string) => {
    if (isReal(url)) { setOpen(false); return; }
    if (article) { e.preventDefault(); setOpen(false); exportArticlePdf(article, lang); } else { setOpen(false); }
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={compact ? "inline-flex items-center gap-1.5 bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition" : "inline-flex items-center justify-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition"}>
        <Download className="w-3.5 h-3.5" /><span>Download PDF</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E60000] uppercase tracking-wider"><FileText className="w-4 h-4" /> ETERNAL CIVIL ACADEMY</div>
            <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D] mt-1 line-clamp-2">{title}</h3>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href={isReal(englishUrl) ? englishUrl : "#"} target={isReal(englishUrl) ? "_blank" : undefined} rel={isReal(englishUrl) ? "noopener noreferrer" : undefined} onClick={(e) => onDl(e, "en", englishUrl)} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-[#0B1B3D] bg-[#0B1B3D] text-white hover:bg-slate-800 transition text-center">
                <Download className="w-5 h-5 mb-1.5 text-yellow-400" /><span className="text-xs sm:text-sm font-bold">Download English PDF</span>
              </a>
              <a href={isReal(hindiUrl) ? hindiUrl : "#"} target={isReal(hindiUrl) ? "_blank" : undefined} rel={isReal(hindiUrl) ? "noopener noreferrer" : undefined} onClick={(e) => onDl(e, "hi", hindiUrl)} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-[#E60000] bg-[#E60000] text-white hover:bg-red-700 transition text-center">
                <Download className="w-5 h-5 mb-1.5 text-white" /><span className="text-xs sm:text-sm font-bold">Download Hindi PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
