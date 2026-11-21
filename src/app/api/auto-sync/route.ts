import { NextRequest, NextResponse } from "next/server";

// Background Cron & Status Endpoint for Free Unlimited Multi-Source Sync
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: "active",
    cost: "100% Free & Unlimited (GitHub Actions Cron + Official RSS)",
    brand: "ETERNAL CIVIL ACADEMY",
    national_sources: [
      "PIB (Press Information Bureau — English & Hindi)",
      "Akashvani / All India Radio (NewsOnAir — National, International, Business, States)",
      "DD News (Doordarshan — National, International, Economy, States)",
      "Prasar Bharati",
    ],
    state_sources: [
      "Uttar Pradesh (Multi-Source Official & Policy RSS)",
      "Bihar (Multi-Source Official & Policy RSS)",
      "Rajasthan (Multi-Source Official & Policy RSS)",
      "Madhya Pradesh (Multi-Source Official & Policy RSS)",
      "Haryana (Multi-Source Official & Policy RSS)",
      "Jharkhand (Multi-Source Official & Policy RSS)",
      "Uttarakhand (Multi-Source Official & Policy RSS)",
    ],
    pipelines: [
      "Daily Current Affairs (National & International — Structured Format)",
      "State-Specific Current Affairs (7 States -> State Special Section)",
      "Central & State Schemes",
      "Telegram Quiz Bot Bridge (/api/telegram-quiz-sync)",
    ],
    timestamp: new Date().toISOString(),
  });
}
