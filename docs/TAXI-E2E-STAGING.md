# Taxi E2E — Nest staging

Fluxo P0: reservar → rastrear → estados na DB → pagamento UriPay (**débito na reserva**, não no `completed`).

## Prerequisites

```bash
npm run docker:staging
curl -fsS http://localhost:4001/api/v1/health   # healthy
```

- Mobile: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4001/api/v1`
- Contas seed: `joao@uritech.com` (passageiro), `budi@uritech.com` (motorista), senha `demo123`

## State machine

`searching` → `driver_found` → `driver_arriving` → **`arrived`** → `in_progress` → `completed`  
(ou `cancelled` pelo passageiro até `driver_arriving`)

Passageiro em `/rastreamento`:
- estados em tempo real (WS + poll)
- pin + **trajetória** do motorista no mapa
- aviso **Taxi chegou!** (Alert + vibração + push/local) no estado `arrived`

## Happy path (app)

1. Login **joao** → Taxi → destino → RESERVAR  
2. Confirmar resposta com `id` + `status: searching`; saldo UriPay desce  
3. Abrir rastreamento `/rastreamento?ref=<uuid>&service=taxi`  
4. Login **budi** → pedidos → VER PEDIDO → ACEITAR → `driver_found`  
5. Navegação motorista: ao abrir → `driver_arriving` (GPS a cada 3s); **CHEGUEI** → `arrived` (cliente notificado); **INICIAR VIAGEM** → `in_progress`; DESTINO → `completed`  
6. Passageiro: banner de chegada + mapa com rota; depois `completed`

## curl (sem UI motorista)

```bash
BASE=http://localhost:4001/api/v1

# login passageiro
JOAO=$(curl -sS -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"joao@uritech.com","password":"demo123"}')
JT=$(echo "$JOAO" | jq -r '.accessToken // .access_token')

# criar corrida
RIDE=$(curl -sS -X POST $BASE/rides -H "Authorization: Bearer $JT" -H 'Content-Type: application/json' \
  -d '{"mode":"fixed","fare":2500,"distance":5000,"duration":900,"vehicleType":"standard","pickup":{"latitude":-8.8383,"longitude":13.2344,"address":"Luanda"},"destination":{"latitude":-8.84,"longitude":13.23,"address":"Talatona"}}')
RID=$(echo "$RIDE" | jq -r '.id')
echo "ride=$RID status=$(echo "$RIDE" | jq -r '.status')"

# login motorista + aceitar + avançar
BUDI=$(curl -sS -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"budi@uritech.com","password":"demo123"}')
BT=$(echo "$BUDI" | jq -r '.accessToken // .access_token')

for S in driver_found driver_arriving arrived in_progress completed; do
  curl -sS -X PATCH "$BASE/rides/$RID/status" -H "Authorization: Bearer $BT" \
    -H 'Content-Type: application/json' -d "{\"status\":\"$S\"}" | jq -r '.status'
done

curl -sS -H "Authorization: Bearer $JT" "$BASE/rides/$RID" | jq '{id,status,driverId,fare}'
curl -sS -H "Authorization: Bearer $JT" "$BASE/wallet/transactions" | jq '.[0:3]'
```

## Checklist

- [ ] Row em `rides` com cadeia completa de status  
- [ ] `wallet_transactions` com pagamento na **criação**  
- [ ] Tracking passageiro acompanha estados  
- [ ] (Opcional) WebSocket “Em tempo real”

## Known gaps

- Cancel não reembolsa wallet  
- Motorista não recebe crédito separado no `completed` (tarifa já debitada ao passageiro)  
- `eas.json` default ainda aponta Edge — usar env staging  
- Activity tab ainda não lista `GET /rides` do user  
