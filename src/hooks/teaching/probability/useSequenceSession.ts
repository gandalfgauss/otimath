/* ═══════════════════════════════════════════════════════════════════
   useSequenceSession.ts — Sessão da Sequência Didática

   RESPONSABILIDADES
     • Cronômetro global da trilha (intro → … → complete).
       Inicia quando o aluno clica "Iniciar a sequência didática" e
       pausa quando entra na tela de conclusão.
     • Cronômetro por OVA (Disco e Dois Dados). Acumula apenas o tempo
       em que o respectivo OVA estava ativo — exclui telas de
       introdução, transição e conclusão.
     • Agregação de estatísticas a partir dos logs persistentes de cada
       OVA: `useRouletteLog` e `useTwoDicesLog`. Os OVAs já registram
       todos os eventos (transitions, attempts, text, bets, spin_results,
       study_menu_opened, mark_all_used) — aqui apenas consolidamos.
     • Reset dos logs ao começar nova sequência — garante que as cards
       reflitam só a sessão corrente, não execuções anteriores.

   MODELO DE DADOS (singleton)
     Variáveis a nível de módulo guardam o estado da sessão. Usar
     singleton (em vez de Context) é OK aqui porque a sequência didática
     vive numa única página e nunca há mais de uma sessão simultânea.
     O hook `useSequenceTick` força re-render quando o tempo avança.

   GLOSSÁRIO
     • Interações = total de eventos logados (qualquer clique relevante)
     • Erros     = entries do tipo 'attempt' com success=false
     • Acertos   = entries do tipo 'attempt' com success=true
     (a métrica "Tentativas" — total de attempts — foi removida das stats
      públicas; entries 'attempt' continuam logados pra derivar Erros/Acertos)
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import {
  getLogEntries as getTwoDicesEntries,
  clearLog as clearTwoDicesLog,
  logEntry as logTwoDicesEntry,
  logAttempt as logTwoDicesAttempt,
} from './two-dices/useTwoDicesLog';
import {
  getRouletteLogEntries,
  clearRouletteLog,
  logEntry as logRouletteEntry,
  logAttempt as logRouletteAttempt,
} from './roulette/useRouletteLog';
import { subscribeToAlerts } from '@/hooks/global/useAlerts';

export type OvaKey = 'roulette' | 'twoDices';

/* ─────────────────────────────────────────────────────────────────
   Estado singleton da sessão
   ───────────────────────────────────────────────────────────────── */

let sessionStartTime: number | null = null;
let sessionEndTime: number | null = null;

/** Estado de cada cronômetro de OVA:
 *  • `running`  — tempo corrido sendo somado em `accumMs`
 *  • `paused`   — fora do palco (intro/transição); não conta
 *  • `frozen`   — congelado na tela final do OVA (visualmente parado
 *                 mesmo se o aluno permanecer ali); reativado quando
 *                 o OVA sai do estado terminal.
 */
type TimerState = 'paused' | 'running' | 'frozen';
interface OvaTimer {
  state: TimerState;
  accumMs: number;
  startedAt: number | null;
}

const ovaTimer: Record<OvaKey, OvaTimer> = {
  roulette: { state: 'paused', accumMs: 0, startedAt: null },
  twoDices: { state: 'paused', accumMs: 0, startedAt: null },
};
let activeOva: OvaKey | null = null;

function commitElapsed(ova: OvaKey): void {
  const t = ovaTimer[ova];
  if (t.state === 'running' && t.startedAt !== null) {
    t.accumMs += Date.now() - t.startedAt;
    t.startedAt = null;
  }
}

/* ─────────────────────────────────────────────────────────────────
   Observador global de alertas — registra TODA ocorrência de
   sucesso/erro como `logAttempt` no log do OVA ativo. Sem isso, a
   contagem de tentativas dependia de cada validator chamar logAttempt
   explicitamente, o que era esparso (cobertura < 5%).
   ───────────────────────────────────────────────────────────────── */

