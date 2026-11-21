import React from "react";
import Link from "next/link";
import { Home, GraduationCap, Newspaper } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full p-8 text-center">
        <img
          src="/logo.jpg"
          alt="ETERNAL CIVIL ACADEMY"
          className="h-12 w-auto mx-auto rounded-lg border border-slate-200 mb-4"
        />
        <div className="text-5xl font-extrabold text-[#E60000]">404</div>
        <h1 className="text-xl font-extrabold text-[#0B1B3D] mt-2">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          The page you are looking for may have moved or been updated. Explore our latest UPSC & State PCS resources below.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-[#0B1B3D] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <Link
            href="/batches"
            className="inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <GraduationCap className="w-3.5 h-3.5" /> New Batches
          </Link>
          <Link
            href="/current-affairs"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <Newspaper className="w-3.5 h-3.5" /> Current Affairs
          </Link>
        </div>
      </div>
    </div>
  );
}
