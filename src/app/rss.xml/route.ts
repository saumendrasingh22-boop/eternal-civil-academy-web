import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import { DEFAULT_BATCHES } from "@/lib/batchesStore";

function esc(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://eternalcivilacademy.com").replace(/\/$/, "");
  const entries: { title: string; link: string; description: string; pubDate: string; category: string }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const [{ data: caRows }, { data: cmsRow }] = await Promise.all([
        supabase
          .from("current_affairs")
          .select("slug, title, why_in_news, exam_relevance, created_at")
          .order("created_at", { ascending: false })
          .limit(35),
        supabase
          .from("site_cms_state")
          .select("state_value")
          .eq("state_key", "nocode_cms")
          .single(),
      ]);

      caRows?.forEach((r: any) => {
        entries.push({
          title: r.title,
          link: `${siteUrl}/current-affairs/${r.slug}`,
          description: r.why_in_news || r.title,
          pubDate: new Date(r.created_at || Date.now()).toUTCString(),
          category: r.exam_relevance || "Current Affairs",
        });
      });

      const customPages = cmsRow?.state_value?.customPages;
      if (Array.isArray(customPages)) {
        customPages
          .filter((p: any) => p.active && p.slug)
          .slice(0, 15)
          .forEach((p: any) => {
            entries.push({
              title: p.title,
              link: `${siteUrl}/p/${p.slug}`,
              description: (p.subtitle || p.content || p.title).slice(0, 240),
              pubDate: new Date().toUTCString(),
              category: p.category || "ECA Update",
            });
          });
      }
    } catch {}
  }

  if (entries.length === 0) {
    STRUCTURED_CURRENT_AFFAIRS.forEach((ca) => {
      entries.push({
        title: ca.title,
        link: `${siteUrl}/current-affairs/${ca.slug}`,
        description: ca.whyInNews,
        pubDate: new Date().toUTCString(),
        category: ca.examRelevance,
      });
    });
  }

  DEFAULT_BATCHES.slice(0, 4).forEach((b) => {
    entries.push({
      title: `New Batch: ${b.title}`,
      link: `${siteUrl}/batches/${b.slug}`,
      description: b.description,
      pubDate: new Date().toUTCString(),
      category: `${b.examTag} Batch`,
    });
  });

  const itemsXml = entries
    .map(
      (item) => `    <item>
      <title>${esc(item.title)}</title>
      <link>${esc(item.link)}</link>
      <guid isPermaLink="true">${esc(item.link)}</guid>
      <description>${esc(item.description)}</description>
      <category>${esc(item.category)}</category>
      <pubDate>${esc(item.pubDate)}</pubDate>
      <enclosure url="${esc(`${siteUrl}/logo.jpg`)}" type="image/jpeg" />
    </item>`
    )
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ETERNAL CIVIL ACADEMY — Daily Current Affairs, Batches &amp; Exam Updates</title>
    <link>${esc(siteUrl)}</link>
    <description>Your Success, Our Commitment — Structured UPSC &amp; State PCS Current Affairs, Live Test Series, New Batches &amp; Free Student Tools.</description>
    <language>en-in</language>
    <atom:link href="${esc(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${esc(`${siteUrl}/logo.jpg`)}</url>
      <title>ETERNAL CIVIL ACADEMY</title>
      <link>${esc(siteUrl)}</link>
    </image>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
