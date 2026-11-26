"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Download, PlayCircle } from "lucide-react";

interface DailyTestMeta {
  id: string;
  date: string;
  title: string;
  totalQuestions: number;
  jsonUrl: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
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

export default function DailyNcertSeriesFeed() {
  const [tests, setTests] = useState<DailyTestMeta[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number; total: number }>>({});

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
              const p = JSON.parse(raw);
              if (p.submitted) sc[t.date] = { score: p.score, total: p.total };
            }
          } catch {}
        });
        setScores(sc);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (tests.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="inline-block bg-red-50 text-[#E60000] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Auto-Synced Daily 7:00 AM IST
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">
            Daily Live NCERT Quiz Series ({tests.length})
          </h2>
        </div>
        <Link
          href="/daily-practice-test"
          className="text-xs font-extrabold text-[#E60000] hover:underline"
        >
          Open Full Archive &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((t) => {
          const sc = scores[t.date];
          return (
            <div
              key={t.date}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0B1B3D] text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3 h-3 text-[#E60000]" /> {fmtDate(t.date)}
                  </span>
                  {sc ? (
                    <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      Score: {sc.score}/{sc.total}
                    </span>
                  ) : (
                    <span className="bg-red-50 text-[#E60000] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {t.totalQuestions || 20} MCQs
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#0B1B3D] mt-3 leading-snug">
                  {t.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  English &amp; हिन्दी &bull; +1 / -1/3 Negative &bull; Detailed Analysis
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Link
                  href={`/daily-practice-test?date=${encodeURIComponent(t.date)}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl transition"
                >
                  <PlayCircle className="w-4 h-4" /> {sc ? "Review / Re-Attempt" : "Start Live Test"}
                </Link>
                <div className="flex items-center gap-2">
                  {t.englishPdfUrl && (
                    <a
                      href={`/api/download-pdf?url=${encodeURIComponent(t.englishPdfUrl)}`}
                      download
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-[11px] font-extrabold py-1.5 px-2 rounded-lg transition"
                    >
                      <Download className="w-3 h-3" /> English PDF
                    </a>
                  )}
                  {t.hindiPdfUrl && (
                    <a
                      href={`/api/download-pdf?url=${encodeURIComponent(t.hindiPdfUrl)}`}
                      download
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-[#E60000] text-[11px] font-extrabold py-1.5 px-2 rounded-lg transition"
                    >
                      <Download className="w-3 h-3" /> Hindi PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
