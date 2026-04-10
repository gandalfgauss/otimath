# OtiMath.com — Contexto do Projeto

Dissertação PROFMAT/UFVJM | Rangel Freitas dos Santos
"Explorando o Acaso: uma sequência didática interativa para o ensino de Probabilidade no Ensino Médio"

---

## ▌ATIVAÇÃO DO PROTOCOLO DR. OTIMATH (OPT-IN)

O protocolo científico Dr. OtiMath v5.1 (análise de OVAs em 8 fases, teorias didáticas, ABNT em VERSALETE, 14 tópicos T1–T14, vieses, parecer de banca PROFMAT) **NÃO carrega automaticamente**.

**Para ativar:** o usuário deve dizer explicitamente uma das frases:
- "Ativar Dr. OtiMath"
- "Modo Dr. OtiMath"
- "Dr. OtiMath" (no início de uma mensagem que pede análise de OVA)

Quando ativado, leia `PROMPT_MESTRE_OTIMATH_v5.1.md` na raiz do projeto e assuma a persona/protocolo descrita lá.

**Sem ativação explícita:** atue como Claude padrão. Não assuma persona, não execute fases, não cite ABNT, não invoque autores, não pergunte sobre OVA. Apenas respeite as regras de arquitetura abaixo (que valem para qualquer trabalho de código no repositório).

**Para desativar dentro de uma sessão ativa:** "Desativar Dr. OtiMath" ou "Sair do modo Dr. OtiMath".

---

## ▌ESTRUTURA DO PROJETO

```
otimath.com/
├── CLAUDE.md                         ← este arquivo (contexto mínimo permanente)
├── PROMPT_MESTRE_OTIMATH_v5.1.md     ← protocolo Dr. OtiMath (carregado sob demanda)
│
├── public/sounds/                    ← NÃO MODIFICAR (6 sons fixos)
│
└── src/
    ├── app/ensino/[area]/[nome-ova]/page.tsx
    ├── components/
    │   ├── global/                   ← REUTILIZAR — não modificar
    │   └── teaching/[area]/[nome-ova]/
    ├── hooks/
    │   ├── global/                   ← REUTILIZAR — não modificar
    │   └── teaching/[area]/[nome-ova]/
    ├── images/teaching/[area]/[nome-ova]/
    └── styles/
        ├── globals.css               ← NÃO MODIFICAR
        └── teaching/[area]/[nome-ova]/

docs/ovas/                            ← arquivos descritivos da Fase 7 (Dr. OtiMath)
```

---

## ▌ARQUITETURA — REGRAS INVIOLÁVEIS DE CÓDIGO

Estas regras valem **sempre**, com ou sem Dr. OtiMath ativado.

```
NÃO FAZER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Modificar estrutura de pastas existente
❌ Alterar Design System (tokens, variáveis, classes CSS)
❌ Criar novos tokens ou modificar globals.css
❌ Criar novos componentes globais (exceto com declaração de ALTERAÇÃO)
❌ Alterar componentes em /components/global/
❌ Modificar ou adicionar sons em /public/sounds/
❌ Usar estilos inline ou CSS fora dos tokens existentes
❌ Usar sons que não existam em /public/sounds/

SEMPRE FAZER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Reutilizar componentes de /components/global/
✅ Reutilizar hooks de /hooks/global/
✅ Usar apenas tokens do Design System (--color-*, --spacing-*, .ds-*)
✅ Seguir a estrutura de pastas definida
✅ Usar playSound() apenas com os 6 sons existentes
```

### Protocolo obrigatório de ALTERAÇÃO

Quando qualquer modificação nas restrições acima for necessária, **declarar antes** com objeto, alteração, consequência, justificativa, e aguardar confirmação explícita ("confirmar") antes de implementar.

---

## ▌DESIGN SYSTEM — REFERÊNCIA RÁPIDA

**Cores:** `--color-brand-otimath-{darkest|darker|dark|pure|medium|light|lighter|lightest}` · `--color-feedback-{success|error|warning|info}-{darkest|dark|lighter}` · `--color-neutral-{black|darkest|dark|medium|light|lighter|lightest|white}`

**Espaçamentos:** `none nano(2) quarck(4) micro(8) macro(12) xxxs(16) xxs(24) xs(32) sm(40) md(48) lg(56) xl(64) xxl(88) xxxl(112) huge(144) giant(176)`

**Border Radius:** `none sm(4) md(8) lg(16) pill(500) circular(50%)`

**Tipografia (classes .ds-\*):** `heading-{tera|giga|ultra|mega|extra|large}` · `body{|-large|-medium|-bold|-large-bold}` · `small{|-medium|-bold}` · `caption{|-bold}` · `overline`

---

## ▌COMPONENTES E HOOKS GLOBAIS DISPONÍVEIS

**Componentes** (`/components/global/`): Alert, Alerts, Button, CardResize, Checkbox, Footer, Grid, GridItem, Header, HeroBanner, List, Modal, SelectInput, TextBlock, TextInput

**Hooks** (`/hooks/global/`): useAlerts, useCheckbox, useModal, useSound

**Sons disponíveis em `/public/sounds/`** (não criar outros):
- `correct.mp3` — acerto
- `incorrect.mp3` — erro
- `clear.mp3` — limpar/reiniciar
- `challengeFinished.mp3` — desafio concluído
- `nextChallenge.mp3` — próximo desafio
- `gameFinished.mp3` — jogo finalizado

---

## ▌R14 — VALIDAÇÃO DE FRAÇÕES PROBABILÍSTICAS

Quando um OVA pedir probabilidade em forma de fração `num/den`, **aceitar qualquer fração matematicamente equivalente** via comparação por multiplicação cruzada:

```typescript
const equivalent = num * total === den * favorable;
```

Validar antes: `num` e `den` inteiros não-negativos, `den > 0`, campos não vazios. Mensagem de erro deve informar que equivalentes são aceitas.

Implementação de referência: [`TwoDicesPractice.tsx`](src/components/teaching/probability/two-dices/TwoDicesPractice.tsx) (`validateCalc`, `validateCompCalc`).

---

## ▌DEPENDÊNCIAS DISPONÍVEIS

`dagre · html-react-parser · lucide-react · next · react · react-dom · reactflow · three`

---

*OtiMath.com — Rangel Freitas dos Santos — PROFMAT/UFVJM*
*CLAUDE.md mínimo. Protocolo Dr. OtiMath em PROMPT_MESTRE_OTIMATH_v5.1.md (opt-in).*
