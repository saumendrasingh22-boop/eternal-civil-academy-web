import { BilingualCbtQuestion } from "@/lib/siteData";

export interface MistakeExportItem {
  questionNo: number;
  subject: string;
  questionEn: string;
  questionHi: string;
  yourChoice: string;
  correctChoice: string;
  explanationEn: string;
  explanationHi: string;
}

function openPrintableHtml(title: string, bodyHtml: string) {
  if (typeof window === "undefined") return;
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ETERNAL CIVIL ACADEMY - ${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    .header { background: #0B1B3D; color: #ffffff; padding: 16px 20px; border-radius: 12px; border-bottom: 4px solid #E60000; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .tagline { font-size: 12px; font-style: italic; color: #facc15; margin-top: 2px; }
    .sub { font-size: 13px; margin-top: 8px; font-weight: 700; }
    .q-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 14px; page-break-inside: avoid; }
    .opt { font-size: 13px; margin: 4px 0 4px 12px; color: #1e293b; }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const printWin = window.open("", "_blank", "width=850,height=900");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
}

// 1. 100% Client-Side Zero-Bandwidth Personalized Mistakes PDF (Unlimited & Free Forever)
export function exportMistakesPdfReport(
  testTitle: string,
  mistakes: MistakeExportItem[],
  lang: "en" | "hi"
) {
  const isHi = lang === "hi";
  const rowsHtml = mistakes
    .map(
      (m, i) => `
      <div class="q-card">
        <div style="font-size:11px; font-weight:700; color:#E60000; margin-bottom:4px;">
          #${i + 1} (Q.${m.questionNo}) • ${m.subject}
        </div>
        <div style="font-size:14px; font-weight:700; color:#0B1B3D; margin-bottom:8px;">
          ${isHi ? m.questionHi : m.questionEn}
        </div>
        <div style="font-size:12px; color:#b91c1c; margin-bottom:4px;">
          <strong>${isHi ? "आपका उत्तर (गलत):" : "Your Answer (Wrong):"}</strong> ${m.yourChoice}
        </div>
        <div style="font-size:12px; color:#15803d; margin-bottom:6px;">
          <strong>${isHi ? "सही उत्तर:" : "Correct Answer:"}</strong> ${m.correctChoice}
        </div>
        <div style="font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:6px;">
          <strong>${isHi ? "व्याख्या:" : "Explanation:"}</strong> ${isHi ? m.explanationHi : m.explanationEn}
        </div>
      </div>`
    )
    .join("");

  const body = `
    <div class="header">
      <div class="brand">ETERNAL CIVIL ACADEMY</div>
      <div class="tagline">Your Success, Our Commitment</div>
      <div class="sub">${testTitle} — ${isHi ? "गलत प्रश्नों का विशेष विश्लेषण (Mistakes PDF)" : "Special Mistakes Analysis PDF"}</div>
    </div>
    ${rowsHtml || `<p>${isHi ? "कोई गलत प्रश्न नहीं है।" : "No wrong questions recorded."}</p>`}`;

  openPrintableHtml("Mistakes Report", body);
}

// 2. 100% Client-Side Zero-Bandwidth Question Paper PDF OR Complete Solution PDF
export function exportTestPaperPdf(
  testTitle: string,
  questions: BilingualCbtQuestion[],
  lang: "en" | "hi",
  includeSolutions: boolean
) {
  const isHi = lang === "hi";
  const subtitle = includeSolutions
    ? isHi
      ? "संपूर्ण उत्तर एवं व्याख्या (Complete Solution PDF)"
      : "Complete Solution & Explanation PDF"
    : isHi
    ? "प्रश्न पत्र (Question Paper PDF)"
    : "Question Paper PDF";

  const rowsHtml = questions
    .map((q, idx) => {
      const qText = isHi ? q.questionHi : q.questionEn;
      const opts = isHi ? q.optionsHi : q.optionsEn;
      const exp = isHi ? q.explanationHi : q.explanationEn;
      return `
      <div class="q-card">
        <div style="font-size:11px; font-weight:700; color:#E60000; margin-bottom:4px;">
          Q.${idx + 1} • ${q.subject}
        </div>
        <div style="font-size:14px; font-weight:700; color:#0B1B3D; margin-bottom:8px;">
          ${qText}
        </div>
        <div class="opt"><strong>(A)</strong> ${opts.A}</div>
        <div class="opt"><strong>(B)</strong> ${opts.B}</div>
        <div class="opt"><strong>(C)</strong> ${opts.C}</div>
        <div class="opt"><strong>(D)</strong> ${opts.D}</div>
        ${
          includeSolutions
            ? `<div style="margin-top:8px; font-size:12px; color:#15803d; font-weight:700;">
                 ${isHi ? "सही उत्तर:" : "Correct Answer:"} (${q.correct}) ${opts[q.correct]}
               </div>
               <div style="margin-top:6px; font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:6px;">
                 <strong>${isHi ? "व्याख्या:" : "Explanation:"}</strong> ${exp}
               </div>`
            : ""
        }
      </div>`;
    })
    .join("");

  const body = `
    <div class="header">
      <div class="brand">ETERNAL CIVIL ACADEMY</div>
      <div class="tagline">Your Success, Our Commitment</div>
      <div class="sub">${testTitle} — ${subtitle}</div>
    </div>
    ${rowsHtml}`;

  openPrintableHtml(includeSolutions ? "Complete Solution" : "Question Paper", body);
}
