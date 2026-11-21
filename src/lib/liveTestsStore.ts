import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
import { CBT_QUESTIONS, BilingualCbtQuestion } from "@/lib/siteData";

export interface LiveMockTestItem {
  id: string;
  slug: string;
  title: string;
  examTag: string;
  seriesType: "free_live" | "paid_series";
  source: "website" | "telegram_bot";
  durationMinutes: number;
  priceInr: number;
  date: string;
  questions: BilingualCbtQuestion[];
  isActive: boolean;
  uploadedBy: string;
}

export const DEFAULT_LIVE_TESTS: LiveMockTestItem[] = [
  {
    id: "live-daily-gs-1",
    slug: "daily-gs-and-current-affairs-live-mock-test",
    title: "Daily GS & Current Affairs Live Mock Test",
    examTag: "UPSC / UPPSC",
    seriesType: "free_live",
    source: "website",
    durationMinutes: 10,
    priceInr: 0,
    date: "20 Nov 2026",
    questions: CBT_QUESTIONS,
    isActive: true,
    uploadedBy: "super_admin",
  },
  {
    id: "tg-quiz-2026-11-20",
    slug: "telegram-live-quiz-142-ca-polity",
    title: "Telegram Live Quiz #142 — Daily Current Affairs & Polity",
    examTag: "UPSC / UPPSC",
    seriesType: "free_live",
    source: "telegram_bot",
    durationMinutes: 10,
    priceInr: 0,
    date: "20 Nov 2026",
    questions: CBT_QUESTIONS,
    isActive: true,
    uploadedBy: "telegram_bot",
  },
  {
    id: "tg-quiz-2026-11-19",
    slug: "telegram-live-quiz-141-history-geography",
    title: "Telegram Live Quiz #141 — Modern History & Geography",
    examTag: "BPSC / HPSC",
    seriesType: "free_live",
    source: "telegram_bot",
    durationMinutes: 10,
    priceInr: 0,
    date: "19 Nov 2026",
    questions: CBT_QUESTIONS,
    isActive: true,
    uploadedBy: "telegram_bot",
  },
];

const STORAGE_KEY = "eca_live_mock_tests_v1";

export function loadLiveTests(): LiveMockTestItem[] {
  if (typeof window === "undefined") return DEFAULT_LIVE_TESTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LIVE_TESTS;
    const parsed = JSON.parse(raw) as LiveMockTestItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LIVE_TESTS;
  } catch {
    return DEFAULT_LIVE_TESTS;
  }
}

export function saveLiveTests(tests: LiveMockTestItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  window.dispatchEvent(new Event("eca-live-tests-updated"));
  // Non-blocking cross-device sync to Supabase if configured
  fetch("/api/cms-state", {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ key: "live_tests", value: tests }),
  }).catch(() => {});
}
