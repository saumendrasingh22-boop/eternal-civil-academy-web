"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, X, Sparkles } from "lucide-react";
import { loadNoCodeCms, DEFAULT_NOCODE_CMS, NoCodeCmsState } from "@/lib/noCodeCmsStore";

export default function AnnouncementAndPopup() {
  const [cms, setCms] = useState<NoCodeCmsState>(DEFAULT_NOCODE_CMS);
  const [popupDismissed, setPopupDismissed] = useState(false);

  useEffect(() => {
    const sync = () => setCms(loadNoCodeCms());
    sync();
    if (typeof window !== "undefined" && window.sessionStorage.getItem("eca_popup_closed") === "1") {
      setPopupDismissed(true);
    }
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const closePopup = () => {
    setPopupDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("eca_popup_closed", "1");
    }
  };

  const ticker = cms.announcementTicker;
  const popup = cms.popupBanner;

  return (
    <>
      {/* Breaking Announcement Ticker Bar */}
      {ticker.enabled && ticker.text && (
        <div className="bg-[#E60000] text-white text-xs font-bold px-4 py-2 border-b border-red-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase shrink-0">
              <Megaphone className="w-3 h-3" /> {ticker.badge || "UPDATE"}
            </span>
            <span>{ticker.text}</span>
            {ticker.linkLabel && ticker.linkHref && (
              <Link
                href={ticker.linkHref}
                className="underline text-yellow-200 hover:text-white font-extrabold shrink-0"
              >
                {ticker.linkLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Optional Super-Admin Controlled Pop-up Banner */}
      {popup.enabled && !popupDismissed && popup.title && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative">
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/75 text-white p-1.5 rounded-full transition"
              aria-label="Close Announcement"
            >
              <X className="w-4 h-4" />
            </button>

            {popup.imageUrl && (
              <div className="h-40 bg-[#0B1B3D] relative overflow-hidden">
                <img
                  src={popup.imageUrl}
                  alt={popup.title}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08132B] via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 bg-[#E60000] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                  <Sparkles className="w-3 h-3" /> {popup.badge || "ANNOUNCEMENT"}
                </span>
              </div>
            )}

            <div className="p-6 text-center space-y-3">
              <h3 className="text-lg font-extrabold text-[#0B1B3D]">{popup.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {popup.description}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                {popup.ctaLabel && popup.ctaHref && (
                  <Link
                    href={popup.ctaHref}
                    onClick={closePopup}
                    className="bg-[#E60000] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl shadow transition"
                  >
                    {popup.ctaLabel} →
                  </Link>
                )}
                <button
                  onClick={closePopup}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
