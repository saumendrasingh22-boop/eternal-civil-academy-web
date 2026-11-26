"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Download, Clock, Calendar, FileText } from "lucide-react";
import type { SmartQuizItem, SmartQuizTarget } from "@/lib/smartQuizzesTypes";
import { exportTestPaperPdf } from "@/lib/mistakesPdfExport";

export default function SmartQuizzesFeed({
  targetSection,
  lang,
  commissionFilter,
  pricingFilter,
}: {
  targetSection: SmartQuizTarget;
  lang: "en" | "hi";
  commissionFilter?: string;
  pricingFilter?: "free" | "paid";
}) {
  const [quizzes, setQuizzes] = useState<SmartQuizItem[]>([]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const isHi = lang === "hi";

  useEffect(() => {
    fetch(`/api/smart-quizzes?target=${targetSection}&_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.quizzes)) setQuizzes(d.quizzes);
      })
      .catch(() => {});

    const iv = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(iv);
  }, [targetSection]);

  const filtered = quizzes.filter((q) => {
    if (commissionFilter && q.commissionOrExam.toLowerCase() !== commissionFilter.toLowerCase()) {
      return false;
    }
    if (pricingFilter && q.pricingType !== pricingFilter) return false;
    return true;
  });

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {targetSection === "pyq"
              ? isHi
                ? "इंटरैक्टिव PYQ टेस्ट और पीडीएफ (EN + हिन्दी)"
                : "Interactive PYQ Tests & Dual PDFs (EN + HI)"
              : isHi
              ? "लाइव टेस्ट सीरीज़ और पीडीएफ (EN + हिन्दी)"
              : "Live Test Series & Dual PDFs (EN + HI)"}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">
            {targetSection === "pyq"
              ? isHi
                ? `${commissionFilter || ""} PYQ क्विज़ अटेम्प्ट करें या PDF डाउनलोड करें`
                : `Attempt ${commissionFilter || ""} PYQ Quiz or Download Bilingual PDF`
              : isHi
              ? "ऑनलाइन CBT टेस्ट दें या प्रश्न-पत्र व व्याख्या PDF डाउनलोड करें"
              : "Attempt Live CBT Test or Download Question & Solution PDFs"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((q) => {
          const schedMs = q.publishMode === "scheduled" && q.scheduledAtIso ? Date.parse(q.scheduledAtIso) : 0;
          const isUpcoming = schedMs > nowMs;
          const displayTitle = isHi ? q.titleHi || q.titleEn : q.titleEn || q.titleHi;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="bg-[#0B1B3D] text-white font-extrabold px-2.5 py-0.5 rounded-md">
                    {q.commissionOrExam} • {q.yearOrTag}
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-md">
                    {q.questions.length} MCQs • {q.durationMinutes} min
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md">
                    EN + हिन्दी
                  </span>
                  {isUpcoming && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" /> {isHi ? "निर्धारित" : "Scheduled"}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] leading-snug">
                  {displayTitle}
                </h3>
                <p className="text-xs text-slate-600">
                  +{q.positiveMarks} / -{q.negativeMarks} Negative •{" "}
                  {isUpcoming && q.scheduledAtIso
                    ? `${isHi ? "लाइव समय:" : "Goes Live:"} ${new Date(q.scheduledAtIso).toLocaleString()}`
                    : isHi
                    ? "तुरंत अटेम्प्ट और PDF डाउनलोड उपलब्ध"
                    : "Instant Live CBT Attempt & Bilingual PDF Download"}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {isUpcoming ? (
                  <div className="w-full inline-flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold px-4 py-2.5 rounded-xl">
                    <Calendar className="w-4 h-4" />
                    {isHi ? "लाइव होने की प्रतीक्षा:" : "Unlocks at:"}{" "}
                    {q.scheduledAtIso ? new Date(q.scheduledAtIso).toLocaleString() : ""}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/test-series/live-cbt?smartQuiz=${encodeURIComponent(q.slug)}&lang=${lang}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isHi ? "लाइव टेस्ट अटेम्प्ट करें" : "Attempt Live Quiz"}
                    </Link>
                  </div>
                )}

                {!isUpcoming && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => exportTestPaperPdf(q.titleEn, q.questions, "en", false)}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Question PDF (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => exportTestPaperPdf(q.titleHi, q.questions, "hi", false)}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <Download className="w-3.5 h-3.5" /> प्रश्न-पत्र PDF (हिन्दी)
                    </button>
                    <button
                      type="button"
                      onClick={() => exportTestPaperPdf(q.titleEn, q.questions, "en", true)}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D]/5 hover:bg-[#0B1B3D]/10 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> Solution PDF (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => exportTestPaperPdf(q.titleHi, q.questions, "hi", true)}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D]/5 hover:bg-[#0B1B3D]/10 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> व्याख्या PDF (हिन्दी)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
