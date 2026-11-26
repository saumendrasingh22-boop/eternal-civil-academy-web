import os
import re
import json
import time
import html
import requests
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

GEMINI_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GROQ_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
BOT_SECRET = (os.getenv("BOT_API_SECRET") or "").strip()
GITHUB_TOKEN = (os.getenv("GITHUB_TOKEN") or "").strip()
REPO = (os.getenv("GITHUB_REPOSITORY") or "saumendrasingh22-boop/eternal-civil-academy-web").strip()
WEBSITE_URL = (os.getenv("WEBSITE_URL") or "https://www.eternalcivilacademy.com").strip().rstrip("/")
RELEASE_TAG = "PDFs"

GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
FORBIDDEN_SCRIPT_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
HEADERS = {"User-Agent": "Mozilla/5.0 (ECA-Daily-25MCQ-Bot)"}


def has_forbidden_script(obj) -> bool:
    if isinstance(obj, str):
        return bool(FORBIDDEN_SCRIPT_RE.search(obj))
    if isinstance(obj, list):
        return any(has_forbidden_script(x) for x in obj)
    if isinstance(obj, dict):
        return any(has_forbidden_script(v) for v in obj.values())
    return False


def cms_get(key: str):
    r = requests.get(f"{WEBSITE_URL}/api/cms-state?key={key}&_t={int(time.time())}", headers=HEADERS, timeout=25)
    if r.ok:
        return r.json().get("value")
    return None


def cms_post(key: str, value) -> bool:
    hdr = {**HEADERS, "Content-Type": "application/json", "Authorization": f"Bearer {BOT_SECRET}"}
    r = requests.post(f"{WEBSITE_URL}/api/cms-state", headers=hdr, json={"key": key, "value": value}, timeout=30)
    print(f"[CMS POST {key}] status={r.status_code}")
    return r.ok


def fetch_recent_ca_context() -> str:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return ""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/current_affairs?select=title,why_in_news,prelims_facts,published_date&order=created_at.desc&limit=12",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            timeout=20,
        )
        if not r.ok:
            return ""
        lines = []
        for row in r.json()[:10]:
            t = row.get("title") or ""
            w = row.get("why_in_news") or ""
            f = " | ".join(row.get("prelims_facts") or []) if isinstance(row.get("prelims_facts"), list) else str(row.get("prelims_facts") or "")
            lines.append(f"- {t}: {w} ({f[:240]})")
        return "\n".join(lines)
    except Exception as e:
        print(f"[CA fetch warn] {e}")
        return ""


def parse_json_array(raw: str):
    if not raw:
        return None
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        data = json.loads(s)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", s)
        if not m:
            return None
        try:
            data = json.loads(m.group(0))
        except Exception:
            return None
    qs = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(qs, list) or not qs:
        return None
    if has_forbidden_script(qs):
        print("[BLOCKED URDU/ARABIC SCRIPT] Retrying fallback model")
        return None
    valid = []
    for q in qs:
        if not isinstance(q, dict):
            continue
        corr = str(q.get("correct", "")).strip().upper()[:1]
        if corr not in ("A", "B", "C", "D"):
            continue
        if not q.get("questionEn") or not q.get("questionHi"):
            continue
        if not isinstance(q.get("optionsEn"), dict) or not isinstance(q.get("optionsHi"), dict):
            continue
        valid.append({
            "subject": str(q.get("subject") or "General Studies").strip(),
            "questionEn": str(q["questionEn"]).strip(),
            "questionHi": str(q["questionHi"]).strip(),
            "optionsEn": {k: str(q["optionsEn"].get(k, "")).strip() for k in ("A", "B", "C", "D")},
            "optionsHi": {k: str(q["optionsHi"].get(k, "")).strip() for k in ("A", "B", "C", "D")},
            "correct": corr,
            "explanationEn": str(q.get("explanationEn") or "").strip(),
            "explanationHi": str(q.get("explanationHi") or "").strip(),
        })
    return valid


