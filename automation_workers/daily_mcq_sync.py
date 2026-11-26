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
BOT_SECRET = (os.getenv("BOT_API_SECRET") or "").strip()
GITHUB_TOKEN = (os.getenv("GITHUB_TOKEN") or "").strip()
REPO = (os.getenv("GITHUB_REPOSITORY") or "saumendrasingh22-boop/eternal-civil-academy-web").strip()
WEBSITE_URL = (os.getenv("WEBSITE_URL") or "https://www.eternalcivilacademy.com").strip().rstrip("/")
RELEASE_TAG = "PDFs"

GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
FORBIDDEN_SCRIPT_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
HEADERS = {"User-Agent": "Mozilla/5.0 (ECA-Daily-NCERT-3Layer-Bot)"}


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


def _clean_json_text(raw: str):
    if not raw:
        return None
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        return json.loads(s)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", s)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def validate_question_strict(q: dict) -> dict | None:
    """Layer 3: Programmatic consistency, answer-key alignment, depth, and script gate."""
    if not isinstance(q, dict):
        return None
    if has_forbidden_script(q):
        return None
    corr = str(q.get("correct", "")).strip().upper()[:1]
    if corr not in ("A", "B", "C", "D"):
        return None
    q_en = str(q.get("questionEn") or "").strip()
    q_hi = str(q.get("questionHi") or "").strip()
    if len(q_en) < 25 or len(q_hi) < 25:
        return None

    o_en = q.get("optionsEn")
    o_hi = q.get("optionsHi")
    if not isinstance(o_en, dict) or not isinstance(o_hi, dict):
        return None
    opts_en = {k: str(o_en.get(k, "")).strip() for k in ("A", "B", "C", "D")}
    opts_hi = {k: str(o_hi.get(k, "")).strip() for k in ("A", "B", "C", "D")}
    if any(not v for v in opts_en.values()) or any(not v for v in opts_hi.values()):
        return None
    if len(set(v.lower() for v in opts_en.values())) < 4:
        return None
    if len(set(v.lower() for v in opts_hi.values())) < 4:
        return None

    exp_en = str(q.get("explanationEn") or "").strip()
    exp_hi = str(q.get("explanationHi") or "").strip()
    if len(exp_en) < 160 or len(exp_hi) < 160:
        return None

    # Catch answer-key mismatch if explanation explicitly names a different option letter
    m_en = re.search(r"(?:correct\s+answer\s+is|option)\s*\(?([A-D])\)?\s*(?:is\s+correct)", exp_en, re.I)
    if m_en and m_en.group(1).upper() != corr:
        print(f"[LAYER-3 REJECT] Explanation mentions ({m_en.group(1)}) != correct ({corr})")
        return None

    return {
        "subject": str(q.get("subject") or "General Studies").strip(),
        "questionEn": q_en,
        "questionHi": q_hi,
        "optionsEn": opts_en,
        "optionsHi": opts_hi,
        "correct": corr,
        "explanationEn": exp_en,
        "explanationHi": exp_hi,
    }


def _call_gemini_raw(prompt: str, temperature: float = 0.2):
    if not GEMINI_KEY:
        return None, None
    for model in GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
            body = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temperature, "maxOutputTokens": 8192, "responseMimeType": "application/json"},
            }
            r = requests.post(url, json=body, timeout=65)
            if r.status_code == 503:
                time.sleep(4)
                r = requests.post(url, json=body, timeout=65)
            if r.ok:
                txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                parsed = _clean_json_text(txt)
                if parsed:
                    return parsed, f"gemini:{model}"
            else:
                print(f"[gemini ERR {model}] {r.status_code}: {r.text[:140]}")
        except Exception as e:
            print(f"[gemini EXC {model}] {e}")
    return None, None


def _call_groq_raw(prompt: str, temperature: float = 0.2):
    if not GROQ_KEY:
        return None, None
    for model in GROQ_MODELS:
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "temperature": temperature,
                    "max_tokens": 8192,
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=65,
            )
            if r.ok:
                txt = r.json()["choices"][0]["message"]["content"]
                parsed = _clean_json_text(txt)
                if parsed:
                    return parsed, f"groq:{model}"
            else:
                print(f"[groq ERR {model}] {r.status_code}: {r.text[:140]}")
        except Exception as e:
            print(f"[groq EXC {model}] {e}")
    return None, None


