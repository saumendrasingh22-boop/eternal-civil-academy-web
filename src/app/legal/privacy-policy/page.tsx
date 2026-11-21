import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1B3D]">Privacy Policy</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            ETERNAL CIVIL ACADEMY • Last Updated: November 2026
          </p>
        </div>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">1. Information We Collect</h2>
          <p>
            When you enroll in a batch, unlock study material, submit a Mains answer copy, attempt a Telegram quiz, or request a callback, we may collect your Full Name, Mobile Number, Telegram Username/ID, 12-digit UPI UTR Reference Number, and uploaded answer copy files.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">2. Why We Collect Mobile, Telegram ID &amp; UTR</h2>
          <p>
            Mobile numbers and Telegram IDs are used strictly to grant classroom/channel access, share evaluated answer copies, link your Telegram quiz mistakes to your report, and respond to support queries. 12-digit UPI UTR numbers are stored exclusively to verify payment receipt and prevent duplicate fraud.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">3. Hosting, Database Security &amp; Local Storage</h2>
          <p>
            Our platform uses Vercel for web hosting and Supabase (PostgreSQL with Row Level Security) for database storage. Sensitive student records (payment UTRs, contacts, answer submissions) are protected from public access via database-level RLS policies. Browser Local Storage is used only for your personal study preferences, saved bookmarks, and spaced-repetition revision cards.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-extrabold text-[#0B1B3D]">4. Data Retention, Deletion &amp; Minors</h2>
          <p>
            We never sell or rent student data to third parties. Aspirants under 18 should use paid services with parental consent. To request correction or permanent deletion of your submitted records, contact us anytime via our{" "}
            <Link href="/contact-us" className="text-[#E60000] font-bold hover:underline">
              Contact Us
            </Link>{" "}
            page — verified deletion requests are processed within 7 working days.
          </p>
        </section>
      </div>
    </div>
  );
}
