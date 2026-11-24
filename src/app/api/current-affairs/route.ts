export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { BilingualCurrentAffairItem } from "@/lib/bilingualCaMap";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const section = searchParams.get("section");

  let liveArticles: BilingualCurrentAffairItem[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      let query = supabase
        .from("current_affairs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);

      if (state) query = query.eq("state_name", state);
      if (section) query = query.eq("section_type", section);

      const { data } = await query;
      if (data && data.length > 0) {
        const hasHi = (v: unknown) => /[\u0900-\u097F]/.test(String(v || ""));
      const isCleanBilingual = (r: any) => !hasHi(r.title) && !hasHi(r.why_in_news) && hasHi(r.title_hi) && hasHi(r.why_in_news_hi) && hasHi(r.mains_perspective_hi) && Array.isArray(r.key_highlights_hi) && r.key_highlights_hi.length > 0 && hasHi(r.key_highlights_hi[0]) && Array.isArray(r.prelims_facts_hi) && r.prelims_facts_hi.length > 0 && hasHi(r.prelims_facts_hi[0]);
      liveArticles = data.filter(isCleanBilingual).map((row: any) => ({
          id: row.id,
          slug: row.slug,
          sectionType: row.section_type,
          stateName: row.state_name || undefined,
          examRelevance: row.exam_relevance || "GS-2",
          title: row.title,
          titleHi: row.title_hi || undefined,
          whyInNews: row.why_in_news,
          whyInNewsHi: row.why_in_news_hi || undefined,
          keyHighlights: Array.isArray(row.key_highlights) ? row.key_highlights : [],
          keyHighlightsHi: Array.isArray(row.key_highlights_hi) ? row.key_highlights_hi : undefined,
          prelimsFacts: Array.isArray(row.prelims_facts) ? row.prelims_facts : [],
          prelimsFactsHi: Array.isArray(row.prelims_facts_hi) ? row.prelims_facts_hi : undefined,
          mainsPerspective: row.mains_perspective || "",
          mainsPerspectiveHi: row.mains_perspective_hi || undefined,
          date: row.published_date || new Date().toISOString().slice(0, 10),
          englishPdfUrl: row.english_pdf_url || "#download-english-ca",
          hindiPdfUrl: row.hindi_pdf_url || "#download-hindi-ca",
          uploadedBy: row.uploaded_by || "auto_sync",
          isLocked: Boolean(row.is_locked),
        }));
      }
    } catch {}
  }

  const seenSlugs = new Set(liveArticles.map((a) => a.slug));
  const fallbackFiltered = STRUCTURED_CURRENT_AFFAIRS.filter((a) => {
    if (seenSlugs.has(a.slug)) return false;
    if (state && a.stateName !== state) return false;
    if (section && a.sectionType !== section) return false;
    return true;
  });

  return NextResponse.json({
    source: liveArticles.length > 0 ? "supabase_live_plus_curated" : "curated_default",
    articles: liveArticles.length > 0 ? liveArticles : fallbackFiltered,
  });
}
