import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import AnnouncementAndPopup from "@/components/AnnouncementAndPopup";
import CloudStateHydrator from "@/components/CloudStateHydrator";
import StudentInquiryWidget from "@/components/StudentInquiryWidget";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.eternalcivilacademy.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ETERNAL CIVIL ACADEMY | Your Success, Our Commitment",
    template: "%s | ETERNAL CIVIL ACADEMY",
  },
  description:
    "ETERNAL CIVIL ACADEMY — Daily Current Affairs (National & State PCS), New Batches, Free Live CBT Test Series, NCERT Books & Crux, PYQ, State Special, Schemes & Answer Evaluation.",
  keywords: [
    "ETERNAL CIVIL ACADEMY",
    "UPSC Current Affairs",
    "UPPSC PCS Current Affairs",
    "BPSC Current Affairs",
    "RPSC MPPSC HPSC JPSC",
    "Free Live UPSC Test Series",
    "NCERT Crux PDF",
    "State Special Current Affairs",
  ],
  manifest: "/manifest.json",
  alternates: { canonical: siteUrl,
    types: { "application/rss+xml": `${siteUrl}/rss.xml` },
  },
  icons: {
    icon: "/icons/icon-192.png?v=3",
    apple: "/icons/apple-touch-icon.png?v=3",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "ETERNAL CIVIL ACADEMY",
    title: "ETERNAL CIVIL ACADEMY | Your Success, Our Commitment",
    description:
      "Daily Structured Current Affairs, New UPSC & State PCS Batches, Free Live Test Series, NCERT Crux & Bilingual PDFs.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "ETERNAL CIVIL ACADEMY",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ETERNAL CIVIL ACADEMY | Your Success, Our Commitment",
    description:
      "Daily Structured Current Affairs, New UPSC & State PCS Batches, Free Live Test Series & Bilingual PDFs.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1B3D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "ETERNAL CIVIL ACADEMY",
    slogan: "Your Success, Our Commitment",
    url: siteUrl,
    logo: `${siteUrl}/logo.jpg`,
    sameAs: [
      "https://t.me/EternalCivilAcademy",
      "https://youtube.com/@EternalCivilAcademy",
    ],
  };

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F4F6FA] text-slate-900 antialiased pb-16 lg:pb-0`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <CloudStateHydrator />
        <AnnouncementAndPopup />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <StudentInquiryWidget />
        <MobileBottomNav />
      </body>
    </html>
  );
}
