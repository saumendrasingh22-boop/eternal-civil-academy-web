"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, Newspaper, FileCheck2, BookOpen } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/batches", label: "Batches", icon: GraduationCap },
    { href: "/test-series", label: "Test Series", icon: FileCheck2 },
    { href: "/current-affairs", label: "Current Affairs", icon: Newspaper },
    { href: "/material", label: "Material", icon: BookOpen },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_14px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-5 h-15">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 text-[10px] font-bold transition ${
                active ? "text-[#E60000]" : "text-slate-600 hover:text-[#0B1B3D]"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="truncate max-w-[68px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
