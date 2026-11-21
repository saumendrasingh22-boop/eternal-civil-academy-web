import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1B3D]">Refund &amp; Cancellation Policy</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            ETERNAL CIVIL ACADEMY • Last Updated: November 2026
          </p>
        </div>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">1. Digital PDFs, Test Series &amp; Answer Evaluation</h2>
          <p>
            Because digital study materials (PDF notes, test series unlocks, and answer evaluation services) grant immediate access once verified, fees paid for unlocked digital items are non-refundable.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">2. Duplicate Payments, Failed Activation &amp; Batch Cancellation</h2>
          <p>
            You are eligible for a 100% refund or immediate access resolution if: (a) an accidental duplicate UPI payment was deducted for the same item, (b) payment succeeded but access was not activated within 48 hours of submitting a valid 12-digit UTR, or (c) an announced paid batch is cancelled by ETERNAL CIVIL ACADEMY before commencement.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">3. Refund Request Window &amp; Processing Time</h2>
          <p>
            Submit refund requests within 7 days of payment via our{" "}
            <Link href="/contact-us" className="text-[#E60000] font-bold hover:underline">
              Contact Us
            </Link>{" "}
            page along with your Name, Mobile/Telegram, and 12-digit UTR number. Approved refunds are processed back to the original UPI/bank account within 5–7 working days.
          </p>
        </section>
      </div>
    </div>
  );
}