let alertUnsubscribe: (() => void) | null = null;

function setupAlertObserver(): void {
  if (alertUnsubscribe) return; // já inscrito
  alertUnsubscribe = subscribeToAlerts((type, title) => {
    if (sessionStartTime === null || sessionEndTime !== null) return;
    if (type !== 'success' && type !== 'error') return;
    if (activeOva === null) return;
    const success = type === 'success';
    if (activeOva === 'roulette') {
      logRouletteAttempt(0, 0, success, title);
    } else {
      logTwoDicesAttempt('runtime', 'auto', success, undefined, title);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   Logger genérico de interação — disparado pelos OVAs no useEffect
   do snapshot DEV (devCenaId) para que cada transição de sub-fase
   conte como interação no card. Captura mudanças que o `logTransition`
   atual perde (sub-fases internas como compPhase, unionPhase, scene7
   phase, etc.).
   ───────────────────────────────────────────────────────────────── */

export function logOvaInteraction(ova: OvaKey, cenaId: string): void {
  if (sessionStartTime === null || sessionEndTime !== null) return;
  if (ova === 'roulette') {
    logRouletteEntry({ type: 'transition', stage: 0, subStep: 0, data: { cenaId } });
  } else {
    logTwoDicesEntry({ type: 'transition', phase: 'runtime', step: cenaId, data: { cenaId } });
  }
}

/* ─────────────────────────────────────────────────────────────────
   Lifecycle público
   ───────────────────────────────────────────────────────────────── */

/** Disparado quando o aluno clica "Iniciar a sequência didática".
 *  Limpa logs anteriores e zera contadores. Idempotente: chamadas
 *  repetidas no mesmo render não reiniciam o cronômetro. */
export function startSequence(): void {
  if (sessionStartTime !== null && sessionEndTime === null) return; // já em curso
  clearRouletteLog();
  clearTwoDicesLog();
  sessionStartTime = Date.now();
  sessionEndTime = null;
  ovaTimer.roulette = { state: 'paused', accumMs: 0, startedAt: null };
  ovaTimer.twoDices = { state: 'paused', accumMs: 0, startedAt: null };
  activeOva = null;
  setupAlertObserver();
}

/** Define qual OVA o aluno está agora trabalhando (ou null durante
 *  intro / transição). Acumula o tempo do OVA anterior antes de trocar.
 *  Se o OVA-alvo estiver `frozen` (tela terminal), apenas marca como
 *  ativo sem retomar a contagem — espera o `unfreezeOva` correspondente. */
export function setActiveOva(next: OvaKey | null): void {
  if (sessionStartTime === null) return; // sequência ainda não iniciou
  if (sessionEndTime !== null) return;   // sequência já concluída
  if (activeOva === next) return;

  if (activeOva) {
    commitElapsed(activeOva);
    if (ovaTimer[activeOva].state === 'running') ovaTimer[activeOva].state = 'paused';
  }
  activeOva = next;
  if (next && ovaTimer[next].state === 'paused') {
    ovaTimer[next].state = 'running';
    ovaTimer[next].startedAt = Date.now();
  }
}

/** Congela o cronômetro de um OVA — chamado pela própria tela terminal
 *  do OVA. Independente de `setActiveOva`: mesmo que o OVA permaneça
 *  como "ativo" no orquestrador, o tempo deixa de avançar visualmente. */
export function freezeOva(ova: OvaKey): void {
  commitElapsed(ova);
  ovaTimer[ova].state = 'frozen';
}

/** Descongela o cronômetro de um OVA — chamado quando o aluno deixa a
 *  tela terminal (ex.: usa DEV para voltar). Se o OVA continua ativo,
 *  retoma a contagem; senão, fica `paused` aguardando. */
export function unfreezeOva(ova: OvaKey): void {
  if (ovaTimer[ova].state !== 'frozen') return;
  ovaTimer[ova].state = 'paused';
  if (activeOva === ova) {
    ovaTimer[ova].state = 'running';
    ovaTimer[ova].startedAt = Date.now();
  }
}

/** Disparado quando o aluno chega na tela final ('complete').
 *  Congela o cronômetro global e o do OVA ativo. */
export function endSequence(): void {
  if (sessionStartTime === null || sessionEndTime !== null) return;
  if (activeOva) {
    commitElapsed(activeOva);
    if (ovaTimer[activeOva].state === 'running') ovaTimer[activeOva].state = 'paused';
  }
  activeOva = null;
  sessionEndTime = Date.now();
}

/* ─────────────────────────────────────────────────────────────────
   Getters de tempo
   ───────────────────────────────────────────────────────────────── */

export function getElapsedTotalMs(): number {
  if (sessionStartTime === null) return 0;
  const end = sessionEndTime ?? Date.now();
  return Math.max(0, end - sessionStartTime);
}

export function getElapsedOvaMs(ova: OvaKey): number {
  const t = ovaTimer[ova];
  let total = t.accumMs;
  if (t.state === 'running' && t.startedAt !== null && sessionEndTime === null) {
    total += Date.now() - t.startedAt;
  }
  return total;
}

export function isSequenceRunning(): boolean {
  return sessionStartTime !== null && sessionEndTime === null;
}

export function isSequenceEnded(): boolean {
  return sessionEndTime !== null;
}

/* ─────────────────────────────────────────────────────────────────
   Agregação de estatísticas — lê dos logs de cada OVA
   ───────────────────────────────────────────────────────────────── */

export interface OvaStats {
  /** ms decorridos no OVA (sem incluir intro/transição/conclusão). */
  elapsedMs: number;
  /** Eventos logados (todos os tipos: cliques, transitions, attempts, etc.). */
  interactions: number;
  errors: number;
  successes: number;
}

export interface SequenceStats {
  roulette: OvaStats;
  twoDices: OvaStats;
  /** Total da trilha — tempo total da sessão + somas dos contadores. */
  total: OvaStats;
}

// `attempts` foi removido das stats públicas — a métrica "Tentativas" não é
// mais coletada/exibida. Entries do tipo 'attempt' continuam logados pra
// derivar `errors` e `successes` (filtrando por success=false/true).
function statsFromEntries(
  entries: readonly { type: string; data: Record<string, unknown> }[],
  elapsedMs: number,
): OvaStats {
  const attemptsArr = entries.filter((e) => e.type === 'attempt');
  const errors = attemptsArr.filter((e) => e.data.success === false).length;
  const successes = attemptsArr.filter((e) => e.data.success === true).length;
  return {
    elapsedMs,
    interactions: entries.length,
    errors,
    successes,
  };
}

export function getSequenceStats(): SequenceStats {
  const roulette = statsFromEntries(getRouletteLogEntries(), getElapsedOvaMs('roulette'));
  const twoDices = statsFromEntries(getTwoDicesEntries(), getElapsedOvaMs('twoDices'));
  const total: OvaStats = {
    elapsedMs: getElapsedTotalMs(),
    interactions: roulette.interactions + twoDices.interactions,
    errors: roulette.errors + twoDices.errors,
    successes: roulette.successes + twoDices.successes,
  };
  return { roulette, twoDices, total };
}

/* ─────────────────────────────────────────────────────────────────
   Formatador — "Xh Ymin Zs"
   ───────────────────────────────────────────────────────────────── */

export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0h 0min 0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}min ${seconds}s`;
}

/* ─────────────────────────────────────────────────────────────────
   Hook React — força re-render por segundo enquanto a sessão roda.
   Use em consumidores que mostram tempo ao vivo (barra de progresso,
   cards de estatística antes do `endSequence()`).
   ───────────────────────────────────────────────────────────────── */

export function useSequenceTick(intervalMs: number = 1000): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (sessionEndTime !== null) return; // pausado: sem polling
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  // Reage a mudanças em sessionEndTime via remount/dep do consumidor.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, sessionEndTime]);
  return getElapsedTotalMs();
}
