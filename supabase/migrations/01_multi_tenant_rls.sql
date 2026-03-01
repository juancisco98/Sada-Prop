-- ============================================================
-- MIGRATION: Multi-tenant RLS
-- Replace family email whitelist with per-user data isolation
-- Also adds: google_tokens, calendar_sync_state, google_event_id
-- ============================================================

-- 1. Drop all old "Family access" policies
DROP POLICY IF EXISTS "Family access to buildings" ON buildings;
DROP POLICY IF EXISTS "Family access to properties" ON properties;
DROP POLICY IF EXISTS "Family access to professionals" ON professionals;
DROP POLICY IF EXISTS "Family access to maintenance_tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Family access to tenants" ON tenants;
DROP POLICY IF EXISTS "Family access to tenant_payments" ON tenant_payments;
DROP POLICY IF EXISTS "Family access to clients" ON clients;
DROP POLICY IF EXISTS "Family access to appointments" ON appointments;
DROP POLICY IF EXISTS "Allowed users can manage clients" ON clients;
DROP POLICY IF EXISTS "Allowed users can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated read on allowed_emails" ON allowed_emails;

-- 2. Create per-user RLS policies (user_id = auth.uid()::text)
CREATE POLICY "User isolation on buildings" ON buildings
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on properties" ON properties
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on professionals" ON professionals
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on maintenance_tasks" ON maintenance_tasks
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on tenants" ON tenants
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on tenant_payments" ON tenant_payments
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on clients" ON clients
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "User isolation on appointments" ON appointments
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- 3. Google tokens table (persist OAuth provider tokens for Calendar/Gmail)
CREATE TABLE IF NOT EXISTS google_tokens (
    user_id TEXT PRIMARY KEY,
    provider_token TEXT NOT NULL,
    provider_refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on google_tokens" ON google_tokens
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- 4. Calendar sync state (track incremental sync cursor per user)
CREATE TABLE IF NOT EXISTS calendar_sync_state (
    user_id TEXT PRIMARY KEY,
    sync_token TEXT,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on calendar_sync_state" ON calendar_sync_state
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- 5. Add google_event_id to appointments for Calendar sync
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- 6. Storage: per-user isolation for payment-proofs bucket
-- Users should only access files in their own folder: {user_id}/filename
CREATE POLICY "User isolation on payment_proofs" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
