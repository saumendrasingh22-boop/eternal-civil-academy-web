"use client";
import React, { useState, useEffect } from "react";
import { BookCoverItem, PREMIUM_BOOK_COVERS } from "@/lib/siteData";
import { loadBatches, saveBatches, BatchItem } from "@/lib/batchesStore";
import { loadPremiumBooks, savePremiumBooks, loadCustomContent, saveCustomContent, CustomContentItem } from "@/lib/premiumBooksStore";
import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
import { Plus, Trash2, Save, BookOpen, GraduationCap, FileText } from "lucide-react";

const COVERS = ["/covers/indian-polity.jpg","/covers/modern-history.jpg","/covers/ancient-history.jpg","/covers/indian-geography.jpg","/covers/world-geography.jpg","/covers/indian-economy.jpg","/covers/environment.jpg","/covers/important-articles.jpg"];

export default function AdminSuperCrudPanel() {
  const [tab, setTab] = useState<"books" | "batches" | "content">("books");
  const [books, setBooks] = useState<BookCoverItem[]>(PREMIUM_BOOK_COVERS);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [content, setContent] = useState<CustomContentItem[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const syncAll = () => { setBooks(loadPremiumBooks()); setBatches(loadBatches()); setContent(loadCustomContent()); };
    syncAll();
    window.addEventListener("eca-premium-books-updated", syncAll);
    window.addEventListener("eca-batches-updated", syncAll);
    window.addEventListener("eca-custom-content-updated", syncAll);
    return () => {
      window.removeEventListener("eca-premium-books-updated", syncAll);
      window.removeEventListener("eca-batches-updated", syncAll);
      window.removeEventListener("eca-custom-content-updated", syncAll);
    };
  }, []);

  const showStatus = (ok: boolean, status: number, label: string) => {
    if (status === 401) setMsg("⚠️ Session expired — Please Sign Out & Sign In again!");
    else if (ok) setMsg(`✅ ${label} Saved & Synced to Cloud (All Devices)!`);
    else setMsg(`❌ Sync failed (${status}). Check connection or Sign In again.`);
  };

  const syncBooks = async () => { setMsg("Syncing Premium Notes..."); const r = await savePremiumBooks(books); showStatus(r.ok, r.status, "Premium Notes"); };
  const syncBatches = async () => {
    setMsg("Syncing Batches..."); saveBatches(batches);
    try { const res = await fetch("/api/cms-state", { method: "POST", headers: getAdminAuthHeaders(), body: JSON.stringify({ key: "batches", value: batches }) }); showStatus(res.ok, res.status, "Batches"); }
    catch { showStatus(false, -1, "Batches"); }
  };
  const syncContent = async () => { setMsg("Syncing Content..."); const r = await saveCustomContent(content); showStatus(r.ok, r.status, "Custom Content"); };

  const addBook = () => setBooks([{ id: "book-" + Date.now(), title: "New Premium Notes", subject: "General Studies", coverImage: "/covers/modern-history.jpg", priceInr: 99, isPaid: true, englishPdfUrl: "", hindiPdfUrl: "", uploadedBy: "super_admin", isLocked: false }, ...books]);
  const addContent = () => setContent([{ id: "cnt-" + Date.now(), section: "Material", title: "New Study Material PDF", priceInr: 0, englishPdfUrl: "", hindiPdfUrl: "", createdAt: new Date().toISOString().slice(0, 10) }, ...content]);

  return (
    <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-5 sm:p-6 shadow-sm mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">Super Admin Full Control Center (Add • Edit • Delete • Cloud Sync)</h2>
          <p className="text-xs text-slate-500">Edit prices, PDF filenames (from PAID AND PREMIUM STORAGE) or links, add new items, or permanently delete.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { setTab("books"); setMsg(""); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${tab === "books" ? "bg-[#E60000] text-white" : "bg-slate-100 text-slate-700"}`}><BookOpen className="w-3.5 h-3.5" /> Premium Notes ({books.length})</button>
          <button type="button" onClick={() => { setTab("batches"); setMsg(""); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${tab === "batches" ? "bg-[#E60000] text-white" : "bg-slate-100 text-slate-700"}`}><GraduationCap className="w-3.5 h-3.5" /> Edit Batches ({batches.length})</button>
          <button type="button" onClick={() => { setTab("content"); setMsg(""); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${tab === "content" ? "bg-[#E60000] text-white" : "bg-slate-100 text-slate-700"}`}><FileText className="w-3.5 h-3.5" /> Custom PDFs ({content.length})</button>
        </div>
      </div>
      {msg && <div className="mb-4 text-xs font-bold text-[#0B1B3D] bg-amber-50 border border-amber-200 rounded-xl py-2 px-3">{msg}</div>}
      {tab === "books" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBook} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add New Book / Note</button>
            <button type="button" onClick={syncBooks} className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save &amp; Sync Premium Notes to Cloud</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {books.map((bk, idx) => (
              <div key={bk.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={bk.title} onChange={(e) => { const n = [...books]; n[idx] = { ...bk, title: e.target.value }; setBooks(n); }} placeholder="Book Title" className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white" />
                  <input type="number" min={0} value={bk.priceInr} onChange={(e) => { const p = Math.max(0, Number(e.target.value) || 0); const n = [...books]; n[idx] = { ...bk, priceInr: p, isPaid: p > 0 }; setBooks(n); }} title="Price INR (0 = Free)" className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-extrabold bg-white text-center" />
                  <button type="button" onClick={() => setBooks(books.filter((_, i) => i !== idx))} title="Delete Permanently" className="p-1.5 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={bk.subject} onChange={(e) => { const n = [...books]; n[idx] = { ...bk, subject: e.target.value }; setBooks(n); }} placeholder="Subject" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                  <input type="text" list="eca-book-covers" value={bk.coverImage} onChange={(e) => { const n = [...books]; n[idx] = { ...bk, coverImage: e.target.value }; setBooks(n); }} placeholder="/covers/... or https://..." className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" value={bk.englishPdfUrl} onChange={(e) => { const n = [...books]; n[idx] = { ...bk, englishPdfUrl: e.target.value }; setBooks(n); }} placeholder="English PDF (MODERN HISTORY.pdf or URL)" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                  <input type="text" value={bk.hindiPdfUrl} onChange={(e) => { const n = [...books]; n[idx] = { ...bk, hindiPdfUrl: e.target.value }; setBooks(n); }} placeholder="Hindi PDF (MODERN HISTORY.pdf or URL)" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                </div>
              </div>
            ))}
          </div>
          <datalist id="eca-book-covers">{COVERS.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      )}
      {tab === "batches" && (
        <div className="space-y-3">
          <button type="button" onClick={syncBatches} className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save &amp; Sync Edited Batches to Cloud</button>
          <div className="space-y-3">
            {batches.map((b, idx) => (
              <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={b.title} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, title: e.target.value }; setBatches(n); }} className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white" />
                  <input type="number" min={0} value={b.priceInr} onChange={(e) => { const p = Math.max(0, Number(e.target.value) || 0); const n = [...batches]; n[idx] = { ...b, priceInr: p, isPaid: p > 0 }; setBatches(n); }} title="Fee INR" className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-extrabold bg-white text-center" />
                  <input type="number" min={0} value={b.mrpInr} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, mrpInr: Math.max(0, Number(e.target.value) || 0) }; setBatches(n); }} title="MRP INR" className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white text-center" />
                  <button type="button" onClick={() => setBatches(batches.filter((_, i) => i !== idx))} title="Delete Batch" className="p-1.5 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input type="text" value={b.examTag} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, examTag: e.target.value }; setBatches(n); }} placeholder="Exam" className="border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] bg-white" />
                  <input type="text" value={b.batchType} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, batchType: e.target.value as BatchItem["batchType"] }; setBatches(n); }} placeholder="Type" className="border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] bg-white" />
                  <input type="text" value={b.startDate} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, startDate: e.target.value }; setBatches(n); }} placeholder="Start Date" className="border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] bg-white" />
                  <input type="text" value={b.status} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, status: e.target.value as BatchItem["status"] }; setBatches(n); }} placeholder="Status" className="border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" value={b.telegramGroupUrl} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, telegramGroupUrl: e.target.value }; setBatches(n); }} placeholder="Telegram Group URL" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                  <input type="text" value={b.syllabusPdfUrl} onChange={(e) => { const n = [...batches]; n[idx] = { ...b, syllabusPdfUrl: e.target.value }; setBatches(n); }} placeholder="Syllabus PDF URL or filename.pdf" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "content" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addContent} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Custom PDF Item</button>
            <button type="button" onClick={syncContent} className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save &amp; Sync Custom PDFs to Cloud</button>
          </div>
          {content.length === 0 ? <p className="text-xs text-slate-500">No custom PDFs added yet.</p> : (
            <div className="space-y-2.5">
              {content.map((c, idx) => (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={c.section} onChange={(e) => { const n = [...content]; n[idx] = { ...c, section: e.target.value }; setContent(n); }} placeholder="Section" className="w-36 border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white" />
                    <input type="text" value={c.title} onChange={(e) => { const n = [...content]; n[idx] = { ...c, title: e.target.value }; setContent(n); }} placeholder="Title" className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white" />
                    <button type="button" onClick={() => setContent(content.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" value={c.englishPdfUrl} onChange={(e) => { const n = [...content]; n[idx] = { ...c, englishPdfUrl: e.target.value }; setContent(n); }} placeholder="English PDF URL or filename.pdf" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                    <input type="text" value={c.hindiPdfUrl} onChange={(e) => { const n = [...content]; n[idx] = { ...c, hindiPdfUrl: e.target.value }; setContent(n); }} placeholder="Hindi PDF URL or filename.pdf" className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] bg-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
