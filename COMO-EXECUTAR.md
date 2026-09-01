# UriTech - Como Executar o Projeto Localmente

## Estado Atual (verificado)

| Servico | Porta | Estado |
|---------|-------|--------|
| Backend NestJS | 4000 | ✅ NO AR - http://localhost:4000/api/v1 |
| Postgres | 5432 | ✅ Docker |
| Redis | 6379 | ✅ Docker |
| MinIO | 9000 | ✅ Docker |
| Web Admin | 3000 | ❌ PRECISA INICIAR |
| Web User | 3001 | ❌ PRECISA INICIAR |

## Comandos para iniciar (PowerShell)

### 1. Backend (ja esta no ar, so para referencia)
```powershell
cd "C:\Users\joao.tati\UriTech\apps\backend"
npm run start:prod
```

### 2. Web Admin
Abre uma **nova janela** do PowerShell e executa:
```powershell
cd "C:\Users\joao.tati\UriTech\apps\web-admin"
npm run dev
```
Acede: http://localhost:3000

### 3. Web User (App)
Abre uma **nova janela** do PowerShell e executa:
```powershell
cd "C:\Users\joao.tati\UriTech\apps\web-user"
npm run dev
```
Acede: http://localhost:3001

---

## Alternativa: Script automatico

Na raiz do projeto, corre como **Administrador**:
```powershell
cd "C:\Users\joao.tati\UriTech"
.\start-all.bat
```

Isto abre 3 janelas separadas com Backend, Admin e App.

## Para parar tudo

```powershell
cd "C:\Users\joao.tati\UriTech"
.\stop-all.bat
```

Ou manualmente:
- Fecha as janelas do Node.js
- Executa: `docker compose -f docker-compose.dev.yml down`
