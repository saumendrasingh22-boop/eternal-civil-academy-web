import hashlib
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
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
AI_PACE_SECONDS = 5.0

JUNK_KEYWORDS = [
    "murder", "killed", "rape", "arrested", "police nab", "marry", "wedding", "divorce",
    "suicide", "accident", "crash", "protest", "dharna", "rally", "slams", "hits out",
    "bjp vs", "congress vs", "sp vs", "rjd vs", "jdu vs", "bollywood", "actor", "actress",
    "bigg boss", "viral video", "horoscope", "astrology", "weather forecast", "heavy rain",
    "traffic jam", "robbery", "theft", "scamster", "elopes", "boyfriend", "girlfriend",
    "wife", "husband", "bail plea", "fir lodged", "chargesheet", "constable", "liquor",
    "encroachment", "demolition", "transfer of", "sho suspended", "road mishap",
]

PYQ_WEIGHTED_SIGNALS = [
    (4, [
        "gi tag", "geographical indication", "ramsar", "unesco", "tiger reserve",
        "biosphere reserve", "national park", "wildlife sanctuary", "index", "ranking",
        "eight core", "core industries", "iip", "world bank", "imf", "undp", "niti aayog",
        "padma", "bharat ratna", "jnanpith", "sahitya akademi", "nobel", "booker",
        "gopal ratna", "dadasaheb", "swachh survekshan", "military exercise",
        "naval exercise", "air exercise", "joint exercise", "isro", "drdo", "missile",
        "satellite", "gaganyaan", "chandrayaan", "aditya-l1", "odop",
        "one district one product", "first in india", "india's first", "country's first",
    ]),
    (3, [
        "yojana", "scheme", "mission", "abhiyan", "portal", "app launched", "cabinet approves",
        "appointed", "new chairman", "new governor", "new cji", "election commissioner",
        "rbi governor", "sebi chief", "summit", "g20", "brics", "sco", "quad", "asean",
        "cop29", "cop30", "cop31", "budget", "economic survey", "repo rate", "monetary policy",
        "supreme court", "constitutional", "amendment", "parliament passes", "bill passed",
        "committee", "commission", "gold medal", "championship", "world cup", "olympic",
        "asian games", "chess", "badminton", "theme of", "world day", "national day",
        "book titled", "authored by", "expressway", "industrial corridor", "defence corridor",
    ]),
    (2, [
        "policy", "mou", "treaty", "agreement", "gdp", "inflation", "export", "semiconductor",
        "green hydrogen", "solar", "nuclear", "metro", "airport", "port", "ai mission",
        "census", "climate", "wetland", "glacier", "river", "dam", "award", "prize", "honour",
    ]),
]

NATIONAL_FEEDS = [
    {"url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/national/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/business/feed/", "section": "daily_ca", "gs": "GS-3"},
    {"url": "https://www.newsonair.gov.in/category/international/feed/", "section": "daily_ca", "gs": "GS-2"},
    {"url": "https://www.newsonair.gov.in/category/sports/feed/", "section": "daily_ca", "gs": "GS-1"},
    {"url": "https://ddnews.gov.in/en/feed/", "section": "daily_ca", "gs": "GS-2"},
]

NEG_Q = "+-murder+-arrested+-protest+-marry+-rape+-accident+-bollywood+-viral+-bail+-theft"
STATE_QUERY_CORE = "(yojana+OR+scheme+OR+cabinet+OR+GI+tag+OR+ODOP+OR+budget+OR+award+OR+ranking+OR+index+OR+expressway+OR+park+OR+first+OR+MoU)"

