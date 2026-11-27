"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Download, Clock, Calendar, FileText } from "lucide-react";
import type { SmartQuizItem, SmartQuizTarget } from "@/lib/smartQuizzesTypes";
import { exportTestPaperPdf } from "@/lib/mistakesPdfExport";

const SECTION_HEADINGS: Record<SmartQuizTarget, { badgeEn: string; badgeHi: string; titleEn: string; titleHi: string }> = {
  test_series: {
    badgeEn: "Live Test Series & Dual PDFs (EN + HI)",
    badgeHi: "लाइव टेस्ट सीरीज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Live CBT Test or Download Question & Solution PDFs",
    titleHi: "ऑनलाइन CBT टेस्ट दें या प्रश्न-पत्र व व्याख्या PDF डाउनलोड करें",
  },
  pyq: {
    badgeEn: "Interactive PYQ Tests & Dual PDFs (EN + HI)",
    badgeHi: "इंटरैक्टिव PYQ टेस्ट और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt PYQ Quiz or Download Bilingual PDF",
    titleHi: "PYQ क्विज़ अटेम्प्ट करें या द्विभाषी PDF डाउनलोड करें",
  },
  daily_practice: {
    badgeEn: "Daily Practice Quizzes & Dual PDFs (EN + HI)",
    badgeHi: "दैनिक अभ्यास क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Daily Practice Quiz or Download PDF",
    titleHi: "दैनिक अभ्यास टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  current_affairs: {
    badgeEn: "Current Affairs Quizzes & Dual PDFs (EN + HI)",
    badgeHi: "करंट अफेयर्स क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Current Affairs Quiz or Download Bilingual PDF",
    titleHi: "करंट अफेयर्स टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  state_special: {
    badgeEn: "State Special Quizzes & Dual PDFs (EN + HI)",
    badgeHi: "स्टेट स्पेशल क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt State Special Quiz or Download Bilingual PDF",
    titleHi: "राज्य विशेष टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  material: {
    badgeEn: "Practice Quizzes & Dual PDFs (EN + HI)",
    badgeHi: "अभ्यास क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Material Practice Quiz or Download PDF",
    titleHi: "नोट्स आधारित टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  monthly_magazine: {
    badgeEn: "Monthly Magazine MCQs & Dual PDFs (EN + HI)",
    badgeHi: "मासिक पत्रिका क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Monthly MCQ Test or Download Bilingual PDF",
    titleHi: "मासिक MCQ टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  batches: {
    badgeEn: "Batch Practice Tests & Dual PDFs (EN + HI)",
    badgeHi: "बैच अभ्यास टेस्ट और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Batch Test or Download Bilingual PDF",
    titleHi: "बैच टेस्ट अटेम्प्ट करें या PDF डाउनलोड करें",
  },
  student_hub: {
    badgeEn: "Student Hub Quizzes & Dual PDFs (EN + HI)",
    badgeHi: "स्टूडेंट हब क्विज़ और पीडीएफ (EN + हिन्दी)",
    titleEn: "Attempt Practice Quiz or Download Bilingual PDF",
    titleHi: "अभ्यास क्विज़ अटेम्प्ट करें या PDF डाउनलोड करें",
  },
};

