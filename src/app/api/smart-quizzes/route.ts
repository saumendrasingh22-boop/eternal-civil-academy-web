import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SmartQuizItem } from "@/lib/smartQuizzesTypes";
import type { BilingualCbtQuestion } from "@/lib/siteData";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const STATE_KEY = "smart_quizzes_v1";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (u, o) => fetch(u, { ...o, cache: "no-store" }) },
  });
}

async function verifyAdminRequest(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const botSecret = (process.env.BOT_API_SECRET || "").trim();
  if (botSecret && token === botSecret) return true;

  const sb = getSupabaseAdmin();
  if (!sb) return false;
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user?.email) return false;
    return true;
  } catch {
    return false;
  }
}

async function loadAllQuizzes(): Promise<SmartQuizItem[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("site_cms_state")
    .select("state_value")
    .eq("state_key", STATE_KEY)
    .maybeSingle();
  return Array.isArray(data?.state_value) ? (data.state_value as SmartQuizItem[]) : [];
}

async function saveAllQuizzes(items: SmartQuizItem[]): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return "Supabase not configured";
  const { error } = await sb.from("site_cms_state").upsert(
    { state_key: STATE_KEY, state_value: items, updated_at: new Date().toISOString() },
    { onConflict: "state_key" }
  );
  return error ? error.message : null;
}

async function callLlmJson(prompt: string): Promise<any | null> {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (geminiKey) {
    for (const model of ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"]) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (txt) return JSON.parse(txt.replace(/^```json\s*|\s*```$/g, "").trim());
        }
      } catch {}
    }
  }

  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are an expert UPSC/UPPSC bilingual translator. Always return strict valid JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content || "";
        if (txt) return JSON.parse(txt);
      }
    } catch {}
  }

  return null;
}


async function triggerSmartQuizPdfWorkflow(quizSlug: string): Promise<boolean> {
  const ghToken = (process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || "").trim();
  const repo = (process.env.GITHUB_REPO || "saumendrasingh22-boop/eternal-civil-academy-web").trim();
  if (!ghToken) return false;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/smart-quiz-pdf.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${ghToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main", inputs: { quiz_slug: quizSlug || "" } }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target");
    const slug = searchParams.get("slug");
    const all = await loadAllQuizzes();

    if (slug) {
      const found = all.find((q) => q.slug === slug || q.id === slug) || null;
      return NextResponse.json(
        { quiz: found },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
      );
    }

    const filtered = target ? all.filter((q) => q.targetSection === target) : all;
    return NextResponse.json(
      { quizzes: filtered },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ quizzes: [], error: err?.message || "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authorized = await verifyAdminRequest(req);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Admin login required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "translate") {
      const sourceLang: "hi" | "en" = body?.sourceLang === "en" ? "en" : "hi";
      const targetLang = sourceLang === "hi" ? "English" : "pure standard Devanagari Hindi (UPSC/UPPSC exam style, zero Urdu/Arabic script)";
      const batch: BilingualCbtQuestion[] = Array.isArray(body?.questions) ? body.questions : [];
      const titleText = String(body?.title || "").trim();

      const payload = batch.map((q) => ({
        id: q.id,
        question: sourceLang === "hi" ? q.questionHi : q.questionEn,
        options: sourceLang === "hi" ? q.optionsHi : q.optionsEn,
        explanation: sourceLang === "hi" ? q.explanationHi : q.explanationEn,
      }));

      const prompt = `Translate the following UPSC/State PCS quiz items accurately into ${targetLang}.
Preserve exact numbering, line breaks (\\n), dates, figures, proper nouns, and ★ [PYQ] tags.
Return STRICT JSON of shape:
{
  "translatedTitle": "...",
  "items": [
    { "id": 1, "question": "...", "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, "explanation": "..." }
  ]
}
Title to translate: ${JSON.stringify(titleText)}
Items: ${JSON.stringify(payload)}`;

      const translated = await callLlmJson(prompt);
      if (!translated || !Array.isArray(translated.items)) {
        return NextResponse.json({ ok: false, error: "Translation service busy, keeping original text as fallback", items: batch });
      }

      const byId = new Map<number, any>();
      for (const it of translated.items) byId.set(Number(it.id), it);

      const merged = batch.map((q) => {
        const tr = byId.get(q.id);
        if (!tr) return q;
        if (sourceLang === "hi") {
          return {
            ...q,
            questionEn: String(tr.question || q.questionEn),
            optionsEn: {
              A: String(tr.options?.A || q.optionsEn.A),
              B: String(tr.options?.B || q.optionsEn.B),
              C: String(tr.options?.C || q.optionsEn.C),
              D: String(tr.options?.D || q.optionsEn.D),
            },
            explanationEn: String(tr.explanation || q.explanationEn),
          };
        }
        return {
          ...q,
          questionHi: String(tr.question || q.questionHi),
          optionsHi: {
            A: String(tr.options?.A || q.optionsHi.A),
            B: String(tr.options?.B || q.optionsHi.B),
            C: String(tr.options?.C || q.optionsHi.C),
            D: String(tr.options?.D || q.optionsHi.D),
          },
          explanationHi: String(tr.explanation || q.explanationHi),
        };
      });

      return NextResponse.json({
        ok: true,
        translatedTitle: String(translated.translatedTitle || titleText),
        items: merged,
      });
    }

    if (action === "save") {
      const quiz = body?.quiz as SmartQuizItem;
      if (!quiz || !quiz.id || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return NextResponse.json({ ok: false, error: "Invalid quiz payload" }, { status: 400 });
      }
      const existing = await loadAllQuizzes();
      const next = [quiz, ...existing.filter((x) => x.id !== quiz.id)];
      const err = await saveAllQuizzes(next);
      if (err) return NextResponse.json({ ok: false, error: err }, { status: 500 });
      const pdfTriggered = await triggerSmartQuizPdfWorkflow(quiz.slug);
      return NextResponse.json({ ok: true, quiz, total: next.length, pdfTriggered });
    }

    if (action === "rebuild_pdfs") {
      const slug = String(body?.slug || "");
      const ok = await triggerSmartQuizPdfWorkflow(slug);
      return NextResponse.json({ ok, triggered: ok });
    }

    if (action === "delete") {
      const id = String(body?.id || "");
      const existing = await loadAllQuizzes();
      const next = existing.filter((x) => x.id !== id);
      const err = await saveAllQuizzes(next);
      if (err) return NextResponse.json({ ok: false, error: err }, { status: 500 });
      return NextResponse.json({ ok: true, total: next.length });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
