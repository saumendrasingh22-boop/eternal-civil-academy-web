"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SAMPLE_TELEGRAM_MISTAKES } from "@/lib/siteData";
import { exportMistakesPdfReport } from "@/lib/mistakesPdfExport";
import { Send, Download, ArrowLeft, AlertCircle, Languages } from "lucide-react";

export default function TelegramQuizMistakesPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [attemptCode, setAttemptCode] = useState("TG-ATTEMPT-142");
  const [mistakes, setMistakes] = useState(SAMPLE_TELEGRAM_MISTAKES);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const attempt = params.get("attempt");
    const user = params.get("user");
    if (attempt) setAttemptCode(attempt);

    if (attempt || user) {
      fetch(`/api/telegram-quiz-sync?attempt=${attempt || ""}&user=${user || ""}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.mistakes && Array.isArray(data.mistakes) && data.mistakes.length > 0) {
            setMistakes(data.mistakes);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/test-series"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Free Live Test Series
      </Link>

      <div className="bg-white rounded-2xl border-2 border-[#0B1B3D] p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-900 text-xs font-extrabold px-3 py-1 rounded-full">
              <Send className="w-3.5 h-3.5 text-sky-600" /> Telegram Bot Quiz • {attemptCode}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D] mt-2">
              See Mistakes ({mistakes.length})
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-extrabold px-3 py-2 rounded-xl"
            >
              <Languages className="w-4 h-4" />
              <span>{lang === "en" ? "Hindi" : "English"}</span>
            </button>

            <button
              onClick={() =>
                exportMistakesPdfReport(`Telegram Quiz Mistakes (${attemptCode})`, mistakes, "en")
              }
              className="inline-flex items-center gap-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" /> English PDF
            </button>

            <button
              onClick={() =>
                exportMistakesPdfReport(`Telegram Quiz Mistakes (${attemptCode})`, mistakes, "hi")
              }
              className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" /> Hindi PDF
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {mistakes.map((m, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl border border-red-200 bg-red-50/30"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-[#0B1B3D]">
                  Mistake #{idx + 1} (Q.{m.questionNo}) • {m.subject}
                </span>
                <span className="inline-flex items-center gap-1 bg-red-100 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" /> Wrong
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900">
                {lang === "hi" ? m.questionHi : m.questionEn}
              </p>

              <div className="mt-2.5 space-y-1 text-xs">
                <p className="text-[#E60000] font-bold">Your Answer: {m.yourChoice}</p>
                <p className="text-emerald-700 font-bold">Correct Answer: {m.correctChoice}</p>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                <strong>Explanation:</strong> {lang === "hi" ? m.explanationHi : m.explanationEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
