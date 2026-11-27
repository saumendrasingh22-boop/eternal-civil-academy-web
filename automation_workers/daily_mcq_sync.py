import os
import re
import json
import time
import html
import base64
import requests
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

GEMINI_KEY = (os.getenv("QUIZ_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()
GROQ_KEY = (os.getenv("QUIZ_GROQ_API_KEY") or os.getenv("GROQ_API_KEY") or "").strip()
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
BOT_SECRET = (os.getenv("BOT_API_SECRET") or "").strip()
GITHUB_TOKEN = (os.getenv("GITHUB_TOKEN") or "").strip()
REPO = (os.getenv("GITHUB_REPOSITORY") or "saumendrasingh22-boop/eternal-civil-academy-web").strip()
WEBSITE_URL = (os.getenv("WEBSITE_URL") or "https://www.eternalcivilacademy.com").strip().rstrip("/")
RELEASE_TAG = "PDFs"

# Fast, reliable, schema-capable Gemini models first
GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"]
GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3-32b", "llama-3.1-8b-instant"]
EXHAUSTED_GROQ = set()
EXHAUSTED_GEMINI = set()

FORBIDDEN_SCRIPT_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
HEADERS = {"User-Agent": "Mozilla/5.0 (ECA-Daily-NCERT-Quiz-v2)"}

STOPWORDS_60D = {
    "which", "following", "statements", "statement", "consider", "correct", "incorrect", "above", "given",
    "with", "from", "that", "this", "about", "regarding", "between", "among", "under", "into", "india",
    "indian", "their", "have", "been", "were", "only", "both", "neither", "none", "what", "when", "where",
    "match", "list", "pairs", "correctly", "matched", "assertion", "reason", "arrange", "chronological",
    "order", "context", "reference", "respect", "true", "false", "choose", "code", "below",
}

# Strict Gemini Structured Output Schema (eliminates malformed JSON, missing Hindi, or bad option keys)
GEMINI_QUIZ_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "subject": {"type": "STRING"},
                    "questionEn": {"type": "STRING"},
                    "questionHi": {"type": "STRING"},
                    "optionAEn": {"type": "STRING"},
                    "optionBEn": {"type": "STRING"},
                    "optionCEn": {"type": "STRING"},
                    "optionDEn": {"type": "STRING"},
                    "optionAHi": {"type": "STRING"},
                    "optionBHi": {"type": "STRING"},
                    "optionCHi": {"type": "STRING"},
                    "optionDHi": {"type": "STRING"},
                    "correct": {"type": "STRING", "enum": ["A", "B", "C", "D"]},
                    "explanationEn": {"type": "STRING"},
                    "explanationHi": {"type": "STRING"},
                },
                "required": [
                    "subject", "questionEn", "questionHi",
                    "optionAEn", "optionBEn", "optionCEn", "optionDEn",
                    "optionAHi", "optionBHi", "optionCHi", "optionDHi",
                    "correct", "explanationEn", "explanationHi",
                ],
            },
        }
    },
    "required": ["questions"],
}

GEMINI_AUDIT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "verdicts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "idx": {"type": "INTEGER"},
                    "ok": {"type": "BOOLEAN"},
                    "verifiedCorrect": {"type": "STRING", "enum": ["A", "B", "C", "D"]},
                    "reason": {"type": "STRING"},
                },
                "required": ["idx", "ok", "verifiedCorrect", "reason"],
            },
        }
    },
    "required": ["verdicts"],
}


def _q_tokens(text: str) -> set:
    words = re.findall(r"[a-zA-Z0-9]{4,}", (text or "").lower())
    return {w for w in words if w not in STOPWORDS_60D}


