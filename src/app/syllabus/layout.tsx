import type { Metadata } from "next";
const base = "https://www.eternalcivilacademy.com";
export const metadata: Metadata = {
  title: "UPSC & State PCS Complete Syllabus (Prelims & Mains PDF)",
  description: "Complete updated UPSC CSE, UPPSC, BPSC, RPSC, MPPSC, HPSC & JPSC Prelims and Mains syllabus in English and Hindi.",
  alternates: { canonical: base + "/syllabus" },
  openGraph: { title: "UPSC & State PCS Complete Syllabus (Prelims & Mains PDF) | ETERNAL CIVIL ACADEMY", description: "Complete updated UPSC CSE, UPPSC, BPSC, RPSC, MPPSC, HPSC & JPSC Prelims and Mains syllabus in English and Hindi.", url: base + "/syllabus", images: ["/logo.jpg"] },
};
export default function SyllabusLayout({ children }: { children: React.ReactNode }) { return children; }
