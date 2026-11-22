"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Menu, X, ShieldCheck, ChevronDown } from "lucide-react";
import PwaInstaller from "./PwaInstaller";
import GlobalSearchModal from "./GlobalSearchModal";
import { loadNoCodeCms, DEFAULT_NAV_ITEMS, NavTabItem } from "@/lib/noCodeCmsStore";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<NavTabItem[]>(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    const sync = () => {
      const items = loadNoCodeCms().navItems.filter((t) => t.visible);
      if (items.length > 0) setNavLinks(items);
    };
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* Tier 1: Primary Brand Identity Bar */}
      <div className="bg-[#0B1B3D] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 md:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <img
              src="/logo.jpg"
              alt="ETERNAL CIVIL ACADEMY"
              className="h-11 md:h-14 w-auto shrink-0 rounded-lg border border-white/20 object-contain bg-white"
            />
            <div>
              <div className="text-base sm:text-xl md:text-2xl font-extrabold tracking-wide text-white leading-tight whitespace-nowrap">
                ETERNAL CIVIL ACADEMY
              </div>
              <p className="text-[11px] sm:text-xs italic text-slate-300 mt-0.5 tracking-normal font-normal whitespace-nowrap">
                Your Success, Our Commitment
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5 w-full sm:w-auto border-t border-white/10 pt-2 sm:border-t-0 sm:pt-0 shrink-0"><GlobalSearchModal />
            <PwaInstaller />

            <Link
              href="/join-us"
              className="hidden md:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              <span>Join Us</span>
            </Link>

            <Link
              href="/contact-us"
              className="hidden md:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              <span>Contact Us</span>
            </Link>

            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>Admin</span>
            </Link>

            <a
              href="https://t.me/EternalCivilAcademy"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 bg-[#E60000] hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Desktop Keyword Mega Bar */}
      <nav className="hidden lg:block bg-white border-b border-slate-200 text-[#0B1B3D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11 text-xs font-bold tracking-tight overflow-x-auto">
          {navLinks.map((item) => (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={`px-2 py-2 rounded-md transition flex items-center gap-1 whitespace-nowrap ${
                item.highlight || item.href === "/batches"
                  ? "text-[#E60000] bg-red-50/70 hover:bg-red-100"
                  : "hover:bg-red-50 hover:text-[#E60000]"
              }`}
            >
              <span>{item.label}</span>
              {["Material", "PYQ", "State Special", "Syllabus"].includes(item.label) && (
                <ChevronDown className="w-3 h-3 opacity-60" />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#08132B] text-white px-4 py-4 space-y-1.5 border-t border-white/10 max-h-[80vh] overflow-y-auto">
          {navLinks.map((item) => (
            <Link
              key={item.id || item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-white/10 border-b border-white/5"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/join-us"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm font-bold text-white hover:bg-white/10 border-b border-white/5"
          >
            Join Us
          </Link>
          <Link
            href="/contact-us"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm font-bold text-white hover:bg-white/10 border-b border-white/5"
          >
            Contact Us
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm font-bold text-yellow-300 hover:bg-white/10"
          >
            Admin Panel
          </Link>
        </div>
      )}
    </header>
  );
}