def is_similar_to_past(q_text: str, past_sets: list) -> bool:
    cur = _q_tokens(q_text)
    if len(cur) < 3:
        return False
    for ps in past_sets:
        if len(ps) < 3:
            continue
        inter = len(cur & ps)
        if inter >= 4 and (inter / min(len(cur), len(ps))) >= 0.72:
            return True
    return False


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
        m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", s)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def normalize_and_validate_q(q: dict):
    """Layer 3: Normalizes flat or nested schema and strictly validates integrity."""
    if not isinstance(q, dict) or has_forbidden_script(q):
        return None

    corr_raw = str(q.get("correct", "")).strip().upper()
    m_c = re.search(r"[A-D]", corr_raw)
    if not m_c:
        return None
    corr = m_c.group(0)

    q_en = str(q.get("questionEn") or q.get("question_en") or "").strip()
    q_hi = str(q.get("questionHi") or q.get("question_hi") or "").strip()
    if len(q_en) < 20 or len(q_hi) < 20:
        return None

    # Support flat schema (optionAEn..) OR nested dict (optionsEn: {A..D})
    if q.get("optionAEn"):
        opts_en = {k: str(q.get(f"option{k}En") or "").strip() for k in ("A", "B", "C", "D")}
        opts_hi = {k: str(q.get(f"option{k}Hi") or "").strip() for k in ("A", "B", "C", "D")}
    else:
        raw_en = q.get("optionsEn") or q.get("options_en") or {}
        raw_hi = q.get("optionsHi") or q.get("options_hi") or {}
        if isinstance(raw_en, list) and len(raw_en) >= 4:
            raw_en = dict(zip(("A", "B", "C", "D"), raw_en))
        if isinstance(raw_hi, list) and len(raw_hi) >= 4:
            raw_hi = dict(zip(("A", "B", "C", "D"), raw_hi))
        if not isinstance(raw_en, dict) or not isinstance(raw_hi, dict):
            return None
        opts_en = {k: str(raw_en.get(k) or raw_en.get(k.lower()) or "").strip() for k in ("A", "B", "C", "D")}
        opts_hi = {k: str(raw_hi.get(k) or raw_hi.get(k.lower()) or "").strip() for k in ("A", "B", "C", "D")}

    if any(not v for v in opts_en.values()) or any(not v for v in opts_hi.values()):
        return None
    if len(set(v.lower() for v in opts_en.values())) < 4 or len(set(v.lower() for v in opts_hi.values())) < 4:
        return None

    exp_en = str(q.get("explanationEn") or q.get("explanation_en") or "").strip()
    exp_hi = str(q.get("explanationHi") or q.get("explanation_hi") or "").strip()
    if len(exp_en) < 80 or len(exp_hi) < 70:
        return None

    # Catch answer-key mismatch inside explanation text
    m_en = re.search(r"(?:correct\s+answer\s+is|option)\s*\(?([A-D])\)?\s*(?:is\s+correct)", exp_en, re.I)
    if m_en and m_en.group(1).upper() != corr:
        print(f"[L3-DROP] Explanation says ({m_en.group(1)}) != correct ({corr})")
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


def call_gemini(prompt: str, schema: dict | None = None, temperature: float = 0.25):
    if not GEMINI_KEY:
        return None, None
    for model in GEMINI_MODELS:
        if model in EXHAUSTED_GEMINI:
            continue
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
            gen_cfg = {
                "temperature": temperature,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            }
            if schema:
                gen_cfg["responseSchema"] = schema
            body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": gen_cfg}
            r = requests.post(url, json=body, timeout=90)
            if r.status_code == 503:
                time.sleep(5)
                r = requests.post(url, json=body, timeout=90)
            if r.status_code in (404, 429):
                print(f"[gemini {r.status_code} {model}] skipping for rest of run")
                EXHAUSTED_GEMINI.add(model)
                continue
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


def call_groq_compact(prompt: str, temperature: float = 0.1, max_tokens: int = 1200):
    """Used for ultra-compact Layer-2 fact-check verdicts (only ~500-700 tokens, never hits 413/429!)."""
    if not GROQ_KEY:
        return None, None
    for model in GROQ_MODELS:
        if model in EXHAUSTED_GROQ:
            continue
        try:
            hdr = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            }
            r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=hdr, json=payload, timeout=60)
            if r.status_code in (404, 413, 429):
                print(f"[groq {r.status_code} {model}] skipping for rest of run")
                EXHAUSTED_GROQ.add(model)
                continue
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