def call_ai(prompt: str, min_count: int):
    # 1. Gemini with 503 retry
    if GEMINI_KEY:
        for model in GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
                body = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.25, "maxOutputTokens": 8192, "responseMimeType": "application/json"},
                }
                r = requests.post(url, json=body, timeout=60)
                if r.status_code == 503:
                    time.sleep(4)
                    r = requests.post(url, json=body, timeout=60)
                if r.ok:
                    txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                    qs = parse_json_array(txt)
                    if qs and len(qs) >= min_count:
                        print(f"[gemini OK] {model} -> {len(qs)} Qs")
                        return qs[:min_count]
                else:
                    print(f"[gemini ERR {model}] {r.status_code}: {r.text[:140]}")
            except Exception as e:
                print(f"[gemini EXC {model}] {e}")

    # 2. Groq production fallback
    if GROQ_KEY:
        for model in GROQ_MODELS:
            try:
                r = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "temperature": 0.25,
                        "max_tokens": 8192,
                        "response_format": {"type": "json_object"},
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=60,
                )
                if r.ok:
                    txt = r.json()["choices"][0]["message"]["content"]
                    qs = parse_json_array(txt)
                    if qs and len(qs) >= min_count:
                        print(f"[groq OK] {model} -> {len(qs)} Qs")
                        return qs[:min_count]
                else:
                    print(f"[groq ERR {model}] {r.status_code}: {r.text[:140]}")
            except Exception as e:
                print(f"[groq EXC {model}] {e}")
    return None


def build_batch_prompt(date_str: str, spec: str, count: int, ca_ctx: str, avoid_topics: list) -> str:
    avoid_block = "\n".join(f"- {t[:90]}" for t in avoid_topics[:40]) if avoid_topics else "None"
    return f"""You are the Senior NCERT Prelims Question Setter for ETERNAL CIVIL ACADEMY (UPSC, UPPSC, BPSC).
Generate EXACTLY {count} high-quality, strictly Class 6-12 NCERT-based bilingual MCQs for {date_str}.

STRICT SUBJECT QUOTA (MUST MATCH EXACTLY):
{spec}

SOURCE BASE: Strictly Class 6-12 NCERT textbooks (History, Geography, Polity, Economics, Environment, Science). Mention the relevant NCERT concept/class in the explanation where helpful.

RECENTLY ASKED QUESTIONS TO AVOID REPEATING:
{avoid_block}

STRICT RULES:
1. Language: Pure English + pure standard Devanagari Hindi (हिन्दी). NEVER use Urdu/Arabic/Persian script anywhere.
2. Mix UPSC/UPPSC style statements (1 & 2, Assertion-Reason, Match/Direct Factual) with 100% verified factual accuracy.
3. Explanations must be crisp (2-3 lines) with key Prelims facts in both English and Hindi.
4. Return ONLY valid JSON with key "questions": an array of {count} objects, each having:
   subject, questionEn, questionHi, optionsEn (A,B,C,D), optionsHi (A,B,C,D), correct ("A"|"B"|"C"|"D"), explanationEn, explanationHi.
"""


