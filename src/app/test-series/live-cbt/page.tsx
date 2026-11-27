"use client";

import React, { useState, useEffect } from "react";
import { CBT_QUESTIONS, BilingualCbtQuestion } from "@/lib/siteData";
import { loadLiveTests, DEFAULT_LIVE_TESTS } from "@/lib/liveTestsStore";
import {
  exportMistakesPdfReport,
  exportTestPaperPdf,
  MistakeExportItem,
} from "@/lib/mistakesPdfExport";
import {
  Clock,
  Flag,
  CheckCircle,
  RotateCcw,
  Award,
  Download,
  TrendingUp,
  AlertTriangle,
  Languages,
  FileText,
} from "lucide-react";


function formatExamStem(text: string): string {
  let s = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (/={5,}|-{5,}/.test(s)) {
    const m = s.match(/(?:^|\s)Q\s*\.?\s*1\s*[\.\):\-]\s*([\s\S]+)$/);
    if (m && m[1].trim().length > 15) s = m[1].trim();
    else s = s.replace(/^[=\-_]{4,}[\s\S]*?[=\-_]{4,}\s*/, "").replace(/^Q\s*\.?\s*\d+\s*[\.\):\-]\s*/, "").trim();
  }
  s = s.replace(/([:।\.?!])\s+(?=(?:[1-6]\.|[1-6]\)|\([ivxIVX]+\))\s+)/g, "$1\n");
  s = s.replace(/([:।\.?!\w\u0900-\u097F])\s+(?=\([a-d]\)\s+)/g, "$1\n");
  s = s.replace(/\s+(?=(?:Assertion\s*\(A\)|Reason\s*\(R\)|कथन\s*\(A\)|कारण\s*\(R\)|List[\-\s]*I{1,2}\s*:?|सूची[\-\s]*I{1,2}\s*:?|Codes\s*:|कूट\s*:))/g, "\n");
  s = s.replace(/([।\.?!])\s+(?=(?:उपर्युक्त|उपरोक्त|ऊपर दिए गए|नीचे दिए गए|सही उत्तर|Which of the|Select the correct|How many of the|Choose the correct))/g, "$1\n");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