export default function SmartQuizzesFeed({
  targetSection,
  lang = "hi",
  commissionFilter,
  pricingFilter,
}: {
  targetSection: SmartQuizTarget;
  lang?: "en" | "hi";
  commissionFilter?: string;
  pricingFilter?: "free" | "paid";
}) {
  const [quizzes, setQuizzes] = useState<SmartQuizItem[]>([]);
  const [submittedSlugs, setSubmittedSlugs] = useState<string[]>([]);
  const [selectedSubSection, setSelectedSubSection] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("eca_submitted_tests_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSubmittedSlugs(parsed.map(String));
    } catch {}
  }, []);
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

  const defaultComms = ["upsc", "uppsc", "bpsc", "rpsc", "mppsc", "hpsc", "jpsc"];
    const baseFiltered = quizzes.filter((q) => {
    if (commissionFilter && q.commissionOrExam.toLowerCase() !== commissionFilter.toLowerCase()) {
      return false;
    }
    if (pricingFilter && q.pricingType !== pricingFilter) return false;
    return true;
  });

  const subSectionOptions = Array.from(
    new Set(baseFiltered.map((q) => (q.subSection || "").trim()).filter(Boolean))
  );
  const subjectOptions = Array.from(
    new Set(baseFiltered.map((q) => (q.subjectTag || "").trim()).filter(Boolean))
  );

  const filtered = baseFiltered.filter((q) => {
    if (selectedSubSection !== "ALL" && (q.subSection || "").trim() !== selectedSubSection) return false;
    if (selectedSubject !== "ALL" && (q.subjectTag || "").trim() !== selectedSubject) return false;
    return true;
  });

  if (baseFiltered.length === 0) return null;

  
  const handleDirectPdf = (q: SmartQuizItem, variant: "qEn" | "qHi" | "sEn" | "sHi") => {
    const directUrl = q.pdfUrls?.[variant];
    const isHiVar = variant === "qHi" || variant === "sHi";
    const isSol = variant === "sEn" || variant === "sHi";
    if (directUrl) {
      const fname = `ECA_${q.slug}_${variant}.pdf`;
      window.location.href = `/api/download-pdf?url=${encodeURIComponent(directUrl)}&name=${encodeURIComponent(fname)}`;
      return;
    }
    exportTestPaperPdf(isHiVar ? (q.titleHi || q.titleEn) : (q.titleEn || q.titleHi), q.questions, isHiVar ? "hi" : "en", isSol);
  };

  const heading = SECTION_HEADINGS[targetSection] || SECTION_HEADINGS.test_series;

  return (
    <div className="space-y-4 my-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {isHi ? heading.badgeHi : heading.badgeEn}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">
            {isHi ? heading.titleHi : heading.titleEn}
          </h2>
        </div>
      </div>

      {(subSectionOptions.length > 0 || subjectOptions.length > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
          {subSectionOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-600 mr-1">
                {isHi ? "सब-सेक्शन:" : "Sub-Section:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubSection("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                  selectedSubSection === "ALL"
                    ? "bg-[#E60000] text-white border-[#E60000]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {isHi ? "सभी" : "All"}
              </button>
              {subSectionOptions.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubSection(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                    selectedSubSection === sub
                      ? "bg-[#E60000] text-white border-[#E60000]"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {subjectOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-600 mr-1">
                {isHi ? "विषय (Subject):" : "Subject:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubject("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                  selectedSubject === "ALL"
                    ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {isHi ? "सभी विषय" : "All Subjects"}
              </button>
              {subjectOptions.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                    selectedSubject === subj
                      ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-6 text-xs font-bold text-slate-500 bg-white rounded-2xl border border-slate-200">
          {isHi ? "इस फ़िल्टर में अभी कोई टेस्ट नहीं है।" : "No tests match the selected sub-section / subject filter."}
        </div>
      )}

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
                  {q.subSection && (
                    <span className="bg-red-50 text-[#E60000] border border-red-200 font-extrabold px-2.5 py-0.5 rounded-md">
                      {q.subSection}
                    </span>
                  )}
                  {q.subjectTag && (
                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold px-2.5 py-0.5 rounded-md">
                      {q.subjectTag}
                    </span>
                  )}
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

                {!isUpcoming && (submittedSlugs.includes(q.slug) || submittedSlugs.includes(q.id) ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectPdf(q, "qEn")}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Question PDF (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectPdf(q, "qHi")}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <Download className="w-3.5 h-3.5" /> प्रश्न-पत्र PDF (हिन्दी)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectPdf(q, "sEn")}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D]/5 hover:bg-[#0B1B3D]/10 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> Solution PDF (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectPdf(q, "sHi")}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D]/5 hover:bg-[#0B1B3D]/10 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-2 rounded-xl transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> व्याख्या PDF (हिन्दी)
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/test-series/live-cbt?smartQuiz=${encodeURIComponent(q.slug)}&lang=${lang}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold px-3 py-2 rounded-xl transition text-center"
                  >
                    🔒 {isHi ? "PDF डाउनलोड करने के लिए पहले टेस्ट सबमिट करें" : "Submit Live Test to Unlock Question & Solution PDFs"}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
