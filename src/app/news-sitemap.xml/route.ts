import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";

function escapeXml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");
  const items: { loc: string; title: string; pubDate: string; keywords: string }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const [{ data: caRows }, { data: cmsRow }] = await Promise.all([
        supabase
          .from("current_affairs")
          .select("slug, title, exam_relevance, state_name, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("site_cms_state")
          .select("state_value")
          .eq("state_key", "nocode_cms")
          .single(),
      ]);

      if (caRows) {
        for (const row of caRows) {
          items.push({
            loc: `${siteUrl}/current-affairs/${row.slug}`,
            title: row.title,
            pubDate: row.created_at || new Date().toISOString(),
            keywords: [
              "UPSC Current Affairs",
              "State PCS",
              row.exam_relevance || "GS",
              row.state_name || "India",
            ]
              .filter(Boolean)
              .join(", "),
          });
        }
      }

      const customPages = cmsRow?.state_value?.customPages;
      if (Array.isArray(customPages)) {
        for (const p of customPages.filter((x: any) => x.active && x.slug).slice(0, 20)) {
          items.push({
            loc: `${siteUrl}/p/${p.slug}`,
            title: p.title,
            pubDate: new Date().toISOString(),
            keywords: `ETERNAL CIVIL ACADEMY, UPSC, State PCS, ${p.category || "Update"}`,
          });
        }
      }
    } catch {}
  }

  if (items.length === 0) {
    for (const ca of STRUCTURED_CURRENT_AFFAIRS) {
      items.push({
        loc: `${siteUrl}/current-affairs/${ca.slug}`,
        title: ca.title,
        pubDate: new Date().toISOString(),
        keywords: `UPSC Current Affairs, State PCS, ${ca.examRelevance}${ca.stateName ? `, ${ca.stateName}` : ""}`,
      });
    }
  }

  const urlsXml = items
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>ETERNAL CIVIL ACADEMY</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(item.pubDate)}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
      <news:keywords>${escapeXml(item.keywords)}</news:keywords>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
