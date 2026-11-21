export interface CurrentAffairItem {
  id: string;
  slug: string;
  sectionType: "daily_ca" | "state_ca" | "central_scheme" | "state_scheme";
  stateName?: string;
  examRelevance: string;
  title: string;
  whyInNews: string;
  keyHighlights: string[];
  prelimsFacts: string[];
  mainsPerspective: string;
  date: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
  uploadedBy: string;
  isLocked: boolean;
}

export interface BookCoverItem {
  id: string;
  slug: string;
  title: string;
  subject: string;
  coverImage: string;
  isPaid: boolean;
  priceInr: number;
  pages: string;
  englishPdfUrl: string;
  hindiPdfUrl: string;
  uploadedBy: string;
  isLocked: boolean;
}

export interface BilingualCbtQuestion {
  id: number;
  subject: string;
  questionEn: string;
  questionHi: string;
  optionsEn: { A: string; B: string; C: string; D: string };
  optionsHi: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanationEn: string;
  explanationHi: string;
}

export interface TelegramSyncedQuiz {
  id: string;
  title: string;
  examTag: string;
  date: string;
  totalQuestions: number;
  durationMinutes: number;
  source: "telegram_bot" | "website";
}

export const STATES_LIST = [
  "Uttar Pradesh",
  "Haryana",
  "Bihar",
  "Rajasthan",
  "Madhya Pradesh",
  "Jharkhand",
  "Uttarakhand",
];

export const COMMISSIONS_LIST = [
  "UPSC",
  "UPPSC",
  "BPSC",
  "RPSC",
  "MPPSC",
  "HPSC",
  "JPSC",
];

export const NCERT_SUBJECTS = [
  "History",
  "Geography",
  "Polity",
  "Economy",
  "Science",
  "Environment",
];

export const NCERT_CLASSES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export const PREMIUM_BOOK_COVERS: BookCoverItem[] = [
  {
    id: "book-1",
    slug: "important-articles-1-to-395",
    title: "Important Articles (1–395)",
    subject: "Indian Polity",
    coverImage: "/covers/important-articles.jpg",
    isPaid: false,
    priceInr: 0,
    pages: "145 Pages",
    englishPdfUrl: "#download-english-articles",
    hindiPdfUrl: "#download-hindi-articles",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "book-2",
    slug: "indian-polity-and-constitution",
    title: "Indian Polity & Constitution",
    subject: "Polity",
    coverImage: "/covers/indian-polity.jpg",
    isPaid: true,
    priceInr: 99,
    pages: "240 Pages",
    englishPdfUrl: "#download-english-polity",
    hindiPdfUrl: "#download-hindi-polity",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "book-3",
    slug: "ancient-history-of-india",
    title: "Ancient History",
    subject: "History",
    coverImage: "/covers/ancient-history.jpg",
    isPaid: true,
    priceInr: 79,
    pages: "185 Pages",
    englishPdfUrl: "#download-english-ancient",
    hindiPdfUrl: "#download-hindi-ancient",
    uploadedBy: "super_admin",
    isLocked: false,
  },
  {
    id: "book-4",
    slug: "modern-history-of-india",
    title: "Modern History",
    subject: "History",
    coverImage: "/covers/modern-history.jpg",
    isPaid: true,
    priceInr: 99,
    pages: "260 Pages",
    englishPdfUrl: "#download-english-modern",
    hindiPdfUrl: "#download-hindi-modern",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "book-5",
    slug: "indian-geography-complete",
    title: "Indian Geography",
    subject: "Geography",
    coverImage: "/covers/indian-geography.jpg",
    isPaid: false,
    priceInr: 0,
    pages: "190 Pages",
    englishPdfUrl: "#download-english-ind-geo",
    hindiPdfUrl: "#download-hindi-ind-geo",
    uploadedBy: "admin_1",
    isLocked: false,
  },
  {
    id: "book-6",
    slug: "world-geography-complete",
    title: "World Geography",
    subject: "Geography",
    coverImage: "/covers/world-geography.jpg",
    isPaid: true,
    priceInr: 79,
    pages: "175 Pages",
    englishPdfUrl: "#download-english-world-geo",
    hindiPdfUrl: "#download-hindi-world-geo",
    uploadedBy: "admin_1",
    isLocked: false,
  },
  {
    id: "book-7",
    slug: "indian-economy-notes",
    title: "Indian Economy",
    subject: "Economy",
    coverImage: "/covers/indian-economy.jpg",
    isPaid: true,
    priceInr: 89,
    pages: "210 Pages",
    englishPdfUrl: "#download-english-economy",
    hindiPdfUrl: "#download-hindi-economy",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "book-8",
    slug: "environment-and-disaster-management",
    title: "Environment & Disaster Management",
    subject: "Environment",
    coverImage: "/covers/environment.jpg",
    isPaid: false,
    priceInr: 0,
    pages: "165 Pages",
    englishPdfUrl: "#download-english-env",
    hindiPdfUrl: "#download-hindi-env",
    uploadedBy: "super_admin",
    isLocked: false,
  },
];

