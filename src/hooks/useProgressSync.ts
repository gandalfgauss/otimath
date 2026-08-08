'use client';

/**
 * useProgressSync — salva o progresso do aluno no servidor de forma
 * resiliente.
 *
 * COMO FUNCIONA
 *   • Tick a cada `INTERVAL_MS`: pega o snapshot atual da telemetria +
 *     tempos da sessão + posição (stage + cena do OVA) e enfileira
 *     pra envio.
 *   • Debounce + único in-flight: se um POST está em andamento, o
 *     próximo enfileira a "última versão". Ao terminar, dispara se há
 *     diff.
 *   • Falha silenciosa com retry exponencial (max 5 tentativas) — não
 *     quebra a UX do aluno se a rede oscilar.
 *   • Antes de `beforeunload`, faz `navigator.sendBeacon` com o
 *     snapshot atual — não bloqueia o fechamento da aba.
 *
 * GATE DE DEV MODE
 *   Recebe `enabled` (boolean). O caller passa `enabled={!devMode}`.
 *   Quando false, o hook vira NO-OP completo (não monta listeners, não
 *   posta). Mesmo padrão do print no console em DEV.
 *
 * ENTRADA
 *   `getSnapshot()` é uma função fornecida pelo caller que retorna o
 *   payload completo a ser persistido — tipicamente combina
 *   `getTelemetrySnapshot()` + `getElapsedTotalMs()` + `getElapsedOvaMs()`
 *   + stage atual + cena atual do OVA.
 */

import { useEffect, useRef } from 'react';

const INTERVAL_MS = 2_000; // tick de checagem de mudanças
const MAX_RETRIES = 5;

/** Flag global que SUPRIME todos os POSTs / sendBeacons do useProgressSync.
 *  Setada por `suspendProgressSync()` antes de `handleRestartSequence` —
 *  evita que o snapshot ANTIGO em memória sobrescreva a run nova zerada
 *  via tick ou beforeunload entre o `/api/progress/new-run` e o reload. */
let suspended = false;

/** Suspende toda comunicação com /api/progress até reload da página.
 *  Usado pelo "Voltar para o início" depois de criar nova run zerada,
 *  pra evitar que o sendBeacon do beforeunload sobrescreva a nova run
 *  com o snapshot da run anterior (estado em memória ainda cheio).
 *  NÃO reverte sem reload (é one-way fire-and-forget). */
export function suspendProgressSync(): void {
  suspended = true;
}

/* ═══════════════════════════════════════════════════════════════
   Toggle de coleta (DevPanel) — pausa/retoma o envio da telemetria
   ao banco. Idempotente, persistente em localStorage, sem restart.

   DIFERENÇA para `suspended` (acima):
     • suspended    — one-way, usado no fluxo de restart (não reverte).
     • collectionEnabled — two-way, usado pelo pesquisador no DevPanel
       pra pausar coleta temporariamente durante demos/QA sem sujar o
       banco. Persiste em localStorage — sobrevive F5.

   COMPORTAMENTO QUANDO DESATIVADO
     • `tick` e `beforeUnload` fazem early-return — nenhum POST /
       sendBeacon sai do front.
     • Estado LOCAL em memória continua rodando (aluno navega OK,
       telemetria acumula em memória). Quando reativar, o próximo
       tick manda o snapshot atualizado — não perde o que foi
       coletado enquanto estava desligado.

   LIÇÃO DO BUG ANTERIOR
     Wrappers/listeners NÃO capturam a flag por closure — leem a
     variável module-scope por referência a cada call. Toggle
     reflete imediatamente sem reinstalar listeners.
   ═══════════════════════════════════════════════════════════════ */

const COLLECTION_STORAGE_KEY = 'otimath_dev_collection_enabled';
let collectionEnabled = true;
let collectionInitialized = false;

function readCollectionPref(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
  try {
    const v = localStorage.getItem(COLLECTION_STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch { return true; }
}

/** Idempotente — chama uma vez no mount do app pra hidratar a flag do localStorage. */
export function initCollectionToggle(): void {
  if (collectionInitialized) return;
  collectionInitialized = true;
  collectionEnabled = readCollectionPref();
}

export function isCollectionEnabled(): boolean {
  return collectionEnabled;
}

export function setCollectionEnabled(v: boolean): void {
  collectionEnabled = v;
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, String(v));
  } catch { /* localStorage cheio ou desabilitado — silencioso. */ }
}

export interface ProgressPayload {
  telemetryJson: unknown;
  elapsedTotalMs: number;
  elapsedRouletteMs: number;
  elapsedTwoDicesMs: number;
  currentStage: string;
  currentOvaPhase: string | null;
  /** Snapshot estruturado COMPLETO do OVA ativo — produto de
   *  `RouletteGame.getSnapshot()` ou `TwoDicesPresentation.getSnapshot()`.
   *  Forma: { ova: 'roulette'|'twoDices', snapshot: {...} } ou null
   *  quando não há OVA ativo (stage 'intro' / 'transition' / 'complete'). */
  ovaSnapshot: { ova: string; snapshot: unknown } | null;
}

