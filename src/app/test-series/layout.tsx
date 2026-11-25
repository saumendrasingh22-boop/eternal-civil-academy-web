import type { Metadata } from "next";
const base = "https://www.eternalcivilacademy.com";
export const metadata: Metadata = {
  title: "Free Live UPSC & State PCS Test Series (CBT Mock Tests)",
  description: "Attempt free live UPSC, UPPSC, BPSC, RPSC, MPPSC & HPSC bilingual (English & Hindi) CBT mock tests with instant scorecard, rank, and detailed explanations.",
  alternates: { canonical: `${base}/test-series` },
  openGraph: { title: "Free Live UPSC & State PCS Test Series | ETERNAL CIVIL ACADEMY", description: "Bilingual English & Hindi CBT Mock Tests for UPSC & State PCS.", url: `${base}/test-series`, images: ["/logo.jpg"] },
};
export default function TestSeriesLayout({ children }: { children: React.ReactNode }) { return children; }
