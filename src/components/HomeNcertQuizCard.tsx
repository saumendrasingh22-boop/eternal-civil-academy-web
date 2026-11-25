"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Download, RotateCcw, Trophy, XCircle } from "lucide-react";

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

const STORAGE_PREFIX = "eca_daily_25mcq_attempt_v1_";

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

export default function HomeNcertQuizCard() {
  const [tests, setTests] = useState<DailyTestMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  const [lang, setLang] = useState<"en" | "hi">("en");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<"all" | "mistakes">("all");
  const [savedScores, setSavedScores] = useState<Record<string, { score: number; total: number }>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/cms-state?key=daily_practice_tests&_t=" + Date.now(), { cache: "no-store" })
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
    fetch("/api/daily-test-data?url=" + encodeURIComponent(selectedMeta.jsonUrl), { cache: "no-store" })
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
    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="bg-[#0B1B3D] text-white px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-sm uppercase tracking-wider">Daily NCERT Quiz</h2>
            <p className="text-[10px] text-slate-300">20 MCQs &bull; +1 / -1/3 Negative</p>
          </div>
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded text-[10px] font-extrabold transition ${
                lang === "en" ? "bg-[#E60000] text-white" : "text-slate-200 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`px-2 py-1 rounded text-[10px] font-extrabold transition ${
                lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-200 hover:text-white"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {tests.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#E60000] shrink-0" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select NCERT Quiz Date"
              className="w-full text-xs font-bold text-[#0B1B3D] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0B1B3D]"
            >
              {tests.map((t) => {
                const sc = savedScores[t.date];
                return (
                  <option key={t.date} value={t.date}>
                    {fmtDate(t.date)} ({t.totalQuestions || 20} MCQs{sc ? ` • Score: ${sc.score}/${sc.total}` : ""})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {loadingList || loadingQ ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading Daily NCERT Quiz...</div>
        ) : questions.length === 0 ? (
          <div className="p-6 text-center space-y-1.5">
            <p className="text-xs font-extrabold text-[#0B1B3D]">Daily NCERT Quiz (20 MCQs) Publishes at 7:00 AM IST</p>
            <p className="text-[11px] text-slate-500">
              Today&apos;s Class 6–12 NCERT quiz &amp; branded English/Hindi PDFs will appear here automatically.
            </p>
          </div>
        ) : !submitted ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-10 gap-1">
              {questions.map((q, i) => {
                const ans = Boolean(answers[q.id]);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`h-6 rounded text-[10px] font-extrabold border transition ${
                      i === idx
                        ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                        : ans
                          ? "bg-green-50 text-green-800 border-green-300"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {currentQ && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-blue-50 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded">
                    Q{idx + 1}/{questions.length} &bull; {currentQ.subject}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Done: {Object.keys(answers).length}/{questions.length}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                  {lang === "hi" ? currentQ.questionHi : currentQ.questionEn}
                </p>
                <div className="space-y-1.5">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const picked = answers[currentQ.id] === opt;
                    const txt = lang === "hi" ? currentQ.optionsHi?.[opt] : currentQ.optionsEn?.[opt];
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                        className={`w-full text-left p-2 rounded-xl border text-xs transition flex items-start gap-2 ${
                          picked
                            ? "border-[#0B1B3D] bg-blue-50 text-[#0B1B3D] font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-800"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                            picked ? "bg-[#0B1B3D] text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {opt}
                        </span>
                        <span className="leading-snug">{txt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
                <p className="text-[10px] font-bold text-slate-600">Net (-1/3)</p>
                <p className="text-sm font-extrabold text-[#0B1B3D]">{stats.netScore}/{questions.length}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-2 border border-green-100">
                <p className="text-[10px] font-bold text-green-700">Correct</p>
                <p className="text-sm font-extrabold text-green-700">{stats.correct}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2 border border-red-100">
                <p className="text-[10px] font-bold text-[#E60000]">Mistakes</p>
                <p className="text-sm font-extrabold text-[#E60000]">{stats.wrong}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  filter === "all" ? "bg-[#0B1B3D] text-white border-[#0B1B3D]" : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                Full Analysis ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("mistakes")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                  filter === "mistakes" ? "bg-[#E60000] text-white border-[#E60000]" : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                See Mistakes ({stats.wrong})
              </button>
              <button
                type="button"
                onClick={handleReattempt}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {reviewQs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-green-600" /> Zero mistakes!
                </p>
              ) : (
                reviewQs.map((q) => {
                  const picked = answers[q.id];
                  const ok = picked === q.correct;
                  const opts = lang === "hi" ? q.optionsHi : q.optionsEn;
                  return (
                    <div key={q.id} className="rounded-xl border border-slate-200 p-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-[#0B1B3D]">Q{q.id} &bull; {q.subject}</span>
                        {ok ? (
                          <span className="inline-flex items-center gap-0.5 text-green-700 font-bold"><CheckCircle2 className="w-3 h-3" /> Right</span>
                        ) : picked ? (
                          <span className="inline-flex items-center gap-0.5 text-[#E60000] font-bold"><XCircle className="w-3 h-3" /> Yours: {picked}</span>
                        ) : (
                          <span className="text-slate-500 font-bold">Skipped</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 leading-snug">{lang === "hi" ? q.questionHi : q.questionEn}</p>
                      <p className="text-green-800 font-bold">
                        {lang === "hi" ? "सही उत्तर:" : "Answer:"} ({q.correct}) {opts?.[q.correct]}
                      </p>
                      <p className="bg-amber-50 border border-amber-200 rounded p-1.5 text-slate-700 leading-snug">
                        {lang === "hi" ? q.explanationHi : q.explanationEn}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {!submitted && questions.length > 0 ? (
          <>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={idx >= questions.length - 1}
                onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B1B3D] text-white text-[11px] font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-3.5 py-1.5 rounded-lg bg-[#E60000] hover:bg-red-700 text-white text-[11px] font-extrabold transition"
            >
              Submit Quiz
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2 w-full">
            {selectedMeta?.englishPdfUrl && (
              <a
                href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.englishPdfUrl)}`}
                download
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 bg-[#0B1B3D] text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" /> English PDF
              </a>
            )}
            {selectedMeta?.hindiPdfUrl && (
              <a
                href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.hindiPdfUrl)}`}
                download
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 bg-[#E60000] text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg hover:bg-red-700"
              >
                <Download className="w-3.5 h-3.5" /> Hindi PDF
              </a>
            )}
            {!selectedMeta && (
              <span className="text-[11px] font-semibold text-slate-500">Auto-updates daily at 7:00 AM IST</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
