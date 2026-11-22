"use client";

import React, { useState, useEffect } from "react";
import { loadSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/siteSettingsStore";
import { Mail, Phone, MessageCircle } from "lucide-react";

export default function ContactUsPage() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    setSettings(loadSiteSettings());
    const handler = () => setSettings(loadSiteSettings());
    window.addEventListener("eca-settings-updated", handler);
    return () => window.removeEventListener("eca-settings-updated", handler);
  }, []);

  const cleanWhatsapp = settings.contact.whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D]">
          Contact Us
        </h1>
        <p className="text-xs sm:text-sm italic text-slate-600 mt-1">
          ETERNAL CIVIL ACADEMY
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a
          href={`mailto:${settings.contact.email}`}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#0B1B3D] transition"
        >
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#E60000] flex items-center justify-center mb-3">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-xs font-extrabold uppercase text-slate-500">Email</div>
          <div className="text-sm font-bold text-[#0B1B3D] mt-1 break-all">
            {settings.contact.email}
          </div>
        </a>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"><div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0B1B3D] flex items-center justify-center mb-3"><Phone className="w-5 h-5" /></div><div className="text-xs font-extrabold uppercase text-slate-500 mb-2">Mobile (Select Contact)</div><div className="space-y-2">{(settings.contact.mobileContacts && settings.contact.mobileContacts.some(m=>m.number.trim()) ? settings.contact.mobileContacts.filter(m=>m.number.trim()) : [{ label: "Primary Helpline", number: settings.contact.mobile }]).map((m, idx) => (<a key={idx} href={"tel:"+m.number} className="block rounded-xl border border-slate-200 hover:border-[#0B1B3D] hover:bg-slate-50 px-3 py-2 transition"><div className="text-sm font-bold text-[#0B1B3D]">{m.number}</div>{m.label && <div className="text-[11px] font-semibold text-slate-600">— {m.label}</div>}</a>))}</div></div>

        <a
          href={`https://wa.me/${cleanWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-600 transition"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="text-xs font-extrabold uppercase text-slate-500">WhatsApp</div>
          <div className="text-sm font-bold text-[#0B1B3D] mt-1">
            {settings.contact.whatsapp}
          </div>
        </a>
      </div>
    </div>
  );
}