def render_branded_pdf(questions: list, date_str: str, lang: str, out_path: str):
    import base64 as _b64
    from weasyprint import HTML

    is_hi = lang == "hi"
    tag_lbl = "दैनिक NCERT क्विज़ (20 MCQs)" if is_hi else "Daily NCERT Quiz (20 MCQs)"
    title = f"दैनिक NCERT क्विज़ (20 MCQs) — {date_str}" if is_hi else f"Daily NCERT Quiz (20 MCQs) — {date_str}"
    sub = "Class 6-12 NCERT • +1 सही / -1/3 नेगेटिव मार्किंग • व्याख्या सहित" if is_hi else "Class 6-12 NCERT • +1 Correct / -1/3 Negative Marking • With Explanations"

    logo_src = "https://www.eternalcivilacademy.com/logo.jpg"
    for cand in ("public/logo.jpg", "public/logo.png", "public/icon-192.png"):
        if os.path.exists(cand):
            ext = os.path.splitext(cand)[1].lower().lstrip(".")
            mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
            with open(cand, "rb") as lf:
                raw_logo = lf.read()
            logo_src = f"data:{mime};base64," + _b64.b64encode(raw_logo).decode("ascii")
            print(f"[PDF BRAND] Embedded {cand} ({len(raw_logo)} bytes)")
            break

    web_svg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B1B3D" stroke-width="2" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    tg_svg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#229ED9" style="vertical-align:middle;margin-right:4px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.58 4.58-1.85 5.1-1.86.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/></svg>'
    ig_svg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" style="vertical-align:middle;margin-right:4px"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'

    q_blocks = []
    for q in questions:
        qtxt = html.escape(q["questionHi"] if is_hi else q["questionEn"]).replace("\n", "<br/>")
        opts = q["optionsHi"] if is_hi else q["optionsEn"]
        exp = html.escape(q["explanationHi"] if is_hi else q["explanationEn"])
        ans_lbl = "सही उत्तर" if is_hi else "Correct Answer"
        exp_lbl = "व्याख्या" if is_hi else "Explanation"
        opt_html = "".join(f'<div class="qopt"><b>({k})</b> {html.escape(opts.get(k, ""))}</div>' for k in ("A", "B", "C", "D"))
        q_blocks.append(f'<div class="qcard"><div class="qmeta">Q{q["id"]} &bull; {html.escape(q["subject"])}</div><div class="qtxt">{qtxt}</div><div class="qopts">{opt_html}</div><div class="qans"><b>{ans_lbl}: ({q["correct"]})</b> &mdash; <b>{exp_lbl}:</b> {exp}</div></div>')

    css = """
@page {
  size: A4;
  margin: 14mm 15mm 16mm 15mm;
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 8pt;
    color: #475569;
  }
}
* { box-sizing: border-box; }
body {
  font-family: 'Noto Sans Devanagari', 'Lohit Devanagari', 'DejaVu Sans', sans-serif;
  color: #0f172a;
  margin: 0;
  padding: 0;
  font-size: 10pt;
  line-height: 1.45;
}
.wm {
  position: fixed;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-32deg);
  font-size: 32pt;
  font-weight: 800;
  color: #0B1B3D;
  opacity: 0.08;
  white-space: nowrap;
  z-index: 0;
  letter-spacing: 1.5px;
}
.hdr, .mt, h1, .wy, .qcard, .ft { position: relative; z-index: 1; }
.hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2.5px solid #0B1B3D;
  padding-bottom: 10px;
  margin-bottom: 12px;
}
.hl { display: flex; align-items: center; gap: 10px; }
.lg { height: 44px; width: auto; max-width: 140px; object-fit: contain; border-radius: 6px; }
.br { font-size: 14pt; font-weight: 800; color: #0B1B3D; letter-spacing: 0.4px; line-height: 1.15; }
.tg { font-size: 8.5pt; color: #E60000; font-weight: 700; margin-top: 2px; }
.hr { text-align: right; }
.hr-tag {
  display: inline-block;
  background: #fef2f2;
  color: #E60000;
  font-size: 8.5pt;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 99px;
  border: 1px solid #fecaca;
}
.hr-web {
  display: block;
  font-size: 8.5pt;
  font-weight: 700;
  color: #0B1B3D;
  text-decoration: none;
  margin-top: 4px;
}
.mt {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 10px 0 8px 0;
  font-size: 8.5pt;
}
.bd { background: #E60000; color: #ffffff; font-weight: 800; padding: 3px 9px; border-radius: 5px; }
.sb { background: #eef2ff; color: #3730a3; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
h1 { font-size: 14pt; color: #0B1B3D; margin: 6px 0 10px 0; line-height: 1.3; }
.wy {
  background: #f8fafc;
  border-left: 4px solid #E60000;
  padding: 9px 13px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 12px;
  font-size: 9pt;
}
.st { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #E60000; margin-bottom: 3px; }
.qcard {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 9px 12px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.88);
  page-break-inside: avoid;
}
.qmeta {
  display: inline-block;
  background: #eef2ff;
  color: #3730a3;
  font-size: 8pt;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 5px;
  margin-bottom: 5px;
}
.qtxt { font-size: 10pt; font-weight: 700; color: #0f172a; line-height: 1.45; margin-bottom: 5px; }
.qopts { margin-left: 6px; margin-bottom: 6px; }
.qopt { font-size: 9.4pt; color: #1e293b; margin-bottom: 2px; line-height: 1.4; }
.qans {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3.5px solid #E60000;
  border-radius: 6px;
  padding: 6px 9px;
  font-size: 8.8pt;
  color: #1e293b;
  line-height: 1.42;
}
.ft {
  margin-top: 16px;
  padding-top: 10px;
  border-top: 2px solid #0B1B3D;
  font-size: 8.5pt;
  color: #334155;
  page-break-inside: avoid;
}
.ft-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.ft a { color: #0B1B3D; font-weight: 700; text-decoration: none; }
.ft-copy { font-size: 8pt; color: #475569; text-align: center; font-weight: 600; }
"""

    doc_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"/><style>{css}</style></head><body>
