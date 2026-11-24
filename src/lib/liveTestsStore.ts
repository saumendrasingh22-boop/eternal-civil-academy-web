import { getAdminAuthHeaders, syncCmsKeyToCloud } from "@/lib/adminTokenHelper";
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

export const DEFAULT_LIVE_TESTS: LiveMockTestItem[] = [];

const STORAGE_KEY = "eca_live_mock_tests_v1";

export function loadLiveTests(): LiveMockTestItem[] {
  if (typeof window === "undefined") return DEFAULT_LIVE_TESTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LIVE_TESTS;
    const parsed = JSON.parse(raw) as LiveMockTestItem[];
    return Array.isArray(parsed) ? parsed : DEFAULT_LIVE_TESTS;
  } catch {
    return DEFAULT_LIVE_TESTS;
  }
}

export function saveLiveTests(tests: LiveMockTestItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  window.dispatchEvent(new Event("eca-live-tests-updated"));
  // Non-blocking cross-device sync to Supabase if configured
  syncCmsKeyToCloud("live_tests", tests, 150);
}
