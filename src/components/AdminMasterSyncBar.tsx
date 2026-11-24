"use client";

import React, { useEffect, useState } from "react";
import { Cloud, CheckCircle2, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { syncCmsKeyNow } from "@/lib/adminTokenHelper";
import { loadNoCodeCms, saveNoCodeCms } from "@/lib/noCodeCmsStore";
import { saveUpiOrders } from "@/lib/paymentOrdersStore";

const ALL_CLOUD_KEYS: { apiKey: string; storageKey: string }[] = [
  { apiKey: "nocode_cms", storageKey: "eca_nocode_cms_state_v2" },
  { apiKey: "batches", storageKey: "eca_batches_store_v1" },
  { apiKey: "cover_slides", storageKey: "eca_cover_page_slides_v1" },
  { apiKey: "live_tests", storageKey: "eca_live_mock_tests_v1" },
  { apiKey: "site_settings", storageKey: "eca_site_settings_v1" },
  { apiKey: "premium_books", storageKey: "eca_premium_books_v1" },
  { apiKey: "custom_content", storageKey: "eca_custom_content_v1" },
];

export default function AdminMasterSyncBar() {
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Ready — All edits auto-sync to Cloud with live status.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (!detail) return;
      setSyncState(detail.state || "idle");
      if (detail.message) setMessage(detail.message);
    };
    window.addEventListener("eca-cloud-sync-status", handler);
    return () => window.removeEventListener("eca-cloud-sync-status", handler);
  }, []);

  const syncAllToCloud = async () => {
    setBusy(true);
    setSyncState("syncing");
    setMessage("Syncing ENTIRE website settings to Cloud...");
    let okCount = 0;
    let totalSent = 0;
    let failedAuth = false;

    for (const item of ALL_CLOUD_KEYS) {
      const raw = window.localStorage.getItem(item.storageKey);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        totalSent++;
        const res = await syncCmsKeyNow(item.apiKey, parsed);
        if (res.ok) okCount++;
        else if (res.status === 401) {
          failedAuth = true;
          break;
        }
      } catch {}
    }

    setBusy(false);
    if (failedAuth) {
      setSyncState("error");
      setMessage("Session expired (401)! Please click Sign Out and log in again, then click Save & Sync ALL.");
    } else if (totalSent === 0) {
      setSyncState("ok");
      setMessage("No local changes pending — Cloud is already up to date.");
    } else if (okCount === totalSent) {
      setSyncState("ok");
      setMessage(`All ${okCount}/${totalSent} website sections Saved & Synced to Cloud (Live on all devices)!`);
    } else {
      setSyncState("error");
      setMessage(`Synced ${okCount}/${totalSent} sections. Some failed — please re-login and retry.`);
    }
  };

  const clearDemoData = async () => {
    if (!window.confirm("Remove demo UPI orders (Amit Kumar, Priya Verma) and demo Student Inquiry (Rahul Sharma)?")) {
      return;
    }
    saveUpiOrders([]);
    const cms = loadNoCodeCms();
    const cleanedInquiries = (cms.inquiries || []).filter(
      (inq) => !JSON.stringify(inq).toLowerCase().includes("rahul sharma")
    );
    const nextCms = { ...cms, inquiries: cleanedInquiries };
    saveNoCodeCms(nextCms);
    await syncCmsKeyNow("nocode_cms", nextCms);
    setSyncState("ok");
    setMessage("Demo UPI orders & demo inquiry permanently cleared and synced to Cloud!");
  };

  return (
    <div
      className={`sticky top-2 z-30 mb-5 rounded-2xl border-2 px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 ${
        syncState === "error"
          ? "bg-red-50 border-red-400 text-red-900"
          : syncState === "ok"
          ? "bg-emerald-50 border-emerald-400 text-emerald-900"
          : "bg-white border-[#0B1B3D]/25 text-[#0B1B3D]"
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs font-extrabold">
        {syncState === "error" ? (
          <AlertTriangle className="w-4 h-4 text-[#E60000] shrink-0" />
        ) : syncState === "ok" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : syncState === "syncing" ? (
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
        ) : (
          <Cloud className="w-4 h-4 text-[#0B1B3D] shrink-0" />
        )}
        <span>{message}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clearDemoData}
          disabled={busy}
          className="bg-white hover:bg-red-50 border border-red-300 text-[#E60000] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Demo Data</span>
        </button>
        <button
          type="button"
          onClick={syncAllToCloud}
          disabled={busy}
          className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-sm"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>{busy ? "Syncing..." : "Save & Sync ALL to Cloud"}</span>
        </button>
      </div>
    </div>
  );
}
