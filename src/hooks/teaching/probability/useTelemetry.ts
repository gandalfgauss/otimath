'use client';

/* ═══════════════════════════════════════════════════════════════════
   useTelemetry — Sistema de telemetria estruturada da sequência didática

   PROPÓSITO
     Mantém um objeto JSON estruturado que descreve, em tempo real, o
     comportamento do aluno durante TODA a sequência didática (OVAs +
     exercícios). A cada interação válida, o JSON é atualizado e impresso
     no console (passado como referência — DevTools expande inline).

   MODELO DE EXERCÍCIO (decisão importante)
     • UM exercício = UM Conferir do aluno (1 pergunta avaliável).
     • Tentativas erradas + tentativa final são ENTRADAS no histórico do
       MESMO exercício. Acerto FECHA o exercício; a próxima validação
       começa um exercício novo.
     • `useTelemetryExercise` registra um CONTEXTO/SEÇÃO. As perguntas
       dentro dela vão ganhando id `{secao}-q1`, `{secao}-q2`, etc.
     • Entrar em outra seção (ou OVA) finaliza o exercício em curso.

   RESPOSTA DO USUÁRIO (resposta_usuario)
     Cada acerto/erro precisa carregar o QUE o aluno marcou/escreveu.
     Validators chamam EXPLICITAMENTE `telemetryRecordAcerto(resp)` ou
     `telemetryRecordErro(resp)` ANTES do `createAlert`. O observador
     automático de alerts é FALLBACK — só registra se nenhuma chamada
     explícita aconteceu nos últimos `EXPLICIT_GRACE_MS`.

   CAPTURA AUTOMÁTICA
     1. Cliques em elementos interativos — listener global em document.
     2. Acertos/erros via subscribeToAlerts (fallback de baixa fidelidade
        quando o validator não chama a API explícita).

   OUTPUT
     `console.log('[telemetria · <trigger>]', snapshotObject)` — objeto
     passado por referência. DevTools expande inline. Cada snapshot é
     um objeto NOVO (não é mutado retroativamente).
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useCallback, useRef } from 'react';
import { subscribeToAlerts } from '@/hooks/global/useAlerts';
import type { AlertType } from '@/components/global/Alert';
// Importa a fonte canônica do cronômetro da sessão pra evitar drift entre
// o timer mostrado no topo (SequenceProgressBar) e o `timestamp` de cada
// evento do histórico — sem isso, o atraso de ~100ms entre `startSequence`
// e a entrada na primeira seção causava diff de 1 segundo intermitente
// (depende de onde no segundo o aluno clica).
// NOTA sobre import circular: useSequenceSession importa funções daqui;
// agora importamos getElapsedTotalMs de lá. ES modules resolvem ciclos
// quando o consumo é em runtime (chamada dentro de função) — getElapsedTotalMs
// só é invocado em handlers de evento, depois que ambos os módulos
// terminaram de carregar.
import { getElapsedTotalMs } from './useSequenceSession';

// ─── Tipos do JSON de saída ─────────────────────────────────────────

/**
 * Tipos de evento no histórico de um exercício:
 *
 *  • `acerto` — validação correta. FECHA o exercício.
 *  • `erro` — validação incorreta. Mantém aberto pra próxima tentativa.
 *  • `interacao_registro` — input/checkbox/radio que conta como registro
 *    da resposta atual do aluno (mas ainda não foi validado). Ex.: ele
 *    marcou um checkbox; antes de clicar em Conferir, isso é um registro.
 *  • `interacao_exercicio` — qualquer outra ação exploratória do aluno
 *    dentro do exercício: trocar de cor selecionada, abrir/fechar painel,
 *    arrastar uma peça sem soltar, mudar de opinião, clicar em botão
 *    auxiliar, etc. NÃO altera registros e NÃO fecha o exercício; serve
 *    pra reconstituir a trajetória de pensamento do aluno na análise.
 *  • `interacao_usuario` — leitura confirmada (clique em "Li.", "Continuar"
 *    após uma tela conceitual, etc.). Diferente dos outros tipos, cada
 *    `interacao_usuario` é ESCRITA NO SEU PRÓPRIO exercício "atômico"
 *    com 1 item de histórico — assim a duração da leitura fica medida
 *    isolada (tempo_inicio_exercicio = balão exibido,
 *    tempo_fim_exercicio = clique em "Li."). Use as APIs
 *    `telemetryStartReading(id)` + `telemetryConfirmReading(id, ...)`.
 */
export type TelemetryActivityType =
  | 'acerto'
  | 'erro'
  | 'interacao_registro'
  | 'interacao_exercicio'
  | 'interacao_usuario';

export interface TelemetryActivity {
  tipo: TelemetryActivityType;
  resposta_usuario: string;
  /** Momento do evento na linha do tempo TOTAL da sessão (MM:SS) —
   *  mesma referência do cronômetro do topo. */
  timestamp: string;
  /** Momento do evento na linha do tempo INTERNA do exercício (MM:SS)
   *  — quanto tempo o aluno já estava trabalhando neste exercício
   *  quando o evento ocorreu. Útil pra medir "quão rápido ele errou
   *  desde que abriu" sem precisar fazer aritmética entre timestamps. */
  timestamp_no_exercicio: string;
}

export interface TelemetryExercise {
  id: string;
  title: string;
  descricao: string;
  /** Quando o aluno começou esse exercício, na linha do tempo da
   *  sessão (MM:SS). Começa a contar na entrada da seção ou logo após
   *  o acerto do exercício anterior. */
  tempo_inicio_exercicio: string;
  /** Quando o exercício foi finalizado, na linha do tempo da sessão
   *  (MM:SS). `null` se o exercício ainda está em andamento no momento
   *  do snapshot (acerto pendente). */
  tempo_fim_exercicio: string | null;
  tempo_gasto_exercicio: string;
  total_interacoes_exercicio: number;
  total_acertos_exercicio: number;
  total_erros_exercicio: number;
  historico_atividades: TelemetryActivity[];
}

export interface TelemetryOva {
  ova_id: string;
  total_interacoes_ova: number;
  total_acertos_ova: number;
  total_erros_ova: number;
  tempo_total_ova: string;
  exercicios_interagidos: TelemetryExercise[];
}

export interface TelemetrySnapshot {
  total_interacoes_sequencia: number;
  total_acertos_sequencia: number;
  total_erros_sequencia: number;
  tempo_total_sequencia: string;
  ovas: TelemetryOva[];
}

// ─── Estado interno (singleton) ─────────────────────────────────────

/** Lista canônica de OVAs. A snapshot sempre inclui ambos. */
const OVA_IDS = ['roulette', 'twoDices'] as const;
type OvaId = (typeof OVA_IDS)[number];

/** Janela em ms na qual o observador automático de alerts NÃO duplica
 *  o que já foi registrado via chamada explícita
 *  (`telemetryRecordAcerto/Erro`). 200ms cobre o ciclo "validator chama
 *  telemetria → cria alert → observador fira" com folga. */
const EXPLICIT_GRACE_MS = 200;

/** Exercício em construção — múltiplas tentativas vão acumulando aqui
 *  até um acerto fechá-lo (ou troca de seção/OVA).
 *
 *  Modelo accumMs + runningStartedAt pra suportar pause/resume:
 *    • runningStartedAt = null → exercício PAUSADO (não conta tempo)
 *    • runningStartedAt = X    → exercício rodando; elapsed = accumMs + (now - X)
 */
interface OpenExercise {
  id: string;
  title: string;
  descricao: string;
  /** ms já acumulados em chunks anteriores de execução. */
  accumMs: number;
  /** Quando começou o chunk atual de execução, ou null se pausado. */
  runningStartedAt: number | null;
  /** Momento da abertura na linha do tempo TOTAL da sessão (ms desde
   *  o sessionStart, descontado tempo de pausa). Capturado no instante
   *  em que o exercício é criado e nunca mais muda — alimenta o campo
   *  `tempo_inicio_exercicio` do JSON. */
  startedAtSessionTime: number;
  /** Quantidade de interações exploratórias — soma de eventos do tipo
   *  `interacao_registro` E `interacao_exercicio`. NÃO inclui acertos
   *  nem erros (esses têm contadores próprios). Vai pro campo
   *  `total_interacoes_exercicio` do JSON. */
  totalInteracoes: number;
  acertos: number;
  erros: number;
  history: TelemetryActivity[];
  /** Marcado quando um acerto fechou: o próximo registro/validação
   *  cria um exercício novo. */
  closed: boolean;
}