<div class="wm">www.eternalcivilacademy.com</div>
<div class="hdr"><div class="hl"><img src="{logo_src}" class="lg"/><div><div class="br">ETERNAL CIVIL ACADEMY</div><div class="tg">Your Success, Our Commitment</div></div></div><div class="hr"><span class="hr-tag">{html.escape(tag_lbl)}</span><a href="https://www.eternalcivilacademy.com" class="hr-web">www.eternalcivilacademy.com</a></div></div>
<div class="mt"><span class="bd">Class 6-12 NCERT</span><span class="sb">+1 / -1/3 Negative Marking</span><b>{html.escape(date_str)}</b></div>
<h1>{html.escape(title)}</h1>
<div class="wy"><div class="st">{html.escape(tag_lbl)}</div><div>{html.escape(sub)}</div></div>
{''.join(q_blocks)}
<div class="ft"><div class="ft-links"><span>{web_svg}<a href="https://www.eternalcivilacademy.com">www.eternalcivilacademy.com</a></span><span>{tg_svg}<a href="https://t.me/EternalCivilAcademy">t.me/EternalCivilAcademy</a></span><span>{ig_svg}<a href="https://instagram.com/eternalcivilacademy">@eternalcivilacademy</a></span></div><div class="ft-copy">&copy; 2026 ETERNAL CIVIL ACADEMY &bull; Dedicated to UPSC &amp; State PCS Examinations</div></div>
</body></html>"""
    HTML(string=doc_html).write_pdf(out_path)
    print(f"[PDF OK] {out_path} ({os.path.getsize(out_path)} bytes)")

def upload_to_release(file_path: str, content_type: str) -> str:
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN missing")
    hdr = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}
    rel = requests.get(f"https://api.github.com/repos/{REPO}/releases/tags/{RELEASE_TAG}", headers=hdr, timeout=25)
    if rel.status_code == 404:
        rel = requests.post(
            f"https://api.github.com/repos/{REPO}/releases",
            headers=hdr,
            json={"tag_name": RELEASE_TAG, "name": "ECA PDFs & Daily Tests", "draft": False, "prerelease": False},
            timeout=25,
        )
    rel.raise_for_status()
    rel_data = rel.json()
    rel_id = rel_data["id"]
    fname = os.path.basename(file_path)

    for asset in rel_data.get("assets", []):
        if asset.get("name") == fname:
            requests.delete(f"https://api.github.com/repos/{REPO}/releases/assets/{asset['id']}", headers=hdr, timeout=20)

    up_url = f"https://uploads.github.com/repos/{REPO}/releases/{rel_id}/assets?name={fname}"
    with open(file_path, "rb") as fp:
        up = requests.post(up_url, headers={**hdr, "Content-Type": content_type}, data=fp.read(), timeout=60)
    up.raise_for_status()
    return up.json()["browser_download_url"]


def main():
    today_ist = datetime.now(IST).strftime("%Y-%m-%d")
    print(f"[ECA Daily 25-MCQ] Starting for {today_ist}")

    existing_tests = cms_get("daily_practice_tests") or []
    if not isinstance(existing_tests, list):
        existing_tests = []
    existing_today = next((t for t in existing_tests if isinstance(t, dict) and t.get("date") == today_ist), None)
    if existing_today:
        if os.getenv("GITHUB_EVENT_NAME") != "workflow_dispatch":
            print(f"[SKIP] Daily NCERT Quiz for {today_ist} already published.")
            return
        print(f"[RE-RENDER] Manual run — re-rendering branded EN/HI PDFs for {today_ist} using existing 20 MCQs (0 AI calls)...")
        jr = requests.get(existing_today["jsonUrl"], timeout=25)
        jr.raise_for_status()
        all_qs = jr.json().get("questions", [])
        en_pdf = f"/tmp/ECA_Daily_NCERT_Quiz_English_{today_ist}.pdf"
        hi_pdf = f"/tmp/ECA_Daily_NCERT_Quiz_Hindi_{today_ist}.pdf"
        render_branded_pdf(all_qs, today_ist, "en", en_pdf)
        render_branded_pdf(all_qs, today_ist, "hi", hi_pdf)
        existing_today["englishPdfUrl"] = upload_to_release(en_pdf, "application/pdf")
        existing_today["hindiPdfUrl"] = upload_to_release(hi_pdf, "application/pdf")
        cms_post("daily_practice_tests", existing_tests)
        print(f"[RE-RENDER SUCCESS] Updated branded PDFs for {today_ist}")
        return

    # Load recent question titles to avoid repeats (last 5 tests)
    avoid_topics = []
    for old in existing_tests[:5]:
        try:
            if old.get("jsonUrl"):
                jr = requests.get(old["jsonUrl"], timeout=15)
                if jr.ok:
                    for q in jr.json().get("questions", []):
                        if q.get("questionEn"):
                            avoid_topics.append(q["questionEn"])
        except Exception:
            pass

    ca_ctx = fetch_recent_ca_context()

    batch1_spec = """- 3 Modern History from Class 8 & 12 NCERT (subject: "Modern History")
