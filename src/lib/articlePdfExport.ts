import { BilingualCurrentAffairItem, getLocalizedCa } from "@/lib/bilingualCaMap";
import { loadSiteSettings } from "@/lib/siteSettingsStore";

const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*\*/g, "");

const TG_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#0088cc" style="vertical-align:-2px;margin-right:4px"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.89 8.15l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.02-2.23-1.46 1.4c-.16.16-.3.3-.61.3l.22-3.08 5.61-5.07c.24-.22-.05-.34-.38-.12l-6.93 4.36-2.99-.93c-.65-.2-.66-.65.14-.96l11.68-4.5c.54-.2 1.01.13.8.94z"/></svg>`;
const IG_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#E1306C" style="vertical-align:-2px;margin-right:4px"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>`;
const WEB_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B1B3D" stroke-width="2.2" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`;

export function exportArticlePdf(article: BilingualCurrentAffairItem, lang: "en" | "hi") {
  if (typeof window === "undefined") return;
  const loc = getLocalizedCa(article, lang);
  const isHi = lang === "hi";
  const st = loadSiteSettings();
  const tg = st.socials.find((s) => s.platform.toLowerCase().includes("telegram") && s.url);
  const ig = st.socials.find((s) => s.platform.toLowerCase().includes("instagram") && s.url);
  const tgUrl = tg?.url || "https://t.me/EternalCivilAcademy";
  const igUrl = ig?.url || "https://instagram.com/eternalcivilacademy";
  const tgLabel = tgUrl.replace(/^https?:\/\//, "");
  const igLabel = igUrl.replace(/^https?:\/\//, "");
  const webUrl = "https://www.eternalcivilacademy.com";
  const webLabel = "www.eternalcivilacademy.com";
  const logo = window.location.origin + "/logo.jpg";

  const shortTopic = String(article.title || loc.title || "Current Affairs")
    .replace(/\*\*/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ")
    .slice(0, 48)
    .trim();
  const fileTitle = `${shortTopic || "Current Affairs"} ECA`;

  const hl = loc.keyHighlights.map((p) => `<li style="margin-bottom:7px">${fmt(p)}</li>`).join("");
  const pf = loc.prelimsFacts.map((p) => `<li style="margin-bottom:6px;list-style:none"><b style="color:#E60000">★</b> ${fmt(p)}</li>`).join("");

  const css = `@page{size:A4;margin:15mm 16mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:"Noto Sans Devanagari","Nirmala UI","Mangal",Arial,sans-serif;color:#0f172a;margin:0;padding:12px 16px;font-size:13px;line-height:1.6}.hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0B1B3D;color:#fff;padding:12px 16px;border-radius:10px;border-bottom:4px solid #E60000}.hl{display:flex;align-items:center;gap:10px}.lg{height:42px;width:auto;border-radius:6px;background:#fff;border:1px solid rgba(255,255,255,.25)}.br{font-size:16.5px;font-weight:800;letter-spacing:.3px}.tg{font-size:11px;font-style:italic;color:#facc15;margin-top:2px}.hr{text-align:right;font-size:11px}.hr-tag{display:inline-block;background:#E60000;color:#fff;font-weight:700;padding:3px 9px;border-radius:5px;font-size:10px;text-transform:uppercase;letter-spacing:.4px}.hr-web{display:block;color:#e2e8f0;font-size:10.5px;font-weight:700;margin-top:4px;text-decoration:none}.mt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0 8px;font-size:11px}.bd{background:#E60000;color:#fff;font-weight:800;padding:3px 9px;border-radius:5px}.sb{background:#eef2ff;color:#3730a3;font-weight:700;padding:3px 9px;border-radius:5px}h1{font-size:18.5px;color:#0B1B3D;margin:8px 0 14px;line-height:1.38}.wy{background:#f8fafc;border-left:4px solid #E60000;padding:12px 15px;border-radius:0 8px 8px 0;margin-bottom:15px}.st{font-size:11px;font-weight:800;text-transform:uppercase;color:#E60000;margin-bottom:4px}h2{font-size:14px;color:#0B1B3D;border-bottom:1.5px solid #cbd5e1;padding-bottom:4px;margin:15px 0 9px}.pr{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:13px 15px;margin:15px 0;page-break-inside:avoid}.mn{background:#0B1B3D;color:#f8fafc;border-radius:10px;padding:13px 15px;margin:15px 0;page-break-inside:avoid}.mn .st{color:#facc15}.ft{margin-top:20px;padding-top:11px;border-top:2px solid #0B1B3D;font-size:10.5px;color:#334155;page-break-inside:avoid}.ft-links{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}.ft a{color:#0B1B3D;font-weight:700;text-decoration:none}.ft-copy{font-size:10px;color:#475569;text-align:center;font-weight:600}.wm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-32deg);font-size:34px;font-weight:800;color:#0B1B3D;opacity:0.07;white-space:nowrap;pointer-events:none;z-index:0;letter-spacing:1.5px}.hdr,.mt,h1,.wy,h2,ul,.pr,.mn,.ft{position:relative;z-index:1}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(fileTitle)}</title><style>${css}</style></head><body><div class="wm">www.eternalcivilacademy.com</div><div class="hdr"><div class="hl"><img src="${logo}" class="lg"><div><div class="br">ETERNAL CIVIL ACADEMY</div><div class="tg">Your Success, Our Commitment</div></div></div><div class="hr"><span class="hr-tag">${isHi ? "दैनिक करंट अफेयर्स" : "Daily Current Affairs"}</span><a href="${webUrl}" class="hr-web">${webLabel}</a></div></div><div class="mt"><span class="bd">Exam Relevance: ${esc(article.examRelevance)}</span>${article.stateName ? `<span class="sb">${esc(article.stateName)}</span>` : ""}<b>${esc(article.date)}</b></div><h1>${fmt(loc.title)}</h1><div class="wy"><div class="st">${isHi ? "खबरों में क्यों है (Why in News)" : "Why in News"}</div><div>${fmt(loc.whyInNews)}</div></div><h2>${isHi ? "विस्तृत व्याख्या (Key Highlights)" : "Key Highlights"}</h2><ul style="padding-left:20px;margin:0">${hl}</ul><div class="pr"><h2 style="border:0;margin:0 0 8px">★ ${isHi ? "प्रीलिम्स के लिए महत्वपूर्ण तथ्य (Prelims Facts)" : "Prelims Facts"}</h2><ul style="padding-left:0;margin:0">${pf}</ul></div><div class="mn"><div class="st">${isHi ? "मुख्य परीक्षा दृष्टिकोण (Mains Perspective)" : "Mains Perspective"}</div><div>${fmt(loc.mainsPerspective)}</div></div><div class="ft"><div class="ft-links"><span>${WEB_SVG}<a href="${webUrl}">${webLabel}</a></span><span>${TG_SVG}<a href="${esc(tgUrl)}">${esc(tgLabel)}</a></span><span>${IG_SVG}<a href="${esc(igUrl)}">${esc(igLabel)}</a></span></div><div class="ft-copy">© 2026 ETERNAL CIVIL ACADEMY • Dedicated to UPSC &amp; State PSC Examinations</div></div></body></html>`;

  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentWindow?.document;
  if (!d) { document.body.removeChild(f); return; }
  d.open(); d.write(html); d.close();
  const prevTitle = document.title;
  const go = () => {
    try {
      document.title = fileTitle;
      f.contentWindow?.focus();
      f.contentWindow?.print();
    } finally {
      setTimeout(() => {
        document.title = prevTitle;
        if (f.parentNode) f.parentNode.removeChild(f);
      }, 1500); } };
  const im = d.querySelector("img");
  if (im && !im.complete) { im.onload = () => setTimeout(go, 150); im.onerror = () => setTimeout(go, 150); } else setTimeout(go, 200);
}