export const STRUCTURED_CURRENT_AFFAIRS: CurrentAffairItem[] = [
  {
    id: "ca-1",
    slug: "one-nation-one-election-constitutional-framework",
    sectionType: "daily_ca",
    examRelevance: "GS-2",
    title: "One Nation, One Election: Constitutional Amendments & Federal Implications",
    whyInNews:
      "The Union Cabinet has accepted the recommendations of the High-Level Committee on simultaneous elections to the House of the People and State Legislative Assemblies, initiating the legislative roadmap for synchronized electoral cycles.",
    keyHighlights: [
      "Synchronized Electoral Cycle: Phase-I proposes simultaneous polls for the Lok Sabha and all State Legislative Assemblies, followed by Municipal and Panchayat elections within 100 days in Phase-II.",
      "Constitutional Amendments Required: Implementation requires amending Article 83 (Duration of Houses of Parliament), Article 85 (Dissolution of Lok Sabha), Article 172 (Duration of State Legislatures), Article 174, and Article 356.",
      "Single Electoral Roll: A unified electoral roll and single EPIC card prepared by the Election Commission of India in consultation with State Election Commissions under Article 325.",
      "Governance & Fiscal Efficiency: Reduces recurring imposition of the Model Code of Conduct (MCC), ensuring uninterrupted policy execution and substantial savings in administrative expenditure.",
    ],
    prelimsFacts: [
      "Simultaneous elections were previously held in India during 1951–52, 1957, 1962, and 1967.",
      "Article 83(2) fixes the normal tenure of the Lok Sabha at five years from the date of its first meeting.",
      "Article 172(1) governs the five-year duration of State Legislative Assemblies.",
      "Ratification by at least half of the States under Article 368(2) is mandatory for changes affecting federal provisions and local body elections.",
    ],
    mainsPerspective:
      "While simultaneous elections enhance administrative continuity and reduce fiscal burden, safeguards must ensure that the federal autonomy of State legislatures and voter accountability are preserved through consensus-driven constitutional mechanisms.",
    date: "20 Nov 2026",
    englishPdfUrl: "#ca-1-en",
    hindiPdfUrl: "#ca-1-hi",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "ca-2",
    slug: "national-green-hydrogen-mission-2030-targets",
    sectionType: "daily_ca",
    examRelevance: "GS-3",
    title: "National Green Hydrogen Mission: SIGHT Incentives & Decarbonization Roadmap",
    whyInNews:
      "New green hydrogen production clusters and electrolyzer manufacturing capacities have been sanctioned under the Strategic Interventions for Green Hydrogen Transition (SIGHT) programme to accelerate India's clean energy transition.",
    keyHighlights: [
      "Production Target: Achieving at least 5 Million Metric Tonnes (MMT) per annum of Green Hydrogen production capacity by 2030, backed by 125 GW of associated renewable energy capacity.",
      "SIGHT Financial Architecture: Dedicated financial incentives targeting domestic manufacturing of electrolyzers and green hydrogen production.",
      "Industrial Decarbonization: Priority deployment in fertilizer production, petroleum refining, steel manufacturing, and heavy-duty long-haul transport.",
      "Export Competitiveness: Developing coastal Green Hydrogen Hubs to position India as a global export leader in clean fuels.",
    ],
    prelimsFacts: [
      "Green Hydrogen is produced via electrolysis of water powered exclusively by renewable energy sources.",
      "Target of 5 MMT annual production is expected to abate nearly 50 MMT of annual greenhouse gas emissions by 2030.",
      "SIGHT stands for Strategic Interventions for Green Hydrogen Transition.",
    ],
    mainsPerspective:
      "Scaling green hydrogen requires reducing electrolyzer capital costs, strengthening grid transmission infrastructure, and establishing international certification standards for global export markets.",
    date: "20 Nov 2026",
    englishPdfUrl: "#ca-2-en",
    hindiPdfUrl: "#ca-2-hi",
    uploadedBy: "super_admin",
    isLocked: false,
  },
  {
    id: "ca-3",
    slug: "uttar-pradesh-industrial-corridor-nodal-expansion",
    sectionType: "state_ca",
    stateName: "Uttar Pradesh",
    examRelevance: "State Special",
    title: "Uttar Pradesh Expressway Industrial Manufacturing Clusters Expansion",
    whyInNews:
      "The Uttar Pradesh State Industrial Development Authority has notified new integrated manufacturing clusters along the Ganga Expressway and Bundelkhand Expressway corridors.",
    keyHighlights: [
      "Corridor-Led Industrialization: 30 new industrial nodes planned across districts connecting western, central, and eastern Uttar Pradesh.",
      "Sectoral Focus: Dedicated zones for defense manufacturing, electronics system design, food processing, and medical devices.",
      "Single-Window Clearance: Nivesh Mitra digital portal integrated with time-bound land allotment and capital subsidy disbursement.",
    ],
    prelimsFacts: [
      "Ganga Expressway spans 594 km connecting Meerut to Prayagraj across 12 districts.",
      "Bundelkhand Expressway connects Chitrakoot to Etawah (296 km).",
      "UP Defence Industrial Corridor comprises six nodes: Aligarh, Agra, Jhansi, Chitrakoot, Kanpur, and Lucknow.",
    ],
    mainsPerspective:
      "Expressway-linked industrial clusters bridge regional disparities between western UP and Bundelkhand/Purvanchal while generating non-farm employment.",
    date: "20 Nov 2026",
    englishPdfUrl: "#ca-3-en",
    hindiPdfUrl: "#ca-3-hi",
    uploadedBy: "admin_1",
    isLocked: false,
  },
  {
    id: "ca-4",
    slug: "haryana-crop-diversification-water-conservation-scheme",
    sectionType: "state_scheme",
    stateName: "Haryana",
    examRelevance: "State Special",
    title: "Mera Pani Meri Virasat: Haryana Crop Diversification & Direct Benefit Scheme",
    whyInNews:
      "Haryana Agriculture Department has expanded financial incentives and micro-irrigation subsidies for farmers shifting away from water-intensive paddy cultivation.",
    keyHighlights: [
      "Direct Financial Incentive: Financial grant of ₹7,000 per acre provided directly via DBT to farmers replacing paddy with maize, pulses, oilseeds, or cotton.",
      "Micro-Irrigation Integration: Up to 85% subsidy on drip and sprinkler irrigation installations in dark-zone groundwater blocks.",
      "MSP Procurement Assurance: Assured procurement of alternative crops like maize and pulses at Minimum Support Price.",
    ],
    prelimsFacts: [
      "Scheme incentivizes shift from water-guzzling paddy in over-exploited groundwater blocks.",
      "Financial assistance of ₹7,000 per acre is credited directly into verified bank accounts.",
      "Micro-irrigation subsidy goes up to 85% for adopters.",
    ],
    mainsPerspective:
      "Addressing groundwater depletion in the Indo-Gangetic plain requires combining direct income support with assured market procurement for alternative crops.",
    date: "20 Nov 2026",
    englishPdfUrl: "#ca-4-en",
    hindiPdfUrl: "#ca-4-hi",
    uploadedBy: "super_admin",
    isLocked: true,
  },
  {
    id: "ca-5",
    slug: "pm-surya-ghar-muft-bijli-yojana-rooftop-solar",
    sectionType: "central_scheme",
    examRelevance: "GS-3",
    title: "PM Surya Ghar: Muft Bijli Yojana — Rooftop Solar & Net Metering Framework",
    whyInNews:
      "National rooftop solar installations crossed a major milestone under PM Surya Ghar: Muft Bijli Yojana, accelerating decentralized clean power generation across residential households.",
    keyHighlights: [
      "Central Financial Assistance: Subsidy of ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW and above residential rooftop solar systems.",
      "Free Electricity Benefit: Provides up to 300 units of free electricity per month to 1 crore households.",
      "Model Solar Village: One Model Solar Village developed per district to promote rural energy self-reliance.",
    ],
    prelimsFacts: [
      "Maximum Central Financial Assistance (CFA) is capped at ₹78,000 for systems of 3 kW or higher.",
      "Targets 1 crore residential households with up to 300 units of free monthly electricity.",
      "Surplus solar power can be sold back to DISCOMs through net metering.",
    ],
    mainsPerspective:
      "Decentralized rooftop solar empowers households as 'prosumers', reduces DISCOM technical losses, and supports India's 500 GW non-fossil fuel capacity target.",
    date: "20 Nov 2026",
    englishPdfUrl: "#ca-5-en",
    hindiPdfUrl: "#ca-5-hi",
    uploadedBy: "super_admin",
    isLocked: true,
  },
];

