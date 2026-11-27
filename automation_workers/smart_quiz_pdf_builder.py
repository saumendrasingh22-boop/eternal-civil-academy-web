import html
import os
import pathlib
import re
import sys
import requests
from weasyprint import HTML

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
GH_TOKEN = (os.getenv("GITHUB_TOKEN") or "").strip()
GH_REPO = (os.getenv("GITHUB_REPOSITORY") or "saumendrasingh22-boop/eternal-civil-academy-web").strip()
TARGET_SLUG = (os.getenv("QUIZ_SLUG") or "").strip()
RELEASE_TAG = "PDFs"
STATE_KEY = "smart_quizzes_v1"

TG_SVG_HDR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="#38BDF8" style="vertical-align:-1.5px;margin-right:3px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>'
TG_SVG_FTR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="#0284C7" style="vertical-align:-1.5px;margin-right:3px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>'
IG_SVG_FTR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="#E1306C" style="vertical-align:-1.5px;margin-right:3px;"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>'


def _logo_uri() -> str:
    local = pathlib.Path("public/logo.jpg")
    if local.exists():
        return local.resolve().as_uri()
    return "https://www.eternalcivilacademy.com/logo.jpg"


def _fmt_lines(text: str) -> str:
    escaped = html.escape(str(text or "").strip())
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    return escaped.replace("\n", "<br/>")


def _fmt_explanation(text: str) -> str:
    raw = str(text or "").strip()
    if not raw:
        return ""
    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    paras = []
    for ln in lines:
        ln = re.sub(r"^[•\-\*]\s*", "", ln)
        esc = html.escape(ln)
        esc = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", esc)
        paras.append(f"<p>{esc}</p>")
    return "".join(paras)


