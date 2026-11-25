import hashlib
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from html import unescape
import requests

IST = timezone(timedelta(hours=5, minutes=30))
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

def clean_url(raw: str) -> str:
    m = re.search(r"https?://[^\s\)\]\'\"<>]+", raw or "")
    return m.group(0).rstrip("/") if m else ""

SUPABASE_URL = clean_url(os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "")
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
WEBSITE_API = clean_url(os.getenv("ECA_WEBSITE_API_URL") or "")
BOT_SECRET = (os.getenv("BOT_API_SECRET") or "").strip()
GEMINI_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GROQ_KEY = (os.getenv("GROQ_API_KEY") or "").strip()

MAX_NATIONAL_PER_RUN = 5
MAX_STATE_PER_RUN = 4
AI_PACE_SECONDS = 4.5

NATIONAL_FEEDS = [
    {"url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/national/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/international/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/business/feed/", "section": "daily_ca", "gs": "GS-3"},
    {"url": "https://ddnews.gov.in/en/feed/", "section": "daily_ca", "gs": "GS-2"},
]

STATE_FEEDS = {
    "Uttar Pradesh": ["https://news.google.com/rss/search?q=Uttar+Pradesh+government+scheme+policy+OR+UPPSC&hl=en-IN&gl=IN&ceid=IN:en"],
    "Bihar": ["https://news.google.com/rss/search?q=Bihar+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
    "Rajasthan": ["https://news.google.com/rss/search?q=Rajasthan+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
    "Madhya Pradesh": ["https://news.google.com/rss/search?q=Madhya+Pradesh+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
    "Haryana": ["https://news.google.com/rss/search?q=Haryana+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
    "Jharkhand": ["https://news.google.com/rss/search?q=Jharkhand+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
    "Uttarakhand": ["https://news.google.com/rss/search?q=Uttarakhand+government+scheme+policy+cabinet&hl=en-IN&gl=IN&ceid=IN:en"],
}

EXHAUSTED_GEMINI_MODELS = set()
ACTIVE_GEMINI_MODELS = []
AI_ERROR_COUNT = 0

def strip_html(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", text or ""))).strip()

def make_slug(prefix: str, title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")[:60]
    h = hashlib.md5((title or "").encode("utf-8")).hexdigest()[:6]
    p = re.sub(r"[^a-z0-9]+", "-", (prefix or "ca").lower()).strip("-")[:12]
    return f"{p}-{base}-{h}"

def detect_scheme(title: str) -> bool:
    t = (title or "").lower()
    return any(k in t for k in ["yojana", "scheme", "mission", "abhiyan", "programme", "program", "policy"])

def detect_gs(title: str, desc: str, fallback: str) -> str:
    txt = f"{title} {desc}".lower()
    if any(k in txt for k in ["rbi", "gdp", "economy", "inflation", "isro", "space", "climate", "environment", "ai ", "cyber", "budget"]):
        return "GS-3"
    if any(k in txt for k in ["heritage", "culture", "history", "unesco", "monument", "society"]):
        return "GS-1"
    if any(k in txt for k in ["ethics", "integrity", "lokpal", "corruption"]):
        return "GS-4"
    return fallback

def fetch_existing_slugs() -> set:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/current_affairs?select=slug&order=created_at.desc&limit=400",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            timeout=15,
        )
        if r.ok:
            return {row.get("slug", "") for row in r.json() if row.get("slug")}
    except Exception as e:
        print(f"[warn] fetch_existing_slugs: {e}")
    return set()

def fetch_rss_items(url: str, limit: int = 4):
    out = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=18)
        if not r.ok:
            return out
        root = ET.fromstring(r.content)
        for item in root.findall(".//item")[:limit]:
            title = strip_html(item.findtext("title") or "")
            desc = strip_html(item.findtext("description") or "")
            link = (item.findtext("link") or "").strip()
            if len(title) >= 18:
                out.append((title, desc[:900], link))
    except Exception as e:
        print(f"[rss skip] {url[:60]} -> {e}")
    return out

def discover_gemini_models():
    global ACTIVE_GEMINI_MODELS
    if not GEMINI_KEY:
        return []
    try:
        r = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_KEY}", timeout=15)
        if r.ok:
            models = []
            for m in r.json().get("models", []):
                name = (m.get("name") or "").replace("models/", "")
                methods = m.get("supportedGenerationMethods") or []
                if "generateContent" in methods and "flash" in name and "tts" not in name and "image" not in name:
                    models.append(name)
            models.sort(key=lambda x: (0 if "lite" in x else 1, x))
            ACTIVE_GEMINI_MODELS = models[:4]
            print(f"[gemini] Discovered models: {ACTIVE_GEMINI_MODELS}")
    except Exception as e:
        print(f"[gemini discover err] {e}")
    if not ACTIVE_GEMINI_MODELS:
        ACTIVE_GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"]
    return ACTIVE_GEMINI_MODELS

def build_prompt(title: str, desc: str, state_name):
    ctx = f"State: {state_name}\n" if state_name else ""
    return (
        "You are a senior UPSC & State PCS editor for ETERNAL CIVIL ACADEMY. "
        "Convert this news item into STRICT bilingual (pure English + pure Hindi) exam notes. "
        "Return ONLY valid JSON with these exact keys: "
        "title_en, title_hi, why_in_news, why_in_news_hi, key_highlights (array of 4 strings), "
        "key_highlights_hi (array of 4 strings), prelims_facts (array of 3 strings), "
        "prelims_facts_hi (array of 3 strings), mains_perspective, mains_perspective_hi. "
        "Rules: Use **bold** for key terms. Hindi fields must be pure Devanagari Hindi (keep English exam acronyms in brackets if needed). "
        f"\n{ctx}Headline: {title}\nSummary: {desc}"
    )

def parse_json_payload(raw_text: str):
    if not raw_text:
        return None
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.I)
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        return None
    data = json.loads(m.group(0))
    req_keys = ["title_en", "title_hi", "why_in_news", "why_in_news_hi", "key_highlights", "key_highlights_hi", "prelims_facts", "prelims_facts_hi"]
    if not all(data.get(k) for k in req_keys):
        return None
    if not re.search(r"[\u0900-\u097F]", str(data.get("title_hi", ""))):
        return None
    return data

def call_gemini(prompt: str):
    global AI_ERROR_COUNT
    if not GEMINI_KEY:
        return None
    for model in ACTIVE_GEMINI_MODELS:
        if model in EXHAUSTED_GEMINI_MODELS:
            continue
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.25, "responseMimeType": "application/json"},
                },
                timeout=30,
            )
            if r.status_code == 429:
                print(f"[gemini 429] {model} quota exhausted - skipping for rest of run")
                EXHAUSTED_GEMINI_MODELS.add(model)
                AI_ERROR_COUNT += 1
                continue
            if r.ok:
                txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                parsed = parse_json_payload(txt)
                if parsed:
                    return parsed
            else:
                print(f"[gemini ERR {model}] {r.status_code}: {r.text[:160]}")
                AI_ERROR_COUNT += 1
        except Exception as e:
            print(f"[gemini EXC {model}] {e}")
            AI_ERROR_COUNT += 1
    return None

