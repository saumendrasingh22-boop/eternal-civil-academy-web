"use client";
import React, { useEffect, useState } from "react";
import DualPdfButton from "@/components/DualPdfButton";
import UpiUnlockModal from "@/components/UpiUnlockModal";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function LiveAdminSectionFeed({ sectionMatch }: { sectionMatch: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const k = sectionMatch.toLowerCase();
    const apply = (arr: any[]) => setItems(arr.filter((x: any) => String(x?.section || "").toLowerCase().includes(k)));
    const load = () => {
      try {
        const p = JSON.parse(window.localStorage.getItem("eca_custom_content_v1") || "[]");
        if (Array.isArray(p)) apply(p);
      } catch {}
    };
    load();
    fetch("/api/cms-state?key=custom_content&_t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.synced && Array.isArray(d.value)) {
          apply(d.value);
          try { window.localStorage.setItem("eca_custom_content_v1", JSON.stringify(d.value)); } catch {}
        }
      }).catch(() => {});
    const onUpi = () => setTick((t) => t + 1);
    window.addEventListener("eca-custom-content-updated", load);
    window.addEventListener("eca-upi-orders-updated", onUpi);
    return () => { window.removeEventListener("eca-custom-content-updated", load); window.removeEventListener("eca-upi-orders-updated", onUpi); };
  }, [sectionMatch]);
  if (!items.length) return null;
  return (
    <div className="mt-8 space-y-3" data-tick={tick}>
      <h2 className="text-sm sm:text-base font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-[#E60000]" /> Latest {sectionMatch} PDFs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => {
          const price = Number(it.priceInr || 0);
          const isPaid = price > 0;
          const u = isPaid ? getItemUnlockState(it.id) : { status: "approved" as const };
          return (
            <div key={it.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold">
                  <span className="bg-red-50 text-[#E60000] px-2 py-0.5 rounded">{it.section}</span>
                  <span className={isPaid ? "bg-amber-50 text-amber-800 px-2 py-0.5 rounded" : "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded"}>{isPaid ? "Rs " + price : "FREE"}</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#0B1B3D] mt-1">{it.title}</h3>
              </div>
              {u.status === "approved" ? (
                <div className="flex items-center gap-2">
                  {isPaid && <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Unlocked</span>}
                  <DualPdfButton title={it.title} englishUrl={it.englishPdfUrl} hindiUrl={it.hindiPdfUrl} compact />
                </div>
              ) : (
                <UpiUnlockModal itemId={it.id} itemType="premium_notes" itemTitle={it.title} priceInr={price} unlockStatus={u.status} pendingUtr={u.utr} onOrderSubmitted={() => setTick((t) => t + 1)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
