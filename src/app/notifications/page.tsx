"use client";

import React, { useState, useEffect } from "react";
import { COMMISSIONS_LIST, OFFICIAL_NOTIFICATIONS } from "@/lib/siteData";
import { loadNoCodeCms, DynamicNotificationItem } from "@/lib/noCodeCmsStore";
import { ExternalLink } from "lucide-react";

export default function NotificationsPage() {
  const [comm, setComm] = useState("ALL");
  const [commissions, setCommissions] = useState<string[]>(COMMISSIONS_LIST);
  const [notifications, setNotifications] = useState<DynamicNotificationItem[]>(OFFICIAL_NOTIFICATIONS);

  useEffect(() => {
    const sync = () => {
      const cms = loadNoCodeCms();
      if (cms.commissions.length > 0) setCommissions(cms.commissions);
      setNotifications(cms.notifications);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const list =
    comm === "ALL"
      ? notifications
      : notifications.filter((n) => n.commission === comm);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mb-5">
        Notifications
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setComm("ALL")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
            comm === "ALL" ? "bg-[#E60000] text-white" : "bg-white border border-slate-200"
          }`}
        >
          All
        </button>
        {commissions.map((c) => (
          <button
            key={c}
            onClick={() => setComm(c)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
              comm === c ? "bg-[#0B1B3D] text-white" : "bg-white border border-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
        {list.map((item) => (
          <a
            key={item.id}
            href={item.pdfUrl}
            className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
          >
            <div>
              <span className="bg-blue-50 text-[#0B1B3D] text-xs font-extrabold px-2.5 py-0.5 rounded mr-2">
                {item.commission}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{item.title}</h2>
            </div>
            <ExternalLink className="w-4 h-4 text-[#E60000] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
