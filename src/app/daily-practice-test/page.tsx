"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Languages,
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

interface DailyTestPayload {
  date: string;
  title: string;
  questions: DailyQuestion[];
}

interface SavedAttempt {
  answers: Record<number, "A" | "B" | "C" | "D">;
  submitted: boolean;
  score: number;
  total: number;
  completedAt: string;
}

const STORAGE_PREFIX = "eca_daily_25mcq_attempt_v1_";

function formatDateLabel(iso: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export default function DailyPracticeTestPage() {
  const [tests, setTests] = useState<DailyTestMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<DailyTestMeta | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  const [testData, setTestData] = useState<DailyTestPayload | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [analysisFilter, setAnalysisFilter] = useState<"all" | "mistakes" | "skipped" | "correct">("all");
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
        const scores: Record<string, { score: number; total: number }> = {};
        sorted.forEach((t) => {
          try {
            const raw = localStorage.getItem(STORAGE_PREFIX + t.date);
            if (raw) {
              const parsed: SavedAttempt = JSON.parse(raw);
              if (parsed.submitted) scores[t.date] = { score: parsed.score, total: parsed.total };
            }
          } catch {}
        });
        setSavedScores(scores);
        if (sorted.length > 0) setSelectedMeta(sorted[0]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMeta?.jsonUrl) return;
    let active = true;
    setLoadingTest(true);
    setTestData(null);
    setCurrentIdx(0);
    setAnalysisFilter("all");

    fetch("/api/daily-test-data?url=" + encodeURIComponent(selectedMeta.jsonUrl), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DailyTestPayload | null) => {
        if (!active || !data || !Array.isArray(data.questions)) return;
        setTestData(data);
        try {
          const raw = localStorage.getItem(STORAGE_PREFIX + selectedMeta.date);
          if (raw) {
            const saved: SavedAttempt = JSON.parse(raw);
            setAnswers(saved.answers || {});
            setSubmitted(Boolean(saved.submitted));
            setSecondsLeft(20 * 60);
            return;
          }
        } catch {}
        setAnswers({});
        setSubmitted(false);
        setSecondsLeft(20 * 60);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingTest(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMeta]);

  useEffect(() => {
    if (!testData || submitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [testData, submitted]);

  const handleSubmit = () => {
    if (!testData || !selectedMeta) return;
    let correctCount = 0, wrongCount = 0;
    testData.questions.forEach((q) => {
      const picked = answers[q.id];
      if (picked === q.correct) correctCount += 1;
      else if (picked) wrongCount += 1;
    });
    const netScore = Number((correctCount - wrongCount / 3).toFixed(2));
    const payload: SavedAttempt = {
      answers,
      submitted: true,
      score: netScore,
      total: testData.questions.length,
      completedAt: new Date().toISOString(),
    };
    setSubmitted(true);
    setAnalysisFilter("all");
    setSavedScores((prev) => ({
      ...prev,
      [selectedMeta.date]: { score: netScore, total: testData.questions.length },
    }));
    try {
      localStorage.setItem(STORAGE_PREFIX + selectedMeta.date, JSON.stringify(payload));
    } catch {}
  };

  const handleReattempt = () => {
    if (!selectedMeta) return;
    setAnswers({});
    setSubmitted(false);
    setCurrentIdx(0);
    setSecondsLeft(20 * 60);
    setAnalysisFilter("all");
    try {
      localStorage.removeItem(STORAGE_PREFIX + selectedMeta.date);
    } catch {}
  };

  const stats = useMemo(() => {
    if (!testData) return { correct: 0, wrong: 0, skipped: 0, accuracy: 0, netScore: 0, penalty: 0, bySubject: [] as { subject: string; correct: number; total: number }[] };
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const subMap: Record<string, { correct: number; total: number }> = {};

    testData.questions.forEach((q) => {
      const sub = q.subject || "General Studies";
      if (!subMap[sub]) subMap[sub] = { correct: 0, total: 0 };
      subMap[sub].total += 1;
      const picked = answers[q.id];
      if (!picked) skipped += 1;
      else if (picked === q.correct) {
        correct += 1;
        subMap[sub].correct += 1;
      } else {
        wrong += 1;
      }
    });

    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const bySubject = Object.entries(subMap).map(([subject, v]) => ({ subject, ...v }));
    const penalty = Number((wrong / 3).toFixed(2));
    const netScore = Number((correct - wrong / 3).toFixed(2));
    return { correct, wrong, skipped, accuracy, netScore, penalty, bySubject };
  }, [testData, answers]);

  const filteredQuestions = useMemo(() => {
    if (!testData) return [];
    return testData.questions.filter((q) => {
      const picked = answers[q.id];
      if (analysisFilter === "mistakes") return Boolean(picked && picked !== q.correct);
      if (analysisFilter === "skipped") return !picked;
      if (analysisFilter === "correct") return picked === q.correct;
      return true;
    });
  }, [testData, answers, analysisFilter]);

  const visibleTests = useMemo(() => {
    if (!dateFilter) return tests;
    return tests.filter((t) => t.date === dateFilter);
  }, [tests, dateFilter]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const activeQ = testData?.questions?.[currentIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Daily 7:00 AM Live NCERT Quiz
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Daily NCERT Quiz (20 MCQs) &amp; Past Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            20 Subject-wise Class 6-12 NCERT MCQs every morning at 7:00 AM IST (+1 Correct, -1/3 Negative Marking). Attempt today&apos;s or any past date quiz anytime.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
              lang === "en" ? "bg-[#0B1B3D] text-white border-[#0B1B3D]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Languages className="w-3.5 h-3.5" /> English
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
              lang === "hi" ? "bg-[#0B1B3D] text-white border-[#0B1B3D]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E60000]" /> All NCERT Quizzes ({tests.length})
              </h2>
              {dateFilter && (
                <button type="button" onClick={() => setDateFilter("")} className="text-[11px] font-bold text-[#E60000] hover:underline">
                  Reset
                </button>
              )}
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B1B3D]"
            />
            {loadingList ? (
              <p className="text-xs text-slate-500 py-4 text-center">Loading daily tests...</p>
            ) : visibleTests.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No tests available yet. Daily NCERT Quiz auto-publishes at 7:00 AM IST.
              </p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {visibleTests.map((t) => {
                  const isSel = selectedMeta?.date === t.date;
                  const done = savedScores[t.date];
                  return (
                    <button
                      key={t.date}
                      type="button"
                      onClick={() => setSelectedMeta(t)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        isSel
                          ? "bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm"
                          : "bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold">{formatDateLabel(t.date)}</span>
                        {done ? (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isSel ? "bg-green-500 text-white" : "bg-green-100 text-green-800"}`}>
                            Score: {done.score}/{done.total}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSel ? "bg-white/15 text-white" : "bg-red-50 text-[#E60000]"}`}>
                            20 MCQs
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-1 line-clamp-1 ${isSel ? "text-slate-200" : "text-slate-600"}`}>
                        {t.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-5">
          {!selectedMeta ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-base font-bold text-[#0B1B3D]">Daily NCERT Quiz Launches at 7:00 AM IST</p>
              <p className="text-xs text-slate-600 mt-1">Select any date from the left archive to attempt the full 20-MCQ NCERT quiz and download branded PDFs.</p>
            </div>
          ) : loadingTest || !testData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Loading 20 MCQs for {formatDateLabel(selectedMeta.date)}...
            </div>
          ) : !submitted ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">
                    {selectedMeta.title} ({formatDateLabel(selectedMeta.date)})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Answered: {Object.keys(answers).length} / {testData.questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-[#0B1B3D] text-xs font-extrabold px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-[#E60000]" /> {mins}:{secs}
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition"
                  >
                    Submit Test
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {testData.questions.map((q, idx) => {
                  const answered = Boolean(answers[q.id]);
                  const active = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-extrabold border transition ${
                        active
                          ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                          : answered
                            ? "bg-green-50 text-green-800 border-green-300"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {activeQ && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-blue-50 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                      Q{currentIdx + 1} &bull; {activeQ.subject}
                    </span>
                    {answers[activeQ.id] && (
                      <button
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => {
                            const cp = { ...prev };
                            delete cp[activeQ.id];
                            return cp;
                          })
                        }
                        className="text-[11px] font-bold text-slate-500 hover:text-[#E60000]"
                      >
                        Clear Choice
                      </button>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {lang === "hi" ? activeQ.questionHi : activeQ.questionEn}
                  </p>
                  <div className="space-y-2.5">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const picked = answers[activeQ.id] === opt;
                      const txt = lang === "hi" ? activeQ.optionsHi?.[opt] : activeQ.optionsEn?.[opt];
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [activeQ.id]: opt }))}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-start gap-3 ${
                            picked
                              ? "border-[#0B1B3D] bg-blue-50/70 text-[#0B1B3D] font-bold"
                              : "border-slate-200 hover:border-slate-300 text-slate-800 bg-white"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
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
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
                    >
                      &larr; Previous
                    </button>
                    {currentIdx < testData.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((i) => Math.min(testData.questions.length - 1, i + 1))}
                        className="px-5 py-2 rounded-xl bg-[#0B1B3D] text-white text-xs font-extrabold hover:bg-slate-800"
                      >
                        Next &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded-xl bg-[#E60000] text-white text-xs font-extrabold hover:bg-red-700"
                      >
                        Submit &amp; View Analysis
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-6 h-6 text-[#E60000]" />
                    <div>
                      <h2 className="text-lg font-extrabold text-[#0B1B3D]">
                        Result &amp; Performance Analysis
                      </h2>
                      <p className="text-xs text-slate-500">{formatDateLabel(selectedMeta.date)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReattempt}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-Attempt
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50/70 rounded-xl p-3.5 text-center border border-blue-100">
                    <p className="text-[11px] font-bold text-slate-600">Net Score (-1/3)</p>
                    <p className="text-xl font-extrabold text-[#0B1B3D] mt-0.5">{stats.netScore}/{testData.questions.length}</p>
                    <p className="text-[10px] font-semibold text-slate-500">Penalty: -{stats.penalty}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3.5 text-center border border-green-100">
                    <p className="text-[11px] font-bold text-green-700">Correct</p>
                    <p className="text-xl font-extrabold text-green-700 mt-0.5">{stats.correct}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3.5 text-center border border-red-100">
                    <p className="text-[11px] font-bold text-[#E60000]">Mistakes</p>
                    <p className="text-xl font-extrabold text-[#E60000] mt-0.5">{stats.wrong}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-600">Accuracy</p>
                    <p className="text-xl font-extrabold text-[#0B1B3D] mt-0.5">{stats.accuracy}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {selectedMeta.englishPdfUrl && (
                    <a
                      href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.englishPdfUrl)}`}
                      download
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
                    >
                      <Download className="w-4 h-4" /> Download English PDF
                    </a>
                  )}
                  {selectedMeta.hindiPdfUrl && (
                    <a
                      href={`/api/download-pdf?url=${encodeURIComponent(selectedMeta.hindiPdfUrl)}`}
                      download
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
                    >
                      <Download className="w-4 h-4" /> Download Hindi PDF
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-extrabold text-[#0B1B3D] mb-2">Subject-wise Breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.bySubject.map((s) => (
                      <span key={s.subject} className="text-[11px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {s.subject}: {s.correct}/{s.total}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-[#E60000]" /> Detailed Question Analysis
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ["all", `Full Analysis (${testData.questions.length})`],
                        ["mistakes", `See Mistakes Only (${stats.wrong})`],
                        ["skipped", `Skipped (${stats.skipped})`],
                        ["correct", `Correct (${stats.correct})`],
                      ] as const
                    ).map(([k, lbl]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAnalysisFilter(k)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition ${
                          analysisFilter === k
                            ? k === "mistakes"
                              ? "bg-[#E60000] text-white border-[#E60000]"
                              : "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No questions in this filter.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => {
                      const picked = answers[q.id];
                      const isCorrect = picked === q.correct;
                      const opts = lang === "hi" ? q.optionsHi : q.optionsEn;
                      return (
                        <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-[#0B1B3D] bg-blue-50 px-2.5 py-0.5 rounded">
                              Q{q.id} &bull; {q.subject}
                            </span>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-green-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : picked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#E60000]">
                                <XCircle className="w-3.5 h-3.5" /> Wrong (Your Answer: {picked})
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500">Skipped</span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 whitespace-pre-line">
                            {lang === "hi" ? q.questionHi : q.questionEn}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {(["A", "B", "C", "D"] as const).map((o) => {
                              const right = q.correct === o;
                              const wrongPick = picked === o && !right;
                              return (
                                <div
                                  key={o}
                                  className={`px-3 py-2 rounded-lg border ${
                                    right
                                      ? "bg-green-50 border-green-400 text-green-900 font-bold"
                                      : wrongPick
                                        ? "bg-red-50 border-red-400 text-red-900 font-bold"
                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <span className="font-extrabold mr-1.5">{o}.</span>
                                  {opts?.[o]}
                                </div>
                              );
                            })}
                          </div>
                          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed">
                            <span className="font-extrabold text-[#0B1B3D]">
                              {lang === "hi" ? "व्याख्या: " : "Explanation: "}
                            </span>
                            {lang === "hi" ? q.explanationHi : q.explanationEn}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
