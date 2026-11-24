"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  XCircle,
  Database,
} from "lucide-react";

interface SyncRun {
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
}

interface SyncStatusData {
  checkedAtIst: string;
  actionsUrl: string;
  scheduleText: string;
  nextSchedule: {
    nextSyncIso: string;
    nextSyncIst: string;
    minutesUntilNext: number;
  };
  latestRun: SyncRun | null;
  lastSuccessRun: SyncRun | null;
  lastFailedRun: SyncRun | null;
  failedCountLast10: number;
  runs: SyncRun[];
  githubError: string | null;
  database: {
    totalArticles: number;
    lastArticleIst: string | null;
    recentArticles: Array<{
      slug: string;
      title: string;
      category: string;
      createdIst: string;
    }>;
  };
}

function formatCountdown(mins: number): string {
  if (mins <= 1) return "Less than 1 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `In ${m} min`;
  return `In ${h} hr ${m} min`;
}

function formatDuration(sec: number): string {
  if (!sec || sec < 1) return "< 1s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminAutoSyncMonitor() {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync-status", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // handled in UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const latest = data?.latestRun;
  const isLatestFailed =
    latest &&
    latest.status === "completed" &&
    latest.conclusion !== null &&
    latest.conclusion !== "success";
  const isLatestRunning = latest && latest.status !== "completed";

  return (
    <div className="mt-6 bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-[#E60000]" />
          <div>
            <h2 className="text-base font-extrabold text-[#0B1B3D]">
              Live Auto-Sync Monitor (Current Affairs)
            </h2>
            <p className="text-[11px] text-slate-500">
              {data?.scheduleText || "Runs automatically every 4 hours"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!loading && latest && (
            <span
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                isLatestFailed
                  ? "bg-red-100 text-[#E60000]"
                  : isLatestRunning
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isLatestFailed
                ? `Last Run Failed (${latest.conclusion})`
                : isLatestRunning
                ? "Sync Running Now..."
                : "Auto-Sync Healthy"}
            </span>
          )}
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Checking..." : "Refresh"}</span>
          </button>
          {data?.actionsUrl && (
            <a
              href={data.actionsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <span>GitHub Logs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Red Alert Banner if latest or recent run failed */}
      {data?.lastFailedRun && (
        <div
          className={`mt-4 rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
            isLatestFailed
              ? "bg-red-50 border-red-300 text-red-900"
              : "bg-amber-50 border-amber-300 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {isLatestFailed ? (
              <XCircle className="w-5 h-5 text-[#E60000] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-extrabold">
                {isLatestFailed
                  ? `ALERT: Latest Auto-Sync Run #${data.lastFailedRun.runNumber} FAILED!`
                  : `Notice: ${data.failedCountLast10} failed run(s) in last 10 runs (Latest failure: Run #${data.lastFailedRun.runNumber})`}
              </div>
              <div className="mt-0.5 opacity-90">
                Failed at: <strong>{data.lastFailedRun.updatedIst}</strong> • Result:{" "}
                <strong className="uppercase">{data.lastFailedRun.conclusion}</strong>
              </div>
            </div>
          </div>
          <a
            href={data.lastFailedRun.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
          >
            <span>View Failure Reason</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {data?.githubError && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          GitHub Actions status note: {data.githubError}. Showing live Supabase database sync data below.
        </div>
      )}

      {/* 3 Main Status Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Last Sync */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Last Auto-Sync</span>
            {isLatestFailed ? (
              <XCircle className="w-4 h-4 text-[#E60000]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="mt-1.5 text-sm font-extrabold text-[#0B1B3D]">
            {loading
              ? "Loading..."
              : latest
              ? latest.updatedIst
              : data?.database?.lastArticleIst || "No runs found yet"}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 space-y-0.5">
            {latest ? (
              <>
                <div>
                  Run <strong>#{latest.runNumber}</strong> •{" "}
                  {latest.event === "schedule" ? "Automatic (Cron)" : "Manual Trigger"} •{" "}
                  {formatDuration(latest.durationSec)}
                </div>
                {data?.lastSuccessRun && isLatestFailed && (
                  <div className="text-emerald-700 font-semibold">
                    Last Success: {data.lastSuccessRun.updatedIst}
                  </div>
                )}
              </>
            ) : (
              <div>Last DB save: {data?.database?.lastArticleIst || "—"}</div>
            )}
          </div>
        </div>

        {/* Card 2: Next Scheduled Sync */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Next Scheduled Sync</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-sm font-extrabold text-[#0B1B3D]">
            {data?.nextSchedule?.nextSyncIst || "Calculating..."}
          </div>
          <div className="mt-1 text-[11px] text-blue-700 font-bold">
            {data?.nextSchedule
              ? formatCountdown(data.nextSchedule.minutesUntilNext)
              : ""}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            GitHub Cron: 05:47, 09:47, 13:47, 17:47, 21:47, 01:47 IST
          </div>
        </div>

        {/* Card 3: Supabase Live Articles */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Live Current Affairs DB</span>
            <Database className="w-4 h-4 text-[#0B1B3D]" />
          </div>
          <div className="mt-1.5 text-sm font-extrabold text-[#0B1B3D]">
            {loading
              ? "Loading..."
              : `${data?.database?.totalArticles ?? 0} Articles Live`}
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            Newest article saved:{" "}
            <strong>{data?.database?.lastArticleIst || "—"}</strong>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            Failed in last 10 runs:{" "}
            <strong
              className={
                (data?.failedCountLast10 || 0) > 0
                  ? "text-[#E60000]"
                  : "text-emerald-700"
              }
            >
              {data?.failedCountLast10 ?? 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Expandable Last 10 Sync Runs History */}
      {data && data.runs.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-extrabold text-[#0B1B3D] hover:text-[#E60000] underline"
          >
            {showHistory
              ? "Hide Last 10 Auto-Sync Runs"
              : `Show Last ${data.runs.length} Auto-Sync Runs (Success & Failed History)`}
          </button>

          {showHistory && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[#0B1B3D] font-extrabold">
                  <tr>
                    <th className="px-3 py-2">Run</th>
                    <th className="px-3 py-2">Date & Time (IST)</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.runs.map((r) => {
                    const failed =
                      r.status === "completed" &&
                      r.conclusion !== null &&
                      r.conclusion !== "success";
                    const running = r.status !== "completed";
                    return (
                      <tr key={r.id} className={failed ? "bg-red-50/50" : ""}>
                        <td className="px-3 py-2 font-mono font-bold">
                          #{r.runNumber}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">
                          {r.updatedIst}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {r.event === "schedule" ? "Auto Cron" : "Manual"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                              failed
                                ? "bg-red-100 text-[#E60000]"
                                : running
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {running ? r.status : r.conclusion || "completed"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDuration(r.durationSec)}
                        </td>
                        <td className="px-3 py-2">
                          <a
                            href={r.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
