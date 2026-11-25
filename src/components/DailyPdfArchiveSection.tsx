"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Download, FileText, RotateCcw } from "lucide-react";

interface DailyPdfItem {
  id: string;
  date: string;
  title: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
  source?: string;
}

function formatReadableDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function DailyPdfArchiveSection() {
  const [items, setItems] = useState<DailyPdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const merged: DailyPdfItem[] = [];
      const seen = new Set<string>();

      try {
        const res = await fetch("/api/daily-pdf-sync?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.items)) {
            for (const x of json.items) {
              const k = `${x.date}::${x.title}`;
              if (!seen.has(k)) {
                seen.add(k);
                merged.push(x);
              }
            }
          }
        }
      } catch {}

      try {
        const raw = window.localStorage.getItem("eca_custom_content_v1");
        const local = raw ? JSON.parse(raw) : [];
        if (Array.isArray(local)) {
          for (const c of local) {
            const sec = String(c?.section || "").toLowerCase();
            if (!sec.includes("daily") && !sec.includes("current affairs")) continue;
            const d = String(c?.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
            const title = String(c?.title || `Daily Current Affairs PDF - ${d}`);
            const k = `${d}::${title}`;
            if (!seen.has(k)) {
              seen.add(k);
              merged.push({
                id: String(c?.id || k),
                date: d,
                title,
                englishPdfUrl: String(c?.englishPdfUrl || ""),
                hindiPdfUrl: String(c?.hindiPdfUrl || ""),
                source: "admin",
              });
            }
          }
        }
      } catch {}

      merged.sort((a, b) => b.date.localeCompare(a.date));
      setItems(merged);
      setLoading(false);
    };

    loadAll();
    window.addEventListener("eca-custom-content-updated", loadAll);
    return () => window.removeEventListener("eca-custom-content-updated", loadAll);
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.date && it.date.length >= 7) set.add(it.date.slice(0, 7));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (selectedDate && it.date !== selectedDate) return false;
      if (!selectedDate && selectedMonth && !it.date.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [items, selectedDate, selectedMonth]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E60000]" /> Daily Current Affairs PDF Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by exact date or browse full month English &amp; Hindi daily PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-600">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setSelectedMonth("");
                }}
                className="text-xs font-bold text-[#0B1B3D] bg-transparent focus:outline-none"
              />
            </div>

            {(selectedDate || selectedMonth) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedMonth("");
                }}
                className="bg-red-50 hover:bg-red-100 text-[#E60000] text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {availableMonths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDate("");
                setSelectedMonth("");
              }}
              className={!selectedDate && !selectedMonth ? "px-3 py-1 rounded-lg text-xs font-bold bg-[#0B1B3D] text-white" : "px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"}
            >
              All Dates ({items.length})
            </button>
            {availableMonths.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedMonth(m);
                }}
                className={selectedMonth === m ? "px-3 py-1 rounded-lg text-xs font-bold bg-[#E60000] text-white" : "px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs font-bold text-slate-500">
          Loading Daily PDFs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-1">
          <FileText className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-extrabold text-[#0B1B3D]">
            {selectedDate ? `No Daily PDF found for ${formatReadableDate(selectedDate)}` : "No Daily PDFs uploaded yet"}
          </p>
          <p className="text-xs text-slate-500">
            Daily Current Affairs PDFs uploaded via Admin or Telegram Bot appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded">
                  {formatReadableDate(item.date)}
                </span>
                <h3 className="text-sm font-extrabold text-[#0B1B3D] mt-1.5">
                  {item.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.englishPdfUrl && (
                  <a
                    href={`/api/download-pdf?url=${encodeURIComponent(item.englishPdfUrl)}`}
                    download rel="noopener noreferrer"
                    className="bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> English PDF
                  </a>
                )}
                {item.hindiPdfUrl && (
                  <a
                    href={`/api/download-pdf?url=${encodeURIComponent(item.hindiPdfUrl)}`}
                    download rel="noopener noreferrer"
                    className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Hindi PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