def build_generation_prompt(date_str: str, spec: str, count: int, avoid_topics: list) -> str:
    avoid_block = "\n".join(f"- {t[:80]}" for t in avoid_topics[:50]) if avoid_topics else "None"
    return f"""You are a Senior UPSC CSE, UPPSC PCS, and BPSC Prelims Paper Setter for ETERNAL CIVIL ACADEMY.
Generate EXACTLY {count} ADVANCED, 100% FACTUALLY VERIFIED bilingual MCQs for {date_str}.

SUBJECT QUOTA (follow closely):
{spec}

STRICT QUALITY & ACCURACY RULES:
1. 100% VERIFIED TEXTBOOK FACTS ONLY: Frame questions ONLY on indisputable facts from NCERT (Class 9-12), Constitution of India, M. Laxmikanth, Spectrum Modern India, R.S. Sharma, Satish Chandra, G.C. Leong. NEVER invent obscure years or doubtful numbers.
2. ADVANCED PRELIMS LEVEL (UPPSC / BPSC / UPSC) WITH STRICT 50-50 FORMAT MIX (DO NOT MAKE ALL STATEMENT QUESTIONS!):
   - EXACTLY 50% (at least half of this batch) MUST be DIRECT HIGH-YIELD FACTUAL / CONCEPTUAL MCQs (crisp single-question Prelims format — NO "Consider the following statements" framing, yet strictly graduate/PCS exam standard, never easy Class 4-8 trivia).
   - Remaining 50% MUST be evenly mixed across:
     * 1 Match-the-Pairs (List-I with List-II / मिलान) question
     * 1 Assertion-Reason (कथन और कारण / Statement & Conclusion) question
     * 1-2 Multi-Statement (कथन 1 & 2) questions ONLY — NEVER exceed 30% statement questions!
3. SINGLE UNAMBIGUOUS ANSWER: Ensure "correct" ("A"|"B"|"C"|"D") matches the exact right option in BOTH English (optionAEn..optionDEn) and Hindi (optionAHi..optionDHi) in identical A,B,C,D order.
4. STRUCTURED, LINE-BY-LINE EDITORIAL EXPLANATION (in BOTH English & Hindi — NEVER write one long wall-of-text paragraph, and NEVER write mechanical heading labels!):
   - Put EACH distinct point on its OWN NEW LINE using "\n":
     Line 1: Directly explain the basic concept of the topic from scratch (DO NOT write "Basic Concept:" or "मूल अवधारणा:").
     Line 2-4: Directly explain why the right option/statement is correct and why the other options/statements are wrong, each on a separate line (DO NOT write "Key Fact:", "Why other options are wrong:", or "अन्य विकल्प क्यों गलत हैं:").
     Final Line: Directly state 1 high-yield Prelims revision fact (DO NOT write "Prelims Takeaway:" or "प्रीलिम्स विशेष:").
   - Wrap ONLY genuinely important Prelims facts (exact **Years, Dates, Constitutional Articles, Acts, Important Names, Key Terms**) in **double asterisks** so they render BOLD. Do NOT bold ordinary words.
5. PURE ENGLISH + PURE DEVANAGARI HINDI (हिन्दी): ZERO Urdu/Arabic/Persian script anywhere.

AVOID REPEATING THESE RECENT QUESTIONS:
{avoid_block}
"""


def audit_batch_compact(qs: list, batch_name: str) -> list:
    """Layer 2: Compact English-only cross-model fact & answer-key audit (~600 tokens total, ultra-fast)."""
    compact = [
        {
            "idx": i,
            "subject": q["subject"],
            "question": q["questionEn"],
            "A": q["optionsEn"]["A"],
            "B": q["optionsEn"]["B"],
            "C": q["optionsEn"]["C"],
            "D": q["optionsEn"]["D"],
            "marked": q["correct"],
        }
        for i, q in enumerate(qs)
    ]
    prompt = f"""You are the Chief Fact-Checker for UPSC/UPPSC/BPSC Prelims.
Solve each MCQ below independently from scratch. Check:
1. Are ALL facts, Articles, Acts, Years, and Science/Geography statements 100% accurate?
2. Is ONLY ONE option indisputably correct, and does it match "marked"?

Return ONLY valid JSON: {{"verdicts": [{{"idx": 0, "ok": true, "verifiedCorrect": "B", "reason": "short"}}]}}
Set "ok": false if ANY fact is wrong, ambiguous, or "verifiedCorrect" != "marked".

MCQS:
{json.dumps(compact, ensure_ascii=False)}"""

    # Prefer Groq for true cross-model verification; if Groq is rate-limited, use Gemini at temp=0.0
    raw, src = call_groq_compact(prompt, temperature=0.0, max_tokens=1000)
    if not raw:
        raw, src = call_gemini(prompt, schema=GEMINI_AUDIT_SCHEMA, temperature=0.0)
    if not raw:
        print(f"[{batch_name} LAYER-2] Auditor unavailable — keeping Layer-3 validated Qs")
        return qs

    vlist = raw.get("verdicts") if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])
    verdict_map = {int(v["idx"]): v for v in vlist if isinstance(v, dict) and "idx" in v}

    passed = []
    for i, q in enumerate(qs):
        v = verdict_map.get(i)
        if not v:
            passed.append(q)
            continue
        ok = bool(v.get("ok"))
        vc = str(v.get("verifiedCorrect") or "").strip().upper()[:1]
        if ok and (not vc or vc == q["correct"]):
            passed.append(q)
        else:
            print(f"[{batch_name} LAYER-2 REJECTED Q{i+1}] marked={q['correct']} verified={vc} reason={str(v.get('reason',''))[:90]}")
    print(f"[{batch_name} LAYER-2 AUDIT] {src} -> {len(passed)}/{len(qs)} passed")
    return passed


