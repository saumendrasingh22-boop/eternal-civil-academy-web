"use client";

import React, { useState, useEffect } from "react";
import { DAILY_MAINS_TOPICS } from "@/lib/siteData";
import UpiUnlockModal from "@/components/UpiUnlockModal";
import { getItemUnlockState } from "@/lib/paymentOrdersStore";
import {
  loadSubmissions,
  saveSubmissions,
  DEFAULT_SUBMISSIONS,
  AnswerCopySubmission,
} from "@/lib/answerEvaluationStore";
import { Lock, Upload, CheckCircle2, FileCheck, Download } from "lucide-react";

const EVAL_PLAN_ID = "plan-answer-evaluation-10";

export default function AnswerEvaluationPage() {
  const [refreshTick, setRefreshTick] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(
    DAILY_MAINS_TOPICS[0].question.slice(0, 55) + "..."
  );
  const [studentMessage, setStudentMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [submittedList, setSubmittedList] = useState<AnswerCopySubmission[]>(DEFAULT_SUBMISSIONS);

  useEffect(() => {
    setSubmittedList(loadSubmissions());
    const evalHandler = () => setSubmittedList(loadSubmissions());
    const upiHandler = () => setRefreshTick((t) => t + 1);
    window.addEventListener("eca-eval-updated", evalHandler);
    window.addEventListener("eca-upi-orders-updated", upiHandler);
    return () => {
      window.removeEventListener("eca-eval-updated", evalHandler);
      window.removeEventListener("eca-upi-orders-updated", upiHandler);
    };
  }, []);

  const unlockState = getItemUnlockState(EVAL_PLAN_ID);
  const isUnlocked = unlockState.status === "approved";

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;
    const newEntry: AnswerCopySubmission = {
      id: `SUB-${103 + submittedList.length}`,
      studentName: studentName.trim() || "Aspirant",
      studentContact: studentContact.trim() || "Verified Student",
      upiUtr: unlockState.utr || "VERIFIED-UPI",
      paymentVerified: true,
      topicTitle: selectedTopic,
      submittedFileName: fileName,
      studentNote: studentMessage.trim() || "Please evaluate my answer copy.",
      status: "Under Evaluation",
      evaluatorFeedback: "Assigned to ECA Evaluator",
      isLocked: false,
      submittedAt: "20 Nov 2026",
    };
    const updated = [newEntry, ...submittedList];
    saveSubmissions(updated);
    setSubmittedList(updated);
    setFileName("");
    setStudentMessage("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" data-tick={refreshTick}>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mb-6">
        Answer Evaluation
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0B1B3D] text-white px-5 py-3.5 rounded-2xl font-extrabold text-sm uppercase tracking-wider">
            Daily Mains Topics
          </div>

          {DAILY_MAINS_TOPICS.map((t, idx) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="bg-red-50 text-[#E60000] font-extrabold px-2.5 py-0.5 rounded">
                  {t.gsPaper}
                </span>
                <span className="text-slate-500 font-bold">{t.wordLimit} Words</span>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                Q{idx + 1}. {t.question}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#0B1B3D] flex items-center gap-2">
              {isUnlocked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Lock className="w-5 h-5 text-[#E60000]" />
              )}
              <span>Upload Copy</span>
            </h2>

            {!isUnlocked ? (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <p className="text-xs font-bold text-slate-600 mb-3">
                  Answer Evaluation • 10 Copies Plan
                </p>
                <UpiUnlockModal
                  itemId={EVAL_PLAN_ID}
                  itemType="answer_evaluation"
                  itemTitle="Answer Evaluation (10 Copies)"
                  priceInr={299}
                  unlockStatus={unlockState.status}
                  pendingUtr={unlockState.utr}
                  buttonLabel="Unlock Answer Evaluation"
                  onOrderSubmitted={() => setRefreshTick((t) => t + 1)}
                />
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile / Telegram"
                    value={studentContact}
                    onChange={(e) => setStudentContact(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {DAILY_MAINS_TOPICS.map((t, i) => (
                      <option key={t.id} value={`${t.gsPaper}: ${t.question.slice(0, 55)}...`}>
                        Q{i + 1} ({t.gsPaper}) — {t.question.slice(0, 55)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Answer Copy (PDF / Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Message / Note
                  </label>
                  <textarea
                    rows={2}
                    value={studentMessage}
                    onChange={(e) => setStudentMessage(e.target.value)}
                    placeholder="Write specific instructions for evaluator..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E60000] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Submit Copy
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0B1B3D] mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#E60000]" /> Evaluated Copy
            </h3>
            <div className="space-y-3">
              {submittedList.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#0B1B3D]">{sub.topicTitle}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        sub.status === "Evaluated"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  {sub.marksAwarded && (
                    <div className="text-[#E60000] font-extrabold mt-1">
                      Marks: {sub.marksAwarded}
                    </div>
                  )}
                  <p className="text-slate-600 mt-1">{sub.evaluatorFeedback}</p>
                  {sub.evaluatedFileName && (
                    <a
                      href="#download-evaluated-copy"
                      className="mt-2 inline-flex items-center gap-1.5 bg-[#0B1B3D] text-white font-bold px-3 py-1.5 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" /> {sub.evaluatedFileName}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
