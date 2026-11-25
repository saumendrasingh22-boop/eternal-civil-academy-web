"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  FileCheck2,
  BookOpen,
  History,
  MapPin,
  BookMarked,
  Landmark,
  Award,
  PenTool,
  ListChecks,
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  PREMIUM_BOOK_COVERS,
  STRUCTURED_CURRENT_AFFAIRS,
} from "@/lib/siteData";
import { loadCoverSlides, DEFAULT_COVER_SLIDES, CoverSlideItem } from "@/lib/coverPageStore";
import { loadBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";
import { loadNoCodeCms, DEFAULT_NOCODE_CMS, NoCodeCmsState } from "@/lib/noCodeCmsStore";
import DualPdfButton from "@/components/DualPdfButton";
import ExamCountdownBar from "@/components/ExamCountdownBar";

export default function HomePage() {
  const [premiumBooks, setPremiumBooks] = useState(PREMIUM_BOOK_COVERS);
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

  // Dynamic Cover Page Carousel State (Controlled by Super Admin & Admin)
  const [heroSlides, setHeroSlides] = useState<CoverSlideItem[]>(DEFAULT_COVER_SLIDES);
  const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);
  const [cms, setCms] = useState<NoCodeCmsState>(DEFAULT_NOCODE_CMS);
  const [slideIdx, setSlideIdx] = useState(0);
  // Interactive Home Page Daily MCQs State
  const [mcqIdx, setMcqIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<"A" | "B" | "C" | "D" | null>(null);
  // Notifications Commission Filter
  const [activeCommission, setActiveCommission] = useState<string>("ALL");

  useEffect(() => {
    const syncCover = () => {
      const activeOnly = loadCoverSlides().filter((s) => s.active);
      setHeroSlides(activeOnly.length > 0 ? activeOnly : DEFAULT_COVER_SLIDES);
      setSlideIdx(0);
    };
    const syncBatches = () => setBatches(loadBatches());
    const syncCms = () => setCms(loadNoCodeCms());
    syncCover();
    syncBatches();
    syncCms();
    window.addEventListener("eca-cover-slides-updated", syncCover);
    window.addEventListener("eca-batches-updated", syncBatches);
    window.addEventListener("eca-nocode-cms-updated", syncCms);
    return () => {
      window.removeEventListener("eca-cover-slides-updated", syncCover);
      window.removeEventListener("eca-batches-updated", syncBatches);
      window.removeEventListener("eca-nocode-cms-updated", syncCms);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[slideIdx] || heroSlides[0];
  const mcqsList = cms.dailyMcqs.length > 0 ? cms.dailyMcqs : DEFAULT_NOCODE_CMS.dailyMcqs;
  const currentMcq = mcqsList[mcqIdx] || mcqsList[0];

  const quickTiles = [
    { label: "New Batches", href: "/batches", icon: GraduationCap, color: "bg-[#E60000]" },
    { label: "Free Live Test Series", href: "/test-series", icon: FileCheck2, color: "bg-[#0B1B3D]" },
    { label: "Daily Current Affairs", href: "/current-affairs", icon: Newspaper, color: "bg-red-700" },
    { label: "Material", href: "/material", icon: BookOpen, color: "bg-amber-600" },
    { label: "PYQ", href: "/pyq", icon: History, color: "bg-emerald-700" },
    { label: "State Special", href: "/state-special", icon: MapPin, color: "bg-indigo-700" },
    { label: "Monthly Magazine", href: "/monthly-magazine", icon: BookMarked, color: "bg-rose-700" },
    { label: "Schemes", href: "/schemes", icon: Landmark, color: "bg-cyan-700" },
    { label: "Toppers' Copy", href: "/toppers-copy", icon: Award, color: "bg-purple-700" },
    { label: "Answer Evaluation", href: "/answer-evaluation", icon: PenTool, color: "bg-orange-600" },
    { label: "Syllabus", href: "/syllabus", icon: ListChecks, color: "bg-slate-800" },
    { label: "Student Hub", href: "/student-hub", icon: Award, color: "bg-[#E60000]" },
  ];

  const filteredNotifications =
    activeCommission === "ALL"
      ? cms.notifications
      : cms.notifications.filter((n) => n.commission === activeCommission);

  return (
    <div>
      {/* 1. Dynamic Cover Page Hero Showcase Carousel */}
      {cms.homeSections.coverHero && (
        <section className="bg-gradient-to-r from-[#08132B] via-[#0B1B3D] to-[#162F66] text-white relative overflow-hidden border-b-4 border-[#E60000]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-4">
                <span className="inline-block bg-[#E60000] text-white text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wider">
                  {currentSlide.badge}
                </span>

                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                    {currentSlide.title}
                  </h1>
                  <p className="text-sm sm:text-base italic text-yellow-300 mt-1">
                    {currentSlide.tagline}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 max-w-lg">
                  {currentSlide.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={currentSlide.ctaPrimary.href}
                    className="bg-[#E60000] hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg transition"
                  >
                    {currentSlide.ctaPrimary.label} →
                  </Link>
                  <Link
                    href={currentSlide.ctaSecondary.href}
                    className="bg-white text-[#0B1B3D] hover:bg-slate-100 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow transition"
                  >
                    {currentSlide.ctaSecondary.label}
                  </Link>
                </div>
              </div>

              {/* Right 3D Book / Cover Showcase */}
              <div className="lg:col-span-5 flex items-center justify-center gap-3 sm:gap-4">
                {currentSlide.books.map((imgSrc, i) => (
                  <div
                    key={imgSrc + i}
                    className={`rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl transition-transform duration-300 ${
                      i === 1 ? "w-32 sm:w-40 scale-105 z-10 ring-2 ring-yellow-400" : "w-24 sm:w-32 opacity-90"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt="Cover Showcase"
                      className="w-full h-40 sm:h-52 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIdx(idx)}
                    className={`h-2 rounded-full transition-all ${
                      slideIdx === idx ? "w-8 bg-[#E60000]" : "w-2 bg-white/40"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSlideIdx((slideIdx - 1 + heroSlides.length) % heroSlides.length)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSlideIdx((slideIdx + 1) % heroSlides.length)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Mobile-App Style Quick Access Icon Grid (Includes Batches next to Test Series) */}
      {cms.homeSections.quickTiles && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-10">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
              {quickTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Link
                    key={tile.label}
                    href={tile.href}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 hover:border-red-300 hover:bg-red-50/40 transition text-center group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${tile.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0B1B3D] mt-2 leading-tight">
                      {tile.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ExamCountdownBar />

      {/* 2B. New Batches Showcase Section */}
      {cms.homeSections.newBatches && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-[#E60000]" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D]">
                New Batches
              </h2>
            </div>
            <Link
              href="/batches"
              className="text-xs sm:text-sm font-bold text-[#E60000] hover:underline"
            >
              View All Batches →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {batches.slice(0, 4).map((batch) => (
              <Link
                key={batch.id}
                href={`/batches/${batch.slug}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#E60000]/40 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-32 bg-[#0B1B3D] overflow-hidden">
                    <img
                      src={batch.coverImage || "/covers/indian-polity.jpg"}
                      alt={batch.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08132B] via-[#08132B]/30 to-transparent" />
                    <span className="absolute top-2.5 left-2.5 bg-[#E60000] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {batch.examTag}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-amber-400 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {batch.status}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-extrabold text-[#0B1B3D] group-hover:text-[#E60000] line-clamp-2 leading-snug">
                      {batch.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-2">
                      <Calendar className="w-3.5 h-3.5 text-[#E60000]" />
                      <span>{batch.startDate} • {batch.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-sm font-extrabold ${batch.isPaid ? "text-[#0B1B3D]" : "text-emerald-700"}`}>
                    {batch.isPaid ? `₹${batch.priceInr}` : "FREE"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#E60000]">
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Three-Column Institute Dashboard (Live Daily MCQs + Structured Current Affairs + Syllabus & Auto Notifications) */}
      {cms.homeSections.dashboardColumns && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Interactive Daily MCQs (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#0B1B3D] text-white px-5 py-3.5 flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-wider">Daily Practice MCQs</h2>
                  <div className="flex gap-1">
                    {mcqsList.slice(0, 5).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMcqIdx(idx);
                          setSelectedOpt(null);
                        }}
                        className={`w-6 h-6 rounded-full text-xs font-bold transition ${
                          mcqIdx === idx
                            ? "bg-[#E60000] text-white"
                            : "bg-white/15 text-slate-200 hover:bg-white/25"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {currentMcq ? (
                <div className="p-5">
                  <span className="inline-block bg-blue-50 text-[#0B1B3D] text-[11px] font-bold px-2.5 py-0.5 rounded mb-2">
                    {currentMcq.subject}
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {currentMcq.questionEn}
                  </p>

                  <div className="mt-4 space-y-2">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const isPicked = selectedOpt === opt;
                      const isRight = currentMcq.correct === opt;
                      let style = "border-slate-200 hover:border-slate-300";
                      if (selectedOpt) {
                        if (isRight) style = "border-green-600 bg-green-50 text-green-900 font-bold";
                        else if (isPicked) style = "border-[#E60000] bg-red-50 text-red-900 font-bold";
                      }
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedOpt(opt)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${style}`}
                        >
                          <span>
                            <strong>{opt}.</strong> {currentMcq.optionsEn[opt]}
                          </span>
                          {selectedOpt && isRight && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                          {selectedOpt && isPicked && !isRight && <XCircle className="w-4 h-4 text-[#E60000] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOpt && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>Explanation:</strong> {currentMcq.explanationEn}
                    </div>
                  )}
                </div>
                ) : (
                <div className="p-5 text-xs text-slate-500">Daily Practice MCQs will appear here once published from Admin.</div>
                )}
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/test-series/live-cbt"
                  className="text-xs font-extrabold text-[#E60000] hover:underline"
                >
                  Free Live Test Series →
                </Link>
                <span className="text-[11px] text-slate-500 font-semibold">+2.0 / -0.66</span>
              </div>
            </div>

            {/* Column 2: Structured Daily Current Affairs (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#E60000] text-white px-5 py-3.5 flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-wider">Daily Current Affairs</h2>
                  <Link href="/current-affairs" className="text-xs font-bold underline">
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {STRUCTURED_CURRENT_AFFAIRS.slice(0, 3).map((ca) => (
                    <div key={ca.id} className="p-4 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2 text-[11px] mb-1">
                        <span className="bg-red-50 text-[#E60000] font-bold px-2 py-0.5 rounded">
                          {ca.examRelevance}
                        </span>
                        <span className="text-slate-400 font-semibold">{ca.date}</span>
                      </div>
                      <Link href={`/current-affairs/${ca.slug}`}>
                        <h3 className="text-sm font-bold text-[#0B1B3D] hover:text-[#E60000] leading-snug">
                          {ca.title}
                        </h3>
                      </Link>
                      <div className="mt-2.5 flex items-center justify-between">
                        <Link
                          href={`/current-affairs/${ca.slug}`}
                          className="text-xs font-bold text-[#0B1B3D] hover:text-[#E60000]"
                        >
                          Read Article →
                        </Link>
                        <DualPdfButton
                          title={ca.title}
                          englishUrl={ca.englishPdfUrl}
                          hindiUrl={ca.hindiPdfUrl}
                          compact
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">
                <Link
                  href="/schemes"
                  className="text-xs font-extrabold text-[#0B1B3D] hover:text-[#E60000] flex items-center justify-between"
                >
                  <span>Central & State Schemes</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Column 3: Official Commission Notifications + Syllabus Shortcut (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#0B1B3D] text-white px-5 py-3.5 flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-400" /> Notifications
                  </h2>
                  <Link href="/notifications" className="text-xs font-bold text-yellow-300 hover:underline">
                    All Commissions
                  </Link>
                </div>

                {/* Commission Filter Pills */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveCommission("ALL")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                      activeCommission === "ALL"
                        ? "bg-[#E60000] text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    All
                  </button>
                  {cms.commissions.map((comm) => (
                    <button
                      key={comm}
                      onClick={() => setActiveCommission(comm)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                        activeCommission === comm
                          ? "bg-[#0B1B3D] text-white"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      {comm}
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {filteredNotifications.map((item) => (
                    <a
                      key={item.id}
                      href={item.pdfUrl}
                      className="p-3.5 flex items-start justify-between gap-2 hover:bg-red-50/40 transition block"
                    >
                      <div>
                        <span className="inline-block bg-blue-50 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded mr-1.5">
                          {item.commission}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.date}</span>
                        <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                          {item.title}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#E60000] shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Dedicated Syllabus Card */}
              <div className="bg-gradient-to-r from-[#0B1B3D] to-[#1A3570] rounded-2xl p-5 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base">Syllabus</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {cms.commissions.join(" • ")}
                    </p>
                  </div>
                  <Link
                    href="/syllabus"
                    className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Material & Book Cover Visual Showcase (User Uploaded Covers) */}
      {cms.homeSections.materialShowcase && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D]">
                Material & Premium Notes
              </h2>
            </div>
            <Link
              href="/material"
              className="text-xs sm:text-sm font-bold text-[#E60000] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {premiumBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative bg-slate-100 aspect-[3/4] overflow-hidden">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <span
                      className={`absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow ${
                        book.isPaid
                          ? "bg-[#E60000] text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {book.isPaid ? `₹${book.priceInr}` : "FREE"}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {book.subject} • {book.pages}
                    </span>
                    <h3 className="text-sm font-bold text-[#0B1B3D] mt-0.5 line-clamp-1">
                      {book.title}
                    </h3>
                  </div>
                </div>

                <div className="px-3.5 pb-3.5">
                  {book.isPaid ? (
                    <Link
                      href="/material?tab=premium-notes"
                      className="w-full inline-flex items-center justify-center bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold py-2 rounded-xl transition"
                    >
                      Unlock via UPI (₹{book.priceInr})
                    </Link>
                  ) : (
                    <DualPdfButton
                      title={book.title}
                      englishUrl={book.englishPdfUrl}
                      hindiUrl={book.hindiPdfUrl}
                      compact
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
