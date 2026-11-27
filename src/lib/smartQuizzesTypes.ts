import type { BilingualCbtQuestion } from "./siteData";

export type SmartQuizTarget =
  | "test_series"
  | "pyq"
  | "daily_practice"
  | "current_affairs"
  | "state_special"
  | "material"
  | "monthly_magazine"
  | "batches"
  | "student_hub";

export const SMART_QUIZ_SECTIONS: { id: SmartQuizTarget; label: string; path: string }[] = [
  { id: "test_series", label: "Test Series Section (/test-series)", path: "/test-series" },
  { id: "pyq", label: "PYQ Section (/pyq)", path: "/pyq" },
  { id: "daily_practice", label: "Daily Practice Test (/daily-practice-test)", path: "/daily-practice-test" },
  { id: "current_affairs", label: "Daily Current Affairs (/current-affairs)", path: "/current-affairs" },
  { id: "state_special", label: "State Special Current Affairs (/state-special)", path: "/state-special" },
  { id: "material", label: "Material & Notes (/material)", path: "/material" },
  { id: "monthly_magazine", label: "Monthly Magazine (/monthly-magazine)", path: "/monthly-magazine" },
  { id: "batches", label: "Batches Section (/batches)", path: "/batches" },
  { id: "student_hub", label: "Student Hub (/student-hub)", path: "/student-hub" },
];

export type SmartQuizPublishMode = "live_now" | "scheduled" | "direct_pdf_quiz";

export interface SmartQuizItem {
  id: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  targetSection: SmartQuizTarget;
  commissionOrExam: string;
  yearOrTag: string;
  pricingType: "free" | "paid";
  priceInr: number;
  publishMode: SmartQuizPublishMode;
  scheduledAtIso?: string;
  durationMinutes: number;
  positiveMarks: number;
  negativeMarks: number;
  sourceLang: "hi" | "en";
  questions: BilingualCbtQuestion[];
  pdfUrls?: { qEn?: string; qHi?: string; sEn?: string; sHi?: string };
  createdAt: string;
}
