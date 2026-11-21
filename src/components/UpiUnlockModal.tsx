"use client";

import React, { useState, useEffect } from "react";
import { Lock, CheckCircle2, Clock, Copy, Check, X, Smartphone, TicketPercent } from "lucide-react";
import { submitUpiOrder } from "@/lib/paymentOrdersStore";
import { loadNoCodeCms, DEFAULT_NOCODE_CMS, PaymentConfig } from "@/lib/noCodeCmsStore";

interface UpiUnlockModalProps {
  itemId: string;
  itemType: "premium_notes" | "test_series" | "answer_evaluation" | "batch";
  itemTitle: string;
  priceInr: number;
  unlockStatus?: "locked" | "pending" | "approved" | "rejected";
  pendingUtr?: string;
  onOrderSubmitted?: () => void;
  buttonLabel?: string;
}

export default function UpiUnlockModal({
  itemId,
  itemType,
  itemTitle,
  priceInr,
  unlockStatus = "locked",
  pendingUtr,
  onOrderSubmitted,
  buttonLabel = "Unlock via UPI",
}: UpiUnlockModalProps) {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [contact, setContact] = useState("");
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Super-Admin UPI ID & Discount Coupon Support
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_NOCODE_CMS.paymentConfig);
  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(
    null
  );
  const [couponMsg, setCouponMsg] = useState("");

  useEffect(() => {
    const sync = () => setPaymentConfig(loadNoCodeCms().paymentConfig);
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const finalPrice = appliedDiscount
    ? Math.max(1, Math.round(priceInr - (priceInr * appliedDiscount.percent) / 100))
    : priceInr;

  const upiId = paymentConfig.upiId || process.env.NEXT_PUBLIC_UPI_ID || "eternalcivilacademy@upi";
  const merchantName = paymentConfig.merchantName || "ETERNAL CIVIL ACADEMY";
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${finalPrice}&cu=INR&tn=${encodeURIComponent(itemTitle.slice(0, 40))}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  const handleApplyCoupon = () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    const match = paymentConfig.coupons.find(
      (c) => c.active && c.code.toUpperCase() === clean
    );
    if (match) {
      setAppliedDiscount({ code: match.code, percent: match.discountPercent });
      setCouponMsg(`Coupon ${match.code} applied (${match.discountPercent}% OFF)!`);
    } else {
      setAppliedDiscount(null);
      setCouponMsg("Invalid or expired coupon code.");
    }
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();
    if (!studentName.trim() || !contact.trim()) {
      setError("Enter your Full Name and Mobile / Telegram.");
      return;
    }
    if (!/^\d{12}$/.test(cleanUtr)) {
      setError("Enter a valid 12-digit numeric UPI UTR / Reference Number.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await fetch("/api/payment-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "direct_upi",
          itemId,
          itemType,
          itemTitle: appliedDiscount ? `${itemTitle} [Coupon: ${appliedDiscount.code}]` : itemTitle,
          priceInr: finalPrice,
          studentName: studentName.trim(),
          studentContact: contact.trim(),
          utrNumber: cleanUtr,
        }),
      }).catch(() => {});

      submitUpiOrder({
        itemId,
        itemType,
        itemTitle: appliedDiscount ? `${itemTitle} [${appliedDiscount.code}]` : itemTitle,
        priceInr: finalPrice,
        studentName: studentName.trim(),
        studentContact: contact.trim(),
        utrNumber: cleanUtr,
      });

      setOpen(false);
      setUtr("");
      if (onOrderSubmitted) onOrderSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  if (unlockStatus === "pending") {
    return (
      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold px-3.5 py-2 rounded-xl">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pending Super Admin Approval (UTR: {pendingUtr?.slice(-4)})</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>
          {unlockStatus === "rejected" ? "Retry UPI Payment" : buttonLabel} (₹{priceInr})
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-100 pb-3">
              <span className="inline-block bg-red-50 text-[#E60000] text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                Verified UPI Payment
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D] mt-2">{itemTitle}</h3>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#E60000]">₹{finalPrice}</span>
                {appliedDiscount && (
                  <span className="text-sm text-slate-400 line-through font-bold">₹{priceInr}</span>
                )}
              </div>
            </div>

            {/* Optional Discount Coupon Input */}
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Have a Coupon Code? (e.g. ECA10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                >
                  <TicketPercent className="w-3.5 h-3.5" /> Apply
                </button>
              </div>
              {couponMsg && (
                <p
                  className={`text-[11px] font-bold mt-1.5 ${
                    appliedDiscount ? "text-emerald-700" : "text-[#E60000]"
                  }`}
                >
                  {couponMsg}
                </p>
              )}
            </div>

            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="bg-white p-2 rounded-xl border-2 border-[#0B1B3D] shadow-xs">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR ₹${finalPrice}`}
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-[#0B1B3D] select-all">{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="text-slate-500 hover:text-[#E60000]"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <a
                href={upiIntentUri}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D] hover:text-[#E60000] underline"
              >
                <Smartphone className="w-3.5 h-3.5" /> Pay directly via UPI App (GPay / PhonePe / Paytm)
              </a>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#0B1B3D]"
                required
              />
              <input
                type="text"
                placeholder="Mobile / Telegram Username"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#0B1B3D]"
                required
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                placeholder="12-Digit UPI UTR / Reference Number"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#0B1B3D]"
                required
              />
              {error && <p className="text-xs text-[#E60000] font-semibold">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>{submitting ? "Submitting UTR..." : "Submit UTR for Verification"}</span>
              </button>
              <p className="text-[11px] text-center text-slate-500">
                Access unlocks permanently once UTR is verified by Super Admin.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
