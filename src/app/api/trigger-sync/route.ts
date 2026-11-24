import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = (searchParams.get("key") || "").trim();
  const expected = (process.env.BOT_API_SECRET || "").trim();

  if (!expected || key !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const ghToken = (process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || "").trim();
  if (!ghToken) {
    return NextResponse.json(
      { ok: false, error: "Missing GITHUB_PAT environment variable in Vercel" },
      { status: 500 }
    );
  }

  const repo =
    process.env.GITHUB_REPO || "saumendrasingh22-boop/eternal-civil-academy-web";

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/auto-sync.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${ghToken}`,
          "User-Agent": "ECA-Cron-Trigger",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (res.status === 204 || res.ok) {
      return NextResponse.json({
        ok: true,
        triggered: true,
        workflow: "auto-sync.yml",
        at: new Date().toISOString(),
      });
    }

    const txt = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, status: res.status, error: txt.slice(0, 300) },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Dispatch failed" },
      { status: 500 }
    );
  }
}
