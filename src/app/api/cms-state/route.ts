import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_KEYS = new Set(["nocode_cms", "batches", "cover_slides", "live_tests", "premium_books", "custom_content", "site_settings"]);
const MAX_PAYLOAD_BYTES = 512 * 1024; // 500 KB max payload limit

function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET /api/cms-state?key=all OR ?key=nocode_cms
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const supabase = getSupabaseAdmin();

  if (!supabase || !key) {
    return NextResponse.json({ synced: false, value: null });
  }

  try {
    if (key === "all") {
      const { data, error } = await supabase
        .from("site_cms_state")
        .select("state_key, state_value")
        .in("state_key", Array.from(ALLOWED_KEYS));

      if (error || !data || data.length === 0) {
        return NextResponse.json({ synced: false, values: {} });
      }
      const values: Record<string, unknown> = {};
      for (const row of data) {
        values[row.state_key] = row.state_value;
      }
      return NextResponse.json({ synced: true, values });
    }

    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: "Invalid CMS key" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("site_cms_state")
      .select("state_value")
      .eq("state_key", key)
      .single();

    if (error || !data) {
      return NextResponse.json({ synced: false, value: null });
    }
    return NextResponse.json({ synced: true, value: data.state_value });
  } catch {
    return NextResponse.json({ synced: false, value: null });
  }
}

// POST /api/cms-state — STRICT SERVER-SIDE AUTH + WHITELIST + SIZE LIMIT + AUDIT LOG
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ synced: false, mode: "local_only" });
  }

  try {
    // 1. Payload size guard
    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large (max 500KB)" }, { status: 413 });
    }

    // 2. Server-Side Admin Authentication (Supabase JWT OR BOT_API_SECRET)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    let actorEmail = "unknown";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Admin authentication required." }, { status: 401 });
    }

    if (process.env.BOT_API_SECRET && token === process.env.BOT_API_SECRET) {
      actorEmail = "system_bot";
    } else {
      const { data: userData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !userData?.user?.email) {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired admin session." }, { status: 401 });
      }
      actorEmail = userData.user.email.toLowerCase();
    }

    // 3. Whitelist key validation
    const { key, value } = JSON.parse(rawBody);
    if (!key || !ALLOWED_KEYS.has(String(key))) {
      return NextResponse.json({ error: "Forbidden: Disallowed CMS key." }, { status: 400 });
    }

    const { error } = await supabase
      .from("site_cms_state")
      .upsert(
        [{ state_key: key, state_value: value, updated_at: new Date().toISOString() }],
        { onConflict: "state_key" }
      );
    if (error) {
      return NextResponse.json({ synced: false, error: error.message }, { status: 500 });
    }

    // 4. Write Admin Audit Log (non-blocking)
    try {
      await supabase.from("admin_audit_logs").insert([
        {
          actor_email: actorEmail,
          action: "UPSERT_CMS_STATE",
          target_key: String(key),
          summary: `Updated ${key} (${rawBody.length} bytes)`,
        },
      ]);
    } catch {}

    // 5. Instant IndexNow ping for new Batches or Custom Pages
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
      if (siteUrl && !siteUrl.includes("localhost")) {
        const host = new URL(siteUrl).host;
        const pingUrl =
          key === "batches" && Array.isArray(value) && value[0]?.slug
            ? `${siteUrl}/batches/${value[0].slug}`
            : key === "nocode_cms" && Array.isArray(value?.customPages) && value.customPages[0]?.slug
            ? `${siteUrl}/p/${value.customPages[0].slug}`
            : `${siteUrl}/sitemap.xml`;
        fetch(
          `https://api.indexnow.org/indexnow?url=${encodeURIComponent(pingUrl)}&key=${encodeURIComponent(
            process.env.INDEXNOW_KEY || "eca-indexnow-2026"
          )}&host=${encodeURIComponent(host)}`
        ).catch(() => {});
      }
    } catch {}

    return NextResponse.json({ synced: true, actor: actorEmail });
  } catch (err: any) {
    return NextResponse.json({ synced: false, error: err?.message || "Invalid request" }, { status: 400 });
  }
}
