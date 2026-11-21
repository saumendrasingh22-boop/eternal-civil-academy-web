"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  Clock,
  Globe,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
} from "lucide-react";
import { loadBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import UpiUnlockModal from "@/components/UpiUnlockModal";

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);
  const [examFilter, setExamFilter] = useState<string>("ALL");
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

  const examFilters = ["ALL", "UPSC", "UPPSC", "BPSC", "RPSC", "MPPSC", "HPSC", "JPSC"];

  const filteredBatches =
    examFilter === "ALL"
      ? batches
      : batches.filter((b) =>
          b.examTag.toUpperCase().includes(examFilter.toUpperCase())
        );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-tick={refreshTick}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#08132B] via-[#0B1B3D] to-[#162F66] text-white rounded-2xl p-6 sm:p-8 mb-6 border-b-4 border-[#E60000] shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#E60000] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase">
              <Sparkles className="w-3.5 h-3.5" /> New Batches & Courses
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              ETERNAL CIVIL ACADEMY — Batches
            </h1>
            <p className="text-xs sm:text-sm italic text-yellow-300 mt-0.5">
              Your Success, Our Commitment
            </p>
          </div>
          <Link
            href="/test-series"
            className="bg-white text-[#0B1B3D] hover:bg-slate-100 text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow"
          >
            Explore Test Series →
          </Link>
        </div>
      </div>

      {/* Exam Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {examFilters.map((exam) => (
          <button
            key={exam}
            onClick={() => setExamFilter(exam)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              examFilter === exam
                ? "bg-[#E60000] text-white border-[#E60000]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {exam === "ALL" ? "All Batches" : exam}
          </button>
        ))}
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#0B1B3D]">
            No batches currently listed under {examFilter}.
          </p>
          <button
            onClick={() => setExamFilter("ALL")}
            className="mt-3 text-xs font-extrabold text-[#E60000] hover:underline"
          >
            View All Batches →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const unlockState = getItemUnlockState(batch.id);
            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Cover Header */}
                  <Link href={`/batches/${batch.slug}`} className="block relative h-44 bg-[#0B1B3D] overflow-hidden group">
                    <img
                      src={batch.coverImage || "/covers/indian-polity.jpg"}
                      alt={batch.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08132B] via-[#08132B]/40 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-[#E60000] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                        {batch.examTag}
                      </span>
                      <span className="bg-white/95 text-[#0B1B3D] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                        {batch.batchType}
                      </span>
                    </div>
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow ${
                        batch.status === "Live Now"
                          ? "bg-emerald-600 text-white"
                          : batch.status === "Admissions Open"
                          ? "bg-amber-400 text-[#0B1B3D]"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {batch.status}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[11px] font-semibold text-yellow-300">
                        {batch.faculty}
                      </div>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-5">
                    <Link href={`/batches/${batch.slug}`}>
                      <h2 className="text-base font-extrabold text-[#0B1B3D] hover:text-[#E60000] transition leading-snug">
                        {batch.title}
                      </h2>
                    </Link>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-600 font-semibold">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-[#E60000] shrink-0" />
                        <span className="truncate">{batch.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-[#0B1B3D] shrink-0" />
                        <span className="truncate">{batch.duration}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">
                          {batch.medium} • {batch.mode}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-3.5 space-y-1.5">
                      {batch.highlights.slice(0, 3).map((hl, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Price & CTA */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {batch.isPaid ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-[#0B1B3D]">
                            ₹{batch.priceInr}
                          </span>
                          {batch.mrpInr > batch.priceInr && (
                            <span className="text-xs text-slate-400 line-through font-semibold">
                              ₹{batch.mrpInr}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-base font-extrabold text-emerald-700">
                          100% FREE
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/batches/${batch.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0B1B3D] hover:text-[#E60000]"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div>
                    {!batch.isPaid ? (
                      <a
                        href={batch.telegramGroupUrl || "https://t.me/EternalCivilAcademy"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
                      >
                        <Send className="w-3.5 h-3.5" /> Join Free Batch
                      </a>
                    ) : unlockState.status === "approved" ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                        <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Enrolled
                        </span>
                        <Link
                          href={`/batches/${batch.slug}`}
                          className="text-xs font-extrabold text-[#0B1B3D] hover:underline"
                        >
                          Open Batch →
                        </Link>
                      </div>
                    ) : (
                      <div className="w-full">
                        <UpiUnlockModal
                          itemId={batch.id}
                          itemType="batch"
                          itemTitle={batch.title}
                          priceInr={batch.priceInr}
                          unlockStatus={unlockState.status}
                          pendingUtr={unlockState.utr}
                          buttonLabel="Enroll via UPI"
                          onOrderSubmitted={() => setRefreshTick((t) => t + 1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
