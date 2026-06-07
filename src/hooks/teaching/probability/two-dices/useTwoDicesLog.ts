/* ═══════════════════════════════════════════════════════════════════
   useTwoDicesLog.ts — Log de desempenho para análise a posteriori
   ───────────────────────────────────────────────────────────────────
   Espelha arquiteturalmente `useRouletteLog.ts` (OVA Disco precedente),
   adaptando os tipos de evento ao vocabulário do OVA Dois Dados.
   Implementa o requisito REQ-3 do framework DSR (validação longitudinal
   sistematizada) — Artigue (1996), Almouloud & Coutinho (2008, p. 69).

   PERSISTÊNCIA
     • localStorage (chave 'otimath_two_dices_log')
     • sessionStorage (chave 'otimath_two_dices_session_id') para reset
       entre execuções; fallback gracioso para localStorage cheio.

   TIPOS DE EVENTO (5 do Disco + 2 novos do Dois Dados)
     • 'transition'        — mudança de fase no Experiment ou de step
                             dentro de um exercício (Ex6/Ex7/Ex8).
     • 'attempt'           — tentativa de Conferir (sucesso/falha).
     • 'text'              — entrada textual em fração ou similar.
     • 'bet'               — aposta na Corrida dos Carrinhos.
     • 'spin_result'       — resultado de cada lançamento da Corrida.
     • 'study_menu_opened' — abertura do StudyMenu (qual verbete inicial).
     • 'mark_all_used'     — uso do botão "Marcar todos!" em qual sub-fase.

   Para a Tela de Fechamento Reflexiva (Prioridade 2 deste sprint), o
   campo opcional `data.stepKind` em `attempt` é fonte de detecção de
   vieses cognitivos (mapeamento step → viés via studyMenuContent.ts).
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'otimath_two_dices_log';
const SESSION_KEY = 'otimath_two_dices_session_id';

export type LogEventType =
  | 'transition'
  | 'attempt'
  | 'text'
  | 'bet'
  | 'spin_result'
  | 'study_menu_opened'
  | 'mark_all_used';

export interface LogEntry {
  timestamp: number;
  type: LogEventType;
  /** Identificador da phase do Experiment (string livre) — equivalente ao
   *  `stage` numérico do Disco, mas com semântica nomeada do Dois Dados. */
  phase: string;
  /** Identificador do step interno (kind do exercício, ou índice/nome). */
  step: string;
  data: Record<string, unknown>;
}

