import { getAdminAuthHeaders, syncCmsKeyToCloud } from "@/lib/adminTokenHelper";
import {
  STATES_LIST,
  COMMISSIONS_LIST,
  OFFICIAL_NOTIFICATIONS,
  CBT_QUESTIONS,
  BilingualCbtQuestion,
} from "@/lib/siteData";

export interface NavTabItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  highlight?: boolean;
}

export interface HomeSectionsConfig {
  coverHero: boolean;
  quickTiles: boolean;
  examCountdown: boolean;
  newBatches: boolean;
  dashboardColumns: boolean;
  materialShowcase: boolean;
}

export interface ExamCountdownItem {
  id: string;
  title: string;
  examDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface AnnouncementTickerConfig {
  enabled: boolean;
  badge: string;
  text: string;
  linkLabel: string;
  linkHref: string;
}

export interface PopupBannerConfig {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

export interface CustomPageItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  content: string;
  pdfUrl: string;
  youtubeUrl: string;
  active: boolean;
  createdAt: string;
}

export interface DiscountCouponItem {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
}

export interface PaymentConfig {
  upiId: string;
  merchantName: string;
  coupons: DiscountCouponItem[];
}

export interface DynamicNotificationItem {
  id: string;
  commission: string;
  title: string;
  date: string;
  pdfUrl: string;
}

export interface StudentInquiryItem {
  id: string;
  studentName: string;
  contact: string;
  targetExam: string;
  message: string;
  status: "New" | "Contacted" | "Resolved";
  createdAt: string;
}

export interface NoCodeCmsState {
  navItems: NavTabItem[];
  homeSections: HomeSectionsConfig;
  examCountdowns: ExamCountdownItem[];
  announcementTicker: AnnouncementTickerConfig;
  popupBanner: PopupBannerConfig;
  customPages: CustomPageItem[];
  paymentConfig: PaymentConfig;
  states: string[];
  commissions: string[];
  notifications: DynamicNotificationItem[];
  dailyMcqs: BilingualCbtQuestion[];
  inquiries: StudentInquiryItem[];
}

// State Special Current Affairs placed right next to Daily Current Affairs
export const DEFAULT_NAV_ITEMS: NavTabItem[] = [
  { id: "nav-home", href: "/", label: "Home", visible: true },
  { id: "nav-batches", href: "/batches", label: "Batches", visible: true, highlight: true },
  { id: "nav-test-series", href: "/test-series", label: "Test Series", visible: true },
  { id: "nav-ca", href: "/current-affairs", label: "Daily Current Affairs", visible: true },
  { id: "nav-state", href: "/state-special", label: "State Special Current Affairs", visible: true },
  { id: "nav-material", href: "/material", label: "Material", visible: true },
  { id: "nav-pyq", href: "/pyq", label: "PYQ", visible: true },
  { id: "nav-mag", href: "/monthly-magazine", label: "Monthly Magazine", visible: true },
  { id: "nav-schemes", href: "/schemes", label: "Schemes", visible: true },
  { id: "nav-toppers", href: "/toppers-copy", label: "Toppers' Copy", visible: true },
  { id: "nav-eval", href: "/answer-evaluation", label: "Answer Evaluation", visible: true },
  { id: "nav-syllabus", href: "/syllabus", label: "Syllabus", visible: true },
  { id: "nav-student-hub", href: "/student-hub", label: "Student Hub", visible: true, highlight: true },
];

export const DEFAULT_EXAM_COUNTDOWNS: ExamCountdownItem[] = [
  { id: "cd-uppsc-2026", title: "UPPSC PCS Prelims", examDate: "2026-12-20", active: true },
  { id: "cd-upsc-2027", title: "UPSC CSE 2027 Prelims", examDate: "2027-05-23", active: true },
];

export const DEFAULT_NOCODE_CMS: NoCodeCmsState = {
  navItems: DEFAULT_NAV_ITEMS,
  homeSections: {
    coverHero: true,
    quickTiles: true,
    examCountdown: true,
    newBatches: true,
    dashboardColumns: true,
    materialShowcase: true,
  },
  examCountdowns: DEFAULT_EXAM_COUNTDOWNS,
  announcementTicker: {
    enabled: false,
    badge: "NEW",
    text: "UPSC CSE 2027 & UPPSC PCS 2026 New Batches Admissions Open — Free Live Test Series Live Now!",
    linkLabel: "Explore Batches →",
    linkHref: "/batches",
  },
  popupBanner: {
    enabled: false,
    badge: "SPECIAL ANNOUNCEMENT",
    title: "New Batches Admissions Open",
    description:
      "Join ETERNAL CIVIL ACADEMY's Bilingual Foundation & Target Batches with Daily Current Affairs & CBT Mock Tests.",
    ctaLabel: "View Batches",
    ctaHref: "/batches",
    imageUrl: "/covers/indian-polity.jpg",
  },
  customPages: [
    {
      id: "page-about-eca",
      slug: "about-us",
      title: "About ETERNAL CIVIL ACADEMY",
      subtitle: "Your Success, Our Commitment",
      category: "Institute",
      content:
        "ETERNAL CIVIL ACADEMY is dedicated to empowering UPSC CSE and State PCS aspirants (UPPSC, BPSC, RPSC, MPPSC, HPSC, JPSC, UKPSC) with structured bilingual current affairs, free live CBT mock tests, NCERT crux notes, and personalized mentorship.",
      pdfUrl: "",
      youtubeUrl: "",
      active: true,
      createdAt: "20 Nov 2026",
    },
  ],
  paymentConfig: {
    upiId: process.env.NEXT_PUBLIC_UPI_ID || "eternalcivilacademy@upi",
    merchantName: "ETERNAL CIVIL ACADEMY",
    coupons: [
      { id: "cpn-eca10", code: "ECA10", discountPercent: 10, active: true },
    ],
  },
  states: [...STATES_LIST],
  commissions: [...COMMISSIONS_LIST],
  notifications: [...OFFICIAL_NOTIFICATIONS],
  dailyMcqs: [...CBT_QUESTIONS],
  inquiries: [
    {
      id: "INQ-1001",
      studentName: "Rahul Sharma",
      contact: "+91 98765 00001",
      targetExam: "UPPSC PCS 2026",
      message: "Need details about UPPSC PCS 2026 Target Batch schedule and bilingual PDFs.",
      status: "New",
      createdAt: "20 Nov 2026, 10:15 AM",
    },
  ],
};

const STORAGE_KEY = "eca_nocode_cms_state_v2";

export function loadNoCodeCms(): NoCodeCmsState {
  if (typeof window === "undefined") return DEFAULT_NOCODE_CMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOCODE_CMS;
    const parsed = JSON.parse(raw) as Partial<NoCodeCmsState>;
    return {
      navItems:
        Array.isArray(parsed.navItems) && parsed.navItems.length > 0
          ? parsed.navItems
          : DEFAULT_NOCODE_CMS.navItems,
      homeSections: {
        ...DEFAULT_NOCODE_CMS.homeSections,
        ...(parsed.homeSections || {}),
      },
      examCountdowns:
        Array.isArray(parsed.examCountdowns) && parsed.examCountdowns.length > 0
          ? parsed.examCountdowns
          : DEFAULT_NOCODE_CMS.examCountdowns,
      announcementTicker: {
        ...DEFAULT_NOCODE_CMS.announcementTicker,
        ...(parsed.announcementTicker || {}),
      },
      popupBanner: {
        ...DEFAULT_NOCODE_CMS.popupBanner,
        ...(parsed.popupBanner || {}),
      },
      customPages: Array.isArray(parsed.customPages)
        ? parsed.customPages
        : DEFAULT_NOCODE_CMS.customPages,
      paymentConfig: {
        ...DEFAULT_NOCODE_CMS.paymentConfig,
        ...(parsed.paymentConfig || {}),
        coupons: Array.isArray(parsed.paymentConfig?.coupons)
          ? parsed.paymentConfig.coupons
          : DEFAULT_NOCODE_CMS.paymentConfig.coupons,
      },
      states:
        Array.isArray(parsed.states)
          ? parsed.states
          : DEFAULT_NOCODE_CMS.states,
      commissions:
        Array.isArray(parsed.commissions)
          ? parsed.commissions
          : DEFAULT_NOCODE_CMS.commissions,
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : DEFAULT_NOCODE_CMS.notifications,
      dailyMcqs:
        Array.isArray(parsed.dailyMcqs)
          ? parsed.dailyMcqs
          : DEFAULT_NOCODE_CMS.dailyMcqs,
      inquiries: Array.isArray(parsed.inquiries)
        ? parsed.inquiries
        : DEFAULT_NOCODE_CMS.inquiries,
    };
  } catch {
    return DEFAULT_NOCODE_CMS;
  }
}

export function saveNoCodeCms(state: NoCodeCmsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("eca-nocode-cms-updated"));
  // Non-blocking cloud sync to Supabase for cross-device updates
  syncCmsKeyToCloud("nocode_cms", state, 400);
}

export function submitStudentInquiry(
  inquiry: Omit<StudentInquiryItem, "id" | "status" | "createdAt">
): StudentInquiryItem {
  const cms = loadNoCodeCms();
  const newItem: StudentInquiryItem = {
    ...inquiry,
    id: `INQ-${Date.now().toString().slice(-5)}`,
    status: "New",
    createdAt: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  saveNoCodeCms({
    ...cms,
    inquiries: [newItem, ...cms.inquiries],
  });
  return newItem;
}