interface UseProgressSyncOpts {
  /** `false` desliga o hook (ex.: durante DEV mode). */
  enabled: boolean;
  /** Função que devolve o snapshot completo no momento da chamada. */
  getSnapshot: () => ProgressPayload;
}

/** Hash superficial pra evitar POSTs repetidos com o mesmo conteúdo. */
function fingerprint(p: ProgressPayload): string {
  // JSON.stringify do telemetryJson pode ser grande, mas só é serializado
  // se o objeto mudou (referência). Pra simplificar, hashamos só os
  // campos numéricos + stage + cena, e diferenciamos por count global:
  // se total_interacoes_sequencia mudou, salva. Pega 99% dos casos.
  type SnapShape = { total_interacoes_sequencia?: number };
  const tele = p.telemetryJson as SnapShape | undefined;
  return [
    tele?.total_interacoes_sequencia ?? 0,
    p.elapsedTotalMs,
    p.elapsedRouletteMs,
    p.elapsedTwoDicesMs,
    p.currentStage,
    p.currentOvaPhase ?? '',
  ].join('|');
}

export function useProgressSync(opts: UseProgressSyncOpts): void {
  const { enabled, getSnapshot } = opts;
  // Mantém a função estável entre renders via ref — evita re-mount do
  // interval/listeners a cada render do page.tsx.
  const getSnapshotRef = useRef(getSnapshot);
  useEffect(() => { getSnapshotRef.current = getSnapshot; }, [getSnapshot]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let lastFingerprint = '';
    let inFlight = false;
    let pending: ProgressPayload | null = null;
    let retries = 0;

    const send = async (payload: ProgressPayload): Promise<void> => {
      if (cancelled) return;
      inFlight = true;
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
          // keepalive REMOVIDO de propósito — esse flag impõe um limite
          // GLOBAL de 64KB no body de TODOS os requests keepalive em
          // flight. Em cenas tardias (ex.: Stage 1 SubStep 6.56 — União
          // de eventos), gameState + telemetryJson combinados podem
          // passar disso, e o browser rejeita o fetch com "Failed to
          // fetch" antes mesmo de tentar mandar. O caso real do
          // keepalive (sobreviver ao fechamento da aba) já é coberto
          // pelo navigator.sendBeacon mais abaixo no beforeUnload.
        });
        if (res.ok) {
          retries = 0;
        } else if (res.status === 401) {
          // Sessão expirou — para de tentar até próximo login.
          cancelled = true;
        } else {
          throw new Error(`http_${res.status}`);
        }
      } catch (e) {
        retries += 1;
        if (retries <= MAX_RETRIES) {
          // Re-enfileira pra próximo tick — backoff implícito (próximo
          // intervalo só dispara se ainda houver mudança).
          // eslint-disable-next-line no-console
          console.warn('[useProgressSync] falha — tentará novamente', e);
          pending = payload; // mantém o último payload
        } else {
          // eslint-disable-next-line no-console
          console.error('[useProgressSync] esgotou retries', e);
          retries = 0;
        }
      } finally {
        inFlight = false;
        // Se entrou snapshot novo durante o envio, dispara o próximo.
        if (!cancelled && pending) {
          const next = pending;
          pending = null;
          void send(next);
        }
      }
    };

    const tick = () => {
      if (cancelled) return;
      if (suspended) return; // restart em andamento — não sobrescrever run nova
      if (!collectionEnabled) return; // pesquisador pausou a coleta via DevPanel
      let snap: ProgressPayload;
      try {
        snap = getSnapshotRef.current();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[useProgressSync] getSnapshot threw', e);
        return;
      }
      const fp = fingerprint(snap);
      if (fp === lastFingerprint) return;
      lastFingerprint = fp;
      if (inFlight) {
        pending = snap;
      } else {
        void send(snap);
      }
    };

    const interval = window.setInterval(tick, INTERVAL_MS);

    // Best-effort no unload (fechar aba, reload, navegação cross-origin).
    // sendBeacon é fire-and-forget e não bloqueia o fechamento.
    const beforeUnload = () => {
      // Restart em andamento — beforeUnload sendBeacon enviaria o
      // snapshot da run ANTERIOR ainda em memória, sobrescrevendo
      // a run nova zerada que acabamos de criar.
      if (suspended) return;
      // Pesquisador pausou coleta via DevPanel — não persistir nada.
      if (!collectionEnabled) return;
      try {
        const snap = getSnapshotRef.current();
        // Blob com Content-Type custom — alguns browsers aceitam,
        // outros caem pro fallback de text/plain.
        const blob = new Blob([JSON.stringify(snap)], { type: 'application/json' });
        navigator.sendBeacon('/api/progress', blob);
      } catch {
        // ignora
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    // visibilitychange (aba inativa em mobile) — backup melhor que
    // beforeunload, que é flaky em mobile/safari.
    const onVis = () => {
      if (document.visibilityState === 'hidden') beforeUnload();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled]);
}
