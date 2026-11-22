"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Mail, Phone, MessageCircle } from "lucide-react";
import { loadSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/siteSettingsStore";

export default function Footer() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    setSettings(loadSiteSettings());
    const handler = () => setSettings(loadSiteSettings());
    window.addEventListener("eca-settings-updated", handler);
    return () => window.removeEventListener("eca-settings-updated", handler);
  }, []);

  const activeSocials = settings.socials.filter((s) => s.active && s.url);

  return (
    <footer className="bg-[#0B1B3D] text-slate-300 border-t border-slate-800 mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8"><div><div className="flex items-center gap-2.5"><img src="/logo.jpg" alt="ETERNAL CIVIL ACADEMY" className="h-11 sm:h-12 w-auto shrink-0 rounded-lg border border-white/20 bg-white" /><div className="min-w-0"><div className="text-[15px] sm:text-lg font-extrabold text-white leading-tight whitespace-nowrap">ETERNAL CIVIL ACADEMY</div><p className="text-xs italic text-slate-300 leading-tight whitespace-nowrap">Your Success, Our Commitment</p></div></div><div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-3"><div className="text-[11px] font-extrabold text-yellow-300 mb-1">ETERNAL CIVIL ACADEMY</div><p className="text-xs text-slate-300 leading-relaxed">{(settings.about && settings.about.description) || "ETERNAL CIVIL ACADEMY is a dedicated UPSC & State PCS preparation platform."}</p></div><div className="mt-5"><div className="text-xs font-extrabold uppercase tracking-wider text-yellow-300 mb-2.5">Join Us</div><div className="flex flex-wrap gap-2">{activeSocials.map((soc)=>(<a key={soc.id} href={soc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-[#E60000] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"><Send className="w-3 h-3" /><span>{soc.platform}</span></a>))}</div></div></div><div><h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Resources</h4><ul className="space-y-2 text-xs font-semibold"><li><Link href="/current-affairs" className="hover:text-white">Daily Current Affairs</Link></li><li><Link href="/test-series" className="hover:text-white">Test Series</Link></li><li><Link href="/material" className="hover:text-white">Material</Link></li><li><Link href="/pyq" className="hover:text-white">PYQ</Link></li><li><Link href="/monthly-magazine" className="hover:text-white">Monthly Magazine</Link></li><li><Link href="/schemes" className="hover:text-white">Schemes</Link></li></ul></div><div><h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">About Us</h4><div className="space-y-2">{((settings.about && settings.about.team) || [{name:"Saum Yadav",role:"Founder & Director"},{name:"Team Member 2",role:"Academic Head"},{name:"Team Member 3",role:"Test & Evaluation Lead"}]).filter(t=>t.name.trim()||t.role.trim()).map((t,i)=>(<div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs"><span className="font-bold text-white">{t.name}</span>{t.role ? <span className="text-yellow-300"> — {t.role}</span> : null}</div>))}</div></div><div><h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Contact Us</h4><ul className="space-y-2 text-xs font-semibold"><li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-yellow-400 shrink-0" /><a href={"mailto:"+settings.contact.email} className="hover:text-white break-all">{settings.contact.email}</a></li>{(settings.contact.mobileContacts && settings.contact.mobileContacts.some(m=>m.number.trim()) ? settings.contact.mobileContacts.filter(m=>m.number.trim()) : [{label:"Primary Helpline",number:settings.contact.mobile}]).map((m,idx)=>(<li key={idx} className="flex items-start gap-2"><Phone className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" /><a href={"tel:"+m.number} className="hover:text-white leading-snug"><span>{m.number}</span>{m.label ? <span className="text-[11px] text-slate-400"> ({m.label})</span> : null}</a></li>))}<li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>WhatsApp: {settings.contact.whatsapp}</span></li><li className="pt-1"><Link href="/contact-us" className="text-yellow-300 hover:underline font-bold">Contact Us →</Link></li></ul></div></div>
        <div className="border-t border-slate-800 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 ETERNAL CIVIL ACADEMY</p>
            <span className="text-slate-600">•</span>
            <Link href="/legal/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal/refund-policy" className="hover:text-white">Refund Policy</Link>
          </div>
          <p className="mt-1 sm:mt-0 font-semibold text-slate-300">
            Saum Yadav & Team ECA
          </p>
        </div>
      </div>
    </footer>
  );
}
