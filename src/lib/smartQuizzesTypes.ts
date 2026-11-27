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
  subSection?: string;
  subjectTag?: string;
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

export const SMART_QUIZ_SUBSECTIONS: Record<SmartQuizTarget, string[]> = {
  test_series: [
    "Full-Length Mock",
    "NCERT Class 06",
    "NCERT Class 07",
    "NCERT Class 08",
    "NCERT Class 09",
    "NCERT Class 10",
    "NCERT Class 11",
    "NCERT Class 12",
    "NCERT Class 01-05",
    "Subject-Wise Test",
    "Current Affairs Mock",
    "CSAT Practice",
  ],
  pyq: [
    "Prelims GS-I PYQ",
    "Prelims CSAT PYQ",
    "RO/ARO PYQ",
    "Subject-Wise PYQ",
    "Topic-Wise PYQ",
    "NCERT Based PYQ",
  ],
  daily_practice: [
    "Daily NCERT Quiz",
    "Daily CA MCQ",
    "NCERT Class 06",
    "NCERT Class 07",
    "NCERT Class 08",
    "NCERT Class 09",
    "NCERT Class 10",
    "NCERT Class 11",
    "NCERT Class 12",
    "Quick Revision",
  ],
  current_affairs: [
    "Monthly Compilation",
    "Weekly Current Affairs",
    "National & International",
    "Economy & Budget",
    "Schemes & Reports",
    "Science & Defence",
  ],
  state_special: [
    "UP Special",
    "Bihar Special",
    "Rajasthan Special",
    "MP Special",
    "Haryana Special",
    "Uttarakhand Special",
    "Jharkhand Special",
  ],
  material: [
    "NCERT Class 06",
    "NCERT Class 07",
    "NCERT Class 08",
    "NCERT Class 09",
    "NCERT Class 10",
    "NCERT Class 11",
    "NCERT Class 12",
    "NCERT Class 01-05",
    "Standard Books",
    "Short Revision Notes",
  ],
  monthly_magazine: [
    "Monthly Magazine MCQs",
    "Yearly Compilation",
    "Budget & Economic Survey",
    "PIB Summary",
  ],
  batches: [
    "Foundation Batch",
    "Prelims Booster",
    "NCERT Foundation",
    "RO/ARO Target Batch",
    "State PCS Batch",
  ],
  student_hub: [
    "NCERT Class 06",
    "NCERT Class 07",
    "NCERT Class 08",
    "NCERT Class 09",
    "NCERT Class 10",
    "NCERT Class 11",
    "NCERT Class 12",
    "Self-Assessment",
  ],
};

export const SMART_QUIZ_SUBJECTS: string[] = [
  "All Subjects / Full GS",
  "History",
  "Polity & Governance",
  "Geography",
  "Economy",
  "General Science",
  "Environment & Ecology",
  "Current Affairs",
  "Art & Culture",
  "CSAT",
  "State Special",
  "General Hindi",
];
