import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { DEFAULT_BATCHES } from "@/lib/batchesStore";
import BookmarkButton from "@/components/BookmarkButton";
import CurrentAffairReader from "@/components/CurrentAffairReader";
import { ArrowLeft, GraduationCap } from "lucide-react";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article =
    STRUCTURED_CURRENT_AFFAIRS.find((a) => a.slug === params.slug) ||
    STRUCTURED_CURRENT_AFFAIRS[0];

  const desc = article.whyInNews.slice(0, 158);
  const url = `${siteUrl}/current-affairs/${article.slug}`;

  return {
    title: `${article.title} — ${article.examRelevance} Current Affairs`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: desc,
      siteName: "ETERNAL CIVIL ACADEMY",
      images: [{ url: "/logo.jpg", alt: article.title }],
    },
  };
}

export default function CurrentAffairDetailPage({ params }: { params: { slug: string } }) {
  const article =
    STRUCTURED_CURRENT_AFFAIRS.find((a) => a.slug === params.slug) ||
    STRUCTURED_CURRENT_AFFAIRS[0];

  const relatedArticles = STRUCTURED_CURRENT_AFFAIRS.filter((a) => a.slug !== article.slug).slice(
    0,
    3
  );
  const relatedBatch = DEFAULT_BATCHES[0];

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.whyInNews,
    datePublished: article.date,
    author: { "@type": "Organization", name: "ETERNAL CIVIL ACADEMY" },
    publisher: {
      "@type": "Organization",
      name: "ETERNAL CIVIL ACADEMY",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.jpg` },
    },
    mainEntityOfPage: `${siteUrl}/current-affairs/${article.slug}`,
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Link
          href="/current-affairs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000]"
        >
          <ArrowLeft className="w-4 h-4" /> Daily Current Affairs
        </Link>
        <BookmarkButton
          item={{
            slug: article.slug,
            title: article.title,
            examRelevance: article.examRelevance,
            date: article.date,
          }}
        />
      </div>

      {/* Bilingual English / Hindi Reader */}
      <CurrentAffairReader article={article} />

      {/* Automatic Internal Linking: Related Articles + Recommended Batch */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#0B1B3D] uppercase tracking-wider mb-3">
            Related Current Affairs
          </h3>
          <div className="divide-y divide-slate-100">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/current-affairs/${rel.slug}`}
                className="py-2.5 block hover:text-[#E60000] transition"
              >
                <span className="text-[10px] font-extrabold bg-red-50 text-[#E60000] px-2 py-0.5 rounded mr-2">
                  {rel.examRelevance}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0B1B3D] hover:text-[#E60000]">
                  {rel.title}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="md:col-span-4 bg-gradient-to-br from-[#0B1B3D] to-[#162F66] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-yellow-300">
              <GraduationCap className="w-4 h-4" /> Featured Batch
            </div>
            <h3 className="text-sm font-extrabold mt-2 leading-snug">{relatedBatch.title}</h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Starts {relatedBatch.startDate} • {relatedBatch.medium}
            </p>
          </div>
          <Link
            href={`/batches/${relatedBatch.slug}`}
            className="mt-4 inline-flex items-center justify-center bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl transition"
          >
            Explore Batch →
          </Link>
        </div>
      </div>
    </article>
  );
}
