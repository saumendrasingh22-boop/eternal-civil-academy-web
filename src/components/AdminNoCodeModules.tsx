"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu as MenuIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Megaphone,
  FilePlus2,
  TicketPercent,
  Globe2,
  BellPlus,
  HelpCircle,
  MessageSquare,
  KeyRound,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  loadNoCodeCms,
  saveNoCodeCms,
  DEFAULT_NOCODE_CMS,
  NoCodeCmsState,
  HomeSectionsConfig,
} from "@/lib/noCodeCmsStore";
import { setLocalAdminPassword } from "@/components/AdminAuthGate";
import AdminLiveTestsAndCountdowns from "@/components/AdminLiveTestsAndCountdowns";

interface AdminNoCodeModulesProps {
  isPermanentOwner: boolean;
  canManageSiteSettings: boolean;
  canManagePayments: boolean;
  canManageContent: boolean;
}

export default function AdminNoCodeModules({
  isPermanentOwner,
  canManageSiteSettings,
  canManagePayments,
  canManageContent,
}: AdminNoCodeModulesProps) {
  const [cms, setCms] = useState<NoCodeCmsState>(DEFAULT_NOCODE_CMS);
  const [savedNotice, setSavedNotice] = useState("");

  // 1. Add Custom Nav Tab
  const [newTabLabel, setNewTabLabel] = useState("");
  const [newTabHref, setNewTabHref] = useState("");

  // 3. Custom Page Builder
  const [pageTitle, setPageTitle] = useState("");
  const [pageSubtitle, setPageSubtitle] = useState("");
  const [pageCategory, setPageCategory] = useState("Institute");
  const [pageContent, setPageContent] = useState("");
  const [pagePdfUrl, setPagePdfUrl] = useState("");
  const [pageYoutubeUrl, setPageYoutubeUrl] = useState("");
  const [addPageToNav, setAddPageToNav] = useState(true);

  // 4. Coupon Form
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("15");

  // 5. Dynamic State / Commission / Notification / MCQ Forms
  const [newStateName, setNewStateName] = useState("");
  const [newCommName, setNewCommName] = useState("");
  const [notifComm, setNotifComm] = useState("UPSC");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifUrl, setNotifUrl] = useState("");
  const [mcqSubject, setMcqSubject] = useState("Polity");
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptA, setMcqOptA] = useState("");
  const [mcqOptB, setMcqOptB] = useState("");
  const [mcqOptC, setMcqOptC] = useState("");
  const [mcqOptD, setMcqOptD] = useState("");
  const [mcqCorrect, setMcqCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [mcqExp, setMcqExp] = useState("");

  // 7. Passcode Update
  const [newPasscode, setNewPasscode] = useState("");

  useEffect(() => {
    const sync = () => setCms(loadNoCodeCms());
    sync();
    window.addEventListener("eca-nocode-cms-updated", sync);
    return () => window.removeEventListener("eca-nocode-cms-updated", sync);
  }, []);

  const updateCms = (next: NoCodeCmsState, msg = "Saved Live!") => {
    setCms(next);
    saveNoCodeCms(next);
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(""), 2000);
  };

  const moveNav = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= cms.navItems.length) return;
    const copy = [...cms.navItems];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    updateCms({ ...cms, navItems: copy }, "Menu Order Updated!");
  };

  return (
    <div className="space-y-6 mt-6">
      {savedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {savedNotice}
        </div>
      )}

      <AdminLiveTestsAndCountdowns canManageContent={canManageContent} canManageSiteSettings={canManageSiteSettings} />

      {/* 1. NAVIGATION MENU ORDER & HOME LAYOUT MANAGER */}
      {canManageSiteSettings && (
        <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/15 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-1 flex items-center gap-2">
            <MenuIcon className="w-5 h-5 text-[#E60000]" /> Navigation Tabs Order & Home Layout (No-Code)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Reorder top menu tabs (↑/↓), hide/show tabs, add new custom menu links, or toggle Home Page sections ON/OFF.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-2">
              {cms.navItems.map((tab, idx) => (
                <div
                  key={tab.id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-extrabold bg-[#0B1B3D] text-white px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <input type="text" value={tab.label} onChange={(e) => { const copy = cms.navItems.map((t) => t.id === tab.id ? { ...t, label: e.target.value } : t); updateCms({ ...cms, navItems: copy }, "Tab Renamed!"); }} className="text-xs font-extrabold text-[#0B1B3D] bg-white border border-slate-200 rounded px-2 py-0.5 w-44" />
                    <span className="text-[11px] font-mono text-slate-400 truncate">{tab.href}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveNav(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                      title="Move Left / Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNav(idx, 1)}
                      disabled={idx === cms.navItems.length - 1}
                      className="p-1 rounded bg-white border border-slate-200 disabled:opacity-30"
                      title="Move Right / Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = cms.navItems.map((t) =>
                          t.id === tab.id ? { ...t, visible: !t.visible } : t
                        );
                        updateCms({ ...cms, navItems: copy });
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold border ${
                        tab.visible
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-200 border-slate-300 text-slate-600"
                      }`}
                    >
                      {tab.visible ? "Visible" : "Hidden"}
                    </button>
                    {tab.id.startsWith("nav-custom-") && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCms({
                            ...cms,
                            navItems: cms.navItems.filter((t) => t.id !== tab.id),
                          })
                        }
                        className="p-1 rounded bg-red-50 text-[#E60000]"
                        title="Remove Tab"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTabLabel.trim() || !newTabHref.trim()) return;
                  updateCms(
                    {
                      ...cms,
                      navItems: [
                        ...cms.navItems,
                        {
                          id: `nav-custom-${Date.now()}`,
                          label: newTabLabel.trim(),
                          href: newTabHref.trim(),
                          visible: true,
                        },
                      ],
                    },
                    "Custom Tab Added!"
                  );
                  setNewTabLabel("");
                  setNewTabHref("");
                }}
                className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <input
                  type="text"
                  placeholder="New Tab Name (e.g. About Us)"
                  value={newTabLabel}
                  onChange={(e) => setNewTabLabel(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Path or URL (e.g. /p/about-us)"
                  value={newTabHref}
                  onChange={(e) => setNewTabHref(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold rounded-xl py-2 flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Menu Tab
                </button>
              </form>
            </div>

            {/* Home Page Sections Visibility */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 h-fit">
              <div className="text-xs font-extrabold text-[#0B1B3D] uppercase">
                Home Page Sections ON/OFF
              </div>
              {(
                [
                  ["coverHero", "Cover Page Hero Carousel"],
                  ["quickTiles", "Quick Access Icon Grid"],
                  ["examCountdown", "Exam Countdown & Bookmarks Bar"],
                  ["newBatches", "New Batches Showcase"],
                  ["dashboardColumns", "MCQs + Current Affairs + Notifications"],
                  ["materialShowcase", "Material & Premium Notes Showcase"],
                ] as [keyof HomeSectionsConfig, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1B3D] cursor-pointer"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={cms.homeSections[key]}
                    onChange={(e) =>
                      updateCms({
                        ...cms,
                        homeSections: { ...cms.homeSections, [key]: e.target.checked },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. BREAKING ANNOUNCEMENT TICKER & OFFER POP-UP BANNER */}
      {canManageSiteSettings && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#E60000]" /> Breaking Announcement Ticker & Pop-up Banner
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticker */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <label className="flex items-center justify-between text-xs font-extrabold text-[#0B1B3D] cursor-pointer">
                <span>Top Announcement Ticker Bar</span>
                <input
                  type="checkbox"
                  checked={cms.announcementTicker.enabled}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      announcementTicker: { ...cms.announcementTicker, enabled: e.target.checked },
                    })
                  }
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Badge (NEW)"
                  value={cms.announcementTicker.badge}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      announcementTicker: { ...cms.announcementTicker, badge: e.target.value },
                    })
                  }
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Link Label"
                  value={cms.announcementTicker.linkLabel}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      announcementTicker: { ...cms.announcementTicker, linkLabel: e.target.value },
                    })
                  }
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="/batches"
                  value={cms.announcementTicker.linkHref}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      announcementTicker: { ...cms.announcementTicker, linkHref: e.target.value },
                    })
                  }
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Announcement message..."
                value={cms.announcementTicker.text}
                onChange={(e) =>
                  updateCms({
                    ...cms,
                    announcementTicker: { ...cms.announcementTicker, text: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
            </div>

            {/* Pop-up Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <label className="flex items-center justify-between text-xs font-extrabold text-[#0B1B3D] cursor-pointer">
                <span>Website Entry Pop-up Banner</span>
                <input
                  type="checkbox"
                  checked={cms.popupBanner.enabled}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      popupBanner: { ...cms.popupBanner, enabled: e.target.checked },
                    })
                  }
                />
              </label>
              <input
                type="text"
                placeholder="Pop-up Headline"
                value={cms.popupBanner.title}
                onChange={(e) =>
                  updateCms({
                    ...cms,
                    popupBanner: { ...cms.popupBanner, title: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <textarea
                rows={2}
                placeholder="Pop-up Description..."
                value={cms.popupBanner.description}
                onChange={(e) =>
                  updateCms({
                    ...cms,
                    popupBanner: { ...cms.popupBanner, description: e.target.value },
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Button Label"
                  value={cms.popupBanner.ctaLabel}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      popupBanner: { ...cms.popupBanner, ctaLabel: e.target.value },
                    })
                  }
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Button Link (/batches)"
                  value={cms.popupBanner.ctaHref}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      popupBanner: { ...cms.popupBanner, ctaHref: e.target.value },
                    })
                  }
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CUSTOM PAGE BUILDER (/p/[slug]) */}
      {canManageContent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-[#E60000]" /> Custom Page Builder (Create New Pages Without Coding)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pageTitle.trim() || !pageContent.trim()) return;
                const slug = pageTitle
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                const newPage = {
                  id: `page-${Date.now()}`,
                  slug: slug || `page-${Date.now()}`,
                  title: pageTitle.trim(),
                  subtitle: pageSubtitle.trim(),
                  category: pageCategory.trim() || "Information",
                  content: pageContent.trim(),
                  pdfUrl: pagePdfUrl.trim(),
                  youtubeUrl: pageYoutubeUrl.trim(),
                  active: true,
                  createdAt: new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                };
                const nextNav =
                  addPageToNav && canManageSiteSettings
                    ? [
                        ...cms.navItems,
                        {
                          id: `nav-custom-${Date.now()}`,
                          label: newPage.title.slice(0, 20),
                          href: `/p/${newPage.slug}`,
                          visible: true,
                        },
                      ]
                    : cms.navItems;
                updateCms(
                  { ...cms, customPages: [newPage, ...cms.customPages], navItems: nextNav },
                  `Page /p/${newPage.slug} Published!`
                );
                setPageTitle("");
                setPageSubtitle("");
                setPageContent("");
                setPagePdfUrl("");
                setPageYoutubeUrl("");
              }}
              className="lg:col-span-6 space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-4"
            >
              <input
                type="text"
                placeholder="Page Title (e.g. Interview Guidance)"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Subtitle (optional)"
                  value={pageSubtitle}
                  onChange={(e) => setPageSubtitle(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Mentorship)"
                  value={pageCategory}
                  onChange={(e) => setPageCategory(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
              <textarea
                rows={4}
                placeholder="Write full page content..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="url"
                  placeholder="Optional PDF Link (https://...)"
                  value={pagePdfUrl}
                  onChange={(e) => setPagePdfUrl(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
                <input
                  type="url"
                  placeholder="Optional YouTube URL (https://...)"
                  value={pageYoutubeUrl}
                  onChange={(e) => setPageYoutubeUrl(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
              {canManageSiteSettings && (
                <label className="flex items-center gap-2 text-xs font-bold text-[#0B1B3D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addPageToNav}
                    onChange={(e) => setAddPageToNav(e.target.checked)}
                  />
                  <span>Also add link to top Navigation Bar</span>
                </label>
              )}
              <button
                type="submit"
                className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold py-2.5 rounded-xl transition"
              >
                + Publish Custom Page
              </button>
            </form>

            <div className="lg:col-span-6 space-y-2">
              <div className="text-xs font-extrabold text-slate-500 uppercase">
                Published Custom Pages ({cms.customPages.length})
              </div>
              {cms.customPages.map((pg) => (
                <div
                  key={pg.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3D] truncate">
                      {pg.title}
                    </p>
                    <Link
                      href={`/p/${pg.slug}`}
                      className="text-[11px] font-mono text-[#E60000] hover:underline inline-flex items-center gap-1"
                    >
                      /p/{pg.slug} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateCms({
                        ...cms,
                        customPages: cms.customPages.filter((p) => p.id !== pg.id),
                      })
                    }
                    className="p-1.5 rounded-lg bg-red-50 text-[#E60000]"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC UPI ID & DISCOUNT COUPON CODES (STRICTLY SUPER ADMIN / PAYMENT PERMISSION) */}
      {canManagePayments && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/20 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
            <TicketPercent className="w-5 h-5 text-emerald-700" /> Dynamic UPI ID & Discount Coupons (Super Admin Payment Control)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active UPI ID (Auto-updates all QR codes)
                </label>
                <input
                  type="text"
                  value={cms.paymentConfig.upiId}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      paymentConfig: { ...cms.paymentConfig, upiId: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UPI Payee / Merchant Name
                </label>
                <input
                  type="text"
                  value={cms.paymentConfig.merchantName}
                  onChange={(e) =>
                    updateCms({
                      ...cms,
                      paymentConfig: { ...cms.paymentConfig, merchantName: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanCode = couponCode.trim().toUpperCase();
                  const pct = Math.min(90, Math.max(1, Number(couponPercent) || 10));
                  if (!cleanCode) return;
                  updateCms(
                    {
                      ...cms,
                      paymentConfig: {
                        ...cms.paymentConfig,
                        coupons: [
                          { id: `cpn-${Date.now()}`, code: cleanCode, discountPercent: pct, active: true },
                          ...cms.paymentConfig.coupons,
                        ],
                      },
                    },
                    `Coupon ${cleanCode} Added!`
                  );
                  setCouponCode("");
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. ECA20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase"
                  required
                />
                <input
                  type="number"
                  min={1}
                  max={90}
                  placeholder="Discount %"
                  value={couponPercent}
                  onChange={(e) => setCouponPercent(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  required
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl py-2"
                >
                  + Add Coupon
                </button>
              </form>

              <div className="space-y-2">
                {cms.paymentConfig.coupons.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold bg-[#0B1B3D] text-white px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="font-bold text-emerald-700">{c.discountPercent}% OFF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateCms({
                            ...cms,
                            paymentConfig: {
                              ...cms.paymentConfig,
                              coupons: cms.paymentConfig.coupons.map((x) =>
                                x.id === c.id ? { ...x, active: !x.active } : x
                              ),
                            },
                          })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {c.active ? "Active" : "Paused"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCms({
                            ...cms,
                            paymentConfig: {
                              ...cms.paymentConfig,
                              coupons: cms.paymentConfig.coupons.filter((x) => x.id !== c.id),
                            },
                          })
                        }
                        className="text-[#E60000] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DYNAMIC STATES, COMMISSIONS, NOTIFICATIONS & DAILY MCQS MANAGER */}
      {canManageContent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#E60000]" /> Dynamic States, Commissions, Notifications & Daily MCQs
          </h2>

          {/* States & Commissions Pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-extrabold text-[#0B1B3D]">
                State Special List ({cms.states.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cms.states.map((st) => (
                  <span
                    key={st}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg"
                  >
                    {st}
                    {cms.states.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCms({ ...cms, states: cms.states.filter((x) => x !== st) })
                        }
                        className="text-[#E60000] ml-1"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = newStateName.trim();
                  if (!val || cms.states.includes(val)) return;
                  updateCms({ ...cms, states: [...cms.states, val] }, `State "${val}" Added!`);
                  setNewStateName("");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Add State (e.g. Chhattisgarh)"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                />
                <button
                  type="submit"
                  className="bg-[#0B1B3D] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  + Add
                </button>
              </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-extrabold text-[#0B1B3D]">
                Commissions / Exams List ({cms.commissions.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cms.commissions.map((cm) => (
                  <span
                    key={cm}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg"
                  >
                    {cm}
                    {cms.commissions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCms({ ...cms, commissions: cms.commissions.filter((x) => x !== cm) })
                        }
                        className="text-[#E60000] ml-1"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = newCommName.trim().toUpperCase();
                  if (!val || cms.commissions.includes(val)) return;
                  updateCms(
                    { ...cms, commissions: [...cms.commissions, val] },
                    `Commission "${val}" Added!`
                  );
                  setNewCommName("");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Add Exam (e.g. UKPSC / CGPSC)"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                />
                <button
                  type="submit"
                  className="bg-[#0B1B3D] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  + Add
                </button>
              </form>
            </div>
          </div>

          {/* Add Notification & Add Daily MCQ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!notifTitle.trim()) return;
                updateCms(
                  {
                    ...cms,
                    notifications: [
                      {
                        id: `not-${Date.now()}`,
                        commission: notifComm,
                        title: notifTitle.trim(),
                        date: new Date().toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }),
                        pdfUrl: notifUrl.trim() || "#notification-pdf",
                      },
                      ...cms.notifications,
                    ],
                  },
                  "Notification Published!"
                );
                setNotifTitle("");
                setNotifUrl("");
              }}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5"
            >
              <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
                <BellPlus className="w-4 h-4 text-[#E60000]" /> Add Official Notification ({cms.notifications.length})
              </div>
              <select
                value={notifComm}
                onChange={(e) => setNotifComm(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
              >
                {cms.commissions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notification Title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                required
              />
              <input
                type="url"
                placeholder="PDF / Notice URL (https://...)"
                value={notifUrl}
                onChange={(e) => setNotifUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
              />
              <button
                type="submit"
                className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold py-2 rounded-xl"
              >
                + Publish Notification
              </button>
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!mcqQuestion.trim() || !mcqOptA.trim() || !mcqOptB.trim()) return;
                const nextMcq = {
                  id: Date.now(),
                  subject: mcqSubject,
                  questionEn: mcqQuestion.trim(),
                  questionHi: mcqQuestion.trim(),
                  optionsEn: { A: mcqOptA, B: mcqOptB, C: mcqOptC || "None", D: mcqOptD || "All" },
                  optionsHi: { A: mcqOptA, B: mcqOptB, C: mcqOptC || "None", D: mcqOptD || "All" },
                  correct: mcqCorrect,
                  explanationEn: mcqExp.trim() || "Official exam explanation.",
                  explanationHi: mcqExp.trim() || "Official exam explanation.",
                };
                updateCms(
                  { ...cms, dailyMcqs: [nextMcq, ...cms.dailyMcqs].slice(0, 10) },
                  "Daily MCQ Added!"
                );
                setMcqQuestion("");
                setMcqOptA("");
                setMcqOptB("");
                setMcqOptC("");
                setMcqOptD("");
                setMcqExp("");
              }}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2"
            >
              <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#E60000]" /> Add Home Daily Practice MCQ ({cms.dailyMcqs.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Subject (Polity)"
                  value={mcqSubject}
                  onChange={(e) => setMcqSubject(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                />
                <select
                  value={mcqCorrect}
                  onChange={(e) => setMcqCorrect(e.target.value as "A" | "B" | "C" | "D")}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white"
                >
                  <option value="A">Correct: A</option>
                  <option value="B">Correct: B</option>
                  <option value="C">Correct: C</option>
                  <option value="D">Correct: D</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Question text..."
                value={mcqQuestion}
                onChange={(e) => setMcqQuestion(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                required
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Option A"
                  value={mcqOptA}
                  onChange={(e) => setMcqOptA(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Option B"
                  value={mcqOptB}
                  onChange={(e) => setMcqOptB(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Option C"
                  value={mcqOptC}
                  onChange={(e) => setMcqOptC(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Option D"
                  value={mcqOptD}
                  onChange={(e) => setMcqOptD(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Short Explanation"
                value={mcqExp}
                onChange={(e) => setMcqExp(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
              />
              <button
                type="submit"
                className="w-full bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl"
              >
                + Add to Daily MCQs
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. STUDENT INQUIRY & CALLBACK INBOX */}
      {(canManageSiteSettings || canManageContent) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#E60000]" /> Student Inquiry & Callback Inbox ({cms.inquiries.length})
          </h2>
          <div className="space-y-2.5">
            {cms.inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-extrabold text-[#0B1B3D]">{inq.studentName}</span>
                    <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {inq.contact}
                    </span>
                    <span className="bg-blue-50 text-[#0B1B3D] font-bold px-2 py-0.5 rounded">
                      {inq.targetExam}
                    </span>
                    <span className="text-slate-400">{inq.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-700">{inq.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={(e) =>
                      updateCms({
                        ...cms,
                        inquiries: cms.inquiries.map((x) =>
                          x.id === inq.id
                            ? { ...x, status: e.target.value as "New" | "Contacted" | "Resolved" }
                            : x
                        ),
                      })
                    }
                    className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-white"
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Resolved</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      updateCms({
                        ...cms,
                        inquiries: cms.inquiries.filter((x) => x.id !== inq.id),
                      })
                    }
                    className="p-1.5 rounded-lg bg-red-50 text-[#E60000]"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUPER ADMIN PERMANENT OWNER: ADMIN LOGIN PASSCODE MANAGER */}
      {isPermanentOwner && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" /> Admin Login Security Passcode (Local / Pre-Supabase Mode)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update the local login passcode anytime (min. 6 characters). When Supabase Auth is enabled in Vercel, Supabase passwords take over automatically.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newPasscode.trim().length < 6) return;
              setLocalAdminPassword(newPasscode.trim());
              setNewPasscode("");
              setSavedNotice("Admin Login Passcode Updated!");
              setTimeout(() => setSavedNotice(""), 2200);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="password"
              minLength={6}
              placeholder="New Passcode (min 6 chars)"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
              required
            />
            <button
              type="submit"
              className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Update Passcode
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