export const OFFICIAL_NOTIFICATIONS = [
  {
    id: "not-1",
    commission: "UPSC",
    title: "Civil Services (Preliminary) Examination 2026 — Official Notification & Calendar",
    date: "19 Nov 2026",
    pdfUrl: "#upsc-notif-pdf",
  },
  {
    id: "not-2",
    commission: "UPPSC",
    title: "Combined State / Upper Subordinate Services (PCS) Prelims 2026 Notice",
    date: "19 Nov 2026",
    pdfUrl: "#uppsc-notif-pdf",
  },
  {
    id: "not-3",
    commission: "BPSC",
    title: "71st Combined Competitive Examination — Revised Vacancy & Syllabus Notice",
    date: "18 Nov 2026",
    pdfUrl: "#bpsc-notif-pdf",
  },
  {
    id: "not-4",
    commission: "HPSC",
    title: "HCS (Ex. Br.) & Other Allied Services Preliminary Exam Schedule",
    date: "18 Nov 2026",
    pdfUrl: "#hpsc-notif-pdf",
  },
  {
    id: "not-5",
    commission: "RPSC",
    title: "RAS / RTS Combined Competitive Exam — Admit Card & Instructions",
    date: "17 Nov 2026",
    pdfUrl: "#rpsc-notif-pdf",
  },
  {
    id: "not-6",
    commission: "MPPSC",
    title: "State Service Examination 2026 — Official Answer Key & Objection Link",
    date: "16 Nov 2026",
    pdfUrl: "#mppsc-notif-pdf",
  },
];

