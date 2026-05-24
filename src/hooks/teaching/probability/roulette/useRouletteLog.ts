// Melhoria 12 — Log de desempenho para análise a posteriori (DSR / Artigue / PROFMAT)
// Registro invisível em localStorage: tempo por subStep, tentativas, respostas textuais, apostas

const STORAGE_KEY = 'otimath_roulette_log';

export interface LogEntry {
  timestamp: number;
  type: 'transition' | 'attempt' | 'text' | 'bet' | 'spin_result';
  stage: number;
  subStep: number;
  data: Record<string, unknown>;
}

export interface SessionLog {
  sessionId: string;
  startTime: number;
  entries: LogEntry[];
}

function getSessionId(): string {
  const stored = sessionStorage.getItem('otimath_session_id');
  if (stored) return stored;
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('otimath_session_id', id);
  return id;
}

function getLog(): SessionLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionLog;
      if (parsed.sessionId === getSessionId()) return parsed;
    }
  } catch { /* ignorar erros de parsing */ }
  return { sessionId: getSessionId(), startTime: Date.now(), entries: [] };
}

function saveLog(log: SessionLog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch { /* localStorage cheio ou indisponível */ }
}

export function logEntry(entry: Omit<LogEntry, 'timestamp'>): void {
  const log = getLog();
  log.entries.push({ ...entry, timestamp: Date.now() });
  saveLog(log);
}

export function logTransition(stage: number, subStep: number, prevSubStep: number): void {
  logEntry({
    type: 'transition',
    stage,
    subStep,
    data: { from: prevSubStep }
  });
}

export function logAttempt(stage: number, subStep: number, success: boolean, answer?: string): void {
  logEntry({
    type: 'attempt',
    stage,
    subStep,
    data: { success, answer: answer ?? null }
  });
}

export function logText(stage: number, subStep: number, field: string, value: string): void {
  logEntry({
    type: 'text',
    stage,
    subStep,
    data: { field, value }
  });
}

export function logBet(stage: number, subStep: number, color: string): void {
  logEntry({
    type: 'bet',
    stage,
    subStep,
    data: { color }
  });
}

export function logSpinResult(stage: number, subStep: number, result: string): void {
  logEntry({
    type: 'spin_result',
    stage,
    subStep,
    data: { result }
  });
}

export function exportLog(): string {
  const log = getLog();
  return JSON.stringify(log, null, 2);
}

export function downloadLog(): void {
  const content = exportLog();
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `otimath_log_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lê todas as entradas do log atual — usado pela sessão da sequência
 *  didática para agregar interações/tentativas/erros do OVA do Disco. */
export function getRouletteLogEntries(): readonly LogEntry[] {
  return getLog().entries;
}

/** Limpa o log persistente e o id da sessão — usado pelo orquestrador
 *  da sequência didática ao iniciar uma nova trilha (botão "Iniciar"),
 *  para que as estatísticas da nova sessão não misturem dados antigos. */
export function clearRouletteLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('otimath_session_id');
  } catch { /* ignorar — localStorage indisponível */ }
}

export function getLogSummary(): { totalTime: string; totalEntries: number; attempts: number; errors: number } {
  const log = getLog();
  const attempts = log.entries.filter(e => e.type === 'attempt');
  const errors = attempts.filter(e => !e.data.success);
  const elapsed = log.entries.length > 0
    ? log.entries[log.entries.length - 1].timestamp - log.startTime
    : 0;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return {
    totalTime: `${minutes}min ${seconds}s`,
    totalEntries: log.entries.length,
    attempts: attempts.length,
    errors: errors.length
  };
}
