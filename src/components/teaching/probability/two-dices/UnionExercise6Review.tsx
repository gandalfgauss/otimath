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
  useState,
} from 'react';
import { Button } from '@/components/global/Button';
import { TextBlock } from '@/components/global/TextBlock';
import { TwoDicesGameSingleShot } from './TwoDicesGameSingleShot';
import { StudyMenu } from './shared/StudyMenu';
import {
  buildEx6Session,
  type Ex6Round,
} from './shared/exercise6Challenges';
import {
  getFeedbackMessage,
  getSuggestedVerbetes,
  type Ex6StepKind,
  type VerbeteId,
} from './shared/studyMenuContent';
import type { SingleShotStepKind } from '@/hooks/teaching/probability/two-dices/useTwoDicesSingleShotHooks';
import { playSound } from '@/hooks/global/useSound';
import { BookOpen } from 'lucide-react';

type Step = 'intro' | 'round1' | 'transition' | 'round2' | 'finalSynthesis';

const STEP_SEQUENCE: Step[] = ['intro', 'round1', 'transition', 'round2', 'finalSynthesis'];

interface UnionExercise6Props {
  onFinished: () => void;
  /** Disparado quando o estudante escolhe "Continuar treinando" no painel
   *  final — leva ao Ex7 opcional (TwoDicesGame completo). Se ausente, o
   *  botão de continuar treinando não é exibido. */
  onRequestFreePlay?: () => void;
  onRequestPreviousPhase?: () => void;
  initialStep?: Step;
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
    { onFinished, onRequestFreePlay, onRequestPreviousPhase, initialStep = 'intro' },
    ref,
  ) {
    const [step, setStep] = useState<Step>(initialStep);
    const [session] = useState<readonly [Ex6Round, Ex6Round]>(() => buildEx6Session());

    const [studyMenuOpen, setStudyMenuOpen] = useState(false);
    const [lastErrorStep, setLastErrorStep] = useState<SingleShotStepKind | null>(null);
    const [pulseHelp, setPulseHelp] = useState(false);

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

    const handleStepError = useCallback((stepKind: SingleShotStepKind) => {
      setLastErrorStep(stepKind);
      // Acumula erro na rodada ativa
      if (step === 'round1') {
        setRound1Outcome((p) => ({ ...p, errorsCount: p.errorsCount + 1 }));
      } else if (step === 'round2') {
        setRound2Outcome((p) => ({ ...p, errorsCount: p.errorsCount + 1 }));
      }
    }, [step]);

    const handleRound1Finished = useCallback(() => {
      setRound1Outcome((p) => ({ ...p, finished: true }));
      setLastErrorStep(null);
      playSound('/sounds/challengeFinished.mp3');
      setStep('transition');
    }, []);

    const handleRound2Finished = useCallback(() => {
      setRound2Outcome((p) => ({ ...p, finished: true }));
      setLastErrorStep(null);
      playSound('/sounds/gameFinished.mp3');
      setStep('finalSynthesis');
    }, []);

    /* ──────────────────────────────────────────────────────────────
       SUGESTÃO DE VERBETES — derivada do último erro
       ──────────────────────────────────────────────────────────── */
    const currentRound: Ex6Round | null = useMemo(() => {
      if (step === 'round1') return session[0];
      if (step === 'round2') return session[1];
      return null;
    }, [step, session]);

    const suggestedVerbeteIds: readonly VerbeteId[] = useMemo(() => {
      if (!lastErrorStep || !currentRound) return [];
      return getSuggestedVerbetes(lastErrorStep as Ex6StepKind, currentRound.operation);
    }, [lastErrorStep, currentRound]);

    const feedbackMessage: string | null = useMemo(() => {
      if (!lastErrorStep || !currentRound) return null;
      return getFeedbackMessage(lastErrorStep as Ex6StepKind, currentRound.operation);
    }, [lastErrorStep, currentRound]);

    const initialVerbeteId: VerbeteId | undefined = suggestedVerbeteIds[0];

    /* ──────────────────────────────────────────────────────────────
       RENDERIZAÇÃO
       ──────────────────────────────────────────────────────────── */

    const HelpButton = () => (
      <div className="flex justify-end w-full">
        <Button
          style="secondary"
          size="extra-small"
          icon={<BookOpen />}
          onClick={() => setStudyMenuOpen(true)}
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
            <Button style="primary" size="medium" onClick={() => setStep('round1')}>
              Começar revisão
            </Button>
          </div>
        )}

        {/* ─── RODADA 1 ─── */}
        {step === 'round1' && (
          <div className="flex flex-col gap-y-xxs">
            <div className="flex justify-between items-center gap-x-micro flex-wrap">
              <h3 className="ds-heading-large text-brand-otimath-darker">
                Rodada 1 de 2 — {session[0].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}
              </h3>
              <HelpButton />
            </div>
            <FeedbackBanner />
            <TwoDicesGameSingleShot
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
            <Button style="primary" size="medium" onClick={() => { setLastErrorStep(null); setStep('round2'); }}>
              Começar Rodada 2
            </Button>
          </div>
        )}

        {/* ─── RODADA 2 ─── */}
        {step === 'round2' && (
          <div className="flex flex-col gap-y-xxs">
            <div className="flex justify-between items-center gap-x-micro flex-wrap">
              <h3 className="ds-heading-large text-brand-otimath-darker">
                Rodada 2 de 2 — {session[1].operation === 'Union' ? 'União (∪)' : 'Interseção (∩)'}
              </h3>
              <HelpButton />
            </div>
            <FeedbackBanner />
            <TwoDicesGameSingleShot
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
              paragraph={`<p class="ds-body">Os conceitos centrais — <strong>espaço amostral 6×6 equiprovável</strong>, <strong>eventos compostos</strong> por união e interseção, e <strong>cálculo de P(D) = n(D)/36</strong> — foram exercitados.</p><p class="ds-body">Resumo:</p><ul class="ds-body" style="text-align:left; max-width:560px; margin: 0 auto; padding-left: 24px;"><li>Rodada 1 (${session[0].operation === 'Union' ? 'União' : 'Interseção'}): ${round1Outcome.errorsCount === 0 ? 'sem erros' : `${round1Outcome.errorsCount} ${round1Outcome.errorsCount === 1 ? 'erro' : 'erros'} antes do acerto`}.</li><li>Rodada 2 (${session[1].operation === 'Union' ? 'União' : 'Interseção'}): ${round2Outcome.errorsCount === 0 ? 'sem erros' : `${round2Outcome.errorsCount} ${round2Outcome.errorsCount === 1 ? 'erro' : 'erros'} antes do acerto`}.</li></ul><p class="ds-body">Você pode <strong>finalizar o OVA agora</strong> ou seguir para os <strong>Exercícios de Fixação (opcionais)</strong> — uma rodada livre do jogo completo dos dois dados, com 12 eventos sorteados em 7 desafios. Use a fixação para consolidar o que aprendeu antes de fechar.</p>`}
              maxWidthParagraph="max-w-[700px]"
              centralize={true}
            />
            <div className="flex gap-x-micro flex-wrap justify-center">
              <Button style="borderless" size="small" onClick={() => setStudyMenuOpen(true)}>
                Revisar conceitos
              </Button>
              {onRequestFreePlay && (
                <Button style="secondary" size="small" onClick={onRequestFreePlay}>
                  Exercícios de Fixação — Continuar praticando (Opcional)
                </Button>
              )}
              <Button style="primary" size="medium" onClick={onFinished}>
                Finalizar OVA
              </Button>
            </div>
          </div>
        )}

        {/* ─── MENU DE REVISÃO (sempre montado, controlado por estado) ─── */}
        <StudyMenu
          open={studyMenuOpen}
          onClose={() => setStudyMenuOpen(false)}
          suggestedVerbeteIds={suggestedVerbeteIds}
          initialVerbeteId={initialVerbeteId}
        />
      </div>
    );
  },
);