export const DAILY_MAINS_TOPICS = [
  {
    id: "m-1",
    gsPaper: "GS-2",
    wordLimit: 150,
    question:
      "Examine the constitutional amendments required for implementing simultaneous elections in India. How does it impact the federal structure of the Indian Constitution?",
  },
  {
    id: "m-2",
    gsPaper: "GS-3",
    wordLimit: 250,
    question:
      "Discuss the strategic significance of the National Green Hydrogen Mission in achieving India's Net-Zero targets while ensuring industrial competitiveness.",
  },
  {
    id: "m-3",
    gsPaper: "GS-4",
    wordLimit: 150,
    question:
      "Transparency and accountability are the twin pillars of ethical governance. Illustrate with reference to digital public service delivery in India.",
  },
];

export const CBT_QUESTIONS: BilingualCbtQuestion[] = [
  {
    id: 1,
    subject: "Polity",
    questionEn:
      "Which of the following Articles of the Constitution of India deal with the duration of the Houses of Parliament and State Legislatures respectively?",
    questionHi:
      "भारत के संविधान के निम्नलिखित में से कौन-से अनुच्छेद क्रमशः संसद के सदनों और राज्य विधानमंडलों की अवधि से संबंधित हैं?",
    optionsEn: {
      A: "Article 79 and Article 168",
      B: "Article 83 and Article 172",
      C: "Article 85 and Article 174",
      D: "Article 110 and Article 199",
    },
    optionsHi: {
      A: "अनुच्छेद 79 और अनुच्छेद 168",
      B: "अनुच्छेद 83 और अनुच्छेद 172",
      C: "अनुच्छेद 85 और अनुच्छेद 174",
      D: "अनुच्छेद 110 और अनुच्छेद 199",
    },
    correct: "B",
    explanationEn:
      "Article 83 governs the duration of Houses of Parliament (5 years for Lok Sabha), while Article 172 governs the duration of State Legislatures.",
    explanationHi:
      "अनुच्छेद 83 संसद के सदनों की अवधि (लोकसभा के लिए 5 वर्ष) को नियंत्रित करता है, जबकि अनुच्छेद 172 राज्य विधानमंडलों की अवधि से संबंधित है।",
  },
  {
    id: 2,
    subject: "Economy",
    questionEn:
      "Under the National Green Hydrogen Mission, what is India's targeted annual Green Hydrogen production capacity by the year 2030?",
    questionHi:
      "राष्ट्रीय हरित हाइड्रोजन मिशन के तहत, वर्ष 2030 तक भारत की लक्षित वार्षिक हरित हाइड्रोजन उत्पादन क्षमता कितनी है?",
    optionsEn: {
      A: "2 Million Metric Tonnes",
      B: "5 Million Metric Tonnes",
      C: "10 Million Metric Tonnes",
      D: "15 Million Metric Tonnes",
    },
    optionsHi: {
      A: "2 मिलियन मीट्रिक टन",
      B: "5 मिलियन मीट्रिक टन",
      C: "10 मिलियन मीट्रिक टन",
      D: "15 मिलियन मीट्रिक टन",
    },
    correct: "B",
    explanationEn:
      "The National Green Hydrogen Mission targets at least 5 Million Metric Tonnes (MMT) of annual Green Hydrogen production capacity by 2030.",
    explanationHi:
      "राष्ट्रीय हरित हाइड्रोजन मिशन का लक्ष्य 2030 तक प्रति वर्ष कम से कम 5 मिलियन मीट्रिक टन (MMT) हरित हाइड्रोजन उत्पादन क्षमता प्राप्त करना है।",
  },
  {
    id: 3,
    subject: "History",
    questionEn:
      "Which of the following Acts introduced the provision for establishing a Public Service Commission in India for the first time?",
    questionHi:
      "निम्नलिखित में से किस अधिनियम ने पहली बार भारत में लोक सेवा आयोग की स्थापना का प्रावधान किया?",
    optionsEn: {
      A: "Indian Councils Act, 1909",
      B: "Government of India Act, 1919",
      C: "Government of India Act, 1935",
      D: "Charter Act, 1853",
    },
    optionsHi: {
      A: "भारतीय परिषद अधिनियम, 1909",
      B: "भारत शासन अधिनियम, 1919",
      C: "भारत शासन अधिनियम, 1935",
      D: "चार्टर अधिनियम, 1853",
    },
    correct: "B",
    explanationEn:
      "The Government of India Act, 1919 provided for the establishment of a Public Service Commission, set up in 1926 on the Lee Commission's recommendation.",
    explanationHi:
      "भारत शासन अधिनियम, 1919 में लोक सेवा आयोग की स्थापना का प्रावधान किया गया था, जिसे ली आयोग की सिफारिश पर 1926 में स्थापित किया गया।",
  },
  {
    id: 4,
    subject: "Geography",
    questionEn:
      "Which one of the following rivers originates from the plains of Uttar Pradesh rather than the Himalayas?",
    questionHi:
      "निम्नलिखित में से कौन-सी नदी हिमालय के बजाय उत्तर प्रदेश के मैदानी भाग से निकलती है?",
    optionsEn: {
      A: "Ramganga",
      B: "Ghaghara",
      C: "Gomti",
      D: "Gandak",
    },
    optionsHi: {
      A: "रामगंगा",
      B: "घाघरा",
      C: "गोमती",
      D: "गंडक",
    },
    correct: "C",
    explanationEn:
      "River Gomti originates from Gomat Taal (Fulhaar Jheel) near Madho Tanda in Pilibhit district of Uttar Pradesh.",
    explanationHi:
      "गोमती नदी उत्तर प्रदेश के पीलीभीत जिले में माधो टांडा के पास गोमत ताल (फुलहर झील) से निकलती है।",
  },
  {
    id: 5,
    subject: "Environment",
    questionEn:
      "In which of the following National Parks of India is the endangered Hangul (Kashmir Stag) naturally found?",
    questionHi:
      "भारत के निम्नलिखित में से किस राष्ट्रीय उद्यान में लुप्तप्राय हंगुल (कश्मीरी हिरण) प्राकृतिक रूप से पाया जाता है?",
    optionsEn: {
      A: "Hemis National Park",
      B: "Dachigam National Park",
      C: "Nanda Devi National Park",
      D: "Dudhwa National Park",
    },
    optionsHi: {
      A: "हेमिस राष्ट्रीय उद्यान",
      B: "दाचीगाम राष्ट्रीय उद्यान",
      C: "नंदा देवी राष्ट्रीय उद्यान",
      D: "दुधवा राष्ट्रीय उद्यान",
    },
    correct: "B",
    explanationEn:
      "Dachigam National Park in Jammu & Kashmir is renowned for conserving the critically endangered Hangul.",
    explanationHi:
      "जम्मू और कश्मीर में स्थित दाचीगाम राष्ट्रीय उद्यान गंभीर रूप से लुप्तप्राय हंगुल के संरक्षण के लिए प्रसिद्ध है।",
  },
];

