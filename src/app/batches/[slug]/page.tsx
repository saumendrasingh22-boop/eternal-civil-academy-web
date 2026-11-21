"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  CheckCircle2,
  GraduationCap,
  Send,
  FileText,
} from "lucide-react";
import { loadBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import UpiUnlockModal from "@/components/UpiUnlockModal";

export default function BatchDetailPage({ params }: { params: { slug: string } }) {
  const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setBatches(loadBatches());
    const onBatchesUpdate = () => setBatches(loadBatches());
    const onUpiUpdate = () => setRefreshTick((t) => t + 1);
    window.addEventListener("eca-batches-updated", onBatchesUpdate);
    window.addEventListener("eca-upi-orders-updated", onUpiUpdate);
    return () => {
      window.removeEventListener("eca-batches-updated", onBatchesUpdate);
      window.removeEventListener("eca-upi-orders-updated", onUpiUpdate);
    };
  }, []);

  const batch = batches.find((b) => b.slug === params.slug) || batches[0];
  const unlockState = getItemUnlockState(batch.id);
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: batch.title,
    description: batch.description,
    provider: { "@type": "Organization", name: "ETERNAL CIVIL ACADEMY" },
    offers: { "@type": "Offer", price: batch.isPaid ? batch.priceInr : 0, priceCurrency: "INR" },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8" data-tick={refreshTick}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <Link
        href="/batches"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Batches
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Top Hero */}
        <div className="bg-gradient-to-r from-[#08132B] via-[#0B1B3D] to-[#162F66] text-white p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#E60000] text-white text-[11px] font-extrabold px-3 py-1 rounded-full">
                {batch.examTag}
              </span>
              <span className="bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                {batch.batchType}
              </span>
              <span className="bg-amber-400 text-[#0B1B3D] text-[11px] font-extrabold px-3 py-1 rounded-full">
                {batch.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
              {batch.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {batch.description}
            </p>
            <div className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> Faculty: {batch.faculty}
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <img
              src={batch.coverImage || "/covers/indian-polity.jpg"}
              alt={batch.title}
              className="w-44 h-56 object-cover rounded-xl border-2 border-white/30 shadow-2xl"
            />
          </div>
        </div>

        {/* Details Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#E60000]" /> Start Date
                </div>
                <div className="text-sm font-extrabold text-[#0B1B3D] mt-1">
                  {batch.startDate}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0B1B3D]" /> Duration
                </div>
                <div className="text-sm font-extrabold text-[#0B1B3D] mt-1">
                  {batch.duration}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-700" /> Medium
                </div>
                <div className="text-sm font-extrabold text-[#0B1B3D] mt-1">
                  {batch.medium}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] border-b border-slate-200 pb-2">
                Batch Highlights & Deliverables
              </h2>
              <ul className="mt-4 space-y-3">
                {batch.highlights.map((hl, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {batch.syllabusPdfUrl && (
                <a
                  href={batch.syllabusPdfUrl}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
                >
                  <FileText className="w-4 h-4 text-[#E60000]" /> Download Batch Schedule / Brochure
                </a>
              )}
              <a
                href={batch.telegramGroupUrl || "https://t.me/EternalCivilAcademy"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
              >
                <Send className="w-4 h-4" /> Official Telegram Channel
              </a>
            </div>
          </div>

          {/* Right Enrollment Card */}
          <div className="lg:col-span-4">
            <div className="bg-slate-50 border-2 border-[#0B1B3D]/15 rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-500">
                  Batch Fee
                </span>
                {batch.isPaid ? (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#0B1B3D]">
                      ₹{batch.priceInr}
                    </span>
                    {batch.mrpInr > batch.priceInr && (
                      <span className="text-sm text-slate-400 line-through font-bold">
                        ₹{batch.mrpInr}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    FREE BATCH
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1">{batch.mode}</p>
              </div>

              {!batch.isPaid ? (
                <a
                  href={batch.telegramGroupUrl || "https://t.me/EternalCivilAcademy"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition"
                >
                  <Send className="w-4 h-4" /> Access Free Classes
                </a>
              ) : unlockState.status === "approved" ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center space-y-2">
                  <div className="text-sm font-extrabold text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> Enrollment Confirmed!
                  </div>
                  <p className="text-xs text-emerald-700">
                    Verified UTR: {unlockState.utr}
                  </p>
                  <a
                    href={batch.telegramGroupUrl || "https://t.me/EternalCivilAcademy"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D] text-white text-xs font-bold py-2.5 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" /> Join Batch Classroom
                  </a>
                </div>
              ) : (
                <UpiUnlockModal
                  itemId={batch.id}
                  itemType="batch"
                  itemTitle={batch.title}
                  priceInr={batch.priceInr}
                  unlockStatus={unlockState.status}
                  pendingUtr={unlockState.utr}
                  buttonLabel="Enroll Now via UPI"
                  onOrderSubmitted={() => setRefreshTick((t) => t + 1)}
                />
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Payment verification is managed directly by the Super Admin for 100% secure enrollment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
