import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1B3D]">Terms &amp; Conditions</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            ETERNAL CIVIL ACADEMY • Last Updated: November 2026
          </p>
        </div>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">1. Content Usage &amp; Copyright</h2>
          <p>
            All current affairs analyses, PDF notes, NCERT crux compilations, mock tests, OMR sheets, and batch resources published on ETERNAL CIVIL ACADEMY are licensed strictly for personal, non-commercial exam preparation. Bulk scraping, unauthorized resale, or commercial redistribution of paid PDFs is prohibited and may result in access suspension.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">2. Educational Tools &amp; Predictor Disclaimers</h2>
          <p>
            Student Hub tools—including the Cut-Off Calculator, All India Rank (AIR) Predictor, Age &amp; Eligibility Calculator, Salary Calculator, Government Job Finder, and PYQ Trend Analyzer—provide indicative estimates based on historical exam data and standard rules. Candidates must always verify final eligibility, age cut-offs, and vacancies from official UPSC / State PSC notifications.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">3. Quiz Rules &amp; Platform Availability</h2>
          <p>
            Mock test scores and quiz rankings are for self-assessment. While we strive for 24×7 availability, temporary maintenance or third-party cloud outages may occasionally occur. Official government notifications linked on the platform belong to their respective commissions.
          </p>
        </section>
      </div>
    </div>
  );
}