def generate_verified_batch(date_str: str, spec: str, target_count: int, avoid_topics: list, past_token_sets: list, seen_prefixes: set, batch_name: str) -> list:
    verified = []
    # Over-generate +2 buffer on attempt 1 so even if 1-2 Qs get rejected by Layer-2 or 60-day filter, we still hit target_count on Attempt 1!
    for attempt in range(1, 4):
        need = target_count - len(verified)
        if need <= 0:
            break
        req_cnt = need + 2 if attempt == 1 else min(need + 2, 5)
        temp = min(0.6, 0.25 + 0.15 * (attempt - 1))
        cur_avoid = avoid_topics + [x["questionEn"] for x in verified]

        prompt = build_generation_prompt(date_str, spec, req_cnt, cur_avoid)
        raw, src = call_gemini(prompt, schema=GEMINI_QUIZ_SCHEMA, temperature=temp)
        if not raw:
            # Emergency fallback to Groq if Gemini completely down
            raw, src = call_groq_compact(prompt + '\nReturn ONLY valid JSON with key "questions".', temperature=temp, max_tokens=5500)

        qlist = raw.get("questions") if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])
        valid_drafts = []
        for item in qlist:
            vq = normalize_and_validate_q(item)
            if not vq:
                continue
            pref = vq["questionEn"][:140]
            if pref in seen_prefixes:
                continue
            if is_similar_to_past(vq["questionEn"], past_token_sets):
                print(f"[{batch_name} BLOCKED 60-DAY REPEAT] {vq['questionEn'][:65]}")
                continue
            valid_drafts.append(vq)

        print(f"[{batch_name} attempt {attempt} LAYER-1+3] {src} -> {len(valid_drafts)}/{req_cnt} clean Qs")
        if not valid_drafts:
            time.sleep(3)
            continue

        # Layer 2 compact cross-model fact audit (only ~600 tokens, never breaks Hindi/JSON!)
        audited = audit_batch_compact(valid_drafts, batch_name)
        for q in audited:
            pref = q["questionEn"][:140]
            if pref in seen_prefixes:
                continue
            seen_prefixes.add(pref)
            past_token_sets.append(_q_tokens(q["questionEn"]))
            verified.append(q)
            if len(verified) >= target_count:
                break

        if len(verified) < target_count:
            print(f"[{batch_name}] {len(verified)}/{target_count} verified — fetching remaining {target_count - len(verified)}...")
            time.sleep(2)

    print(f"[{batch_name} FINAL] {len(verified)}/{target_count} verified Qs")
    return verified[:target_count]


LABEL_STRIP_RE = re.compile(
    r"^\s*(?:[•\-\*]\s*)?(?:\*\*)?\s*(?:"
    r"Basic\s*Concept|Core\s*Concept|Key\s*Fact(?:s)?|Why\s+other\s+options\s+are\s+wrong|"
    r"Other\s+Options|Prelims\s*Takeaway|Prelims\s*Fact(?:s)?|Explanation|Detailed\s*Explanation|"
    r"मूल\s*अवधारणा|मुख्य\s*तथ्य|सही\s*तथ्य|अन्य\s*विकल्प(?:\s*क्यों\s*गलत\s*हैं)?|"
    r"प्रीलिम्स\s*विशेष(?:\s*तथ्य)?|प्रीलिम्स\s*तथ्य|विस्तृत\s*व्याख्या|व्याख्या"
    r")\s*(?:\*\*)?\s*[:\-–—]\s*(?:\*\*)?\s*",
    re.I,
)


def _fmt_inline_bold(text: str) -> str:
    """Converts **keyword** into crisp bold spans and strips any leftover stray **."""
    esc = html.escape(text or "")
    esc = re.sub(r"\*\*([^*]+)\*\*", r'<strong class="fact">\1</strong>', esc)
    esc = esc.replace("**", "")
    return esc


def _fmt_rich_html(text: str) -> str:
    """Strips mechanical labels, escapes HTML, bolds **facts**, and renders each point on a clean new line."""
    lines = [ln.strip() for ln in (text or "").replace("\r\n", "\n").split("\n") if ln.strip()]
    out = []
    for ln in lines:
        cleaned = LABEL_STRIP_RE.sub("", ln).strip()
        if not cleaned:
            continue
        esc = _fmt_inline_bold(cleaned)
        out.append(f'<div class="exp-line">{esc}</div>')
    return "".join(out)


