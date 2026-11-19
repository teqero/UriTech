INSERT INTO insurers (id, name, code, contact_email, contact_phone, api_webhook_url, platform_fee_per_claim, platform_fee_monthly, active, mandated_for_clients, clients_count, claims_this_month)
VALUES
  ('ins-1', 'ENSA — Empresa Nacional de Seguros', 'ENSA', 'sinistros@ensa.co.ao', '+244 222 000 111', 'https://api.ensa.co.ao/uriprova/webhook', 2500, 150000, TRUE, TRUE, 12400, 89),
  ('ins-2', 'Nossa Seguros', 'NOSSA', 'claims@nossaseguros.ao', '+244 222 000 222', NULL, 2200, 120000, TRUE, TRUE, 8200, 54),
  ('ins-3', 'Global Seguros', 'GLOBAL', 'sinistros@globalseguros.ao', '+244 222 000 333', NULL, 2000, 95000, TRUE, FALSE, 5100, 31)
ON CONFLICT (id) DO NOTHING;