def build_pdf_html(quiz: dict, lang: str, include_solutions: bool) -> str:
    is_hi = lang == "hi"
    title = (quiz.get("titleHi") if is_hi else quiz.get("titleEn")) or quiz.get("titleEn") or quiz.get("titleHi") or "ECA Test Series"
    exam = quiz.get("commissionOrExam") or "UPSC / PCS"
    year_tag = quiz.get("yearOrTag") or "2026"
    qs = quiz.get("questions") or []
    badge_text = f"{exam} • {year_tag}"
    mode_lbl = (
        ("पूर्ण व्याख्या सहित" if is_hi else "Complete Solution")
        if include_solutions
        else ("प्रश्न-पत्र" if is_hi else "Question Paper")
    )
    heading = f"{title} ({len(qs)} {'प्रश्न' if is_hi else 'Questions'}) — {mode_lbl}"
    logo_src = _logo_uri()

    cards_html = []
    for idx, q in enumerate(qs, start=1):
        q_txt = (q.get("questionHi") if is_hi else q.get("questionEn")) or q.get("questionEn") or ""
        opts = (q.get("optionsHi") if is_hi else q.get("optionsEn")) or q.get("optionsEn") or {}
        subj = q.get("subject") or exam
        ans = q.get("correct") or "A"
        exp = (q.get("explanationHi") if is_hi else q.get("explanationEn")) or q.get("explanationEn") or ""

        opts_html = "".join(
            f'<div class="opt"><strong>({k})</strong> {html.escape(str(opts.get(k, "")))}</div>'
            for k in ["A", "B", "C", "D"]
        )
        exp_html = ""
        if include_solutions:
            ans_lbl = f"सही उत्तर: ({ans})" if is_hi else f"Correct Answer: ({ans})"
            exp_html = f"""
            <div class="exp-box">
              <div class="ans-pill">{html.escape(ans_lbl)}</div>
              <div class="exp-body">{_fmt_explanation(exp)}</div>
            </div>
            """

        cards_html.append(f"""
        <div class="qcard">
          <div class="q-badge">Q{idx} &bull; {html.escape(str(subj))}</div>
          <div class="q-stem">{_fmt_lines(q_txt)}</div>
          <div class="opts">{opts_html}</div>
          {exp_html}
        </div>
        """)

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8"/>
<style>
  @page {{
    size: A4;
    margin: 24mm 12mm 18mm 12mm;
    @top-center {{ content: element(hdr); width: 100%; }}
    @bottom-center {{ content: element(ftr); width: 100%; }}
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: "Noto Sans Devanagari", "Noto Sans", "DejaVu Sans", sans-serif;
    color: #0F172A;
    margin: 0;
    padding: 0;
    font-size: 9.6pt;
    line-height: 1.5;
  }}
  /* Full-page diagonal watermark strictly ABOVE all cards & explanation boxes */
  .wm {{
    position: fixed;
    top: 47%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-34deg);
    font-size: 38pt;
    font-weight: 800;
    color: rgba(15, 23, 42, 0.085);
    white-space: nowrap;
    letter-spacing: 1px;
    z-index: 9999;
    pointer-events: none;
  }}
  .running-hdr {{
    position: running(hdr);
    width: 100%;
    background: #0B1B3D;
    color: #FFFFFF;
    border-bottom: 3px solid #E60000;
    border-radius: 6px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .hl {{ display: flex; align-items: center; gap: 9px; }}
  .lg {{
    height: 30px;
    width: auto;
    border: 1.5px solid #FFFFFF;
    border-radius: 4px;
    background: #FFFFFF;
  }}
  .br {{ font-size: 13pt; font-weight: 900; letter-spacing: 0.4px; line-height: 1.1; }}
  .tg {{ font-size: 7.5pt; color: #FDE68A; font-style: italic; margin-top: 2px; }}
  .hr {{ text-align: right; }}
  .hr-tag {{
    display: inline-block;
    background: #E60000;
    color: #FFFFFF;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 2.5px 9px;
    border-radius: 999px;
    margin-bottom: 3px;
  }}
  .hr-tg {{
    display: block;
    color: #E2E8F0;
    font-size: 7.5pt;
    font-weight: 700;
    text-decoration: none;
  }}
  .running-ftr {{
    position: running(ftr);
    width: 100%;
    border-top: 1.5px solid #0B1B3D;
    padding-top: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 7.8pt;
  }}
  .ft-brand {{ display: block; font-weight: 900; color: #0B1B3D; }}
  .ft-web {{ display: block; font-weight: 800; color: #E60000; text-decoration: none; }}
  .ft-right {{ text-align: right; }}
  .ft-social {{ display: block; color: #0B1B3D; font-weight: 700; text-decoration: none; line-height: 1.35; }}

  .title-box {{
    position: relative;
    z-index: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-left: 4.5px solid #E60000;
    border-radius: 8px;
    padding: 9px 14px;
    margin-bottom: 12px;
    font-size: 12.2pt;
    font-weight: 900;
    color: #0B1B3D;
  }}
  .qcard {{
    position: relative;
    z-index: 1;
    background: transparent;
    border: 1px solid #CBD5E1;
    border-radius: 10px;
    padding: 11px 13px;
    margin-bottom: 11px;
    page-break-inside: avoid;
  }}
  .q-badge {{
    display: inline-block;
    background: #0B1B3D;
    color: #FFFFFF;
    font-size: 7.8pt;
    font-weight: 800;
    padding: 2px 9px;
    border-radius: 5px;
    margin-bottom: 6px;
  }}
  .q-stem {{
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 7px;
    font-size: 9.7pt;
  }}
  .opts {{ margin-bottom: 6px; }}
  .opt {{ margin: 2.5px 0; font-size: 9.3pt; color: #1E293B; }}
  .exp-box {{
    margin-top: 8px;
    background: rgba(255, 241, 242, 0.72);
    border: 1px solid #FECDD3;
    border-left: 3.5px solid #E60000;
    border-radius: 7px;
    padding: 8px 11px;
  }}
  .ans-pill {{
    display: inline-block;
    background: #E60000;
    color: #FFFFFF;
    font-size: 7.8pt;
    font-weight: 800;
    padding: 2px 9px;
    border-radius: 4px;
    margin-bottom: 5px;
  }}
  .exp-body p {{
    margin: 3px 0;
    font-size: 8.9pt;
    color: #1E293B;
    line-height: 1.48;
  }}
</style>
</head>
<body>
  <div class="wm">www.eternalcivilacademy.com</div>

  <div class="running-hdr">
    <div class="hl">
      <img src="{logo_src}" class="lg"/>
      <div>
        <div class="br">ETERNAL CIVIL ACADEMY</div>
        <div class="tg">Your Success, Our Commitment</div>
      </div>
    </div>
    <div class="hr">
      <span class="hr-tag">{html.escape(badge_text)}</span>
      <a href="https://t.me/EternalCivilAcademy" class="hr-tg">{TG_SVG_HDR}t.me/EternalCivilAcademy</a>
    </div>
  </div>

  <div class="running-ftr">
    <div class="ft-left">
      <span class="ft-brand">ETERNAL CIVIL ACADEMY</span>
      <a href="https://www.eternalcivilacademy.com" class="ft-web">www.eternalcivilacademy.com</a>
    </div>
    <div class="ft-right">
      <a href="https://t.me/EternalCivilAcademy" class="ft-social">{TG_SVG_FTR}t.me/EternalCivilAcademy</a>
      <a href="https://instagram.com/eternalcivilacademy" class="ft-social">{IG_SVG_FTR}@eternalcivilacademy</a>
    </div>
  </div>

  <div class="title-box">{html.escape(heading)}</div>
  {"".join(cards_html)}
</body>
</html>"""


def upload_release_asset(file_path: pathlib.Path, asset_name: str) -> str:
    headers = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json"}
    rel_url = f"https://api.github.com/repos/{GH_REPO}/releases/tags/{RELEASE_TAG}"
    r = requests.get(rel_url, headers=headers, timeout=30)
    if r.status_code == 404:
        r = requests.post(
            f"https://api.github.com/repos/{GH_REPO}/releases",
            headers=headers,
            json={"tag_name": RELEASE_TAG, "name": "ECA PDFs", "draft": False, "prerelease": False},
            timeout=30,
        )
    r.raise_for_status()
    rel = r.json()
    upload_url = rel["upload_url"].split("{")[0]
    for a in rel.get("assets", []):
        if a.get("name") == asset_name:
            requests.delete(f"https://api.github.com/repos/{GH_REPO}/releases/assets/{a['id']}", headers=headers, timeout=30)
    up = requests.post(
        f"{upload_url}?name={asset_name}",
        headers={**headers, "Content-Type": "application/pdf"},
        data=file_path.read_bytes(),
        timeout=120,
    )
    up.raise_for_status()
    return up.json()["browser_download_url"]


def main():
    if not SUPABASE_URL or not SUPABASE_KEY or not GH_TOKEN:
        print("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GITHUB_TOKEN.")
        sys.exit(1)

    sb_headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/site_cms_state?state_key=eq.{STATE_KEY}&select=state_value", headers=sb_headers, timeout=30)
    r.raise_for_status()
    rows = r.json()
    if not rows or not isinstance(rows[0].get("state_value"), list):
        print("No smart quizzes found.")
        return

    quizzes = rows[0]["state_value"]
    out_dir = pathlib.Path("/tmp/smart_quiz_pdfs")
    out_dir.mkdir(parents=True, exist_ok=True)
    updated = False

    for q in quizzes:
        slug = str(q.get("slug") or q.get("id") or "quiz")
        if TARGET_SLUG and slug != TARGET_SLUG:
            continue
        existing_urls = q.get("pdfUrls") or {}
        if not TARGET_SLUG and all(existing_urls.get(k) for k in ["qEn", "qHi", "sEn", "sHi"]):
            continue

        safe_slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", slug)[:60]
        print(f"Building 4 branded WeasyPrint PDFs for: {slug} ({len(q.get('questions') or [])} Qs)")
        pdf_urls = {}
        variants = [
            ("qEn", "en", False, f"ECA_{safe_slug}_Question_EN.pdf"),
            ("qHi", "hi", False, f"ECA_{safe_slug}_Question_HI.pdf"),
            ("sEn", "en", True, f"ECA_{safe_slug}_Solution_EN.pdf"),
            ("sHi", "hi", True, f"ECA_{safe_slug}_Solution_HI.pdf"),
        ]
        for key, lang, inc_sol, fname in variants:
            html_str = build_pdf_html(q, lang, inc_sol)
            pdf_file = out_dir / fname
            HTML(string=html_str).write_pdf(str(pdf_file))
            url = upload_release_asset(pdf_file, fname)
            pdf_urls[key] = url
            print(f"  -> Uploaded {fname}")

        q["pdfUrls"] = pdf_urls
        updated = True

    if updated:
        up = requests.post(
            f"{SUPABASE_URL}/rest/v1/site_cms_state?on_conflict=state_key",
            headers={**sb_headers, "Prefer": "resolution=merge-duplicates"},
            json={"state_key": STATE_KEY, "state_value": quizzes},
            timeout=30,
        )
        up.raise_for_status()
        print("Saved direct PDF URLs back to Supabase successfully!")
    else:
        print("All quizzes already have direct PDFs.")


if __name__ == "__main__":
    main()
