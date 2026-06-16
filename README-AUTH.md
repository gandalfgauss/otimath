# Autenticação + Persistência de Progresso — Guia de Setup e Teste

Este documento descreve como rodar localmente e em produção (Vercel) o
sistema de login dos alunos + salvamento contínuo do progresso da
sequência didática.

> **Pré-requisito**: você já está nesta branch e rodou `npm install`.
> Faltam apenas 3 passos de infraestrutura (banco + secrets) — TUDO o
> resto está no código.

---

## 1. Criar o banco no Neon (via Vercel)

O Neon é um Postgres serverless gratuito, integrado nativamente com a
Vercel. Você não precisa de cartão de crédito pra free tier.

### 1.1 Em produção (Vercel)
1. Vá em https://vercel.com/dashboard, abra o projeto **otimath**.
2. Aba **Storage** → **Create Database** → escolha **Neon**.
3. Aceite a região default (`us-east-1` ou `sa-east-1` se quiser próximo ao Brasil).
4. Clique **Connect Project** → marque o projeto otimath → confirme.
5. Pronto: a Vercel injeta automaticamente `DATABASE_URL` (e variantes) no projeto.

### 1.2 Em dev local
1. No painel da Vercel, abra o projeto Neon criado acima.
2. Em **Connection Details**, copie a **Pooled connection** (algo como
   `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
3. Cole no `.env.local` na variável `DATABASE_URL`.

> O `.env.local` já foi criado nesta branch com `SESSION_PASSWORD` e
> `LOGOUT_MASTER_PASSWORD` preenchidos. Falta só colar o `DATABASE_URL`.

---

## 2. Criar as tabelas + popular os 40 alunos

No terminal, dentro da pasta `otimath`:

```bash
npm run db:push   # cria as tabelas users + sequence_runs no Neon
npm run db:seed   # popula 30 alunos reais (do PDF) + 10 de teste
```

O `db:seed` é **idempotente**: rodar de novo NÃO duplica nem sobrescreve
hashes existentes. As 10 senhas dos alunos de teste são impressas no
terminal na primeira execução — **anote-as agora** (depois só ficam
hasheadas no banco).

Exemplo de saída:
```
╔════════════════════════════════════════════════════╗
║          CREDENCIAIS DE TESTE (anote agora!)         ║
╚════════════════════════════════════════════════════╝
  alunoTEST01  →  senha: 482593
  alunoTEST02  →  senha: 716284
  ...
```

### Como inspecionar o banco
```bash
npm run db:studio   # abre o Prisma Studio em http://localhost:5555
```
Ou via dashboard Neon → **SQL Editor** → `SELECT * FROM users; SELECT * FROM sequence_runs;`

---

## 3. Configurar secrets na Vercel

No painel do projeto Vercel → **Settings** → **Environment Variables**,
adicione (todos pra **Production**, **Preview** e **Development**):

| Nome                       | Valor                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| `SESSION_PASSWORD`         | (copie do seu `.env.local`, ex.: `1X9A15S0VHjbCXDDEXcD7sJEiHBdNvktt3NCpKLC7ZA=`) |
| `LOGOUT_MASTER_PASSWORD`   | `@logout@`                                                            |
| `QUESTIONNAIRE_PASSWORD`   | `@form@` (ou outra que você queira; só passa pros alunos no momento) |
| `DEV_MODE_PASSWORD`        | `@dev@` (ou outra; só você sabe pra navegar livre em QA)              |
| `DATABASE_URL`             | (já foi injetado pela Integration Neon — confirme que está lá)        |

> **IMPORTANTE**: o `SESSION_PASSWORD` em produção pode ser o mesmo do
> dev OU um diferente — só não deixe vazio. Sessões assinadas com uma
> senha não são lidas por outra (aluno teria que logar de novo).

Após adicionar, faça um `Redeploy` pra a Vercel injetar as novas vars.

---

## 4. Como testar localmente

```bash
npm run dev
# Acesse http://localhost:3000/ensino/probabilidade/sequencia-didatica
```

### Teste 1 — Login funciona
1. Abra a página → aparece tela de login.
2. Digite `alunoTEST01` + senha que apareceu no seed → entra.
3. Tente `alunoTEST01` + senha errada → "Usuário ou senha incorretos".
4. Verifique no DevTools (Application → Cookies): existe um cookie
   `otimath-seq-session` com flag `HttpOnly` (não dá pra ler via
   `document.cookie` no console).

### Teste 2 — Salvamento contínuo
1. Login com `alunoTEST01`.
2. Inicie a sequência, clique em algumas cenas, marque alguns checkboxes.
3. No banco (Studio ou Neon SQL Editor): observe a linha em
   `sequence_runs` com `user_id = alunoTEST01`. Os campos
   `telemetry_json`, `elapsed_total_ms`, `current_stage` atualizam a cada
   ~2s ou quando você troca de stage.
4. Saída cega: feche a aba (sem logout). No banco a row permanece com
   `ended_at = null`.

### Teste 3 — Recuperação ("continua de onde parou")
1. Após o Teste 2 (com algum progresso salvo, sem logout).
2. Feche a aba.
3. Abra outra aba (ou outro browser, ou outro dispositivo — desde que
   no mesmo `localhost`/domínio).
4. Faça login com o MESMO `alunoTEST01`.
5. **Esperado**: a sequência abre **onde você parou** — mesmo stage,
   mesma cena (cronômetro continua do valor anterior, barra de progresso
   preservada, JSON de telemetria preserva o histórico).

### Teste 4 — Logout encerra a sequência
1. Logado, clique no botão **Sair** (canto superior direito).
2. Modal pede senha → digite `@logout@` (a senha mestra do `.env.local`).
3. Confirme.
4. Cai pra tela de login. No banco, a row daquele aluno agora tem
   `ended_at` preenchido e `ended_reason = 'logout'`.
5. Logue de novo com o mesmo aluno → começa do **zero** (nova row em
   `sequence_runs` será criada quando você iniciar a sequência).

### Teste 5 — "Voltar para o início" (na tela final)
1. Complete a sequência até a tela "PARABÉNS!" (use o **DevPanel**
   `@dev@` pra acelerar).
2. Clique em "Voltar para o início".
3. No banco, a row anterior fica com `ended_reason='completed'` e uma
   row nova é criada (vazia). Você é redirecionado pra `/`.

### Teste 6 — Modo DEV não persiste
1. Logue, ative o DevPanel (digite o valor de `DEV_MODE_PASSWORD` —
   default `@dev@` — no input invisível no canto inferior direito).
2. Navegue entre cenas via setas.
3. No banco: a row do aluno NÃO atualiza enquanto o DevPanel estiver
   aberto. Feche o DevPanel → próximo tick do useProgressSync (~2s)
   recomeça a salvar.

### Teste 7 — Senha do questionário (server-side)
1. Chegue na seção pós-sequência (depois de completar os 2 OVAs ou via
   DevPanel) → clique "Abrir questionário".
2. Digite a senha errada → toast "Senha incorreta" + erro inline.
3. Digite o valor de `QUESTIONNAIRE_PASSWORD` (default `@form@`) → modal
   destravado, abre o Google Forms.
4. Verifique no DevTools (Network) que o POST foi para
   `/api/auth/verify-password` e que **a senha não aparece em lugar
   nenhum do bundle de JS** (DevTools → Sources, busca por `@form@` →
   nada encontrado).

### Teste 8 — Brute-force bloqueado
1. Digite 9 senhas erradas seguidas (sequência didática, questionário ou
   logout — qualquer endpoint que use `rateLimitLogin`).
2. A 9ª tentativa devolve `429 rate_limited`. Espere 60s pra resetar.

---

## 5. Como inspecionar dados de um aluno

### Via Neon SQL Editor
```sql
-- Todas as runs de um aluno (mais recentes primeiro):
SELECT
  sr.id,
  sr.started_at,
  sr.last_updated_at,
  sr.ended_at,
  sr.ended_reason,
  sr.current_stage,
  sr.elapsed_total_ms,
  jsonb_pretty(sr.telemetry_json) AS telemetria
FROM sequence_runs sr
JOIN users u ON u.id = sr.user_id
WHERE u.username = 'alunoTEST01'
ORDER BY sr.started_at DESC;
```

### Via Prisma Studio
```bash
npm run db:studio
```
Navegue por tabelas → `SequenceRun` → filtre por `userId`.

---

## 6. Lista das 30 credenciais REAIS (cartões impressos)

Já populadas no banco via seed. Estão no PDF `cartoes_codigos.pdf`. Os
alunos recebem 1 cartão sorteado da urna no dia da aplicação.

> **NÃO compartilhe estas credenciais com os alunos de teste.** Os
> alunos de teste usam **APENAS** as `alunoTEST01..alunoTEST10`.

---

## 7. Arquitetura (resumo técnico)

- **Banco**: Postgres no Neon (gerenciado pela Vercel Integration)
- **ORM**: Prisma 6 (`prisma/schema.prisma`)
- **Sessão**: iron-session (cookie httpOnly assinado, sameSite=lax,
  secure em prod) — 30 dias de validade
- **Hash de senha**: bcrypt (10 rounds)
- **Anti-CSRF**: verificação de header `Origin` em todos os POSTs
- **Rate limit no login**: 8 tentativas/min por IP (in-memory)
- **Sync de progresso**: hook `useProgressSync` — tick a cada 2s,
  fingerprint pra evitar POST sem diff, retry exponencial (max 5),
  `navigator.sendBeacon` no `beforeunload` e `visibilitychange=hidden`
- **DEV mode**: `useProgressSync` recebe `enabled={!devMode}` → no-op
  quando ativo

### Endpoints
| Método | Path                            | Função                                         |
|--------|---------------------------------|------------------------------------------------|
| POST   | `/api/auth/login`               | Valida credencial, cria sessão                 |
| POST   | `/api/auth/logout`              | Exige senha mestra, encerra run, limpa sessão  |
| GET    | `/api/auth/me`                  | Retorna username + hasActiveRun                |
| POST   | `/api/auth/verify-password`     | Valida senha do questionário OU do DevPanel    |
| GET    | `/api/progress`                 | Hidrata run ativa (telemetria + tempos + cena) |
| POST   | `/api/progress`                 | Salva snapshot (upsert na run ativa)           |
| POST   | `/api/progress/new-run`         | Encerra ativa como 'completed' + cria nova     |

### Schema
```
users           (id UUID, username UNIQUE, password_hash, is_test, created_at)
sequence_runs   (id UUID, user_id FK, started_at, last_updated_at,
                 ended_at NULL, ended_reason NULL,
                 telemetry_json JSONB,
                 elapsed_total_ms, elapsed_roulette_ms, elapsed_two_dices_ms,
                 current_stage, current_ova_phase)
```

**Run "ativa"** = `ended_at IS NULL`. Cada aluno tem no máximo 1.
Encerrada por logout (`'logout'`) ou pelo botão "Voltar para o início"
na tela final (`'completed'`). Próximo login cria nova run.

---

## 8. Troubleshooting

**"Could not find Prisma Client"** após `npm install`:
- Rode `npx prisma generate` manualmente. O `postinstall` do
  `package.json` já faz isso, mas pode falhar em ambientes não-padrão.

**"DATABASE_URL não está definido"** ao rodar `db:push`:
- Confirme que o `.env.local` tem `DATABASE_URL="postgresql://..."`.
- Em dev local, o Prisma lê o `.env.local` automaticamente quando o
  comando é executado via `npm run`.

**Aluno reclamou que perdeu progresso após reload**:
- Confira no Neon que a run dele existe e tem `ended_at IS NULL`.
- Se sim, hidratação deve estar funcionando — verifique no DevTools →
  Network → `/api/progress` na carga inicial (deve responder 200 com
  `runId !== null`).
- Se a run está como `ended_reason='logout'`, ele clicou em "Sair" e
  alguém digitou a senha mestra.

**Senhas dos alunos de teste perdidas**:
- Apague-os do banco e re-rode `db:seed`:
  ```sql
  DELETE FROM sequence_runs WHERE user_id IN (SELECT id FROM users WHERE is_test = true);
  DELETE FROM users WHERE is_test = true;
  ```
  ```bash
  npm run db:seed   # imprime as 10 senhas de novo
  ```
