import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { STATES_LIST } from "@/lib/siteData";
import StateSpecialClientView from "@/components/StateSpecialClientView";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");

const STATE_EXAM_MAP: Record<string, string> = {
  "Uttar Pradesh": "UPPSC PCS, RO/ARO",
  Haryana: "HPSC HCS",
  Bihar: "BPSC CCE",
  Rajasthan: "RPSC RAS",
  "Madhya Pradesh": "MPPSC",
  Jharkhand: "JPSC",
  Uttarakhand: "UKPSC",
};

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function fromSlug(slug: string): string | undefined {
  return STATES_LIST.find((st) => toSlug(st) === slug.toLowerCase());
}

export function generateStaticParams() {
  return STATES_LIST.map((st) => ({ state: toSlug(st) }));
}

export async function generateMetadata({
  params,
}: {
  params: { state: string };
}): Promise<Metadata> {
  const stateName = fromSlug(params.state);
  if (!stateName) return { title: "State Special Current Affairs | ETERNAL CIVIL ACADEMY" };

  const exam = STATE_EXAM_MAP[stateName] || "State PCS";
  const title = `${stateName} Special Current Affairs & ${exam} GK (English & Hindi)`;
  const description = `Daily ${stateName} Special Current Affairs, ${stateName} Government Schemes, State GS Notes & Bilingual PDFs for ${exam} — ETERNAL CIVIL ACADEMY.`;
  const url = `${siteUrl}/state-special/${toSlug(stateName)}`;

  return {
    title,
    description,
    keywords: [
      `${stateName} Special Current Affairs`,
      `${stateName} Current Affairs Hindi`,
      `${exam} Current Affairs`,
      `${stateName} State GK PDF`,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "ETERNAL CIVIL ACADEMY",
      images: [{ url: "/logo.jpg", alt: title }],
    },
  };
}

export default function DedicatedStateSpecialPage({ params }: { params: { state: string } }) {
  const stateName = fromSlug(params.state);
  if (!stateName) notFound();

  const exam = STATE_EXAM_MAP[stateName] || "State PCS";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${stateName} Special Current Affairs (${exam})`,
    description: `Daily ${stateName} Current Affairs, Schemes & State GS for ${exam} in English and Hindi.`,
    url: `${siteUrl}/state-special/${toSlug(stateName)}`,
    publisher: { "@type": "Organization", name: "ETERNAL CIVIL ACADEMY", url: siteUrl },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Link
        href="/state-special"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All States Special Current Affairs
      </Link>

      <div className="mb-6">
        <span className="inline-block bg-red-50 text-[#E60000] text-xs font-extrabold px-3 py-1 rounded-full">
          {exam} • Bilingual (English & हिन्दी)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-2">
          {stateName} Special Current Affairs & State GS
        </h1>
      </div>

      {/* Quick Switcher to Other Dedicated State SEO Pages */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATES_LIST.map((st) => (
          <Link
            key={st}
            href={`/state-special/${toSlug(st)}`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              st === stateName
                ? "bg-[#0B1B3D] text-white border-[#0B1B3D]"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#E60000]"
            }`}
          >
            {st}
          </Link>
        ))}
      </div>

      <StateSpecialClientView stateName={stateName} />
    </div>
  );
}
