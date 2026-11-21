"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CBT_QUESTIONS } from "@/lib/siteData";
import { Printer, CheckCircle2, Swords, Award, Download, Share2, Clock, Languages } from "lucide-react";

// 11. OMR SHEET GENERATOR & DIGITAL CHECKER
export function OmrSheetTool() {
  const [tab, setTab] = useState<"generator" | "checker">("generator");
  const [qCount, setQCount] = useState(100);
  const [omrTitle, setOmrTitle] = useState("UPSC / State PCS Practice OMR Sheet");

  // Digital OMR Checker (20 Qs interactive grid for quick practice + answer key)
  const [checkerCount, setCheckerCount] = useState(10);
  const [marked, setMarked] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [answerKeyStr, setAnswerKeyStr] = useState("B,B,B,C,B,A,C,D,A,B");
  const [checked, setChecked] = useState(false);

  const printOmrPdf = () => {
    const rows = Array.from({ length: qCount }, (_, i) => i + 1)
      .map(
        (n) =>
          `<div style="display:flex;align-items:center;gap:8px;font-size:11px;margin-bottom:4px;">
             <span style="width:24px;font-weight:700;">${n}.</span>
             ${["A", "B", "C", "D"]
               .map(
                 (o) =>
                   `<span style="width:18px;height:18px;border:1.5px solid #0B1B3D;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">${o}</span>`
               )
               .join("")}
           </div>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${omrTitle}</title></head>
      <body style="font-family:Arial,sans-serif;padding:20px;">
        <div style="background:#0B1B3D;color:#fff;padding:12px 16px;border-radius:10px;border-bottom:4px solid #E60000;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:18px;font-weight:800;">ETERNAL CIVIL ACADEMY</div><div style="font-size:11px;font-style:italic;color:#facc15;">Your Success, Our Commitment</div></div>
          <div style="font-size:12px;font-weight:700;">${omrTitle} (${qCount} Qs)</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">${rows}</div>
        <script>window.onload=function(){window.print();};</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=950");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const keys = answerKeyStr
    .toUpperCase()
    .split(/[^ABCD]+/)
    .filter(Boolean);

  let correct = 0;
  let wrong = 0;
  for (let i = 1; i <= checkerCount; i++) {
    if (marked[i]) {
      if (marked[i] === keys[i - 1]) correct++;
      else wrong++;
    }
  }
  const score = Math.max(0, correct * 2 - wrong * 0.666).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button onClick={() => setTab("generator")} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${tab === "generator" ? "bg-[#0B1B3D] text-white" : "bg-slate-100 text-slate-700"}`}>
          1. Generate & Print OMR PDF
        </button>
        <button onClick={() => setTab("checker")} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${tab === "checker" ? "bg-[#E60000] text-white" : "bg-slate-100 text-slate-700"}`}>
          2. Digital OMR Sheet Checker
        </button>
      </div>

      {tab === "generator" ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sheet Title</label>
              <input type="text" value={omrTitle} onChange={(e) => setOmrTitle(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Questions</label>
              <select value={qCount} onChange={(e) => setQCount(Number(e.target.value))} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">
                <option value={50}>50 Questions</option>
                <option value={100}>100 Questions (UPSC Prelims)</option>
                <option value={150}>150 Questions (UPPSC / BPSC)</option>
              </select>
            </div>
          </div>
          <button onClick={printOmrPdf} className="inline-flex items-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow transition">
            <Printer className="w-4 h-4" /> Generate & Print Blank OMR Sheet PDF
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Questions</label>
              <select value={checkerCount} onChange={(e) => { setCheckerCount(Number(e.target.value)); setChecked(false); }} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">
                <option value={10}>10 Qs</option>
                <option value={25}>25 Qs</option>
                <option value={50}>50 Qs</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Answer Key (comma-separated, e.g. A,B,C,D...)</label>
              <input type="text" value={answerKeyStr} onChange={(e) => setAnswerKeyStr(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {Array.from({ length: checkerCount }, (_, i) => i + 1).map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0B1B3D]">Q{n}</span>
                <div className="flex gap-1">
                  {(["A", "B", "C", "D"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMarked((p) => ({ ...p, [n]: opt }))}
                      className={`w-6 h-6 rounded-full text-[10px] font-extrabold border transition ${
                        marked[n] === opt ? "bg-[#0B1B3D] text-white border-[#0B1B3D]" : "bg-slate-50 text-slate-700 border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setChecked(true)} className="bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Check OMR Sheet Now
          </button>

          {checked && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold">
              <span className="text-[#0B1B3D]">Net Score (+2 / -0.66): <strong className="text-[#E60000] text-base">{score}</strong></span>
              <span className="text-emerald-800">Correct: {correct}</span>
              <span className="text-[#E60000]">Wrong: {wrong}</span>
              <span className="text-slate-600">Skipped: {checkerCount - (correct + wrong)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 12. 1 vs 1 QUIZ BATTLE (10 Questions, Timer, Winner, Rank, Shareable Result)
export function QuizBattleTool() {
  // Build 10-question battle pool from CBT_QUESTIONS
  const battleQs = [...CBT_QUESTIONS, ...CBT_QUESTIONS].map((q, idx) => ({ ...q, battleId: idx + 1 }));
  const [stage, setStage] = useState<"setup" | "p1" | "p2" | "result">("setup");
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [qIdx, setQIdx] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [timer, setTimer] = useState(120);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (stage !== "p1" && stage !== "p2") return;
    const t = setInterval(() => {
      setTimer((s) => {
        if (s <= 1) {
          setStage(stage === "p1" ? "p2" : "result");
          setQIdx(0);
          return 120;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  const handleAnswer = (opt: "A" | "B" | "C" | "D") => {
    const isRight = battleQs[qIdx].correct === opt;
    if (stage === "p1" && isRight) setP1Score((s) => s + 1);
    if (stage === "p2" && isRight) setP2Score((s) => s + 1);

    if (qIdx < battleQs.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setQIdx(0);
      setTimer(120);
      setStage(stage === "p1" ? "p2" : "result");
    }
  };

  if (stage === "setup") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B1B3D]">
          <Swords className="w-5 h-5 text-[#E60000]" /> 1 vs 1 UPSC/PCS Quiz Battle (10 Questions • Timed Challenge)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} placeholder="Player 1 Name" className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white" />
          <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} placeholder="Player 2 Name" className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white" />
        </div>
        <button
          onClick={() => { setP1Score(0); setP2Score(0); setQIdx(0); setTimer(120); setStage("p1"); }}
          className="bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold px-6 py-3 rounded-xl shadow transition"
        >
          Start 1 vs 1 Battle →
        </button>
      </div>
    );
  }

  if (stage === "result") {
    const winner = p1Score > p2Score ? p1Name : p2Score > p1Score ? p2Name : "Tie Match!";
    const shareText = `ETERNAL CIVIL ACADEMY — 1 vs 1 Quiz Battle Result!\n${p1Name}: ${p1Score}/10 vs ${p2Name}: ${p2Score}/10\nWinner: ${winner}\nChallenge me at https://eternalcivilacademy.com/student-hub/quiz-battle`;
    return (
      <div className="bg-gradient-to-r from-[#0B1B3D] to-[#162F66] text-white rounded-2xl p-6 space-y-4 text-center">
        <Award className="w-10 h-10 text-yellow-400 mx-auto" />
        <h3 className="text-2xl font-extrabold">Winner: <span className="text-yellow-300">{winner}</span></h3>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-xs text-yellow-300 font-bold">Rank #{p1Score >= p2Score ? 1 : 2}</div>
            <div className="text-base font-extrabold mt-1">{p1Name}</div>
            <div className="text-2xl font-extrabold text-white">{p1Score} / 10</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-xs text-yellow-300 font-bold">Rank #{p2Score >= p1Score ? 1 : 2}</div>
            <div className="text-base font-extrabold mt-1">{p2Name}</div>
            <div className="text-2xl font-extrabold text-white">{p2Score} / 10</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(shareText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="bg-yellow-400 text-[#0B1B3D] text-xs font-extrabold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" /> {copied ? "Result Copied!" : "Share Battle Result"}
          </button>
          <button onClick={() => setStage("setup")} className="bg-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-xl">
            Play Rematch
          </button>
        </div>
      </div>
    );
  }

  const activePlayer = stage === "p1" ? p1Name : p2Name;
  const q = battleQs[qIdx];
  return (
    <div className="bg-white border-2 border-[#0B1B3D] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between text-xs font-extrabold">
        <span className="bg-[#E60000] text-white px-3 py-1 rounded-full">{activePlayer}&apos;s Turn • Q{qIdx + 1}/10</span>
        <span className="text-[#0B1B3D] inline-flex items-center gap-1 font-mono"><Clock className="w-4 h-4 text-[#E60000]" /> {timer}s</span>
      </div>
      <p className="text-sm sm:text-base font-extrabold text-[#0B1B3D]">{q.questionEn}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(["A", "B", "C", "D"] as const).map((opt) => (
          <button key={opt} onClick={() => handleAnswer(opt)} className="text-left p-3 rounded-xl border border-slate-300 hover:border-[#E60000] hover:bg-red-50/40 text-xs sm:text-sm font-bold transition">
            <strong>{opt}.</strong> {q.optionsEn[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

// 13. SHAREABLE SCORE CARD GENERATOR (Canvas PNG Download with ECA Branding)
export function ScoreCardGeneratorTool() {
  const [name, setName] = useState("Aspirant Name");
  const [exam, setExam] = useState("UPSC CSE Prelims Mock Test");
  const [score, setScore] = useState("118 / 200");
  const [accuracy, setAccuracy] = useState("84%");
  const [rank, setRank] = useState("AIR 142");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("exam")) setExam(params.get("exam")!);
      if (params.get("score")) setScore(params.get("score")!);
      if (params.get("rank")) setRank(params.get("rank")!);
      if (params.get("accuracy")) setAccuracy(`${params.get("accuracy")}%`);
    }
  }, []);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 520;
    // Navy gradient background
    const grad = ctx.createLinearGradient(0, 0, 900, 520);
    grad.addColorStop(0, "#08132B");
    grad.addColorStop(1, "#162F66");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 520);

    // Top red accent bar
    ctx.fillStyle = "#E60000";
    ctx.fillRect(0, 0, 900, 14);

    // Brand Header
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px Arial";
    ctx.fillText("ETERNAL CIVIL ACADEMY", 50, 75);
    ctx.fillStyle = "#FACC15";
    ctx.font = "italic 18px Arial";
    ctx.fillText("Your Success, Our Commitment", 50, 105);

    // Exam Badge
    ctx.fillStyle = "#E60000";
    ctx.fillRect(50, 130, 420, 36);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 17px Arial";
    ctx.fillText(exam.toUpperCase().slice(0, 42), 64, 154);

    // Candidate Name
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "bold 16px Arial";
    ctx.fillText("CANDIDATE SCORE CARD", 50, 210);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px Arial";
    ctx.fillText(name.slice(0, 30), 50, 258);

    // 3 Metric Boxes
    const boxes = [
      { label: "SCORE", val: score, x: 50 },
      { label: "ACCURACY", val: accuracy, x: 320 },
      { label: "ALL INDIA RANK", val: rank, x: 590 },
    ];
    boxes.forEach((b) => {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(b.x, 300, 250, 120);
      ctx.fillStyle = "#FACC15";
      ctx.font = "bold 15px Arial";
      ctx.fillText(b.label, b.x + 20, 338);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 34px Arial";
      ctx.fillText(b.val.slice(0, 14), b.x + 20, 392);
    });

    ctx.fillStyle = "#94A3B8";
    ctx.font = "bold 15px Arial";
    ctx.fillText("Verified Performance Card • eternalcivilacademy.com • @EternalCivilAcademy", 50, 480);

    const link = document.createElement("a");
    link.download = `ECA_ScoreCard_${name.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
        <input type="text" value={exam} onChange={(e) => setExam(e.target.value)} placeholder="Exam Name" className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
        <input type="text" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
        <input type="text" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} placeholder="Accuracy" className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
        <input type="text" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Rank" className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" />
      </div>

      {/* Live Visual Preview */}
      <div className="bg-gradient-to-r from-[#08132B] to-[#162F66] text-white rounded-2xl p-6 border-t-4 border-[#E60000] shadow-lg">
        <div className="text-lg sm:text-2xl font-extrabold">ETERNAL CIVIL ACADEMY</div>
        <div className="text-xs italic text-yellow-300">Your Success, Our Commitment</div>
        <span className="inline-block mt-3 bg-[#E60000] text-white text-[11px] font-extrabold px-3 py-1 rounded uppercase">{exam}</span>
        <div className="text-2xl sm:text-3xl font-extrabold mt-3">{name}</div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-[10px] font-bold text-yellow-300">SCORE</div>
            <div className="text-lg sm:text-xl font-extrabold mt-0.5">{score}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-[10px] font-bold text-yellow-300">ACCURACY</div>
            <div className="text-lg sm:text-xl font-extrabold mt-0.5">{accuracy}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-[10px] font-bold text-yellow-300">RANK</div>
            <div className="text-lg sm:text-xl font-extrabold mt-0.5">{rank}</div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <button onClick={downloadPng} className="inline-flex items-center gap-2 bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl shadow transition">
        <Download className="w-4 h-4" /> Download Branded Score Card (PNG)
      </button>
    </div>
  );
}

// 14. DAILY CURRENT AFFAIRS QUIZ (Bilingual EN / HI)
export function DailyCurrentAffairsQuizTool() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [finished, setFinished] = useState(false);

  const q = CBT_QUESTIONS[idx];
  const score = CBT_QUESTIONS.filter((item) => picked[item.id] === item.correct).length;
  const accuracy = Math.round((score / CBT_QUESTIONS.length) * 100);

  if (finished) {
    return (
      <div className="bg-white border-2 border-[#0B1B3D] rounded-2xl p-6 text-center space-y-4">
        <Award className="w-10 h-10 text-[#E60000] mx-auto" />
        <h3 className="text-2xl font-extrabold text-[#0B1B3D]">
          Daily Current Affairs Quiz Score: <span className="text-[#E60000]">{score} / {CBT_QUESTIONS.length}</span>
        </h3>
        <p className="text-xs font-bold text-slate-600">Accuracy: {accuracy}%</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/student-hub/score-card-generator?exam=${encodeURIComponent("Daily Current Affairs Quiz")}&score=${encodeURIComponent(`${score}/${CBT_QUESTIONS.length}`)}&accuracy=${accuracy}&rank=Top%2010%25`}
            className="bg-[#E60000] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl"
          >
            Generate Score Card →
          </Link>
          <button onClick={() => { setPicked({}); setIdx(0); setFinished(false); }} className="bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2.5 rounded-xl">
            Re-Attempt Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="bg-red-50 text-[#E60000] text-xs font-extrabold px-3 py-1 rounded-full">
          Question {idx + 1} / {CBT_QUESTIONS.length} • {q.subject}
        </span>
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="inline-flex items-center gap-1 bg-slate-100 text-[#0B1B3D] text-xs font-extrabold px-3 py-1.5 rounded-xl">
          <Languages className="w-3.5 h-3.5" /> {lang === "en" ? "हिन्दी में पढ़ें" : "Read in English"}
        </button>
      </div>

      <p className="text-base font-extrabold text-[#0B1B3D]">{lang === "hi" ? q.questionHi : q.questionEn}</p>
      <div className="space-y-2">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const userPick = picked[q.id];
          const isRight = q.correct === opt;
          let cls = "border-slate-200 hover:border-slate-400";
          if (userPick) {
            if (isRight) cls = "border-emerald-600 bg-emerald-50 font-bold text-emerald-900";
            else if (userPick === opt) cls = "border-[#E60000] bg-red-50 font-bold text-red-900";
          }
          return (
            <button key={opt} onClick={() => setPicked((p) => ({ ...p, [q.id]: opt }))} className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition ${cls}`}>
              <strong>{opt}.</strong> {lang === "hi" ? q.optionsHi[opt] : q.optionsEn[opt]}
            </button>
          );
        })}
      </div>

      {picked[q.id] && (
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700">
          <strong>Explanation:</strong> {lang === "hi" ? q.explanationHi : q.explanationEn}
        </div>
      )}

      <div className="flex justify-end">
        {idx < CBT_QUESTIONS.length - 1 ? (
          <button onClick={() => setIdx(idx + 1)} className="bg-[#0B1B3D] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
            Next Question →
          </button>
        ) : (
          <button onClick={() => setFinished(true)} className="bg-[#E60000] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl">
            Finish & View Score →
          </button>
        )}
      </div>
    </div>
  );
}