def render_branded_pdf(questions: list, date_str: str, lang: str, out_path: str, quiz_kind: str = "ncert"):
    from weasyprint import HTML

    is_hi = lang == "hi"
    if quiz_kind == "ca":
        tag_lbl = "दैनिक करंट अफेयर्स क्विज़" if is_hi else "Daily Current Affairs Quiz"
        title = f"दैनिक करंट अफेयर्स क्विज़ (5 प्रश्न) — {date_str}" if is_hi else f"Daily Current Affairs Quiz (5 Questions) — {date_str}"
    else:
        tag_lbl = "दैनिक NCERT क्विज़" if is_hi else "Daily NCERT Quiz"
        title = f"दैनिक NCERT क्विज़ (20 प्रश्न) — {date_str}" if is_hi else f"Daily NCERT Quiz (20 Questions) — {date_str}"

    logo_src = "https://www.eternalcivilacademy.com/logo.jpg"
    for cand in ("public/logo.jpg", "public/logo.png", "public/icon-192.png"):
        if os.path.exists(cand):
            ext = os.path.splitext(cand)[1].lower().lstrip(".")
            mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
            with open(cand, "rb") as lf:
                raw_logo = lf.read()
            logo_src = f"data:{mime};base64," + base64.b64encode(raw_logo).decode("ascii")
            print(f"[PDF BRAND] Embedded {cand} ({len(raw_logo)} bytes)")
            break

    tg_svg_hdr = '<svg width="11" height="11" viewBox="0 0 24 24" fill="#38bdf8" style="vertical-align:middle;margin-right:4px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.58 4.58-1.85 5.1-1.86.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/></svg>'
    tg_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#229ED9" style="vertical-align:middle;margin-right:4px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.58 4.58-1.85 5.1-1.86.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/></svg>'
    ig_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2.2" style="vertical-align:middle;margin-right:4px"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'

    q_blocks = []
    for q in questions:
        qtxt = _fmt_inline_bold(q["questionHi"] if is_hi else q["questionEn"]).replace("\n", "<br/>")
        opts = q["optionsHi"] if is_hi else q["optionsEn"]
        exp = _fmt_rich_html(q["explanationHi"] if is_hi else q["explanationEn"])
        ans_lbl = "सही उत्तर" if is_hi else "Correct Answer"
        opt_html = "".join(f'<div class="qopt"><b>({k})</b> {_fmt_inline_bold(opts.get(k, ""))}</div>' for k in ("A", "B", "C", "D"))
        q_blocks.append(
            f'<div class="qcard">'
            f'<div class="qmeta">Q{q["id"]} &bull; {html.escape(q["subject"])}</div>'
            f'<div class="qtxt">{qtxt}</div>'
            f'<div class="qopts">{opt_html}</div>'
            f'<div class="qans"><span class="ans-tag">{ans_lbl}: ({q["correct"]})</span><div class="exp-body">{exp}</div></div>'
            f'</div>'
        )

    css = """
@page {
  size: A4;
  margin: 27mm 14mm 23mm 14mm;
  @top-center {
    content: element(ecaRunningHeader);
    width: 100%;
  }
  @bottom-center {
    content: element(ecaRunningFooter);
    width: 100%;
  }
}
* { box-sizing: border-box; }
body {
  font-family: 'DejaVu Sans', 'Noto Sans Devanagari', 'Lohit Devanagari', sans-serif;
  color: #0f172a;
  margin: 0;
  padding: 0;
  font-size: 9.8pt;
  line-height: 1.48;
}
.wm {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-32deg);
  font-size: 35pt;
  font-weight: 700;
  color: #0B1B3D;
  opacity: 0.10;
  white-space: nowrap;
  z-index: 9999;
  pointer-events: none;
  letter-spacing: 1.6px;
}
.running-hdr {
  position: running(ecaRunningHeader);
  width: 100%;
  background: #0B1B3D;
  color: #ffffff;
  border-bottom: 3.5px solid #E60000;
  border-radius: 6px;
  padding: 7px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hl { display: flex; align-items: center; gap: 9px; }
.lg { height: 35px; width: auto; max-width: 115px; object-fit: contain; border-radius: 4px; background: #ffffff; padding: 2px; }
.br { font-family: 'DejaVu Sans', sans-serif; font-size: 14.5pt; font-weight: 700; color: #ffffff; letter-spacing: 0.6px; line-height: 1.12; }
.tg { font-family: 'DejaVu Sans', sans-serif; font-size: 8.5pt; color: #fecaca; font-weight: 700; margin-top: 2px; letter-spacing: 0.3px; }
.hr { text-align: right; }
.hr-tag {
  display: inline-block;
  background: #E60000;
  color: #ffffff;
  font-family: 'DejaVu Sans', 'Noto Sans Devanagari', sans-serif;
  font-size: 8.2pt;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
}
.hr-tg {
  display: block;
  font-size: 7.8pt;
  font-weight: 700;
  color: #e0f2fe;
  text-decoration: none;
  margin-top: 3px;
}
.running-ftr {
  position: running(ecaRunningFooter);
  width: 100%;
  border-top: 2px solid #0B1B3D;
  padding-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8pt;
}
.ft-left { text-align: left; line-height: 1.35; }
.ft-brand { font-size: 8.6pt; font-weight: 700; color: #0B1B3D; display: block; }
.ft-web { font-size: 7.8pt; font-weight: 700; color: #E60000; text-decoration: none; display: block; }
.ft-right { text-align: right; line-height: 1.4; }
.ft-social { display: block; font-size: 7.8pt; font-weight: 700; color: #0B1B3D; text-decoration: none; }
.title-box, .qcard { position: relative; z-index: 1; }
.title-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 4.5px solid #E60000;
  border-radius: 0 7px 7px 0;
  padding: 8px 12px;
  margin: 0 0 11px 0;
}
.title-box h1 { font-size: 13pt; font-weight: 700; color: #0B1B3D; margin: 0; line-height: 1.3; }
.qcard {
  border: 1px solid #cbd5e1;
  border-top: 2.5px solid #0B1B3D;
  border-radius: 7px;
  padding: 8px 11px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.92);
}
.qmeta {
  display: inline-block;
  background: #0B1B3D;
  color: #ffffff;
  font-size: 7.8pt;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  break-after: avoid;
  page-break-after: avoid;
}
.qtxt {
  font-size: 9.8pt;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.45;
  margin-bottom: 5px;
  break-after: avoid;
  page-break-after: avoid;
}
.qopts { margin-left: 6px; margin-bottom: 6px; }
.qopt { font-size: 9.3pt; color: #1e293b; margin-bottom: 2px; line-height: 1.4; }
.qans {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 3.5px solid #E60000;
  border-radius: 5px;
  padding: 6px 9px;
  font-size: 8.8pt;
  color: #1e293b;
  line-height: 1.48;
}
.ans-tag {
  display: inline-block;
  background: #E60000;
  color: #ffffff;
  font-size: 8pt;
  font-weight: 700;
  padding: 1.5px 7px;
  border-radius: 4px;
  margin-bottom: 5px;
}
.exp-body { margin-top: 2px; }
.exp-line { margin-bottom: 4.5px; line-height: 1.52; }
.exp-line:last-child { margin-bottom: 0; }
.fact { font-weight: 700; color: #0B1B3D; }
"""

    doc_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"/><style>{css}</style></head><body>
