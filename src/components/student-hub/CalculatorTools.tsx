"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, CheckCircle2, AlertTriangle, Trophy, Briefcase, IndianRupee } from "lucide-react";

// 1. CUT-OFF CALCULATOR
export function CutOffCalculatorTool() {
  const [exam, setExam] = useState("UPSC CSE");
  const [category, setCategory] = useState<"General" | "OBC" | "EWS" | "SC" | "ST">("General");
  const [score, setScore] = useState("94");

  const cutoffs: Record<string, Record<string, { cutoff: number; max: number }>> = {
    "UPSC CSE": {
      General: { cutoff: 88, max: 200 },
      OBC: { cutoff: 86, max: 200 },
      EWS: { cutoff: 85, max: 200 },
      SC: { cutoff: 76, max: 200 },
      ST: { cutoff: 71, max: 200 },
    },
    "UPPSC PCS": {
      General: { cutoff: 122, max: 200 },
      OBC: { cutoff: 120, max: 200 },
      EWS: { cutoff: 121, max: 200 },
      SC: { cutoff: 108, max: 200 },
      ST: { cutoff: 98, max: 200 },
    },
    BPSC: {
      General: { cutoff: 91, max: 150 },
      OBC: { cutoff: 88, max: 150 },
      EWS: { cutoff: 87, max: 150 },
      SC: { cutoff: 79, max: 150 },
      ST: { cutoff: 75, max: 150 },
    },
    "RPSC RAS": {
      General: { cutoff: 100, max: 200 },
      OBC: { cutoff: 100, max: 200 },
      EWS: { cutoff: 99, max: 200 },
      SC: { cutoff: 88, max: 200 },
      ST: { cutoff: 86, max: 200 },
    },
    MPPSC: {
      General: { cutoff: 162, max: 200 },
      OBC: { cutoff: 156, max: 200 },
      EWS: { cutoff: 154, max: 200 },
      SC: { cutoff: 146, max: 200 },
      ST: { cutoff: 134, max: 200 },
    },
  };

  const ref = cutoffs[exam][category];
  const numScore = Number(score) || 0;
  const diff = numScore - ref.cutoff;
  const status =
    diff >= 4 ? "Safe Zone — Start Mains Preparation!" : diff >= -4 ? "Borderline — Keep Both Prelims & Mains Ready" : "Below Cut-Off — Focus on Weak Subjects & PYQs";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Exam</label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold">
            {Object.keys(cutoffs).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold">
            {["General", "OBC", "EWS", "SC", "ST"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Your Score (Out of {ref.max})</label>
          <input type="number" step="0.5" value={score} onChange={(e) => setScore(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-extrabold" />
        </div>
      </div>

      <div className={`p-5 rounded-2xl border-2 ${diff >= 4 ? "bg-emerald-50 border-emerald-400" : diff >= -4 ? "bg-amber-50 border-amber-400" : "bg-red-50 border-red-300"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-600">{exam} ({category}) Reference Cut-Off: ~{ref.cutoff} / {ref.max}</div>
            <div className="text-lg sm:text-xl font-extrabold text-[#0B1B3D] mt-1">{status}</div>
          </div>
          <div className="text-2xl font-extrabold text-[#E60000]">
            {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} Marks
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. EXAM MARKS CALCULATOR
export function ExamMarksCalculatorTool() {
  const [totalQ, setTotalQ] = useState("100");
  const [correct, setCorrect] = useState("58");
  const [wrong, setWrong] = useState("24");
  const [marksPerQ, setMarksPerQ] = useState("2");
  const [negRatio, setNegRatio] = useState("0.3333");

  const t = Math.max(1, Number(totalQ) || 100);
  const c = Math.max(0, Number(correct) || 0);
  const w = Math.max(0, Number(wrong) || 0);
  const mpq = Number(marksPerQ) || 2;
  const nr = Number(negRatio) || 0;
  const skipped = Math.max(0, t - (c + w));
  const positiveMarks = c * mpq;
  const negativeLost = w * mpq * nr;
  const netMarks = Math.max(0, positiveMarks - negativeLost);
  const maxMarks = t * mpq;
  const accuracy = c + w > 0 ? Math.round((c / (c + w)) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Total Qs</label>
          <input type="number" value={totalQ} onChange={(e) => setTotalQ(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-emerald-700 mb-1">Correct Qs</label>
          <input type="number" value={correct} onChange={(e) => setCorrect(e.target.value)} className="w-full border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#E60000] mb-1">Wrong Qs</label>
          <input type="number" value={wrong} onChange={(e) => setWrong(e.target.value)} className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Marks / Q</label>
          <input type="number" step="0.5" value={marksPerQ} onChange={(e) => setMarksPerQ(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Negative Marking</label>
          <select value={negRatio} onChange={(e) => setNegRatio(e.target.value)} className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold">
            <option value="0.3333">1/3 (UPSC/UPPSC/BPSC)</option>
            <option value="0.25">1/4 (SSC/Banking)</option>
            <option value="0">No Negative (MPPSC)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0B1B3D] text-white p-4 rounded-2xl text-center">
          <div className="text-xs text-yellow-300 font-bold">Net Score</div>
          <div className="text-2xl font-extrabold mt-1">{netMarks.toFixed(2)} / {maxMarks}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
          <div className="text-xs text-emerald-800 font-bold">Accuracy</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{accuracy}%</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
          <div className="text-xs text-red-800 font-bold">Negative Lost</div>
          <div className="text-2xl font-extrabold text-[#E60000] mt-1">-{negativeLost.toFixed(2)}</div>
        </div>
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl text-center">
          <div className="text-xs text-slate-600 font-bold">Skipped</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{skipped}</div>
        </div>
      </div>
    </div>
  );
}

// 3. AGE & ELIGIBILITY CALCULATOR
export function AgeEligibilityCalculatorTool() {
  const [dob, setDob] = useState("1999-07-15");
  const [exam, setExam] = useState("UPSC CSE 2027");
  const [category, setCategory] = useState<"General" | "OBC" | "SC/ST" | "PwBD">("General");

  const rules: Record<string, { cutoffDate: string; min: number; maxBase: number; attempts: Record<string, string> }> = {
    "UPSC CSE 2027": { cutoffDate: "2027-08-01", min: 21, maxBase: 32, attempts: { General: "6 Attempts", OBC: "9 Attempts", "SC/ST": "Unlimited till age limit", PwBD: "9 (Gen/OBC) / Unlimited (SC/ST)" } },
    "UPPSC PCS 2026": { cutoffDate: "2026-07-01", min: 21, maxBase: 40, attempts: { General: "No Attempt Limit", OBC: "No Attempt Limit", "SC/ST": "No Attempt Limit", PwBD: "No Attempt Limit" } },
    "BPSC 71st CCE": { cutoffDate: "2026-08-01", min: 20, maxBase: 37, attempts: { General: "No Attempt Limit", OBC: "No Attempt Limit", "SC/ST": "No Attempt Limit", PwBD: "No Attempt Limit" } },
    "RPSC RAS 2026": { cutoffDate: "2027-01-01", min: 21, maxBase: 40, attempts: { General: "No Attempt Limit", OBC: "No Attempt Limit", "SC/ST": "No Attempt Limit", PwBD: "No Attempt Limit" } },
  };

  const relax = category === "OBC" ? 3 : category === "SC/ST" ? 5 : category === "PwBD" ? 10 : 0;
  const rule = rules[exam];
  const birth = new Date(dob);
  const cutoff = new Date(rule.cutoffDate);
  let ageYears = cutoff.getFullYear() - birth.getFullYear();
  const mDiff = cutoff.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && cutoff.getDate() < birth.getDate())) ageYears--;
  const maxAllowed = rule.maxBase + relax;
  const eligible = ageYears >= rule.min && ageYears <= maxAllowed;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam</label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold">
            {Object.keys(rules).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold">
            {["General", "OBC", "SC/ST", "PwBD"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border-2 ${eligible ? "bg-emerald-50 border-emerald-400" : "bg-red-50 border-red-300"}`}>
        <div className="flex items-center gap-2 text-lg font-extrabold text-[#0B1B3D]">
          {eligible ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-[#E60000]" />}
          <span>{eligible ? `ELIGIBLE for ${exam}` : `NOT ELIGIBLE for ${exam}`}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs font-bold text-slate-700">
          <div className="bg-white p-3 rounded-xl border border-slate-200">Age on {rule.cutoffDate}: <strong className="text-[#0B1B3D]">{ageYears} Years</strong></div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">Allowed Range: <strong className="text-[#0B1B3D]">{rule.min} – {maxAllowed} Years</strong></div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">Attempts: <strong className="text-[#E60000]">{rule.attempts[category]}</strong></div>
        </div>
      </div>
    </div>
  );
}

// 4. ALL INDIA RANK PREDICTOR (Website + Telegram Tests)
export function AllIndiaRankPredictorTool() {
  const [source, setSource] = useState("Website Live CBT Test");
  const [examName, setExamName] = useState("UPSC CSE Prelims Mock");
  const [score, setScore] = useState("108");
  const [maxMarks, setMaxMarks] = useState("200");
  const [totalStudents, setTotalStudents] = useState("50000");

  const sc = Math.max(0, Number(score) || 0);
  const mx = Math.max(1, Number(maxMarks) || 200);
  const pop = Math.max(100, Number(totalStudents) || 50000);
  const pct = Math.min(100, (sc / mx) * 100);
  // Logistic bell-curve percentile model for competitive exams
  const percentile = Math.min(99.95, Math.max(15, 100 / (1 + Math.exp(-(pct - 42) / 9)))).toFixed(2);
  const estRank = Math.max(1, Math.round(((100 - Number(percentile)) / 100) * pop));
  const rankLow = Math.max(1, Math.round(estRank * 0.85));
  const rankHigh = Math.max(rankLow + 5, Math.round(estRank * 1.15));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Test Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold">
            <option>Website Live CBT Test</option>
            <option>Telegram Bot Quiz</option>
            <option>Official Prelims Exam</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Exam Name</label>
          <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Your Score</label>
          <input type="number" value={score} onChange={(e) => setScore(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks</label>
          <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Total Candidates</label>
          <input type="number" value={totalStudents} onChange={(e) => setTotalStudents(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0B1B3D] to-[#162F66] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 bg-[#E60000] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
            <Trophy className="w-3 h-3" /> {source} • {examName}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2">
            Predicted AIR: <span className="text-yellow-300">#{rankLow.toLocaleString()} – #{rankHigh.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">Estimated Percentile: <strong>{percentile}%ile</strong> (Score: {pct.toFixed(1)}%)</p>
        </div>

        <Link
          href={`/student-hub/score-card-generator?exam=${encodeURIComponent(examName)}&score=${encodeURIComponent(`${sc}/${mx}`)}&rank=${encodeURIComponent(`AIR ${rankLow}`)}&accuracy=${Math.round(pct)}`}
          className="bg-yellow-400 hover:bg-yellow-300 text-[#0B1B3D] text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
        >
          Generate Shareable Score Card →
        </Link>
      </div>
    </div>
  );
}

// 5. GOVERNMENT OFFICER SALARY CALCULATOR (7th CPC)
export function SalaryCalculatorTool() {
  const [post, setPost] = useState("IAS / IPS / SDM / DSP (Level-10)");
  const [city, setCity] = useState<"X" | "Y" | "Z">("X");
  const [daPct, setDaPct] = useState("53");

  const basicMap: Record<string, { basic: number; ta: number }> = {
    "IAS / IPS / SDM / DSP (Level-10)": { basic: 56100, ta: 7200 },
    "Senior Scale IAS / ADM (Level-11)": { basic: 67700, ta: 7200 },
    "Review Officer / Naib Tehsildar (Level-8)": { basic: 47600, ta: 3600 },
    "ASO / Inspector / BDO (Level-7)": { basic: 44900, ta: 3600 },
    "Junior Assistant / Clerk (Level-4)": { basic: 25500, ta: 3600 },
  };

  const { basic, ta } = basicMap[post];
  const da = Math.round((basic * (Number(daPct) || 53)) / 100);
  const hraPct = city === "X" ? 30 : city === "Y" ? 20 : 10;
  const hra = Math.round((basic * hraPct) / 100);
  const gross = basic + da + hra + ta;
  const nps = Math.round((basic + da) * 0.1);
  const cghsTax = Math.round(gross * 0.06);
  const inHand = gross - nps - cghsTax;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Post & Pay Level</label>
          <select value={post} onChange={(e) => setPost(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">
            {Object.keys(basicMap).map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">City Class (HRA)</label>
          <select value={city} onChange={(e) => setCity(e.target.value as any)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">
            <option value="X">Class X — Metro (30% HRA)</option>
            <option value="Y">Class Y — Tier-2 (20% HRA)</option>
            <option value="Z">Class Z — Rural/Small (10% HRA)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">DA Rate (%)</label>
          <input type="number" value={daPct} onChange={(e) => setDaPct(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <div className="text-[11px] font-bold text-slate-500">Basic + DA + HRA</div>
          <div className="text-lg font-extrabold text-[#0B1B3D] mt-1">₹{(basic + da + hra).toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
          <div className="text-[11px] font-bold text-blue-800">Gross Salary</div>
          <div className="text-lg font-extrabold text-[#0B1B3D] mt-1">₹{gross.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
          <div className="text-[11px] font-bold text-red-800">NPS + Deductions</div>
          <div className="text-lg font-extrabold text-[#E60000] mt-1">-₹{(nps + cghsTax).toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-emerald-600 text-white p-4 rounded-xl text-center shadow">
          <div className="text-[11px] font-bold text-emerald-100 flex items-center justify-center gap-1"><IndianRupee className="w-3 h-3" /> Approx In-Hand</div>
          <div className="text-xl font-extrabold mt-1">₹{inHand.toLocaleString("en-IN")}/mo</div>
        </div>
      </div>
    </div>
  );
}

// 6. GOVERNMENT JOB FINDER
export function GovernmentJobFinderTool() {
  const [qual, setQual] = useState("Graduate (Any Stream)");
  const [age, setAge] = useState("24");
  const [scope, setScope] = useState("ALL");

  const jobs = [
    { name: "UPSC Civil Services (IAS / IPS / IFS)", level: "Central", qual: ["Graduate (Any Stream)", "Post-Graduate", "Engineering / Tech", "Law (LLB)"], minAge: 21, maxAge: 32, pay: "Level-10 (₹56,100+)" },
    { name: "UPPSC Combined State / PCS (SDM / DSP)", level: "State", qual: ["Graduate (Any Stream)", "Post-Graduate", "Engineering / Tech", "Law (LLB)"], minAge: 21, maxAge: 40, pay: "Level-10 (₹56,100+)" },
    { name: "BPSC Combined Competitive Exam", level: "State", qual: ["Graduate (Any Stream)", "Post-Graduate", "Engineering / Tech", "Law (LLB)"], minAge: 20, maxAge: 37, pay: "Level-9/10" },
    { name: "UPPSC RO / ARO (Review Officer)", level: "State", qual: ["Graduate (Any Stream)", "Post-Graduate"], minAge: 21, maxAge: 40, pay: "Level-8 (₹47,600+)" },
    { name: "UPSC CAPF (Assistant Commandant)", level: "Central", qual: ["Graduate (Any Stream)", "Post-Graduate", "Engineering / Tech"], minAge: 20, maxAge: 25, pay: "Level-10 (₹56,100+)" },
    { name: "State PCS-J (Civil Judge / Judiciary)", level: "State", qual: ["Law (LLB)"], minAge: 22, maxAge: 35, pay: "Judicial Scale" },
    { name: "UPSC Engineering Services (IES)", level: "Central", qual: ["Engineering / Tech"], minAge: 21, maxAge: 30, pay: "Level-10 (₹56,100+)" },
    { name: "SSC CHSL / State Police Constable", level: "Central", qual: ["12th Pass", "Graduate (Any Stream)"], minAge: 18, maxAge: 27, pay: "Level-2 to 4" },
  ];

  const userAge = Number(age) || 24;
  const matched = jobs.filter(
    (j) =>
      j.qual.includes(qual) &&
      userAge >= j.minAge &&
      userAge <= j.maxAge &&
      (scope === "ALL" || j.level === scope)
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Highest Qualification</label>
          <select value={qual} onChange={(e) => setQual(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">
            <option>12th Pass</option>
            <option>Graduate (Any Stream)</option>
            <option>Post-Graduate</option>
            <option>Engineering / Tech</option>
            <option>Law (LLB)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Your Age (Years)</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Job Preference</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">
            <option value="ALL">All (Central & State)</option>
            <option value="Central">Central Government</option>
            <option value="State">State Government (PCS)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-[#E60000]" /> Eligible Exams Found ({matched.length})
        </div>
        {matched.map((j, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded mr-2">{j.level}</span>
              <span className="text-sm font-extrabold text-[#0B1B3D]">{j.name}</span>
              <p className="text-xs text-slate-500 mt-0.5">Age: {j.minAge}–{j.maxAge} yrs • Pay: {j.pay}</p>
            </div>
            <Link href="/batches" className="bg-[#E60000] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg">
              Prepare Now →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