- 1 Ancient History from Class 6 & 11-12 NCERT (subject: "Ancient History")
- 1 Medieval History from Class 7 & 11-12 NCERT (subject: "Medieval History")
- 2 Indian Geography from Class 9 & 11 NCERT (subject: "Indian Geography")
- 1 World Geography from Class 6-11 NCERT (subject: "World Geography")
- 1 Mapping from NCERT Atlas/Maps (subject: "Mapping")
- 1 Environment & Ecology from Class 12 NCERT (subject: "Environment")"""

    batch2_spec = """- 3 Indian Polity from Class 9-11 NCERT (subject: "Polity")
- 2 Economics from Class 9-12 NCERT (subject: "Economics")
- 1 Environment & Ecology from Class 12 NCERT (subject: "Environment")
- 1 Physics from Class 6-10 NCERT Science (subject: "Physics")
- 1 Chemistry from Class 6-10 NCERT Science (subject: "Chemistry")
- 2 Biology from Class 6-12 NCERT Science/Biology (subject: "Biology")"""

    q1 = call_ai(build_batch_prompt(today_ist, batch1_spec, 10, ca_ctx, avoid_topics), 10)
    q2 = call_ai(build_batch_prompt(today_ist, batch2_spec, 10, "", avoid_topics), 10)
    if not q1 or not q2:
        raise RuntimeError(f"AI generation failed: batch1={bool(q1)} batch2={bool(q2)}")

    all_qs = q1 + q2
    for idx, q in enumerate(all_qs, 1):
        q["id"] = idx

    title = f"Daily NCERT Quiz (20 MCQs) — {today_ist}"
    json_path = f"/tmp/ECA_Daily_Test_{today_ist}.json"
    en_pdf = f"/tmp/ECA_Daily_NCERT_Quiz_English_{today_ist}.pdf"
    hi_pdf = f"/tmp/ECA_Daily_NCERT_Quiz_Hindi_{today_ist}.pdf"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"date": today_ist, "title": title, "questions": all_qs}, f, ensure_ascii=False, indent=2)

    render_branded_pdf(all_qs, today_ist, "en", en_pdf)
    render_branded_pdf(all_qs, today_ist, "hi", hi_pdf)

    json_url = upload_to_release(json_path, "application/json")
    en_pdf_url = upload_to_release(en_pdf, "application/pdf")
    hi_pdf_url = upload_to_release(hi_pdf, "application/pdf")

    new_entry = {
        "id": f"daily-test-{today_ist}",
        "date": today_ist,
        "title": title,
        "totalQuestions": len(all_qs),
        "jsonUrl": json_url,
        "englishPdfUrl": en_pdf_url,
        "hindiPdfUrl": hi_pdf_url,
    }
    updated_tests = [new_entry] + [t for t in existing_tests if t.get("date") != today_ist]
    if not cms_post("daily_practice_tests", updated_tests):
        raise RuntimeError("Failed to update daily_practice_tests in CMS")

    # Also refresh Homepage quick Daily Practice MCQs widget with today's 5 Current Affairs MCQs
    nocode = cms_get("nocode_cms")
    if isinstance(nocode, dict):
        nocode["dailyMcqs"] = [
            {
                "id": f"home-mcq-{today_ist}-{i+1}",
                "subject": q["subject"],
                "questionEn": q["questionEn"],
                "questionHi": q["questionHi"],
                "optionA": q["optionsEn"]["A"],
                "optionB": q["optionsEn"]["B"],
                "optionC": q["optionsEn"]["C"],
                "optionD": q["optionsEn"]["D"],
                "correct": q["correct"],
                "explanationEn": q["explanationEn"],
                "explanationHi": q["explanationHi"],
            }
            for i, q in enumerate(all_qs[:5])
        ]
        cms_post("nocode_cms", nocode)

    print(f"[SUCCESS] Published 25-MCQ Test + EN/HI PDFs for {today_ist}")


if __name__ == "__main__":
    main()
