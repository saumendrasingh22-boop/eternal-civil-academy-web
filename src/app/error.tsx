"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-7 text-center">
        <AlertTriangle className="w-10 h-10 text-[#E60000] mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-[#0B1B3D]">Something went wrong</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          {error?.message || "A temporary network or server issue occurred. Please retry."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-[#0B1B3D] text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            <Home className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
