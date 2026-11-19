-- RLS: bloqueia acesso directo via anon/authenticated às tabelas sensíveis.
-- A edge function (service_role) continua com acesso total.

ALTER TABLE IF EXISTS social_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS claim_evidence ENABLE ROW LEVEL SECURITY;

-- Sem policies = apenas service_role (bypass RLS) acede.