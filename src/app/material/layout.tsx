import type { Metadata } from "next";
const base = "https://www.eternalcivilacademy.com";
export const metadata: Metadata = {
  title: "UPSC & State PCS Study Material, NCERT Books & Daily CA PDFs",
  description: "Download free & premium UPSC and State PCS study material, NCERT Books, NCERT Crux, Daily Current Affairs PDFs & Essay Material in English and Hindi.",
  alternates: { canonical: base + "/material" },
  openGraph: { title: "UPSC & State PCS Study Material, NCERT Books & Daily CA PDFs | ETERNAL CIVIL ACADEMY", description: "Download free & premium UPSC and State PCS study material, NCERT Books, NCERT Crux, Daily Current Affairs PDFs & Essay Material in English and Hindi.", url: base + "/material", images: ["/logo.jpg"] },
};
export default function MaterialLayout({ children }: { children: React.ReactNode }) { return children; }
