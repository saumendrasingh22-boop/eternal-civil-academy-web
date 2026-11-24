import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export interface DailyPdfEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
  source?: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const sb = getSupabaseAdmin();
  const byDate = new Map<string, DailyPdfEntry>();

  if (sb) {
    try {
      const { data } = await sb
        .from("site_cms_state")
        .select("state_key, state_value")
        .in("state_key", ["daily_pdfs", "custom_content"]);

      if (Array.isArray(data)) {
        const botRow = data.find((r) => r.state_key === "daily_pdfs");
        const customRow = data.find((r) => r.state_key === "custom_content");

        if (Array.isArray(customRow?.state_value)) {
          for (const c of customRow.state_value as any[]) {
            const sec = String(c?.section || "").toLowerCase();
            if (!sec.includes("daily") && !sec.includes("current affairs")) continue;
            const d = String(c?.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
            const key = `${d}::${c?.id || c?.title || ""}`;
            byDate.set(key, {
              id: String(c?.id || key),
              date: d,
              title: String(c?.title || `Daily Current Affairs PDF - ${d}`),
              englishPdfUrl: String(c?.englishPdfUrl || ""),
              hindiPdfUrl: String(c?.hindiPdfUrl || ""),
              source: "admin",
            });
          }
        }

        if (Array.isArray(botRow?.state_value)) {
          for (const b of botRow.state_value as any[]) {
            const d = String(b?.date || "").slice(0, 10);
            if (!d) continue;
            byDate.set(`bot::${d}`, {
              id: String(b?.id || `bot-${d}`),
              date: d,
              title: String(b?.title || `Daily Current Affairs PDF - ${d}`),
              englishPdfUrl: String(b?.englishPdfUrl || ""),
              hindiPdfUrl: String(b?.hindiPdfUrl || ""),
              source: "bot",
            });
          }
        }
      }
    } catch {}
  }

  const items = Array.from(byDate.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
  );
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const secret = (process.env.BOT_API_SECRET || "").trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const date = String(body?.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const entry: DailyPdfEntry = {
      id: `bot-${date}`,
      date,
      title: String(body?.title || `Daily Current Affairs PDF - ${date}`),
      englishPdfUrl: String(body?.englishPdfUrl || "").trim(),
      hindiPdfUrl: String(body?.hindiPdfUrl || "").trim(),
      source: "bot",
    };

    const { data: existingRow } = await sb
      .from("site_cms_state")
      .select("state_value")
      .eq("state_key", "daily_pdfs")
      .single();

    const prev: DailyPdfEntry[] = Array.isArray(existingRow?.state_value)
      ? existingRow.state_value
      : [];
    const filtered = prev.filter((x) => x.date !== date);
    const next = [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));

    const { error } = await sb
      .from("site_cms_state")
      .upsert(
        { state_key: "daily_pdfs", state_value: next, updated_at: new Date().toISOString() },
        { onConflict: "state_key" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: entry, total: next.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Invalid request" }, { status: 400 });
  }
}
