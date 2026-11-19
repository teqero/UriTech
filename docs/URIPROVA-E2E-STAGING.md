# UriProva E2E — Nest staging

Fluxo: captura → upload bucket MinIO → `POST /claim-evidence` → referência + hash únicos.

## Prerequisites

```bash
npm run docker:staging
# buckets: uritech-media, uritech-claims, uritech-uploads
curl -fsS http://localhost:4001/api/v1/health
```

- Conta: `joao@uritech.com` / `demo123`
- Seguradoras seed: `ins-1` (ENSA), `ins-2`, `ins-3`

## Happy path (API)

```bash
BASE=http://localhost:4001/api/v1
JT=$(curl -sS -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"joao@uritech.com","password":"demo123"}' | jq -r '.accessToken // .access_token')

# 1) Upload evidência (servidor → MinIO uritech-claims)
UP=$(curl -sS -X POST $BASE/upload/claim -H "Authorization: Bearer $JT" \
  -F "file=@./docs/URIPROVA-E2E-STAGING.md;type=image/jpeg;filename=scene.jpg")
# em PowerShell use multipart equivalente; URL pública em .url
echo "$UP" | jq '{url,key}'

# 2) Submeter dossiê
CLAIM=$(curl -sS -X POST $BASE/claim-evidence -H "Authorization: Bearer $JT" \
  -H 'Content-Type: application/json' \
  -d "{
    \"insurerId\":\"ins-1\",
    \"policyNumber\":\"POL-E2E-001\",
    \"insuredName\":\"João Demo\",
    \"insuredPhone\":\"+244900000001\",
    \"incidentType\":\"colisao\",
    \"incidentDescription\":\"Teste staging UriProva\",
    \"location\":{\"latitude\":-8.8383,\"longitude\":13.2344,\"address\":\"Luanda\"},
    \"media\":[{
      \"id\":\"m1\",
      \"type\":\"photo\",
      \"label\":\"Panorâmica\",
      \"uri\":\"$(echo "$UP" | jq -r '.url')\",
      \"capturedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }")
echo "$CLAIM" | jq '{reference: .report.reference, hash: .report.integrityHash, status: .report.status}'

# 3) Verificar por referência
REF=$(echo "$CLAIM" | jq -r '.report.reference')
curl -sS -H "Authorization: Bearer $JT" "$BASE/claim-evidence/reference/$REF" \
  | jq '{reference, integrityHash, media: .media[0].uri, status}'
```

## Checklist

- [ ] Objecto no bucket `uritech-claims` (ou URL pública MinIO)  
- [ ] `claim_evidence` row com `reference` único + `integrity_hash`  
- [ ] `GET /claim-evidence/reference/:ref` devolve o dossiê  
- [ ] `media[].uri` aponta para objecto no storage  

## Notes

- Mobile usa `POST /upload/presigned` (default bucket `uritech-uploads`) para ficheiros >1MB.  
- Edge BFF mantém `uritech-uploads` no Supabase Storage até cutover.  
