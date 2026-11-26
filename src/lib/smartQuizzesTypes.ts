import type { BilingualCbtQuestion } from "./siteData";

export type SmartQuizTarget = "pyq" | "test_series";
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
  createdAt: string;
}
