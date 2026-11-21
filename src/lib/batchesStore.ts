import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
export interface BatchItem {
  id: string;
  slug: string;
  title: string;
  examTag: string;
  batchType: "Foundation" | "Prelims Target" | "Mains Mentorship" | "Optional" | "Crash Course";
  startDate: string;
  duration: string;
  mode: string;
  medium: "Bilingual (English & Hindi)" | "English Medium" | "Hindi Medium";
  faculty: string;
  highlights: string[];
  description: string;
  coverImage: string;
  isPaid: boolean;
  priceInr: number;
  mrpInr: number;
  status: "Admissions Open" | "Upcoming" | "Live Now";
  syllabusPdfUrl: string;
  telegramGroupUrl: string;
  uploadedBy: string;
  isLocked: boolean;
  createdAt: string;
}

export const DEFAULT_BATCHES: BatchItem[] = [
  {
    id: "batch-upsc-2027-foundation",
    slug: "upsc-cse-2027-integrated-foundation-batch",
    title: "UPSC CSE 2027 Integrated Foundation Batch (Prelims + Mains + CSAT)",
    examTag: "UPSC",
    batchType: "Foundation",
    startDate: "01 Dec 2026",
    duration: "12 Months",
    mode: "Live Online + Recorded HD Lectures",
    medium: "Bilingual (English & Hindi)",
    faculty: "Saum Yadav & Team ECA",
    highlights: [
      "Complete NCERT (Class 6–12) to Standard Books Coverage",
      "Daily Structured Current Affairs & Editorial Analysis",
      "Weekly Prelims CBT Mock Tests & Mains Answer Writing",
      "1-on-1 Personal Mentorship & Bilingual Printed/PDF Notes",
    ],
    description:
      "Comprehensive 12-month UPSC CSE Prelims-cum-Mains foundation programme covering GS Papers I–IV, CSAT, Essay, and daily current affairs integration with structured answer writing mentorship.",
    coverImage: "/covers/indian-polity.jpg",
    isPaid: true,
    priceInr: 4999,
    mrpInr: 9999,
    status: "Admissions Open",
    syllabusPdfUrl: "#batch-upsc-2027-syllabus",
    telegramGroupUrl: "https://t.me/EternalCivilAcademy",
    uploadedBy: "super_admin",
    isLocked: true,
    createdAt: "20 Nov 2026",
  },
  {
    id: "batch-uppsc-2026-target",
    slug: "uppsc-pcs-2026-prelims-target-batch",
    title: "UPPSC PCS 2026 Prelims Target Batch (GS + UP Special + CSAT)",
    examTag: "UPPSC",
    batchType: "Prelims Target",
    startDate: "05 Dec 2026",
    duration: "5 Months",
    mode: "Live Online + Recorded",
    medium: "Bilingual (English & Hindi)",
    faculty: "Team ETERNAL CIVIL ACADEMY",
    highlights: [
      "Complete UP Special GS Papers V & VI + State Current Affairs",
      "25 Full-Length UPPSC Pattern CBT Mock Tests Included",
      "Previous 15 Years UPPSC PYQ Trend & Elimination Strategy",
      "Dedicated CSAT Qualifying Workshop & Bilingual PDF Notes",
    ],
    description:
      "Focused exam-oriented target batch specifically designed for UPPSC PCS 2026 Prelims with complete Uttar Pradesh Special coverage, current affairs, and high-yield test series.",
    coverImage: "/covers/modern-history.jpg",
    isPaid: true,
    priceInr: 1499,
    mrpInr: 2999,
    status: "Admissions Open",
    syllabusPdfUrl: "#batch-uppsc-2026-syllabus",
    telegramGroupUrl: "https://t.me/EternalCivilAcademy",
    uploadedBy: "super_admin",
    isLocked: true,
    createdAt: "20 Nov 2026",
  },
  {
    id: "batch-bpsc-71-integrated",
    slug: "bpsc-71st-cce-prelims-mains-batch",
    title: "71st BPSC Integrated Batch (Prelims + Bihar Special + Mains)",
    examTag: "BPSC",
    batchType: "Foundation",
    startDate: "10 Dec 2026",
    duration: "8 Months",
    mode: "Live Online + Recorded",
    medium: "Bilingual (English & Hindi)",
    faculty: "Team ETERNAL CIVIL ACADEMY",
    highlights: [
      "Complete Bihar History, Geography, Economy & Budget Coverage",
      "Daily Bihar Current Affairs + 20 BPSC Pattern Full Mock Tests",
      "Mains Essay & GS Paper I–II Answer Writing Practice",
      "Bilingual Study Material (English & Hindi PDFs)",
    ],
    description:
      "Structured integrated preparation for 71st BPSC Combined Competitive Examination covering Prelims, Bihar Special GS, Current Affairs, and Mains answer writing.",
    coverImage: "/covers/indian-economy.jpg",
    isPaid: true,
    priceInr: 1299,
    mrpInr: 2499,
    status: "Upcoming",
    syllabusPdfUrl: "#batch-bpsc-71-syllabus",
    telegramGroupUrl: "https://t.me/EternalCivilAcademy",
    uploadedBy: "admin_1",
    isLocked: false,
    createdAt: "20 Nov 2026",
  },
  {
    id: "batch-ncert-free-foundation",
    slug: "free-ncert-class-6-to-12-foundation-batch",
    title: "Free NCERT Class 6–12 Foundation Batch (All Subjects)",
    examTag: "UPSC / State PCS",
    batchType: "Crash Course",
    startDate: "Live Now",
    duration: "90 Days",
    mode: "Free Online + Telegram Synced",
    medium: "Bilingual (English & Hindi)",
    faculty: "Team ETERNAL CIVIL ACADEMY",
    highlights: [
      "100% Free NCERT Chapter-Wise Line-by-Line Classes",
      "Chapter-Wise Bilingual NCERT Crux PDFs Included",
      "Daily Practice MCQs synced with Telegram Quiz Bot",
      "Ideal for Beginners starting UPSC & State PCS Preparation",
    ],
    description:
      "Zero-fee foundation programme covering History, Geography, Polity, Economy, Science, and Environment NCERTs from Class 6 to 12 with downloadable bilingual crux notes.",
    coverImage: "/covers/ancient-history.jpg",
    isPaid: false,
    priceInr: 0,
    mrpInr: 0,
    status: "Live Now",
    syllabusPdfUrl: "#batch-ncert-free-syllabus",
    telegramGroupUrl: "https://t.me/EternalCivilAcademy",
    uploadedBy: "super_admin",
    isLocked: false,
    createdAt: "20 Nov 2026",
  },
];

const STORAGE_KEY = "eca_batches_store_v1";

export function loadBatches(): BatchItem[] {
  if (typeof window === "undefined") return DEFAULT_BATCHES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BATCHES;
    const parsed = JSON.parse(raw) as BatchItem[];
    return parsed.length > 0 ? parsed : DEFAULT_BATCHES;
  } catch {
    return DEFAULT_BATCHES;
  }
}

export function saveBatches(batches: BatchItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  window.dispatchEvent(new Event("eca-batches-updated"));
  fetch("/api/cms-state", { method: "POST", headers: getAdminAuthHeaders(), body: JSON.stringify({ key: "batches", value: batches }) }).catch(() => {});
}
