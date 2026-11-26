"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";

interface DailyTestMeta {
  id: string;
  date: string;
  title: string;
  totalQuestions: number;
  jsonUrl: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
}

interface DailyQuestion {
  id: number;
  subject: string;
  questionEn: string;
  questionHi: string;
  optionsEn: { A: string; B: string; C: string; D: string };
  optionsHi: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanationEn: string;
  explanationHi: string;
}

interface SavedAttempt {
  answers: Record<number, "A" | "B" | "C" | "D">;
  submitted: boolean;
  score: number;
  total: number;
}

const STORAGE_PREFIX = "eca_daily_ca_5mcq_attempt_v1_";

function fmtDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

function renderInlineBold(text: string) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-[#0B1B3D]">
          {part.slice(2, -2).replace(/\*\*/g, "")}
        </strong>
      );
    }
    return <span key={i}>{part.replace(/\*\*/g, "")}</span>;
  });
}

function renderRichLines(text: string) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, li) => (
      <div key={li} className="mb-1.5 last:mb-0">
        {renderInlineBold(line)}
      </div>
    ));
}

export default function HomeCaQuizCard() {
  const [tests, setTests] = useState<DailyTestMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  const [lang, setLang] = useState<"en" | "hi">("en");
  const [isExpanded, setIsExpanded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<"all" | "mistakes">("all");
  const [savedScores, setSavedScores] = useState<Record<string, { score: number; total: number }>>({});

  useEffect(() => {
    if (!isExpanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isExpanded]);

  useEffect(() => {
    let active = true;
    fetch("/api/cms-state?key=daily_ca_quizzes&_t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const arr: DailyTestMeta[] = Array.isArray(d?.value) ? d.value : [];
        const sorted = [...arr].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setTests(sorted);
        const sc: Record<string, { score: number; total: number }> = {};
        sorted.forEach((t) => {
          try {
            const raw = localStorage.getItem(STORAGE_PREFIX + t.date);
            if (raw) {
              const p: SavedAttempt = JSON.parse(raw);
              if (p.submitted) sc[t.date] = { score: p.score, total: p.total };
            }
          } catch {}
        });
        setSavedScores(sc);
        if (sorted.length > 0) setSelectedDate(sorted[0].date);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedMeta = useMemo(
    () => tests.find((t) => t.date === selectedDate) || null,
    [tests, selectedDate]
  );

  useEffect(() => {
    if (!selectedMeta?.jsonUrl) {
      setQuestions([]);
      return;
    }
    let active = true;
    setLoadingQ(true);
    setIdx(0);
    setFilter("all");
    fetch("/api/daily-test-data?url=" + encodeURIComponent(selectedMeta.jsonUrl) + "&_t=" + Date.now(), {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const qs: DailyQuestion[] = Array.isArray(d?.questions) ? d.questions : [];
        setQuestions(qs);
        try {
          const raw = localStorage.getItem(STORAGE_PREFIX + selectedMeta.date);
          if (raw) {
            const p: SavedAttempt = JSON.parse(raw);
            setAnswers(p.answers || {});
            setSubmitted(Boolean(p.submitted));
            return;
          }
        } catch {}
        setAnswers({});
        setSubmitted(false);
      })
      .catch(() => {
        if (active) setQuestions([]);
      })
      .finally(() => {
        if (active) setLoadingQ(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMeta]);

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    questions.forEach((q) => {
      const p = answers[q.id];
      if (!p) skipped += 1;
      else if (p === q.correct) correct += 1;
      else wrong += 1;
    });
    const penalty = Number((wrong / 3).toFixed(2));
    const netScore = Number((correct - wrong / 3).toFixed(2));
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { correct, wrong, skipped, penalty, netScore, accuracy };
  }, [questions, answers]);

  const handleSubmit = () => {
    if (!selectedMeta || questions.length === 0) return;
    setSubmitted(true);
    setFilter("all");
    const payload: SavedAttempt = {
      answers,
      submitted: true,
      score: stats.netScore,
      total: questions.length,
    };
    setSavedScores((prev) => ({
      ...prev,
      [selectedMeta.date]: { score: stats.netScore, total: questions.length },
    }));
    try {
      localStorage.setItem(STORAGE_PREFIX + selectedMeta.date, JSON.stringify(payload));
    } catch {}
  };

  const handleReattempt = () => {
    if (!selectedMeta) return;
    setAnswers({});
    setSubmitted(false);
    setIdx(0);
    setFilter("all");
    try {
      localStorage.removeItem(STORAGE_PREFIX + selectedMeta.date);
    } catch {}
  };

  const currentQ = questions[idx];
  const reviewQs = useMemo(
    () =>
      questions.filter((q) =>
        filter === "mistakes" ? Boolean(answers[q.id] && answers[q.id] !== q.correct) : true
      ),
    [questions, answers, filter]
  );

  return (
    <div
      className={
        isExpanded
          ? "fixed inset-0 z-[100] bg-slate-100 flex flex-col justify-between overflow-hidden"
          : "lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
      }
    >
      <div className={isExpanded ? "flex-1 flex flex-col overflow-hidden" : ""}>
        <div
          className={
            isExpanded
              ? "bg-[#0B1B3D] text-white px-4 sm:px-8 py-3.5 shadow-md border-b-2 border-[#E60000] shrink-0"
              : "bg-[#0B1B3D] text-white px-4 py-3 flex items-center justify-between gap-2"
          }
        >
          <div
            className={
              isExpanded
                ? "max-w-4xl mx-auto w-full flex items-center justify-between gap-3"
                : "flex items-center justify-between gap-2 w-full"
            }
          >
            <div>
              <h2 className={isExpanded ? "font-extrabold text-base sm:text-lg uppercase tracking-wider" : "font-extrabold text-sm uppercase tracking-wider"}>
                Daily CA Quiz
              </h2>
              <p className={isExpanded ? "text-[11px] sm:text-xs text-slate-300" : "text-[10px] text-slate-300"}>
                5 Current Affairs MCQs &bull; +1 / -1/3
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition ${
                    lang === "en" ? "bg-[#E60000] text-white" : "text-slate-200 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition ${
                    lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-200 hover:text-white"
                  }`}
                >
                  हिन्दी
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? "Exit Fullscreen" : "Expand Fullscreen"}
                aria-label={isExpanded ? "Exit Fullscreen" : "Expand Fullscreen"}
                className={
                  isExpanded
                    ? "px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold flex items-center gap-1.5 transition"
                    : "p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                }
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Exit</span>
                  </>
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {tests.length > 0 && (
          <div className={isExpanded ? "bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 shrink-0" : "px-4 py-2.5 bg-slate-50 border-b border-slate-100"}>
            <div className={isExpanded ? "max-w-4xl mx-auto w-full flex items-center gap-2.5" : "flex items-center gap-2"}>
              <Calendar className="w-4 h-4 text-[#E60000] shrink-0" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Select Current Affairs Quiz Date"
                className={
                  isExpanded
                    ? "w-full sm:max-w-sm text-xs sm:text-sm font-bold text-[#0B1B3D] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0B1B3D]"
                    : "w-full text-xs font-bold text-[#0B1B3D] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0B1B3D]"
                }
              >
                {tests.map((t) => {
                  const sc = savedScores[t.date];
                  return (
                    <option key={t.date} value={t.date}>
                      {fmtDate(t.date)} ({t.totalQuestions || 5} MCQs{sc ? ` • Score: ${sc.score}/${sc.total}` : ""})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        <div className={isExpanded ? "flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6" : ""}>
          <div className={isExpanded ? "max-w-4xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-7" : ""}>
            {loadingList || loadingQ ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-500">Loading Daily Current Affairs Quiz...</div>
            ) : questions.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3D]">Daily Current Affairs Quiz (5 MCQs) Publishes at 7:00 AM IST</p>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Today&apos;s quiz &amp; branded English/Hindi PDFs will appear here automatically.
                </p>
              </div>
            ) : !submitted ? (
              <div className={isExpanded ? "space-y-5" : "p-4 space-y-3"}>
                <div className={isExpanded ? "grid grid-cols-5 gap-2" : "grid grid-cols-5 gap-1.5"}>
                  {questions.map((q, i) => {
                    const ans = Boolean(answers[q.id]);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setIdx(i)}
                        className={`${isExpanded ? "h-8 text-xs rounded-lg" : "h-6 text-[10px] rounded"} font-extrabold border transition ${
                          i === idx
                            ? "bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm"
                            : ans
                              ? "bg-green-50 text-green-800 border-green-400"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {currentQ && (
                  <div className={isExpanded ? "space-y-4 pt-2 border-t border-slate-100" : "space-y-2.5 pt-1"}>
                    <div className="flex items-center justify-between">
                      <span className={isExpanded ? "inline-block bg-blue-50 text-[#0B1B3D] text-xs font-extrabold px-3 py-1 rounded-lg" : "inline-block bg-blue-50 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded"}>
                        Q{idx + 1}/{questions.length} &bull; {currentQ.subject}
                      </span>
                      <span className={isExpanded ? "text-xs font-bold text-slate-500" : "text-[10px] font-bold text-slate-500"}>
                        Attempted: {Object.keys(answers).length}/{questions.length}
                      </span>
                    </div>
                    <p className={isExpanded ? "text-sm sm:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-line" : "text-xs font-bold text-slate-900 leading-relaxed whitespace-pre-line"}>
                      {renderInlineBold(lang === "hi" ? currentQ.questionHi : currentQ.questionEn)}
                    </p>
                    <div className={isExpanded ? "space-y-2.5" : "space-y-1.5"}>
                      {(["A", "B", "C", "D"] as const).map((opt) => {
                        const picked = answers[currentQ.id] === opt;
                        const txt = lang === "hi" ? currentQ.optionsHi?.[opt] : currentQ.optionsEn?.[opt];
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                            className={`w-full text-left ${isExpanded ? "p-3.5 text-sm rounded-xl gap-3" : "p-2.5 text-xs rounded-xl gap-2"} border transition flex items-start ${
                              picked
                                ? "border-[#0B1B3D] bg-blue-50 text-[#0B1B3D] font-bold shadow-sm"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <span
                              className={`${isExpanded ? "w-7 h-7 text-xs" : "w-5 h-5 text-[10px]"} rounded-full font-extrabold flex items-center justify-center shrink-0 ${
                                picked ? "bg-[#0B1B3D] text-white" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {opt}
                            </span>
                            <span className="leading-snug">{renderInlineBold(txt || "")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={isExpanded ? "space-y-5" : "p-4 space-y-3"}>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-blue-50 rounded-xl p-2.5 sm:p-3.5 border border-blue-100">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-600">Net (-1/3)</p>
                    <p className="text-sm sm:text-xl font-extrabold text-[#0B1B3D]">{stats.netScore}/{questions.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2.5 sm:p-3.5 border border-green-100">
                    <p className="text-[10px] sm:text-xs font-bold text-green-700">Correct</p>
                    <p className="text-sm sm:text-xl font-extrabold text-green-700">{stats.correct}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-2.5 sm:p-3.5 border border-red-100">
                    <p className="text-[10px] sm:text-xs font-bold text-[#E60000]">Mistakes</p>
                    <p className="text-sm sm:text-xl font-extrabold text-[#E60000]">{stats.wrong}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${
                      filter === "all" ? "bg-[#0B1B3D] text-white border-[#0B1B3D]" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Full Analysis ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("mistakes")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${
                      filter === "mistakes" ? "bg-[#E60000] text-white border-[#E60000]" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    See Mistakes ({stats.wrong})
                  </button>
                  <button
                    type="button"
                    onClick={handleReattempt}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>

                <div className={`space-y-3 ${isExpanded ? "" : "max-h-[300px] overflow-y-auto"} pr-1`}>
                  {reviewQs.length === 0 ? (
                    <p className="text-xs sm:text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4 text-green-600" /> Zero mistakes!
                    </p>
                  ) : (
                    reviewQs.map((q) => {
                      const picked = answers[q.id];
                      const ok = picked === q.correct;
                      const opts = lang === "hi" ? q.optionsHi : q.optionsEn;
                      return (
                        <div key={q.id} className={`rounded-xl border border-slate-200 ${isExpanded ? "p-4 text-xs sm:text-sm space-y-2" : "p-2.5 text-[11px] space-y-1.5"}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-[#0B1B3D]">Q{q.id} &bull; {q.subject}</span>
                            {ok ? (
                              <span className="inline-flex items-center gap-1 text-green-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Right</span>
                            ) : picked ? (
                              <span className="inline-flex items-center gap-1 text-[#E60000] font-bold"><XCircle className="w-3.5 h-3.5" /> Yours: {picked}</span>
                            ) : (
                              <span className="text-slate-500 font-bold">Skipped</span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 leading-snug whitespace-pre-line">
                            {renderInlineBold(lang === "hi" ? q.questionHi : q.questionEn)}
                          </p>
                          <p className="text-green-800 font-bold">
                            {lang === "hi" ? "सही उत्तर:" : "Answer:"} ({q.correct}) {renderInlineBold(opts?.[q.correct] || "")}
                          </p>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-slate-700 leading-relaxed">
                            {renderRichLines(lang === "hi" ? q.explanationHi : q.explanationEn)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={
          isExpanded
            ? "bg-white border-t border-slate-200 px-4 sm:px-8 py-3.5 shadow-[0_-4px_14px_rgba(0,0,0,0.06)] shrink-0"
            : "px-4 py-3 bg-slate-50 border-t border-slate-100"
        }
      >
        <div className={isExpanded ? "max-w-4xl mx-auto w-full flex flex-wrap items-center justify-between gap-3" : "flex flex-wrap items-center justify-between gap-2"}>
          {!submitted && questions.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  className={
                    isExpanded
                      ? "px-5 py-2.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-sm font-extrabold text-[#0B1B3D] disabled:opacity-40 transition"
                      : "px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-extrabold text-[#0B1B3D] disabled:opacity-40 transition"
                  }
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  disabled={idx >= questions.length - 1}
                  onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className={
                    isExpanded
                      ? "px-6 py-2.5 rounded-xl bg-[#0B1B3D] hover:bg-slate-800 text-white text-sm font-extrabold disabled:opacity-40 transition shadow-sm"
                      : "px-4 py-2 rounded-xl bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-extrabold disabled:opacity-40 transition"
                  }
                >
                  Next &rarr;
                </button>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className={
                  isExpanded
                    ? "px-6 py-2.5 rounded-xl bg-[#E60000] hover:bg-red-700 text-white text-sm font-extrabold transition shadow-sm"
                    : "px-4 py-2 rounded-xl bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold transition"
                }
              >
                Submit Quiz
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 w-full">
              {selectedMeta?.englishPdfUrl && (
                <a
                  href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.englishPdfUrl)}`}
                  download
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D] text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4" /> English PDF
                </a>
              )}
              {selectedMeta?.hindiPdfUrl && (
                <a
                  href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.hindiPdfUrl)}`}
                  download
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#E60000] text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl hover:bg-red-700 transition"
                >
                  <Download className="w-4 h-4" /> Hindi PDF
                </a>
              )}
              {!selectedMeta && (
                <span className="text-xs font-semibold text-slate-500">Auto-updates daily at 7:00 AM IST</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
