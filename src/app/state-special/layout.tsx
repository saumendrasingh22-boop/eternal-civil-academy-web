import type { Metadata } from "next";
const base = "https://www.eternalcivilacademy.com";
export const metadata: Metadata = {
  title: "State Special Current Affairs (UPPSC, BPSC, RPSC, MPPSC, HPSC)",
  description: "Daily State Special Current Affairs & State GS notes in English and Hindi for UP, Bihar, Rajasthan, MP, Haryana, Jharkhand & Uttarakhand PCS.",
  alternates: { canonical: base + "/state-special" },
  openGraph: { title: "State Special Current Affairs (UPPSC, BPSC, RPSC, MPPSC, HPSC) | ETERNAL CIVIL ACADEMY", description: "Daily State Special Current Affairs & State GS notes in English and Hindi for UP, Bihar, Rajasthan, MP, Haryana, Jharkhand & Uttarakhand PCS.", url: base + "/state-special", images: ["/logo.jpg"] },
};
export default function StateSpecialLayout({ children }: { children: React.ReactNode }) { return children; }
