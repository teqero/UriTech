-- UriGo core schema (Postgres / Supabase)
-- Run manually or via Supabase CLI when not using TypeORM synchronize.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(32) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  vendor_subtype VARCHAR(32),
  avatar VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL,
  mode VARCHAR(16) NOT NULL,
  pickup JSONB NOT NULL,
  destination JSONB NOT NULL,
  fare DECIMAL(12, 2) NOT NULL,
  distance INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  vehicle_type VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID,
  driver_id UUID,
  service_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(12, 2) NOT NULL,
  delivery_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  pickup_location JSONB NOT NULL,
  delivery_location JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);

CREATE TABLE IF NOT EXISTS insurers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(32) NOT NULL,
  api_webhook_url VARCHAR(512),
  platform_fee_per_claim DECIMAL(12, 2) NOT NULL DEFAULT 0,
  platform_fee_monthly DECIMAL(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  mandated_for_clients BOOLEAN NOT NULL DEFAULT FALSE,
  clients_count INTEGER NOT NULL DEFAULT 0,
  claims_this_month INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_evidence (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(32) NOT NULL UNIQUE,
  insurer_id VARCHAR(64) NOT NULL REFERENCES insurers(id),
  insurer_name VARCHAR(255) NOT NULL,
  policy_number VARCHAR(64) NOT NULL,
  insured_name VARCHAR(255) NOT NULL,
  insured_phone VARCHAR(32) NOT NULL,
  incident_type VARCHAR(32) NOT NULL,
  incident_description TEXT,
  location JSONB NOT NULL,
  media JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  integrity_hash VARCHAR(128) NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_insurer ON claim_evidence(insurer_id);
