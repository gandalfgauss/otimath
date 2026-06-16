'use client';

/* ═══════════════════════════════════════════════════════════════════
   UnionExercise6Review — Exercício 6 (Revisão obrigatória)

   ESTRUTURA
     • 2 rodadas: uma de União (∪) e uma de Interseção (∩)
     • Ordem emerge do sorteio (rodada 1 = qualquer um dos 10 candidatos
       curados; rodada 2 = pool da operação OPOSTA)
     • Garantia: cobre as duas operações, sem repetição de par (a,b)
       (assegurada pelo sanity-check de exercise6Challenges.ts)

   STEPS DE NAVEGAÇÃO (externos — para handles dev)
     intro → round1 → transition → round2 → finalSynthesis

   FEEDBACK PEDAGÓGICO
     • Botão "Ajuda" sempre visível (canto sup. dir. de cada rodada)
     • Após erro: mensagem específica por step + verbete sugerido
       destacado com badge ★ no Menu de Revisão
     • R14 garantido (validação de fração equivalente em todos os
       campos via useTwoDicesSingleShotHooks)

   PADRÃO ARQUITETURAL: forwardRef + Handle + STEP_SEQUENCE (espelha Ex5)
   ═══════════════════════════════════════════════════════════════════ */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/global/Button';
import { TextBlock } from '@/components/global/TextBlock';
import { TwoDicesGameSingleShot, type TwoDicesGameSingleShotHandle } from './TwoDicesGameSingleShot';
import { StudyMenu } from './shared/StudyMenu';
import {
  buildEx6Session,
  type Ex6Round,
} from './shared/exercise6Challenges';
import {
  getFeedbackMessage,
  getSuggestedEntries,
  type Ex6StepKind,
  type GlossaryEntryId,
} from './shared/studyMenuContent';
import type { SingleShotStepKind } from '@/hooks/teaching/probability/two-dices/useTwoDicesSingleShotHooks';
import { playSound } from '@/hooks/global/useSound';
import { logStudyMenuOpened } from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';
import { BookOpen, Check } from 'lucide-react';
import { SequenceStatsCard } from '@/components/teaching/probability/SequenceStatsCard';
import { freezeOva, getSequenceStats, unfreezeOva, useSequenceTick } from '@/hooks/teaching/probability/useSequenceSession';
import { useTelemetryExercise, useReadingTelemetry, telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';

type Step = 'intro' | 'round1' | 'transition' | 'round2' | 'finalSynthesis';

const STEP_SEQUENCE: Step[] = ['intro', 'round1', 'transition', 'round2', 'finalSynthesis'];

interface UnionExercise6Props {
  onFinished: () => void;
  /** Disparado quando o estudante escolhe "Ex7 — Fixação básica" no painel
   *  final — leva ao Ex7 opcional (TwoDicesGame completo, 12 eventos fixos).
   *  Se ausente, o botão de Ex7 não é exibido. */
  onRequestFreePlay?: () => void;
  /** Disparado quando o estudante escolhe "Ex8 — Fixação avançada" no painel
   *  final — leva ao Ex8 opcional (TwoDicesGameAdvanced, ~50 eventos
   *  parametrizados, marcação A→B→D). Se ausente, o botão de Ex8 não é exibido. */
  onRequestAdvancedFreePlay?: () => void;
  onRequestPreviousPhase?: () => void;
  initialStep?: Step;
  /** Quando true, o botão "Ex7" aparece desabilitado com indicador de
   *  conclusão. O estudante já realizou esse exercício opcional. */
  ex7Completed?: boolean;
  /** Análogo para o Ex8. */
  ex8Completed?: boolean;
  /** Disparado pra mostrar alerts de feedback (acerto, conclusão de rodada,
   *  finalização do OVA). Mesma assinatura do alerts global. */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number) => void;
}

export interface UnionExercise6Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

interface RoundOutcome {
  candidateId: string;
  operation: 'Union' | 'Intersection';
  errorsCount: number;
  finished: boolean;
}

