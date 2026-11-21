import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
export interface CoverSlideItem {
  id: string;
  sourceType: "brand" | "batch" | "notes" | "test_series" | "current_affairs" | "scheme" | "custom";
  sourceId?: string;
  badge: string;
  title: string;
  tagline: string;
  highlights: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  books: string[];
  active: boolean;
  isLocked: boolean;
  pinnedBy: string;
}

export const DEFAULT_COVER_SLIDES: CoverSlideItem[] = [
  {
    id: "slide-brand-main",
    sourceType: "brand",
    badge: "UPSC • UPPSC • BPSC • RPSC • HPSC • MPPSC • JPSC",
    title: "ETERNAL CIVIL ACADEMY",
    tagline: "Your Success, Our Commitment",
    highlights: [
      "Daily Current Affairs",
      "New Batches Open",
      "Free Live Test Series",
      "NCERT Books & Crux",
    ],
    ctaPrimary: { label: "Explore Batches", href: "/batches" },
    ctaSecondary: { label: "Free Live Test Series", href: "/test-series" },
    books: [
      "/covers/important-articles.jpg",
      "/covers/indian-polity.jpg",
      "/covers/modern-history.jpg",
    ],
    active: true,
    isLocked: true,
    pinnedBy: "super_admin",
  },
  {
    id: "slide-test-series",
    sourceType: "test_series",
    badge: "TEST SERIES & MENTORSHIP",
    title: "TEST SERIES & ANSWER EVALUATION",
    tagline: "Your Success, Our Commitment",
    highlights: [
      "Real CBT Interface",
      "1/3 Negative Marking",
      "Toppers' Copy",
      "Copy Evaluation",
    ],
    ctaPrimary: { label: "Test Series", href: "/test-series" },
    ctaSecondary: { label: "Answer Evaluation", href: "/answer-evaluation" },
    books: [
      "/covers/indian-economy.jpg",
      "/covers/indian-geography.jpg",
      "/covers/environment.jpg",
    ],
    active: true,
    isLocked: false,
    pinnedBy: "super_admin",
  },
  {
    id: "slide-study-archive",
    sourceType: "notes",
    badge: "COMPLETE STUDY ARCHIVE",
    title: "NCERT CRUX, PYQ & STATE SPECIAL",
    tagline: "Your Success, Our Commitment",
    highlights: [
      "Subject & Class Filter",
      "State Current Affairs",
      "Central & State Schemes",
      "Dual Language PDF",
    ],
    ctaPrimary: { label: "State Special", href: "/state-special" },
    ctaSecondary: { label: "Material", href: "/material" },
    books: [
      "/covers/ancient-history.jpg",
      "/covers/world-geography.jpg",
      "/covers/important-articles.jpg",
    ],
    active: true,
    isLocked: false,
    pinnedBy: "super_admin",
  },
];

const STORAGE_KEY = "eca_cover_page_slides_v1";

export function loadCoverSlides(): CoverSlideItem[] {
  if (typeof window === "undefined") return DEFAULT_COVER_SLIDES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COVER_SLIDES;
    const parsed = JSON.parse(raw) as CoverSlideItem[];
    return parsed.length > 0 ? parsed : DEFAULT_COVER_SLIDES;
  } catch {
    return DEFAULT_COVER_SLIDES;
  }
}

export function saveCoverSlides(slides: CoverSlideItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
  window.dispatchEvent(new Event("eca-cover-slides-updated"));
  fetch("/api/cms-state", { method: "POST", headers: getAdminAuthHeaders(), body: JSON.stringify({ key: "cover_slides", value: slides }) }).catch(() => {});
}
