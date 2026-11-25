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
    from weasyprint import HTML

    is_hi = lang == "hi"
    title = f"दैनिक NCERT क्विज़ (20 MCQs) — {date_str}" if is_hi else f"Daily NCERT Quiz (20 MCQs) — {date_str}"
    sub = "UPSC | UPPSC | BPSC | State PCS • व्याख्या सहित उत्तर कुंजी" if is_hi else "UPSC | UPPSC | BPSC | State PCS • With Detailed Explanations"
    q_blocks = []
    for q in questions:
        qtxt = html.escape(q["questionHi"] if is_hi else q["questionEn"]).replace("\n", "<br/>")
        opts = q["optionsHi"] if is_hi else q["optionsEn"]
        exp = html.escape(q["explanationHi"] if is_hi else q["explanationEn"])
        ans_lbl = "सही उत्तर" if is_hi else "Correct Answer"
        exp_lbl = "व्याख्या" if is_hi else "Explanation"
        opt_html = "".join(
            f'<div class="opt"><b>({k})</b> {html.escape(opts.get(k, ""))}</div>'
            for k in ("A", "B", "C", "D")
        )
        q_blocks.append(f"""
        <div class="qcard">
          <div class="qmeta">Q{q['id']} &bull; {html.escape(q['subject'])}</div>
          <div class="qtxt">{qtxt}</div>
          <div class="opts">{opt_html}</div>
          <div class="ans"><b>{ans_lbl}: ({q['correct']})</b> &mdash; <b>{exp_lbl}:</b> {exp}</div>
        </div>""")

    doc_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page {{
    size: A4;
    margin: 15mm 14mm 16mm 14mm;
    @bottom-left {{ content: "ETERNAL CIVIL ACADEMY • www.eternalcivilacademy.com"; font-size: 8.5pt; color: #475569; }}
    @bottom-right {{ content: "Page " counter(page) " of " counter(pages); font-size: 8.5pt; color: #475569; }}
  }}
  body {{
    font-family: 'Noto Sans Devanagari', 'Lohit Devanagari', 'DejaVu Sans', sans-serif;
    color: #0f172a;
    font-size: 10pt;
    line-height: 1.48;
  }}
  .banner {{
    background: #0B1B3D;
    color: #ffffff;
    padding: 14px 18px;
    border-radius: 10px;
    border-bottom: 4px solid #E60000;
    margin-bottom: 14px;
  }}
  .brand {{ font-size: 15pt; font-weight: 800; letter-spacing: 0.6px; }}
  .tag {{ font-size: 8.5pt; color: #cbd5e1; margin-top: 2px; }}
  .title {{ font-size: 12.5pt; font-weight: 700; color: #fde047; margin-top: 8px; }}
  .sub {{ font-size: 8.5pt; color: #e2e8f0; margin-top: 2px; }}
  .qcard {{
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 9px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }}
  .qmeta {{
    display: inline-block;
    background: #eff6ff;
    color: #0B1B3D;
    font-size: 8pt;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    margin-bottom: 5px;
  }}
  .qtxt {{ font-weight: 700; margin-bottom: 6px; }}
  .opts {{ margin-left: 6px; margin-bottom: 6px; }}
  .opt {{ margin-bottom: 2px; font-size: 9.5pt; }}
  .ans {{
    background: #fefce8;
    border-left: 3px solid #E60000;
    padding: 5px 8px;
    font-size: 9pt;
    color: #1e293b;
  }}
</style>
</head>
<body>
  <div class="banner">
    <div class="brand">ETERNAL CIVIL ACADEMY</div>
    <div class="tag">Your Success, Our Commitment &bull; www.eternalcivilacademy.com</div>
    <div class="title">{html.escape(title)}</div>
    <div class="sub">{html.escape(sub)}</div>
  </div>
  {''.join(q_blocks)}
</body>
</html>"""
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
    if any(t.get("date") == today_ist for t in existing_tests if isinstance(t, dict)):
        print(f"[SKIP] Daily 25-MCQ Test for {today_ist} already published.")
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
