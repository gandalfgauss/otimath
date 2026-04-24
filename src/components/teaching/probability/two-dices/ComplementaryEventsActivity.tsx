'use client';

/* ═══════════════════════════════════════════════════════════════
   ComplementaryEventsActivity — seção "Probabilidade de Eventos
   Complementares" do OVA Dois Dados.

   Estrutura visual espelhada em TwoDicesGame.tsx (mesmo layout de
   2 colunas: tabela à esquerda, painel lateral à direita), mas com:
     • Botão "Revisão" abaixo do título — abre modal com as 3
       definições resgatadas do OVA Disco.
     • Marcação em vermelho para Ā e auto-preenchimento em verde
       para A após validação correta.
     • Animação reveal em 2 piscadas sequenciais (vermelho → verde)
       materializando Ω = A ⊔ Ā.
     • Botões de progressão específicos: Próxima rodada (R0→R1),
       Treinar novamente + Continuar (R≥1).

   Toda a lógica orquestrada por useComplementaryEventsHooks.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/global/Button';
import { Alerts } from '@/components/global/Alerts';
import { Modal } from '@/components/global/Modal';
import { TextBlock } from '@/components/global/TextBlock';
import { TextInput } from '@/components/global/TextInput';
import { BookOpen, RefreshCw, X, Check, ArrowRight, Repeat2 } from 'lucide-react';
import { ComplementaryReviewModal } from './shared/ComplementaryReviewModal';
import { MarkingTable } from './shared/MarkingTable';
import { MarkMatrix, createEmptyMatrix } from './shared/eventPair';
import {
  useComplementaryEventsHooks,
  EventCheckboxes,
} from '@/hooks/teaching/probability/two-dices/useComplementaryEventsHooks';

// ─── Constantes ─────────────────────────────────────────────────

const COMPLEMENT_LABEL = 'Ā';
const A_LABEL = 'A';
const COLOR_COMPLEMENT = 'var(--color-feedback-error-dark)';
const COLOR_A = 'var(--color-feedback-success-dark)';

// ─── Helpers ────────────────────────────────────────────────────

function checkboxesToMatrix(
  ec: EventCheckboxes | undefined,
  label: string,
): MarkMatrix | null {
  const layer = ec?.[label];
  if (!layer) return null;
  return layer.map(row => row.map(cell => !!cell.checked));
}

// ─── Props ──────────────────────────────────────────────────────

interface ComplementaryEventsActivityProps {
  /** Chamado quando o aluno clica "Continuar" — avança para unionTheory. */
  onContinue: () => void;
}

// ════════════════════════════════════════════════════════════════

