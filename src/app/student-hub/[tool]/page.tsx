import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STUDENT_HUB_TOOLS, getToolBySlug } from "@/lib/studentHubCatalog";
import ToolRenderer from "@/components/student-hub/ToolRenderer";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");

export function generateStaticParams() {
  return STUDENT_HUB_TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { tool: string };
}): Promise<Metadata> {
  const tool = getToolBySlug(params.tool);
  if (!tool) return { title: "Student Hub | ETERNAL CIVIL ACADEMY" };

  const url = `${siteUrl}/student-hub/${tool.slug}`;
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: tool.seoTitle,
      description: tool.seoDescription,
      siteName: "ETERNAL CIVIL ACADEMY",
      images: [{ url: "/logo.jpg", alt: tool.title }],
    },
  };
}

export default function StudentToolDetailPage({ params }: { params: { tool: string } }) {
  const tool = getToolBySlug(params.tool);
  if (!tool) notFound();

  const relatedTools = STUDENT_HUB_TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4);

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.seoDescription,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: "ETERNAL CIVIL ACADEMY", url: siteUrl },
    url: `${siteUrl}/student-hub/${tool.slug}`,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      <Link
        href="/student-hub"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Student Hub (All 14 Tools)
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
          <span className="bg-[#E60000] text-white font-extrabold px-2.5 py-0.5 rounded uppercase">
            {tool.badge}
          </span>
          <span className="bg-slate-100 text-[#0B1B3D] font-bold px-2.5 py-0.5 rounded">
            {tool.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">{tool.title}</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">{tool.description}</p>

        <ToolRenderer slug={tool.slug} />
      </div>

      {/* Internal SEO Linking: More Free Student Tools */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0B1B3D] uppercase tracking-wider mb-3">
          More Free Tools in Student Hub
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {relatedTools.map((rt) => (
            <Link
              key={rt.slug}
              href={`/student-hub/${rt.slug}`}
              className="p-3 rounded-xl border border-slate-200 hover:border-[#E60000] hover:bg-red-50/30 transition flex items-center justify-between gap-2 text-xs font-extrabold text-[#0B1B3D]"
            >
              <span>{rt.shortTitle}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E60000] shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