export interface SessionLog {
  sessionId: string;
  startTime: number;
  entries: LogEntry[];
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function getSessionId(): string {
  if (!isBrowser()) return 'ssr';
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

function getLog(): SessionLog {
  if (!isBrowser()) {
    return { sessionId: 'ssr', startTime: Date.now(), entries: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionLog;
      if (parsed.sessionId === getSessionId()) return parsed;
    }
  } catch { /* ignorar erros de parsing — começa nova sessão */ }
  return { sessionId: getSessionId(), startTime: Date.now(), entries: [] };
}

function saveLog(log: SessionLog): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch { /* localStorage cheio ou indisponível — descartar silenciosamente */ }
}

export function logEntry(entry: Omit<LogEntry, 'timestamp'>): void {
  const log = getLog();
  log.entries.push({ ...entry, timestamp: Date.now() });
  saveLog(log);
}

/* ───────────────────────────────────────────────────────────────────
   Funções específicas por tipo — assinaturas explícitas por evento
   facilitam a instrumentação dos pontos de uso e evitam erros de
   campos `data` ad-hoc por chamada.
   ─────────────────────────────────────────────────────────────────── */

export function logTransition(phase: string, step: string, prevPhase?: string, prevStep?: string): void {
  logEntry({
    type: 'transition',
    phase,
    step,
    data: { from: prevPhase ?? null, fromStep: prevStep ?? null },
  });
}

export function logAttempt(
  phase: string,
  step: string,
  success: boolean,
  stepKind?: string,
  answer?: string,
): void {
  logEntry({
    type: 'attempt',
    phase,
    step,
    data: {
      success,
      stepKind: stepKind ?? null,
      answer: answer ?? null,
    },
  });
}

export function logText(phase: string, step: string, field: string, value: string): void {
  logEntry({
    type: 'text',
    phase,
    step,
    data: { field, value },
  });
}

export function logBet(phase: string, step: string, choice: string | number): void {
  logEntry({
    type: 'bet',
    phase,
    step,
    data: { choice },
  });
}

export function logSpinResult(phase: string, step: string, result: string | number): void {
  logEntry({
    type: 'spin_result',
    phase,
    step,
    data: { result },
  });
}

export function logStudyMenuOpened(
  phase: string,
  step: string,
  initialGlossaryEntryId?: string,
  triggerStepKind?: string,
): void {
  logEntry({
    type: 'study_menu_opened',
    phase,
    step,
    data: {
      initialGlossaryEntryId: initialGlossaryEntryId ?? null,
      triggerStepKind: triggerStepKind ?? null,
    },
  });
}

export function logMarkAllUsed(phase: string, step: string, targetEvent: string): void {
  logEntry({
    type: 'mark_all_used',
    phase,
    step,
    data: { targetEvent },
  });
}

/* ───────────────────────────────────────────────────────────────────
   Exportação e síntese
   ─────────────────────────────────────────────────────────────────── */

export function exportLog(): string {
  const log = getLog();
  return JSON.stringify(log, null, 2);
}

export function downloadLog(): void {
  if (!isBrowser()) return;
  const content = exportLog();
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `otimath_two_dices_log_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface LogSummary {
  totalTime: string;
  totalEntries: number;
  errors: number;
  studyMenuOpens: number;
  markAllUses: number;
  transitions: number;
}

export function getLogSummary(): LogSummary {
  const log = getLog();
  // Entradas do tipo 'attempt' continuam sendo logadas e usadas pra derivar
  // `errors` (tentativas com success=false). Apenas a contagem total
  // ("Tentativas") foi removida das stats públicas a pedido do colaborador.
  const attempts = log.entries.filter((e) => e.type === 'attempt');
  const errors = attempts.filter((e) => !e.data.success);
  const studyMenuOpens = log.entries.filter((e) => e.type === 'study_menu_opened').length;
  const markAllUses = log.entries.filter((e) => e.type === 'mark_all_used').length;
  const transitions = log.entries.filter((e) => e.type === 'transition').length;
  const elapsed =
    log.entries.length > 0
      ? log.entries[log.entries.length - 1].timestamp - log.startTime
      : 0;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return {
    totalTime: `${minutes}min ${seconds}s`,
    totalEntries: log.entries.length,
    errors: errors.length,
    studyMenuOpens,
    markAllUses,
    transitions,
  };
}

export function getLogEntries(): readonly LogEntry[] {
  return getLog().entries;
}

export function getLogStartTime(): number {
  return getLog().startTime;
}

export function clearLog(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignorar */ }
}

/* ───────────────────────────────────────────────────────────────────
   AGREGADORES PARA TELA DE FECHAMENTO REFLEXIVA

   Sintetizam o log em estruturas consumidas pela Tela de Fechamento
   (vieses cognitivos detectados, dificuldades, desempenho por exercício).
   Mantemos esses agregadores aqui no módulo de log porque dependem da
   estrutura concreta do log — não pertencem ao componente.

   MAPEAMENTO step → viés cognitivo
     Os mapeamentos seguem a tabela do PROMPT_MESTRE_OTIMATH_v5.1
     (T1–T7 do Mapa de Tópicos, vieses V1–V7 documentados).
   ─────────────────────────────────────────────────────────────────── */

export interface BiasOccurrence {
  /** Código do viés conforme PROMPT_MESTRE_OTIMATH_v5.1 (V3.4, V6.1, etc.) */
  code: string;
  /** Nome curto do viés. */
  name: string;
  /** Descrição da literatura. */
  description: string;
  /** Citação ABNT em versalete (referência primária do mapeamento). */
  reference: string;
  /** Quantas vezes este viés foi indiretamente detectado pelo log. */
  occurrences: number;
}

/**
 * Mapeamento step → viés cognitivo (heurístico, baseado na hipótese de
 * que erros sucessivos em determinado tipo de step revelam o viés associado).
 * Não é diagnóstico clínico — é instrumento didático de auto-percepção
 * para o estudante e dado de avaliação a posteriori para o pesquisador.
 */
const BIAS_BY_STEP_KIND: Record<string, Omit<BiasOccurrence, 'occurrences'>> = {
  'mark-A': {
    code: 'V3.4',
    name: 'Negligência do espaço amostral',
    description:
      'Cálculo ou marcação sem identificar n(Ω) corretamente — falha em enumerar o espaço amostral 6×6.',
    reference: 'NAVARRO-PELAYO et al., 2016, p. 734',
  },
  'mark-B': {
    code: 'V3.4',
    name: 'Negligência do espaço amostral',
    description:
      'Cálculo ou marcação sem identificar n(Ω) corretamente — falha em enumerar o espaço amostral 6×6.',
    reference: 'NAVARRO-PELAYO et al., 2016, p. 734',
  },
  'mark-D': {
    code: 'V6.1',
    name: 'Confusão entre "e"/"ou"',
    description:
      '"ou" interpretado como exclusivo em vez de inclusivo (V6.1) ou ambiguidade semântica do "e" (V6.2). Erros em mark-D revelam dificuldade em traduzir linguagem natural em conjunto.',
    reference: 'BATANERO; DIAZ, 2007, p. 123',
  },
  'identify-operation': {
    code: 'V6.3',
    name: 'Heurística aditiva simplificada',
    description:
      'Tendência a tratar união como soma simples sem subtrair interseção — V7.1 em probabilidade — quando não consegue identificar a operação adequada.',
    reference: 'KAHNEMAN; TVERSKY, 1972, p. 432',
  },
  'compute-probability': {
    code: 'V3.3',
    name: 'Confusão probabilidade/frequência',
    description:
      'Dificuldade em interpretar P(A) = n(A)/n(Ω) como razão de cardinalidades — frequentemente associado a erros em frações equivalentes ou no denominador 36.',
    reference: 'GARFIELD; BEN-ZVI, 2014, p. 130',
  },
  'compute-probability-and-complementary': {
    code: 'V5.1',
    name: 'Preferência pelo cálculo direto sobre o complementar',
    description:
      'Não percebe que P(Ā) = 1 − P(A) é estruturalmente útil. Erros nesse step podem indicar dificuldade conceitual com o complementar (P(A) + P(Ā) = 1).',
    reference: 'BATANERO; DIAZ, 2007, p. 127',
  },
};

/**
 * Detecta vieses cognitivos a partir do padrão de erros no log.
 * Heurística: cada erro num step kind acumula 1 ocorrência do viés
 * associado pelo mapa BIAS_BY_STEP_KIND. Retorna lista ordenada por
 * frequência decrescente (mais persistente primeiro).
 */
export function detectCognitiveBiases(): BiasOccurrence[] {
  const log = getLog();
  const counts: Record<string, number> = {};
  for (const e of log.entries) {
    if (e.type !== 'attempt' || e.data.success) continue;
    const kind = String(e.data.stepKind ?? '');
    if (!kind || !BIAS_BY_STEP_KIND[kind]) continue;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  const result: BiasOccurrence[] = [];
  for (const [kind, occurrences] of Object.entries(counts)) {
    result.push({ ...BIAS_BY_STEP_KIND[kind], occurrences });
  }
  return result.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Estrutura de desempenho por exercício/cena.
 * Os campos `phaseName`, `bnccCodes` e `habilityDescription` são
 * declarados no consumidor (Tela de Fechamento) a partir da fase corrente.
 * Aqui retornamos apenas as métricas agregadas a partir do log.
 */
export interface PhasePerformance {
  /** Identificador da phase (ex.: 'unionExercise6'). */
  phase: string;
  errors: number;
  successes: number;
  /** Quantos study_menu_opened ocorreram durante a phase. */
  studyMenuOpens: number;
  /** Tempo gasto na phase (ms entre primeiro e último entry desta phase). */
  elapsedMs: number;
}

/**
 * Agrupa o log por phase e calcula métricas. Útil para a Tela de
 * Fechamento Reflexiva (componente de desempenho por exercício).
 *
 * `attempts` foi removido da interface pública por decisão do colaborador
 * (a métrica "Tentativas" não é mais coletada/exibida). `errors` e
 * `successes` continuam derivados dos entries `type: 'attempt'`.
 */
export function getPhasePerformance(): PhasePerformance[] {
  const log = getLog();
  const map: Record<string, PhasePerformance> = {};
  const firstSeen: Record<string, number> = {};
  const lastSeen: Record<string, number> = {};
  for (const e of log.entries) {
    if (!map[e.phase]) {
      map[e.phase] = {
        phase: e.phase,
        errors: 0,
        successes: 0,
        studyMenuOpens: 0,
        elapsedMs: 0,
      };
      firstSeen[e.phase] = e.timestamp;
    }
    lastSeen[e.phase] = e.timestamp;
    if (e.type === 'attempt') {
      if (e.data.success) map[e.phase].successes += 1;
      else map[e.phase].errors += 1;
    }
    if (e.type === 'study_menu_opened') {
      map[e.phase].studyMenuOpens += 1;
    }
  }
  for (const phase of Object.keys(map)) {
    map[phase].elapsedMs = (lastSeen[phase] ?? 0) - (firstSeen[phase] ?? 0);
  }
  return Object.values(map);
}

/**
 * Agrega quantas vezes cada verbete foi consultado (estrutura
 * usada pela Tela de Fechamento — terceiro componente reflexivo).
 */
export function getGlossaryConsultations(): Array<{ glossaryEntryId: string; count: number }> {
  const log = getLog();
  const counts: Record<string, number> = {};
  for (const e of log.entries) {
    if (e.type !== 'study_menu_opened') continue;
    const id = String(e.data.initialGlossaryEntryId ?? 'desconhecido');
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([glossaryEntryId, count]) => ({ glossaryEntryId, count }))
    .sort((a, b) => b.count - a.count);
}
