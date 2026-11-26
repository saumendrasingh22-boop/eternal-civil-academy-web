"use client";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";
import DailyNcertSeriesFeed from "@/components/DailyNcertSeriesFeed";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CBT_QUESTIONS } from "@/lib/siteData";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import { loadLiveTests, DEFAULT_LIVE_TESTS, LiveMockTestItem } from "@/lib/liveTestsStore";
import DualPdfButton from "@/components/DualPdfButton";
import UpiUnlockModal from "@/components/UpiUnlockModal";
import { CheckCircle2, Clock, Send, AlertCircle, Languages } from "lucide-react";

export default function TestSeriesPage() {
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [liveTests, setLiveTests] = useState<LiveMockTestItem[]>(DEFAULT_LIVE_TESTS);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const syncLocal = () => setLiveTests(loadLiveTests().filter((t) => t.isActive));
    syncLocal();

    // Also pull live Telegram-synced quizzes from Supabase API (deduplicated by slug)
    fetch("/api/telegram-quiz-sync?list=quizzes")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.quizzes) && d.quizzes.length > 0) {
          const local = loadLiveTests().filter((t) => t.isActive);
          const seenSlugs = new Set(local.map((t) => t.slug));
          const remoteMapped: LiveMockTestItem[] = d.quizzes
            .filter((q: any) => q.slug && !seenSlugs.has(q.slug))
            .map((q: any) => ({
              id: q.id || q.slug,
              slug: q.slug,
              title: q.title,
              examTag: q.exam_tag || "UPSC / PCS",
              seriesType: q.series_type === "paid_series" ? "paid_series" : "free_live",
              source: q.source_channel === "telegram_bot" ? "telegram_bot" : "website",
              durationMinutes: q.duration_minutes || 15,
              priceInr: Number(q.price_inr) || 0,
              date: (q.created_at || "").slice(0, 10) || "Live",
              questions: Array.isArray(q.questions_json) && q.questions_json.length > 0 ? q.questions_json : CBT_QUESTIONS,
              isActive: true,
              uploadedBy: "telegram_bot",
            }));
          if (remoteMapped.length > 0) {
            setLiveTests([...remoteMapped, ...local]);
          }
        }
      })
      .catch(() => {});

    const upiHandler = () => setRefreshTick((t) => t + 1);
    window.addEventListener("eca-upi-orders-updated", upiHandler);
    window.addEventListener("eca-live-tests-updated", syncLocal);
    return () => {
      window.removeEventListener("eca-upi-orders-updated", upiHandler);
      window.removeEventListener("eca-live-tests-updated", syncLocal);
    };
  }, []);

  const paidSeriesList = [
    {
      id: "ts-upsc-2027",
      title: "UPSC CSE Prelims 2027 — Full Length Test Series (30 Tests)",
      exam: "UPSC",
      price: 499,
      testsCount: "30 CBT Tests + Solutions (English & Hindi)",
    },
    {
      id: "ts-uppsc-2026",
      title: "UPPSC PCS Prelims 2026 — GS + CSAT Test Series (25 Tests)",
      exam: "UPPSC",
      price: 399,
      testsCount: "25 CBT Tests + UP Special (English & Hindi)",
    },
    {
      id: "ts-bpsc-71",
      title: "71st BPSC Prelims — Complete Test Series (20 Tests)",
      exam: "BPSC",
      price: 349,
      testsCount: "20 CBT Tests + Bihar Special (English & Hindi)",
    },
  ];

  const freeLiveTests = liveTests.filter((t) => t.seriesType === "free_live");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" data-tick={refreshTick}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Test Series
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab("free")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === "free"
                  ? "bg-[#E60000] text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Free Live Test Series
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === "paid"
                  ? "bg-[#0B1B3D] text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Paid Test Series
            </button>
          </div>
        </div>
      </div>

      {activeTab === "free" && <DailyNcertSeriesFeed />}
        {activeTab === "free" ? (
        <div className="space-y-6">
          <div className="bg-[#0B1B3D] text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold">
                  Telegram Quiz Mistakes
                </h2>
                <p className="text-xs text-slate-300">
                  Review wrong questions from Telegram Bot quizzes & download Mistakes PDF (English / Hindi)
                </p>
              </div>
            </div>
            <Link
              href="/test-series/mistakes"
              className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
            >
              See Mistakes →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freeLiveTests.map((test, idx) => (
              <div
                key={test.id}
                className={`bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
                  idx === 0 ? "border-2 border-[#E60000]/35" : "border border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    {test.source === "telegram_bot" ? (
                      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 font-extrabold px-2.5 py-1 rounded-full">
                        <Send className="w-3 h-3" /> Telegram Live Quiz
                      </span>
                    ) : (
                      <span className="bg-red-100 text-[#E60000] font-extrabold px-3 py-1 rounded-full">
                        LIVE MOCK TEST
                      </span>
                    )}
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {test.durationMinutes} Mins • {test.questions.length} MCQs
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">
                    {test.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {test.examTag} • English & हिन्दी • Mistakes + Solution + Question Paper PDF
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/test-series/live-cbt?quiz=${encodeURIComponent(test.id)}&lang=${lang}`}
                    className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    Start Live Test →
                  </Link>
                  {test.source === "telegram_bot" ? (
                    <Link
                      href={`/test-series/mistakes?quiz=${encodeURIComponent(test.id)}`}
                      className="bg-red-50 hover:bg-red-100 text-[#E60000] text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
                    >
                      See Mistakes
                    </Link>
                  ) : (
                    <DualPdfButton title={test.title} compact />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paidSeriesList.map((series) => {
            const unlockState = getItemUnlockState(series.id);
            return (
              <div
                key={series.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="bg-blue-50 text-[#0B1B3D] font-extrabold px-2.5 py-1 rounded">
                      {series.exam}
                    </span>
                    <span className="text-base font-extrabold text-[#E60000]">
                      ₹{series.price}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#0B1B3D]">{series.title}</h2>
                  <p className="text-xs text-slate-600 mt-2">{series.testsCount}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {unlockState.status === "approved" ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked
                      </span>
                      <Link
                        href={`/test-series/live-cbt?lang=${lang}`}
                        className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2 rounded-xl"
                      >
                        Open Tests →
                      </Link>
                    </div>
                  ) : (
                    <UpiUnlockModal
                      itemId={series.id}
                      itemType="test_series"
                      itemTitle={series.title}
                      priceInr={series.price}
                      unlockStatus={unlockState.status}
                      pendingUtr={unlockState.utr}
                      buttonLabel="Buy via UPI"
                      onOrderSubmitted={() => setRefreshTick((t) => t + 1)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
          <LiveAdminSectionFeed sectionMatch="Test Series" />
    </div>
  );
}
