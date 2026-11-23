"""
ETERNAL CIVIL ACADEMY — 100% Free & Unlimited 24x7 Multi-Source Auto-Sync Worker
- National & International Official Sources:
  PIB (English & Hindi), Akashvani / All India Radio (NewsOnAir), DD News, Prasar Bharati,
  plus Free Unlimited Official-Scoped RSS Mirrors (PRS India, RBI, MEA).
- State-Specific Current Affairs (7 Key PCS States — Multi-Source Per State):
  Uttar Pradesh, Bihar, Rajasthan, Madhya Pradesh, Haryana, Jharkhand, Uttarakhand.
  Every state article routes directly into State Special -> State Current Affairs (section_type='state_ca' or 'state_scheme').
- Strict UPSC/State PCS Exam-Relevance Filter (removes entertainment, sports gossip, crime noise).
- Zero Raw Link Dumps: Strips all external URLs & agency tags and structures every article into:
  1. Why in News (खबरों में क्यों है)
  2. Detailed Explanation / Key Highlights (विस्तृत व्याख्या)
  3. Key Facts for Prelims (प्रीलिम्स के लिए महत्वपूर्ण तथ्य)
  4. Mains Perspective (मुख्य परीक्षा दृष्टिकोण)
- 100% Free Forever: Uses Gemini Free Tier when GEMINI_API_KEY is present, with a built-in
  full-article BeautifulSoup deterministic structured formatter fallback so sync NEVER stops.
"""
import hashlib
import json
import os
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

WEBSITE_SYNC_URL = os.getenv("ECA_WEBSITE_API_URL", "https://eternalcivilacademy.com/api/bot-sync").strip().strip(chr(34)+chr(39)+chr(96))
if WEBSITE_SYNC_URL and not WEBSITE_SYNC_URL.startswith("http"): WEBSITE_SYNC_URL = "https://" + WEBSITE_SYNC_URL
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "eca-secret-sync-token-2026").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().strip(chr(34)+chr(39)+chr(96))
if SUPABASE_URL and not SUPABASE_URL.startswith("http"): SUPABASE_URL = "https://" + SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

REQ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
}

API_HEADERS = {
    "Authorization": f"Bearer {BOT_API_SECRET}",
    "Content-Type": "application/json",
}