def build_layer1_prompt(date_str: str, spec: str, count: int, avoid_topics: list) -> str:
    avoid_block = "\n".join(f"- {t[:90]}" for t in avoid_topics[:40]) if avoid_topics else "None"
    return f"""You are a Senior UPSC CSE, UPPSC PCS, and BPSC Prelims Paper Setter for ETERNAL CIVIL ACADEMY.
Generate EXACTLY {count} ADVANCED, 100% FACTUALLY VERIFIED bilingual MCQs for {date_str}.

STRICT SUBJECT QUOTA (MUST MATCH EXACTLY):
{spec}

LAYER-1 ACCURACY & DEPTH MANDATE (NON-NEGOTIABLE):
1. 100% VERIFIED FACTS ONLY: Frame questions ONLY on well-established, indisputable facts from standard NCERT (Class 9-12), Constitution of India, M. Laxmikanth, Spectrum Modern India, R.S. Sharma, Satish Chandra, G.C. Leong, and standard Indian Economy/Science textbooks. NEVER guess obscure years, unverified numbers, or ambiguous dates.
2. DIFFICULTY = UPSC CSE / UPPSC / BPSC Prelims Standard. STRICTLY FORBIDDEN: Easy school trivia (Class 4-8 basics).
3. QUESTION FORMAT MIX in these {count} questions:
   - 2 Multi-Statement questions ("Consider the following statements: 1... 2... 3... Which of the statements given above is/are correct?")
   - 1 Assertion-Reason OR Chronological Order question
   - 1 Match-the-Pairs / List-I with List-II question
   - 1 High-Yield Conceptual / Analytical Prelims question
4. SINGLE UNAMBIGUOUS ANSWER: Double-check that the marked letter ("A"/"B"/"C"/"D") matches the EXACT right option in BOTH English AND Hindi (same option order A, B, C, D in both languages!).
5. DETAILED, FOUNDATIONAL EXPLANATION (MANDATORY — 6 to 8 sentences in BOTH English AND Hindi):
   - First explain the BASIC CONCEPT of the topic clearly from scratch so even a beginner understands the foundation.
   - Then explain WHY the correct option is factually right (with exact Article / Act / Year / Concept).
   - Then explicitly explain WHY each incorrect statement/trap is wrong.
   - End with 1 high-yield Prelims Revision Fact related to that topic.
6. LANGUAGE: Pure English + pure standard Devanagari Hindi (हिन्दी). ZERO Urdu/Arabic/Persian script anywhere.

RECENTLY ASKED QUESTIONS TO AVOID REPEATING:
{avoid_block}

Return ONLY valid JSON with key "questions": an array of {count} objects, each having:
subject, questionEn, questionHi, optionsEn (A,B,C,D), optionsHi (A,B,C,D), correct ("A"|"B"|"C"|"D"), explanationEn, explanationHi.
"""


