"use client";

import React, { useState, useEffect } from "react";
import { Upload, Sparkles, CheckCircle2, Trash2, FileText, Play, Clock } from "lucide-react";
import { parseSmartQuizText } from "@/lib/smartQuizParser";
import {
  SMART_QUIZ_SECTIONS,
  SMART_QUIZ_SUBSECTIONS,
  SMART_QUIZ_SUBJECTS,
  type SmartQuizItem,
  type SmartQuizTarget,
  type SmartQuizPublishMode,
} from "@/lib/smartQuizzesTypes";
import type { BilingualCbtQuestion } from "@/lib/siteData";
import { getAdminAccessToken } from "@/lib/adminTokenHelper";
import { exportTestPaperPdf } from "@/lib/mistakesPdfExport";

const QUICK_EXAMS = ["UPSC", "UPPSC", "BPSC", "RPSC", "MPPSC", "HPSC", "JPSC", "UKPSC", "RO/ARO", "SSC"];

export default function AdminSmartQuizStudio() {
  const [rawText, setRawText] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [targetSection, setTargetSection] = useState<SmartQuizTarget>("test_series");
  const [subSection, setSubSection] = useState("");
  const [subjectTag, setSubjectTag] = useState("All Subjects / Full GS");
  const [commissionOrExam, setCommissionOrExam] = useState("UPPSC");
  const [yearOrTag, setYearOrTag] = useState("2026");
  const [pricingType, setPricingType] = useState<"free" | "paid">("free");
  const [priceInr, setPriceInr] = useState(0);
  const [publishMode, setPublishMode] = useState<SmartQuizPublishMode>("live_now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [positiveMarks, setPositiveMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.33);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const [parsedQuestions, setParsedQuestions] = useState<BilingualCbtQuestion[]>([]);
  const [sourceLang, setSourceLang] = useState<"hi" | "en">("hi");
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishedList, setPublishedList] = useState<SmartQuizItem[]>([]);

  const loadPublished = async () => {
    try {
      const r = await fetch("/api/smart-quizzes?_t=" + Date.now(), { cache: "no-store" });
      const d = await r.json();
      if (Array.isArray(d?.quizzes)) setPublishedList(d.quizzes);
    } catch {}
  };

  useEffect(() => {
    loadPublished();
  }, []);

  const handleTextChange = (val: string) => {
    setRawText(val);
    const res = parseSmartQuizText(val);
    setParsedQuestions(res.questions);
    setSourceLang(res.sourceLang);
    setParseWarnings(res.warnings);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const baseName = file.name.replace(/\.txt$/i, "").trim();
    if (!titleEn) setTitleEn(baseName);
    if (!titleHi) setTitleHi(baseName);
    const reader = new FileReader();
    reader.onload = () => handleTextChange(String(reader.result || ""));
    reader.readAsText(file, "UTF-8");
  };

  const handlePublish = async () => {
    if (parsedQuestions.length === 0) {
      setStatusMsg("Please paste or upload a valid Quiz .txt file first.");
      return;
    }
    if (!titleEn.trim() && !titleHi.trim()) {
      setStatusMsg("Please enter a Quiz / PYQ Title.");
      return;
    }
    if (!commissionOrExam.trim()) {
      setStatusMsg("Please enter an Exam / Commission name.");
      return;
    }
    if (publishMode === "scheduled" && !scheduledAt) {
      setStatusMsg("Please pick a scheduled live date & time.");
      return;
    }

    const token = getAdminAccessToken();
    if (!token) {
      setStatusMsg("Admin session expired. Please refresh and sign in again.");
      return;
    }

    setBusy(true);
    setStatusMsg("Preparing bilingual quiz...");

    try {
      let finalQuestions = [...parsedQuestions];
      let finalTitleEn = titleEn.trim() || titleHi.trim();
      let finalTitleHi = titleHi.trim() || titleEn.trim();

      if (autoTranslate) {
        const BATCH_SIZE = 8;
        const translatedAll: BilingualCbtQuestion[] = [];
        for (let i = 0; i < finalQuestions.length; i += BATCH_SIZE) {
          const chunk = finalQuestions.slice(i, i + BATCH_SIZE);
          setStatusMsg(
            `Auto-translating ${sourceLang === "hi" ? "Hindi → English" : "English → Hindi"}: ${Math.min(i + BATCH_SIZE, finalQuestions.length)}/${finalQuestions.length} questions...`
          );
          const trRes = await fetch("/api/smart-quizzes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "translate",
              sourceLang,
              title: i === 0 ? (sourceLang === "hi" ? finalTitleHi : finalTitleEn) : "",
              questions: chunk,
            }),
          });
          const trData = await trRes.json();
          if (i === 0 && trData?.translatedTitle) {
            if (sourceLang === "hi" && !titleEn.trim()) finalTitleEn = trData.translatedTitle;
            if (sourceLang === "en" && !titleHi.trim()) finalTitleHi = trData.translatedTitle;
          }
          if (Array.isArray(trData?.items)) {
            translatedAll.push(...trData.items);
          } else {
            translatedAll.push(...chunk);
          }
        }
        finalQuestions = translatedAll;
      }

      setStatusMsg("Saving bilingual quiz to cloud database...");
      const id = "sq-" + Date.now();
      const slug =
        finalTitleEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 48) +
        "-" +
        String(Date.now()).slice(-5);

      const quizItem: SmartQuizItem = {
        id,
        slug,
        titleEn: finalTitleEn,
        titleHi: finalTitleHi,
        targetSection,
        subSection: subSection.trim() || undefined,
        subjectTag: subjectTag.trim() || undefined,
        commissionOrExam: commissionOrExam.trim(),
        yearOrTag: yearOrTag.trim() || "2026",
        pricingType,
        priceInr: pricingType === "paid" ? Number(priceInr || 0) : 0,
        publishMode,
        scheduledAtIso: publishMode === "scheduled" ? new Date(scheduledAt).toISOString() : undefined,
        durationMinutes: Math.max(5, Number(durationMinutes || 60)),
        positiveMarks: Number(positiveMarks || 1),
        negativeMarks: Number(negativeMarks || 0.33),
        sourceLang,
        questions: finalQuestions,
        createdAt: new Date().toISOString(),
      };

      const saveRes = await fetch("/api/smart-quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "save", quiz: quizItem }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData?.ok) {
        throw new Error(saveData?.error || "Failed to publish quiz");
      }

      const secInfo = SMART_QUIZ_SECTIONS.find((x) => x.id === targetSection);
      setStatusMsg(
        `Published "${finalTitleEn}" (${finalQuestions.length} bilingual EN + HI questions) to ${secInfo?.label || targetSection}!`
      );
      setRawText("");
      setParsedQuestions([]);
      setTitleEn("");
      setTitleHi("");
      await loadPublished();
    } catch (err: any) {
      setStatusMsg("Error: " + (err?.message || "Publish failed"));
    } finally {
      setBusy(false);
    }
  };

  
  const handleRebuildPdfs = async (slug: string) => {
    const token = getAdminAccessToken();
    if (!token) return;
    setStatusMsg("Triggering branded WeasyPrint PDF build (~40 sec)...");
    const r = await fetch("/api/smart-quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "rebuild_pdfs", slug }),
    });
    const d = await r.json();
    setStatusMsg(d?.ok ? "Branded PDF build started! Direct .pdf downloads will be ready in ~45 seconds." : "Could not trigger PDF build (check GITHUB_PAT on Vercel).");
  };

  const handleDelete = async (id: string) => {
    const token = getAdminAccessToken();
    if (!token) return;
    await fetch("/api/smart-quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "delete", id }),
    });
    await loadPublished();
  };

  const sectionLabelMap: Record<string, string> = {};
  SMART_QUIZ_SECTIONS.forEach((s) => {
    sectionLabelMap[s.id] = s.id.replace(/_/g, " ").toUpperCase();
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/15 shadow-sm p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-[#E60000] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Bilingual Smart Quiz &amp; PYQ Publisher
          </span>
          <h2 className="text-xl font-extrabold text-[#0B1B3D] mt-1">
            Upload .txt or Paste Quiz → Auto EN + HI Live CBT &amp; Dual PDF
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Publish to ANY website section with custom Exam/Commission name, scheduling, Live CBT attempt, and EN + हिन्दी PDFs.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition">
          <Upload className="w-4 h-4" />
          Upload .txt Quiz File
          <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Full Manual Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">Test / PYQ Title (English)</label>
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g., UPPSC Prelims 2026 Current Affairs Mock #1"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1B3D] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">Test / PYQ Title (हिन्दी — optional, auto-fills)</label>
          <input
            type="text"
            value={titleHi}
            onChange={(e) => setTitleHi(e.target.value)}
            placeholder="उदा., UPPSC प्रीलिम्स 2026 करंट अफेयर्स मॉक #1"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1B3D] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">Target Website Section (All Sections)</label>
          <select
            value={targetSection}
            onChange={(e) => setTargetSection(e.target.value as SmartQuizTarget)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-[#0B1B3D]"
          >
            {SMART_QUIZ_SECTIONS.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Section Input + Quick Chips (e.g., NCERT Class 06, Class 02, Full-Length Mock) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Sub-Section / Class / Category (e.g. NCERT Class 06, Class 02, Full-Length Mock)
          </label>
          <input
            type="text"
            value={subSection}
            onChange={(e) => setSubSection(e.target.value)}
            placeholder="Type ANY sub-section e.g., NCERT Class 06, NCERT Class 02, Chapter 1, Full-Length Mock..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-[#0B1B3D] focus:border-[#0B1B3D] outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(SMART_QUIZ_SUBSECTIONS[targetSection] || []).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubSection(sub)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border transition ${
                  subSection.toLowerCase() === sub.toLowerCase()
                    ? "bg-[#E60000] text-white border-[#E60000]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Subject-Wise Tag Input + Quick Chips */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Subject Filter Tag (For Subject-Wise Filtering on Website)
          </label>
          <input
            type="text"
            value={subjectTag}
            onChange={(e) => setSubjectTag(e.target.value)}
            placeholder="Type ANY subject e.g., History, Polity, Geography, Science, Current Affairs..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-[#0B1B3D] focus:border-[#0B1B3D] outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SMART_QUIZ_SUBJECTS.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSubjectTag(subj)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border transition ${
                  subjectTag.toLowerCase() === subj.toLowerCase()
                    ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Exam / Commission Input + Quick Chips */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Commission / Exam Name (Type ANY custom exam or tap a quick tag)
          </label>
          <input
            type="text"
            value={commissionOrExam}
            onChange={(e) => setCommissionOrExam(e.target.value)}
            placeholder="Type any exam e.g., UPPSC RO/ARO, BPSC TRE 4.0, RAS, CDS, NDA, UGC NET..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-[#0B1B3D] focus:border-[#0B1B3D] outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_EXAMS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setCommissionOrExam(ex)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border transition ${
                  commissionOrExam.toLowerCase() === ex.toLowerCase()
                    ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Year / Paper Tag</label>
            <input
              type="text"
              value={yearOrTag}
              onChange={(e) => setYearOrTag(e.target.value)}
              placeholder="2026 / GS Paper-I"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Mins</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">+Marks</label>
              <input
                type="number"
                step="0.5"
                value={positiveMarks}
                onChange={(e) => setPositiveMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">-Neg</label>
              <input
                type="number"
                step="0.01"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Publish Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#0B1B3D]">Publish Mode</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "live_now", label: "Go Live Immediately (CBT + PDF)" },
              { id: "scheduled", label: "Schedule Live Date & Time" },
              { id: "direct_pdf_quiz", label: "Direct Upload (PDF + Attempt)" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPublishMode(m.id as SmartQuizPublishMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition ${
                  publishMode === m.id
                    ? "bg-[#E60000] text-white border-[#E60000]"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {publishMode === "scheduled" && (
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Scheduled Live Date &amp; Time (Local IST)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#0B1B3D]">Access &amp; Auto-Translation</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value as "free" | "paid")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold bg-white"
            >
              <option value="free">Free (Open to All)</option>
              <option value="paid">Paid Series</option>
            </select>
            {pricingType === "paid" && (
              <input
                type="number"
                value={priceInr}
                onChange={(e) => setPriceInr(Number(e.target.value))}
                placeholder="₹ Price"
                className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
              />
            )}
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0B1B3D] cursor-pointer">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="rounded"
              />
              Auto-Generate Both Languages (EN + हिन्दी)
            </label>
          </div>
        </div>
      </div>

      {/* Paste Box */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-extrabold text-slate-700">
            Paste Quiz Text Here (or use Upload .txt button above)
          </label>
          <span className="text-xs font-extrabold text-emerald-700">
            {parsedQuestions.length > 0
              ? `✅ ${parsedQuestions.length} Questions Parsed (${sourceLang === "hi" ? "Hindi detected" : "English detected"})`
              : "Waiting for quiz text..."}
          </span>
        </div>
        <textarea
          rows={8}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={"Question text...\nA) Option 1\nB) Option 2 ✅\nC) Option 3\nD) Option 4\nEx:\n• Explanation bullet..."}
          className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono leading-relaxed focus:border-[#0B1B3D] outline-none"
        />
        {parseWarnings.length > 0 && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900">
            {parseWarnings.slice(0, 4).join(" | ")}
          </div>
        )}
      </div>

      {/* Publish Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={busy || parsedQuestions.length === 0}
          onClick={handlePublish}
          className="inline-flex items-center gap-2 bg-[#E60000] hover:bg-red-700 disabled:opacity-50 text-white text-sm font-extrabold px-6 py-3 rounded-xl shadow-sm transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          {busy ? "Publishing & Translating..." : `Publish ${parsedQuestions.length} Questions (EN + हिन्दी)`}
        </button>
        {statusMsg && <span className="text-xs font-bold text-[#0B1B3D]">{statusMsg}</span>}
      </div>

      {/* Published Quizzes Table */}
      {publishedList.length > 0 && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B1B3D]">
            Published Smart Quizzes &amp; PYQs ({publishedList.length})
          </h3>
          <div className="space-y-2.5">
            {publishedList.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-[#0B1B3D] text-white font-extrabold px-2 py-0.5 rounded">
                      {sectionLabelMap[q.targetSection] || q.targetSection}
                    </span>
                    <span className="bg-red-50 text-[#E60000] font-extrabold px-2 py-0.5 rounded">
                      {q.commissionOrExam} • {q.yearOrTag}
                    </span>
                    <span className="font-bold text-slate-600">
                      {q.questions.length} Qs • {q.durationMinutes} min
                    </span>
                    {q.publishMode === "scheduled" && q.scheduledAtIso && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {new Date(q.scheduledAtIso).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-[#0B1B3D] text-sm">{q.titleEn}</div>
                  {q.titleHi !== q.titleEn && <div className="text-slate-600">{q.titleHi}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => q.pdfUrls?.sEn ? (window.location.href = `/api/download-pdf?url=${encodeURIComponent(q.pdfUrls.sEn)}&name=${encodeURIComponent("ECA_" + q.slug + "_Solution_EN.pdf")}`) : exportTestPaperPdf(q.titleEn, q.questions, "en", true)}
                    className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:border-[#0B1B3D] px-2.5 py-1.5 rounded-lg font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" /> EN PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => q.pdfUrls?.sHi ? (window.location.href = `/api/download-pdf?url=${encodeURIComponent(q.pdfUrls.sHi)}&name=${encodeURIComponent("ECA_" + q.slug + "_Solution_HI.pdf")}`) : exportTestPaperPdf(q.titleHi, q.questions, "hi", true)}
                    className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:border-[#0B1B3D] px-2.5 py-1.5 rounded-lg font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" /> HI PDF
                  </button>
                  <a
                    href={`/test-series/live-cbt?smartQuiz=${encodeURIComponent(q.slug)}&lang=hi`}
                    className="inline-flex items-center gap-1 bg-[#0B1B3D] text-white px-2.5 py-1.5 rounded-lg font-bold"
                  >
                    <Play className="w-3.5 h-3.5" /> Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRebuildPdfs(q.slug)}
                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg font-bold"
                  >
                    {q.pdfUrls?.sEn ? "Rebuild PDFs" : "Generate Direct PDFs"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="inline-flex items-center gap-1 bg-red-50 text-[#E60000] hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
