-- UriTech — Schema complementar (tabelas em falta para Edge Functions e produção)
-- Executar APÓS a migração core (20260704120000_uritech_core_schema.sql)

-- ============================================================
-- 1. Brand / White-Label Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name VARCHAR(64) NOT NULL DEFAULT 'UriGo',
  tagline VARCHAR(255) DEFAULT 'O super app de Angola',
  logo_url VARCHAR(512),
  favicon_url VARCHAR(512),
  primary_color VARCHAR(8) NOT NULL DEFAULT '#00AA13',
  primary_dark VARCHAR(8) DEFAULT '#008A0F',
  primary_light VARCHAR(8) DEFAULT '#E6F7E8',
  secondary_color VARCHAR(8) DEFAULT '#F06400',
  font_family VARCHAR(64) DEFAULT 'Inter',
  support_email VARCHAR(255) DEFAULT 'suporte@urigo.ao',
  support_phone VARCHAR(32) DEFAULT '+244923000000',
  default_city VARCHAR(64) DEFAULT 'Luanda',
  default_country VARCHAR(64) DEFAULT 'Angola',
  currency_symbol VARCHAR(8) DEFAULT 'Kz',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO brand_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. API Integrations (Multicaixa, Firebase, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_integrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('payment', 'push', 'maps', 'sms', 'email', 'storage')),
  provider VARCHAR(64) NOT NULL,
  api_key VARCHAR(512),
  api_secret VARCHAR(512),
  webhook_url VARCHAR(512),
  merchant_id VARCHAR(128),
  environment VARCHAR(16) NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  status VARCHAR(16) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'unstable')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON api_integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON api_integrations(provider);

-- Seed: Multicaixa Express (placeholder)
INSERT INTO api_integrations (name, type, provider, webhook_url, environment, status, enabled)
VALUES ('Multicaixa Express', 'payment', 'multicaixa', '/api/v1/payments/multicaixa/webhook', 'sandbox', 'inactive', FALSE)
ON CONFLICT DO NOTHING;

-- Seed: Firebase Push
INSERT INTO api_integrations (name, type, provider, environment, status, enabled)
VALUES ('Firebase Cloud Messaging', 'push', 'firebase', 'sandbox', 'inactive', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Drivers (perfil detalhado do motorista)
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(64),
  license_expiry DATE,
  vehicle_type VARCHAR(32) DEFAULT 'standard',
  vehicle_plate VARCHAR(16),
  vehicle_model VARCHAR(128),
  vehicle_color VARCHAR(32),
  vehicle_year INTEGER,
  rating DECIMAL(2, 1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_rides INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(14, 2) NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  current_location_updated_at TIMESTAMPTZ,
  documents_verified BOOLEAN NOT NULL DEFAULT FALSE,
  background_check_passed BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online) WHERE is_online = TRUE;

-- ============================================================
-- 4. Vendors (perfil detalhado do vendedor/loja)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(32) NOT NULL DEFAULT 'restaurant' CHECK (business_type IN ('restaurant', 'supermarket', 'pharmacy', 'shop', 'service')),
  description TEXT,
  address VARCHAR(512),
  city VARCHAR(64) DEFAULT 'Luanda',
  country VARCHAR(64) DEFAULT 'Angola',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  logo_url VARCHAR(512),
  cover_image_url VARCHAR(512),
  rating DECIMAL(2, 1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(14, 2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.1500,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  opening_hours JSONB NOT NULL DEFAULT '{}',
  documents_verified BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors USING GIST (point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================
-- 5. Push Notification Tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL,
  platform VARCHAR(16) NOT NULL DEFAULT 'unknown' CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- ============================================================
-- 6. Web Push Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(512) NOT NULL UNIQUE,
  p256dh VARCHAR(256) NOT NULL,
  auth VARCHAR(128) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_push_user_id ON web_push_subscriptions(user_id);

-- ============================================================
-- 7. Audit Log (compliance + debug)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(128),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- ============================================================
-- 8. Ride Requests (matching em tempo real)
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'driver_found', 'driver_arriving', 'in_progress', 'completed', 'cancelled')),
  mode VARCHAR(16) NOT NULL DEFAULT 'fixed',
  vehicle_type VARCHAR(32) NOT NULL DEFAULT 'standard',
  pickup JSONB NOT NULL,
  destination JSONB NOT NULL,
  fare DECIMAL(12, 2),
  distance INTEGER,
  duration INTEGER,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_by VARCHAR(16),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_user_id ON ride_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver ON ride_requests(driver_id);

-- ============================================================
-- 9. Order Items (normalização de items dos pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- 10. Trigger: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas com updated_at
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['brand_settings', 'api_integrations', 'drivers', 'vendors', 'push_tokens', 'web_push_subscriptions', 'audit_log', 'ride_requests', 'orders', 'wallets', 'social_payments'];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', tbl, tbl);
    EXECUTE format('
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
    ', tbl, tbl);
  END LOOP;
END;
$$;
