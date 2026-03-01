-- ============================================================
-- FULL SCHEMA BOOTSTRAP for new Supabase project
-- Run this FIRST in Supabase SQL Editor
-- Multi-tenant: each user sees only their own data
-- ============================================================

-- ==============================
-- 1. buildings
-- ==============================
CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    coordinates JSONB,
    country TEXT NOT NULL DEFAULT 'Argentina',
    currency TEXT NOT NULL DEFAULT 'ARS',
    image_url TEXT,
    notes TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on buildings" ON buildings
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 2. properties
-- ==============================
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    tenant_name TEXT NOT NULL DEFAULT 'Vacante',
    tenant_phone TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'CURRENT',
    monthly_rent NUMERIC NOT NULL DEFAULT 0,
    coordinates JSONB,
    contract_end TEXT,
    last_payment_date TEXT,
    assigned_professional_id TEXT,
    professional_assigned_date TEXT,
    maintenance_task_description TEXT,
    notes TEXT,
    last_modified_by TEXT,
    rooms INTEGER,
    square_meters NUMERIC,
    country TEXT NOT NULL DEFAULT 'Argentina',
    currency TEXT NOT NULL DEFAULT 'ARS',
    exchange_rate NUMERIC,
    building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL,
    unit_label TEXT DEFAULT '',
    property_type TEXT DEFAULT 'casa',
    key_location TEXT,
    publication_status TEXT CHECK (publication_status IN ('CAPTACION', 'DISPONIBLE', 'RESERVADA', 'VENDIDA')) DEFAULT 'DISPONIBLE',
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on properties" ON properties
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 3. professionals
-- ==============================
CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profession TEXT NOT NULL,
    rating NUMERIC DEFAULT 5,
    speed_rating NUMERIC DEFAULT 5,
    zone TEXT,
    phone TEXT,
    reviews JSONB DEFAULT '[]'::jsonb,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on professionals" ON professionals
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 4. maintenance_tasks
-- ==============================
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    professional_id TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    start_date TEXT,
    estimated_cost NUMERIC DEFAULT 0,
    cost NUMERIC,
    end_date TEXT,
    partial_expenses JSONB DEFAULT '[]'::jsonb,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on maintenance_tasks" ON maintenance_tasks
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 5. tenants
-- ==============================
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on tenants" ON tenants
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 6. tenant_payments
-- ==============================
CREATE TABLE IF NOT EXISTS tenant_payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    paid_on_time BOOLEAN DEFAULT true,
    payment_date TEXT,
    payment_method TEXT,
    proof_of_payment TEXT,
    notes TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on tenant_payments" ON tenant_payments
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 7. clients (Realtor CRM)
-- ==============================
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    budget NUMERIC,
    search_type TEXT CHECK (search_type IN ('compra', 'alquiler')),
    property_type_sought TEXT,
    notes TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on clients" ON clients
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 8. appointments (Visitas)
-- ==============================
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    professional_id TEXT REFERENCES professionals(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 30,
    status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'REALIZADA', 'CANCELADA')) DEFAULT 'PENDIENTE',
    comentarios_post_visita TEXT,
    interest_rating INTEGER CHECK (interest_rating BETWEEN 1 AND 5),
    price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,
    google_event_id TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User isolation on appointments" ON appointments
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- ==============================
-- 9. google_tokens (OAuth token persistence)
-- ==============================
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

-- ==============================
-- 10. calendar_sync_state (incremental sync cursor)
-- ==============================
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

-- ==============================
-- Storage bucket for payment proofs
-- ==============================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Per-user storage isolation
CREATE POLICY "User isolation on payment_proofs" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
