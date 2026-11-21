"""
ETERNAL CIVIL ACADEMY — Telegram Quiz Bot & Website Sync Bridge
1. Every quiz conducted by the Telegram Bot is automatically uploaded to the website's
   "Free Live Test Series" section via /api/telegram-quiz-sync.
2. Tracks each candidate's wrong answers (mistakes) during the Telegram quiz.
3. At the end of the quiz, displays an inline "See Mistakes" button that opens:
   https://eternalcivilacademy.com/test-series/mistakes?attempt=<attempt_code>&user=<user_id>
"""
import os
import uuid
import requests
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ApplicationBuilder, PollAnswerHandler, CommandHandler, ContextTypes

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
SITE_URL = os.getenv("NEXT_PUBLIC_SITE_URL", "https://eternalcivilacademy.com")
SYNC_ENDPOINT = f"{SITE_URL}/api/telegram-quiz-sync"
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "eca-secret-sync-token-2026")

HEADERS = {
    "Authorization": f"Bearer {BOT_API_SECRET}",
    "Content-Type": "application/json",
}

# In-memory store for active Telegram quiz polls: poll_id -> question metadata
ACTIVE_POLLS = {}
# User quiz session tracker: user_id -> {"quiz_title": ..., "mistakes": [...], "correct": 0, "total": 0}
USER_SESSIONS = {}


def publish_quiz_to_website_live_test_series(slug: str, title: str, exam_tag: str, questions: list):
    """Automatically uploads every Telegram quiz into website Free Live Test Series."""
    payload = {
        "action": "sync_quiz",
        "quizPayload": {
            "slug": slug,
            "title": title,
            "exam_tag": exam_tag,
            "duration_minutes": max(10, len(questions) * 2),
            "questions": questions,
        },
    }
    res = requests.post(SYNC_ENDPOINT, json=payload, headers=HEADERS, timeout=15)
    return res.json()




def publish_test_pdf_to_website_deduplicated(
    slug: str,
    title: str,
    english_pdf_url: str = "",
    hindi_pdf_url: str = "",
    pillar: str = "test_series_pdf",
):
    """Duplicate-proof auto-sync for Telegram Test PDFs (onConflict: slug prevents duplicates even if run 10x)."""
    payload = {
        "action": "sync_pdf",
        "pdfPayload": {
            "slug": slug,
            "title": title,
            "pillar": pillar,
            "english_pdf_url": english_pdf_url,
            "hindi_pdf_url": hindi_pdf_url,
        },
    }
    res = requests.post(SYNC_ENDPOINT, json=payload, headers=HEADERS, timeout=15)
    return res.json()


async def handle_poll_answer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Captures candidate answer on Telegram quiz poll and records any mistake."""
    answer = update.poll_answer
    poll_id = answer.poll_id
    user_id = str(answer.user.id)
    user_name = answer.user.full_name
    selected_idx = answer.option_ids[0] if answer.option_ids else None

    q_meta = ACTIVE_POLLS.get(poll_id)
    if not q_meta or selected_idx is None:
        return

    session = USER_SESSIONS.setdefault(
        user_id,
        {
            "student_name": user_name,
            "quiz_title": q_meta["quiz_title"],
            "total": 0,
            "correct": 0,
            "mistakes": [],
        },
    )
    session["total"] += 1

    letters = ["A", "B", "C", "D"]
    picked_letter = letters[selected_idx]
    correct_letter = q_meta["correct"]

    if picked_letter == correct_letter:
        session["correct"] += 1
    else:
        session["mistakes"].append(
            {
                "questionNo": q_meta["question_no"],
                "subject": q_meta.get("subject", "General Studies"),
                "questionEn": q_meta["question_en"],
                "questionHi": q_meta.get("question_hi", q_meta["question_en"]),
                "yourChoice": f"{picked_letter} ({q_meta['options'][selected_idx]})",
                "correctChoice": f"{correct_letter} ({q_meta['options'][letters.index(correct_letter)]})",
                "explanationEn": q_meta.get("explanation_en", ""),
                "explanationHi": q_meta.get("explanation_hi", ""),
            }
        )


async def finish_quiz_and_send_mistakes_button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Syncs candidate mistakes to website and sends 'See Mistakes' button in Telegram."""
    user_id = str(update.effective_user.id)
    session = USER_SESSIONS.get(user_id)
    if not session:
        await update.message.reply_text("No active quiz attempt found.")
        return

    attempt_code = f"TG-{uuid.uuid4().hex[:8].upper()}"
    wrong_count = len(session["mistakes"])

    requests.post(
        SYNC_ENDPOINT,
        json={
            "action": "sync_attempt",
            "attemptPayload": {
                "attempt_code": attempt_code,
                "telegram_user_id": user_id,
                "student_name": session["student_name"],
                "quiz_title": session["quiz_title"],
                "total_questions": session["total"],
                "correct_count": session["correct"],
                "wrong_count": wrong_count,
                "mistakes_json": session["mistakes"],
            },
        },
        headers=HEADERS,
        timeout=15,
    )

    mistakes_url = f"{SITE_URL}/test-series/mistakes?attempt={attempt_code}&user={user_id}"
    keyboard = InlineKeyboardMarkup(
        [[InlineKeyboardButton(text="See Mistakes", url=mistakes_url)]]
    )

    await update.message.reply_text(
        f"ETERNAL CIVIL ACADEMY\nQuiz Completed: {session['quiz_title']}\n"
        f"Correct: {session['correct']} | Mistakes: {wrong_count}",
        reply_markup=keyboard,
    )


if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(PollAnswerHandler(handle_poll_answer))
    app.add_handler(CommandHandler("finishquiz", finish_quiz_and_send_mistakes_button))
    app.run_polling()
