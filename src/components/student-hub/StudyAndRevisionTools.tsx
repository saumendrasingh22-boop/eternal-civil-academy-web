"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Calendar, BarChart3, Library, Plus, Trash2, CheckCircle2, ExternalLink } from "lucide-react";
import { loadBookmarks, SavedBookmarkItem } from "@/components/BookmarkButton";

// 7. AUTOMATIC SPACED REPETITION REVISION SYSTEM (Today, +1d, +3d, +7d, +15d, +30d)
interface RevisionCard {
  id: string;
  subject: string;
  fact: string;
  createdAt: string; // YYYY-MM-DD
  doneIntervals: number[]; // subset of [0, 1, 3, 7, 15, 30]
}

const REV_KEY = "eca_auto_revision_cards_v1";
const INTERVALS = [
  { days: 0, label: "Today (आज)" },
  { days: 1, label: "+1 Day" },
  { days: 3, label: "+3 Days" },
  { days: 7, label: "+7 Days" },
  { days: 15, label: "+15 Days" },
  { days: 30, label: "+30 Days" },
];

function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AutomaticRevisionSystemTool() {
  const [cards, setCards] = useState<RevisionCard[]>([]);
  const [subject, setSubject] = useState("Polity");
  const [fact, setFact] = useState("");
  const [filterDue, setFilterDue] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REV_KEY);
      if (raw) {
        setCards(JSON.parse(raw));
      } else {
        setCards([
          {
            id: "rev-sample-1",
            subject: "Polity",
            fact: "Article 83: Duration of Houses of Parliament (5 yrs Lok Sabha); Article 172: Duration of State Legislatures.",
            createdAt: todayIso,
            doneIntervals: [],
          },
        ]);
      }
    } catch {}
  }, [todayIso]);

  const persist = (next: RevisionCard[]) => {
    setCards(next);
    window.localStorage.setItem(REV_KEY, JSON.stringify(next));
  };

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fact.trim()) return;
    persist([
      {
        id: `rev-${Date.now()}`,
        subject,
        fact: fact.trim(),
        createdAt: todayIso,
        doneIntervals: [],
      },
      ...cards,
    ]);
    setFact("");
  };

  const toggleInterval = (id: string, days: number) => {
    const next = cards.map((c) => {
      if (c.id !== id) return c;
      const exists = c.doneIntervals.includes(days);
      return {
        ...c,
        doneIntervals: exists
          ? c.doneIntervals.filter((x) => x !== days)
          : [...c.doneIntervals, days],
      };
    });
    persist(next);
  };

  const visibleCards = filterDue
    ? cards.filter((c) =>
        INTERVALS.some(
          (iv) => !c.doneIntervals.includes(iv.days) && addDaysIso(c.createdAt, iv.days) <= todayIso
        )
      )
    : cards;

  return (
    <div className="space-y-5">
      <form onSubmit={addCard} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-[#E60000]" /> Save Any Question or Fact for 1-3-7-15-30 Day Auto Revision
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">
            {["Polity", "History", "Geography", "Economy", "Environment", "Science", "Current Affairs", "State Special"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Write fact, article, scheme, or mistake to remember forever..."
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            className="sm:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
            required
          />
          <button type="submit" className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold rounded-xl py-2 flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Save for Revision
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-[#0B1B3D]">Saved Revision Cards ({visibleCards.length})</span>
        <button
          onClick={() => setFilterDue(!filterDue)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
            filterDue ? "bg-[#E60000] text-white border-[#E60000]" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          {filterDue ? "Showing Due Today Only" : "Filter: Due Today"}
        </button>
      </div>

      <div className="space-y-3">
        {visibleCards.map((card) => (
          <div key={card.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="bg-blue-50 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded">{card.subject}</span>
                <span className="text-[10px] text-slate-400 font-semibold ml-2">Saved: {card.createdAt}</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{card.fact}</p>
              </div>
              <button onClick={() => persist(cards.filter((x) => x.id !== card.id))} className="text-[#E60000] p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-6 gap-2">
              {INTERVALS.map((iv) => {
                const dueDate = addDaysIso(card.createdAt, iv.days);
                const done = card.doneIntervals.includes(iv.days);
                const isDueNow = !done && dueDate <= todayIso;
                return (
                  <button
                    key={iv.days}
                    type="button"
                    onClick={() => toggleInterval(card.id, iv.days)}
                    className={`p-2 rounded-xl border text-left transition ${
                      done
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                        : isDueNow
                        ? "bg-amber-50 border-amber-400 text-amber-950"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="text-[10px] font-extrabold flex items-center justify-between">
                      <span>{iv.label}</span>
                      {done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5">{dueDate}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. PERSONAL STUDY PLANNER
export function PersonalStudyPlannerTool() {
  const [exam, setExam] = useState("UPSC CSE 2027");
  const [hours, setHours] = useState("8");
  const [weakSubject, setWeakSubject] = useState("Indian Economy");
  const [doneSlots, setDoneSlots] = useState<Record<number, boolean>>({});

  const h = Math.max(2, Math.min(16, Number(hours) || 8));
  const slots = [
    { slot: "Slot 1 (Morning)", duration: `${Math.max(1, Math.round(h * 0.2))} hrs`, task: "Daily Current Affairs + Editorial Reading (PIB / ECA)" },
    { slot: "Slot 2 (Core GS)", duration: `${Math.max(1, Math.round(h * 0.3))} hrs`, task: `High-Priority Weak Subject Focus: ${weakSubject}` },
    { slot: "Slot 3 (Static GS)", duration: `${Math.max(1, Math.round(h * 0.25))} hrs`, task: "NCERT Crux & Standard Textbook (Polity / History / Geography)" },
    { slot: "Slot 4 (Practice)", duration: `${Math.max(1, Math.round(h * 0.15))} hrs`, task: "Daily 25 PYQ + Live CBT Mock Test & Mistakes Review" },
    { slot: "Slot 5 (Night)", duration: `${Math.max(1, Math.round(h * 0.1))} hrs`, task: "Automatic 1-3-7-15-30 Day Spaced Revision Recall" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam</label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold">
            <option>UPSC CSE 2027</option>
            <option>UPPSC PCS 2026</option>
            <option>BPSC 71st CCE</option>
            <option>RPSC RAS / MPPSC</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Daily Study Hours</label>
          <input type="number" min={2} max={16} value={hours} onChange={(e) => setHours(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Weakest Subject Priority</label>
          <select value={weakSubject} onChange={(e) => setWeakSubject(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold">
            {["Indian Economy", "Indian Polity", "Modern History", "Geography", "Environment", "CSAT / Reasoning", "State Special"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#E60000]" /> Custom Daily Timetable — {exam} ({h} Hours/Day)
        </div>
        {slots.map((sl, i) => (
          <label key={i} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition ${doneSlots[i] ? "bg-emerald-50 border-emerald-300 line-through text-slate-500" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2.5">
              <input type="checkbox" checked={Boolean(doneSlots[i])} onChange={() => setDoneSlots((p) => ({ ...p, [i]: !p[i] }))} />
              <div>
                <span className="text-[11px] font-extrabold text-[#E60000] mr-2">{sl.slot}</span>
                <span className="text-xs sm:text-sm font-bold text-[#0B1B3D]">{sl.task}</span>
              </div>
            </div>
            <span className="bg-[#0B1B3D] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shrink-0">{sl.duration}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// 9. PYQ TREND ANALYZER
export function PyqTrendAnalyzerTool() {
  const [exam, setExam] = useState<"UPSC" | "UPPSC" | "BPSC">("UPSC");

  const data: Record<string, { subject: string; avgQs: number; pct: number; hotTopics: string }[]> = {
    UPSC: [
      { subject: "Indian Polity & Governance", avgQs: 18, pct: 18, hotTopics: "Parliament, Fundamental Rights, Constitutional Bodies, Amendments" },
      { subject: "Indian Economy", avgQs: 17, pct: 17, hotTopics: "RBI Monetary Policy, Inflation, Fiscal Deficit, External Sector" },
      { subject: "Environment & Ecology", avgQs: 16, pct: 16, hotTopics: "Protected Areas, Species, Climate Conventions, Biodiversity Acts" },
      { subject: "History, Art & Culture", avgQs: 15, pct: 15, hotTopics: "Ancient/Medieval Terms, Buddhism/Jainism, Gandhian Era" },
      { subject: "Geography & Mapping", avgQs: 14, pct: 14, hotTopics: "Places in News, Rivers, Climatology, Minerals" },
      { subject: "Science, Tech & Current Affairs", avgQs: 20, pct: 20, hotTopics: "ISRO/Space, Biotech, AI, Defence & International Groupings" },
    ],
    UPPSC: [
      { subject: "Current Affairs & UP Special", avgQs: 35, pct: 24, hotTopics: "UP Budget, Expressways, GI Tags, Schemes, Awards & Indices" },
      { subject: "History (Ancient + Modern)", avgQs: 26, pct: 17, hotTopics: "Chronology, 1857 Revolt, Bhakti/Sufi, National Movement" },
      { subject: "Geography & Environment", avgQs: 25, pct: 17, hotTopics: "Indian Rivers, Ramsar Sites, National Parks, World Straits" },
      { subject: "Indian Polity", avgQs: 22, pct: 15, hotTopics: "Articles 1–395, Schedules, Panchayati Raj, Commissions" },
      { subject: "General Science", avgQs: 22, pct: 15, hotTopics: "Vitamins, Diseases, Physics Units, Chemistry Compounds" },
      { subject: "Economy & Census", avgQs: 20, pct: 12, hotTopics: "Census 2011, Poverty Committees, Five-Year Plans, Budget" },
    ],
    BPSC: [
      { subject: "History (Modern + Bihar History)", avgQs: 35, pct: 23, hotTopics: "1857 Kunwar Singh, Champaran, Quit India, Maurya/Gupta" },
      { subject: "General Science", avgQs: 30, pct: 20, hotTopics: "NCERT Class 9–10 Physics, Chemistry & Biology Applications" },
      { subject: "Current Affairs (National + Bihar)", avgQs: 30, pct: 20, hotTopics: "Bihar Budget, Economic Survey, National Summits & Schemes" },
      { subject: "Bihar Special & Geography", avgQs: 25, pct: 17, hotTopics: "Bihar Rivers, Soils, Minerals, Census & Physiography" },
      { subject: "Polity & Economy", avgQs: 20, pct: 13, hotTopics: "Constitutional Articles, RBI, Agriculture & Industrial Policy" },
      { subject: "Maths & Mental Ability", avgQs: 10, pct: 7, hotTopics: "Percentage, Ratio, Time & Work, Number Series" },
    ],
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["UPSC", "UPPSC", "BPSC"] as const).map((ex) => (
          <button
            key={ex}
            onClick={() => setExam(ex)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition ${
              exam === ex ? "bg-[#E60000] text-white border-[#E60000]" : "bg-white text-[#0B1B3D] border-slate-200"
            }`}
          >
            {ex} Prelims Trend (2018–2025)
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {data[exam].map((row) => (
          <div key={row.subject} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#0B1B3D]">
              <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-[#E60000]" /> {row.subject}</span>
              <span className="text-[#E60000]">~{row.avgQs} Qs ({row.pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[#0B1B3D]" style={{ width: `${Math.min(100, row.pct * 3.5)}%` }} />
            </div>
            <p className="text-xs text-slate-600 mt-1.5"><strong>High-Yield Topics:</strong> {row.hotTopics}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 10. MY STUDY LIBRARY (Personal Vault)
interface PersonalResource {
  id: string;
  title: string;
  subject: string;
  url: string;
}

const LIB_KEY = "eca_my_study_library_v1";

export function MyStudyLibraryTool() {
  const [bookmarks, setBookmarks] = useState<SavedBookmarkItem[]>([]);
  const [resources, setResources] = useState<PersonalResource[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General Studies");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setBookmarks(loadBookmarks());
    try {
      const raw = window.localStorage.getItem(LIB_KEY);
      if (raw) setResources(JSON.parse(raw));
    } catch {}
  }, []);

  const addResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const next = [{ id: `lib-${Date.now()}`, title: title.trim(), subject, url: url.trim() }, ...resources];
    setResources(next);
    window.localStorage.setItem(LIB_KEY, JSON.stringify(next));
    setTitle("");
    setUrl("");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addResource} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <input type="text" placeholder="Note / PDF / Video Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white" required />
        <input type="text" placeholder="Subject (e.g. Polity)" value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white" />
        <input type="url" placeholder="Link (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white" required />
        <button type="submit" className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold rounded-xl py-2">+ Save to Library</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase text-[#0B1B3D] mb-3 flex items-center gap-1.5">
            <Library className="w-4 h-4 text-[#E60000]" /> Saved Current Affairs Bookmarks ({bookmarks.length})
          </h3>
          {bookmarks.length === 0 ? (
            <p className="text-xs text-slate-500">Bookmark any Current Affairs article to see it here.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookmarks.map((b) => (
                <Link key={b.slug} href={`/current-affairs/${b.slug}`} className="py-2 block text-xs font-bold text-[#0B1B3D] hover:text-[#E60000]">
                  {b.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase text-[#0B1B3D] mb-3">
            My Saved Links & PDFs ({resources.length})
          </h3>
          {resources.length === 0 ? (
            <p className="text-xs text-slate-500">Save your Drive PDFs, YouTube lectures, or study notes above.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {resources.map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0B1B3D] hover:text-[#E60000] inline-flex items-center gap-1 truncate">
                    {r.title} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <button
                    onClick={() => {
                      const next = resources.filter((x) => x.id !== r.id);
                      setResources(next);
                      window.localStorage.setItem(LIB_KEY, JSON.stringify(next));
                    }}
                    className="text-[#E60000]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
