"use client";

import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
    >
      <Smartphone className="w-3.5 h-3.5 text-yellow-300" />
      <span>ECA App</span>
    </button>
  );
}