interface SectionContext {
  id: string;
  title: string;
  descricao: string;
  /** Próximo número de pergunta a usar — incrementado a cada exercício
   *  aberto NA seção. */
  questionCounter: number;
  /** Exercício atualmente em construção dentro dessa seção (ou null
   *  se ninguém ainda interagiu desde a entrada na seção / desde o
   *  último acerto). */
  open: OpenExercise | null;
  /** Quando o PRÓXIMO exercício a abrir começa a contar tempo:
   *    • inicialmente = momento da entrada na seção (telemetryEnterExercise)
   *    • após um acerto (que fecha o exercício corrente) = momento do acerto
   *    • durante pausa por offline = empurrado pra frente pelo intervalo
   *  Sem isso, o timestamp da primeira entrada do histórico de um
   *  exercício seria sempre "00:00" — o aluno passa um tempo lendo o
   *  enunciado antes de interagir, e esse tempo precisa contar. */
  nextQuestionStartedAt: number;
  /** Versão SESSION-RELATIVE de `nextQuestionStartedAt` — capturada via
   *  `getElapsedTotalMs()` no mesmo instante. Não muda com pausa porque
   *  o relógio da sessão também não anda enquanto pausado. É copiada
   *  pro `startedAtSessionTime` de cada OpenExercise novo na criação. */
  nextQuestionSessionTime: number;
}

interface FinalizedExercise {
  id: string;
  title: string;
  descricao: string;
  durationMs: number;
  finishedAt: number;
  /** Momento da abertura na linha do tempo TOTAL da sessão (copiado do
   *  OpenExercise no fechamento). */
  startedAtSessionTime: number;
  /** Momento do fechamento na linha do tempo TOTAL da sessão (acerto OU
   *  troca de seção). */
  finishedAtSessionTime: number;
  totalInteracoes: number;
  totalAcertos: number;
  totalErros: number;
  history: TelemetryActivity[];
}

interface OvaRuntime {
  id: OvaId;
  totalInteractions: number;
  totalAcertos: number;
  totalErros: number;
  accumMs: number;
  startedAt: number | null;
  exercises: FinalizedExercise[];
  currentSection: SectionContext | null;
}

interface SessionRuntime {
  startedAt: number | null;
  ovas: Map<OvaId, OvaRuntime>;
  activeOvaId: OvaId | null;
  totalInteractions: number;
  /** Timestamp da última chamada explícita por tipo — usado pelo
   *  observador pra evitar duplicar evento já registrado. */
  lastExplicitAt: { acerto: number; erro: number };
}

function makeOvaRuntime(id: OvaId): OvaRuntime {
  return {
    id,
    totalInteractions: 0,
    totalAcertos: 0,
    totalErros: 0,
    accumMs: 0,
    startedAt: null,
    exercises: [],
    currentSection: null,
  };
}

const session: SessionRuntime = {
  startedAt: null,
  ovas: new Map(OVA_IDS.map((id) => [id, makeOvaRuntime(id)] as const)),
  activeOvaId: null,
  totalInteractions: 0,
  lastExplicitAt: { acerto: 0, erro: 0 },
};

/** Quando != null, indica que a telemetria está PAUSADA (tipicamente
 *  por perda de internet). Enquanto pausado:
 *   • OVA timer ativo é congelado em accumMs
 *   • Exercício aberto da seção atual é congelado em accumMs
 *   • Novos exercícios são criados em estado pausado (runningStartedAt=null)
 *   • resumeTelemetry restaura tudo. */
let telemetryPausedAt: number | null = null;

/** MODO DEV — quando true, a telemetria SILENCIA toda gravação de
 *  eventos e impressão no console. Estágios/seções continuam sendo
 *  rastreados (telemetryEnterExercise/Exit, telemetryUpdateSectionMeta,
 *  telemetrySetActiveOva mantêm o contexto correto) — só a coleta de
 *  acertos/erros/registros/interações/leituras é pulada. Assim a
 *  navegação via setas do DevPanel não polui a coleta real do aluno.
 *
 *  Setado via `telemetrySetDevMode(true|false)` — em geral wirado num
 *  useEffect na page raiz que observa o `devMode` do componente. */
let devModeActive = false;

/** Leituras em andamento — `telemetryStartReading(id)` marca aqui o
 *  instante (em SESSION TIME) em que o conteúdo apareceu na tela. Quando
 *  o aluno clica "Li.", `telemetryConfirmReading(id, ...)` materializa
 *  um exercício atômico cuja duração é `agora − startedAt`. Sobrevive
 *  pausa por offline (o session time é congelado, não o wall clock). */
const pendingReadings = new Map<string, { startedAtSessionTime: number; ovaId: OvaId | null }>();

// ─── Helpers de tempo ───────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Converte ms → segundos (floor, nunca negativo). Single source of truth
 *  pra arredondamento: usar `secOf(ms)` em TODO lugar que precisa do
 *  valor inteiro em segundos, e nunca chamar `Math.floor(ms/1000)`
 *  direto — assim as invariantes do JSON são preservadas (ver
 *  comentário em `finalizedToJson`). */
function secOf(ms: number): number {
  if (ms < 0) ms = 0;
  return Math.floor(ms / 1000);
}