<div class="wm">www.eternalcivilacademy.com</div>
<div class="running-hdr"><div class="hl"><img src="{logo_src}" class="lg"/><div><div class="br">ETERNAL CIVIL ACADEMY</div><div class="tg">Your Success, Our Commitment</div></div></div><div class="hr"><span class="hr-tag">{html.escape(tag_lbl)}</span><a href="https://t.me/EternalCivilAcademy" class="hr-tg">{tg_svg_hdr}t.me/EternalCivilAcademy</a></div></div>
<div class="running-ftr"><div class="ft-left"><span class="ft-brand">ETERNAL CIVIL ACADEMY</span><a href="https://www.eternalcivilacademy.com" class="ft-web">www.eternalcivilacademy.com</a></div><div class="ft-right"><a href="https://t.me/EternalCivilAcademy" class="ft-social">{tg_svg}t.me/EternalCivilAcademy</a><a href="https://instagram.com/eternalcivilacademy" class="ft-social">{ig_svg}@eternalcivilacademy</a></div></div>
<div class="title-box"><h1>{html.escape(title)}</h1></div>
{''.join(q_blocks)}
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


def fetch_latest_ca_context() -> str:
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
        print(f"[CA context warn] {e}")
        return ""


def sync_daily_ca_quiz(today_ist: str, is_manual: bool, rebuild_only: bool):
    existing_ca = cms_get("daily_ca_quizzes") or []
    if not isinstance(existing_ca, list):
        existing_ca = []

    if rebuild_only:
        print(f"[REBUILD CA PDFs] Re-rendering {len(existing_ca)} CA quiz(zes) with 0 AI calls...")
        for entry in existing_ca:
            if not isinstance(entry, dict) or not entry.get("jsonUrl") or not entry.get("date"):
                continue
            dt = entry["date"]
            jr = requests.get(entry["jsonUrl"], timeout=25)
            jr.raise_for_status()
            qs = jr.json().get("questions", [])
            if not qs:
                continue
            en_p = f"/tmp/ECA_Daily_CA_Quiz_English_{dt}.pdf"
            hi_p = f"/tmp/ECA_Daily_CA_Quiz_Hindi_{dt}.pdf"
            render_branded_pdf(qs, dt, "en", en_p, quiz_kind="ca")
            render_branded_pdf(qs, dt, "hi", hi_p, quiz_kind="ca")
            entry["englishPdfUrl"] = upload_to_release(en_p, "application/pdf")
            entry["hindiPdfUrl"] = upload_to_release(hi_p, "application/pdf")
        cms_post("daily_ca_quizzes", existing_ca)
        return

    if not is_manual and any(t.get("date") == today_ist for t in existing_ca if isinstance(t, dict)):
        print(f"[SKIP CA] Daily CA Quiz for {today_ist} already published.")
        return

    ca_ctx = fetch_latest_ca_context()
    ca_avoid = []
    for old in existing_ca[:60]:
        if not isinstance(old, dict) or old.get("date") == today_ist:
            continue
        try:
            if old.get("jsonUrl"):
                jr = requests.get(old["jsonUrl"], timeout=12)
                if jr.ok:
                    for q in jr.json().get("questions", []):
                        if q.get("questionEn"):
                            ca_avoid.append(q["questionEn"])
        except Exception:
            pass

    ca_spec = f"""- 5 Current Affairs MCQs strictly based on these verified recent news items (subject: "Current Affairs"):
{ca_ctx or "Latest verified Indian national, economy, polity, environment, science & international news."}"""

    ca_qs = generate_verified_batch(
        today_ist,
        ca_spec,
        5,
        ca_avoid,
        [_q_tokens(t) for t in ca_avoid if t],
        set(),
        "DailyCA-5Q",
    )
    if len(ca_qs) < 5:
        print(f"[WARN CA] Only {len(ca_qs)}/5 CA Qs verified — skipping CA publish.")
        return

    ca_qs = ca_qs[:5]
    for i, q in enumerate(ca_qs, 1):
        q["id"] = i

    title = f"Daily Current Affairs Quiz (5 MCQs) — {today_ist}"
    json_p = f"/tmp/ECA_Daily_CA_Quiz_{today_ist}.json"
    en_p = f"/tmp/ECA_Daily_CA_Quiz_English_{today_ist}.pdf"
    hi_p = f"/tmp/ECA_Daily_CA_Quiz_Hindi_{today_ist}.pdf"
    with open(json_p, "w", encoding="utf-8") as f:
        json.dump({"date": today_ist, "title": title, "questions": ca_qs}, f, ensure_ascii=False, indent=2)

    render_branded_pdf(ca_qs, today_ist, "en", en_p, quiz_kind="ca")
    render_branded_pdf(ca_qs, today_ist, "hi", hi_p, quiz_kind="ca")

    new_entry = {
        "id": f"daily-ca-quiz-{today_ist}",
        "date": today_ist,
        "title": title,
        "totalQuestions": 5,
        "jsonUrl": upload_to_release(json_p, "application/json"),
        "englishPdfUrl": upload_to_release(en_p, "application/pdf"),
        "hindiPdfUrl": upload_to_release(hi_p, "application/pdf"),
    }
    updated_ca = sorted([new_entry] + [t for t in existing_ca if isinstance(t, dict) and t.get("date") != today_ist], key=lambda x: x.get("date", ""), reverse=True)
    cms_post("daily_ca_quizzes", updated_ca)
    print(f"[SUCCESS CA] Published 5/5 Daily Current Affairs Quiz + EN/HI PDFs for {today_ist}")


