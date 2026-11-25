"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const DISMISS_KEY = "eca_ios_install_dismissed_v1";

export default function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const ua = navigator.userAgent || "";
      const isIos = /iPhone|iPad|iPod/i.test(ua);
      const nav = navigator as Navigator & { standalone?: boolean };
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true;
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";

      if (isIos && !isStandalone && !dismissed) {
        setVisible(true);
      }
    } catch {}
  }, []);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 lg:hidden print:hidden">
      <div className="bg-[#0B1B3D] text-white rounded-2xl shadow-xl border border-white/15 px-3.5 py-3 flex items-center gap-3">
        <img
          src="/icon-192.png?v=3"
          alt="ECA App"
          className="w-10 h-10 rounded-xl bg-white p-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold tracking-tight text-white">
            Install ECA App on iPhone
          </p>
          <p className="text-[11px] text-slate-200 mt-0.5 flex items-center gap-1 flex-wrap">
            <span>Tap</span>
            <Share className="w-3.5 h-3.5 text-[#FF4D4D] inline shrink-0" />
            <span>Share in Safari &rarr; <strong>Add to Home Screen</strong></span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close install tip"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