def call_groq(prompt: str):
    global AI_ERROR_COUNT
    if not GROQ_KEY:
        return None
    for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "temperature": 0.25,
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=30,
            )
            if r.ok:
                txt = r.json()["choices"][0]["message"]["content"]
                parsed = parse_json_payload(txt)
                if parsed:
                    print(f"[groq OK] {model}")
                    return parsed
            else:
                print(f"[groq ERR {model}] {r.status_code}: {r.text[:160]}")
                AI_ERROR_COUNT += 1
        except Exception as e:
            print(f"[groq EXC {model}] {e}")
            AI_ERROR_COUNT += 1
    return None

def save_article(payload: dict) -> bool:
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            r = requests.post(
                f"{SUPABASE_URL}/rest/v1/current_affairs?on_conflict=slug",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                },
                json=[payload],
                timeout=20,
            )
            if r.ok:
                return True
            print(f"[supabase ERR] {r.status_code}: {r.text[:180]}")
        except Exception as e:
            print(f"[supabase EXC] {e}")
    if WEBSITE_API and BOT_SECRET:
        try:
            r = requests.post(
                WEBSITE_API,
                headers={"Authorization": f"Bearer {BOT_SECRET}", "Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]},
                json={"table": "current_affairs", "payload": payload},
                timeout=20,
            )
            return r.ok
        except Exception as e:
            print(f"[api EXC] {e}")
    return False

def process_item(title, desc, section, gs_tag, state_name, existing_slugs):
    slug = make_slug(state_name or "ca", title)
    if slug in existing_slugs:
        return False
    prompt = build_prompt(title, desc, state_name)
    data = call_gemini(prompt)
    if not data:
        data = call_groq(prompt)
    if not data:
        return False

    today_ist = datetime.now(IST).strftime("%Y-%m-%d")
    payload = {
        "slug": slug,
        "section_type": section,
        "state_name": state_name,
        "exam_relevance": gs_tag,
        "title": data["title_en"],
        "why_in_news": data["why_in_news"],
        "key_highlights": data["key_highlights"],
        "prelims_facts": data["prelims_facts"],
        "mains_perspective": data.get("mains_perspective") or "",
        "title_hi": data["title_hi"],
        "why_in_news_hi": data["why_in_news_hi"],
        "key_highlights_hi": data["key_highlights_hi"],
        "prelims_facts_hi": data["prelims_facts_hi"],
        "mains_perspective_hi": data.get("mains_perspective_hi") or "",
        "published_date": today_ist,
        "is_locked": False,
    }
    if save_article(payload):
        existing_slugs.add(slug)
        print(f"[SYNCED OK] {today_ist} | {data['title_en'][:65]}")
        return True
    return False

def run():
    print("[ETERNAL CIVIL ACADEMY] Smart Quota-Safe Auto-Sync Starting...")
    discover_gemini_models()
    existing_slugs = fetch_existing_slugs()
    print(f"[db] Existing articles cached for dedup: {len(existing_slugs)}")

    nat_count = 0
    st_count = 0

    for feed in NATIONAL_FEEDS:
        if nat_count >= MAX_NATIONAL_PER_RUN:
            break
        for title, desc, _ in fetch_rss_items(feed["url"], limit=4):
            if nat_count >= MAX_NATIONAL_PER_RUN:
                break
            sec = "central_scheme" if detect_scheme(title) else feed["section"]
            gs = detect_gs(title, desc, feed["gs"])
            if process_item(title, desc, sec, gs, None, existing_slugs):
                nat_count += 1
                time.sleep(AI_PACE_SECONDS)

    for state_name, urls in STATE_FEEDS.items():
        if st_count >= MAX_STATE_PER_RUN:
            break
        for u in urls:
            for title, desc, _ in fetch_rss_items(u, limit=2):
                if st_count >= MAX_STATE_PER_RUN:
                    break
                sec = "state_scheme" if detect_scheme(title) else "state_ca"
                if process_item(title, desc, sec, "State Special", state_name, existing_slugs):
                    st_count += 1
                    time.sleep(AI_PACE_SECONDS)
                    break

    total = nat_count + st_count
    print(f"[ETERNAL CIVIL ACADEMY] Done | National: {nat_count} | State: {st_count} | Total: {total} | AI Errors: {AI_ERROR_COUNT}")
    if total == 0 and AI_ERROR_COUNT > 0:
        print("[ERROR] 0 articles synced due to AI quota/API errors. Marking run as FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run()