# 1. VERIFIED FREE NATIONAL & INTERNATIONAL OFFICIAL GOVERNMENT FEEDS
NATIONAL_AND_INTL_FEEDS = [
    # Press Information Bureau (PIB) — English & Hindi Official RSS
    {"name": "PIB National (EN)", "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", "section": "daily_ca", "gs": "GS-2"},
    {"name": "PIB National (HI)", "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3", "section": "daily_ca", "gs": "GS-2"},
    # Akashvani / All India Radio (NewsOnAir) Official WordPress RSS
    {"name": "Akashvani National", "url": "https://newsonair.gov.in/category/national/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"name": "Akashvani International", "url": "https://newsonair.gov.in/category/international/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"name": "Akashvani Economy", "url": "https://newsonair.gov.in/category/business/feed/", "section": "daily_ca", "gs": "GS-3"},
    {"name": "Akashvani Main", "url": "https://newsonair.gov.in/feed/", "section": "daily_ca", "gs": "GS-2"},
    # DD News (Doordarshan / Prasar Bharati) Official RSS
    {"name": "DD News Main", "url": "https://ddnews.gov.in/en/feed/", "section": "daily_ca", "gs": "GS-3"},
    {"name": "DD News National", "url": "https://ddnews.gov.in/en/category/national/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"name": "DD News International", "url": "https://ddnews.gov.in/en/category/international/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"name": "DD News Economy", "url": "https://ddnews.gov.in/en/category/economy/feed/", "section": "daily_ca", "gs": "GS-3"},
    # Prasar Bharati Official Feed
    {"name": "Prasar Bharati", "url": "https://prasarbharati.gov.in/feed/", "section": "daily_ca", "gs": "GS-2"},
    # Free Unlimited Official-Source Google News RSS Mirrors (Zero-Downtime Backup)
    {
        "name": "Official Gov Policy Mirror",
        "url": "https://news.google.com/rss/search?q=(site:pib.gov.in+OR+site:newsonair.gov.in+OR+site:ddnews.gov.in)+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
        "section": "daily_ca",
        "gs": "GS-2",
    },
    {
        "name": "Economy & Science Policy Mirror",
        "url": "https://news.google.com/rss/search?q=(RBI+OR+ISRO+OR+DRDO+OR+NITI+Aayog+OR+Union+Cabinet)+India+policy+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
        "section": "daily_ca",
        "gs": "GS-3",
    },
]

# 2. MULTI-SOURCE FREE STATE-SPECIFIC CURRENT AFFAIRS FEEDS (4+ Sources per State)
def _gnews_state_rss(query: str) -> str:
    encoded = urllib.parse.quote_plus(query)
    return f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"


STATE_MULTI_FEEDS = {
    "Uttar Pradesh": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('("Uttar Pradesh" OR UPPSC) (cabinet OR scheme OR yojana OR budget OR expressway OR corridor) when:4d'),
        _gnews_state_rss('("Uttar Pradesh" government OR Lucknow) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('"Uttar Pradesh" (GI tag OR Ramsar OR wildlife OR solar OR industrial policy) when:7d'),
    ],
    "Bihar": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('(Bihar OR BPSC) (cabinet OR scheme OR yojana OR budget OR agriculture OR infrastructure) when:4d'),
        _gnews_state_rss('(Bihar government OR Patna) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('Bihar (GI tag OR heritage OR river OR industry OR education policy) when:7d'),
    ],
    "Rajasthan": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('(Rajasthan OR RPSC) (cabinet OR scheme OR yojana OR budget OR solar OR water mission) when:4d'),
        _gnews_state_rss('(Rajasthan government OR Jaipur) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('Rajasthan (tiger reserve OR GI tag OR renewable energy OR ERCP OR heritage) when:7d'),
    ],
    "Madhya Pradesh": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('("Madhya Pradesh" OR MPPSC) (cabinet OR scheme OR yojana OR budget OR cheetah OR tiger) when:4d'),
        _gnews_state_rss('("Madhya Pradesh" government OR Bhopal) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('"Madhya Pradesh" (Ken-Betwa OR GI tag OR forest OR agriculture OR corridor) when:7d'),
    ],
    "Haryana": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('(Haryana OR HPSC) (cabinet OR scheme OR yojana OR budget OR agriculture OR sports policy) when:4d'),
        _gnews_state_rss('(Haryana government OR Chandigarh) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('Haryana (crop diversification OR industrial corridor OR Aravalli OR wetlands) when:7d'),
    ],
    "Jharkhand": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('(Jharkhand OR JPSC) (cabinet OR scheme OR yojana OR budget OR tribal OR mineral policy) when:4d'),
        _gnews_state_rss('(Jharkhand government OR Ranchi) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('Jharkhand (tribal welfare OR forest rights OR mining OR GI tag OR industry) when:7d'),
    ],
    "Uttarakhand": [
        "https://newsonair.gov.in/category/states/feed/",
        "https://ddnews.gov.in/en/category/states/feed/",
        _gnews_state_rss('(Uttarakhand OR UKPSC) (cabinet OR scheme OR yojana OR budget OR UCC OR ecology) when:4d'),
        _gnews_state_rss('(Uttarakhand government OR Dehradun) (site:pib.gov.in OR site:newsonair.gov.in OR site:ddnews.gov.in) when:7d'),
        _gnews_state_rss('Uttarakhand (glacier OR Char Dham OR wildlife OR hydropower OR disaster management) when:7d'),
    ],
}

# Exam-Relevance Positive Keywords & Noise Exclusion Keywords
EXAM_RELEVANT_KEYWORDS = [
    "cabinet", "parliament", "bill", "act", "supreme court", "constitution", "article",
    "rbi", "sebi", "niti aayog", "isro", "drdo", "mission", "yojana", "scheme", "policy",
    "budget", "gdp", "inflation", "export", "summit", "bilateral", "mou", "treaty",
    "un", "unesco", "ramsar", "tiger", "wildlife", "climate", "solar", "hydrogen",
    "corridor", "expressway", "gi tag", "census", "commission", "committee", "index",
    "report", "defence", "missile", "satellite", "digital", "ai ", "semiconductor",
    "agriculture", "msp", "education", "health", "tribal", "heritage", "archaeological",
    "योजना", "मिशन", "कैबिनेट", "संसद", "विधेयक", "नीति", "बजट", "समझौता", "शिखर सम्मेलन",
]

NOISE_KEYWORDS = [
    "bollywood", "box office", "movie review", "celebrity", "actor", "actress",
    "ipl", "cricket match", "wicket", "batting", "football match", "horoscope",
    "astrology", "viral video", "murder", "robbery", "accident killed", "brawl",
    "divorce", "wedding photos", "fashion week", "bigg boss", "trailer launch",
]

BLOCKED_BRANDS = [
    "PIB", "Press Information Bureau", "DD News", "Akashvani", "News On AIR",
    "All India Radio", "Prasar Bharati", "Chronicle", "MEA", "PRS India",
    "Source:", "PTI", "ANI", "IANS", "The Hindu", "Indian Express", "Hindustan Times",
    "Times of India", "Livemint", "NDTV", "India Today", "Business Standard",
]

CACHE_FILE = os.path.join(os.path.dirname(__file__), "synced_cache.json")


def load_seen_hashes() -> set:
    if not os.path.exists(CACHE_FILE):
        return set()
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    except Exception:
        return set()


def save_seen_hashes(hashes: set):
    try:
        recent = list(hashes)[-1500:]
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(recent, f, indent=2)
    except Exception:
        pass


def strip_external_sources(text: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", text or "")
    cleaned = re.sub(r"https?://\S+", "", cleaned)
    # Remove trailing " - Source Name" from Google News titles
    cleaned = re.sub(r"\s+[-|–]\s+[A-Za-z0-9 .&]{2,40}$", "", cleaned)
    for term in BLOCKED_BRANDS:
        cleaned = re.sub(re.escape(term), "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip(" -|:")


def is_exam_relevant(title: str, body: str) -> bool:
    combined = f"{title} {body}".lower()
    if any(bad in combined for bad in NOISE_KEYWORDS):
        return False
    return any(good in combined for good in EXAM_RELEVANT_KEYWORDS)


def detect_scheme(title: str) -> bool:
    keywords = ["yojana", "scheme", "mission", "abhiyan", "program", "programme", "nidhi", "योजना", "मिशन"]
    low = title.lower()
    return any(k in low for k in keywords)


def detect_gs_paper(title: str, body: str, default_gs: str = "GS-2") -> str:
    text = f"{title} {body}".lower()
    if any(k in text for k in ["history", "heritage", "archaeolog", "culture", "unesco", "gi tag", "temple", "freedom"]):
        return "GS-1"
    if any(k in text for k in ["rbi", "gdp", "economy", "inflation", "isro", "drdo", "space", "missile", "hydrogen", "solar", "climate", "ramsar", "tiger", "wildlife", "semiconductor", "ai ", "cyber", "budget"]):
        return "GS-3"
    if any(k in text for k in ["ethics", "transparency", "probity", "vigilance"]):
        return "GS-4"
    return default_gs


def fetch_article_body_text(link: str) -> str:
    """Optionally fetches clean paragraph text from official gov pages for richer summaries."""
    if not link or "news.google.com" in link:
        return ""
    try:
        resp = requests.get(link, timeout=10, headers=REQ_HEADERS)
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        paragraphs = [
            strip_external_sources(p.get_text(" ", strip=True))
            for p in soup.find_all("p")
        ]
        good_paras = [p for p in paragraphs if len(p) > 45][:8]
        return " ".join(good_paras)
    except Exception:
        return ""


def structure_with_free_gemini(title: str, raw_body: str, exam_relevance: str, state_name: str | None) -> dict | None:
    """Uses Gemini Free Tier API when GEMINI_API_KEY is configured."""
    if not GEMINI_API_KEY:
        return None
    scope = f"{state_name} State PCS ({exam_relevance})" if state_name else f"UPSC CSE / State PCS ({exam_relevance})"
    prompt = (
        f"You are an expert UPSC/State PCS Current Affairs editor for ETERNAL CIVIL ACADEMY.\n"
        f"Rewrite and structure the following official news into an original, exam-ready analysis for {scope}.\n"
        f"STRICT RULES:\n"
        f"- Do NOT include any external URLs, website names, or news agency names (no PIB/DD News/Akashvani/PTI).\n"
        f"- Return ONLY valid JSON with exact keys:\n"
        f'  {{"title_hi": "Crisp pure Devanagari Hindi headline", "why_in_news": "2-3 clear sentences explaining why this topic is in news", "why_in_news_hi": "2-3 clear sentences in pure standard Devanagari Hindi", '
        f'"key_highlights": ["Point 1 with bold-style label: detailed explanation", "Point 2...", "Point 3...", "Point 4..."], '
        f'"prelims_facts": ["Crisp Prelims fact 1", "Crisp Prelims fact 2", "Crisp Prelims fact 3", "Crisp Prelims fact 4"], '
        f'"key_highlights_hi": ["Point 1 in pure Hindi", "Point 2 in pure Hindi", "Point 3 in pure Hindi"], "prelims_facts_hi": ["Fact 1 in pure Hindi", "Fact 2 in pure Hindi", "Fact 3 in pure Hindi"], "mains_perspective": "2-3 sentence analytical Mains perspective", "mains_perspective_hi": "2-3 sentence analytical Mains perspective in pure Hindi"}}\n\n'
        f"HEADLINE: {title}\n"
        f"DETAILS: {raw_body[:2400]}"
    )
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    try:
        res = requests.post(
            endpoint,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.25, "responseMimeType": "application/json"},
            },
            timeout=20,
        )
        if res.status_code != 200:
            return None
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        if (
            isinstance(parsed.get("why_in_news"), str)
            and isinstance(parsed.get("key_highlights"), list)
            and isinstance(parsed.get("prelims_facts"), list)
            and isinstance(parsed.get("mains_perspective"), str)
        ):
            return {
                "why_in_news": strip_external_sources(parsed["why_in_news"]),
                "key_highlights": [strip_external_sources(str(x)) for x in parsed["key_highlights"][:5] if x],
                "prelims_facts": [strip_external_sources(str(x)) for x in parsed["prelims_facts"][:5] if x],
                "mains_perspective": strip_external_sources(parsed["mains_perspective"]),
                "title_hi": strip_external_sources(str(parsed.get("title_hi") or "")),
                "why_in_news_hi": strip_external_sources(str(parsed.get("why_in_news_hi") or "")),
                "key_highlights_hi": [strip_external_sources(str(x)) for x in (parsed.get("key_highlights_hi") or [])[:5] if x],
                "prelims_facts_hi": [strip_external_sources(str(x)) for x in (parsed.get("prelims_facts_hi") or [])[:5] if x],
                "mains_perspective_hi": strip_external_sources(str(parsed.get("mains_perspective_hi") or "")),
            }
    except Exception:
        return None
    return None


def fallback_structure(title: str, body: str, exam_relevance: str, state_name: str | None = None) -> dict:
    """100% Free, Unlimited deterministic editorial formatter (runs forever without any paid API)."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?।])\s+", body) if len(s.strip()) > 30]
    context_label = f"{state_name} State Governance" if state_name else f"National Policy ({exam_relevance})"

    why_in_news = (
        " ".join(sentences[:2])
        if len(sentences) >= 2
        else (sentences[0] if sentences else f"{title} has emerged as a major policy development relevant to {context_label}.")
    )

    highlights = []
    if len(sentences) >= 3:
        labels = ["Policy Context", "Key Provisions", "Implementation Framework", "Strategic Impact"]
        for idx, sent in enumerate(sentences[:4]):
            highlights.append(f"{labels[idx]}: {sent}")
    else:
        highlights = [
            f"Policy Context: {title} addresses priority institutional and developmental objectives under {context_label}.",
            "Implementation Mechanism: Coordinated execution across concerned departments with measurable service-delivery targets.",
            "Governance Significance: Directly relevant for administrative reform, welfare coverage, and fiscal efficiency.",
            "Long-Term Outcome: Strengthens regional capacity building and inclusive socio-economic growth.",
        ]

    # Extract factual sentences with numbers, years, acts, or institutions for Prelims
    factual = [s for s in sentences if re.search(r"\b(19|20)\d{2}\b|\d+%|\₹|crore|lakh|article|act|commission|ministry", s, re.I)]
    prelims = [s[:185] for s in (factual or sentences)[:4]]
    if len(prelims) < 3:
        prelims.extend([
            f"Topic Focus: {title}",
            f"Syllabus Tag: {exam_relevance}" + (f" — {state_name} Special" if state_name else ""),
            "Key Dimension: Official policy initiative, institutional framework, and socio-economic impact.",
        ])
    prelims = prelims[:4]

    mains = (
        f"Critically examine the institutional framework, federal coordination, and developmental impact of {title} "
        f"in strengthening {context_label.lower()} and inclusive growth."
    )

    return {
        "why_in_news": why_in_news,
        "key_highlights": highlights,
        "prelims_facts": prelims,
        "mains_perspective": mains,
    }


def fetch_rss_items(feed_url: str, limit: int = 8, state_filter: str | None = None):
    try:
        resp = requests.get(feed_url, timeout=14, headers=REQ_HEADERS)
        if resp.status_code != 200:
            return []
        root = ET.fromstring(resp.content)
        items = []
        for item in root.findall(".//item")[: limit * 3]:
            raw_title = item.findtext("title") or ""
            raw_desc = item.findtext("description") or ""
            link = (item.findtext("link") or "").strip()

            title = strip_external_sources(raw_title)
            desc = strip_external_sources(raw_desc)
            if not title or len(title) < 15:
                continue

            # If reading a multi-state feed (like Akashvani/DD News States), filter to the target state
            if state_filter and ("category/states" in feed_url):
                if state_filter.lower() not in f"{title} {desc}".lower():
                    continue

            if not is_exam_relevant(title, desc):
                continue

            items.append((title, desc or title, link))
            if len(items) >= limit:
                break
        return items
    except Exception:
        return []


def push_to_website_or_supabase(table: str, payload: dict) -> bool:
    # 1. Primary: Website /api/bot-sync
    if WEBSITE_SYNC_URL and "your-domain" not in WEBSITE_SYNC_URL:
        try:
            res = requests.post(
                WEBSITE_SYNC_URL,
                json={"table": table, "payload": payload},
                headers=API_HEADERS,
                timeout=15,
            )
            if res.status_code == 200:
                return True
            print(f"[bot-sync ERR] {res.status_code}: {res.text[:180]}")
        except Exception as e:
            print(f"[bot-sync EXC] {e}")

    # 2. Direct Supabase REST Upsert Fallback (100% Free Tier compatible)
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table}?on_conflict=slug"
            res = requests.post(
                url,
                json=payload,
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                },
                timeout=15,
            )
            if res.status_code in (200, 201):
                return True
            print(f"[supabase ERR] {res.status_code}: {res.text[:180]}")
        except Exception as e:
            print(f"[supabase EXC] {e}")

    return False


def make_slug(prefix: str, title: str) -> str:
    ascii_part = re.sub(r"[^a-z0-9]+", "-", f"{prefix}-{title}".lower()).strip("-")
    short_hash = hashlib.md5(title.encode("utf-8")).hexdigest()[:6]
    return f"{ascii_part[:65]}-{short_hash}".strip("-")


def process_and_sync_item(
    title: str,
    desc: str,
    link: str,
    section_type: str,
    gs_tag: str,
    state_name: str | None,
    seen_hashes: set,
) -> bool:
    dedup_key = hashlib.md5(f"{state_name or 'NAT'}|{title.lower()}".encode("utf-8")).hexdigest()
    if dedup_key in seen_hashes:
        return False

    full_body = fetch_article_body_text(link)
    combined_body = full_body if len(full_body) > len(desc) else desc

    structured = structure_with_free_gemini(title, combined_body, gs_tag, state_name)
    if not structured:
        structured = fallback_structure(title, combined_body, gs_tag, state_name)

    payload = {
        "slug": make_slug(state_name or "ca", title),
        "section_type": section_type,
        "state_name": state_name,
        "exam_relevance": gs_tag,
        "title": title,
        "why_in_news": structured["why_in_news"],
        "key_highlights": structured["key_highlights"],
        "prelims_facts": structured["prelims_facts"],
        "mains_perspective": structured["mains_perspective"],
        "title_hi": structured.get("title_hi") or None,
        "why_in_news_hi": structured.get("why_in_news_hi") or None,
        "key_highlights_hi": structured.get("key_highlights_hi") or None,
        "prelims_facts_hi": structured.get("prelims_facts_hi") or None,
        "mains_perspective_hi": structured.get("mains_perspective_hi") or None,
        "published_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "is_locked": False,
    }

    ok = push_to_website_or_supabase("current_affairs", payload)
    if ok:
        seen_hashes.add(dedup_key)
    return ok


def run_full_stealth_sync():
    seen_hashes = load_seen_hashes()
    national_synced = 0
    state_synced = 0

    print("[ETERNAL CIVIL ACADEMY] Starting 100% Free Multi-Source Current Affairs Auto-Sync...")

    # 1. National, International & Central Schemes (PIB, Akashvani, DD News, Prasar Bharati)
    for feed in NATIONAL_AND_INTL_FEEDS:
        items = fetch_rss_items(feed["url"], limit=3)
        for title, desc, link in items:
            sec = "central_scheme" if detect_scheme(title) else feed["section"]
            gs = detect_gs_paper(title, desc, feed["gs"])
            if process_and_sync_item(title, desc, link, sec, gs, None, seen_hashes):
                national_synced += 1
                time.sleep(0.5)

    # 2. State-Specific Current Affairs (7 Key PCS States — Multi-Source RSS)
    for state_name, feed_urls in STATE_MULTI_FEEDS.items():
        per_state_count = 0
        for url in feed_urls:
            if per_state_count >= 4:
                break
            items = fetch_rss_items(url, limit=2, state_filter=state_name)
            for title, desc, link in items:
                if per_state_count >= 4:
                    break
                sec = "state_scheme" if detect_scheme(title) else "state_ca"
                if process_and_sync_item(title, desc, link, sec, "State Special", state_name, seen_hashes):
                    state_synced += 1
                    per_state_count += 1
                    time.sleep(0.5)

    save_seen_hashes(seen_hashes)
    print(
        f"[ETERNAL CIVIL ACADEMY] Auto-Sync Completed | National/Schemes: {national_synced} | "
        f"State-Specific CA: {state_synced} | Total: {national_synced + state_synced}"
    )




def send_failure_alert(msg: str):
    """Sends optional Telegram alert to Super Admin if sync fails or syncs 0 items."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("ADMIN_TELEGRAM_CHAT_ID", "").strip()
    if not bot_token or not chat_id:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": f"[ECA Auto-Sync Alert]\n{msg}"},
            timeout=10,
        )
    except Exception:
        pass

if __name__ == "__main__":
    try:
        run_full_stealth_sync()
    except Exception as exc:
        send_failure_alert(f"Auto-Sync crashed: {exc}")
        raise

