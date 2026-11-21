# ETERNAL CIVIL ACADEMY — Complete Production Build (V2.5 Updated)
*Your Success, Our Commitment*

## What's New in V2.5
- **Batches Section (`/batches` & `/batches/[slug]`)**: Added right next to Home & Test Series across Desktop Navbar, Mobile Bottom Nav, Home Quick Tiles, and Home New Batches Showcase. Both Super Admin and Admin can add/manage batches, while **Payment Verification & UPI Orders remain strictly Super Admin only** (unless explicitly delegated).
- **Cover Page Showcase Control (`/admin`)**: Both Super Admin & Admin can pin **any item on the website** (New Batch, Notes/Book Cover, Current Affairs Article, Test Series, or Custom Banner) directly onto the Home Cover Page Carousel, reorder slides, or toggle visibility.
- **Granular RBAC & Immutable Super Admin Ownership (`src/lib/adminAccessStore.ts` + `database/schema.sql`)**:
  - Automation Engine, Telegram Bot Bridge, Payment System, Analytics, Site Settings, and Team Admin Management are hidden from regular Admins by default.
  - Super Admin can grant **any individual permission** (or 100% Full Access) to any specific Admin on demand.
  - **Immutable Ownership Protection**: Enforced in UI, store logic, and PostgreSQL trigger (`protect_super_admin_owner`) — **no Admin can ever delete, demote, or deactivate the Super Admin (Permanent Owner)**.
- **100% Free & Unlimited National + State Current Affairs Auto-Sync (`automation_workers/stealth_auto_sync.py` + `.github/workflows/auto-sync.yml`)**:
  - National Official Feeds: PIB (English & Hindi), Akashvani (NewsOnAir), DD News, Prasar Bharati + Official Gov RSS mirrors.
  - State-Specific Multi-Source Feeds: Uttar Pradesh, Bihar, Rajasthan, Madhya Pradesh, Haryana, Jharkhand, Uttarakhand — routed directly to **State Special → State Current Affairs** (`/api/current-affairs`).
  - Exam-relevance filtering + zero raw link dumps + structured format (**Why in News**, **Key Highlights / Detailed Explanation**, **Prelims Facts ★**, **Mains Perspective**).
  - Uses Free Gemini API tier when `GEMINI_API_KEY` is provided, with a 100% free unlimited BeautifulSoup deterministic fallback so sync runs forever at ₹0.

## Local Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000` (Main Website), `http://localhost:3000/batches` (Batches), and `http://localhost:3000/admin` (Super Admin / Admin Panel).
