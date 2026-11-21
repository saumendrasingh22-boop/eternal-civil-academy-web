"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, CheckCircle2, Send } from "lucide-react";
import { submitStudentInquiry } from "@/lib/noCodeCmsStore";

export default function StudentInquiryWidget() {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [contact, setContact] = useState("");
  const [targetExam, setTargetExam] = useState("UPSC CSE");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !contact.trim() || !message.trim()) return;
    submitStudentInquiry({
      studentName: studentName.trim(),
      contact: contact.trim(),
      targetExam,
      message: message.trim(),
    });
    setSubmitted(true);
    setStudentName("");
    setContact("");
    setMessage("");
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Very compact circular icon on mobile, pill with text on desktop */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[72px] lg:bottom-6 right-3 lg:right-5 z-40 inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D] hover:bg-[#E60000] text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2.5 rounded-full shadow-lg border border-white/25 transition"
        aria-label="Request Callback"
        title="Ask / Callback"
      >
        <MessageSquarePlus className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="hidden sm:inline text-xs font-extrabold">Ask / Callback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">
              Request a Callback / Inquiry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ETERNAL CIVIL ACADEMY — Ask about Batches, Test Series, or Mentorship
            </p>

            {submitted ? (
              <div className="my-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-extrabold text-emerald-800">
                  Inquiry Submitted!
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Our team will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile Number / Telegram Username"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                  required
                />
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold"
                >
                  <option>UPSC CSE</option>
                  <option>UPPSC PCS</option>
                  <option>BPSC</option>
                  <option>RPSC RAS</option>
                  <option>MPPSC</option>
                  <option>HPSC HCS</option>
                  <option>JPSC / UKPSC</option>
                  <option>Other Exam</option>
                </select>
                <textarea
                  rows={3}
                  placeholder="Write your question (Batch, Notes, Test Series, Evaluation)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#E60000] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-4 h-4" /> Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
