-- ============================================================
-- Migration: Realtor Expansion
-- Adds: clients table, appointments table, property fields
-- ============================================================

-- 1. Clients / Leads table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    budget NUMERIC,
    search_type TEXT CHECK (search_type IN ('compra', 'alquiler')),
    property_type_sought TEXT, -- 'casa', 'edificio', 'local' or comma-separated
    notes TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can manage clients"
    ON clients FOR ALL
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

-- 2. Appointments (Visitas) table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    professional_id TEXT REFERENCES professionals(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'REALIZADA', 'CANCELADA')) DEFAULT 'PENDIENTE',
    comentarios_post_visita TEXT,
    interest_rating INTEGER CHECK (interest_rating BETWEEN 1 AND 5),
    price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can manage appointments"
    ON appointments FOR ALL
    USING ((auth.jwt() ->> 'email') IN (SELECT email FROM allowed_emails));

-- 3. Expand properties table
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS key_location TEXT,
    ADD COLUMN IF NOT EXISTS publication_status TEXT
        CHECK (publication_status IN ('CAPTACION', 'DISPONIBLE', 'RESERVADA', 'VENDIDA'))
        DEFAULT 'DISPONIBLE';
