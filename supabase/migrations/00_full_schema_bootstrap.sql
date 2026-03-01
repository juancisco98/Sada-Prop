-- ============================================================
-- FULL SCHEMA BOOTSTRAP for new Supabase project
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- ==============================
-- 0. allowed_emails (auth whitelist)
-- ==============================
CREATE TABLE IF NOT EXISTS allowed_emails (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO allowed_emails (email) VALUES
    ('juan.sada98@gmail.com'),
    ('svsistemas@yahoo.com'),
    ('antovent64@gmail.com')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on allowed_emails" ON allowed_emails
    FOR SELECT TO authenticated USING (true);

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
CREATE POLICY "Family access to buildings" ON buildings
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

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
CREATE POLICY "Family access to properties" ON properties
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

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
CREATE POLICY "Family access to professionals" ON professionals
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

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
CREATE POLICY "Family access to maintenance_tasks" ON maintenance_tasks
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

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
CREATE POLICY "Family access to tenants" ON tenants
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

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
CREATE POLICY "Family access to tenant_payments" ON tenant_payments
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

-- ==============================
-- 7. clients (NEW - Realtor CRM)
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
CREATE POLICY "Family access to clients" ON clients
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

-- ==============================
-- 8. appointments (NEW - Realtor CRM)
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
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family access to appointments" ON appointments
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails))
    WITH CHECK ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

-- ==============================
-- Storage bucket for payment proofs
-- ==============================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;
