-- ETERNAL CIVIL ACADEMY - V2 COMPLETE DATABASE SCHEMA (UPDATED)

-- 1. Admin & Super Admin Users Table (with Granular Permissions & Immutable Permanent Owner)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin')),
    is_permanent_owner BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{
      "manageBatches": true,
      "manageCoverPage": true,
      "manageContent": true,
      "manageAnswerEval": true,
      "managePayments": false,
      "manageAutomation": false,
      "manageTelegram": false,
      "viewAnalytics": false,
      "manageSiteSettings": false,
      "manageAdmins": false,
      "lockContent": false
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HARD IMMUTABILITY TRIGGER: Nobody can EVER delete, deactivate, or demote a Permanent Super Admin Owner
CREATE OR REPLACE FUNCTION protect_super_admin_owner()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.is_permanent_owner = TRUE THEN
        RAISE EXCEPTION 'Permanent Super Admin (Owner) cannot be deleted by anyone.';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.is_permanent_owner = TRUE THEN
        IF NEW.role <> 'super_admin' OR NEW.is_permanent_owner <> TRUE OR NEW.is_active <> TRUE THEN
            RAISE EXCEPTION 'Permanent Super Admin (Owner) cannot be demoted or deactivated.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_super_admin_owner ON admin_users;
CREATE TRIGGER trg_protect_super_admin_owner
BEFORE UPDATE OR DELETE ON admin_users
FOR EACH ROW EXECUTE FUNCTION protect_super_admin_owner();

-- 2. Batches Table (Managed by Super Admin & Admin; Payments Strictly Controlled by Super Admin)
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    exam_tag VARCHAR(40) NOT NULL,
    batch_type VARCHAR(40) NOT NULL,
    start_date TEXT,
    duration TEXT,
    mode TEXT,
    medium TEXT,
    faculty TEXT,
    highlights TEXT[] DEFAULT '{}',
    description TEXT,
    cover_image_url TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    price_inr NUMERIC(8,2) DEFAULT 0.00,
    mrp_inr NUMERIC(8,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Admissions Open',
    syllabus_pdf_url TEXT,
    telegram_group_url TEXT,
    uploaded_by UUID REFERENCES admin_users(id),
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cover Page Showcase Slides (Pin Any Batch, Notes, Test Series, Current Affairs, or Custom Banner)
CREATE TABLE IF NOT EXISTS cover_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type VARCHAR(30) NOT NULL,
    source_id TEXT,
    badge TEXT NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT DEFAULT 'Your Success, Our Commitment',
    highlights TEXT[] DEFAULT '{}',
    cta_primary_label TEXT NOT NULL,
    cta_primary_href TEXT NOT NULL,
    cta_secondary_label TEXT,
    cta_secondary_href TEXT,
    cover_images TEXT[] DEFAULT '{}',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    pinned_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Super-Admin-Controlled Join Us (Social Media) & Contact Us Settings
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    telegram_channel TEXT,
    whatsapp_channel TEXT,
    facebook_page TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    linkedin_url TEXT,
    extra_socials JSONB DEFAULT '[]'::jsonb,
    contact_email TEXT,
    contact_mobile TEXT,
    contact_whatsapp TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Unified Current Affairs & Schemes (Free Multi-Source Auto-Sync + Bot Sync + Manual)
CREATE TABLE IF NOT EXISTS current_affairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    section_type VARCHAR(30) NOT NULL CHECK (section_type IN ('daily_ca', 'state_ca', 'central_scheme', 'state_scheme')),
    state_name VARCHAR(50),
    exam_relevance VARCHAR(40) NOT NULL,
    title TEXT NOT NULL,
    why_in_news TEXT NOT NULL,
    key_highlights TEXT[] NOT NULL,
    prelims_facts TEXT[] NOT NULL,
    mains_perspective TEXT NOT NULL,
    title_hi TEXT,
    why_in_news_hi TEXT,
    key_highlights_hi TEXT[],
    prelims_facts_hi TEXT[],
    mains_perspective_hi TEXT,
    english_pdf_url TEXT,
    hindi_pdf_url TEXT,
    uploaded_by UUID REFERENCES admin_users(id),
    is_locked BOOLEAN DEFAULT FALSE,
    published_date DATE DEFAULT CURRENT_DATE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Material Library
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    pillar VARCHAR(40) NOT NULL,
    sub_category VARCHAR(60),
    class_level VARCHAR(20),
    title TEXT NOT NULL,
    cover_image_url TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    price_inr NUMERIC(8,2) DEFAULT 0.00,
    english_pdf_url TEXT,
    hindi_pdf_url TEXT,
    uploaded_by UUID REFERENCES admin_users(id),
    is_locked BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Test Series (Free Live Test Series + Telegram Auto-Synced Quizzes + Paid Test Series)
CREATE TABLE IF NOT EXISTS test_series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    series_type VARCHAR(30) NOT NULL CHECK (series_type IN ('free_live', 'paid_series')),
    source_channel VARCHAR(30) DEFAULT 'website',
    exam_tag VARCHAR(40) NOT NULL,
    title TEXT NOT NULL,
    questions_json JSONB DEFAULT '[]'::jsonb,
    total_tests INT DEFAULT 1,
    duration_minutes INT DEFAULT 20,
    price_inr NUMERIC(8,2) DEFAULT 0.00,
    upi_id TEXT,
    promo_banner_active BOOLEAN DEFAULT FALSE,
    english_pdf_url TEXT,
    hindi_pdf_url TEXT,
    uploaded_by UUID REFERENCES admin_users(id),
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Telegram Bot Candidate Quiz Attempts & Mistakes ("See Mistakes" Bridge)
CREATE TABLE IF NOT EXISTS telegram_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_code TEXT UNIQUE NOT NULL,
    telegram_user_id TEXT NOT NULL,
    student_name TEXT,
    quiz_title TEXT NOT NULL,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    wrong_count INT NOT NULL,
    skipped_count INT DEFAULT 0,
    mistakes_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Answer Evaluation
CREATE TABLE IF NOT EXISTS mains_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gs_paper VARCHAR(20) NOT NULL,
    word_limit INT DEFAULT 150,
    question_text TEXT NOT NULL,
    uploaded_by UUID REFERENCES admin_users(id),
    is_locked BOOLEAN DEFAULT FALSE,
    published_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS answer_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_contact TEXT NOT NULL,
    topic_id UUID REFERENCES mains_topics(id),
    student_note TEXT,
    submitted_file_url TEXT NOT NULL,
    upi_utr_number TEXT NOT NULL,
    payment_verified BOOLEAN DEFAULT FALSE,
    evaluated_file_url TEXT,
    evaluator_feedback TEXT,
    status VARCHAR(30) DEFAULT 'Pending Verification',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Official Commission Notifications
CREATE TABLE IF NOT EXISTS official_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    commission VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    direct_pdf_url TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    published_date DATE DEFAULT CURRENT_DATE
);

-- 11. UPI Payment Unlock Records (Supports premium_notes, test_series, answer_evaluation, batch)
CREATE TABLE IF NOT EXISTS upi_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_contact TEXT NOT NULL,
    item_type VARCHAR(30) NOT NULL,
    item_id TEXT,
    amount_inr NUMERIC(8,2) NOT NULL,
    utr_number TEXT UNIQUE NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Cross-Device No-Code CMS State (Nav Tabs, Exam Countdowns, Ticker/Popup, Coupons, Live Tests)
CREATE TABLE IF NOT EXISTS site_cms_state (
    state_key TEXT PRIMARY KEY,
    state_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Admin Audit Logs (Tracks who changed what & when)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_email TEXT NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_key TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Performance Indexes for Fast Queries & SEO Sitemaps
CREATE INDEX IF NOT EXISTS idx_ca_section_date ON current_affairs (section_type, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_ca_state_name ON current_affairs (state_name);
CREATE INDEX IF NOT EXISTS idx_batches_exam_tag ON batches (exam_tag);
CREATE INDEX IF NOT EXISTS idx_upi_orders_utr ON upi_orders (utr_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs (created_at DESC);

-- 15. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- Public Content Tables: Read-Only for Public, Write ONLY via Service Role (Server APIs)
ALTER TABLE current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_cms_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ca" ON current_affairs;
CREATE POLICY "public_read_ca" ON current_affairs FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_batches" ON batches;
CREATE POLICY "public_read_batches" ON batches FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cover_slides" ON cover_slides;
CREATE POLICY "public_read_cover_slides" ON cover_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_materials" ON study_materials;
CREATE POLICY "public_read_materials" ON study_materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_tests" ON test_series;
CREATE POLICY "public_read_tests" ON test_series FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_notifications" ON official_notifications;
CREATE POLICY "public_read_notifications" ON official_notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_settings" ON site_settings;
CREATE POLICY "public_read_settings" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cms_state" ON site_cms_state;
CREATE POLICY "public_read_cms_state" ON site_cms_state FOR SELECT USING (true);

-- Sensitive Student & Admin Tables: ZERO Public/Anon Access (Server Service Role Only)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upi_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_quiz_attempts ENABLE ROW LEVEL SECURITY;
