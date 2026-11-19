# UriPay E2E — Nest staging (escrow)

Fluxo: import link → confirm → pay com UriPay → **escrow hold** + `wallet_transactions.type = escrow`.

## Prerequisites

```bash
npm run docker:staging
curl -fsS http://localhost:4001/api/v1/health
```

- Conta: `joao@uritech.com` / `demo123` com saldo suficiente
- `EXPO_PUBLIC_API_URL=http://<host>:4001/api/v1`

## Happy path (API)

```bash
BASE=http://localhost:4001/api/v1
JT=$(curl -sS -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"joao@uritech.com","password":"demo123"}' | jq -r '.accessToken // .access_token')

IMP=$(curl -sS -X POST $BASE/social-payments/import -H "Authorization: Bearer $JT" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.olx.pt/d/anuncio/example-IDxyz/"}')
PID=$(echo "$IMP" | jq -r '.id')

# garantir preço se scrape falhar
curl -sS -X PATCH "$BASE/social-payments/$PID" -H "Authorization: Bearer $JT" \
  -H 'Content-Type: application/json' -d '{"price":1500,"title":"Produto E2E"}'

PAY=$(curl -sS -X POST "$BASE/social-payments/$PID/pay" -H "Authorization: Bearer $JT" \
  -H 'Content-Type: application/json' -d '{"quantity":1,"deliveryOption":"pickup","payWithWallet":true}')
echo "$PAY" | jq '{receiptCode, orderId: .payment.orderId, status: .payment.paymentStatus}'

ORDER=$(echo "$PAY" | jq -r '.payment.orderId')
curl -sS -H "Authorization: Bearer $JT" "$BASE/wallet/transactions" | jq '[.[] | select(.type=="escrow")][0]'
```

## DB verification (Postgres staging)

```bash
docker exec -e PGPASSWORD=uritech_staging urigo-staging-postgres \
  psql -U uritech -d uritech_staging -c \
  "SELECT id, order_id, amount, status FROM escrow_holds ORDER BY created_at DESC LIMIT 3;"
```

```sql
-- expect status = 'held', amount matches UriPay total (product + fees)
SELECT id, type, amount, description
FROM wallet_transactions
ORDER BY created_at DESC LIMIT 5;
-- expect type = 'escrow', description like 'UriPay Link —%'
```

## Checklist

- [ ] `social_payments.payment_status = paid` + `order_id` set  
- [ ] `wallet_transactions` latest UriPay row is **`escrow`** (not `payment`)  
- [ ] `escrow_holds` row `held` for that `order_id`  
- [ ] Order `service_type = pay`, status `confirmed` after hold  

## Notes

- Release/refund do escrow UriPay segue o ciclo do pedido (`delivered` / `cancelled`) via `OrdersService.updateStatus`.  
- Edge BFF ainda debita como `payment` até paridade — Nest é canónico em staging.  
