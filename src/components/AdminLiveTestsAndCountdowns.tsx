"use client";

import React, { useState, useEffect } from "react";
import { CalendarClock, FileCheck2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  loadNoCodeCms,
  saveNoCodeCms,
  DEFAULT_EXAM_COUNTDOWNS,
  ExamCountdownItem,
} from "@/lib/noCodeCmsStore";
import {
  loadLiveTests,
  saveLiveTests,
  DEFAULT_LIVE_TESTS,
  LiveMockTestItem,
} from "@/lib/liveTestsStore";
import { CBT_QUESTIONS, BilingualCbtQuestion } from "@/lib/siteData";

interface Props {
  canManageContent: boolean;
  canManageSiteSettings: boolean;
}

export default function AdminLiveTestsAndCountdowns({
  canManageContent,
  canManageSiteSettings,
}: Props) {
  const [countdowns, setCountdowns] = useState<ExamCountdownItem[]>(DEFAULT_EXAM_COUNTDOWNS);
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("2027-05-23");

  const [tests, setTests] = useState<LiveMockTestItem[]>(DEFAULT_LIVE_TESTS);
  const [testTitle, setTestTitle] = useState("");
  const [testExamTag, setTestExamTag] = useState("UPSC / UPPSC");
  const [testDuration, setTestDuration] = useState("20");
  const [bulkJson, setBulkJson] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const syncCms = () => setCountdowns(loadNoCodeCms().examCountdowns);
    const syncTests = () => setTests(loadLiveTests());
    syncCms();
    syncTests();
    window.addEventListener("eca-nocode-cms-updated", syncCms);
    window.addEventListener("eca-live-tests-updated", syncTests);
    return () => {
      window.removeEventListener("eca-nocode-cms-updated", syncCms);
      window.removeEventListener("eca-live-tests-updated", syncTests);
    };
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const handleAddCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;
    const cms = loadNoCodeCms();
    const next: ExamCountdownItem[] = [
      {
        id: `cd-${Date.now()}`,
        title: examTitle.trim(),
        examDate,
        active: true,
      },
      ...cms.examCountdowns,
    ];
    saveNoCodeCms({ ...cms, examCountdowns: next });
    setCountdowns(next);
    setExamTitle("");
    flash("New Exam Countdown Started!");
  };

  const handleToggleCountdown = (id: string) => {
    const cms = loadNoCodeCms();
    const next = cms.examCountdowns.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    saveNoCodeCms({ ...cms, examCountdowns: next });
    setCountdowns(next);
  };

  const handleDeleteCountdown = (id: string) => {
    const cms = loadNoCodeCms();
    const next = cms.examCountdowns.filter((c) => c.id !== id);
    saveNoCodeCms({ ...cms, examCountdowns: next });
    setCountdowns(next);
  };

  const handleCreateLiveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    let parsedQuestions: BilingualCbtQuestion[] = CBT_QUESTIONS;
    if (bulkJson.trim()) {
      try {
        const arr = JSON.parse(bulkJson);
        if (Array.isArray(arr) && arr.length > 0) {
          parsedQuestions = arr.map((q: any, idx: number) => ({
            id: idx + 1,
            subject: q.subject || "General Studies",
            questionEn: q.questionEn || q.question || `Question ${idx + 1}`,
            questionHi: q.questionHi || q.questionEn || q.question || `प्रश्न ${idx + 1}`,
            optionsEn: q.optionsEn || q.options || { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
            optionsHi: q.optionsHi || q.optionsEn || q.options || { A: "विकल्प A", B: "विकल्प B", C: "विकल्प C", D: "विकल्प D" },
            correct: (["A", "B", "C", "D"].includes(q.correct) ? q.correct : "A") as "A" | "B" | "C" | "D",
            explanationEn: q.explanationEn || q.explanation || "Detailed explanation.",
            explanationHi: q.explanationHi || q.explanationEn || q.explanation || "विस्तृत व्याख्या।",
          }));
        }
      } catch {
        flash("Invalid JSON format — used default bilingual question set.");
      }
    }

    const slug =
      testTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) + `-${Date.now().toString().slice(-4)}`;

    const newTest: LiveMockTestItem = {
      id: `live-${Date.now()}`,
      slug,
      title: testTitle.trim(),
      examTag: testExamTag.trim() || "UPSC / PCS",
      seriesType: "free_live",
      source: "website",
      durationMinutes: Math.max(5, Number(testDuration) || 20),
      priceInr: 0,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      questions: parsedQuestions,
      isActive: true,
      uploadedBy: "admin",
    };

    const next = [newTest, ...tests];
    setTests(next);
    saveLiveTests(next);
    setTestTitle("");
    setBulkJson("");
    flash(`Live Mock Test "${newTest.title}" Published!`);
  };

  if (!canManageContent && !canManageSiteSettings) return null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#0B1B3D] text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-yellow-400" /> {toast}
        </div>
      )}

      {/* A. DYNAMIC EXAM COUNTDOWN MANAGER (Super Admin & Admin) */}
      <div className="bg-white rounded-2xl border-2 border-[#E60000]/20 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-[#0B1B3D] mb-1 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#E60000]" /> Exam Countdown Manager (Super Admin & Admin)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Add any upcoming exam with its exact exam date — the live countdown automatically starts on the website.
        </p>

        <form onSubmit={handleAddCountdown} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-4">
          <input
            type="text"
            placeholder="Exam Title (e.g. BPSC 71st Prelims)"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="sm:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            required
          />
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            required
          />
          <button
            type="submit"
            className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold rounded-xl py-2 flex items-center justify-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Start Countdown
          </button>
        </form>

        <div className="space-y-2">
          {countdowns.map((cd) => (
            <div
              key={cd.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs"
            >
              <div>
                <span className="font-extrabold text-[#0B1B3D]">{cd.title}</span>
                <span className="ml-2 font-mono text-slate-500">Target Date: {cd.examDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCountdown(cd.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    cd.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cd.active ? "Active" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCountdown(cd.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-[#E60000]"
                  title="Delete Countdown"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* B. LIVE MOCK TEST CREATOR & MANAGER (Super Admin & Delegated Content Admins) */}
      {canManageContent && (
        <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-1 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#E60000]" /> Live Mock Test Creator & Manager (CBT Portal)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Create & publish new Bilingual Live Mock Tests directly to /test-series and /test-series/live-cbt.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateLiveTest}
              className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Live Test Title (e.g. UPPSC 2026 Full Mock #1)"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Exam Tag (UPSC / UPPSC)"
                  value={testExamTag}
                  onChange={(e) => setTestExamTag(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="number"
                  min={5}
                  placeholder="Duration (Mins)"
                  value={testDuration}
                  onChange={(e) => setTestDuration(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                />
              </div>
              <textarea
                rows={4}
                placeholder='Optional Questions JSON array: [{"subject":"Polity","questionEn":"...","questionHi":"...","optionsEn":{"A":"..","B":"..","C":"..","D":".."},"correct":"B","explanationEn":"..."}] (Leave blank to test with built-in bilingual questions)'
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-[11px] font-mono bg-white"
              />
              <button
                type="submit"
                className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Publish Live CBT Test
              </button>
            </form>

            <div className="lg:col-span-7 space-y-2.5">
              <div className="text-xs font-extrabold text-slate-500 uppercase">
                Live & Synced Tests ({tests.length})
              </div>
              {tests.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="bg-[#0B1B3D] text-white font-bold px-2 py-0.5 rounded">
                        {t.examTag}
                      </span>
                      <span className="bg-blue-50 text-[#0B1B3D] font-bold px-2 py-0.5 rounded">
                        {t.questions.length} MCQs • {t.durationMinutes} Mins
                      </span>
                      <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                        {t.source.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3D] mt-1 truncate">
                      {t.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = tests.map((x) =>
                          x.id === t.id ? { ...x, isActive: !x.isActive } : x
                        );
                        setTests(next);
                        saveLiveTests(next);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        t.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {t.isActive ? "Live" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = tests.filter((x) => x.id !== t.id);
                        setTests(next);
                        saveLiveTests(next);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-[#E60000]"
                      title="Delete Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
