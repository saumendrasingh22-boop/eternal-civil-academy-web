import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_TELEGRAM_MISTAKES } from "@/lib/siteData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listType = searchParams.get("list");
  const attempt = searchParams.get("attempt");
  const user = searchParams.get("user");

  // 1. List live synced Telegram quizzes for /test-series & /test-series/live-cbt
  if (listType === "quizzes") {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data } = await supabase
          .from("test_series")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (data && data.length > 0) {
          return NextResponse.json({ source: "supabase", quizzes: data });
        }
      } catch {}
    }
    return NextResponse.json({ source: "fallback", quizzes: [] });
  }

  // 2. Fetch candidate mistakes for /test-series/mistakes
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && attempt) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data } = await supabase
        .from("telegram_quiz_attempts")
        .select("*")
        .eq("attempt_code", attempt)
        .single();

      if (data?.mistakes_json) {
        return NextResponse.json({ attempt: data.attempt_code, mistakes: data.mistakes_json });
      }
    } catch {}
  }

  return NextResponse.json({
    attempt: attempt || "TG-ATTEMPT-142",
    user: user || "aspirant",
    mistakes: SAMPLE_TELEGRAM_MISTAKES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!process.env.BOT_API_SECRET || authHeader !== `Bearer ${process.env.BOT_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, quizPayload, attemptPayload, pdfPayload } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Auto-upload Telegram Bot Quiz directly into Free Live Test Series (Duplicate-Proof via slug)
    if (action === "sync_quiz" && quizPayload) {
      const { data, error } = await supabase
        .from("test_series")
        .upsert(
          [
            {
              slug: quizPayload.slug,
              series_type: "free_live",
              source_channel: "telegram_bot",
              exam_tag: quizPayload.exam_tag || "UPSC / PCS",
              title: quizPayload.title,
              questions_json: quizPayload.questions,
              total_tests: 1,
              duration_minutes: quizPayload.duration_minutes || 15,
              price_inr: 0,
            },
          ],
          { onConflict: "slug" }
        )
        .select();

      if (error) throw error;
      return NextResponse.json({ status: "quiz_synced_to_live_test_series", data });
    }

    // 2. Duplicate-Proof Auto-Sync for Test / Study PDFs from Telegram Bot (onConflict: slug)
    if (action === "sync_pdf" && pdfPayload) {
      const { data, error } = await supabase
        .from("study_materials")
        .upsert(
          [
            {
              slug: pdfPayload.slug,
              pillar: pdfPayload.pillar || "test_series_pdf",
              sub_category: pdfPayload.sub_category || "Telegram Auto-Sync",
              title: pdfPayload.title,
              is_paid: false,
              price_inr: 0,
              english_pdf_url: pdfPayload.english_pdf_url || null,
              hindi_pdf_url: pdfPayload.hindi_pdf_url || null,
            },
          ],
          { onConflict: "slug" }
        )
        .select();

      if (error) throw error;
      return NextResponse.json({ status: "pdf_synced_deduplicated", data });
    }

    // 3. Save Candidate Quiz Attempt & Mistakes for "See Mistakes" button
    if (action === "sync_attempt" && attemptPayload) {
      const { data, error } = await supabase
        .from("telegram_quiz_attempts")
        .upsert([attemptPayload], { onConflict: "attempt_code" })
        .select();

      if (error) throw error;
      return NextResponse.json({
        status: "attempt_saved",
        see_mistakes_url: `${process.env.NEXT_PUBLIC_SITE_URL}/test-series/mistakes?attempt=${attemptPayload.attempt_code}&user=${attemptPayload.telegram_user_id}`,
        data,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
