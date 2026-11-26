import type { BilingualCbtQuestion } from "./siteData";

export interface ParsedQuizResult {
  sourceLang: "hi" | "en";
  questions: BilingualCbtQuestion[];
  warnings: string[];
}

export function detectLanguage(text: string): "hi" | "en" {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return devanagari >= latin * 0.25 ? "hi" : "en";
}

function inferSubject(qText: string, fallback: string): string {
  const t = qText.toLowerCase();
  if (/अनुच्छेद|संविधान|अधिनियम|विधेयक|सर्वोच्च न्यायालय|संसद|राज्यसभा|लोकसभा|article|constitution|act|bill|supreme court|parliament/.test(t)) return "Polity & Governance";
  if (/अर्थव्यवस्था|आरबीआई|सेबी|एफडीआई|बीमा|बजट|जीडीपी|बैंक|एमएसएमई|rbi|sebi|fdi|budget|gdp|bank|msme|stock exchange|bse/.test(t)) return "Economy";
  if (/अंतरिक्ष|रॉकेट|एआई|क्वांटम|डेटा सेंटर|सैटेलाइट|परमाणु|space|rocket|quantum|data centre|satellite|nuclear|optical|cyber/.test(t)) return "Science & Tech";
  if (/जलवायु|पर्यावरण|नदी|जल बंटवारा|सौर|ऊर्जा|climate|environment|river|solar|hydro|energy/.test(t)) return "Environment & Geography";
  if (/समझौता|अंतरराष्ट्रीय|संयुक्त राष्ट्र|अमेरिका|जापान|वियतनाम|बांग्लादेश|ग्रीनलैंड|bilateral|international|summit|imo|un /.test(t)) return "International Relations";
  return fallback || "General Studies";
}

export function parseSmartQuizText(rawText: string, defaultSubject = "General Studies"): ParsedQuizResult {
  const cleaned = String(rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const sourceLang = detectLanguage(cleaned);
  const warnings: string[] = [];
  if (!cleaned) return { sourceLang, questions: [], warnings: ["Empty text provided."] };

  const rawBlocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const mergedBlocks: string[] = [];
  for (const blk of rawBlocks) {
    const startsWithOptOrEx = /^(?:[\(\[]?[A-Da-d][\)\]\.:]|Ex\s*:|Explanation\s*:|व्याख्या\s*:|•|Ans\s*:|उत्तर\s*:)/i.test(blk);
    if (startsWithOptOrEx && mergedBlocks.length > 0) {
      mergedBlocks[mergedBlocks.length - 1] += "\n" + blk;
    } else if (mergedBlocks.length > 0 && !/(?:^|\n)\s*[\(\[]?A[\)\]\.:]\s+/i.test(mergedBlocks[mergedBlocks.length - 1])) {
      mergedBlocks[mergedBlocks.length - 1] += "\n" + blk;
    } else {
      mergedBlocks.push(blk);
    }
  }

  const questions: BilingualCbtQuestion[] = [];
  const optRegex = /^\s*[\(\[]?([A-Da-d])[\)\]\.:]\s+(.*)$/;
  const exStartRegex = /^\s*(?:Ex|Explanation|व्याख्या)\s*:\s*(.*)$/i;
  const ansLineRegex = /^\s*(?:Ans|Answer|Correct|उत्तर)\s*[:\-]\s*[\(\[]?([A-Da-d])[\)\]]?/i;
  const correctMarkerRegex = /(?:✅|✔|✓|\[\s*correct\s*\]|\(\s*correct\s*\))/gi;

  mergedBlocks.forEach((block, idx) => {
    const lines = block.split("\n");
    const stemLines: string[] = [];
    const opts: Record<"A" | "B" | "C" | "D", string> = { A: "", B: "", C: "", D: "" };
    const exLines: string[] = [];
    let correct: "A" | "B" | "C" | "D" | null = null;
    let state: "stem" | "opts" | "ex" = "stem";
    let lastOpt: "A" | "B" | "C" | "D" | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (state !== "ex") {
        const exMatch = line.match(exStartRegex);
        if (exMatch) {
          state = "ex";
          if (exMatch[1] && exMatch[1].trim()) exLines.push(exMatch[1].trim());
          continue;
        }
        const ansMatch = line.match(ansLineRegex);
        if (ansMatch) {
          correct = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          continue;
        }
        const optMatch = line.match(optRegex);
        if (optMatch) {
          state = "opts";
          const key = optMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          let val = optMatch[2].trim();
          if (correctMarkerRegex.test(val)) {
            correct = key;
            val = val.replace(correctMarkerRegex, "").trim();
          }
          opts[key] = val;
          lastOpt = key;
          continue;
        }
      }

      if (state === "stem") {
        if (stemLines.length === 0) {
          stemLines.push(rawLine.replace(/^\s*(?:Q\.?\s*\d+[\.\):\-]\s*|\d+[\.\)]\s+)/, "").trimEnd());
        } else {
          stemLines.push(rawLine.trimEnd());
        }
      } else if (state === "opts" && lastOpt) {
        let extra = line;
        if (correctMarkerRegex.test(extra)) {
          correct = lastOpt;
          extra = extra.replace(correctMarkerRegex, "").trim();
        }
        opts[lastOpt] = (opts[lastOpt] + " " + extra).trim();
      } else if (state === "ex") {
        exLines.push(line);
      }
    }

    const qStem = stemLines.join("\n").trim();
    const expText = exLines.join("\n").trim();
    if (!qStem || !opts.A || !opts.B) {
      warnings.push(`Block #${idx + 1} skipped (missing question or A/B options).`);
      return;
    }
    if (!correct) {
      warnings.push(`Q#${questions.length + 1}: No ✅ answer marker found; defaulted to A.`);
      correct = "A";
    }

    questions.push({
      id: questions.length + 1,
      subject: inferSubject(qStem + " " + expText, defaultSubject),
      questionEn: qStem,
      questionHi: qStem,
      optionsEn: { ...opts },
      optionsHi: { ...opts },
      correct,
      explanationEn: expText || "Refer to official exam explanation.",
      explanationHi: expText || "विस्तृत व्याख्या उपलब्ध है।",
    });
  });

  return { sourceLang, questions, warnings };
}
