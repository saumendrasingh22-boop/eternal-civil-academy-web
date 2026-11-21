import React from "react";

export default function GlobalLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
      <div className="h-36 bg-slate-200 rounded-2xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}
