export interface StudentToolMeta {
  slug: string;
  title: string;
  shortTitle: string;
  category:
    | "Exam Calculators & Predictors"
    | "Smart Study & Revision"
    | "Interactive Practice & Battle"
    | "Career & Job Utilities";
  badge: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

export const STUDENT_HUB_TOOLS: StudentToolMeta[] = [
  {
    slug: "cut-off-calculator",
    title: "Cut-Off Calculator",
    shortTitle: "Cut-Off Calculator",
    category: "Exam Calculators & Predictors",
    badge: "UPSC & State PCS",
    description: "Check your Prelims selection chances against category-wise historical cut-offs (Gen/OBC/EWS/SC/ST).",
    seoTitle: "UPSC & State PCS Cut-Off Calculator 2026 | ETERNAL CIVIL ACADEMY",
    seoDescription: "Free UPSC CSE, UPPSC PCS, BPSC, RPSC, MPPSC Prelims Cut-Off Calculator with category-wise safe score analysis.",
    keywords: ["UPSC Cut-Off Calculator", "UPPSC Cut-Off", "BPSC Prelims Cut-Off", "PCS Safe Score"],
  },
  {
    slug: "exam-marks-calculator",
    title: "Exam Marks Calculator",
    shortTitle: "Marks Calculator",
    category: "Exam Calculators & Predictors",
    badge: "Negative Marking",
    description: "Calculate exact Prelims net marks, negative marks lost, accuracy %, and CSAT qualifying status.",
    seoTitle: "UPSC & State PCS Exam Marks Calculator (+2 / -0.66) | ETERNAL CIVIL ACADEMY",
    seoDescription: "Instantly calculate UPSC CSE, UPPSC, BPSC Prelims score with 1/3 negative marking, accuracy percentage, and CSAT check.",
    keywords: ["Exam Marks Calculator", "UPSC Prelims Score Calculator", "Negative Marking Calculator"],
  },
  {
    slug: "age-eligibility-calculator",
    title: "Age & Eligibility Calculator",
    shortTitle: "Age & Eligibility",
    category: "Exam Calculators & Predictors",
    badge: "Attempts & Age",
    description: "Verify exact age on cutoff date, category-wise age relaxation, and remaining UPSC/PCS attempts.",
    seoTitle: "UPSC & State PCS Age & Eligibility Calculator 2026-2027 | ETERNAL CIVIL ACADEMY",
    seoDescription: "Check UPSC IAS, UPPSC, BPSC, RPSC age eligibility, maximum attempts left, and category-wise relaxation instantly.",
    keywords: ["UPSC Age Calculator", "IAS Eligibility Calculator", "UPPSC Age Limit Calculator"],
  },
  {
    slug: "all-india-rank-predictor",
    title: "All India Rank Predictor",
    shortTitle: "AIR Predictor",
    category: "Exam Calculators & Predictors",
    badge: "Web & Telegram Tests",
    description: "Predict your estimated All India Rank (AIR) & Percentile for Website CBT Tests and Telegram Quizzes.",
    seoTitle: "UPSC & PCS All India Rank (AIR) Predictor | ETERNAL CIVIL ACADEMY",
    seoDescription: "Free All India Rank Predictor for UPSC CSE, State PCS mock tests, and Telegram quizzes with instant percentile and rank range.",
    keywords: ["All India Rank Predictor", "UPSC Rank Predictor", "UPPSC AIR Predictor", "Telegram Quiz Rank"],
  },
  {
    slug: "automatic-revision-system",
    title: "Automatic Revision System",
    shortTitle: "Auto Revision",
    category: "Smart Study & Revision",
    badge: "1-3-7-15-30 Days",
    description: "Save any question or fact — system auto-schedules Spaced Repetition revisions at Today, 1, 3, 7, 15 & 30 days.",
    seoTitle: "Automatic Spaced Repetition Revision System for UPSC & PCS | ETERNAL CIVIL ACADEMY",
    seoDescription: "Scientific 1-3-7-15-30 day Automatic Revision System for UPSC and State PCS aspirants to retain facts permanently.",
    keywords: ["Automatic Revision System", "Spaced Repetition UPSC", "1 3 7 15 30 Day Revision Tracker"],
  },
  {
    slug: "personal-study-planner",
    title: "Personal Study Planner",
    shortTitle: "Study Planner",
    category: "Smart Study & Revision",
    badge: "Custom Timetable",
    description: "Generate a personalized daily & weekly UPSC/PCS study timetable based on your target date & study hours.",
    seoTitle: "Personal UPSC & State PCS Study Planner & Timetable Generator | ETERNAL CIVIL ACADEMY",
    seoDescription: "Free Personal Study Planner for UPSC CSE & State PCS — create custom daily schedules, track targets, and balance GS + Current Affairs.",
    keywords: ["UPSC Study Planner", "PCS Timetable Generator", "Personal Study Schedule"],
  },
  {
    slug: "pyq-trend-analyzer",
    title: "PYQ Trend Analyzer",
    shortTitle: "PYQ Trend Analyzer",
    category: "Smart Study & Revision",
    badge: "2018–2025 Data",
    description: "Analyze subject-wise Prelims question weightage trends across UPSC, UPPSC & BPSC to prioritize high-yield topics.",
    seoTitle: "UPSC & State PCS PYQ Trend Analyzer (Subject-Wise Weightage) | ETERNAL CIVIL ACADEMY",
    seoDescription: "Visual PYQ Trend Analyzer showing year-wise subject weightage for Polity, Economy, Geography, History, Environment & Science.",
    keywords: ["UPSC PYQ Trend Analyzer", "Subject Wise Weightage UPSC", "UPPSC PYQ Analysis"],
  },
  {
    slug: "my-study-library",
    title: "My Study Library",
    shortTitle: "My Study Library",
    category: "Smart Study & Revision",
    badge: "Personal Vault",
    description: "Access all your bookmarked Current Affairs, saved revision facts, and personal PDF/YouTube study links in one place.",
    seoTitle: "My Study Library — Personal UPSC & PCS Study Vault | ETERNAL CIVIL ACADEMY",
    seoDescription: "Organize your bookmarked articles, revision notes, and favorite study links inside your personal ETERNAL CIVIL ACADEMY Study Library.",
    keywords: ["My Study Library", "UPSC Notes Organizer", "Saved Revision Bookmarks"],
  },
  {
    slug: "omr-sheet-generator-checker",
    title: "OMR Sheet Generator & Checker",
    shortTitle: "OMR Generator & Checker",
    category: "Interactive Practice & Battle",
    badge: "Print + Digital",
    description: "Generate printable 50/100/150-Q ECA OMR sheets or mark bubbles digitally & check instantly with an answer key.",
    seoTitle: "Free UPSC OMR Sheet Generator PDF & Online OMR Checker | ETERNAL CIVIL ACADEMY",
    seoDescription: "Print blank 50, 100, or 150 question UPSC/PCS OMR sheets or use our free Digital OMR Sheet Checker for instant score calculation.",
    keywords: ["OMR Sheet Generator PDF", "UPSC OMR Sheet Checker", "Practice OMR Sheet Online"],
  },
  {
    slug: "quiz-battle",
    title: "1 vs 1 Quiz Battle",
    shortTitle: "1 vs 1 Quiz Battle",
    category: "Interactive Practice & Battle",
    badge: "10 Qs • Timer • Rank",
    description: "Challenge a friend to a 10-question timed 1 vs 1 UPSC/PCS Quiz Battle with instant Winner, Rank & Shareable Result.",
    seoTitle: "1 vs 1 UPSC & PCS Quiz Battle — Live Challenge | ETERNAL CIVIL ACADEMY",
    seoDescription: "Play a 10-question timed 1 vs 1 UPSC/State PCS Quiz Battle with friends, compare ranks, and share your battle result card.",
    keywords: ["UPSC Quiz Battle", "1 vs 1 GK Quiz Challenge", "PCS Live Quiz Competition"],
  },
  {
    slug: "score-card-generator",
    title: "Shareable Score Card Generator",
    shortTitle: "Score Card Generator",
    category: "Interactive Practice & Battle",
    badge: "Download PNG",
    description: "Create a branded ETERNAL CIVIL ACADEMY Score Card with Name, Score, Accuracy, Rank & Exam Name to share anywhere.",
    seoTitle: "Shareable Exam Score Card Generator (PNG Download) | ETERNAL CIVIL ACADEMY",
    seoDescription: "Generate and download a high-resolution ETERNAL CIVIL ACADEMY Score Card with your Name, Score, Accuracy, Rank and Exam Name.",
    keywords: ["Score Card Generator", "Quiz Result Card Maker", "UPSC Mock Test Score Card"],
  },
  {
    slug: "daily-current-affairs-quiz",
    title: "Daily Current Affairs Quiz",
    shortTitle: "Daily CA Quiz",
    category: "Interactive Practice & Battle",
    badge: "Bilingual EN / HI",
    description: "Attempt today's timed bilingual Current Affairs Quiz with instant explanations, accuracy analysis & Score Card.",
    seoTitle: "Daily Current Affairs Quiz (English & Hindi) for UPSC & PCS | ETERNAL CIVIL ACADEMY",
    seoDescription: "Practice free Daily Current Affairs MCQs in English and Hindi with instant explanations and score analysis for UPSC & State PCS.",
    keywords: ["Daily Current Affairs Quiz", "UPSC Daily CA MCQs", "Hindi Current Affairs Quiz"],
  },
  {
    slug: "salary-calculator",
    title: "Salary Calculator (7th CPC)",
    shortTitle: "Salary Calculator",
    category: "Career & Job Utilities",
    badge: "IAS • IPS • PCS",
    description: "Calculate exact monthly Gross & In-Hand Salary for IAS, IPS, SDM, DSP & Group B/C posts with DA, HRA & NPS.",
    seoTitle: "IAS, IPS & State PCS Officer Salary Calculator (7th Pay Commission) | ETERNAL CIVIL ACADEMY",
    seoDescription: "Calculate in-hand salary of IAS, IPS, SDM, DSP, RO/ARO with latest DA, X/Y/Z city HRA, TA, and NPS deductions.",
    keywords: ["IAS Salary Calculator", "UPPSC SDM Salary Calculator", "7th Pay Commission Salary Calculator"],
  },
  {
    slug: "government-job-finder",
    title: "Government Job Finder",
    shortTitle: "Govt Job Finder",
    category: "Career & Job Utilities",
    badge: "Eligibility Match",
    description: "Enter your qualification, age & state preference to discover every Central & State government exam you are eligible for.",
    seoTitle: "Government Job & Exam Eligibility Finder India 2026 | ETERNAL CIVIL ACADEMY",
    seoDescription: "Find all UPSC, State PCS, RO/ARO, CAPF, CDS, Judiciary, and Central/State government exams matching your age and degree.",
    keywords: ["Government Job Finder India", "Sarkari Exam Eligibility Finder", "Exams After Graduation India"],
  },
];

export function getToolBySlug(slug: string): StudentToolMeta | undefined {
  return STUDENT_HUB_TOOLS.find((t) => t.slug === slug);
}
