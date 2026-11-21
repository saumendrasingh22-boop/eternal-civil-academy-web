"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, Youtube } from "lucide-react";
import { loadNoCodeCms, CustomPageItem } from "@/lib/noCodeCmsStore";

export default function CustomPageClientFallback({ slug }: { slug: string }) {
  const [page, setPage] = useState<CustomPageItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      const found = loadNoCodeCms().customPages.find((p) => p.slug === slug && p.active) || null;
      setPage(found);
      setLoaded(true);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, [slug]);

  if (!loaded) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-500">Loading page...</div>;
  }

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h1 className="text-2xl font-extrabold text-[#0B1B3D]">Page Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">
          This custom page is either unpublished or does not exist.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 bg-[#0B1B3D] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
        >
          Back to Home →
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
