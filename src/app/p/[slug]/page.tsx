import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, FileDown, Youtube } from "lucide-react";
import { DEFAULT_NOCODE_CMS, CustomPageItem } from "@/lib/noCodeCmsStore";
import CustomPageClientFallback from "@/components/CustomPageClientFallback";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");

async function fetchCustomPageServer(slug: string): Promise<CustomPageItem | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data } = await supabase
        .from("site_cms_state")
        .select("state_value")
        .eq("state_key", "nocode_cms")
        .single();

      const pages = data?.state_value?.customPages;
      if (Array.isArray(pages)) {
        const match = pages.find((p: CustomPageItem) => p.slug === slug && p.active);
        if (match) return match;
      }
    } catch {}
  }
  return DEFAULT_NOCODE_CMS.customPages.find((p) => p.slug === slug && p.active) || null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await fetchCustomPageServer(params.slug);
  if (!page) {
    return { title: `${params.slug.replace(/-/g, " ")} | ETERNAL CIVIL ACADEMY` };
  }
  const desc = (page.subtitle || page.content || "").slice(0, 158);
  const url = `${siteUrl}/p/${page.slug}`;
  return {
    title: `${page.title} — ${page.category || "ETERNAL CIVIL ACADEMY"}`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: page.title,
      description: desc,
      siteName: "ETERNAL CIVIL ACADEMY",
      images: [{ url: "/logo.jpg", alt: page.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: desc,
      images: ["/logo.jpg"],
    },
  };
}

export default async function CustomDynamicPage({ params }: { params: { slug: string } }) {
  const page = await fetchCustomPageServer(params.slug);

  if (!page) {
    return <CustomPageClientFallback slug={params.slug} />;
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: page.title,
    description: (page.subtitle || page.content || "").slice(0, 160),
    datePublished: page.createdAt,
    author: { "@type": "Organization", name: "ETERNAL CIVIL ACADEMY" },
    publisher: {
      "@type": "Organization",
      name: "ETERNAL CIVIL ACADEMY",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.jpg` },
    },
    mainEntityOfPage: `${siteUrl}/p/${page.slug}`,
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs mb-2">
          <span className="bg-red-50 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded uppercase">
            {page.category || "Information"}
          </span>
          <span className="text-slate-400 font-semibold">{page.createdAt}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] leading-snug">
          {page.title}
        </h1>
        {page.subtitle && <p className="text-sm italic text-slate-500 mt-1">{page.subtitle}</p>}

        <div className="mt-6 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line">
          {page.content}
        </div>

        {(page.pdfUrl || page.youtubeUrl) && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
            {page.pdfUrl && (
              <a
                href={page.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                <FileDown className="w-4 h-4" /> Download Attached PDF
              </a>
            )}
            {page.youtubeUrl && (
              <a
                href={page.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Youtube className="w-4 h-4" /> Watch Video
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