export const TELEGRAM_SYNCED_QUIZZES: TelegramSyncedQuiz[] = [
  {
    id: "tg-quiz-2026-11-20",
    title: "Telegram Live Quiz #142 — Daily Current Affairs & Polity",
    examTag: "UPSC / UPPSC",
    date: "20 Nov 2026",
    totalQuestions: 5,
    durationMinutes: 10,
    source: "telegram_bot",
  },
  {
    id: "tg-quiz-2026-11-19",
    title: "Telegram Live Quiz #141 — Modern History & Geography",
    examTag: "BPSC / HPSC",
    date: "19 Nov 2026",
    totalQuestions: 5,
    durationMinutes: 10,
    source: "telegram_bot",
  },
];

export const SAMPLE_TELEGRAM_MISTAKES = [
  {
    questionNo: 1,
    subject: "Polity",
    questionEn:
      "Which of the following Articles of the Constitution of India deal with the duration of the Houses of Parliament and State Legislatures respectively?",
    questionHi:
      "भारत के संविधान के निम्नलिखित में से कौन-से अनुच्छेद क्रमशः संसद के सदनों और राज्य विधानमंडलों की अवधि से संबंधित हैं?",
    yourChoice: "C (Article 85 and Article 174)",
    correctChoice: "B (Article 83 and Article 172)",
    explanationEn:
      "Article 83 governs the duration of Houses of Parliament (5 years for Lok Sabha), while Article 172 governs the duration of State Legislatures.",
    explanationHi:
      "अनुच्छेद 83 संसद के सदनों की अवधि (लोकसभा के लिए 5 वर्ष) को नियंत्रित करता है, जबकि अनुच्छेद 172 राज्य विधानमंडलों की अवधि से संबंधित है।",
  },
  {
    questionNo: 4,
    subject: "Geography",
    questionEn:
      "Which one of the following rivers originates from the plains of Uttar Pradesh rather than the Himalayas?",
    questionHi:
      "निम्नलिखित में से कौन-सी नदी हिमालय के बजाय उत्तर प्रदेश के मैदानी भाग से निकलती है?",
    yourChoice: "A (Ramganga)",
    correctChoice: "C (Gomti)",
    explanationEn:
      "River Gomti originates from Gomat Taal (Fulhaar Jheel) near Madho Tanda in Pilibhit district of Uttar Pradesh.",
    explanationHi:
      "गोमती नदी उत्तर प्रदेश के पीलीभीत जिले में माधो टांडा के पास गोमत ताल (फुलहर झील) से निकलती है।",
  },
];
