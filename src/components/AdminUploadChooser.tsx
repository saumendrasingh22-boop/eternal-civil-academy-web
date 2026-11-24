"use client";

import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, FolderOpen, Image as ImageIcon, RefreshCw, X } from "lucide-react";

interface VaultPayload {
  githubUploadUrl: string;
  supabaseUploadUrl: string;
  githubFiles: Array<{ name: string; value: string; previewUrl: string; size: number; tag: string; isImage: boolean }>;
  supabasePrivateFiles: Array<{ name: string; value: string; size: number; bucket: string }>;
  supabasePublicFiles: Array<{ name: string; value: string; previewUrl: string; size: number; bucket: string; isImage: boolean }>;
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1048576) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}

function isUploadTargetInput(el: HTMLElement | null): boolean {
  if (!el || el.tagName !== "INPUT") return false;
  const input = el as HTMLInputElement;
  if (["password", "email", "number", "checkbox", "radio", "date"].includes(input.type)) return false;
  const ph = (input.placeholder || "").toLowerCase();
  const list = (input.getAttribute("list") || "").toLowerCase();
  const val = (input.value || "").toLowerCase();
  const labelText = (input.closest("div")?.querySelector("label")?.textContent || "").toLowerCase();
  const c = ph + " " + list + " " + val + " " + labelText;
  return (
    c.includes("cover") || c.includes("image") || c.includes("photo") ||
    c.includes("pdf") || c.includes("video") || c.includes("youtube") ||
    c.includes("filename") || c.includes("/covers/") || c.includes("https://")
  );
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function AdminUploadChooser() {
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [modalTab, setModalTab] = useState<"github" | "supabase" | null>(null);
  const [vault, setVault] = useState<VaultPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVault = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault-files", { cache: "no-store" });
      if (res.ok) setVault(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (isUploadTargetInput(target)) {
        const inp = target as HTMLInputElement;
        activeInputRef.current = inp;
        const rect = inp.getBoundingClientRect();
        setPos({
          top: Math.max(8, rect.top + window.scrollY - 52),
          left: Math.max(12, Math.min(rect.left + window.scrollX, window.innerWidth - 360)),
          width: Math.max(320, Math.min(rect.width, 440)),
        });
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("#eca-upload-chooser-popover") || t?.closest("#eca-vault-picker-modal") || isUploadTargetInput(t)) return;
      setPos(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setModalTab(null); setPos(null); }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const openPicker = (tab: "github" | "supabase") => { setModalTab(tab); fetchVault(); };

  const selectFileValue = (value: string) => {
    if (activeInputRef.current) {
      setReactInputValue(activeInputRef.current, value);
      activeInputRef.current.focus();
    }
    setModalTab(null);
    setPos(null);
  };

  return (
    <div className="contents">
      {pos && !modalTab && (
        <div
          id="eca-upload-chooser-popover"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          className="absolute z-50 bg-white border-2 border-[#0B1B3D] rounded-xl shadow-2xl p-2 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-[#E60000]" /> Pick File:
            </span>
            <button type="button" onClick={() => openPicker("github")} className="bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
              GitHub (Public)
            </button>
            <button type="button" onClick={() => openPicker("supabase")} className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
              Supabase (Private Paid)
            </button>
          </div>
          <button type="button" onClick={() => setPos(null)} className="text-slate-400 hover:text-[#E60000] p-1 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {modalTab && (
        <div className="fixed inset-0 z-[100] bg-black/55 flex items-center justify-center p-4">
          <div id="eca-vault-picker-modal" className="bg-white rounded-2xl border-2 border-[#0B1B3D] shadow-2xl w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
              <div>
                <h3 className="text-sm font-extrabold text-[#0B1B3D]">Visual File Picker - Click Any File to Insert</h3>
                <p className="text-[11px] text-slate-500">No typing or link copying needed - just click a file below.</p>
              </div>
              <button type="button" onClick={() => setModalTab(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalTab("github")} className={modalTab === "github" ? "text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-slate-900 text-white" : "text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700"}>
                  GitHub Public ({vault?.githubFiles.length ?? 0})
                </button>
                <button type="button" onClick={() => setModalTab("supabase")} className={modalTab === "supabase" ? "text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white" : "text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700"}>
                  Supabase ({(vault?.supabasePrivateFiles.length ?? 0) + (vault?.supabasePublicFiles.length ?? 0)})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={fetchVault} disabled={loading} className="bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1">
                  <RefreshCw className={loading ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
                  <span>Refresh</span>
                </button>
                <a href={modalTab === "github" ? (vault?.githubUploadUrl || "https://github.com/saumendrasingh22-boop/eternal-civil-academy-web/releases") : (vault?.supabaseUploadUrl || "https://supabase.com/dashboard/project/fjqzthuhuvbxulicessf/storage/buckets")} target="_blank" rel="noreferrer" className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                  <span>+ Upload New</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {loading && <div className="text-center py-8 text-xs font-bold text-slate-500">Loading your files...</div>}

              {!loading && modalTab === "github" && (
                <div>
                  {!vault?.githubFiles.length ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-xs font-bold text-slate-600">No files uploaded in GitHub Releases yet.</p>
                      <p className="text-[11px] text-slate-500">Click + Upload New above, attach your Photos/PDFs/Videos in a Release, then come back and click Refresh.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vault.githubFiles.map((f, idx) => (
                        <button key={f.value + "-" + idx} type="button" onClick={() => selectFileValue(f.value)} className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#E60000] flex items-center gap-3">
                          {f.isImage ? (
                            <img src={f.previewUrl} alt={f.name} className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-[#0B1B3D]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#0B1B3D] truncate">{f.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">GitHub ({f.tag}) | {formatSize(f.size)}</div>
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">Click to Insert Public URL</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loading && modalTab === "supabase" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-extrabold text-emerald-800 uppercase mb-2">Private Paid PDFs (PAID AND PREMIUM STORAGE)</div>
                    {!vault?.supabasePrivateFiles.length ? (
                      <p className="text-xs text-slate-500">No files in PAID AND PREMIUM STORAGE yet. Click + Upload New above.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {vault.supabasePrivateFiles.map((f) => (
                          <button key={f.name} type="button" onClick={() => selectFileValue(f.value)} className="text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:border-[#E60000] flex items-center gap-3">
                            <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#0B1B3D] truncate">{f.name}</div>
                              <div className="text-[10px] text-slate-500">Private Locked PDF | {formatSize(f.size)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {vault && vault.supabasePublicFiles.length > 0 && (
                    <div>
                      <div className="text-[11px] font-extrabold text-[#0B1B3D] uppercase mb-2">Public Covers (public-covers)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {vault.supabasePublicFiles.map((f) => (
                          <button key={f.name} type="button" onClick={() => selectFileValue(f.value)} className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#E60000] flex items-center gap-3">
                            {f.isImage ? (
                              <img src={f.previewUrl} alt={f.name} className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-[#0B1B3D] shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#0B1B3D] truncate">{f.name}</div>
                              <div className="text-[10px] text-emerald-700 font-bold">Click to Insert Cover URL</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
