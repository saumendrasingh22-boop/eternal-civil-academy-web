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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Join Us Social Links */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="ETERNAL CIVIL ACADEMY"
                className="h-12 w-auto rounded-lg border border-white/20 bg-white"
              />
              <div>
                <div className="text-lg font-extrabold text-white">
                  ETERNAL CIVIL ACADEMY
                </div>
                <p className="text-xs italic text-slate-300">
                  Your Success, Our Commitment
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-yellow-300 mb-2.5">
                Join Us
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSocials.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-[#E60000] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>{soc.platform}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link href="/current-affairs" className="hover:text-white">Daily Current Affairs</Link></li>
              <li><Link href="/test-series" className="hover:text-white">Test Series</Link></li>
              <li><Link href="/material" className="hover:text-white">Material</Link></li>
              <li><Link href="/pyq" className="hover:text-white">PYQ</Link></li>
              <li><Link href="/monthly-magazine" className="hover:text-white">Monthly Magazine</Link></li>
              <li><Link href="/schemes" className="hover:text-white">Schemes</Link></li>
            </ul>
          </div>

          {/* Contact Us & Mentorship */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Contact Us
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <a href={`mailto:${settings.contact.email}`} className="hover:text-white break-all">
                  {settings.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <a href={`tel:${settings.contact.mobile}`} className="hover:text-white">
                  {settings.contact.mobile}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WhatsApp: {settings.contact.whatsapp}</span>
              </li>
              <li className="pt-2">
                <Link href="/contact-us" className="text-yellow-300 hover:underline font-bold">
                  Contact Us →
                </Link>
              </li>
            </ul>
          </div>
        </div>

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
