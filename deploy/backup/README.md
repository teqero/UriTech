# Backup Automático — UriTech

## O que é

O serviço `backup` no `docker-compose.prod.yml` corre um container Alpine com `pg_dump` que faz backup automático da base de dados Postgres segundo um cron schedule configurável.

## Funcionamento

- **Schedule padrão**: todos os dias às **02:00** (`0 2 * * *`)
- **Formato**: SQL comprimido com gzip (`uritech_YYYYMMDD_HHMMSS.sql.gz`)
- **Retenção**: apaga backups com mais de **7 dias** por defeito
- **Destino**: volume Docker `uritech_backups` (persistente)

## Configuração

Adicione ao seu `deploy/.env`:

```env
# Backup
BACKUP_RETENTION_DAYS=7          # Dias a manter backups
BACKUP_SCHEDULE=0 2 * * *        # Cron expression (default: 2h da manhã)
```

## Scripts úteis

```bash
# Correr backup manualmente
docker compose -f deploy/docker-compose.prod.yml exec backup /usr/local/bin/backup.sh

# Listar backups
docker compose -f deploy/docker-compose.prod.yml exec backup ls -lh /backups

# Copiar backup para máquina local
docker compose -f deploy/docker-compose.prod.yml cp backup:/backups/uritech_20260115_020000.sql.gz ./

# Restaurar backup (atenção: apaga dados atuais!)
gunzip < uritech_20260115_020000.sql.gz | docker compose -f deploy/docker-compose.prod.yml exec -T postgres psql -U uritech -d uritech
```

## Restauração

1. Pare o backend para evitar writes durante a restauração:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml stop backend
   ```

2. Restaure o backup:
   ```bash
   gunzip < uritech_20260115_020000.sql.gz | \
     docker compose -f deploy/docker-compose.prod.yml exec -T postgres psql -U uritech -d uritech
   ```

3. Reinicie o backend:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml start backend
   ```

## Monitoramento

Os logs do container de backup mostram cada execução:
```bash
docker compose -f deploy/docker-compose.prod.yml logs -f backup
```

## Notas

- O backup usa `pg_dump` com `--clean --if-exists` para permitir restauração completa
- A password do Postgres é passada via ambiente (não aparece em `ps`)
- O container espera o Postgres estar healthy antes de iniciar
