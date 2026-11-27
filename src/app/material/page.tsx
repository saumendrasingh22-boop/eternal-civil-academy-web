"use client";
import SmartQuizzesFeed from "@/components/SmartQuizzesFeed";
import LiveAdminSectionFeed from "@/components/LiveAdminSectionFeed";

import React, { useState, useEffect } from "react";
import {
  NCERT_SUBJECTS,
  NCERT_CLASSES,
  PREMIUM_BOOK_COVERS,
  BookCoverItem,
} from "@/lib/siteData";
import { loadPremiumBooks } from "@/lib/premiumBooksStore";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import DualPdfButton from "@/components/DualPdfButton";
import DailyPdfArchiveSection from "@/components/DailyPdfArchiveSection";
import UpiUnlockModal from "@/components/UpiUnlockModal";
import { CheckCircle2, Languages } from "lucide-react";

export default function MaterialPage() {
  const [subTab, setSubTab] = useState<
    "ncert-books" | "ncert-crux" | "editorial" | "daily-pdf" | "essay-material" | "premium-notes"
  >("ncert-books");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [selectedSubject, setSelectedSubject] = useState<string>("History");
  const [selectedClass, setSelectedClass] = useState<string>("Class 6");
  const [refreshTick, setRefreshTick] = useState(0);
  const [premiumBooks, setPremiumBooks] = useState<BookCoverItem[]>(PREMIUM_BOOK_COVERS);

  useEffect(() => {
    const normalize = (arr: any[]) => arr.map((b: any) => ({ ...b, priceInr: Number(b?.priceInr || 0), isPaid: Number(b?.priceInr || 0) > 0 }));
    const loadBooks = () => {
      try {
        const raw = window.localStorage.getItem("eca_premium_books_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setPremiumBooks(normalize(parsed));
        }
      } catch {}
    };
    loadBooks();
    fetch("/api/cms-state?key=premium_books&_t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.synced && Array.isArray(d.value)) {
          const norm = normalize(d.value);
          setPremiumBooks(norm);
          try { window.localStorage.setItem("eca_premium_books_v1", JSON.stringify(norm)); } catch {}
        }
      })
      .catch(() => {});
    window.addEventListener("eca-premium-books-updated", loadBooks);
    return () => window.removeEventListener("eca-premium-books-updated", loadBooks);
  }, []);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "premium-notes") setSubTab("premium-notes");
      if (tab === "essay-material") setSubTab("essay-material");
      if (tab === "daily-pdf") setSubTab("daily-pdf");
    }
    const handler = () => setRefreshTick((t) => t + 1);
    window.addEventListener("eca-upi-orders-updated", handler);
    return () => window.removeEventListener("eca-upi-orders-updated", handler);
  }, []);

  const essayArticles = [
    {
      theme: "Philosophical & Ethics",
      titleEn: "Ships Do Not Sink Because of Water Around Them — UPSC Essay Model Framework",
      titleHi: "जहाज अपने चारों ओर के पानी से नहीं डूबते — UPSC निबंध मॉडल रूपरेखा",
      summaryEn:
        "Complete brainstorming dimensions (Individual, Societal, Historical, Global), quotes, and structured conclusion for UPSC & State PCS Essay Paper.",
      summaryHi:
        "व्यक्तिगत, सामाजिक, ऐतिहासिक और वैश्विक आयामों, उद्धरणों और संतुलित निष्कर्ष के साथ UPSC एवं State PCS निबंध हेतु संपूर्ण सामग्री।",
      date: "20 Nov 2026",
    },
    {
      theme: "Society & Women Empowerment",
      titleEn: "Women-Led Development: From Welfare Beneficiaries to Nation Builders",
      titleHi: "महिला-नेतृत्व विकास: कल्याण लाभार्थी से राष्ट्र निर्माता की ओर",
      summaryEn:
        "Data points, constitutional provisions, government initiatives, and balanced multi-dimensional essay arguments.",
      summaryHi:
        "प्रमुख आंकड़े, संवैधानिक प्रावधान, सरकारी पहलें और बहुआयामी निबंध संरचना।",
      date: "19 Nov 2026",
    },
    {
      theme: "Economy & Technology",
      titleEn: "Artificial Intelligence & Ethical Governance in India's Amrit Kaal",
      titleHi: "भारत के अमृत काल में कृत्रिम बुद्धिमत्ता (AI) और नैतिक शासन",
      summaryEn:
        "Opportunities, ethical guardrails, digital public infrastructure case studies, and quotes for high-scoring Mains essays.",
      summaryHi:
        "अवसर, नैतिक चुनौतियाँ, डिजिटल पब्लिक इंफ्रास्ट्रक्चर केस स्टडी और उच्च अंक दिलाने वाले उद्धरण।",
      date: "18 Nov 2026",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-tick={refreshTick}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Material
        </h1>

        {/* Global Language Filter inside Material Section */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-extrabold">
          <Languages className="w-3.5 h-3.5 text-[#0B1B3D] mx-1.5" />
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-lg transition ${
              lang === "en" ? "bg-[#0B1B3D] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`px-3 py-1.5 rounded-lg transition ${
              lang === "hi" ? "bg-[#E60000] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Sub-Tabs including Essay Material */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-slate-200 mb-6">
        {[
          { id: "ncert-books", label: "NCERT Books" },
          { id: "ncert-crux", label: "NCERT Crux" },
          { id: "editorial", label: "Daily Editorial PDFs" },
          { id: "daily-pdf", label: "Daily Current Affairs" },
          { id: "essay-material", label: "Essay Material" },
          { id: "premium-notes", label: "Premium Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              subTab === tab.id
                ? "bg-[#E60000] text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-Tab 1: NCERT Books (Subject First -> Class Second) */}
      {subTab === "ncert-books" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div>
            <div className="text-xs font-extrabold text-[#0B1B3D] uppercase mb-2">
              1. Subject
            </div>
            <div className="flex flex-wrap gap-2">
              {NCERT_SUBJECTS.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedSubject === subj
                      ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-extrabold text-[#E60000] uppercase mb-2">
              2. Class
            </div>
            <div className="flex flex-wrap gap-2">
              {NCERT_CLASSES.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedClass === cls
                      ? "bg-[#E60000] text-white border-[#E60000]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-xl">
            <div>
              <span className="text-xs font-bold text-[#E60000]">
                NCERT Books • {lang === "hi" ? "हिन्दी माध्यम" : "English Medium"}
              </span>
              <h2 className="text-lg font-extrabold text-[#0B1B3D]">
                {selectedSubject} — {selectedClass} Textbook
              </h2>
            </div>
            <DualPdfButton title={`${selectedSubject} - ${selectedClass} NCERT`} />
          </div>
        </div>
      )}

      {/* Sub-Tab 2: NCERT Crux */}
      {subTab === "ncert-crux" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {NCERT_SUBJECTS.map((subj) => (
            <div
              key={subj}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="bg-amber-50 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded">
                  NCERT Crux • {lang === "hi" ? "हिन्दी" : "English"}
                </span>
                <h2 className="text-lg font-extrabold text-[#0B1B3D] mt-2">
                  {subj} — Class 6 to 12 Crux
                </h2>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <DualPdfButton title={`${subj} NCERT Crux`} compact />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 3: Daily Editorial PDFs */}
      {subTab === "editorial" && (
        <div className="space-y-4">
          {[
            { date: "20 Nov 2026", title: "Daily Editorial Compilation — GS-2 & GS-3 Analysis" },
            { date: "19 Nov 2026", title: "Daily Editorial Compilation — Economy & International Relations" },
            { date: "18 Nov 2026", title: "Daily Editorial Compilation — Polity & Governance" },
          ].map((ed, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-[#E60000]">
                  {ed.date} • {lang === "hi" ? "हिन्दी" : "English"}
                </span>
                <h2 className="text-base font-extrabold text-[#0B1B3D]">{ed.title}</h2>
              </div>
              <DualPdfButton title={ed.title} compact />
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 4: Essay Material (Specific Essay Articles + PDFs) */}
      {subTab === "daily-pdf" && <DailyPdfArchiveSection />}

      {subTab === "essay-material" && (
        <div className="space-y-4">
          {essayArticles.map((es, idx) => {
            const title = lang === "hi" ? es.titleHi : es.titleEn;
            const summary = lang === "hi" ? es.summaryHi : es.summaryEn;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-amber-50 text-amber-900 font-extrabold px-2.5 py-0.5 rounded">
                      Essay • {es.theme}
                    </span>
                    <span className="text-slate-400 font-semibold">{es.date}</span>
                  </div>
                  <DualPdfButton title={title} compact />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">{title}</h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">{summary}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Tab 5: Premium Notes (Tamper-Proof Persistent UPI Unlock) */}
      {subTab === "premium-notes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {premiumBooks.map((book) => {
            const unlockState = book.isPaid
              ? getItemUnlockState(book.id)
              : { status: "approved" as const };

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[3/4] bg-slate-100">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 right-2.5 bg-[#0B1B3D] text-white text-xs font-extrabold px-3 py-1 rounded-full">
                      {book.isPaid ? `₹${book.priceInr}` : "FREE"}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-bold text-slate-500">
                      {book.subject} • {lang === "hi" ? "हिन्दी" : "English"}
                    </span>
                    <h3 className="text-base font-extrabold text-[#0B1B3D] mt-0.5">{book.title}</h3>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  {unlockState.status === "approved" ? (
                    <div className="flex items-center justify-between gap-2">
                      {book.isPaid && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Unlocked
                        </span>
                      )}
                      <DualPdfButton
                        title={book.title}
                        englishUrl={book.isPaid && unlockState.utr && !String(book.englishPdfUrl||"").startsWith("http") && !String(book.englishPdfUrl||"").startsWith("#") ? `/api/premium-download?file=${encodeURIComponent(book.englishPdfUrl)}&itemId=${encodeURIComponent(book.id)}&utr=${encodeURIComponent(unlockState.utr)}` : book.englishPdfUrl}
                        hindiUrl={book.isPaid && unlockState.utr && !String(book.hindiPdfUrl||"").startsWith("http") && !String(book.hindiPdfUrl||"").startsWith("#") ? `/api/premium-download?file=${encodeURIComponent(book.hindiPdfUrl)}&itemId=${encodeURIComponent(book.id)}&utr=${encodeURIComponent(unlockState.utr)}` : book.hindiPdfUrl}
                        compact
                      />
                    </div>
                  ) : (
                    <UpiUnlockModal
                      itemId={book.id}
                      itemType="premium_notes"
                      itemTitle={book.title}
                      priceInr={book.priceInr}
                      unlockStatus={unlockState.status}
                      pendingUtr={unlockState.utr}
                      onOrderSubmitted={() => setRefreshTick((t) => t + 1)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
          <LiveAdminSectionFeed sectionMatch="NCERT" />
    
      <SmartQuizzesFeed targetSection="material" />
</div>
  );
}
