import type { Metadata } from "next";
const base = "https://www.eternalcivilacademy.com";
export const metadata: Metadata = {
  title: "Daily Current Affairs for UPSC & State PCS (English & Hindi)",
  description: "Daily structured UPSC & State PCS Current Affairs covering GS-1, GS-2, GS-3, GS-4, Prelims Facts & Mains Perspective in pure English & Hindi with free PDFs.",
  alternates: { canonical: `${base}/current-affairs` },
  openGraph: { title: "Daily Current Affairs (English & Hindi) | ETERNAL CIVIL ACADEMY", description: "Daily UPSC & State PCS Current Affairs with Prelims Facts & Mains Perspective.", url: `${base}/current-affairs`, images: ["/logo.jpg"] },
};
export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) { return children; }
