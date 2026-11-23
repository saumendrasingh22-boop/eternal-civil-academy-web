import { BilingualCurrentAffairItem, getLocalizedCa } from "@/lib/bilingualCaMap";
import { loadSiteSettings } from "@/lib/siteSettingsStore";

const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*\*/g, "");

export function exportArticlePdf(article: BilingualCurrentAffairItem, lang: "en" | "hi") {
  if (typeof window === "undefined") return;
  const loc = getLocalizedCa(article, lang);
  const isHi = lang === "hi";
  const st = loadSiteSettings();
  const tg = st.socials.find((s) => s.platform.toLowerCase().includes("telegram") && s.url);
  const tgUrl = tg?.url || "https://t.me/EternalCivilAcademy";
  const tgH = tg?.handle || tgUrl.replace(/^https?:\/\//, "");
  const orig = window.location.origin;
  const logo = orig + "/logo.jpg";
  const hl = loc.keyHighlights.map((p) => `<li style="margin-bottom:6px">${fmt(p)}</li>`).join("");
  const pf = loc.prelimsFacts.map((p) => `<li style="margin-bottom:5px;list-style:none"><b style="color:#E60000">★</b> ${fmt(p)}</li>`).join("");
  const css = `@page{size:A4;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:"Noto Sans Devanagari","Nirmala UI","Mangal",Arial,sans-serif;color:#0f172a;margin:0;font-size:13px;line-height:1.55}.hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0B1B3D;color:#fff;padding:12px 16px;border-radius:10px;border-bottom:4px solid #E60000}.hl{display:flex;align-items:center;gap:10px}.lg{height:42px;width:auto;border-radius:6px;background:#fff;border:1px solid rgba(255,255,255,.25)}.br{font-size:17px;font-weight:800}.tg{font-size:11px;font-style:italic;color:#facc15}.hr{text-align:right}.tb{display:inline-block;background:#E60000;color:#fff;text-decoration:none;font-weight:700;padding:5px 10px;border-radius:6px;font-size:11px}.tu{display:block;color:#cbd5e1;font-size:10px;margin-top:3px}.mt{display:flex;gap:8px;align-items:center;margin:14px 0 8px;font-size:11px}.bd{background:#E60000;color:#fff;font-weight:800;padding:3px 9px;border-radius:5px}.sb{background:#eef2ff;color:#3730a3;font-weight:700;padding:3px 9px;border-radius:5px}h1{font-size:19px;color:#0B1B3D;margin:6px 0 14px}.wy{background:#f8fafc;border-left:4px solid #E60000;padding:11px 14px;border-radius:0 8px 8px 0;margin-bottom:14px}.st{font-size:11px;font-weight:800;text-transform:uppercase;color:#E60000;margin-bottom:4px}h2{font-size:14px;color:#0B1B3D;border-bottom:1.5px solid #cbd5e1;padding-bottom:4px;margin:14px 0 8px}.pr{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin:14px 0;page-break-inside:avoid}.mn{background:#0B1B3D;color:#f8fafc;border-radius:10px;padding:12px 14px;margin:14px 0;page-break-inside:avoid}.mn .st{color:#facc15}.ft{margin-top:18px;padding-top:10px;border-top:2px solid #0B1B3D;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:11px;color:#334155}.ft a{color:#0B1B3D;font-weight:700;text-decoration:none}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ETERNAL CIVIL ACADEMY - ${esc(loc.title.replace(/\*\*/g, ""))}</title><style>${css}</style></head><body><div class="hdr"><div class="hl"><img src="${logo}" class="lg"><div><div class="br">ETERNAL CIVIL ACADEMY</div><div class="tg">Your Success, Our Commitment</div></div></div><div class="hr"><a href="${esc(tgUrl)}" class="tb">Join Telegram: ${esc(tgH)}</a><span class="tu">${esc(tgUrl)}</span></div></div><div class="mt"><span class="bd">Exam Relevance: ${esc(article.examRelevance)}</span>${article.stateName ? `<span class="sb">${esc(article.stateName)}</span>` : ""}<b>${esc(article.date)}</b></div><h1>${fmt(loc.title)}</h1><div class="wy"><div class="st">${isHi ? "खबरों में क्यों है (Why in News)" : "Why in News"}</div><div>${fmt(loc.whyInNews)}</div></div><h2>${isHi ? "विस्तृत व्याख्या (Key Highlights)" : "Key Highlights"}</h2><ul style="padding-left:18px">${hl}</ul><div class="pr"><h2 style="border:0;margin:0 0 8px">★ ${isHi ? "प्रीलिम्स के लिए महत्वपूर्ण तथ्य (Prelims Facts)" : "Prelims Facts"}</h2><ul style="padding-left:0">${pf}</ul></div><div class="mn"><div class="st">${isHi ? "मुख्य परीक्षा दृष्टिकोण (Mains Perspective)" : "Mains Perspective"}</div><div>${fmt(loc.mainsPerspective)}</div></div><div class="ft"><div><b>ETERNAL CIVIL ACADEMY</b> • ${esc(orig.replace(/^https?:\/\//, ""))}</div><div>Telegram: <a href="${esc(tgUrl)}">${esc(tgUrl)}</a></div><div style="width:100%;font-size:10px;color:#64748b;text-align:center">© 2026 ETERNAL CIVIL ACADEMY • Dedicated UPSC &amp; State PCS Current Affairs</div></div></body></html>`;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentWindow?.document;
  if (!d) { document.body.removeChild(f); return; }
  d.open(); d.write(html); d.close();
  const go = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } finally { setTimeout(() => { if (f.parentNode) f.parentNode.removeChild(f); }, 1500); } };
  const im = d.querySelector("img");
  if (im && !im.complete) { im.onload = () => setTimeout(go, 150); im.onerror = () => setTimeout(go, 150); } else setTimeout(go, 200);
}
