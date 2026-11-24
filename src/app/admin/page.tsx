"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Users,
  BarChart3,
  RefreshCw,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Share2,
  Phone,
  PenTool,
  Download,
  IndianRupee,
  Link2,
  GraduationCap,
  LayoutTemplate,
  ArrowUp,
  ArrowDown,
  Pin,
  Send,
  Sliders,
  Crown,
  LogOut,
} from "lucide-react";
import { PREMIUM_BOOK_COVERS, STRUCTURED_CURRENT_AFFAIRS } from "@/lib/siteData";
import {
  loadSiteSettings,
  saveSiteSettings,
  DEFAULT_SITE_SETTINGS,
  SiteContactAndSocialSettings,
} from "@/lib/siteSettingsStore";
import {
  loadSubmissions,
  saveSubmissions,
  DEFAULT_SUBMISSIONS,
  AnswerCopySubmission,
} from "@/lib/answerEvaluationStore";
import {
  loadUpiOrders,
  saveUpiOrders,
  DEFAULT_UPI_ORDERS,
  UpiPaymentOrder,
} from "@/lib/paymentOrdersStore";
import { loadBatches, saveBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";
import {
  loadCoverSlides,
  saveCoverSlides,
  DEFAULT_COVER_SLIDES,
  CoverSlideItem,
} from "@/lib/coverPageStore";
import {
  loadAdminAccounts,
  addRegularAdmin,
  removeAdminSafely,
  updateAdminPermissionSafely,
  setAllAdminPermissionsSafely,
  hasPermission,
  DEFAULT_ADMIN_ACCOUNTS,
  PERMISSION_DEFINITIONS,
  AdminUserAccount,
  AdminPermissions,
} from "@/lib/adminAccessStore";
import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
import AdminAuthGate, { clearAdminSession } from "@/components/AdminAuthGate";
import AdminNoCodeModules from "@/components/AdminNoCodeModules";
import AdminMasterSyncBar from "@/components/AdminMasterSyncBar";
import AdminUploadChooser from "@/components/AdminUploadChooser";
import { syncCmsKeyToCloud } from "@/lib/adminTokenHelper";
import AdminAutoSyncMonitor from "@/components/AdminAutoSyncMonitor";
import AdminSuperCrudPanel from "@/components/AdminSuperCrudPanel";

const COVER_OPTIONS = [
  "/covers/indian-polity.jpg",
  "/covers/modern-history.jpg",
  "/covers/indian-economy.jpg",
  "/covers/indian-geography.jpg",
  "/covers/ancient-history.jpg",
  "/covers/world-geography.jpg",
  "/covers/environment.jpg",
  "/covers/important-articles.jpg",
];

export default function AdminDashboardPage() {
  // RBAC Admin Accounts & Active View Switcher
  const [adminAccounts, setAdminAccounts] = useState<AdminUserAccount[]>(DEFAULT_ADMIN_ACCOUNTS);
  const [authenticatedAdminId, setAuthenticatedAdminId] = useState<string | null>(null);
  const [activeAdminId, setActiveAdminId] = useState<string>("super_admin");
  const [expandedAdminId, setExpandedAdminId] = useState<string | null>("admin_1");

  const activeAccount =
    adminAccounts.find((a) => a.id === activeAdminId) || adminAccounts[0];
  const loggedInAccount = adminAccounts.find((a) => a.id === authenticatedAdminId);
  const isLoggedInSuperAdmin = Boolean(loggedInAccount?.isPermanentOwner || loggedInAccount?.role === "super_admin");
  const isPermanentOwner = activeAccount.isPermanentOwner || activeAccount.role === "super_admin";

  // Effective granular permission flags
  const canManageBatches = hasPermission(activeAccount, "manageBatches");
  const canManageCoverPage = hasPermission(activeAccount, "manageCoverPage");
  const canManageContent = hasPermission(activeAccount, "manageContent");
  const canManageAnswerEval = hasPermission(activeAccount, "manageAnswerEval");
  const canManagePayments = hasPermission(activeAccount, "managePayments");
  const canManageAutomation = hasPermission(activeAccount, "manageAutomation");
  const canManageTelegram = hasPermission(activeAccount, "manageTelegram");
  const canViewAnalytics = hasPermission(activeAccount, "viewAnalytics");
  const canManageSiteSettings = hasPermission(activeAccount, "manageSiteSettings");
  const canManageAdmins = hasPermission(activeAccount, "manageAdmins");
  const canLockContent = hasPermission(activeAccount, "lockContent");

  // Batches State
  const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);
  const [batchTitle, setBatchTitle] = useState("");
  const [batchExam, setBatchExam] = useState("UPSC");
  const [batchType, setBatchType] = useState<string>("Foundation");
  const [batchStartDate, setBatchStartDate] = useState("01 Dec 2026");
  const [batchDuration, setBatchDuration] = useState("12 Months");
  const [batchMedium, setBatchMedium] = useState<BatchItem["medium"]>("Bilingual (English & Hindi)");
  const [batchFaculty, setBatchFaculty] = useState("Saum Yadav & Team ECA");
  const [batchPrice, setBatchPrice] = useState("1499");
  const [batchMrp, setBatchMrp] = useState("2999");
  const [batchStatus, setBatchStatus] = useState<string>("Admissions Open");
  const [batchCover, setBatchCover] = useState("/covers/indian-polity.jpg");
  const [batchHighlightsText, setBatchHighlightsText] = useState(
    "Live + Recorded HD Classes\nBilingual Notes (English & Hindi PDFs)\nFull-Length CBT Mock Tests Included"
  );
  const [batchPinToCover, setBatchPinToCover] = useState(true);

  // Cover Page Showcase State
  const [coverSlides, setCoverSlides] = useState<CoverSlideItem[]>(DEFAULT_COVER_SLIDES);
  const [pinSourceType, setPinSourceType] = useState<
    "batch" | "notes" | "current_affairs" | "test_series" | "custom"
  >("batch");
  const [pinTargetId, setPinTargetId] = useState<string>(DEFAULT_BATCHES[0].id);
  const [customBadge, setCustomBadge] = useState("FEATURED ANNOUNCEMENT");
  const [customTitle, setCustomTitle] = useState("");
  const [customCtaLabel, setCustomCtaLabel] = useState("Explore Now");
  const [customCtaHref, setCustomCtaHref] = useState("/batches");
  const [customCoverImg, setCustomCoverImg] = useState("/covers/important-articles.jpg");
  const [coverToast, setCoverToast] = useState("");
  const [cloudSyncMsg, setCloudSyncMsg] = useState("");

  // Content Items with Ownership & Master Lock
  const [items, setItems] = useState(
    PREMIUM_BOOK_COVERS.map((b) => ({
      id: b.id,
      title: b.title,
      section: b.isPaid ? `Premium Notes (₹${b.priceInr})` : "Material",
      storageType: "Cloud / Direct",
      uploadedBy: b.uploadedBy,
      isLocked: b.isLocked,
    }))
  );

  // Hybrid Unlimited Storage Content Upload Form
  const [newTitle, setNewTitle] = useState("");
  const [newSection, setNewSection] = useState("Daily Current Affairs");
  const [newPrice, setNewPrice] = useState("0");
  const [englishPdfLink, setEnglishPdfLink] = useState("");
  const [hindiPdfLink, setHindiPdfLink] = useState("");

  // UPI Payment Orders Queue (Super Admin Exclusive unless delegated)
  const [upiOrders, setUpiOrders] = useState<UpiPaymentOrder[]>(DEFAULT_UPI_ORDERS);

  // Answer Evaluation Queue
  const [submissions, setSubmissions] = useState<AnswerCopySubmission[]>(DEFAULT_SUBMISSIONS);
  const [evalMarks, setEvalMarks] = useState<Record<string, string>>({});
  const [evalRemarks, setEvalRemarks] = useState<Record<string, string>>({});
  const [evalFile, setEvalFile] = useState<Record<string, string>>({});

  // New Admin Form
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  // Auto-Sync Engine Status
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMsg, setLastSyncMsg] = useState(
    "Active • 100% Free Unlimited Sync (PIB, Akashvani, DD News, Prasar Bharati + 7 States Multi-Source RSS)"
  );

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteContactAndSocialSettings>(DEFAULT_SITE_SETTINGS);
  const [newPlatform, setNewPlatform] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [settingsSavedBanner, setSettingsSavedBanner] = useState(false);

  useEffect(() => {
    setAdminAccounts(loadAdminAccounts());
    setBatches(loadBatches());
    setCoverSlides(loadCoverSlides());
    setSiteSettings(loadSiteSettings());
    setSubmissions(loadSubmissions());
    setUpiOrders(loadUpiOrders());

    const upiHandler = () => setUpiOrders(loadUpiOrders());
    const batchHandler = () => setBatches(loadBatches());
    const coverHandler = () => setCoverSlides(loadCoverSlides());
    const adminHandler = () => setAdminAccounts(loadAdminAccounts());

    window.addEventListener("eca-upi-orders-updated", upiHandler);
    window.addEventListener("eca-batches-updated", batchHandler);
    window.addEventListener("eca-cover-slides-updated", coverHandler);
    window.addEventListener("eca-admins-updated", adminHandler);
    return () => {
      window.removeEventListener("eca-upi-orders-updated", upiHandler);
      window.removeEventListener("eca-batches-updated", batchHandler);
      window.removeEventListener("eca-cover-slides-updated", coverHandler);
      window.removeEventListener("eca-admins-updated", adminHandler);
    };
  }, []);

  const flashCoverToast = (msg: string) => {
    setCoverToast(msg);
    setTimeout(() => setCoverToast(""), 2800);
  };

  const handleSaveSiteSettings = (updated: SiteContactAndSocialSettings) => {
    if (!canManageSiteSettings) return;
    setSiteSettings(updated);
    saveSiteSettings(updated);
    setSettingsSavedBanner(true);
    setTimeout(() => setSettingsSavedBanner(false), 2000);
  };

  const handleUpdateOrderStatus = (id: string, status: "Approved" | "Rejected") => {
    if (!canManagePayments) return;
    const updated = upiOrders.map((o) => (o.id === id ? { ...o, status } : o));
    setUpiOrders(updated);
    saveUpiOrders(updated);
  };

  // Pin any Batch / Item directly to Cover Page Hero
  const pinSlideToCover = (slide: CoverSlideItem) => {
    if (!canManageCoverPage) return;
    const updated = [slide, ...coverSlides.filter((s) => s.id !== slide.id)];
    setCoverSlides(updated);
    saveCoverSlides(updated);
    flashCoverToast(`Pinned "${slide.title}" to Cover Page!`);
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBatches || !batchTitle.trim()) return;

    const slug =
      batchTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 65) + `-${Date.now().toString().slice(-4)}`;

    const priceNum = Math.max(0, Number(batchPrice) || 0);
    const mrpNum = Math.max(priceNum, Number(batchMrp) || priceNum);
    const parsedHighlights = batchHighlightsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const newBatch: BatchItem = {
      id: `batch-${Date.now()}`,
      slug,
      title: batchTitle.trim(),
      examTag: batchExam,
      batchType,
      startDate: batchStartDate || "Upcoming",
      duration: batchDuration || "6 Months",
      mode: "Live Online + Recorded HD Lectures",
      medium: batchMedium,
      faculty: batchFaculty || "Team ETERNAL CIVIL ACADEMY",
      highlights:
        parsedHighlights.length > 0
          ? parsedHighlights
          : ["Complete Syllabus Coverage", "Bilingual Notes", "CBT Test Series Included"],
      description: `${batchTitle.trim()} — structured ${batchExam} preparation programme by ETERNAL CIVIL ACADEMY.`,
      coverImage: batchCover,
      isPaid: priceNum > 0,
      priceInr: priceNum,
      mrpInr: mrpNum,
      status: batchStatus,
      syllabusPdfUrl: "#batch-syllabus",
      telegramGroupUrl: "https://t.me/EternalCivilAcademy",
      uploadedBy: activeAccount.id,
      isLocked: false,
      createdAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    const updatedBatches = [newBatch, ...batches];
    setBatches(updatedBatches);
    saveBatches(updatedBatches);

    if (batchPinToCover && canManageCoverPage) {
      pinSlideToCover({
        id: `slide-${newBatch.id}`,
        sourceType: "batch",
        sourceId: newBatch.id,
        badge: `NEW BATCH • ${newBatch.examTag} • ${newBatch.status.toUpperCase()}`,
        title: newBatch.title,
        tagline: "Your Success, Our Commitment",
        highlights: newBatch.highlights.slice(0, 4),
        ctaPrimary: { label: "View Batch Details", href: `/batches/${newBatch.slug}` },
        ctaSecondary: { label: "All Batches", href: "/batches" },
        books: [newBatch.coverImage, "/covers/important-articles.jpg", "/covers/modern-history.jpg"],
        active: true,
        isLocked: false,
        pinnedBy: activeAccount.id,
      });
    }

    setBatchTitle("");
  };

  const handlePinSelectedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCoverPage) return;

    if (pinSourceType === "batch") {
      const b = batches.find((x) => x.id === pinTargetId) || batches[0];
      if (!b) return;
      pinSlideToCover({
        id: `slide-${b.id}`,
        sourceType: "batch",
        sourceId: b.id,
        badge: `FEATURED BATCH • ${b.examTag}`,
        title: b.title,
        tagline: "Your Success, Our Commitment",
        highlights: b.highlights.slice(0, 4),
        ctaPrimary: { label: "Open Batch", href: `/batches/${b.slug}` },
        ctaSecondary: { label: "All Batches", href: "/batches" },
        books: [b.coverImage, "/covers/indian-polity.jpg", "/covers/modern-history.jpg"],
        active: true,
        isLocked: false,
        pinnedBy: activeAccount.id,
      });
      return;
    }

    if (pinSourceType === "notes") {
      const n = PREMIUM_BOOK_COVERS.find((x) => x.id === pinTargetId) || PREMIUM_BOOK_COVERS[0];
      pinSlideToCover({
        id: `slide-${n.id}`,
        sourceType: "notes",
        sourceId: n.id,
        badge: `FEATURED NOTES • ${n.subject.toUpperCase()}`,
        title: n.title,
        tagline: "Your Success, Our Commitment",
        highlights: [
          `${n.subject} Complete Coverage`,
          n.pages,
          n.isPaid ? `Premium Edition (₹${n.priceInr})` : "100% Free Download",
          "English & Hindi Dual PDF",
        ],
        ctaPrimary: { label: "Open Material", href: "/material" },
        ctaSecondary: { label: "Explore Batches", href: "/batches" },
        books: [n.coverImage, "/covers/important-articles.jpg", "/covers/indian-economy.jpg"],
        active: true,
        isLocked: false,
        pinnedBy: activeAccount.id,
      });
      return;
    }

    if (pinSourceType === "current_affairs") {
      const ca =
        STRUCTURED_CURRENT_AFFAIRS.find((x) => x.id === pinTargetId) ||
        STRUCTURED_CURRENT_AFFAIRS[0];
      pinSlideToCover({
        id: `slide-${ca.id}`,
        sourceType: "current_affairs",
        sourceId: ca.id,
        badge: `CURRENT AFFAIRS • ${ca.examRelevance}`,
        title: ca.title,
        tagline: "Your Success, Our Commitment",
        highlights: [
          "Why in News",
          "Detailed Structured Analysis",
          `${ca.prelimsFacts.length} Key Prelims Facts`,
          "Mains Perspective Included",
        ],
        ctaPrimary: { label: "Read Full Analysis", href: `/current-affairs/${ca.slug}` },
        ctaSecondary: { label: "All Current Affairs", href: "/current-affairs" },
        books: ["/covers/important-articles.jpg", "/covers/indian-polity.jpg", "/covers/environment.jpg"],
        active: true,
        isLocked: false,
        pinnedBy: activeAccount.id,
      });
      return;
    }

    if (pinSourceType === "test_series") {
      pinSlideToCover({
        id: `slide-ts-${Date.now()}`,
        sourceType: "test_series",
        badge: "LIVE TEST SERIES • CBT SIMULATOR",
        title: customTitle.trim() || "UPSC & STATE PCS FREE LIVE TEST SERIES",
        tagline: "Your Success, Our Commitment",
        highlights: [
          "Real Exam CBT Interface",
          "Bilingual (English & Hindi)",
          "Telegram Quiz Auto-Sync",
          "Mistakes Diagnosis PDF",
        ],
        ctaPrimary: { label: "Start Live Test", href: "/test-series" },
        ctaSecondary: { label: "See Mistakes", href: "/test-series/mistakes" },
        books: ["/covers/indian-economy.jpg", "/covers/indian-geography.jpg", "/covers/environment.jpg"],
        active: true,
        isLocked: false,
        pinnedBy: activeAccount.id,
      });
      return;
    }

    // Custom Cover Showcase Item
    if (!customTitle.trim()) return;
    pinSlideToCover({
      id: `slide-custom-${Date.now()}`,
      sourceType: "custom",
      badge: customBadge.trim() || "FEATURED ON ETERNAL CIVIL ACADEMY",
      title: customTitle.trim(),
      tagline: "Your Success, Our Commitment",
      highlights: ["Daily Current Affairs", "New Batches", "Free Live Test Series", "Bilingual Notes"],
      ctaPrimary: { label: customCtaLabel.trim() || "Explore Now", href: customCtaHref.trim() || "/" },
      ctaSecondary: { label: "Batches", href: "/batches" },
      books: [customCoverImg, "/covers/indian-polity.jpg", "/covers/modern-history.jpg"],
      active: true,
      isLocked: false,
      pinnedBy: activeAccount.id,
    });
    setCustomTitle("");
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    if (!canManageCoverPage) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= coverSlides.length) return;
    const copy = [...coverSlides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setCoverSlides(copy);
    saveCoverSlides(copy);
  };

  const toggleSlideActive = (id: string) => {
    if (!canManageCoverPage) return;
    const updated = coverSlides.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setCoverSlides(updated);
    saveCoverSlides(updated);
  };

  const toggleSlideLock = (id: string) => {
    if (!canLockContent) return;
    const updated = coverSlides.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s));
    setCoverSlides(updated);
    saveCoverSlides(updated);
  };

  const deleteCoverSlide = (slide: CoverSlideItem) => {
    if (!canManageCoverPage) return;
    if (slide.isLocked && !canLockContent) return;
    const remaining = coverSlides.filter((s) => s.id !== slide.id);
    if (remaining.length === 0) return;
    setCoverSlides(remaining);
    saveCoverSlides(remaining);
  };

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageContent || !newTitle.trim()) return;
    const isExternal = Boolean(englishPdfLink.trim() || hindiPdfLink.trim());
    setItems((prev) => [
      {
        id: `item-${Date.now()}`,
        title: newTitle,
        section: Number(newPrice) > 0 ? `${newSection} (₹${newPrice})` : newSection,
        storageType: isExternal ? "Unlimited Cloud Link" : "Direct Upload",
        uploadedBy: activeAccount.id,
        isLocked: false,
      },
      ...prev,
    ]);
    try {
      const rawC = window.localStorage.getItem("eca_custom_content_v1");
      const prevC = rawC ? JSON.parse(rawC) : [];
      const nextC = [{ id: "cnt-" + Date.now(), section: newSection, title: newTitle.trim(), priceInr: Number(newPrice) || 0, englishPdfUrl: englishPdfLink.trim(), hindiPdfUrl: hindiPdfLink.trim(), createdAt: new Date().toISOString().slice(0, 10) }, ...(Array.isArray(prevC) ? prevC : [])];
      window.localStorage.setItem("eca_custom_content_v1", JSON.stringify(nextC));
      window.dispatchEvent(new Event("eca-custom-content-updated"));
      syncCmsKeyToCloud("custom_content", nextC, 150);
    } catch {}
    setNewTitle("");
    setNewPrice("0");
    setEnglishPdfLink("");
    setHindiPdfLink("");
  };

  const toggleLock = (id: string) => {
    if (!canLockContent) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isLocked: !item.isLocked } : item))
    );
  };

  const handleDelete = (item: { id: string; uploadedBy: string; isLocked: boolean }) => {
    if (canLockContent) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      return;
    }
    if (item.uploadedBy === activeAccount.id && !item.isLocked) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleVerifyPayment = (id: string) => {
    if (!canManagePayments) return;
    const updated = submissions.map((s) =>
      s.id === id ? { ...s, paymentVerified: true, status: "Under Evaluation" as const } : s
    );
    setSubmissions(updated);
    saveSubmissions(updated);
  };

  const handleSendEvaluatedCopy = (id: string) => {
    if (!canManageAnswerEval) return;
    const updated = submissions.map((s) =>
      s.id === id
        ? {
            ...s,
            status: "Evaluated" as const,
            marksAwarded: evalMarks[id] || s.marksAwarded || "8.0 / 15",
            evaluatorFeedback:
              evalRemarks[id] || "Well-structured answer. Keep practicing conclusion points.",
            evaluatedFileName: evalFile[id] || `Evaluated_${s.submittedFileName}`,
          }
        : s
    );
    setSubmissions(updated);
    saveSubmissions(updated);
  };

  const triggerAutoSync = async () => {
    if (!canManageAutomation) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/auto-sync");
      const data = await res.json();
      setLastSyncMsg(
        `Synced (${new Date().toLocaleTimeString("en-IN")}) • ${
          data.pipelines?.length || 4
        } Pipelines Active (PIB, Akashvani, DD News, Prasar Bharati + 7 States)`
      );
    } catch {
      setLastSyncMsg(
        "Synced • National (PIB, Akashvani, DD News, Prasar Bharati) & 7 States Current Affairs Updated"
      );
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  return (
    <AdminAuthGate
      adminAccounts={adminAccounts}
      isAuthenticated={Boolean(authenticatedAdminId)}
      onAuthenticated={(acc) => {
        setAuthenticatedAdminId(acc.id);
        setActiveAdminId(acc.id);
      }}
    >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar with Active Account / Role Preview Switcher */}
      <div className="bg-[#0B1B3D] text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow">
        <div className="flex items-center gap-3">
          {isPermanentOwner ? (
            <Crown className="w-7 h-7 text-yellow-400" />
          ) : (
            <ShieldCheck className="w-7 h-7 text-sky-400" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold">
                {isPermanentOwner ? "Super Admin Panel (Permanent Owner)" : `Admin Panel — ${activeAccount.name}`}
              </h1>
              {isPermanentOwner && (
                <span className="bg-yellow-400 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  Immutable Ownership
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              ETERNAL CIVIL ACADEMY • Signed in as {activeAccount.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preview Switcher available ONLY when logged in as Permanent Super Admin */}
          {isLoggedInSuperAdmin && (
            <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-xl">
              {adminAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setActiveAdminId(acc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeAccount.id === acc.id
                      ? acc.isPermanentOwner
                        ? "bg-[#E60000] text-white shadow"
                        : "bg-white text-[#0B1B3D] shadow"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {acc.isPermanentOwner ? "Super Admin (Owner)" : acc.name}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              clearAdminSession();
              setAuthenticatedAdminId(null);
            }}
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-[#E60000] text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <AdminMasterSyncBar />
      <AdminUploadChooser />

      {/* SUPER ADMIN / DELEGATED: Website Growth Analytics */}
      {canViewAnalytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Views", value: "1,48,920", growth: "+24%", show: true },
            { label: "PDF Downloads", value: "64,310", growth: "+31%", show: true },
            { label: "Test Attempts", value: "28,450", growth: "+19%", show: true },
            { label: "UPI Revenue", value: "₹42,850", growth: "+38%", show: canManagePayments },
          ]
            .filter((s) => s.show)
            .map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>{stat.label}</span>
                  <BarChart3 className="w-4 h-4 text-[#E60000]" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D] mt-1">
                  {stat.value}
                </div>
                <span className="text-[11px] font-bold text-emerald-600">{stat.growth}</span>
              </div>
            ))}
        </div>
      )}

      {/* SUPER ADMIN ONLY (unless delegated): Auto-Sync Engine & Telegram Bot Hub */}
      {(canManageAutomation || canManageTelegram) && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {canManageAutomation && (
            <div
              className={`${
                canManageTelegram ? "lg:col-span-7" : "lg:col-span-12"
              } bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-5 shadow-sm flex flex-col justify-between gap-4`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-red-50 text-[#E60000] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                    Super Admin Controlled • 100% Free Forever
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                    GitHub Actions Cron (Every 4 Hours)
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-[#0B1B3D] mt-2">
                  Auto-Sync Engine — National & State Current Affairs
                </h2>
                <p className="text-xs text-slate-600 mt-1">{lastSyncMsg}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {[
                    "PIB (EN & HI)",
                    "Akashvani (NewsOnAir)",
                    "DD News",
                    "Prasar Bharati",
                    "7 States Multi-Source RSS",
                    "Structured: Why in News + Highlights + Prelims Facts",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 text-[#0B1B3D] px-2.5 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={triggerAutoSync}
                  disabled={syncing}
                  className="bg-[#0B1B3D] hover:bg-[#E60000] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing Feeds..." : "Verify & Sync Now"}</span>
                </button>
              </div>
            </div>
          )}

          {canManageTelegram && (
            <div
              className={`${
                canManageAutomation ? "lg:col-span-5" : "lg:col-span-12"
              } bg-white rounded-2xl border-2 border-sky-700/20 p-5 shadow-sm flex flex-col justify-between gap-3`}
            >
              <div>
                <span className="bg-sky-50 text-sky-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                  Super Admin Controlled
                </span>
                <h2 className="text-base font-extrabold text-[#0B1B3D] mt-2 flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" /> Telegram Bot Sync Bridge
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Auto-syncs Telegram quizzes to Free Live Test Series & links candidate mistakes.
                </p>
                <div className="mt-3 space-y-1.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">
                  <div>
                    <strong>CA Sync:</strong> /api/bot-sync
                  </div>
                  <div>
                    <strong>Quiz Sync:</strong> /api/telegram-quiz-sync
                  </div>
                  <div>
                    <strong>Worker:</strong> automation_workers/telegram_quiz_bridge.py
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-emerald-700">
                Protected via Bearer BOT_API_SECRET
              </div>
            </div>
          )}
        </div>
      )}

      {canManageAutomation && <AdminAutoSyncMonitor />}

      {/* SUPER ADMIN ONLY (unless explicitly delegated): PAYMENT SYSTEM */}
      {canManagePayments && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-emerald-600/25 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-700" /> Payment System — UPI Orders (
              {upiOrders.length})
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded uppercase">
              Super Admin Payment Control
            </span>
          </div>

          <div className="space-y-3">
            {upiOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {ord.itemType.replace("_", " ")}
                    </span>
                    <span className="font-extrabold text-[#0B1B3D]">{ord.itemTitle}</span>
                    <span className="bg-red-50 text-[#E60000] font-extrabold px-2 py-0.5 rounded">
                      ₹{ord.priceInr}
                    </span>
                    <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">
                      UTR: {ord.utrNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {ord.studentName} ({ord.studentContact}) • {ord.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                      ord.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : ord.status === "Rejected"
                        ? "bg-red-100 text-[#E60000]"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {ord.status}
                  </span>

                  {ord.status !== "Approved" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, "Approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                    >
                      Approve & Unlock
                    </button>
                  )}

                  {ord.status !== "Rejected" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, "Rejected")}
                      className="bg-red-50 hover:bg-red-100 text-[#E60000] text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTH SUPER ADMIN & ADMIN: COVER PAGE SHOWCASE CONTROLLER */}
      {canManageCoverPage && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-[#E60000]/20 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-[#E60000]" /> Cover Page Showcase Control (Home Hero)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pin any Batch, Notes, Test Series, Current Affairs article, or Custom Banner directly onto the Home Cover Page.
              </p>
            </div>
            {coverToast && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-lg">
                {coverToast}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pin Any Item Form */}
            <form
              onSubmit={handlePinSelectedItem}
              className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
            >
              <div className="text-xs font-extrabold text-[#0B1B3D] flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-[#E60000]" /> Pin Any Website Item to Cover Page
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Select Item Type
                </label>
                <select
                  value={pinSourceType}
                  onChange={(e) => {
                    const val = e.target.value as typeof pinSourceType;
                    setPinSourceType(val);
                    if (val === "batch" && batches[0]) setPinTargetId(batches[0].id);
                    if (val === "notes" && PREMIUM_BOOK_COVERS[0]) setPinTargetId(PREMIUM_BOOK_COVERS[0].id);
                    if (val === "current_affairs" && STRUCTURED_CURRENT_AFFAIRS[0])
                      setPinTargetId(STRUCTURED_CURRENT_AFFAIRS[0].id);
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                >
                  <option value="batch">New Batch</option>
                  <option value="notes">Notes / Book Cover</option>
                  <option value="current_affairs">Current Affairs Article</option>
                  <option value="test_series">Test Series</option>
                  <option value="custom">Custom Cover Announcement</option>
                </select>
              </div>

              {pinSourceType === "batch" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Choose Batch
                  </label>
                  <select
                    value={pinTargetId}
                    onChange={(e) => setPinTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.examTag}] {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pinSourceType === "notes" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Choose Notes / Material
                  </label>
                  <select
                    value={pinTargetId}
                    onChange={(e) => setPinTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {PREMIUM_BOOK_COVERS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.subject})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pinSourceType === "current_affairs" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Choose Current Affairs Article
                  </label>
                  <select
                    value={pinTargetId}
                    onChange={(e) => setPinTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {STRUCTURED_CURRENT_AFFAIRS.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.examRelevance}] {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(pinSourceType === "custom" || pinSourceType === "test_series") && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Headline / Banner Title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                    required={pinSourceType === "custom"}
                  />
                  {pinSourceType === "custom" && (
                    <>
                      <input
                        type="text"
                        placeholder="Top Badge (e.g. NEW ANNOUNCEMENT)"
                        value={customBadge}
                        onChange={(e) => setCustomBadge(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Button Text"
                          value={customCtaLabel}
                          onChange={(e) => setCustomCtaLabel(e.target.value)}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. /batches)"
                          value={customCtaHref}
                          onChange={(e) => setCustomCtaHref(e.target.value)}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                      </div>
                      <select
                        value={customCoverImg}
                        onChange={(e) => setCustomCoverImg(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                      >
                        {COVER_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            Cover: {c.replace("/covers/", "")}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#E60000] hover:bg-red-700 text-white text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Pin className="w-3.5 h-3.5" /> Show on Cover Page (Slide #1)
              </button>
            </form>

            {/* Active Cover Slides List */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="text-xs font-extrabold text-slate-500 uppercase">
                Current Cover Page Slides ({coverSlides.length})
              </div>
              {coverSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="bg-[#0B1B3D] text-white font-extrabold px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="bg-red-50 text-[#E60000] font-bold px-2 py-0.5 rounded uppercase">
                        {slide.sourceType.replace("_", " ")}
                      </span>
                      {!slide.active && (
                        <span className="bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                      {slide.isLocked && (
                        <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3D] truncate mt-1">
                      {slide.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      CTA: {slide.ctaPrimary.label} → {slide.ctaPrimary.href}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === coverSlides.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleSlideActive(slide.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                        slide.active
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      {slide.active ? "Visible" : "Hidden"}
                    </button>
                    {canLockContent && (
                      <button
                        onClick={() => toggleSlideLock(slide.id)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-amber-700"
                        title={slide.isLocked ? "Unlock Slide" : "Lock Slide"}
                      >
                        {slide.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {(!slide.isLocked || canLockContent) && (
                      <button
                        onClick={() => deleteCoverSlide(slide)}
                        className="p-1.5 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"
                        title="Remove from Cover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTH SUPER ADMIN & ADMIN: BATCHES MANAGEMENT */}
      {canManageBatches && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#E60000]" /> Launch New Batch
            </h2>
            <form onSubmit={handleAddBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Title</label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="e.g. UPSC CSE 2027 Foundation Batch"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam</label>
                  <input type="text" list="eca-exam-list" placeholder="Select or type exam..."
                    value={batchExam}
                    onChange={(e) => setBatchExam(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" /><datalist id="eca-exam-list">
                    {["UPSC", "UPPSC", "BPSC", "RPSC", "MPPSC", "HPSC", "JPSC", "UPSC / State PCS"].map(
                      (ex) => (
                        <option key={ex}>{ex}</option>
                      )
                    )}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <input type="text" list="eca-type-list" placeholder="Select or type batch type..."
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" /><datalist id="eca-type-list">
                    <option>Foundation</option>
                    <option>Prelims Target</option>
                    <option>Mains Mentorship</option>
                    <option>Optional</option>
                    <option>Crash Course</option>
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={batchDuration}
                    onChange={(e) => setBatchDuration(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fee INR (0 = Free)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={batchPrice}
                    onChange={(e) => setBatchPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MRP INR</label>
                  <input
                    type="number"
                    min={0}
                    value={batchMrp}
                    onChange={(e) => setBatchMrp(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medium</label>
                  <select
                    value={batchMedium}
                    onChange={(e) => setBatchMedium(e.target.value as BatchItem["medium"])}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option>Bilingual (English & Hindi)</option>
                    <option>English Medium</option>
                    <option>Hindi Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <input type="text" list="eca-status-list" placeholder="Select or type status..."
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold" /><datalist id="eca-status-list">
                    <option>Admissions Open</option>
                    <option>Upcoming</option>
                    <option>Live Now</option>
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty</label>
                  <input
                    type="text"
                    value={batchFaculty}
                    onChange={(e) => setBatchFaculty(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cover Image</label>
                  <input type="text" list="eca-cover-list" placeholder="/covers/... or https://..."
                    value={batchCover}
                    onChange={(e) => setBatchCover(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs" /><datalist id="eca-cover-list">
                    {COVER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c.replace("/covers/", "")}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={batchHighlightsText}
                  onChange={(e) => setBatchHighlightsText(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {canManageCoverPage && (
                <label className="flex items-center gap-2 text-xs font-bold text-[#0B1B3D] bg-red-50/70 border border-red-200 px-3 py-2 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchPinToCover}
                    onChange={(e) => setBatchPinToCover(e.target.checked)}
                  />
                  <span>Also pin this new batch to the Home Cover Page</span>
                </label>
              )}

              <button
                type="submit"
                className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Publish Batch
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4">
              Active Batches ({batches.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {batches.map((b) => {
                const canDeleteBatch =
                  canLockContent || (b.uploadedBy === activeAccount.id && !b.isLocked);
                return (
                  <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="bg-[#E60000] text-white font-extrabold px-2 py-0.5 rounded">
                          {b.examTag}
                        </span>
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {b.status}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                          {b.isPaid ? `₹${b.priceInr}` : "FREE"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#0B1B3D] mt-1">{b.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Starts: {b.startDate} • {b.duration} • {b.medium}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canManageCoverPage && (
                        <button
                          onClick={() =>
                            pinSlideToCover({
                              id: `slide-${b.id}`,
                              sourceType: "batch",
                              sourceId: b.id,
                              badge: `NEW BATCH • ${b.examTag}`,
                              title: b.title,
                              tagline: "Your Success, Our Commitment",
                              highlights: b.highlights.slice(0, 4),
                              ctaPrimary: { label: "View Batch", href: `/batches/${b.slug}` },
                              ctaSecondary: { label: "All Batches", href: "/batches" },
                              books: [b.coverImage, "/covers/indian-polity.jpg", "/covers/modern-history.jpg"],
                              active: true,
                              isLocked: false,
                              pinnedBy: activeAccount.id,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#E60000] text-[11px] font-bold flex items-center gap-1"
                          title="Pin to Cover Page"
                        >
                          <Pin className="w-3 h-3" /> Cover
                        </button>
                      )}
                      {canDeleteBatch && (
                        <button
                          onClick={() => {
                            const updated = batches.filter((x) => x.id !== b.id);
                            setBatches(updated);
                            saveBatches(updated);
                          }}
                          className="p-2 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BOTH ADMIN & SUPER ADMIN: Answer Evaluation Queue (Verify Payment gated by managePayments!) */}
      {canManageAnswerEval && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#E60000]" /> Answer Evaluation Queue ({submissions.length})
          </h2>

          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-[#0B1B3D]">
                      {sub.id} • {sub.studentName} ({sub.studentContact})
                    </span>
                    {canManagePayments && (
                      <span className="ml-2 text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                        UTR: {sub.upiUtr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!sub.paymentVerified ? (
                      canManagePayments ? (
                        <button
                          onClick={() => handleVerifyPayment(sub.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-lg"
                        >
                          Verify UPI Payment
                        </button>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded">
                          Awaiting Super Admin Payment Check
                        </span>
                      )
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded">
                        {sub.status}
                      </span>
                    )}

                    {canLockContent && (
                      <button
                        onClick={() => {
                          const updated = submissions.filter((x) => x.id !== sub.id);
                          setSubmissions(updated);
                          saveSubmissions(updated);
                        }}
                        className="p-1.5 rounded-lg bg-red-50 text-[#E60000]"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-700">
                  <strong>Topic:</strong> {sub.topicTitle} | <strong>Note:</strong> {sub.studentNote}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center pt-1">
                  <a
                    href="#download-student-copy"
                    className="md:col-span-3 inline-flex items-center justify-center gap-1.5 bg-[#0B1B3D] text-white text-xs font-bold py-2 px-3 rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5" /> {sub.submittedFileName}
                  </a>

                  <input
                    type="text"
                    placeholder="Marks (e.g. 8.5 / 15)"
                    value={evalMarks[sub.id] ?? sub.marksAwarded ?? ""}
                    onChange={(e) => setEvalMarks((p) => ({ ...p, [sub.id]: e.target.value }))}
                    className="md:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  />

                  <input
                    type="text"
                    placeholder="Evaluator Remarks..."
                    value={
                      evalRemarks[sub.id] ?? (sub.status === "Evaluated" ? sub.evaluatorFeedback : "")
                    }
                    onChange={(e) => setEvalRemarks((p) => ({ ...p, [sub.id]: e.target.value }))}
                    className="md:col-span-3 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                  />

                  <label className="md:col-span-2 flex items-center justify-center gap-1 border border-dashed border-slate-400 rounded-xl py-2 text-xs font-bold text-slate-700 bg-white cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[90px]">
                      {evalFile[sub.id] || "Checked PDF"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setEvalFile((p) => ({
                          ...p,
                          [sub.id]: e.target.files?.[0]?.name || "Checked_Copy.pdf",
                        }))
                      }
                    />
                  </label>

                  <button
                    onClick={() => handleSendEvaluatedCopy(sub.id)}
                    className="md:col-span-2 bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition"
                  >
                    Send Evaluated
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManageContent && <AdminSuperCrudPanel />}
      {/* Upload Content & Manage Content */}
      {canManageContent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#E60000]" /> Upload Content & Unlimited Cloud PDF
            </h2>

            <form onSubmit={handleAddContent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <input type="text" list="eca-section-list" placeholder="Select or type section..."
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold" /><datalist id="eca-section-list">
                  <option>Daily Current Affairs</option>
                  <option>Test Series</option>
                  <option>Premium Notes</option>
                  <option>NCERT Books</option>
                  <option>NCERT Crux</option>
                  <option>PYQ</option>
                  <option>State Special</option>
                  <option>Monthly Magazine</option>
                  <option>Schemes</option>
                  <option>Toppers&apos; Copy</option>
                  <option>Syllabus</option>
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter Title..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price INR (0 = Free)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cover / Direct PDF
                  </label>
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-400 rounded-xl py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                    <ImageIcon className="w-3.5 h-3.5" /> Select File
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-extrabold text-[#0B1B3D] flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-[#E60000]" /> Unlimited Cloud PDF Links (Drive / R2 / Vault)
                </div>
                <input
                  type="text"
                  placeholder="English PDF URL (https://... OR filename.pdf from premium-pdfs)"
                  value={englishPdfLink}
                  onChange={(e) => setEnglishPdfLink(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Hindi PDF URL (https://... OR filename-hi.pdf from premium-pdfs)"
                  value={hindiPdfLink}
                  onChange={(e) => setHindiPdfLink(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E60000] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Publish
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4">Manage Content</h2>

            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const canDelete =
                  canLockContent || (item.uploadedBy === activeAccount.id && !item.isLocked);

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {item.section}
                        </span>
                        <span className="bg-blue-50 text-[#0B1B3D] font-bold px-2 py-0.5 rounded">
                          {item.storageType}
                        </span>
                        {item.isLocked && (
                          <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#0B1B3D] mt-1">{item.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManageCoverPage && (
                        <button
                          onClick={() =>
                            pinSlideToCover({
                              id: `slide-item-${item.id}`,
                              sourceType: "notes",
                              sourceId: item.id,
                              badge: `FEATURED • ${item.section.toUpperCase()}`,
                              title: item.title,
                              tagline: "Your Success, Our Commitment",
                              highlights: [item.section, "English & Hindi PDF", "Exam Ready", "ETERNAL CIVIL ACADEMY"],
                              ctaPrimary: { label: "Open Material", href: "/material" },
                              ctaSecondary: { label: "Batches", href: "/batches" },
                              books: ["/covers/important-articles.jpg", "/covers/indian-polity.jpg", "/covers/modern-history.jpg"],
                              active: true,
                              isLocked: false,
                              pinnedBy: activeAccount.id,
                            })
                          }
                          className="p-2 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100"
                          title="Pin to Cover Page"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      )}

                      {canLockContent && (
                        <button
                          onClick={() => toggleLock(item.id)}
                          className={`p-2 rounded-lg border text-xs font-bold ${
                            item.isLocked
                              ? "bg-amber-50 border-amber-300 text-amber-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                          title={item.isLocked ? "Unlock" : "Lock"}
                        >
                          {item.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}

                      {canDelete ? (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-lg bg-red-50 text-[#E60000] hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 px-2">Restricted</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN (or delegated): Join Us & Contact Us Manager */}
      {canManageSiteSettings && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#0B1B3D]/15 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#E60000]" /> Join Us — Social Media Links
              </h2>
              {settingsSavedBanner && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                  Saved
                </span>
              )}
            </div>

            <div className="space-y-3">
              {siteSettings.socials.map((soc, idx) => (
                <div
                  key={soc.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <div className="sm:col-span-4 text-xs font-extrabold text-[#0B1B3D]">
                    {soc.platform}
                  </div>
                  <input
                    type="text"
                    value={soc.url}
                    onChange={(e) => {
                      const copy = [...siteSettings.socials];
                      copy[idx] = { ...soc, url: e.target.value };
                      handleSaveSiteSettings({ ...siteSettings, socials: copy });
                    }}
                    placeholder="https://..."
                    className="sm:col-span-6 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  />
                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                    <input
                      type="checkbox"
                      checked={soc.active}
                      onChange={(e) => {
                        const copy = [...siteSettings.socials];
                        copy[idx] = { ...soc, active: e.target.checked };
                        handleSaveSiteSettings({ ...siteSettings, socials: copy });
                      }}
                      title="Active"
                    />
                    <button
                      onClick={() => {
                        const filtered = siteSettings.socials.filter((s) => s.id !== soc.id);
                        handleSaveSiteSettings({ ...siteSettings, socials: filtered });
                      }}
                      className="text-[#E60000] p-1 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlatform.trim() || !newUrl.trim()) return;
                const updated = {
                  ...siteSettings,
                  socials: [
                    ...siteSettings.socials,
                    {
                      id: `soc-${Date.now()}`,
                      platform: newPlatform,
                      handle: newHandle || newPlatform,
                      url: newUrl,
                      active: true,
                    },
                  ],
                };
                handleSaveSiteSettings(updated);
                setNewPlatform("");
                setNewHandle("");
                setNewUrl("");
              }}
              className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2"
            >
              <input
                type="text"
                placeholder="Platform (e.g. X)"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
                required
              />
              <input
                type="text"
                placeholder="Handle / Title"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs"
                required
              />
              <button
                type="submit"
                className="bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-2"
              >
                + Add Link
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#0B1B3D]/15 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0B1B3D] mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#E60000]" /> Contact Us Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email ID</label>
                <input
                  type="email"
                  value={siteSettings.contact.email}
                  onChange={(e) =>
                    handleSaveSiteSettings({
                      ...siteSettings,
                      contact: { ...siteSettings.contact, email: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={siteSettings.contact.mobile}
                  onChange={(e) =>
                    handleSaveSiteSettings({
                      ...siteSettings,
                      contact: { ...siteSettings.contact, mobile: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"><div className="text-xs font-extrabold text-[#0B1B3D]">Contact Us: 3 Mobile Numbers + Name / Role</div><div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">{[0,1,2].map((idx)=>{const list=siteSettings.contact.mobileContacts||[{label:"Batch & Admission Enquiry",number:siteSettings.contact.mobile},{label:"Test Series & Notes Support",number:""},{label:"Technical & Payment Help",number:""}];const item=list[idx]||{label:"",number:""};return(<div key={idx} className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200"><input type="text" placeholder={"Option "+(idx+1)+" Name / Role"} value={item.label} onChange={(e)=>{const next=[0,1,2].map(i=>list[i]||{label:"",number:""});next[idx]={...next[idx],label:e.target.value};handleSaveSiteSettings({...siteSettings,contact:{...siteSettings.contact,mobileContacts:next}});}} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs" /><input type="text" placeholder={"Option "+(idx+1)+" Mobile (+91...)"} value={item.number} onChange={(e)=>{const next=[0,1,2].map(i=>list[i]||{label:"",number:""});next[idx]={...next[idx],number:e.target.value};handleSaveSiteSettings({...siteSettings,contact:{...siteSettings.contact,mobileContacts:next}});}} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold" /></div>);})}</div></div>
<div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={siteSettings.contact.whatsapp}
                  onChange={(e) =>
                    handleSaveSiteSettings({
                      ...siteSettings,
                      contact: { ...siteSettings.contact, whatsapp: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                />
              <div className="md:col-span-3 bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2.5 mt-2"><div className="text-xs font-extrabold text-[#0B1B3D]">About Us: Academy Info & 3 Team Members (Footer)</div><textarea rows={2} placeholder="Write a short introduction about ETERNAL CIVIL ACADEMY..." value={(siteSettings.about && siteSettings.about.description) || ""} onChange={(e)=>{const cur=siteSettings.about||{description:"",team:[{name:"Saum Yadav",role:"Founder & Director"},{name:"",role:""},{name:"",role:""}]};handleSaveSiteSettings({...siteSettings,about:{...cur,description:e.target.value}});}} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white" /><div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">{[0,1,2].map((idx)=>{const cur=siteSettings.about||{description:"",team:[{name:"Saum Yadav",role:"Founder & Director"},{name:"",role:""},{name:"",role:""}]};const t=(cur.team&&cur.team[idx])||{name:"",role:""};return(<div key={idx} className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200"><input type="text" placeholder={"Member "+(idx+1)+" Name"} value={t.name} onChange={(e)=>{const next=[0,1,2].map(i=>(cur.team&&cur.team[i])||{name:"",role:""});next[idx]={...next[idx],name:e.target.value};handleSaveSiteSettings({...siteSettings,about:{...cur,team:next}});}} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold" /><input type="text" placeholder={"Member "+(idx+1)+" Role / Designation"} value={t.role} onChange={(e)=>{const next=[0,1,2].map(i=>(cur.team&&cur.team[i])||{name:"",role:""});next[idx]={...next[idx],role:e.target.value};handleSaveSiteSettings({...siteSettings,about:{...cur,team:next}});}} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs" /></div>);})}</div></div>
            </div>
<div className="mt-4 pt-3 border-t border-slate-100 space-y-2"><button type="button" onClick={async()=>{setCloudSyncMsg("Syncing to Cloud...");saveSiteSettings(siteSettings);try{const res=await fetch("/api/cms-state",{method:"POST",headers:getAdminAuthHeaders(),body:JSON.stringify({key:"site_settings",value:siteSettings})});if(res.status===401){setCloudSyncMsg("⚠️ Session expired — Please Sign Out and Sign In again!");}else if(res.ok){setCloudSyncMsg("✅ Saved & Synced to Cloud (All devices updated!)");}else{setCloudSyncMsg("❌ Sync failed ("+res.status+")");}}catch{setCloudSyncMsg("❌ Network error while syncing");}}} className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition">Save & Sync to Cloud (All Devices)</button>{cloudSyncMsg && <div className="text-xs font-bold text-center text-[#0B1B3D] bg-slate-100 rounded-lg py-1.5 px-2">{cloudSyncMsg}</div>}</div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN (or delegated manageAdmins): TEAM ADMINS & GRANULAR PERMISSION DELEGATION */}
      {canManageAdmins && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-[#0B1B3D]/20 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0B1B3D] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E60000]" /> Team Admins & Granular Access Control
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Delegate any permission (including Payment, Automation, or Full Access) to any Admin. Permanent Super Admin ownership can NEVER be removed or altered by anyone.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-extrabold px-3 py-1 rounded-lg">
              <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Protected (Immutable)
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAdminName.trim() || !newAdminEmail.trim()) return;
              const updated = addRegularAdmin(adminAccounts, newAdminName, newAdminEmail);
              setAdminAccounts(updated);
              setNewAdminName("");
              setNewAdminEmail("");
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5"
          >
            <input
              type="text"
              placeholder="Admin Name"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
              required
            />
            <input
              type="email"
              placeholder="Admin Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
              required
            />
            <button
              type="submit"
              className="bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm py-2 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-yellow-400" /> Add Admin
            </button>
          </form>

          <div className="space-y-3">
            {adminAccounts.map((adm) => {
              const isExpanded = expandedAdminId === adm.id;
              const grantedCount = Object.values(adm.permissions).filter(Boolean).length;

              return (
                <div
                  key={adm.id}
                  className={`rounded-2xl border p-4 ${
                    adm.isPermanentOwner
                      ? "bg-amber-50/50 border-amber-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {adm.isPermanentOwner ? (
                        <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-[#0B1B3D] shrink-0" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-[#0B1B3D]">
                            {adm.name}
                          </span>
                          <span className="text-xs text-slate-500">({adm.email})</span>
                          {adm.isPermanentOwner ? (
                            <span className="bg-amber-400 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                              Permanent Owner • Cannot Be Removed
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-[#0B1B3D] text-[10px] font-extrabold px-2 py-0.5 rounded">
                              {grantedCount}/{PERMISSION_DEFINITIONS.length} Permissions Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!adm.isPermanentOwner && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setExpandedAdminId(isExpanded ? null : adm.id)}
                          className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:border-[#0B1B3D] text-[#0B1B3D] text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isExpanded ? "Hide Permissions" : "Configure Access"}</span>
                        </button>
                        <button
                          onClick={() =>
                            setAdminAccounts(setAllAdminPermissionsSafely(adminAccounts, adm.id, true))
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Grant Full Access
                        </button>
                        <button
                          onClick={() =>
                            setAdminAccounts(setAllAdminPermissionsSafely(adminAccounts, adm.id, false))
                          }
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => {
                            const next = removeAdminSafely(adminAccounts, adm.id);
                            setAdminAccounts(next);
                            if (activeAdminId === adm.id) setActiveAdminId("super_admin");
                          }}
                          className="text-xs font-bold text-[#E60000] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Granular Permission Checkboxes */}
                  {!adm.isPermanentOwner && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {PERMISSION_DEFINITIONS.map((perm) => {
                        const checked = adm.permissions[perm.key as keyof AdminPermissions];
                        return (
                          <label
                            key={perm.key}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                              checked
                                ? "bg-white border-emerald-400 shadow-xs"
                                : "bg-slate-100/70 border-slate-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setAdminAccounts(
                                  updateAdminPermissionSafely(
                                    adminAccounts,
                                    adm.id,
                                    perm.key,
                                    e.target.checked
                                  )
                                )
                              }
                              className="mt-0.5"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-[#0B1B3D]">
                                  {perm.label}
                                </span>
                                {perm.category === "Super Admin Controlled" && (
                                  <span className="text-[9px] font-extrabold bg-red-50 text-[#E60000] px-1.5 py-0.5 rounded uppercase">
                                    Super
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7 No-Code Future-Proof Controls (Navigation Order, Ticker/Popup, Custom Pages, UPI/Coupons, Dynamic States/MCQs, Inquiries, Passcode) */}
      <AdminNoCodeModules
        isPermanentOwner={isPermanentOwner}
        canManageSiteSettings={canManageSiteSettings}
        canManagePayments={canManagePayments}
        canManageContent={canManageContent}
      />
    </div>
    </AdminAuthGate>
  );
}
