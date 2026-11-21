import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function pingSearchEnginesForUrl(slug: string, table: string) {
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    if (!siteUrl || siteUrl.includes("localhost")) return;
    const host = new URL(siteUrl).host;
    const targetPath =
      table === "batches" ? `/batches/${slug}` : `/current-affairs/${slug}`;
    const fullUrl = `${siteUrl}${targetPath}`;

    // Non-blocking IndexNow notification for instant search discovery
    await fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(fullUrl)}&key=${encodeURIComponent(
        process.env.INDEXNOW_KEY || "eca-indexnow-2026"
      )}&host=${encodeURIComponent(host)}`,
      { method: "GET" }
    ).catch(() => {});
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!process.env.BOT_API_SECRET || authHeader !== `Bearer ${process.env.BOT_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { table, payload } = body;
    const targetTable = table || "current_affairs";

    // Deduplication check by slug before inserting
    const { data, error } = await supabase
      .from(targetTable)
      .upsert([payload], { onConflict: "slug" })
      .select();

    if (error) throw error;

    if (payload?.slug) {
      pingSearchEnginesForUrl(payload.slug, targetTable);
    }

    return NextResponse.json({ status: "synced", data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