export const UnionExercise6Review = forwardRef<UnionExercise6Handle, UnionExercise6Props>(
  function UnionExercise6Review(
    {
      onFinished,
      onRequestFreePlay,
      onRequestAdvancedFreePlay,
      onRequestPreviousPhase,
      initialStep = 'intro',
      ex7Completed = false,
      ex8Completed = false,
      createAlert,
    },
    ref,
  ) {
    const [step, setStep] = useState<Step>(initialStep);
    // Telemetria — leitura do enunciado do Ex.6 (revisão).
    const confirmReadIntro = useReadingTelemetry(
      step === 'intro',
      'twoDices-cena7-unionExercise6-intro',
      'Leitura — Enunciado do Exercício 6 (revisão união + interseção)',
      'Painel inicial — descrição das 2 rodadas e botão para abrir o menu de ajuda/revisão.',
      'confirmou leitura do enunciado e clicou em "Começar revisão"',
    );
    const [session] = useState<readonly [Ex6Round, Ex6Round]>(() => buildEx6Session());
    // Título DINÂMICO com label legível por step + dados da sessão.
    const stepLabelUE6 = step === 'intro' ? 'Enunciado'
      : step === 'round1' ? 'Rodada 1'
      : step === 'transition' ? 'Transição entre rodadas'
      : step === 'round2' ? 'Rodada 2'
      : step === 'finalSynthesis' ? 'Síntese final (Ex7, Ex8 ou finalizar)'
      : String(step);
    const r1 = session[0]?.candidate;
    const r2 = session[1]?.candidate;
    const r1Op = session[0]?.operation === 'Union' ? 'A ∪ B' : 'A ∩ B';
    const r2Op = session[1]?.operation === 'Union' ? 'A ∪ B' : 'A ∩ B';
    const sessaoBloco =
      `Rodada 1 (${session[0]?.operation === 'Union' ? 'União' : 'Interseção'}): A="${r1?.descriptionA ?? '?'}" (n(A)=${r1?.nA ?? '?'}), B="${r1?.descriptionB ?? '?'}" (n(B)=${r1?.nB ?? '?'}), n(A∩B)=${r1?.nIntersection ?? '?'}, n(${r1Op})=${r1?.nResult ?? '?'}, P=${r1?.reducedP.num ?? '?'}/${r1?.reducedP.den ?? '?'} | ` +
      `Rodada 2 (${session[1]?.operation === 'Union' ? 'União' : 'Interseção'}): A="${r2?.descriptionA ?? '?'}" (n(A)=${r2?.nA ?? '?'}), B="${r2?.descriptionB ?? '?'}" (n(B)=${r2?.nB ?? '?'}), n(A∩B)=${r2?.nIntersection ?? '?'}, n(${r2Op})=${r2?.nResult ?? '?'}, P=${r2?.reducedP.num ?? '?'}/${r2?.reducedP.den ?? '?'} | ` +
      `Espaço amostral: 36 pares ordenados em ambas as rodadas`;
    const oQueCalculaUE6 =
      step === 'intro' ? 'Leitura do enunciado do exercício de revisão (2 rodadas obrigatórias).'
      : step === 'round1' ? `Rodada 1 (${session[0]?.operation === 'Union' ? 'União A ∪ B' : 'Interseção A ∩ B'}): aluno calcula n(${r1Op}) e P = ${r1?.reducedP.num}/${r1?.reducedP.den} para A="${r1?.descriptionA}" e B="${r1?.descriptionB}".`
      : step === 'transition' ? 'Transição: aluno terminou Rodada 1 e está prestes a iniciar Rodada 2 (operação trocada).'
      : step === 'round2' ? `Rodada 2 (${session[1]?.operation === 'Union' ? 'União A ∪ B' : 'Interseção A ∩ B'}): aluno calcula n(${r2Op}) e P = ${r2?.reducedP.num}/${r2?.reducedP.den} para A="${r2?.descriptionA}" e B="${r2?.descriptionB}".`
      : step === 'finalSynthesis' ? 'Síntese final: aluno escolhe entre Ex7 (fixação básica), Ex8 (fixação avançada) ou finalizar o OVA.'
      : '';
    useTelemetryExercise(
      `twoDices-cena7-unionExercise6-review-${step}`,
      `Exercício 6 — Revisão obrigatória — ${stepLabelUE6}`,
      `Atividade global: Aluno joga 2 rodadas (uma União, uma Interseção) sorteadas entre pares curados, calculando n(D)/n(S). | ${sessaoBloco} | Fase atual: ${stepLabelUE6}. | Ação atual do aluno / cálculo: ${oQueCalculaUE6}`,
    );

    const [studyMenuOpen, setStudyMenuOpen] = useState(false);
    const [lastErrorStep, setLastErrorStep] = useState<SingleShotStepKind | null>(null);
    const [pulseHelp, setPulseHelp] = useState(false);

    // Refs dos sub-componentes single-shot (rodadas 1 e 2) — permitem ao
    // DEV avançar pelos 5 sub-passos internos (mark-A → mark-B → mark-D →
    // identify-operation → compute-probability) em vez de pular a rodada
    // inteira via STEP_SEQUENCE.
    const round1ShotRef = useRef<TwoDicesGameSingleShotHandle>(null);
    const round2ShotRef = useRef<TwoDicesGameSingleShotHandle>(null);

    const [round1Outcome, setRound1Outcome] = useState<RoundOutcome>({
      candidateId: session[0].candidate.id,
      operation: session[0].operation,
      errorsCount: 0,
      finished: false,
    });
    const [round2Outcome, setRound2Outcome] = useState<RoundOutcome>({
      candidateId: session[1].candidate.id,
      operation: session[1].operation,
      errorsCount: 0,
      finished: false,
    });

    /* ──────────────────────────────────────────────────────────────
       HANDLE EXTERNO (forwardRef) — usado pelas setinhas dev e pelo
       Presentation. Reflete capacidade de avançar/recuar entre steps.
       ──────────────────────────────────────────────────────────── */
    useImperativeHandle(
      ref,
      () => ({
        advance: () => {
          // Durante rodada 1 ou 2, delega para o handle do TwoDicesGameSingleShot
          // — assim o DEV percorre cada sub-passo (mark-A → mark-B → mark-D →
          // identify-operation → compute-probability) antes de transitar. Quando
          // o último sub-passo é alcançado, o próprio SingleShot chama
          // onChallengeFinished, que faz handleRound1Finished/handleRound2Finished
          // mover o STEP_SEQUENCE adiante.
          if (step === 'round1' && round1ShotRef.current) {
            round1ShotRef.current.advance();
            return;
          }
          if (step === 'round2' && round2ShotRef.current) {
            round2ShotRef.current.advance();
            return;
          }
          const idx = STEP_SEQUENCE.indexOf(step);
          if (idx >= 0 && idx < STEP_SEQUENCE.length - 1) {
            setStep(STEP_SEQUENCE[idx + 1]);
          } else {
            onFinished();
          }
        },
        back: () => {
          const idx = STEP_SEQUENCE.indexOf(step);
          if (idx > 0) {
            setStep(STEP_SEQUENCE[idx - 1]);
          } else if (onRequestPreviousPhase) {
            onRequestPreviousPhase();
          }
        },
        canAdvance: () => true,
        canBack: () => STEP_SEQUENCE.indexOf(step) > 0 || !!onRequestPreviousPhase,
      }),
      [step, onFinished, onRequestPreviousPhase],
    );

    /* ──────────────────────────────────────────────────────────────
       PULSO DO BOTÃO AJUDA APÓS ERRO
       Princípio da sinalização (Mayer 2014, p. 285): após erro, o
       botão Ajuda chama atenção visualmente sem abrir automaticamente.
       Pulso dura ~3 segundos; estudante mantém agência sobre consultar.
       ──────────────────────────────────────────────────────────── */
    useEffect(() => {
      if (!lastErrorStep) return;
      setPulseHelp(true);
      const t = setTimeout(() => setPulseHelp(false), 3000);
      return () => clearTimeout(t);
    }, [lastErrorStep]);

    /* ──────────────────────────────────────────────────────────────
       Congela o cronômetro do OVA Dois Dados quando o aluno chega na
       tela de "Parabéns" (finalSynthesis) — onde aparece o card de
       estatísticas. Descongela se ele voltar para uma rodada via DEV
       ou via "Voltar". Sem isso, o tempo continuaria avançando dentro
       do card enquanto o aluno permanece ali considerando Ex7/Ex8.
       ──────────────────────────────────────────────────────────── */
    useEffect(() => {
      if (step === 'finalSynthesis') freezeOva('twoDices');
      else                            unfreezeOva('twoDices');
    }, [step]);

    const handleStepError = useCallback((stepKind: SingleShotStepKind) => {
      setLastErrorStep(stepKind);
      // Acumula erro na rodada ativa
      if (step === 'round1') {
        setRound1Outcome((p) => ({ ...p, errorsCount: p.errorsCount + 1 }));
      } else if (step === 'round2') {
        setRound2Outcome((p) => ({ ...p, errorsCount: p.errorsCount + 1 }));
      }
    }, [step]);

    // Ancora no topo do OVA em cada transição de step. Antes nenhum botão
    // do Ex6 ("Começar revisão", "Começar Rodada 2", "Finalizar OVA", as
    // transições automáticas de fim de rodada) rolava — o aluno terminava
    // a interação lá embaixo e a próxima tela carregava sem trazer o
    // enunciado novo pra viewport.
    const scrollDiceToTop = useCallback(() => {
      requestAnimationFrame(() => {
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, []);

    const handleRound1Finished = useCallback(() => {
      setRound1Outcome((p) => ({ ...p, finished: true }));
      setLastErrorStep(null);
      playSound('/sounds/challengeFinished.mp3');
      // Alert de celebração ao concluir a Rodada 1 (chegada na tela
      // "Rodada 1 concluída!"). Antes só tocava o som — sem reforço
      // visual da conquista.
      createAlert?.(
        '✅ Rodada concluída!',
        'Parabéns! Você finalizou a Rodada 1 do Exercício 6.',
        'success',
        4500,
      );
      setStep('transition');
      scrollDiceToTop();
    }, [scrollDiceToTop, createAlert]);

    const handleRound2Finished = useCallback(() => {
      setRound2Outcome((p) => ({ ...p, finished: true }));
      setLastErrorStep(null);
      playSound('/sounds/gameFinished.mp3');
      // Alert de celebração ao chegar em finalSynthesis (tela "Parabéns!
      // Você concluiu o OVA..."). Antes só tocava o som — sem reconhecimento
      // textual de que o aluno completou o OVA inteiro do dado.
      createAlert?.(
        '🎉 OVA concluído!',
        'Parabéns! Você finalizou o OVA Probabilidade Dois Dados.',
        'success',
        6000,
      );
      setStep('finalSynthesis');
      scrollDiceToTop();
    }, [scrollDiceToTop, createAlert]);

    /* ──────────────────────────────────────────────────────────────
       SUGESTÃO DE VERBETES — derivada do último erro
       ──────────────────────────────────────────────────────────── */
    const currentRound: Ex6Round | null = useMemo(() => {
      if (step === 'round1') return session[0];
      if (step === 'round2') return session[1];
      return null;
    }, [step, session]);

    const suggestedGlossaryEntryIds: readonly GlossaryEntryId[] = useMemo(() => {
      if (!lastErrorStep || !currentRound) return [];
      return getSuggestedEntries(lastErrorStep as Ex6StepKind, currentRound.operation);
    }, [lastErrorStep, currentRound]);

    const feedbackMessage: string | null = useMemo(() => {
      if (!lastErrorStep || !currentRound) return null;
      return getFeedbackMessage(lastErrorStep as Ex6StepKind, currentRound.operation);
    }, [lastErrorStep, currentRound]);

    const initialGlossaryEntryId: GlossaryEntryId | undefined = suggestedGlossaryEntryIds[0];

    /* ──────────────────────────────────────────────────────────────
       RENDERIZAÇÃO
       ──────────────────────────────────────────────────────────── */

    const HelpButton = () => (
      <div className="flex justify-end w-full">
        <Button
          style="secondary"
          size="extra-small"
          icon={<BookOpen aria-hidden="true" />}
          onClick={() => {
            telemetryRecordInteracaoExercicio(
              `UE6 Review ${step} — clicou em "Ajuda — Menu de Revisão" (último erro: ${lastErrorStep ?? 'nenhum'}) — abriu o modal de glossário/revisão de conceitos`,
            );
            logStudyMenuOpened('unionExercise6', step, initialGlossaryEntryId, lastErrorStep ?? undefined);
            setStudyMenuOpen(true);
          }}
          ariaLabel="Abrir Menu de Revisão"
          additionalStyles={pulseHelp ? 'animate-pulse ring-2 ring-feedback-warning-darkest' : ''}
        >
          Ajuda — Menu de Revisão
        </Button>
      </div>
    );

    const FeedbackBanner = () =>
      feedbackMessage ? (
        <div
          role="alert"
          className="p-micro rounded-sm border-thin border-feedback-warning-darkest bg-feedback-warning-lighter"
        >
          <p className="ds-small text-feedback-warning-darkest">{feedbackMessage}</p>
        </div>
      ) : null;

    return (
      <div className="flex flex-col gap-y-xs">
        {/* ─── INTRO ─── */}
        {step === 'intro' && (
          <div className="flex flex-col gap-y-xxs items-center text-center">
            <h2 className="ds-heading-large text-brand-otimath-darker">
              Exercício 6 — Revisão das Operações entre Eventos
            </h2>
            <TextBlock
              paragraph={`<p class="ds-body">Você fará <strong>duas rodadas</strong>: uma sobre <strong>União (∪)</strong> e outra sobre <strong>Interseção (∩)</strong>. A ordem é sorteada. Em cada rodada você marcará os eventos na tabela 6×6, identificará a operação e calculará a probabilidade. <strong>Frações equivalentes são aceitas.</strong></p><p class="ds-body">Use o botão <strong>Ajuda — Menu de Revisão</strong> a qualquer momento para consultar conceitos.</p>`}
              maxWidthParagraph="max-w-[700px]"
              centralize={true}
            />
            <Button style="primary" size="medium" onClick={() => {
              telemetryRecordInteracaoExercicio(
                `UE6 Review intro — clicou em "Começar revisão" (Rodada 1: ${session[0].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'} ; Rodada 2: ${session[1].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}) — entrou na rodada 1`,
              );
              confirmReadIntro();
              setStep('round1');
              scrollDiceToTop();
            }}>
              Começar revisão
            </Button>
          </div>
        )}

        {/* ─── RODADA 1 ─── */}
        {step === 'round1' && (
          <div className="flex flex-col gap-y-xxs">
            <div className="flex justify-between items-center gap-x-micro gap-y-nano flex-wrap">
              <h3 className="ds-heading-large text-brand-otimath-darker">
                Rodada 1 de 2 — {session[0].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}
              </h3>
              <HelpButton />
            </div>
            <FeedbackBanner />
            <TwoDicesGameSingleShot
              ref={round1ShotRef}
              candidate={session[0].candidate}
              onChallengeFinished={handleRound1Finished}
              onStepError={handleStepError}
            />
          </div>
        )}

        {/* ─── TRANSIÇÃO ENTRE RODADAS ─── */}
        {step === 'transition' && (
          <div className="flex flex-col gap-y-xxs items-center text-center">
            <h3 className="ds-heading-large text-feedback-success-dark">
              Rodada 1 concluída!
            </h3>
            <p className="ds-body text-neutral-darkest max-w-[600px]">
              Agora você fará a Rodada 2, sobre{' '}
              <strong>
                {session[1].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}
              </strong>
              . Use o Menu de Revisão se precisar.
            </p>
            <Button style="primary" size="medium" onClick={() => {
              telemetryRecordInteracaoExercicio(
                `UE6 Review transition — clicou em "Começar Rodada 2" (operação: ${session[1].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}) — entrou na rodada 2 obrigatória`,
              );
              setLastErrorStep(null);
              setStep('round2');
              scrollDiceToTop();
            }}>
              Começar Rodada 2
            </Button>
          </div>
        )}

        {/* ─── RODADA 2 ─── */}
        {step === 'round2' && (
          <div className="flex flex-col gap-y-xxs">
            <div className="flex justify-between items-center gap-x-micro gap-y-nano flex-wrap">
              <h3 className="ds-heading-large text-brand-otimath-darker">
                Rodada 2 de 2 — {session[1].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}
              </h3>
              <HelpButton />
            </div>
            <FeedbackBanner />
            <TwoDicesGameSingleShot
              ref={round2ShotRef}
              candidate={session[1].candidate}
              onChallengeFinished={handleRound2Finished}
              onStepError={handleStepError}
            />
          </div>
        )}

        {/* ─── SÍNTESE FINAL — fechamento conceitual do OVA ─── */}
        {step === 'finalSynthesis' && (
          <div className="flex flex-col gap-y-xxs items-center text-center">
            <h2 className="ds-heading-large text-brand-otimath-darker">
              Parabéns! Você concluiu o OVA Probabilidade Dois Dados
            </h2>
            <TextBlock
              paragraph={`<p class="ds-body">Você pode <strong>finalizar o OVA agora</strong> ou seguir para uma das duas vias opcionais de Fixação: o <strong>Ex7 — Fixação básica</strong> (jogo completo com 12 eventos fixos) ou o <strong>Ex8 — Fixação avançada</strong> (pool ampliado de ~50 eventos parametrizados, com progressão de dificuldade e marcação sequencial A → B → D). Use a fixação para consolidar o que aprendeu antes de finalizar.</p>`}
              maxWidthParagraph="max-w-[700px]"
              centralize={true}
            />
            <div className="flex gap-x-micro gap-y-micro flex-wrap justify-center">
              <Button style="borderless" size="small" onClick={() => {
                telemetryRecordInteracaoExercicio(
                  'UE6 Review finalSynthesis — clicou em "Revisar conceitos" — abriu o modal de glossário/revisão de conceitos a partir da síntese final',
                );
                logStudyMenuOpened('unionExercise6', step, initialGlossaryEntryId);
                setStudyMenuOpen(true);
              }}>
                Revisar conceitos
              </Button>
              {onRequestFreePlay && (
                ex7Completed ? (
                  <span
                    className="ds-small-bold inline-flex items-center gap-x-quarck px-micro py-quarck rounded-md bg-feedback-success-lighter text-feedback-success-darkest border-hairline border-feedback-success-dark"
                    aria-label="Exercício 7 concluído"
                    title="Exercício 7 concluído"
                  >
                    <Check size={16} strokeWidth={3} aria-hidden="true" />
                    Ex7 — Concluído
                  </span>
                ) : (
                  <Button style="secondary" size="small" onClick={() => {
                    telemetryRecordInteracaoExercicio(
                      'UE6 Review finalSynthesis — clicou em "Ex7 — Fixação básica (Opcional)" — saiu da síntese final para o exercício 7 (Fixação básica)',
                    );
                    onRequestFreePlay();
                    scrollDiceToTop();
                  }}>
                    Ex7 — Fixação básica (Opcional)
                  </Button>
                )
              )}
              {onRequestAdvancedFreePlay && (
                ex8Completed ? (
                  <span
                    className="ds-small-bold inline-flex items-center gap-x-quarck px-micro py-quarck rounded-md bg-feedback-success-lighter text-feedback-success-darkest border-hairline border-feedback-success-dark"
                    aria-label="Exercício 8 concluído"
                    title="Exercício 8 concluído"
                  >
                    <Check size={16} strokeWidth={3} aria-hidden="true" />
                    Ex8 — Concluído
                  </span>
                ) : (
                  <Button style="secondary" size="small" onClick={() => {
                    telemetryRecordInteracaoExercicio(
                      'UE6 Review finalSynthesis — clicou em "Ex8 — Fixação avançada (Opcional)" — saiu da síntese final para o exercício 8 (Fixação avançada)',
                    );
                    onRequestAdvancedFreePlay();
                    scrollDiceToTop();
                  }}>
                    Ex8 — Fixação avançada (Opcional)
                  </Button>
                )
              )}
              <Button style="primary" size="medium" onClick={() => {
                telemetryRecordInteracaoExercicio(
                  `UE6 Review finalSynthesis — clicou em "Finalizar OVA" (Ex7 ${ex7Completed ? 'concluído' : 'não realizado'}; Ex8 ${ex8Completed ? 'concluído' : 'não realizado'}) — encerrou o OVA Probabilidade Dois Dados`,
                );
                scrollDiceToTop();
                onFinished();
              }}>
                Finalizar OVA
              </Button>
            </div>

            {/* Card de estatísticas do OVA Dois Dados — mesma estrutura
                do card que aparece na tela final da sequência. */}
            <div className="w-full max-w-[760px] mt-xxs">
              <TwoDicesFinalStats />
            </div>
          </div>
        )}

        {/* ─── MENU DE REVISÃO (sempre montado, controlado por estado) ─── */}
        <StudyMenu
          open={studyMenuOpen}
          onClose={() => setStudyMenuOpen(false)}
          suggestedGlossaryEntryIds={suggestedGlossaryEntryIds}
          initialGlossaryEntryId={initialGlossaryEntryId}
        />
      </div>
    );
  },
);

// ─────────────────────────────────────────────────────────────────
// Card de estatísticas do OVA Dois Dados — exibido na tela final
// (finalSynthesis). Hook `useSequenceTick` mantém o cronômetro vivo
// caso o aluno permaneça aqui antes de finalizar o OVA.
// ─────────────────────────────────────────────────────────────────
function TwoDicesFinalStats() {
  useSequenceTick(1000);
  const { twoDices } = getSequenceStats();
  return <SequenceStatsCard title="OVA Dois Dados" stats={twoDices} />;
}