def build_layer2_audit_prompt(draft_qs: list) -> str:
    payload_str = json.dumps({"questions": draft_qs}, ensure_ascii=False)
    return f"""You are the CHIEF FACT-CHECKER & INDEPENDENT AUDITOR for UPSC/UPPSC/BPSC Prelims at ETERNAL CIVIL ACADEMY.
Audit EVERY SINGLE question below with extreme strictness. Zero factual error is acceptable.

AUDIT CHECKLIST FOR EACH QUESTION:
1. FACT VERIFICATION: Verify every Constitutional Article, Amendment, Act, Year, Historical Person/Event, River/Pass/Location, Economic Definition, and Scientific Fact. If ANY fact is wrong, doubtful, or outdated, FIX it completely with 100% verified textbook facts.
2. ANSWER-KEY MATCH: Solve the question independently from scratch! Verify that "correct" ("A"|"B"|"C"|"D") matches the EXACT right option in BOTH optionsEn AND optionsHi. If there is any mismatch or ambiguity, FIX the options/correct letter so ONLY ONE option is indisputably correct.
3. TRANSLATION ALIGNMENT: Verify questionHi and optionsHi have the EXACT same meaning, negations ("correct" vs "not correct"), and option order (A, B, C, D) as English. ZERO Urdu/Arabic script.
4. EXPLANATION DEPTH: Ensure BOTH explanationEn and explanationHi are detailed (6-8 sentences), explaining: (a) basic concept from scratch, (b) why the correct option is right, (c) why wrong statements/options are wrong, and (d) key Prelims takeaway.

DRAFT QUESTIONS TO AUDIT:
{payload_str}

Return ONLY valid JSON with key "questions" containing the FULLY VERIFIED & CORRECTED array of questions (same schema: subject, questionEn, questionHi, optionsEn, optionsHi, correct, explanationEn, explanationHi).
"""


def generate_verified_batch(date_str: str, spec: str, count: int, avoid_topics: list, batch_name: str) -> list:
    prompt1 = build_layer1_prompt(date_str, spec, count, avoid_topics)
    raw1, src1 = _call_gemini_raw(prompt1, temperature=0.2)
    if not raw1:
        raw1, src1 = _call_groq_raw(prompt1, temperature=0.2)
    if not raw1 or not isinstance(raw1.get("questions"), list):
        raise RuntimeError(f"Layer-1 generation failed for {batch_name}")

    draft_qs = [q for q in raw1["questions"] if isinstance(q, dict)][:count]
    print(f"[{batch_name} LAYER-1 OK] {src1} generated {len(draft_qs)} draft Qs")

    # Layer 2: Cross-model independent fact audit (prefer opposite provider!)
    audit_prompt = build_layer2_audit_prompt(draft_qs)
    if src1 and src1.startswith("gemini:") and GROQ_KEY:
        raw2, src2 = _call_groq_raw(audit_prompt, temperature=0.1)
        if not raw2:
            raw2, src2 = _call_gemini_raw(audit_prompt, temperature=0.1)
    else:
        raw2, src2 = _call_gemini_raw(audit_prompt, temperature=0.1)
        if not raw2:
            raw2, src2 = _call_groq_raw(audit_prompt, temperature=0.1)

    audited_candidates = raw2.get("questions") if (raw2 and isinstance(raw2.get("questions"), list)) else draft_qs
    print(f"[{batch_name} LAYER-2 AUDIT] {src2 or 'fallback-layer1'} returned {len(audited_candidates)} Qs")

    # Layer 3: Strict programmatic validation
    verified = []
    for q in audited_candidates:
        vq = validate_question_strict(q)
        if vq:
            verified.append(vq)

    # Top up from Layer-1 validated items if Layer-2 dropped any
    if len(verified) < count:
        for q in draft_qs:
            if len(verified) >= count:
                break
            vq = validate_question_strict(q)
            if vq and all(vq["questionEn"][:45] != x["questionEn"][:45] for x in verified):
                verified.append(vq)

    if len(verified) < count:
        raise RuntimeError(f"{batch_name} passed only {len(verified)}/{count} after 3-layer verification")

    print(f"[{batch_name} LAYER-3 PASSED] {count}/{count} verified Qs")
    return verified[:count]


