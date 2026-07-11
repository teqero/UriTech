-- UriPay: Pagar Produto por Link (Social Payments)

CREATE TABLE IF NOT EXISTS social_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(32) NOT NULL,
  original_url TEXT NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(14, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'AOA',
  category VARCHAR(128),
  condition VARCHAR(64),
  brand VARCHAR(128),
  city VARCHAR(128),
  country VARCHAR(128),
  images JSONB NOT NULL DEFAULT '[]',
  videos JSONB NOT NULL DEFAULT '[]',
  seller_name VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'imported',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(64),
  checkout_id VARCHAR(64),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sync_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  sync_message TEXT,
  quantity INT NOT NULL DEFAULT 1,
  delivery_fee DECIMAL(14, 2) NOT NULL DEFAULT 0,
  service_fee DECIMAL(14, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total DECIMAL(14, 2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_payments_buyer ON social_payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_social_payments_status ON social_payments(status);
CREATE INDEX IF NOT EXISTS idx_social_payments_created ON social_payments(created_at DESC);