STATE_FEEDS = {
    "Uttar Pradesh": [f"https://news.google.com/rss/search?q=Uttar+Pradesh+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Bihar": [f"https://news.google.com/rss/search?q=Bihar+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Rajasthan": [f"https://news.google.com/rss/search?q=Rajasthan+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Madhya Pradesh": [f"https://news.google.com/rss/search?q=Madhya+Pradesh+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Haryana": [f"https://news.google.com/rss/search?q=Haryana+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Jharkhand": [f"https://news.google.com/rss/search?q=Jharkhand+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
    "Uttarakhand": [f"https://news.google.com/rss/search?q=Uttarakhand+{STATE_QUERY_CORE}{NEG_Q}+when:3d&hl=en-IN&gl=IN&ceid=IN:en"],
}

EXHAUSTED_GEMINI_MODELS = set()
ACTIVE_GEMINI_MODELS = []
AI_ERROR_COUNT = 0


def strip_html(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", text or ""))).strip()


def exam_pyq_score(title: str, desc: str) -> int:
    txt = f"{title} {desc}".lower()
    if any(j in txt for j in JUNK_KEYWORDS):
        return -1
    score = 0
    for weight, words in PYQ_WEIGHTED_SIGNALS:
        for w in words:
            if w in txt:
                score += weight
    return score


def make_slug(prefix: str, title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")[:55]
    h = hashlib.md5((title or "").encode("utf-8")).hexdigest()[:6]
    p = re.sub(r"[^a-z0-9]+", "-", (prefix or "ca").lower()).strip("-")[:12]
    return f"{p}-{base}-{h}"


def detect_scheme(title: str) -> bool:
    t = (title or "").lower()
    return any(k in t for k in ["yojana", "scheme", "mission", "abhiyan", "programme", "program", "policy", "portal"])


def detect_gs(title: str, desc: str, fallback: str) -> str:
    txt = f"{title} {desc}".lower()
    if any(k in txt for k in ["rbi", "gdp", "economy", "inflation", "core industries", "iip", "isro", "space", "climate", "environment", "ai ", "cyber", "budget", "drdo", "missile", "semiconductor", "hydrogen", "solar", "ramsar", "tiger", "national park", "wildlife"]):
        return "GS-3"
    if any(k in txt for k in ["heritage", "culture", "history", "unesco", "monument", "gi tag", "award", "medal", "championship", "sports", "book titled", "day", "theme"]):
        return "GS-1"
    if any(k in txt for k in ["ethics", "integrity", "lokpal"]):
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


def fetch_article_excerpt(link: str) -> str:
    """Best-effort fetch of source page paragraphs so exact lists, districts, and numbers are not missed."""
    if not link or "news.google.com" in link:
        return ""
    try:
        r = requests.get(link, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=10)
        if not r.ok or "text/html" not in (r.headers.get("Content-Type") or "").lower():
            return ""
        paras = re.findall(r"<p[^>]*>([\s\S]*?)</p>", r.text, flags=re.I)
        cleaned = [strip_html(p) for p in paras if len(strip_html(p)) >= 45]
        return " ".join(cleaned[:10])[:2200]
    except Exception:
        return ""


MAX_NEWS_AGE_DAYS = 4


def is_recent_pubdate(pub_raw: str) -> bool:
    """Rejects any RSS article older than MAX_NEWS_AGE_DAYS (4 days)."""
    if not pub_raw:
        return True
    try:
        dt = parsedate_to_datetime(pub_raw.strip())
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - dt.astimezone(timezone.utc)
        return age.total_seconds() <= MAX_NEWS_AGE_DAYS * 86400
    except Exception:
        return True


def fetch_rss_items(url: str, limit: int = 12):
    scored = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=18)
        if not r.ok:
            return []
        root = ET.fromstring(r.content)
        for item in root.findall(".//item")[:limit]:
            pub_raw = (item.findtext("pubDate") or "").strip()
            if not is_recent_pubdate(pub_raw):
                continue
            title = strip_html(item.findtext("title") or "")
            desc = strip_html(item.findtext("description") or "")
            link = (item.findtext("link") or "").strip()
            if len(title) >= 16:
                sc = exam_pyq_score(title, desc)
                if sc >= 2:
                    scored.append((sc, title, desc[:1200], link))
    except Exception as e:
        print(f"[rss skip] {url[:60]} -> {e}")
    scored.sort(key=lambda x: x[0], reverse=True)
    return [(t, d, l) for _, t, d, l in scored]


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



DYNAMIC_CONTEXT_QUERIES = [
    (["gi tag", "geographical indication"], "India+total+GI+tags+highest+state+DPIIT+latest"),
    (["ramsar", "wetland"], "India+total+Ramsar+sites+highest+state+latest"),
    (["tiger reserve"], "India+total+tiger+reserves+latest+NTCA"),
    (["national park"], "India+total+national+parks+highest+state+latest"),
    (["unesco", "world heritage"], "India+total+UNESCO+world+heritage+sites+latest"),
]


def fetch_live_dynamic_context(title: str, desc: str) -> str:
    """Filter 5: Fetches live authentic snippets for frequently changing counts (GI Tags, Ramsar, Parks, UNESCO)."""
    txt = f"{title} {desc}".lower()
    for keys, query in DYNAMIC_CONTEXT_QUERIES:
        if any(k in txt for k in keys):
            try:
                url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
                r = requests.get(url, headers=HEADERS, timeout=10)
                if r.ok:
                    root = ET.fromstring(r.content)
                    snips = []
                    for it in root.findall(".//item")[:4]:
                        t = strip_html(it.findtext("title") or "")
                        pd = (it.findtext("pubDate") or "")[:16]
                        if t:
                            snips.append(f"[{pd}] {t}")
                    if snips:
                        return " | ".join(snips)[:800]
            except Exception:
                pass
            break
    return ""


def build_prompt(title: str, desc: str, full_excerpt: str, live_ctx: str, state_name):
    ctx = f"Target State: {state_name} (Include exact District/City, State Cabinet/Budget/ODOP/GI Tag specifics)\n" if state_name else ""
    extra = f"\nSource Article Details:\n{full_excerpt}" if full_excerpt else ""
    ctx_live = f"\nLive Authentic Reference Snippets (for latest counts/rankings):\n{live_ctx}" if live_ctx else ""
    return (
        "You are a senior UPSC Prelims, UPPSC Prelims, BPSC Prelims, RO/ARO & One-Day Exam Chief Editor for ETERNAL CIVIL ACADEMY (Drishti IAS + Vision IAS + Ghatna Chakra standard).\n\n"
        "STEP 1 — STRICT PYQ RELEVANCE GATE:\n"
        "Accept ONLY high-yield exam news (Indices/Reports, Eight Core/IIP/RBI/Budget, Government Schemes/Portals, Appointments/Firsts, Awards, Military Exercises, ISRO/DRDO, Summits, Ramsar/Parks/GI Tags, Sports, Days/Themes, Books/Authors, Supreme Court/Polity, State Cabinet/District-Firsts).\n"
        "If crime, routine politics, protest, transfer, accident, gossip, or vague speech with NO exam fact, return ONLY: {\"skip\": true}.\n\n"
        "STEP 2 — EXHAUSTIVE, ZERO-CASUALTY EXAM DEPTH (STRICTLY NO SHALLOW SUMMARIES!):\n"
        "NEVER write vague statements like 'several products got GI tags' or 'Eight Core Industries grew'. You MUST go into FULL UPSC/PCS EXAM DEPTH:\n"
        "- If Eight Core Industries / IIP is in news: Explicitly list ALL 8 Core Industries by exact name AND their exact weightage % in descending order (Refinery Products 28.04%, Electricity 19.85%, Steel 17.92%, Coal 10.33%, Crude Oil 8.98%, Natural Gas 6.88%, Cement 5.37%, Fertilizers 2.63%; Total 40.27% of IIP), Base Year (2011-12), and Publisher (Office of Economic Adviser, DPIIT, Ministry of Commerce & Industry).\n"
        "- If GI Tag is in news: Explicitly name the GI-tagged products AND their exact District/City/State (from the news), PLUS full GI basics (GI of Goods Act 1999, effective Sept 2003, GI Registry Chennai under DPIIT, 10-year renewable validity, India's first GI Tag Darjeeling Tea 2004).\n"
        "- For ANY Index/Report: Publisher organization, India's exact rank & score, Top 3 countries, India's previous rank, and key parameters.\n"
        "- If ANY Geographical Place / Water Body / Pass / Strait / Canal / River / Park / Corridor (India or World) is in news: Explicitly explain (a) What it actually is & exact location (Country/State/District/Continent), (b) What it connects or separates (Water bodies, Bordering Countries/States, Neighboring Seas/Landmarks — Map-based Prelims gold!), (c) Its Historical & Strategic/Geopolitical significance, and (d) Key Ecological/Economic features (Rivers, Tribes, Minerals, UNESCO/Ramsar status).\n"
        "- If ANY Historical Event / Personality / Heritage Site / Temple / Dynasty is in news: Give exact period/century, founder/ruler, architectural style, key contributions, and UNESCO/ASI status.\n"
        "- BASIC CONCEPT (मूल अवधारणा): For any Science/Tech/Economy/Polity/Disease/Environment topic, explain the core concept from scratch (e.g., Qubit/Superposition for Quantum, pathogen/transmission/vaccine for diseases, working mechanism for RBI/SEBI tools) so students do not need a separate basic book.\n"
        "- INSTITUTION PROFILE (संस्था परिचय): Whenever any body/agency appears (ISRO, DRDO, RBI, SEBI, NITI Aayog, IMF, World Bank, WHO, UNESCO, etc.), give Full Form, Establishment Year, Headquarters, Nodal Ministry, Membership & India's role.\n"
        "- COMPARATIVE ANALYSIS (तुलनात्मक अंतर): Where relevant, include a crisp contrast between related terms/bodies (e.g., National Park vs Wildlife Sanctuary, GDP vs GVA, IMF vs World Bank, Constitutional vs Statutory).\n"
        "- 3-TIER LINKAGE (STATE -> NATIONAL -> GLOBAL): Whenever a State-specific or National figure appears (e.g., GI Tag, Ramsar Site, National Park, Tiger Reserve, UNESCO Site, Solar/GDP/Export), ALWAYS connect all 3 levels concisely: (1) State Fact & District, (2) India Total & Top/Leading Indian State (e.g., highest GI tags/Ramsar sites/Parks in India), and (3) Brief Global Context (e.g., WTO TRIPS/WIPO for GI, Ramsar Convention 1971 Iran & global leader, or global ranking).\n"
        "- STRICT DATA AUTHENTICITY & REFERENCE-YEAR RULE (FILTER 6): For frequently changing totals (GI tags, Ramsar sites, National Parks, Tiger Reserves, UNESCO sites, Ranks), ALWAYS rely on the provided Source/Live Reference Snippets and mention the exact reference year/source (e.g., as per latest official data). NEVER guess or fabricate an unverified number!\n"
        "- HONEST PYQ CONCEPT LINKAGE: Mention likely UPSC/UPPSC/BPSC Prelims exam focus areas & PYQ concepts — NEVER invent fake PYQ years or fake past questions!\n"
        "- For ANY Scheme/Mission/Treaty/Exercise/Award: Full current details FIRST, then complete STATIC BASIC FOUNDATION (Launch Year, Nodal Ministry, Constitutional Article/Act, Outlay, Eligibility, and Prelims Statement-Traps).\n\n"
        "RETURN ONLY VALID JSON WITH THESE EXACT KEYS:\n"
        "title_en, title_hi, why_in_news, why_in_news_hi, key_highlights (array of 7 to 9 deeply detailed strings covering Current Event + Complete Static Basics/Geography/History), key_highlights_hi (array of 7 to 9 deeply detailed Hindi strings), "
        "prelims_facts (array of 7 crisp high-yield factual strings), prelims_facts_hi (array of 7 crisp Hindi strings), mains_perspective, mains_perspective_hi.\n\n"
        "STRICT FORMAT RULES:\n"
        "1. SHORT KEYWORD HEADLINE (title_en & title_hi): STRICTLY 3 to 7 words in crisp exam-keyword style (e.g., 'Eight Core Industries Growth & Weights', 'Madhya Pradesh GI Tags 2026', 'आठ कोर उद्योग: वृद्धि एवं भारांश'). NEVER write long newspaper sentences!\n"
        "2. WHY IN NEWS (why_in_news / why_in_news_hi): 3 to 4 dense factual sentences covering exact date/month, ministry/body, exact numbers/names/districts, and why it matters now.\n"
        "3. KEY HIGHLIGHTS (7 to 9 rich, multi-sentence bullets, each starting with a clear label):\n"
        "   - Bullet 1 [Current Event in Full Detail]: Exact names, figures, winners, products, districts, or growth rates.\n"
        "   - Bullet 2 [Complete List / Exact Breakdown]: Explicit enumeration of all sub-components, weights %, products + districts, articles, or participating nations.\n"
        "   - Bullet 3 [Basic Static Foundation — UPSC/PCS Core]: Complete background of the institution, Act, Constitutional Article, Base Year, Headquarters, Parent Ministry, or Governing Mechanism.\n"
        "   - Bullet 4 [Key Parameters / Eligibility / Financial Outlay]: Exact budget (₹ crore), targets, validity, methodology, or technical specs.\n"
        "   - Bullet 5 [Historical / Comparative & State/District Angle]: First in India, previous year comparison, top state/country, or exact District/ODOP relevance.\n"
        "   - Bullet 6 [Geographical / Historical / Map-Based Basics]: Exact location, bordering countries/states, what it connects/separates, and historical/strategic background.\n"
        "   - Bullet 7 [Prelims Micro-Nuances & Statement Traps]: Subtle facts UPPSC/BPSC/UPSC Prelims twists in Statement 1 / Statement 2 questions.\n"
        "4. PRELIMS & ONE-DAY FACTS (EXACTLY 7 sharp 'Label: Exact Value' one-liners covering every date, weightage, district, headquarters, ministry, article, and static GK fact).\n"
        "5. MAINS PERSPECTIVE (3 to 4 substantive sentences covering GS significance, key challenge, and way forward).\n"
        "6. PURE BILINGUAL QUALITY: Every *_hi field MUST be pure Devanagari Hindi (only standard acronyms like IIP/DPIIT/GI/RBI/ISRO in brackets). Every English field MUST be pure English.\n"
        f"{ctx}Raw News Headline: {title}\nRSS Summary: {desc}{extra}{ctx_live}"
    )


def has_hi(val) -> bool:
    txt = " ".join(val) if isinstance(val, list) else str(val or "")
    return len(re.findall(r"[\u0900-\u097F]", txt)) >= 8


def is_pure_en(val) -> bool:
    txt = " ".join(val) if isinstance(val, list) else str(val or "")
    return len(re.findall(r"[\u0900-\u097F]", txt)) <= 3


def trim_headline(h: str, max_words: int = 9) -> str:
    words = (h or "").strip().split()
    return " ".join(words[:max_words]).rstrip(".,;:-") if len(words) > max_words else (h or "").strip()


def parse_json_payload(raw_text: str):
    if not raw_text:
        return None
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.I)
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        return None
    data = json.loads(m.group(0))
    if data.get("skip") is True:
        return {"skip": True}
    req_keys = [
        "title_en", "title_hi", "why_in_news", "why_in_news_hi",
        "key_highlights", "key_highlights_hi", "prelims_facts", "prelims_facts_hi",
        "mains_perspective", "mains_perspective_hi",
    ]
    if not all(data.get(k) for k in req_keys):
        return None
    if not all(has_hi(data.get(k)) for k in ["title_hi", "why_in_news_hi", "key_highlights_hi", "prelims_facts_hi", "mains_perspective_hi"]):
        return None
    if not all(is_pure_en(data.get(k)) for k in ["title_en", "why_in_news", "key_highlights", "prelims_facts"]):
        return None
    data["title_en"] = trim_headline(data["title_en"], 9)
    data["title_hi"] = trim_headline(data["title_hi"], 10)
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
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096, "responseMimeType": "application/json"},
                },
                timeout=45,
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
                    "temperature": 0.2,
                    "max_tokens": 4096,
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=45,
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


def process_item(title, desc, link, section, gs_tag, state_name, existing_slugs):
    raw_slug = make_slug(state_name or "ca", title)
    if raw_slug in existing_slugs:
        return False
    full_excerpt = fetch_article_excerpt(link)
    live_ctx = fetch_live_dynamic_context(title, desc)
    prompt = build_prompt(title, desc, full_excerpt, live_ctx, state_name)
    data = call_gemini(prompt)
    if not data:
        data = call_groq(prompt)
    if not data:
        return False
    if data.get("skip") is True:
        print(f"[SKIPPED NON-EXAM] {title[:65]}")
        return False

    slug = make_slug(state_name or "ca", data["title_en"])
    if slug in existing_slugs:
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
        existing_slugs.add(raw_slug)
        print(f"[SYNCED OK] {today_ist} | {data['title_en'][:65]}")
        return True
    return False


def run():
    print("[ETERNAL CIVIL ACADEMY] Deep UPSC + UPPSC + BPSC + One-Day Auto-Sync Starting...")
    discover_gemini_models()
    existing_slugs = fetch_existing_slugs()
    print(f"[db] Existing articles cached for dedup: {len(existing_slugs)}")

    nat_count = 0
    st_count = 0

    for feed in NATIONAL_FEEDS:
        if nat_count >= MAX_NATIONAL_PER_RUN:
            break
        for title, desc, link in fetch_rss_items(feed["url"], limit=12):
            if nat_count >= MAX_NATIONAL_PER_RUN:
                break
            sec = "central_scheme" if detect_scheme(title) else feed["section"]
            gs = detect_gs(title, desc, feed["gs"])
            if process_item(title, desc, link, sec, gs, None, existing_slugs):
                nat_count += 1
                time.sleep(AI_PACE_SECONDS)

    for state_name, urls in STATE_FEEDS.items():
        if st_count >= MAX_STATE_PER_RUN:
            break
        for u in urls:
            for title, desc, link in fetch_rss_items(u, limit=10):
                if st_count >= MAX_STATE_PER_RUN:
                    break
                sec = "state_scheme" if detect_scheme(title) else "state_ca"
                if process_item(title, desc, link, sec, "State Special", state_name, existing_slugs):
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