export function ComplementaryEventsActivity({ onContinue }: ComplementaryEventsActivityProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const h = useComplementaryEventsHooks({ onContinue });

  // ─── Conversão de EventCheckboxes para MarkMatrix ─────────────
  const compMatrix: MarkMatrix = useMemo(
    () => checkboxesToMatrix(h.eventsCheckboxes, COMPLEMENT_LABEL) ?? createEmptyMatrix(),
    [h.eventsCheckboxes],
  );
  const aMatrix: MarkMatrix | null = useMemo(
    () => checkboxesToMatrix(h.eventsCheckboxes, A_LABEL),
    [h.eventsCheckboxes],
  );

  // ─── Determina o que passar à MarkingTable por sub-fase ───────
  const tableProps = useMemo(() => {
    // markingComplement: camada ativa = Ā (vermelho, clicável)
    if (h.subPhase === 'markingComplement') {
      return {
        marks: compMatrix,
        onToggle: (row: number, col: number) => {
          const current = h.eventsCheckboxes[COMPLEMENT_LABEL]?.[row]?.[col]?.checked ?? false;
          h.updateEventsCheckboxes(COMPLEMENT_LABEL, row + 1, col + 1, !current, false);
        },
        eventLabel: COMPLEMENT_LABEL,
        readOnlyMarks: undefined,
        blinkLabel: null,
      };
    }
    // revealing, fillN, fillProbabilities, roundComplete: ambas camadas readOnly
    if (['revealing', 'fillN', 'fillProbabilities', 'roundComplete'].includes(h.subPhase) && aMatrix) {
      // Determina qual camada pisca no revealing
      let blinkLabel: string | null = null;
      if (h.revealPhase === 'blinkingRed') blinkLabel = COMPLEMENT_LABEL;
      else if (h.revealPhase === 'blinkingGreen') blinkLabel = A_LABEL;

      // Durante fillingGreen, A ainda não deve aparecer (mostra apenas Ā)
      const showA = h.revealPhase !== 'fillingGreen';

      const readOnlyMarks = [
        { label: COMPLEMENT_LABEL, matrix: compMatrix, color: COLOR_COMPLEMENT },
        ...(showA ? [{ label: A_LABEL, matrix: aMatrix, color: COLOR_A }] : []),
      ];
      return {
        marks: createEmptyMatrix(),
        onToggle: () => {},
        eventLabel: null,
        readOnlyMarks,
        blinkLabel,
      };
    }
    // strategyChoice ou fallback: não mostra tabela
    return null;
  }, [h.subPhase, h.revealPhase, h.eventsCheckboxes, compMatrix, aMatrix, h.updateEventsCheckboxes]);

  // ─── Render de cada sub-fase ──────────────────────────────────

  function renderStrategyChoicePanel() {
    if (!h.data || h.subPhase !== 'strategyChoice') return null;
    const strategyError = h.strategyError;
    const choice = h.strategyChoice;
    return (
      <section
        className="rounded-md p-xxs"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: strategyError ? '2px solid var(--color-feedback-error-dark)' : '2px solid transparent',
        }}
      >
        <p className="ds-body-bold mb-micro" style={{ color: 'var(--color-brand-otimath-darkest)' }}>
          Qual cálculo será mais rápido?
        </p>
        <div className="flex flex-col gap-micro">
          <label className="flex items-center gap-micro cursor-pointer" style={{ padding: 8 }}>
            <input
              type="radio"
              name="strategy"
              checked={choice === A_LABEL}
              onChange={() => h.setStrategyChoice(A_LABEL)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">
              Marcar diretamente o evento <strong>A</strong> (muitos casos favoráveis).
            </span>
          </label>
          <label className="flex items-center gap-micro cursor-pointer" style={{ padding: 8 }}>
            <input
              type="radio"
              name="strategy"
              checked={choice === COMPLEMENT_LABEL}
              onChange={() => h.setStrategyChoice(COMPLEMENT_LABEL)}
              style={{ width: 18, height: 18, accentColor: COLOR_COMPLEMENT }}
            />
            <span className="ds-body">
              Marcar o complementar <strong style={{ color: COLOR_COMPLEMENT }}>Ā</strong> (poucos casos) e usar P(A) = 1 − P(Ā).
            </span>
          </label>
        </div>
      </section>
    );
  }

  function renderEventDescriptionCard() {
    if (!h.data) return null;
    return (
      <section
        className="rounded-md p-xxs"
        style={{
          background: 'var(--color-neutral-white)',
          border: '1px solid var(--color-neutral-lighter)',
        }}
      >
        <p className="ds-caption-bold mb-nano" style={{ color: 'var(--color-brand-otimath-pure)' }}>
          Evento A
        </p>
        <p className="ds-body text-neutral-darkest">
          <strong>A:</strong> {h.data.eventA.description}
        </p>
        {h.subPhase !== 'strategyChoice' && (
          <>
            <p className="ds-caption-bold mt-micro mb-nano" style={{ color: COLOR_COMPLEMENT }}>
              Evento Ā (complementar)
            </p>
            <p className="ds-body text-neutral-darkest">
              <strong style={{ color: COLOR_COMPLEMENT }}>Ā:</strong>{' '}
              {h.data.eventComplement.description}
            </p>
          </>
        )}
      </section>
    );
  }

  function renderFillNPanel() {
    if (h.subPhase !== 'fillN' && h.subPhase !== 'fillProbabilities' && h.subPhase !== 'roundComplete') {
      return null;
    }
    return (
      <section
        className="rounded-md p-xxs"
        style={{
          background: 'var(--color-neutral-lightest)',
          border: '1px solid var(--color-neutral-lighter)',
        }}
      >
        <p className="ds-caption-bold mb-micro" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          Contagem do complementar
        </p>
        <div className="flex items-center gap-micro">
          <span className="ds-body-bold">n(Ā) =</span>
          <div style={{ width: 80 }}>
            <TextInput
              textInput={{
                ...h.nEInput,
                placeholder: '?',
                type: 'natural-number',
              }}
            />
          </div>
        </div>
      </section>
    );
  }

  function renderProbabilitiesPanel() {
    if (h.subPhase !== 'fillProbabilities' && h.subPhase !== 'roundComplete') return null;
    const p = h.probabilities;
    return (
      <section
        className="rounded-md p-xxs"
        style={{
          background: 'var(--color-neutral-lightest)',
          border: '1px solid var(--color-neutral-lighter)',
        }}
      >
        <p className="ds-caption-bold mb-micro" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          Cálculo das probabilidades
        </p>
        <div className="flex flex-col gap-micro">
          {/* P(Ā) */}
          <div className="flex items-center gap-micro">
            <span className="ds-body-bold" style={{ color: COLOR_COMPLEMENT }}>P(Ā) =</span>
            <div className="flex flex-col items-center">
              <div style={{ width: 60 }}>
                <TextInput
                  textInput={{
                    ...p.pComplementNumerator,
                    placeholder: '?',
                    type: 'natural-number',
                  }}
                />
              </div>
              <div style={{ width: 60, height: 2, background: 'var(--color-neutral-dark)' }} />
              <div style={{ width: 60 }}>
                <TextInput textInput={{ ...p.pComplementDenominator, readonly: true }} />
              </div>
            </div>
          </div>
          {/* P(A) = 1 − P(Ā) */}
          <div className="flex items-center gap-micro flex-wrap">
            <span className="ds-body-bold" style={{ color: COLOR_A }}>P(A) =</span>
            <span className="ds-body-bold">1 − P(Ā) =</span>
            <div className="flex flex-col items-center">
              <div style={{ width: 60 }}>
                <TextInput
                  textInput={{
                    ...p.pANumerator,
                    placeholder: '?',
                    type: 'natural-number',
                  }}
                />
              </div>
              <div style={{ width: 60, height: 2, background: 'var(--color-neutral-dark)' }} />
              <div style={{ width: 60 }}>
                <TextInput textInput={{ ...p.pADenominator, readonly: true }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderSynthesisCard() {
    if (h.subPhase !== 'roundComplete' || !h.data) return null;
    return (
      <section
        className="rounded-md p-xxs"
        style={{
          background: 'var(--color-feedback-success-lighter)',
          borderLeft: '4px solid var(--color-feedback-success-dark)',
        }}
      >
        <p className="ds-body-bold mb-micro" style={{ color: 'var(--color-feedback-success-darkest)' }}>
          Síntese — heurística do complementar
        </p>
        <p className="ds-body text-neutral-darkest mb-micro">
          Marcar diretamente o evento A exigiria <strong>{h.data.nA} células</strong>.
          Calcular pelo complementar precisou apenas de <strong>{h.data.nE}</strong>.
        </p>
        <p className="ds-body text-neutral-darkest">
          Quando um evento tem <strong>muitos casos favoráveis</strong>, a estratégia
          P(A) = 1 − P(Ā) <strong>economiza trabalho</strong>.
        </p>
      </section>
    );
  }

  function renderMainButtons() {
    return (
      <div className="flex items-center gap-micro flex-wrap justify-center">
        <Button
          style="secondary"
          size="small"
          icon={<X />}
          onClick={h.clearOnClick}
          disabled={h.disabledClearButton}
        >
          Limpar
        </Button>
        <Button
          style="primary"
          size="small"
          icon={<Check />}
          onClick={h.checkOnClick}
          disabled={h.disabledCheckButton}
        >
          Conferir
        </Button>
      </div>
    );
  }

  function renderProgressionButtons() {
    if (h.subPhase !== 'roundComplete') return null;
    return (
      <div className="flex items-center gap-micro flex-wrap justify-center mt-micro">
        {!h.disabledNextRoundButton && (
          <Button
            style="primary"
            size="small"
            icon={<ArrowRight />}
            onClick={h.nextRoundOnClick}
          >
            Próxima rodada
          </Button>
        )}
        {!h.disabledTrainAgainButton && (
          <Button
            style="secondary"
            size="small"
            icon={<Repeat2 />}
            onClick={h.trainAgainOnClick}
          >
            Treinar novamente
          </Button>
        )}
        {!h.disabledContinueButton && (
          <Button
            style="primary"
            size="small"
            icon={<ArrowRight />}
            onClick={h.continueOnClick}
          >
            Continuar
          </Button>
        )}
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-y-xxs" id="complementary-events">
      {/* Título + botão Revisão */}
      <div className="flex items-center justify-between flex-wrap gap-micro">
        <div>
          <p className="ds-overline" style={{ color: 'var(--color-brand-otimath-pure)' }}>
            Entre evento simples e união
          </p>
          <h2
            className="ds-heading-large"
            style={{ color: 'var(--color-brand-otimath-darkest)', margin: 0 }}
          >
            Eventos Complementares
          </h2>
        </div>
        <Button
          style="secondary"
          size="small"
          icon={<BookOpen />}
          onClick={() => setReviewOpen(true)}
        >
          Revisão
        </Button>
      </div>

      {/* Instruções dinâmicas */}
      <TextBlock
        paragraph={h.instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      />

      {/* Layout 2 colunas */}
      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        {/* Coluna esquerda — Tabela + botões principais */}
        <div className="w-full flex flex-col gap-y-xxs items-center">
          {tableProps && (
            <MarkingTable
              marks={tableProps.marks}
              onToggle={tableProps.onToggle}
              eventLabel={tableProps.eventLabel}
              readOnlyMarks={tableProps.readOnlyMarks}
              blinkLabel={tableProps.blinkLabel}
            />
          )}
          {h.subPhase !== 'revealing' && renderMainButtons()}
          {renderProgressionButtons()}
        </div>

        {/* Coluna direita — Painel lateral */}
        <div className="w-full flex flex-col gap-xxs max-lg:max-w-[438px] max-lg:items-stretch max-lg:self-center">
          {renderEventDescriptionCard()}
          {renderStrategyChoicePanel()}
          {renderFillNPanel()}
          {renderProbabilitiesPanel()}
          {renderSynthesisCard()}
        </div>
      </div>

      {/* Modal de Revisão + overlays globais */}
      <ComplementaryReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
      <Alerts alerts={h.alerts} updateAlert={h.updateAlert} deleteAlerts={h.deleteAlerts} />
      <Modal modal={h.modal} updateModal={h.updateModal} />
    </div>
  );
}
