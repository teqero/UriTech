# UriProva — Evidências Certificadas de Sinistro

## Visão do produto

**UriProva** é o serviço UriGo que permite aos segurados reportar sinistros com **evidências multimédia verificáveis** (fotos, vídeo, áudio), enviadas **directamente à seguradora**. O objectivo é reduzir fraude, acelerar indemnizações e criar confiança entre seguradoras, reguladores e clientes.

As seguradoras **pagam uma taxa à plataforma** (configurável no backoffice). Os **segurados usam gratuitamente** quando a sua seguradora é parceira ou tem uso obrigatório activado.

---

## Problema que resolve

| Hoje | Com UriProva |
|------|----------------|
| Fotos editadas ou reutilizadas | GPS + timestamp em cada ficheiro |
| Relatos inconsistentes | Checklist guiada no local |
| Envio por WhatsApp/email sem rasto | Webhook API + referência URI-CLM-XXXXX |
| Fraude em danos pré-existentes | Vídeo 360° + áudio declarativo |
| Processos lentos | Dossiê digital completo no primeiro contacto |

---

## Fluxo do segurado (mobile)

1. **Início** — Card UriProva na Home ou atalho rápido
2. **Apólice** — Seleccionar seguradora + nº apólice + contacto
3. **Sinistro** — Tipo (colisão, roubo, etc.) + descrição
4. **Captura** — Checklist: panorâmica, danos, matrículas, vídeo, áudio, testemunhas
5. **Revisão** — Hash de integridade + confirmação
6. **Envio** — API → seguradora; referência para acompanhamento

---

## Fluxo da seguradora (B2B)

1. **Cadastro** no backoffice Admin → Seguradoras
2. **Configurar** taxa por sinistro (`platformFeePerClaim`) e licença mensal opcional
3. **Webhook** URL para recepção automática de dossiês
4. **Mandato** — flag `mandatedForClients`: clientes obrigados a usar UriGo
5. **Dashboard** — sinistros do mês, receita estimada da plataforma

---

## Modelo de receita

- **Taxa por sinistro** — cobrada à seguradora por cada reporte submetido (ex: 2.500 Kz)
- **Licença mensal** — acesso à plataforma + API (ex: 150.000 Kz/mês)
- **Futuro:** pacotes por volume, SLA premium, integração IA anti-fraude

---

## Anti-fraude e integridade

- Carimbo **GPS + hora UTC** em cada media item
- **Hash de integridade** (`UP-XXXXXXXX`) derivado do conteúdo e metadados
- **Cadeia de custódia** — referência única `URI-CLM-XXXXX`
- Integração futura com **IA UriGo** para detecção de imagens duplicadas ou manipuladas
- Webhook assinado (HMAC) — roadmap

---

## API (backend NestJS)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/insurers` | Listar seguradoras (`?active=true`) |
| GET | `/api/v1/insurers/stats` | Estatísticas da plataforma |
| POST | `/api/v1/insurers` | Cadastrar seguradora |
| PUT | `/api/v1/insurers/:id` | Actualizar taxas e dados |
| PATCH | `/api/v1/insurers/:id/toggle` | Activar/desactivar |
| POST | `/api/v1/claim-evidence` | Submeter dossiê de sinistro |
| GET | `/api/v1/claim-evidence` | Listar reportes (admin) |

---

## Implementação actual

| Camada | Ficheiros |
|--------|-----------|
| Shared | `packages/shared/src/claimproof.ts`, `types.ts`, `constants.ts` |
| Backend | `apps/backend/src/insurers/`, `claim-evidence/` |
| Admin | `apps/web-admin/src/app/(admin)/seguradoras/` |
| Mobile | `apps/mobile-user/app/uriprova.tsx` |
| Web | `apps/web-user/src/app/[service]/page.tsx` (uriprova) |

---

## Roadmap UriProva

- [x] `expo-image-picker` + `expo-av` + `expo-location` — captura real no mobile-user
- [ ] Upload para blob storage (Azure/S3) com URLs assinadas
- [ ] Push notification quando seguradora actualiza estado
- [ ] Portal seguradora (web) para rever evidências
- [ ] Assinatura HMAC nos webhooks
- [ ] Score de fraude via IA UriGo
- [ ] Modo offline com fila de sincronização