function formatExamExplanation(text: string): string {
  let s = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!s) return "";
  s = s.replace(/\s*[•▪]\s*/g, "\n• ").trim();
  s = s.replace(/([।\.?!\]])\s+(?=(?:\[मुख्य तथ्य|\[Key Fact|Statement\s+[1-5]|कथन\s+[1-5]|Option\s+[A-D]|विकल्प\s+[A-D]|निष्कर्ष:|Note:|नोट:))/g, "$1\n");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

export default function LiveCbtSimulatorPage() {
  const [testTitle, setTestTitle] = useState("Daily GS & Current Affairs Live Mock Test");
  const [questions, setQuestions] = useState<BilingualCbtQuestion[]>(CBT_QUESTIONS);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [markedReview, setMarkedReview] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitted, setSubmitted] = useState(false);

  // Result Review Filter: all | mistakes | skipped | correct
  const [reviewFilter, setReviewFilter] = useState<"all" | "mistakes" | "skipped" | "correct">("all");
  const [pdfPickerType, setPdfPickerType] = useState<"mistakes" | "solution" | "question" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
        const smartSlug = params.get("smartQuiz");
    if (smartSlug) {
      fetch("/api/smart-quizzes?slug=" + encodeURIComponent(smartSlug), { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          const sq = d?.quiz;
          if (sq && Array.isArray(sq.questions) && sq.questions.length > 0) {
            const lg = params.get("lang"); if (lg === "hi" || lg === "en") setLang(lg); setTestTitle(lg === "hi" ? (sq.titleHi || sq.titleEn) : (sq.titleEn || sq.titleHi));
            setQuestions(sq.questions);
            setTimeLeft(Math.max(120, Number(sq.durationMinutes || 60) * 60));
          }
        })
        .catch(() => {});
      return;
    }
    const quizId = params.get("quiz");
    const initLang = params.get("lang");
    if (initLang === "hi" || initLang === "en") setLang(initLang);

    const allTests = loadLiveTests();
    const matched = quizId
      ? allTests.find((t) => t.id === quizId || t.slug === quizId)
      : allTests[0] || DEFAULT_LIVE_TESTS[0];

    if (matched && matched.questions.length > 0) {
      setTestTitle(matched.title);
      setQuestions(matched.questions);
      setTimeLeft(Math.max(120, matched.durationMinutes * 60));
    }
  }, []);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIdx] || questions[0];

  const getAnalytics = () => {
    let correct = 0;
    let wrong = 0;
    const subjectStats: Record<string, { total: number; correct: number; wrong: number; skipped: number }> = {};

    questions.forEach((q) => {
      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      subjectStats[q.subject].total++;
      if (answers[q.id]) {
        if (answers[q.id] === q.correct) {
          correct++;
          subjectStats[q.subject].correct++;
        } else {
          wrong++;
          subjectStats[q.subject].wrong++;
        }
      } else {
        subjectStats[q.subject].skipped++;
      }
    });

    const skipped = questions.length - (correct + wrong);
    const score = Math.max(0, correct * 2 - wrong * 0.666).toFixed(2);
    const max = (questions.length * 2).toFixed(2);
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    const strongSubjects = Object.entries(subjectStats)
      .filter(([, s]) => s.correct > 0 && s.wrong === 0)
      .map(([subj]) => subj);

    const weakSubjects = Object.entries(subjectStats)
      .filter(([, s]) => s.wrong > 0 || s.skipped === s.total)
      .map(([subj]) => subj);

    return {
      correct,
      wrong,
      skipped,
      score,
      max,
      accuracy,
      subjectStats,
      strongSubjects,
      weakSubjects,
    };
  };

  if (submitted) {
    const res = getAnalytics();

    const filteredQuestions = questions.filter((q) => {
      const userAns = answers[q.id];
      if (reviewFilter === "mistakes") return !!userAns && userAns !== q.correct;
      if (reviewFilter === "skipped") return !userAns;
      if (reviewFilter === "correct") return userAns === q.correct;
      return true;
    });

    const mistakesPayload: MistakeExportItem[] = questions
      .filter((q) => !!answers[q.id] && answers[q.id] !== q.correct)
      .map((q, idx) => {
        const picked = answers[q.id]!;
        return {
          questionNo: idx + 1,
          subject: q.subject,
          questionEn: q.questionEn,
          questionHi: q.questionHi,
          yourChoice: `${picked} (${lang === "hi" ? q.optionsHi[picked] : q.optionsEn[picked]})`,
          correctChoice: `${q.correct} (${lang === "hi" ? q.optionsHi[q.correct] : q.optionsEn[q.correct]})`,
          explanationEn: q.explanationEn,
          explanationHi: q.explanationHi,
        };
      });

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border-2 border-[#0B1B3D] p-6 sm:p-8 shadow-lg">
          {/* Top Header & Language Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-900 text-xs font-extrabold px-3 py-1 rounded-full">
                <Award className="w-4 h-4" /> Performance Analysis • {testTitle}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-2">
                Score: <span className="text-[#E60000]">{res.score}</span> / {res.max}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-extrabold px-3.5 py-2 rounded-xl"
              >
                <Languages className="w-4 h-4" />
                <span>{lang === "en" ? "Switch to Hindi" : "Switch to English"}</span>
              </button>
              <button
                onClick={() => {
                  setAnswers({});
                  setMarkedReview({});
                  setCurrentIdx(0);
                  setTimeLeft(600);
                  setSubmitted(false);
                  setReviewFilter("all");
                }}
                className="inline-flex items-center gap-1.5 bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" /> Re-Attempt
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-emerald-700">{res.correct}</div>
              <div className="text-xs font-bold text-emerald-800">Correct</div>
            </div>
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-[#E60000]">{res.wrong}</div>
              <div className="text-xs font-bold text-red-800">Mistakes</div>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-slate-700">{res.skipped}</div>
              <div className="text-xs font-bold text-slate-600">Skipped</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-extrabold text-[#0B1B3D]">{res.accuracy}%</div>
              <div className="text-xs font-bold text-blue-900">Accuracy</div>
            </div>
          </div>

          {/* Deep Performance Diagnosis: Strong Points vs Weak Points */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <h2 className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Strong Areas
              </h2>
              <p className="text-sm font-bold text-slate-900 mt-1.5">
                {res.strongSubjects.length > 0
                  ? res.strongSubjects.join(", ")
                  : "Attempt more questions accurately to build strong areas"}
              </p>
              <p className="text-xs text-emerald-800 mt-1">
                High conceptual clarity and zero negative marking in these subjects.
              </p>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4">
              <h2 className="text-xs font-extrabold uppercase text-[#E60000] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Weak Points
              </h2>
              <p className="text-sm font-bold text-slate-900 mt-1.5">
                {res.weakSubjects.length > 0
                  ? res.weakSubjects.join(", ")
                  : "No weak areas detected in this mock test"}
              </p>
              <p className="text-xs text-red-800 mt-1">
                Revise NCERT Crux and review your filtered mistakes below to eliminate negative marks.
              </p>
            </div>
          </div>

          {/* Subject-wise Accuracy Breakdown */}
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-extrabold uppercase text-[#0B1B3D] mb-3">
              Subject-Wise Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(res.subjectStats).map(([subj, st]) => {
                const pct = Math.round((st.correct / st.total) * 100);
                return (
                  <div key={subj} className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0B1B3D]">{subj}</span>
                      <span className={pct >= 70 ? "text-emerald-700" : "text-[#E60000]"}>
                        {st.correct}/{st.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct >= 70 ? "bg-emerald-600" : "bg-[#E60000]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 100% Free Zero-Bandwidth Client-Side PDF Download Hub (Each offers English & Hindi choice) */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-extrabold text-[#0B1B3D] uppercase mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#E60000]" /> Download Test PDFs (English / Hindi • Instant Unlimited)
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setPdfPickerType(pdfPickerType === "mistakes" ? null : "mistakes")}
                disabled={mistakesPayload.length === 0}
                className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 disabled:opacity-40 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>My Mistakes PDF ({mistakesPayload.length})</span>
              </button>

              <button
                onClick={() => setPdfPickerType(pdfPickerType === "solution" ? null : "solution")}
                className="inline-flex items-center gap-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Complete Solution PDF</span>
              </button>

              <button
                onClick={() => setPdfPickerType(pdfPickerType === "question" ? null : "question")}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-[#0B1B3D] text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                <span>Question Paper PDF</span>
              </button>
            </div>

            {pdfPickerType && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-[#0B1B3D] mr-2">
                  Choose Language for{" "}
                  {pdfPickerType === "mistakes"
                    ? "Mistakes PDF"
                    : pdfPickerType === "solution"
                    ? "Complete Solution PDF"
                    : "Question Paper PDF"}
                  :
                </span>
                <button
                  onClick={() => {
                    if (pdfPickerType === "mistakes") {
                      exportMistakesPdfReport(testTitle, mistakesPayload, "en");
                    } else {
                      exportTestPaperPdf(testTitle, questions, "en", pdfPickerType === "solution");
                    }
                    setPdfPickerType(null);
                  }}
                  className="bg-[#0B1B3D] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
                >
                  Download English PDF
                </button>
                <button
                  onClick={() => {
                    if (pdfPickerType === "mistakes") {
                      exportMistakesPdfReport(testTitle, mistakesPayload, "hi");
                    } else {
                      exportTestPaperPdf(testTitle, questions, "hi", pdfPickerType === "solution");
                    }
                    setPdfPickerType(null);
                  }}
                  className="bg-[#E60000] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
                >
                  Download Hindi PDF
                </button>
              </div>
            )}
          </div>

          {/* 4-Way Filter Tabs */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap gap-2">
            {[
              { id: "all", label: `All (${questions.length})` },
              { id: "mistakes", label: `Mistakes (${res.wrong})` },
              { id: "skipped", label: `Skipped (${res.skipped})` },
              { id: "correct", label: `Correct (${res.correct})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReviewFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  reviewFilter === tab.id
                    ? tab.id === "mistakes"
                      ? "bg-[#E60000] text-white"
                      : "bg-[#0B1B3D] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtered Questions List */}
          <div className="mt-5 space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl">
                No questions in this filter category.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const userAns = answers[q.id];
                const isRight = userAns === q.correct;
                const qText = formatExamStem(lang === "hi" ? q.questionHi : q.questionEn);
                const opts = lang === "hi" ? q.optionsHi : q.optionsEn;
                const exp = formatExamExplanation(lang === "hi" ? q.explanationHi : q.explanationEn);

                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-extrabold text-[#0B1B3D]">
                        Q{q.id} • {q.subject}
                      </span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded ${
                          !userAns
                            ? "bg-slate-200 text-slate-700"
                            : isRight
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-[#E60000]"
                        }`}
                      >
                        {!userAns ? "Skipped" : isRight ? "Correct (+2.00)" : "Mistake (-0.66)"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 whitespace-pre-line">{qText}</p>
                    {userAns && !isRight && (
                      <p className="text-xs text-[#E60000] font-bold mt-1.5">
                        Your Answer: {userAns}. {opts[userAns]}
                      </p>
                    )}
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      Correct Answer: {q.correct}. {opts[q.correct]}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line">{exp}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  const questionText = formatExamStem(lang === "hi" ? currentQ.questionHi : currentQ.questionEn);
  const optionsMap = lang === "hi" ? currentQ.optionsHi : currentQ.optionsEn;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-[#0B1B3D] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow">
        <div>
          <span className="text-[10px] font-bold uppercase text-yellow-300">Live Mock Test</span>
          <h1 className="text-sm sm:text-lg font-extrabold">{testTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Explicit Bilingual English / Hindi Selector during Attempt */}
          <div className="inline-flex items-center bg-white/10 p-1 rounded-xl border border-white/20 text-xs font-extrabold">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === "en" ? "bg-white text-[#0B1B3D]" : "text-white"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-2.5 py-1 rounded-lg transition ${
                lang === "hi" ? "bg-[#E60000] text-white" : "text-white"
              }`}
            >
              हिन्दी
            </button>
          </div>

          <div className="bg-white/10 px-3 py-1.5 rounded-xl font-mono text-sm font-bold text-yellow-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setSubmitted(true)}
            className="bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs sm:text-sm font-extrabold text-[#0B1B3D]">
                Question {currentIdx + 1} / {questions.length}
              </span>
              <span className="bg-blue-50 text-[#0B1B3D] text-xs font-bold px-2.5 py-0.5 rounded">
                {currentQ.subject}
              </span>
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 whitespace-pre-line">{questionText}</p>

            <div className="mt-5 space-y-3">
              {(["A", "B", "C", "D"] as const).map((opt) => {
                const selected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers((p) => ({ ...p, [currentQ.id]: opt }))}
                    className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center gap-3 transition ${
                      selected
                        ? "border-[#0B1B3D] bg-blue-50/70 font-bold"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        selected ? "bg-[#0B1B3D] text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="text-sm sm:text-base">{optionsMap[opt]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setMarkedReview((p) => ({ ...p, [currentQ.id]: !p[currentQ.id] }))
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                  markedReview[currentQ.id]
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-purple-50 text-purple-800 border-purple-200"
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> Mark Review
              </button>
              <button
                onClick={() =>
                  setAnswers((p) => {
                    const copy = { ...p };
                    delete copy[currentQ.id];
                    return copy;
                  })
                }
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Clear
              </button>
            </div>

            <div className="flex gap-2">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="bg-[#0B1B3D] text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Save & Next
                </button>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="bg-[#E60000] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Finish
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-extrabold text-[#0B1B3D] text-sm border-b border-slate-100 pb-3 mb-4">
            Question Palette
          </h2>
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isAns = !!answers[q.id];
              const isRev = !!markedReview[q.id];
              let bg = "bg-slate-100 text-slate-700";
              if (isRev) bg = "bg-purple-600 text-white";
              else if (isAns) bg = "bg-emerald-600 text-white";
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-10 rounded-xl text-xs font-bold ${bg} ${
                    idx === currentIdx ? "ring-2 ring-offset-2 ring-[#E60000]" : ""
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
