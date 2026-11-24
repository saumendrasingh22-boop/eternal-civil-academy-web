import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function formatIst(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return (
      new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return iso;
  }
}

function getNextFourHourCronUtc(): {
  nextSyncIso: string;
  nextSyncIst: string;
  minutesUntilNext: number;
} {
  const now = new Date();
  const next = new Date(now.getTime());
  next.setUTCMinutes(17, 0, 0);
  const currentHour = next.getUTCHours();
  let nextSlotHour = Math.floor(currentHour / 4) * 4;
  if (nextSlotHour < currentHour || (nextSlotHour === currentHour && now.getUTCMinutes() >= 17)) nextSlotHour += 4;
  if (nextSlotHour >= 24) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 17, 0, 0);
  } else {
    next.setUTCHours(nextSlotHour, 17, 0, 0);
  }
  const diffMs = Math.max(0, next.getTime() - now.getTime());
  return {
    nextSyncIso: next.toISOString(),
    nextSyncIst: formatIst(next.toISOString()),
    minutesUntilNext: Math.ceil(diffMs / 60000),
  };
}

export async function GET() {
  const repo =
    process.env.GITHUB_REPO || "saumendrasingh22-boop/eternal-civil-academy-web";
  const workflowFile = "auto-sync.yml";
  const nextSchedule = getNextFourHourCronUtc();

  let runs: Array<{
    id: number;
    runNumber: number;
    status: string;
    conclusion: string | null;
    event: string;
    startedAt: string;
    updatedAt: string;
    startedIst: string;
    updatedIst: string;
    durationSec: number;
    htmlUrl: string;
  }> = [];
  let githubError: string | null = null;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ECA-Admin-Monitor",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const ghRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/runs?per_page=10`,
      { headers, cache: "no-store" }
    );
    if (ghRes.ok) {
      const ghJson = await ghRes.json();
      const rawRuns = Array.isArray(ghJson?.workflow_runs)
        ? ghJson.workflow_runs
        : [];
      runs = rawRuns.map((r: any) => {
        const start = r.run_started_at || r.created_at;
        const end = r.updated_at || start;
        const durationSec =
          start && end
            ? Math.max(
                0,
                Math.round(
                  (new Date(end).getTime() - new Date(start).getTime()) / 1000
                )
              )
            : 0;
        return {
          id: r.id,
          runNumber: r.run_number,
          status: r.status || "unknown",
          conclusion: r.conclusion || null,
          event: r.event || "schedule",
          startedAt: start,
          updatedAt: end,
          startedIst: formatIst(start),
          updatedIst: formatIst(end),
          durationSec,
          htmlUrl: r.html_url || `https://github.com/${repo}/actions`,
        };
      });
    } else {
      githubError = `GitHub API returned HTTP ${ghRes.status}`;
    }
  } catch (err: any) {
    githubError = err?.message || "Failed to fetch GitHub Actions runs";
  }

  let totalArticles = 0;
  let lastArticleIst: string | null = null;
  let recentArticles: Array<{
    slug: string;
    title: string;
    category: string;
    createdIst: string;
  }> = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, count } = await supabase
        .from("current_affairs")
        .select("slug, title, title_hi, section_type, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .limit(5);

      totalArticles = count || 0;
      if (Array.isArray(data) && data.length > 0) {
        lastArticleIst = formatIst(data[0].created_at);
        recentArticles = data.map((row: any) => ({
          slug: row.slug || "",
          title: row.title || row.title_hi || "Untitled Article",
          category: row.section_type || "National",
          createdIst: formatIst(row.created_at),
        }));
      }
    } catch {
      // Non-fatal
    }
  }

  const latestRun = runs[0] || null;
  const lastSuccessRun =
    runs.find((r) => r.status === "completed" && r.conclusion === "success") ||
    null;
  const lastFailedRun =
    runs.find(
      (r) =>
        r.status === "completed" &&
        r.conclusion !== null &&
        r.conclusion !== "success"
    ) || null;
  const failedCountLast10 = runs.filter(
    (r) =>
      r.status === "completed" &&
      r.conclusion !== null &&
      r.conclusion !== "success"
  ).length;

  return NextResponse.json({
    checkedAtIst: formatIst(new Date().toISOString()),
    actionsUrl: `https://github.com/${repo}/actions/workflows/${workflowFile}`,
    scheduleText:
      "Every 4 Hours (05:47 AM, 09:47 AM, 01:47 PM, 05:47 PM, 09:47 PM, 01:47 AM IST)",
    nextSchedule,
    latestRun,
    lastSuccessRun,
    lastFailedRun,
    failedCountLast10,
    runs,
    githubError,
    database: {
      totalArticles,
      lastArticleIst,
      recentArticles,
    },
  });
}
