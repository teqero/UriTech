#!/bin/sh
# UriTech — Backup automático da base de dados Postgres
# Uso: ./backup.sh [postgres_host] [postgres_port] [postgres_db] [postgres_user] [postgres_password]
# Ou via variáveis de ambiente (padrão Docker):
#   POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
#   BACKUP_RETENTION_DAYS (default: 7)
#   BACKUP_DIR (default: /backups)

set -e

# ── Configuração ──
HOST="${1:-${POSTGRES_HOST:-postgres}}"
PORT="${2:-${POSTGRES_PORT:-5432}}"
DB="${3:-${POSTGRES_DB:-uritech}}"
USER="${4:-${POSTGRES_USER:-uritech}}"
PASS="${5:-${POSTGRES_PASSWORD:-uritech}}"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
OUTDIR="${BACKUP_DIR:-/backups}"

# Timestamp e nome do ficheiro
TS=$(date +%Y%m%d_%H%M%S)
FILENAME="${DB}_${TS}.sql.gz"
OUTPATH="${OUTDIR}/${FILENAME}"

# ── Validação ──
if [ -z "$PASS" ]; then
  echo "[ERRO] POSTGRES_PASSWORD não definido" >&2
  exit 1
fi

# Garantir pasta de backup existe
mkdir -p "$OUTDIR"

# ── Execução ──
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup de ${DB}@${HOST}:${PORT} ..."

# pg_dump com compressão gzip em stream
PGPASSWORD="$PASS" pg_dump \
  -h "$HOST" \
  -p "$PORT" \
  -U "$USER" \
  -d "$DB" \
  --verbose \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -c > "$OUTPATH"

# Verificar se o ficheiro foi criado e tem tamanho > 0
if [ ! -s "$OUTPATH" ]; then
  echo "[ERRO] Backup falhou — ficheiro vazio ou não criado: $OUTPATH" >&2
  rm -f "$OUTPATH"
  exit 1
fi

SIZE=$(du -h "$OUTPATH" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup concluído: ${FILENAME} (${SIZE})"

# ── Rotação (apagar backups mais antigos que $RETENTION dias) ──
DELETED=$(find "$OUTDIR" -maxdepth 1 -name "${DB}_*.sql.gz" -type f -mtime +${RETENTION} -print)
if [ -n "$DELETED" ]; then
  echo "$DELETED" | while read -r f; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] A apagar backup antigo: $(basename "$f")"
    rm -f "$f"
  done
fi

# ── Listagem dos últimos backups ──
LATEST=$(ls -t "${OUTDIR}/${DB}"_*.sql.gz 2>/dev/null | head -5)
if [ -n "$LATEST" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Últimos backups:"
  echo "$LATEST" | while read -r f; do
    ls -lh "$f" | awk '{print "  -", $9, "(" $5 ")", $6, $7, $8}'
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done."