def render_branded_pdf(questions: list, date_str: str, lang: str, out_path: str):
    import base64 as _b64
    from weasyprint import HTML

    is_hi = lang == "hi"
    tag_lbl = "दैनिक NCERT क्विज़ (20 MCQs)" if is_hi else "Daily NCERT Quiz (20 MCQs)"
    title = f"दैनिक NCERT क्विज़ (20 MCQs) — {date_str}" if is_hi else f"Daily NCERT Quiz (20 MCQs) — {date_str}"
    sub = "UPSC • UPPSC • BPSC Prelims स्तर • +1 सही / -1/3 नेगेटिव मार्किंग • विस्तृत व्याख्या सहित" if is_hi else "UPSC • UPPSC • BPSC Prelims Level • +1 Correct / -1/3 Negative Marking • Detailed Explanations"

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
        exp = html.escape(q["explanationHi"] if is_hi else q["explanationEn"]).replace("\n", "<br/>")
        ans_lbl = "सही उत्तर" if is_hi else "Correct Answer"
        exp_lbl = "विस्तृत व्याख्या" if is_hi else "Detailed Explanation"
        opt_html = "".join(f'<div class="qopt"><b>({k})</b> {html.escape(opts.get(k, ""))}</div>' for k in ("A", "B", "C", "D"))
        q_blocks.append(f'<div class="qcard"><div class="qmeta">Q{q["id"]} &bull; {html.escape(q["subject"])}</div><div class="qtxt">{qtxt}</div><div class="qopts">{opt_html}</div><div class="qans"><b>{ans_lbl}: ({q["correct"]})</b><br/><b>{exp_lbl}:</b> {exp}</div></div>')

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
  font-size: 9.8pt;
  line-height: 1.48;
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
.hr-web { display: block; font-size: 8.5pt; font-weight: 700; color: #0B1B3D; text-decoration: none; margin-top: 4px; }
.mt { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 10px 0 8px 0; font-size: 8.5pt; }
.bd { background: #E60000; color: #ffffff; font-weight: 800; padding: 3px 9px; border-radius: 5px; }
.sb { background: #eef2ff; color: #3730a3; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
h1 { font-size: 14pt; color: #0B1B3D; margin: 6px 0 10px 0; line-height: 1.3; }
.wy { background: #f8fafc; border-left: 4px solid #E60000; padding: 9px 13px; border-radius: 0 8px 8px 0; margin-bottom: 12px; font-size: 9pt; }
.st { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #E60000; margin-bottom: 3px; }
.qcard {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 11px;
  background: rgba(255, 255, 255, 0.9);
  page-break-inside: avoid;
}
.qmeta { display: inline-block; background: #eef2ff; color: #3730a3; font-size: 8pt; font-weight: 800; padding: 2px 8px; border-radius: 5px; margin-bottom: 5px; }
.qtxt { font-size: 10pt; font-weight: 700; color: #0f172a; line-height: 1.45; margin-bottom: 6px; }
.qopts { margin-left: 6px; margin-bottom: 7px; }
.qopt { font-size: 9.4pt; color: #1e293b; margin-bottom: 2.5px; line-height: 1.4; }
.qans {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3.5px solid #E60000;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 8.9pt;
  color: #1e293b;
  line-height: 1.48;
}
.ft { margin-top: 16px; padding-top: 10px; border-top: 2px solid #0B1B3D; font-size: 8.5pt; color: #334155; page-break-inside: avoid; }
.ft-links { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
.ft a { color: #0B1B3D; font-weight: 700; text-decoration: none; }
.ft-copy { font-size: 8pt; color: #475569; text-align: center; font-weight: 600; }
"""

    doc_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"/><style>{css}</style></head><body>
<div class="wm">www.eternalcivilacademy.com</div>
<div class="hdr"><div class="hl"><img src="{logo_src}" class="lg"/><div><div class="br">ETERNAL CIVIL ACADEMY</div><div class="tg">Your Success, Our Commitment</div></div></div><div class="hr"><span class="hr-tag">{html.escape(tag_lbl)}</span><a href="https://www.eternalcivilacademy.com" class="hr-web">www.eternalcivilacademy.com</a></div></div>
<div class="mt"><span class="bd">UPSC / UPPSC / BPSC Level</span><span class="sb">+1 / -1/3 Negative Marking</span><b>{html.escape(date_str)}</b></div>
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
    is_manual = os.getenv("GITHUB_EVENT_NAME") == "workflow_dispatch"
    print(f"[ECA Daily NCERT Quiz 3-Layer] Starting for {today_ist} (manual={is_manual})")

    existing_tests = cms_get("daily_practice_tests") or []
    if not isinstance(existing_tests, list):
        existing_tests = []
    if not is_manual and any(t.get("date") == today_ist for t in existing_tests if isinstance(t, dict)):
        print(f"[SKIP] Daily NCERT Quiz for {today_ist} already published.")
        return

    # Collect recent questions from previous days (excluding today on manual re-run) to avoid repeats
    avoid_topics = []
    for old in existing_tests[:6]:
        if not isinstance(old, dict) or old.get("date") == today_ist:
            continue
        try:
            if old.get("jsonUrl"):
                jr = requests.get(old["jsonUrl"], timeout=15)
                if jr.ok:
                    for q in jr.json().get("questions", []):
                        if q.get("questionEn"):
                            avoid_topics.append(q["questionEn"])
        except Exception:
            pass

    # 4 focused micro-batches of 5 questions each = 20 verified MCQs
    batches = [
        ("Batch1-History", 5, """- 3 Modern History — UPSC/UPPSC/BPSC Prelims level: Acts, Constitutional development, Peasant/Tribal movements, Socio-religious reforms, Freedom struggle chronology (subject: "Modern History")
- 1 Ancient History — Advanced level: IVC, Mauryan/Gupta polity & economy, Buddhism/Jainism philosophy, Sangam/Inscriptions (subject: "Ancient History")
- 1 Medieval History — Advanced level: Delhi Sultanate/Mughal administration, Bhakti-Sufi, Vijayanagara/Maratha terms (subject: "Medieval History")"""),
        ("Batch2-GeoEnv", 5, """- 2 Indian Geography — Advanced level: Monsoon/Jet Streams, River basins/Drainage, Soils, Himalayan/Peninsular physiography, Minerals (subject: "Indian Geography")
- 1 World Geography — Advanced level: Ocean currents, Pressure belts, Plate tectonics, Climate zones, Straits/Biomes (subject: "World Geography")
- 1 Mapping — Advanced India/World Map Prelims Q: North-South/East-West order, border states, tributaries, passes, or global straits (subject: "Mapping")
- 1 Environment & Ecology — Advanced level: Biogeochemical cycles, Ecological succession, Biodiversity hotspots, Environmental Acts/Conventions (subject: "Environment")"""),
        ("Batch3-PolityEcon", 5, """- 3 Indian Polity — Advanced UPSC/UPPSC/BPSC level: Constitutional Articles, Amendments, Federalism, Parliament/Committees, Judiciary, FR vs DPSP, Constitutional vs Statutory bodies (subject: "Polity")
- 2 Economics — Advanced level: RBI Monetary Policy tools, Fiscal deficit/FRBM, BoP/Exchange rate, Inflation indices, National Income/GDP deflator, Banking/WTO concepts (subject: "Economics")"""),
        ("Batch4-EnvSci", 5, """- 1 Environment & Ecology — Advanced level: Climate protocols, Wetland/Ramsar ecology, Pollution chemistry, IUCN/WPA schedules (subject: "Environment")
- 1 Physics — Advanced applied PCS/UPSC level: Optics, Electromagnetism, Semiconductors, Nuclear/Space physics, Thermodynamics applications (subject: "Physics")
- 1 Chemistry — Advanced applied PCS/UPSC level: Polymers, Alloys, Acid-Base/Electrochemistry, Isotopes, Industrial & Everyday Chemistry (subject: "Chemistry")
- 2 Biology — Advanced NCERT/PCS level: Human physiology, Genetics/Biotechnology, Immunology/Diseases, Plant hormones/Photosynthesis, Cell biology (subject: "Biology")"""),
    ]

    all_qs = []
    for bname, cnt, spec in batches:
        qs = generate_verified_batch(today_ist, spec, cnt, avoid_topics, bname)
        all_qs.extend(qs)
        time.sleep(2)

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
    updated_tests = [new_entry] + [t for t in existing_tests if isinstance(t, dict) and t.get("date") != today_ist]
    if not cms_post("daily_practice_tests", updated_tests):
        raise RuntimeError("Failed to update daily_practice_tests in CMS")

    print(f"[SUCCESS] Published 3-Layer Verified 20-MCQ Daily NCERT Quiz + EN/HI PDFs for {today_ist}")


if __name__ == "__main__":
    main()