/** Formata um total já em SEGUNDOS (inteiro) como "MM:SS". */
function fmtSec(sec: number): string {
  if (sec < 0) sec = 0;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad2(min)}:${pad2(s)}`;
}

/** Atalho: ms → "MM:SS". Usar pra valores que NÃO participam de
 *  invariantes aritméticas no JSON (tempo_total_ova, tempo_total_sequencia).
 *  Pra campos onde a invariante importa (tempo_inicio/fim/gasto e
 *  timestamps do histórico), usar `secOf(ms)` + `fmtSec(sec)`
 *  combinados — ver comentário em finalizedToJson. */
function fmtMmSs(ms: number): string {
  return fmtSec(secOf(ms));
}

function nowMs(): number {
  return Date.now();
}

function ovaElapsedMs(ova: OvaRuntime): number {
  let total = ova.accumMs;
  if (ova.startedAt !== null) total += nowMs() - ova.startedAt;
  return total;
}

/** Tempo total decorrido num OpenExercise considerando pausas
 *  (`accumMs` em chunks anteriores + delta do chunk atual se rodando). */
function openElapsedMs(open: OpenExercise): number {
  let total = open.accumMs;
  if (open.runningStartedAt !== null) {
    total += nowMs() - open.runningStartedAt;
  }
  return total;
}

// ─── Mutações internas ──────────────────────────────────────────────

function ensureSessionStarted(): void {
  if (session.startedAt === null) session.startedAt = nowMs();
}

function pauseOva(id: OvaId): void {
  const ova = session.ovas.get(id);
  if (!ova || ova.startedAt === null) return;
  ova.accumMs += nowMs() - ova.startedAt;
  ova.startedAt = null;
}

function resumeOva(id: OvaId): void {
  const ova = session.ovas.get(id);
  if (!ova || ova.startedAt !== null) return;
  ova.startedAt = nowMs();
}

function activeOva(): OvaRuntime | null {
  if (!session.activeOvaId) return null;
  return session.ovas.get(session.activeOvaId) ?? null;
}

/** Move o exercício aberto (se houver) pra lista de finalizados. Usado
 *  ao trocar de seção/OVA: se ficou registros sem validação ou tentativas
 *  erradas sem acerto, ainda preserva no JSON como "exercício aberto sem
 *  resolução". */
/**
 * Finaliza o exercício aberto, opcionalmente recebendo o instante de
 * fechamento já capturado pelo chamador.
 *
 * Quando o chamador é o acerto: passa o mesmo `getElapsedTotalMs()` que
 * usou pra montar o `timestamp` do item de acerto no histórico — assim
 * `tempo_fim_exercicio` coincide ao segundo com o `timestamp` do último
 * item do histórico (invariante de consistência exigida pelo JSON).
 *
 * Quando o chamador é troca de seção/OVA: não precisa passar nada;
 * `getElapsedTotalMs()` é chamado aqui.
 */
function finalizeOpen(
  section: SectionContext,
  ova: OvaRuntime,
  finishedAtSessionTimeMs?: number,
): void {
  if (!section.open) return;
  const open = section.open;
  const endAt = nowMs();
  ova.exercises.push({
    id: open.id,
    title: open.title,
    descricao: open.descricao,
    durationMs: openElapsedMs(open),
    finishedAt: endAt,
    startedAtSessionTime: open.startedAtSessionTime,
    finishedAtSessionTime: finishedAtSessionTimeMs ?? getElapsedTotalMs(),
    totalInteracoes: open.totalInteracoes,
    totalAcertos: open.acertos,
    totalErros: open.erros,
    history: open.history.slice(),
  });
  section.open = null;
}

/** Garante que há um exercício aberto pra receber a próxima atividade.
 *  Cria um novo se não existir OU se o anterior foi fechado por acerto. */
function ensureOpenExercise(section: SectionContext): OpenExercise {
  if (section.open && !section.open.closed) return section.open;
  // Se havia um fechado por acerto, vira finalizado no array do OVA antes
  // de criar o próximo.
  if (section.open && section.open.closed) {
    // já foi movido pra ova.exercises na finalização do acerto, então só
    // limpa a referência.
    section.open = null;
  }
  section.questionCounter += 1;
  const id = `${section.id}-q${section.questionCounter}`;
  // O relógio do exercício começa em `nextQuestionStartedAt` (= entrada
  // na seção ou momento do último acerto), NÃO em "agora". Assim o
  // tempo que o aluno gasta lendo o enunciado entra como primeiro
  // timestamp (em vez de aparecer como 00:00).
  // Tempo já decorrido entre o início ideal e o momento de criação:
  // se pausado, vai até quando a pausa começou; se não, vai até agora.
  const referenceEnd = telemetryPausedAt ?? nowMs();
  const isPaused = telemetryPausedAt !== null;
  const initialAccumMs = Math.max(0, referenceEnd - section.nextQuestionStartedAt);
  const open: OpenExercise = {
    id,
    title: `${section.title} — Pergunta ${section.questionCounter}`,
    descricao: section.descricao,
    accumMs: initialAccumMs,
    runningStartedAt: isPaused ? null : nowMs(),
    // Mesmo instante session-relative em que `nextQuestionStartedAt`
    // foi setado pra última vez (entrada de seção ou último acerto).
    // Imutável depois disso.
    startedAtSessionTime: section.nextQuestionSessionTime,
    totalInteracoes: 0,
    acertos: 0,
    erros: 0,
    history: [],
    closed: false,
  };
  section.open = open;
  return open;
}

// ─── API pública ────────────────────────────────────────────────────

/**
 * Liga/desliga o modo DEV da telemetria. Quando ligado, todas as
 * APIs de GRAVAÇÃO (acerto/erro/registro/interação/leitura/click)
 * viram NO-OP e nenhum snapshot é impresso no console. APIs de
 * CONTEXTO (enter/exit/updateSectionMeta/setActiveOva) continuam
 * funcionando — assim quando o aluno desliga DEV e volta a jogar de
 * verdade, a seção em curso já reflete onde ele aterrissou.
 *
 * Wirar via `useEffect(() => telemetrySetDevMode(devMode), [devMode])`
 * na page raiz que controla o painel DEV.
 */
export function telemetrySetDevMode(active: boolean): void {
  devModeActive = active;
}

/** Restaura o estado interno da telemetria a partir de um snapshot
 *  previamente salvo (vindo do banco). Usado ao retomar uma run.
 *
 *  Recria os FinalizedExercise de cada OVA convertendo os campos MM:SS
 *  (tempo_inicio_exercicio, tempo_fim_exercicio, tempo_gasto_exercicio)
 *  pra ms internos. Não restaura `currentSection.open` — a próxima
 *  entrada do aluno via `useTelemetryExercise` abre um exercício novo
 *  naquela seção, com `questionCounter` continuando de onde estava
 *  (calculado pelo nº de exercícios já finalizados naquela seção). */
function parseMMSS(s: string | null | undefined): number {
  if (!s) return 0;
  const m = /^(\d+):(\d+)$/.exec(s);
  if (!m) return 0;
  return (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
}

export function telemetryRestore(snapshot: TelemetrySnapshot): void {
  // Zera primeiro pra garantir estado consistente.
  telemetryReset();

  for (const ovaSnap of snapshot.ovas) {
    const ovaId = ovaSnap.ova_id as OvaId;
    const ova = session.ovas.get(ovaId);
    if (!ova) continue;
    ova.totalInteractions = ovaSnap.total_interacoes_ova;
    ova.totalAcertos = ovaSnap.total_acertos_ova;
    ova.totalErros = ovaSnap.total_erros_ova;
    ova.accumMs = parseMMSS(ovaSnap.tempo_total_ova);
    ova.startedAt = null;
    ova.currentSection = null;
    // Recria FinalizedExercise pra cada item salvo.
    ova.exercises = ovaSnap.exercicios_interagidos.map((ex) => {
      const inicioMs = parseMMSS(ex.tempo_inicio_exercicio);
      const fimMs = ex.tempo_fim_exercicio !== null ? parseMMSS(ex.tempo_fim_exercicio) : inicioMs;
      const duracaoMs = parseMMSS(ex.tempo_gasto_exercicio);
      return {
        id: ex.id,
        title: ex.title,
        descricao: ex.descricao,
        durationMs: duracaoMs,
        finishedAt: 0,
        startedAtSessionTime: inicioMs,
        finishedAtSessionTime: fimMs,
        totalInteracoes: ex.total_interacoes_exercicio,
        totalAcertos: ex.total_acertos_exercicio,
        totalErros: ex.total_erros_exercicio,
        history: ex.historico_atividades.slice(),
      };
    });
  }
  session.totalInteractions = snapshot.total_interacoes_sequencia;
  // Mantém startedAt sincronizado com restoreSession — usa o mesmo wall
  // clock que getElapsedTotalMs vai usar.
  session.startedAt = Date.now() - parseMMSS(snapshot.tempo_total_sequencia);
  session.activeOvaId = null;
}

/** Reseta o estado interno. Chamar ao começar uma nova sequência. */
export function telemetryReset(): void {
  session.startedAt = null;
  session.activeOvaId = null;
  session.totalInteractions = 0;
  session.ovas = new Map(OVA_IDS.map((id) => [id, makeOvaRuntime(id)] as const));
  session.lastExplicitAt = { acerto: 0, erro: 0 };
  telemetryPausedAt = null;
  // Limpa leituras pendentes pra que um restart da sequência não
  // carregue resíduos de sessões anteriores.
  pendingReadings.clear();
  atomicInteractionCounter = 0;
}

/** Pausa os cronômetros da telemetria (OVA ativa + exercício aberto).
 *  Chamado pelo OfflineOverlay quando a internet cai. Idempotente. */
export function telemetryPause(): void {
  if (telemetryPausedAt !== null) return;
  telemetryPausedAt = nowMs();
  // Pausa OVA ativo
  if (session.activeOvaId) {
    const ova = session.ovas.get(session.activeOvaId);
    if (ova?.startedAt !== null && ova?.startedAt !== undefined) {
      ova.accumMs += nowMs() - ova.startedAt;
      ova.startedAt = null;
    }
    // Pausa exercício aberto da seção atual
    const open = ova?.currentSection?.open;
    if (open && open.runningStartedAt !== null) {
      open.accumMs += nowMs() - open.runningStartedAt;
      open.runningStartedAt = null;
    }
  }
}

/** Retoma cronômetros pausados. Idempotente. */
export function telemetryResume(): void {
  if (telemetryPausedAt === null) return;
  const pauseDuration = nowMs() - telemetryPausedAt;
  telemetryPausedAt = null;
  // Retoma OVA ativo
  if (session.activeOvaId) {
    const ova = session.ovas.get(session.activeOvaId);
    if (ova && ova.startedAt === null) {
      ova.startedAt = nowMs();
    }
    // Retoma exercício aberto
    const open = ova?.currentSection?.open;
    if (open && open.runningStartedAt === null && !open.closed) {
      open.runningStartedAt = nowMs();
    }
    // Empurra o relógio do PRÓXIMO exercício pra frente pelo intervalo
    // pausado — assim, se a internet caiu ANTES da primeira interação,
    // o tempo offline não vira "tempo do enunciado".
    if (ova?.currentSection) {
      ova.currentSection.nextQuestionStartedAt += pauseDuration;
    }
  }
}

/** Define qual OVA está ativo. Pausa o cronômetro do anterior, retoma do
 *  novo. Aceita string genérica; valores fora de OVA_IDS viram null. */
export function telemetrySetActiveOva(ovaId: string | null): void {
  ensureSessionStarted();
  const normalized: OvaId | null =
    ovaId !== null && (OVA_IDS as readonly string[]).includes(ovaId)
      ? (ovaId as OvaId)
      : null;
  if (session.activeOvaId === normalized) return;
  if (session.activeOvaId) {
    const oldOva = session.ovas.get(session.activeOvaId);
    if (oldOva?.currentSection) finalizeOpen(oldOva.currentSection, oldOva);
    pauseOva(session.activeOvaId);
  }
  session.activeOvaId = normalized;
  if (normalized) resumeOva(normalized);
  printSnapshot('ova-switch');
}

/**
 * Verifica se um `id` de seção pertence ao OVA ativo. Útil pra evitar
 * que componentes MONTADOS-MAS-NÃO-ATIVOS (caso típico do `devMode` da
 * Sequência Didática, que renderiza todos os stages em paralelo)
 * sobrescrevam o `currentSection` do OVA realmente em uso.
 *
 * Convenção: section ids começam com o `ovaId` ('roulette-...' ou
 * 'twoDices-...'). Quando esse padrão não bate com o OVA ativo,
 * `enter`/`exit` retornam early.
 */
function idBelongsToActiveOva(id: string, ovaId: OvaId): boolean {
  return id.startsWith(`${ovaId}-`);
}

/** Entra num CONTEXTO/SEÇÃO. Cada Conferir dentro dela gera (ou
 *  acumula em) um exercício. */
export function telemetryEnterExercise(id: string, title: string, descricao: string): void {
  ensureSessionStarted();
  const ova = activeOva();
  if (!ova) return;
  // Ignora chamadas vindas de componentes montados-mas-não-ativos.
  // Sem isso, em devMode (que mantém todos os stages montados em
  // paralelo) cada stage não-ativo sobrescreveria a `currentSection`
  // do stage realmente em uso, e na saída do devMode (quando os
  // não-ativos desmontariam) zerariam essa seção via `exitExercise`.
  if (!idBelongsToActiveOva(id, ova.id)) return;
  if (ova.currentSection?.id === id) {
    // Mesma seção — atualiza só metadados (rerender com props novas)
    ova.currentSection.title = title;
    ova.currentSection.descricao = descricao;
    return;
  }
  if (ova.currentSection) finalizeOpen(ova.currentSection, ova);
  ova.currentSection = {
    id,
    title,
    descricao,
    questionCounter: 0,
    open: null,
    // Relógio do próximo exercício começa AGORA. Se o aluno passar 30s
    // lendo o enunciado antes de fazer qualquer interação, esses 30s
    // entram no timestamp da primeira entrada do histórico.
    nextQuestionStartedAt: nowMs(),
    nextQuestionSessionTime: getElapsedTotalMs(),
  };
}

/** Finaliza o exercício aberto da seção atual (se houver). Mantém a
 *  `currentSection` viva — quem realmente substitui ou limpa a seção
 *  é a próxima chamada de `telemetryEnterExercise` (que finaliza a
 *  anterior se o id for diferente e cria uma nova).
 *
 *  Por que NÃO nulificar `currentSection` aqui?
 *  Cenário concreto que isso quebrava: em devMode, o componente OVA é
 *  remontado/reativado. O `useTelemetryExercise` (com prop `enabled`)
 *  dispara cleanup quando enabled vai pra false — isso chamava o exit
 *  que nullificava a seção. Quando enabled voltava pra true (DEV
 *  fechado, usuário ainda na mesma tela), o efeito de enter rodava de
 *  novo e setava a seção — MAS se o id era o mesmo, o enter tinha um
 *  early-return ("mesma seção, só atualiza meta"), e a seção ficava
 *  nula PRA SEMPRE. Os subsequentes `recordInteracao*` viam `!ova
 *  .currentSection` e retornavam early, parando toda a coleta.
 *
 *  Com a finalização-só-do-open (sem nulificar a seção), o próximo
 *  enter — seja com id igual ou diferente — sempre encontra uma seção
 *  e atualiza adequadamente. Eventos após DEV close continuam fluindo.
 */
export function telemetryExitExercise(id?: string): void {
  const ova = activeOva();
  if (!ova || !ova.currentSection) return;
  if (id !== undefined && ova.currentSection.id !== id) return;
  // Não opera em seção que não pertence ao OVA ativo — vide comentário
  // em `telemetryEnterExercise`.
  if (id !== undefined && !idBelongsToActiveOva(id, ova.id)) return;
  finalizeOpen(ova.currentSection, ova);
  // INTENCIONAL: não fazemos `ova.currentSection = null`. O `enter` do
  // próximo ciclo cuida da transição (atualiza meta se mesmo id, ou
  // cria seção nova se id diferente).
}

/** Adiciona um REGISTRO (input/checkbox/radio que captura a resposta
 *  atual do aluno mas ainda não foi validada) ao exercício aberto da
 *  seção atual. Cria o exercício se não houver um aberto.
 *
 *  Diferença pra `telemetryRecordInteracaoExercicio`: registro = "esta
 *  é a resposta atual do aluno no momento"; interacao_exercicio = "o
 *  aluno mexeu/explorou algo no caminho até chegar na resposta". Ambos
 *  contam pra `total_interacoes_exercicio` e vão pro histórico. */
export function telemetryRecordRegistro(resposta: string): void {
  if (devModeActive) return; // navegação DEV não polui coleta real
  const ova = activeOva();
  if (!ova?.currentSection) return;
  const open = ensureOpenExercise(ova.currentSection);
  open.totalInteracoes += 1;
  // CAPTURA ÚNICA em segundos: o `timestamp_no_exercicio` é DERIVADO de
  // `timestamp - tempo_inicio_exercicio` (ambos em segundos), garantindo
  // que `Δtimestamp == Δtimestamp_no_exercicio` entre eventos consecutivos
  // pelo SIMPLES fato de que ambos compartilham `tempo_inicio_exercicio`
  // como referencial. Em ms, `getElapsedTotalMs() - startedAtSessionTime`
  // já é exatamente `openElapsedMs(open)` (sessão e exercício pausam
  // juntos), então estamos só evitando o off-by-one da truncação dupla.
  const tsSec = secOf(getElapsedTotalMs());
  const inicioSec = secOf(open.startedAtSessionTime);
  open.history.push({
    tipo: 'interacao_registro',
    resposta_usuario: resposta,
    timestamp: fmtSec(tsSec),
    timestamp_no_exercicio: fmtSec(tsSec - inicioSec),
  });
  printSnapshot('registro', openToJson(open));
}

/**
 * Adiciona uma INTERAÇÃO DE EXERCÍCIO ao exercício aberto atual. Use
 * pra capturar qualquer ação exploratória do aluno DENTRO do contexto
 * do exercício que NÃO é um registro definitivo e NÃO é uma validação.
 *
 * EXEMPLOS de quando chamar:
 *   • Aluno clica numa cor da roleta pra apostar (antes do Conferir)
 *   • Aluno muda de opinião e clica em outra cor
 *   • Aluno digita parcialmente um número no campo numerador
 *   • Aluno arrasta uma peça mas solta de volta
 *   • Aluno abre/fecha um painel auxiliar (exemplos, calculadora)
 *   • Aluno marca/desmarca um checkbox
 *   • Aluno seleciona uma célula de uma tabela
 *   • Aluno limpa o campo de resposta
 *
 * RESPOSTA RECOMENDADA — seja SUFICIENTEMENTE descritivo pra que, ao
 * ler o histórico, dê pra reconstruir a trajetória de pensamento do
 * aluno. Ex.:
 *   ✗ ruim: "clicou"
 *   ✓ bom: "selecionou cor da aposta: amarelo"
 *   ✗ ruim: "input"
 *   ✓ bom: "digitou no numerador: 3 (campo numerador da fração da cor amarelo)"
 *   ✓ bom: "trocou cor da aposta: amarelo → vermelho"
 *
 * Idempotência: se nenhum exercício está aberto e a seção tampouco
 * existe (chamado fora de contexto), é silenciosamente ignorado pra
 * evitar registros órfãos sem contexto.
 */
export function telemetryRecordInteracaoExercicio(detalhe: string): void {
  if (devModeActive) return; // navegação DEV não polui coleta real
  const ova = activeOva();
  if (!ova?.currentSection) return;
  const open = ensureOpenExercise(ova.currentSection);
  open.totalInteracoes += 1;
  const tsSec = secOf(getElapsedTotalMs());
  const inicioSec = secOf(open.startedAtSessionTime);
  open.history.push({
    tipo: 'interacao_exercicio',
    resposta_usuario: detalhe,
    timestamp: fmtSec(tsSec),
    timestamp_no_exercicio: fmtSec(tsSec - inicioSec),
  });
  printSnapshot('interacao_exercicio', openToJson(open));
}

/**
 * Cria um exercício ATÔMICO de tipo `interacao_exercicio` — UM
 * exercício separado com UM item de histórico, independente do open
 * exercise da seção atual.
 *
 * Use pra ações exploratórias onde CADA CLIQUE deve ser registrado
 * como um exercício próprio (não acumulado num histórico). Ex.:
 * "Ver mais exemplos" — cada exemplo que o aluno consulta vira um
 * exercício separado em `exercicios_interagidos`, facilitando análise
 * de quantos exemplos consultou e quais.
 *
 * Diferença pro `telemetryRecordInteracaoExercicio`:
 *   • `…InteracaoExercicio` → ADICIONA ao exercício aberto corrente
 *     (acumula no histórico).
 *   • `…AtomicInteraction` → CRIA exercício novo, finalizado, atômico.
 *     Não interfere no exercício aberto da seção corrente.
 *
 * O exercício gerado tem duração 0 (start = end), porque representa
 * um evento instantâneo. `startedAtSessionTime` e `finishedAtSessionTime`
 * coincidem com o momento do clique.
 *
 * @param title — Título humano do exercício atômico (ex.: "Exemplo de
 *   experimento determinístico").
 * @param descricao — Descrição/contexto pedagógico do que aconteceu
 *   (ex.: "Aluno pediu novo exemplo: 'Executar um algoritmo...'").
 * @param detalhe — Vai pro `resposta_usuario` do único item do
 *   histórico (ex.: "pediu novo exemplo de experimento determinístico:
 *   \"...\"").
 */
let atomicInteractionCounter = 0;
export function telemetryRecordAtomicInteraction(
  title: string,
  descricao: string,
  detalhe: string,
): void {
  if (devModeActive) return;
  const ova = activeOva();
  if (!ova) return;
  atomicInteractionCounter += 1;
  const nowSessionTime = getElapsedTotalMs();
  const nowSec = secOf(nowSessionTime);
  const id = `${ova.id}-atomic-${atomicInteractionCounter}`;
  // HERANÇA DA DESCRIÇÃO DA SEÇÃO — o exercício atômico carrega TUDO
  // que estava na tela no momento do clique. Sem isso, "pediu novo
  // exemplo" ficaria sem âncora (qual balão? qual etapa? que
  // instruções estavam no topo?). A `currentSection.descricao` já é
  // mantida atualizada via `useTelemetryExercise` do RouletteGame
  // (Topo + Balão + Pergunta + Opções), então herdar dá contexto rico
  // de graça.
  const sectionDescricao = ova.currentSection?.descricao ?? '';
  const fullDescricao = sectionDescricao
    ? `${sectionDescricao} || Ação: ${descricao}`
    : descricao;
  const exercise: FinalizedExercise = {
    id,
    title,
    descricao: fullDescricao,
    durationMs: 0,
    finishedAt: nowMs(),
    startedAtSessionTime: nowSessionTime,
    finishedAtSessionTime: nowSessionTime,
    totalInteracoes: 1,
    totalAcertos: 0,
    totalErros: 0,
    history: [{
      tipo: 'interacao_exercicio',
      resposta_usuario: detalhe,
      timestamp: fmtSec(nowSec),
      // Duração interna = 0 → tudo aconteceu "no mesmo instante".
      timestamp_no_exercicio: '00:00',
    }],
  };
  ova.exercises.push(exercise);
  ova.totalInteractions += 1;
  session.totalInteractions += 1;
  printSnapshot('interacao_exercicio_atomica', finalizedToJson(exercise));
}

/**
 * Marca o INÍCIO de uma leitura — chamar quando o conteúdo conceitual
 * (balão, info-box, texto explicativo) aparece na tela. Vai parear com
 * uma chamada futura de `telemetryConfirmReading(id, ...)` no clique
 * do "Li." / "Continuar".
 *
 * O `id` precisa ser ÚNICO por leitura. Use algo descritivo tipo
 * `roulette-s1-balao-experimento-deterministico` ou
 * `twoDices-cena3-introducao-espaco-amostral`. Idempotente — chamar
 * duas vezes com mesmo id sobrescreve o `startedAt` (caso o componente
 * remonte ou re-exiba o conteúdo). Se nenhum OVA estiver ativo,
 * silenciosamente ignorado.
 *
 * O par start/confirm trabalha em PARALELO com o `currentSection` do
 * OVA — não interfere em exercícios já abertos. A leitura é um
 * exercício ATÔMICO próprio dentro de `exercicios_interagidos`.
 */
export function telemetryStartReading(id: string): void {
  if (devModeActive) return; // navegação DEV não polui coleta real
  // Armazena pending SEMPRE — mesmo se ainda não há OVA ativo (race
  // condition rara: balão aparece antes do useEffect que faz
  // `setActiveOva` rodar). O OVA dono é resolvido no `confirm`.
  pendingReadings.set(id, {
    startedAtSessionTime: getElapsedTotalMs(),
    ovaId: session.activeOvaId,
  });
}

/**
 * Confirma a leitura — gera um exercício ATÔMICO com 1 entrada de
 * histórico do tipo `interacao_usuario`. Chamado no handler do clique
 * em "Li." / "Continuar" / equivalente.
 *
 * O exercício é adicionado em `exercicios_interagidos` do OVA que
 * estava ativo no `telemetryStartReading` correspondente — mesmo que
 * o OVA ativo tenha mudado entre start e confirm (caso raro).
 *
 * IDEMPOTENTE: se não há pending com o `id` dado (porque já foi
 * confirmado ou nunca foi iniciado), retorna sem fazer nada — não cria
 * exercício vazio. Isso permite que tanto o handler explícito do "Li."
 * quanto o auto-confirm via cleanup do `useReadingTelemetry` chamem
 * essa função, e só a primeira chamada efetiva materialize o exercício.
 *
 * PARÂMETROS
 *  • `id`         — mesmo usado em `telemetryStartReading`. Único.
 *  • `title`      — título do exercício (ex.: "Leitura — Experimento determinístico").
 *  • `descricao`  — descrição da seção/contexto pedagógico.
 *  • `detalhe`    — o que vai pro `resposta_usuario` da entrada de
 *                   histórico (ex.: "confirmou leitura do balão
 *                   'Experimento determinístico'").
 */
export function telemetryConfirmReading(
  id: string,
  title: string,
  descricao: string,
  detalhe: string,
): void {
  if (devModeActive) {
    // Em DEV, descarta o pending (se existir) sem registrar nada.
    pendingReadings.delete(id);
    return;
  }
  const pending = pendingReadings.get(id);
  // Sem pending = já confirmado ou nunca iniciado → no-op idempotente.
  if (!pending) return;
  pendingReadings.delete(id);
  // Resolve o OVA dono — prefere o registrado no start (preserva
  // contexto se OVA ativo mudou entre start e confirm); cai pro OVA
  // ativo atual se o start aconteceu antes do `setActiveOva` (race
  // condition rara mas possível em re-mounts/login flow).
  const ovaId = pending.ovaId ?? session.activeOvaId;
  if (!ovaId) return;
  const ova = session.ovas.get(ovaId as OvaId);
  if (!ova) return;
  const finishedAtSessionTime = getElapsedTotalMs();
  const startedAtSessionTime = pending.startedAtSessionTime;
  const finSec = secOf(finishedAtSessionTime);
  const iniSec = secOf(startedAtSessionTime);
  // HERANÇA DA DESCRIÇÃO DA SEÇÃO — mesmo padrão do
  // `telemetryRecordAtomicInteraction`: o exercício de leitura
  // herda o contexto da seção corrente (Topo + Pergunta + Opções),
  // que o caller complementa com a descricao específica da leitura
  // (texto do balão). Sem isso, faltava o "Topo: Conceitos
  // Fundamentais..." no exercício atômico de leitura.
  const sectionDescricao = ova.currentSection?.descricao ?? '';
  const fullDescricao = sectionDescricao
    ? `${sectionDescricao} || Leitura: ${descricao}`
    : descricao;
  const exercise: FinalizedExercise = {
    id,
    title,
    descricao: fullDescricao,
    durationMs: Math.max(0, finishedAtSessionTime - startedAtSessionTime),
    finishedAt: nowMs(),
    startedAtSessionTime,
    finishedAtSessionTime,
    totalInteracoes: 1,
    totalAcertos: 0,
    totalErros: 0,
    history: [{
      tipo: 'interacao_usuario',
      resposta_usuario: detalhe,
      // Timestamp do evento (confirmação) = MM:SS da sessão.
      timestamp: fmtSec(finSec),
      // Tempo dentro do exercício de leitura = duração total da leitura.
      timestamp_no_exercicio: fmtSec(finSec - iniSec),
    }],
  };
  ova.exercises.push(exercise);
  // O OVA conta esta leitura nas interações totais (alimenta
  // `total_interacoes_ova`).
  ova.totalInteractions += 1;
  // Também conta na sessão total — mantém coerência com o que o
  // global click listener já faz pros outros tipos.
  session.totalInteractions += 1;
  printSnapshot('interacao_usuario', finalizedToJson(exercise));
}

/**
 * Atualiza title/descricao da seção corrente IN-PLACE. Útil pra
 * descrição dinâmica baseada no step interno do componente (ex.: o
 * mesmo `UnionExercise4` muda de "Etapa 1 — Cardinalidade" pra
 * "Etapa 2 — Calcular n(A∩B)" sem trocar de seção). Próximos
 * exercícios abertos nesta seção carregam os novos metadados.
 *
 * Não afeta exercícios já finalizados.
 */
export function telemetryUpdateSectionMeta(id: string, title: string, descricao: string): void {
  const ova = activeOva();
  const section = ova?.currentSection;
  if (!section || section.id !== id) return;
  section.title = title;
  section.descricao = descricao;
  // Se há um exercício ABERTO ainda sem nenhuma interação, atualiza
  // seus metadados também — ele ainda não foi "comprometido" com o
  // contexto antigo. Se já tem entradas, mantém o que estava (pra não
  // reescrever história).
  if (section.open && !section.open.closed && section.open.history.length === 0) {
    section.open.title = `${title} — Pergunta ${section.questionCounter}`;
    section.open.descricao = descricao;
  }
}

/** Registra um acerto. Adiciona ao exercício aberto e FECHA esse
 *  exercício (próxima validação começa um novo). */
export function telemetryRecordAcerto(resposta: string): void {
  recordValidation('acerto', resposta, true);
}

/** Registra um erro. Adiciona ao exercício aberto. Mantém ABERTO
 *  pra acumular novas tentativas. */
export function telemetryRecordErro(resposta: string): void {
  recordValidation('erro', resposta, true);
}

function recordValidation(tipo: 'acerto' | 'erro', resposta: string, explicit: boolean): void {
  if (devModeActive) return; // navegação DEV não polui coleta real
  const ova = activeOva();
  if (!ova) return;

  if (explicit) {
    session.lastExplicitAt[tipo] = nowMs();
  } else {
    // Veio do observer — se uma chamada explícita do mesmo tipo aconteceu
    // recentemente, pula (já foi registrado com a resposta certa).
    if (nowMs() - session.lastExplicitAt[tipo] < EXPLICIT_GRACE_MS) return;
  }

  if (tipo === 'acerto') ova.totalAcertos += 1;
  else ova.totalErros += 1;

  const section = ova.currentSection;
  if (!section) {
    // Validação fora de seção — fallback orfão pra não perder o evento.
    const orphanIdx = ova.exercises.filter((e) => e.id.includes('-orfao-')).length + 1;
    const orphanId = `${ova.id}-orfao-q${orphanIdx}`;
    const nowSessionTime = getElapsedTotalMs();
    const nowSec = secOf(nowSessionTime);
    const orphan: FinalizedExercise = {
      id: orphanId,
      title: `${ova.id} — Pergunta órfã ${orphanIdx}`,
      descricao: 'Validação fora de contexto de seção explícito.',
      durationMs: 0,
      finishedAt: nowMs(),
      // Órfão é criado e fechado no mesmo instante — início = fim.
      startedAtSessionTime: nowSessionTime,
      finishedAtSessionTime: nowSessionTime,
      totalInteracoes: 0,
      totalAcertos: tipo === 'acerto' ? 1 : 0,
      totalErros: tipo === 'erro' ? 1 : 0,
      history: [{
        tipo,
        resposta_usuario: resposta,
        timestamp: fmtSec(nowSec),
        // Órfão começou e terminou no mesmo evento — 00:00 dentro de si.
        timestamp_no_exercicio: '00:00',
      }],
    };
    ova.exercises.push(orphan);
    printSnapshot(tipo, finalizedToJson(orphan));
    return;
  }

  const open = ensureOpenExercise(section);
  // Captura ÚNICA do instante do evento em MS. Todos os campos derivados
  // abaixo (timestamp, timestamp_no_exercicio, finishedAtSessionTime do
  // acerto, e nextQuestionSessionTime do próximo exercício) compartilham
  // ESTA referência. Sem isso, chamadas sequenciais a getElapsedTotalMs()
  // podem cair em milissegundos diferentes — e após truncar pra segundos,
  // o JSON fica com `timestamp_último_item ≠ tempo_fim_exercicio` (e
  // `Q1.tempo_fim ≠ Q2.tempo_inicio`). Captura única + secOf garantem as
  // invariantes por construção.
  const nowSessionMs = getElapsedTotalMs();
  const tsSec = secOf(nowSessionMs);
  const inicioSec = secOf(open.startedAtSessionTime);
  open.history.push({
    tipo,
    resposta_usuario: resposta,
    timestamp: fmtSec(tsSec),
    timestamp_no_exercicio: fmtSec(tsSec - inicioSec),
  });
  let focus: TelemetryExercise;
  if (tipo === 'acerto') {
    open.acertos += 1;
    // Acerto FECHA o exercício — move pra lista de finalizados.
    open.closed = true;
    // Passa o MESMO instante usado no timestamp do item → garante que
    // `tempo_fim_exercicio` (no JSON) bate com `timestamp` do acerto.
    finalizeOpen(section, ova, nowSessionMs);
    // Próximo exercício da seção começa a contar AGORA (não no momento
    // da próxima interação) — assim o tempo entre "acertei" e "comecei
    // a fazer a próxima" entra no cronômetro do próximo exercício.
    // Mesma referência → `Q2.tempo_inicio_exercicio === Q1.tempo_fim_exercicio`.
    section.nextQuestionStartedAt = nowMs();
    section.nextQuestionSessionTime = nowSessionMs;
    // Como acabou de ser finalizado, o foco é o ÚLTIMO da lista de
    // exercícios do OVA (acabou de ser empurrado por finalizeOpen).
    const last = ova.exercises[ova.exercises.length - 1];
    focus = finalizedToJson(last);
  } else {
    open.erros += 1;
    // Erro mantém ABERTO — foco continua sendo o `open`.
    focus = openToJson(open);
  }
  printSnapshot(tipo, focus);
}

/** Registra um clique interativo genérico — chamado pelo listener
 *  global. Conta pra interações da sequência/OVA, mas NÃO pro campo
 *  total_interacoes_exercicio (esse campo conta apenas registros). */
export function telemetryRecordInteraction(): void {
  if (devModeActive) return; // cliques DEV (setas, jumps) não contam
  ensureSessionStarted();
  session.totalInteractions += 1;
  const ova = activeOva();
  if (ova) ova.totalInteractions += 1;
  printSnapshot('click');
}

// ─── Construção do snapshot + print ─────────────────────────────────

function buildSnapshot(): TelemetrySnapshot {
  let totalAcertos = 0;
  let totalErros = 0;
  let totalTempoMs = 0;

  // Sempre inclui AMBOS os OVAs na ordem canônica.
  const ovas: TelemetryOva[] = OVA_IDS.map((id) => {
    const ova = session.ovas.get(id);
    if (!ova) {
      return {
        ova_id: id,
        total_interacoes_ova: 0,
        total_acertos_ova: 0,
        total_erros_ova: 0,
        tempo_total_ova: '00:00',
        exercicios_interagidos: [],
      };
    }
    const ovaMs = ovaElapsedMs(ova);
    totalAcertos += ova.totalAcertos;
    totalErros += ova.totalErros;
    totalTempoMs += ovaMs;
    // Inclui exercícios FINALIZADOS + o ABERTO da seção atual (visão em
    // tempo real). O aberto entra com snapshot do estado atual; quando
    // fechar (por acerto ou troca de seção) ele já está no array
    // `ova.exercises` e o cálculo abaixo o ignora aqui.
    // Reusa as conversões canônicas (`finalizedToJson` / `openToJson`)
    // que já implementam a derivação por subtração em segundos —
    // mantendo o snapshot do buildSnapshot 1-pra-1 com o que é emitido
    // como `focusExercise` nos `printSnapshot` individuais.
    const exercicios: TelemetryExercise[] = ova.exercises.map(finalizedToJson);
    if (ova.currentSection?.open && !ova.currentSection.open.closed) {
      exercicios.push(openToJson(ova.currentSection.open));
    }
    return {
      ova_id: id,
      total_interacoes_ova: ova.totalInteractions,
      total_acertos_ova: ova.totalAcertos,
      total_erros_ova: ova.totalErros,
      tempo_total_ova: fmtMmSs(ovaMs),
      exercicios_interagidos: exercicios,
    };
  });

  return {
    total_interacoes_sequencia: session.totalInteractions,
    total_acertos_sequencia: totalAcertos,
    total_erros_sequencia: totalErros,
    tempo_total_sequencia: fmtMmSs(totalTempoMs),
    ovas,
  };
}

/** Retorna o snapshot atual sem imprimir. */
export function getTelemetrySnapshot(): TelemetrySnapshot {
  return buildSnapshot();
}

/** Converte o exercício ABERTO atual pro formato público.
 *
 *  Pra manter a invariante "Δsegundo entre eventos é o mesmo entre
 *  timestamp e timestamp_no_exercicio" também consistente com o
 *  `tempo_gasto_exercicio` do snapshot atual, derivamos esse campo de
 *  `secOf(getElapsedTotalMs()) - secOf(startedAtSessionTime)` em vez de
 *  `openElapsedMs(open)`. Em ms ambos batem (sessão e exercício pausam
 *  juntos); a derivação garante o alinhamento de segundos por
 *  construção. */
function openToJson(open: OpenExercise): TelemetryExercise {
  const inicioSec = secOf(open.startedAtSessionTime);
  const agoraSec = secOf(getElapsedTotalMs());
  return {
    id: open.id,
    title: open.title,
    descricao: open.descricao,
    tempo_inicio_exercicio: fmtSec(inicioSec),
    // Ainda aberto → ainda não finalizou.
    tempo_fim_exercicio: null,
    tempo_gasto_exercicio: fmtSec(agoraSec - inicioSec),
    total_interacoes_exercicio: open.totalInteracoes,
    total_acertos_exercicio: open.acertos,
    total_erros_exercicio: open.erros,
    historico_atividades: open.history.slice(),
  };
}

/** Converte um exercício já FINALIZADO pro formato público.
 *
 *  INVARIANTE ARITMÉTICA garantida aqui:
 *    tempo_fim_exercicio - tempo_inicio_exercicio === tempo_gasto_exercicio
 *
 *  Pra isso, `tempo_gasto_exercicio` é DERIVADO (em segundos) de
 *  `fimSec - inicioSec`, e NÃO de `fin.durationMs`. Em ms eles são
 *  equivalentes (sessão e exercício pausam juntos), mas truncar dois
 *  números ms diferentes pra segundos pode resultar em off-by-one
 *  (`floor(a) - floor(b) ≠ floor(a-b)` quando atravessa fronteira de
 *  segundo). A subtração inteira evita isso por construção.
 *
 *  O campo `durationMs` interno continua sendo populado com o valor real
 *  medido (openElapsedMs) — útil pra debug e potencial análise futura. */
function finalizedToJson(fin: FinalizedExercise): TelemetryExercise {
  const inicioSec = secOf(fin.startedAtSessionTime);
  const fimSec = secOf(fin.finishedAtSessionTime);
  return {
    id: fin.id,
    title: fin.title,
    descricao: fin.descricao,
    tempo_inicio_exercicio: fmtSec(inicioSec),
    tempo_fim_exercicio: fmtSec(fimSec),
    tempo_gasto_exercicio: fmtSec(fimSec - inicioSec),
    total_interacoes_exercicio: fin.totalInteracoes,
    total_acertos_exercicio: fin.totalAcertos,
    total_erros_exercicio: fin.totalErros,
    historico_atividades: fin.history.slice(),
  };
}

function printSnapshot(trigger: string, focusExercise?: TelemetryExercise): void {
  // Em DEV, nada vai pro console mesmo que algum caller tenha escapado
  // do guard `if (devModeActive) return;` lá no topo da API pública.
  if (devModeActive) return;
  if (typeof console === 'undefined') return;
  const snap = buildSnapshot();
  // eslint-disable-next-line no-console
  console.log(`[telemetria · ${trigger}]`, snap);
  // Quando um item entra no histórico de um exercício (registro/acerto/erro),
  // imprime TAMBÉM aquele exercício isolado pra facilitar debug — fica
  // logo abaixo do objeto completo, no mesmo grupo de logs.
  if (focusExercise) {
    // eslint-disable-next-line no-console
    console.log(`[telemetria · ${trigger} · exercício "${focusExercise.id}"]`, focusExercise);
  }
}

// ─── Inicialização: listeners globais ───────────────────────────────

let listenersInstalled = false;
let alertUnsubscribe: (() => void) | null = null;

function isInteractiveTarget(el: Element | null): boolean {
  if (!el) return false;
  const interactiveSelector =
    'button, a, [role="button"], [role="link"], [role="tab"], [role="menuitem"], ' +
    'input, select, textarea, label, summary, [tabindex]:not([tabindex="-1"])';
  return Boolean(el.closest(interactiveSelector));
}

/** Instala listeners globais (idempotente). */
export function initTelemetryListeners(): () => void {
  if (listenersInstalled || typeof document === 'undefined') {
    return () => { /* noop — já instalado */ };
  }
  listenersInstalled = true;

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!isInteractiveTarget(target)) return;
    // Escape-hatch: qualquer elemento (ou ancestral) com o atributo
    // `data-skip-telemetry` sinaliza "essa árvore não deve alimentar a
    // coleta". Usado em regiões que não fazem parte do percurso
    // pedagógico do aluno (ex.: modal/botão de acesso ao questionário
    // pós-sequência). Mais granular que o `devMode` global porque é
    // declarativo por subárvore.
    if (target?.closest('[data-skip-telemetry]')) return;
    telemetryRecordInteraction();
  };
  document.addEventListener('click', onClick, { capture: true, passive: true });

  alertUnsubscribe = subscribeToAlerts((type: AlertType, title: string, userResponse?: string) => {
    if (type !== 'success' && type !== 'error') return;
    // `resposta_usuario` na telemetria: prefere a resposta REAL do aluno
    // (passada pelo validator via 5º param do createAlert). Quando o
    // validator não passou, cai pro título — é melhor ter contexto que
    // o aluno acertou/errou do que silêncio total.
    //
    // Se o validator chamou telemetryRecordAcerto/Erro explicitamente
    // nos últimos EXPLICIT_GRACE_MS, este observer é pulado dentro de
    // `recordValidation`.
    const resposta = userResponse ?? title;
    if (type === 'success') recordValidation('acerto', resposta, false);
    else recordValidation('erro', resposta, false);
  });

  return () => {
    document.removeEventListener('click', onClick, { capture: true } as EventListenerOptions);
    if (alertUnsubscribe) {
      alertUnsubscribe();
      alertUnsubscribe = null;
    }
    listenersInstalled = false;
  };
}

// ─── Hook React conveniente ──────────────────────────────────────────

/** Marca o componente como contexto/seção enquanto montado. Validações
 *  dentro dessa seção vão acumulando em um exercício até um acerto
 *  fechá-lo.
 *
 *  `title` e `descricao` podem mudar conforme o step interno do
 *  componente — o segundo useEffect propaga essas mudanças pra seção
 *  ativa SEM finalizar o exercício em curso. O próximo exercício
 *  aberto (após um acerto ou após troca de seção) usará os metadados
 *  mais recentes. Útil pra mostrar a descricao DO MOMENTO no JSON
 *  (ex.: "Etapa 1 — Complete a fórmula").
 *
 *  PARÂMETRO `enabled` (default `true`) — quando `false`, o hook é NO-OP
 *  (não chama enter/exit/updateMeta). USE quando o componente pode estar
 *  MONTADO mas NÃO ATIVO — caso típico do `devMode` da Sequência Didática
 *  que mantém todos os stages montados em paralelo: passe `isActiveStage`
 *  como `enabled` pra que só o stage VISÍVEL reivindique a `currentSection`.
 *  Sem isso, stages não-ativos sobrescreveriam o contexto da seção uns
 *  dos outros e na saída do devMode (quando desmontariam) zerariam a
 *  `currentSection` do stage ativo. */
export function useTelemetryExercise(id: string, title: string, descricao: string, enabled: boolean = true): void {
  // Effect 1: enter na entrada, exit na saída. Só dispara em mudança de `id`.
  useEffect(() => {
    if (!enabled) return;
    telemetryEnterExercise(id, title, descricao);
    return () => telemetryExitExercise(id);
    // title/descricao são atualizados pelo effect 2 sem finalizar; por isso
    // ficam fora das deps daqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled]);

  // Effect 2: propaga mudanças de title/descricao SEM resetar exercício.
  useEffect(() => {
    if (!enabled) return;
    telemetryUpdateSectionMeta(id, title, descricao);
  }, [id, title, descricao, enabled]);
}

/**
 * Helper React pra leituras: gerencia o ciclo `start` → `confirm`
 * automaticamente conforme a prop `active` muda.
 *
 * USO TÍPICO — componente que mostra um balão/info com botão "Li.":
 *
 *   const confirmRead = useReadingTelemetry(
 *     showInfoBox,
 *     `roulette-s1-balao-${infoBoxContent.title}`,
 *     `Leitura — ${infoBoxContent.title}`,
 *     'Conteúdo conceitual exibido durante a Etapa 1.',
 *     `confirmou leitura: "${infoBoxContent.title}"`,
 *   );
 *
 *   <Button onClick={() => { confirmRead(); dismissInfoBox(); }}>Li.</Button>
 *
 * SEMÂNTICA
 *  • `active=true`: chama `telemetryStartReading(id)`.
 *  • `active=false` OU `id` muda OU componente desmonta: o cleanup do
 *    useEffect dispara `telemetryConfirmReading` AUTOMATICAMENTE com
 *    os valores que estavam ativos. Isso garante que TODOS os caminhos
 *    de dispensa (botão "Li.", auto-dismiss programático, mudança de
 *    cena, mudança de stage, navegação DEV) viram exercício de leitura.
 *  • A função `confirm()` retornada continua disponível pra callers
 *    que querem disparar o confirm ANTES da animação de dispensa
 *    (ex.: pra som de feedback). É IDEMPOTENTE — se já foi confirmado
 *    via cleanup, a chamada manual é no-op.
 *
 * Sem esse auto-confirm, balões dispensados por handlers que não
 * passam pelo onConfirm (vários `setShowInfoBox(false)` espalhados no
 * useRouletteHooks) ficavam sem exercício gerado — start sem confirm,
 * pending leak.
 */
export function useReadingTelemetry(
  active: boolean,
  id: string,
  title: string,
  descricao: string,
  detalhe: string,
): () => void {
  // Token incremental compartilhado entre runs do effect. Cada run captura
  // o próprio número; o cleanup defere o confirm pra microtask e só
  // executa se o token ainda for o mesmo no momento da execução. Em
  // React StrictMode (dev), o ciclo é effect→cleanup→effect síncrono na
  // mesma task — então quando a microtask do cleanup intermediário roda,
  // o segundo effect já avançou o token, e o confirm fantasma é pulado.
  // Sem essa proteção, F5 numa cena com balão restaurado gerava DOIS
  // exercícios atômicos por balão (cleanup do strict mode confirmava 1,
  // cleanup real confirmava o 2º).
  const tokenRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    const myToken = ++tokenRef.current;
    telemetryStartReading(id);
    // Cleanup roda quando:
    //   • `active` muda pra false (dispensa do balão)
    //   • `id` muda (novo balão substitui o atual)
    //   • Componente desmonta (navegação, troca de stage, logout)
    //   • StrictMode dev (entre effect e re-effect)
    // Confirma com os valores DESTE ciclo (closure). Idempotente
    // contra StrictMode via tokenRef; idempotente contra duplo
    // confirm via `telemetryConfirmReading` (que checa pending).
    return () => {
      queueMicrotask(() => {
        if (tokenRef.current !== myToken) return;
        telemetryConfirmReading(id, title, descricao, detalhe);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, id]); // title/descricao/detalhe lidos via closure — mudanças não disparam novo ciclo
  return useCallback(() => {
    // Confirmação manual (clique em "Li."): avança o token pra invalidar
    // qualquer microtask de cleanup que esteja na fila — evita o confirm
    // ser executado 2x quando o handler do botão chama isso ANTES do
    // cleanup do efeito (que rodaria logo após, via setShowInfoBox(false)).
    tokenRef.current++;
    telemetryConfirmReading(id, title, descricao, detalhe);
  }, [id, title, descricao, detalhe]);
}
