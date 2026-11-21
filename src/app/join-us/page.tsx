"use client";

import React, { useState, useEffect } from "react";
import { loadSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/siteSettingsStore";
import { ExternalLink, Share2 } from "lucide-react";

export default function JoinUsPage() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    setSettings(loadSiteSettings());
    const handler = () => setSettings(loadSiteSettings());
    window.addEventListener("eca-settings-updated", handler);
    return () => window.removeEventListener("eca-settings-updated", handler);
  }, []);

  const activeSocials = settings.socials.filter((s) => s.active && s.url);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Join Us
        </h1>
        <p className="text-xs sm:text-sm italic text-slate-600 mt-1">
          ETERNAL CIVIL ACADEMY — Official Channels
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeSocials.map((soc) => (
          <a
            key={soc.id}
            href={soc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#E60000] hover:shadow-md transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0B1B3D] group-hover:bg-[#E60000] text-white flex items-center justify-center transition">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0B1B3D]">{soc.platform}</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{soc.handle}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#E60000] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