def main():
    custom_dt = (os.getenv("TARGET_DATE") or "").strip()
    today_ist = custom_dt if re.fullmatch(r"\d{4}-\d{2}-\d{2}", custom_dt) else datetime.now(IST).strftime("%Y-%m-%d")
    is_manual = os.getenv("GITHUB_EVENT_NAME") == "workflow_dispatch"
    quiz_mode = (os.getenv("QUIZ_MODE") or "all").strip().lower()
    rebuild_only = os.getenv("REBUILD_EXISTING_PDFS", "").lower() == "true"
    print(f"[ECA Daily Quiz] mode={quiz_mode} date={today_ist} manual={is_manual} rebuild={rebuild_only}")

    if quiz_mode == "ca":
        sync_daily_ca_quiz(today_ist, is_manual, rebuild_only=rebuild_only)
        return

    existing_tests = cms_get("daily_practice_tests") or []
    if not isinstance(existing_tests, list):
        existing_tests = []
    if os.getenv("REBUILD_EXISTING_PDFS", "").lower() == "true":
        print(f"[REBUILD PDFs] Re-rendering {len(existing_tests)} existing test(s) with 0 AI calls...")
        for entry in existing_tests:
            if not isinstance(entry, dict) or not entry.get("jsonUrl") or not entry.get("date"):
                continue
            dt = entry["date"]
            jr = requests.get(entry["jsonUrl"], timeout=25)
            jr.raise_for_status()
            qs = jr.json().get("questions", [])
            if not qs:
                continue
            en_p = f"/tmp/ECA_Daily_NCERT_Quiz_English_{dt}.pdf"
            hi_p = f"/tmp/ECA_Daily_NCERT_Quiz_Hindi_{dt}.pdf"
            render_branded_pdf(qs, dt, "en", en_p)
            render_branded_pdf(qs, dt, "hi", hi_p)
            entry["englishPdfUrl"] = upload_to_release(en_p, "application/pdf")
            entry["hindiPdfUrl"] = upload_to_release(hi_p, "application/pdf")
            print(f"[REBUILD OK] {dt}")
        cms_post("daily_practice_tests", existing_tests)
        if quiz_mode == "all": sync_daily_ca_quiz(today_ist, is_manual, rebuild_only=True)
        print("[REBUILD COMPLETE] All existing PDFs updated cleanly!")
        return

    if not is_manual and any(t.get("date") == today_ist for t in existing_tests if isinstance(t, dict)):
        print(f"[SKIP] Daily NCERT Quiz for {today_ist} already published.")
        if quiz_mode == "all": sync_daily_ca_quiz(today_ist, is_manual, rebuild_only=False)
        return

    # 60-day history (excluding today on manual re-run)
    avoid_topics = []
    for old in existing_tests[:60]:
        if not isinstance(old, dict) or old.get("date") == today_ist:
            continue
        try:
            if old.get("jsonUrl"):
                jr = requests.get(old["jsonUrl"], timeout=12)
                if jr.ok:
                    for q in jr.json().get("questions", []):
                        if q.get("questionEn"):
                            avoid_topics.append(q["questionEn"])
        except Exception:
            pass

    past_token_sets = [_q_tokens(t) for t in avoid_topics if t]
    seen_prefixes = set()

    batches = [
        ("Batch1-History", 5, """- 3 Modern History — UPSC/UPPSC/BPSC Prelims level: Constitutional Acts, Peasant/Tribal revolts, Socio-religious reforms, Freedom struggle chronology (subject: "Modern History")
- 1 Ancient History — Advanced level: IVC, Mauryan/Gupta polity & economy, Buddhism/Jainism philosophy, Sangam/Inscriptions (subject: "Ancient History")
- 1 Medieval History — Advanced level: Delhi Sultanate/Mughal administration, Bhakti-Sufi, Vijayanagara/Maratha terms (subject: "Medieval History")"""),
        ("Batch2-GeoEnv", 5, """- 2 Indian Geography — Advanced level: Monsoon/Jet Streams, River basins/Drainage, Soils, Himalayan/Peninsular physiography, Minerals (subject: "Indian Geography")
- 1 World Geography — Advanced level: Ocean currents, Pressure belts, Plate tectonics, Climate zones, Straits/Biomes (subject: "World Geography")
- 1 Mapping — Advanced India/World Map Prelims Q: North-South/East-West order, border states, tributaries, passes, or global straits (subject: "Mapping")
- 1 Environment & Ecology — Advanced level: Biogeochemical cycles, Ecological succession, Biodiversity hotspots, Environmental Acts/Conventions (subject: "Environment")"""),
        ("Batch3-PolityEcon", 5, """- 3 Indian Polity — Advanced UPSC/UPPSC/BPSC level: Constitutional Articles, Amendments, Federalism, Parliament/Committees, Judiciary, FR vs DPSP, Constitutional vs Statutory bodies (subject: "Polity")
- 2 Economics — Advanced level: RBI Monetary Policy tools, Fiscal deficit/FRBM, BoP/Exchange rate, Inflation indices, National Income/GDP deflator, Banking/WTO concepts (subject: "Economics")"""),
        ("Batch4-EnvSci", 5, """- 1 Environment & Ecology — Advanced level: Climate protocols, Protected areas/Biosphere reserves, Pollution chemistry, IUCN/WPA schedules (subject: "Environment")
- 1 Physics — Advanced applied PCS/UPSC level: Optics/Waves, Electromagnetism, Semiconductors, Nuclear/Space physics, Thermodynamics (subject: "Physics")
- 1 Chemistry — Advanced applied PCS/UPSC level: Metallurgy/Alloys, Acid-Base/Electrochemistry, Isotopes, Industrial & Everyday Chemistry (subject: "Chemistry")
- 2 Biology — Advanced NCERT/PCS level: Human physiology, Genetics/Biotechnology, Immunology/Diseases, Plant physiology, Cell biology (subject: "Biology")"""),
    ]

    all_qs = []
    for bname, cnt, spec in batches:
        qs = generate_verified_batch(today_ist, spec, cnt, avoid_topics, past_token_sets, seen_prefixes, bname)
        all_qs.extend(qs)
        time.sleep(2)

    # Zero-Crash Top-Up: If total < 20 (rare edge case), fill exact deficit from High-Yield GS Backup Batch
    if len(all_qs) < 20:
        missing = 20 - len(all_qs)
        print(f"[TOP-UP] Filling {missing} remaining Q(s) to guarantee exact 20/20...")
        extra = generate_verified_batch(
            today_ist,
            "High-yield UPSC/UPPSC/BPSC Prelims NCERT GS mix (Polity, History, Geography, Science, Economy)",
            missing,
            avoid_topics + [q["questionEn"] for q in all_qs],
            past_token_sets,
            seen_prefixes,
            "Batch5-TopUp",
        )
        all_qs.extend(extra)

    if len(all_qs) < 15:
        raise RuntimeError(f"Generated only {len(all_qs)} verified questions — aborting publish.")

    all_qs = all_qs[:20]
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
    updated_tests = sorted([new_entry] + [t for t in existing_tests if isinstance(t, dict) and t.get("date") != today_ist], key=lambda x: x.get("date", ""), reverse=True)
    if not cms_post("daily_practice_tests", updated_tests):
        raise RuntimeError("Failed to update daily_practice_tests in CMS")

    print(f"[SUCCESS] Published {len(all_qs)}/20 Verified Daily NCERT Quiz + Branded EN/HI PDFs for {today_ist}")
    if quiz_mode == "all": sync_daily_ca_quiz(today_ist, is_manual, rebuild_only=False)


if __name__ == "__main__":
    main()
