# Migrações da Base de Dados — UriTech Backend

## Como funciona

O backend corre migrações **automaticamente no startup** quando `synchronize=false` (produção/staging). Em desenvolvimento (`synchronize=true`), o TypeORM gere o schema automaticamente e as migrações são ignoradas.

## Scripts disponíveis (apps/backend/)

```bash
# Gerar uma nova migração a partir das alterações nas entities
cd apps/backend
npm run migration:generate -- src/database/migrations/NomeDaMigracao

# Correr migrações manualmente (não é necessário — o backend faz no startup)
npm run migration:run

# Reverter a última migração
npm run migration:revert

# Ver estado das migrações
npm run migration:show

# Sincronizar schema (dev only — perigoso em produção!)
npm run db:sync
```

## Fluxo de trabalho

### 1. Alterar uma Entity

Edite o ficheiro da entity em `src/database/entities/`.

### 2. Gerar a migração

```bash
cd apps/backend
npm run migration:generate -- src/database/migrations/AddUserPhoneVerified
```

Isto cria um ficheiro em `src/database/migrations/` com timestamp + nome.

### 3. Verificar a migração gerada

Abra o ficheiro gerado e confirme que:
- As operações `up()` fazem sentido
- As operações `down()` revertem corretamente

### 4. Commit

Adicione o ficheiro de migração ao git e faça commit.

### 5. Deploy

No próximo deploy, o backend corre as migrações automaticamente no startup via `MigrationService`.

## Configuração

- **Ficheiro de configuração CLI**: `apps/backend/typeorm.config.ts`
- **Pasta de migrações**: `apps/backend/src/database/migrations/`
- **Tabela de controlo**: `typeorm_migrations` (criada automaticamente na BD)

## Ambientes

| Ambiente | synchronize | Migrações automáticas |
|----------|-------------|----------------------|
| Dev      | true        | ❌ (schema auto)     |
| Staging  | false       | ✅                   |
| Prod     | false       | ✅                   |

## Notas

- Em produção, `synchronize=true` faz o backend abortar com erro de segurança.
- Migrações correm dentro de transações (`transaction: 'each'`) — se uma falha, nenhuma é aplicada.
- O `MigrationService` é um NestJS provider que corre no `onModuleInit()`.
