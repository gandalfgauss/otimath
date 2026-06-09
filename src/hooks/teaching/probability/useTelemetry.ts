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

import { useEffect } from 'react';
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

export type TelemetryActivityType = 'acerto' | 'erro' | 'interacao_registro';

export interface TelemetryActivity {
  tipo: TelemetryActivityType;
  resposta_usuario: string;
  /** Tempo decorrido dentro do exercício no momento do evento (MM:SS). */
  timestamp: string;
}

export interface TelemetryExercise {
  id: string;
  title: string;
  descricao: string;
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
  registros: number;
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
}

interface FinalizedExercise {
  id: string;
  title: string;
  descricao: string;
  durationMs: number;
  finishedAt: number;
  totalRegistros: number;
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

// ─── Helpers de tempo ───────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, '0');

function fmtMmSs(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${pad2(min)}:${pad2(sec)}`;
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
function finalizeOpen(section: SectionContext, ova: OvaRuntime): void {
  if (!section.open) return;
  const open = section.open;
  const endAt = nowMs();
  ova.exercises.push({
    id: open.id,
    title: open.title,
    descricao: open.descricao,
    durationMs: openElapsedMs(open),
    finishedAt: endAt,
    totalRegistros: open.registros,
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
    registros: 0,
    acertos: 0,
    erros: 0,
    history: [],
    closed: false,
  };
  section.open = open;
  return open;
}

// ─── API pública ────────────────────────────────────────────────────

/** Reseta o estado interno. Chamar ao começar uma nova sequência. */
export function telemetryReset(): void {
  session.startedAt = null;
  session.activeOvaId = null;
  session.totalInteractions = 0;
  session.ovas = new Map(OVA_IDS.map((id) => [id, makeOvaRuntime(id)] as const));
  session.lastExplicitAt = { acerto: 0, erro: 0 };
  telemetryPausedAt = null;
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

/** Entra num CONTEXTO/SEÇÃO. Cada Conferir dentro dela gera (ou
 *  acumula em) um exercício. */
export function telemetryEnterExercise(id: string, title: string, descricao: string): void {
  ensureSessionStarted();
  const ova = activeOva();
  if (!ova) return;
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
  };
}

/** Sai do contexto/seção. Finaliza exercício aberto (se houver). */
export function telemetryExitExercise(id?: string): void {
  const ova = activeOva();
  if (!ova || !ova.currentSection) return;
  if (id !== undefined && ova.currentSection.id !== id) return;
  finalizeOpen(ova.currentSection, ova);
  ova.currentSection = null;
}

/** Adiciona um registro (input/checkbox sem certo/errado) ao exercício
 *  aberto da seção atual. Cria o exercício se não houver um aberto. */
export function telemetryRecordRegistro(resposta: string): void {
  const ova = activeOva();
  if (!ova?.currentSection) return;
  const open = ensureOpenExercise(ova.currentSection);
  open.registros += 1;
  open.history.push({
    tipo: 'interacao_registro',
    resposta_usuario: resposta,
    // Timestamp = mesma referência do cronômetro do topo (tempo total
    // da sessão, descontado pause offline). Assim o aluno consegue
    // correlacionar o JSON com o que viu na barra de progresso.
    timestamp: fmtMmSs(getElapsedTotalMs()),
  });
  printSnapshot('registro', openToJson(open));
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
    const orphan: FinalizedExercise = {
      id: orphanId,
      title: `${ova.id} — Pergunta órfã ${orphanIdx}`,
      descricao: 'Validação fora de contexto de seção explícito.',
      durationMs: 0,
      finishedAt: nowMs(),
      totalRegistros: 0,
      totalAcertos: tipo === 'acerto' ? 1 : 0,
      totalErros: tipo === 'erro' ? 1 : 0,
      history: [{
        tipo,
        resposta_usuario: resposta,
        // Igual aos outros casos: timestamp relativo à sessão (cronômetro do topo).
        timestamp: fmtMmSs(getElapsedTotalMs()),
      }],
    };
    ova.exercises.push(orphan);
    printSnapshot(tipo, finalizedToJson(orphan));
    return;
  }

  const open = ensureOpenExercise(section);
  open.history.push({
    tipo,
    resposta_usuario: resposta,
    // Timestamp = mesma referência do cronômetro do topo (vide comentário
    // equivalente no telemetryRecordRegistro acima).
    timestamp: fmtMmSs(getElapsedTotalMs()),
  });
  let focus: TelemetryExercise;
  if (tipo === 'acerto') {
    open.acertos += 1;
    // Acerto FECHA o exercício — move pra lista de finalizados.
    open.closed = true;
    finalizeOpen(section, ova);
    // Próximo exercício da seção começa a contar AGORA (não no momento
    // da próxima interação) — assim o tempo entre "acertei" e "comecei
    // a fazer a próxima" entra no cronômetro do próximo exercício.
    section.nextQuestionStartedAt = nowMs();
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
    const exercicios: TelemetryExercise[] = ova.exercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      descricao: ex.descricao,
      tempo_gasto_exercicio: fmtMmSs(ex.durationMs),
      total_interacoes_exercicio: ex.totalRegistros,
      total_acertos_exercicio: ex.totalAcertos,
      total_erros_exercicio: ex.totalErros,
      historico_atividades: ex.history.slice(),
    }));
    if (ova.currentSection?.open && !ova.currentSection.open.closed) {
      const open = ova.currentSection.open;
      exercicios.push({
        id: open.id,
        title: open.title,
        descricao: open.descricao,
        tempo_gasto_exercicio: fmtMmSs(openElapsedMs(open)),
        total_interacoes_exercicio: open.registros,
        total_acertos_exercicio: open.acertos,
        total_erros_exercicio: open.erros,
        historico_atividades: open.history.slice(),
      });
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

/** Converte o exercício ABERTO atual pro formato público. */
function openToJson(open: OpenExercise): TelemetryExercise {
  return {
    id: open.id,
    title: open.title,
    descricao: open.descricao,
    tempo_gasto_exercicio: fmtMmSs(openElapsedMs(open)),
    total_interacoes_exercicio: open.registros,
    total_acertos_exercicio: open.acertos,
    total_erros_exercicio: open.erros,
    historico_atividades: open.history.slice(),
  };
}

/** Converte um exercício já FINALIZADO pro formato público. */
function finalizedToJson(fin: FinalizedExercise): TelemetryExercise {
  return {
    id: fin.id,
    title: fin.title,
    descricao: fin.descricao,
    tempo_gasto_exercicio: fmtMmSs(fin.durationMs),
    total_interacoes_exercicio: fin.totalRegistros,
    total_acertos_exercicio: fin.totalAcertos,
    total_erros_exercicio: fin.totalErros,
    historico_atividades: fin.history.slice(),
  };
}

function printSnapshot(trigger: string, focusExercise?: TelemetryExercise): void {
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
 *  (ex.: "Etapa 1 — Complete a fórmula"). */
export function useTelemetryExercise(id: string, title: string, descricao: string): void {
  // Effect 1: enter na entrada, exit na saída. Só dispara em mudança de `id`.
  useEffect(() => {
    telemetryEnterExercise(id, title, descricao);
    return () => telemetryExitExercise(id);
    // title/descricao são atualizados pelo effect 2 sem finalizar; por isso
    // ficam fora das deps daqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Effect 2: propaga mudanças de title/descricao SEM resetar exercício.
  useEffect(() => {
    telemetryUpdateSectionMeta(id, title, descricao);
  }, [id, title, descricao]);
}
