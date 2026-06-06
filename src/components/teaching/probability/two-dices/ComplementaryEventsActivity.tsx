'use client';

/* ═══════════════════════════════════════════════════════════════
   ComplementaryEventsActivity — seção "Probabilidade de Eventos
   Complementares" do OVA Dois Dados.

   ARQUITETURA ESPELHA TwoDicesGame.tsx (layout 2 colunas, tabela
   + formulation, responsividade e UX idênticas).

   Adicionais pedagógicos (R0 obrigatório):
     • Passo 1 — hipótese registrada (SEM validação)
     • Passo strategyReview — confronto com a hipótese
     • Passo formalization — derivação de P(Ā) = 1 − P(A)

   Em R≥2 (treino): pula para marking → probabilities.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { Alerts } from '@/components/global/Alerts';
import { Modal } from '@/components/global/Modal';
import { TextBlock } from '@/components/global/TextBlock';
import { RefreshCw, Check, X, ArrowRight, Repeat2, BookOpen } from 'lucide-react';
import { TwoDicesTable } from './TwoDicesTable';
import { TwoDicesFormulation } from './TwoDicesFormulation';
import { ComplementaryReviewModal } from './shared/ComplementaryReviewModal';
import { BarA, BAR_A_CSS } from './shared/BarA';
import { useComplementaryEventsHooks } from '@/hooks/teaching/probability/two-dices/useComplementaryEventsHooks';

const COMPLEMENT_LABEL = 'Ā';
const A_LABEL = 'A';
const COLOR_COMPLEMENT = '#FF6A00';   // laranja queimado — Ā
const COLOR_A_MARK = '#0050FF';       // azul royal — A (marcação automática)

interface ComplementaryEventsActivityProps {
  onContinue: () => void;
  /** Notifica o pai (TwoDicesExperiment) quando a sub-fase muda — usado
   *  para o cenaId DEV refletir cada transição interna como snapshot. */
  onPhaseChange?: (phaseId: string) => void;
}

// Handle exposto ao painel DEV para avançar pelas sub-fases internas
// (strategyChoice → marking → reveal → strategyReview → ... → complete).
export interface ComplementaryEventsActivityHandle {
  getCurrentPhaseId: () => string;
  advance: () => void;
}

export const ComplementaryEventsActivity = forwardRef<
  ComplementaryEventsActivityHandle,
  ComplementaryEventsActivityProps
>(function ComplementaryEventsActivity({ onContinue, onPhaseChange }, ref) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const h = useComplementaryEventsHooks({ onContinue });

  // Computa o phaseId composto (inclui formStep durante a formalização) e
  // notifica o pai a cada mudança. Sem isso, o pai mantém scene7ExperimentPhase
  // em 'complementaryEvents' o tempo todo e o painel DEV não captura snapshots
  // das sub-fases internas — o contador não anda mesmo a seta funcionando.
  const composedPhaseId =
    h.subPhase === 'formalization' ? `formalization|step=${h.formStep}` : h.subPhase;
  useEffect(() => {
    onPhaseChange?.(composedPhaseId);
  }, [composedPhaseId, onPhaseChange]);

  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => composedPhaseId,
    advance: () => h.devAdvance(),
  }), [composedPhaseId, h]);

  // ─── Cores e rótulos customizados passados aos componentes ───
  const eventColors: Record<string, string> = {
    [A_LABEL]: COLOR_A_MARK,
    [COMPLEMENT_LABEL]: COLOR_COMPLEMENT,
  };
  const eventLabels: Record<string, React.ReactNode> = {
    [A_LABEL]: <span style={{ color: COLOR_A_MARK, fontWeight: 700 }}>A</span>,
    [COMPLEMENT_LABEL]: <BarA color={COLOR_COMPLEMENT} bold thickness={3} />,
  };

  // blinkLabel: durante reveal, segue a sequência Ā → A.
  const blinkLabel: string | null =
    h.revealPhase === 'blinkingRed' ? COMPLEMENT_LABEL
    : h.revealPhase === 'blinkingGreen' ? A_LABEL
    : null;

  // hideIfUnchecked: durante marking, NÃO oculta nada (aluno precisa ver Ā
  // em todas as células para poder marcar). A partir de reveal, oculta as
  // células unchecked para que cada uma mostre APENAS o evento ao qual
  // pertence (Ā XOR A — materializa a complementaridade mutuamente exclusiva).
  const hideIfUnchecked: string[] | undefined =
    h.subPhase === 'marking' ? undefined : [A_LABEL, COMPLEMENT_LABEL];

  // NOTA: removido o visibilityMask pós-Conferir em marking. Ocultar as
  // células não-Ā entregava a resposta (aluno completava pelas células que
  // restavam). Em marking, o aluno vê SEMPRE todas as 36 células com
  // placeholder Ā — a complementaridade só é revelada na sub-fase reveal,
  // após acertar tudo.

  // ─── Card do Passo 1 — strategyChoice ────────────────────────
  function renderStrategyCard() {
    if (h.subPhase !== 'strategyChoice') return null;
    const choice = h.strategyChoice;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: '2px solid transparent',
        }}
      >
        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Qual caminho será mais rápido?
        </p>
        <div className="flex flex-col gap-micro">
          <label className="flex items-center gap-micro cursor-pointer p-micro">
            <input
              type="radio"
              name="comp-strategy"
              checked={choice === A_LABEL}
              onChange={() => h.setStrategyChoice(A_LABEL)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">
              Marcar diretamente os casos favoráveis ao evento <strong>A</strong>.
            </span>
          </label>
          <label className="flex items-center gap-micro cursor-pointer p-micro">
            <input
              type="radio"
              name="comp-strategy"
              checked={choice === COMPLEMENT_LABEL}
              onChange={() => h.setStrategyChoice(COMPLEMENT_LABEL)}
              style={{ width: 18, height: 18, accentColor: COLOR_COMPLEMENT }}
            />
            <span className="ds-body">
              Marcar os casos favoráveis ao evento complementar de A{' '}
              (<BarA color={COLOR_COMPLEMENT} bold thickness={3} />).
            </span>
          </label>
        </div>
      </section>
    );
  }

  // ─── Card do Passo strategyReview — confronto ────────────────
  function renderStrategyReviewCard() {
    if (h.subPhase !== 'strategyReview') return null;
    const choice = h.strategyChoice;
    const reviewed = h.reviewChoice;
    const chooseLabel = choice === A_LABEL
      ? 'evento A (marcar os casos favoráveis ao evento A)'
      : 'complementar Ā (marcar os casos favoráveis ao complementar)';
    const chooseColor = choice === COMPLEMENT_LABEL ? COLOR_COMPLEMENT : 'var(--color-brand-otimath-pure)';
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: h.reviewError ? '2px solid var(--color-feedback-error-dark)' : '2px solid transparent',
        }}
      >
        {/* Escolha congelada */}
        <div className="mb-micro p-micro rounded-md" style={{ background: 'var(--color-neutral-white)', border: '1px solid var(--color-neutral-lighter)' }}>
          <p className="ds-caption-bold mb-nano text-neutral-dark">
            Sua escolha inicial foi:
          </p>
          <p className="ds-body" style={{ color: chooseColor, fontWeight: 700 }}>
            {chooseLabel}
          </p>
        </div>

        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Com o que você observou, você mantém ou muda sua escolha?
        </p>
        {/* Após o Conferir, h.confrontMessage é preenchida e a resposta
            do aluno fica congelada — sem isso, ele podia alternar entre
            "mantenho/mudo" depois do confronto e a UI ficava incoerente
            com a mensagem exibida. */}
        <div className="flex flex-col gap-micro">
          <label
            className="flex items-center gap-micro p-micro"
            style={{
              cursor: h.confrontMessage ? 'not-allowed' : 'pointer',
              opacity: h.confrontMessage && reviewed !== 'keep' ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="comp-review"
              checked={reviewed === 'keep'}
              disabled={!!h.confrontMessage}
              onChange={() => h.setReviewChoice('keep')}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">Mantenho minha escolha.</span>
          </label>
          <label
            className="flex items-center gap-micro p-micro"
            style={{
              cursor: h.confrontMessage ? 'not-allowed' : 'pointer',
              opacity: h.confrontMessage && reviewed !== 'change' ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="comp-review"
              checked={reviewed === 'change'}
              disabled={!!h.confrontMessage}
              onChange={() => h.setReviewChoice('change')}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">Mudo minha escolha.</span>
          </label>
        </div>

        {/* Mensagem de confronto após Conferir */}
        {h.confrontMessage && (
          <div
            className="mt-micro p-micro rounded-md"
            style={{
              background: 'var(--color-feedback-success-lighter)',
              borderLeft: '4px solid var(--color-feedback-success-dark)',
            }}
          >
            <p
              className="ds-body"
              style={{ color: 'var(--color-feedback-success-darkest)' }}
              dangerouslySetInnerHTML={{ __html: h.confrontMessage }}
            />
          </div>
        )}
      </section>
    );
  }

  // ─── Card do Passo formalization — 3 microetapas ─────────────
  function renderFormalizationCard() {
    if (h.subPhase !== 'formalization') return null;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: '2px solid transparent',
        }}
      >
        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Vamos formalizar a relação entre P(A) e P(Ā)
        </p>

        {/* Step 0 — Identificar a união */}
        <div className="mb-micro p-micro rounded-md bg-neutral-white">
          <p className="ds-body mb-nano">
            Sendo <strong>S</strong> o espaço amostral do experimento e os eventos <strong>A</strong> e{' '}
            <strong>Ā</strong>, então:
          </p>
          {/* `A ∪ Ā =` + select agrupados em flex-nowrap interno —
              o pai (`flex-wrap`) só permite quebra ENTRE pares, nunca
              dentro de uma equação. */}
          <div className="flex items-center gap-micro flex-wrap">
            <div className="flex flex-nowrap items-center gap-x-nano">
              <span className="ds-body-bold whitespace-nowrap">A ∪ Ā =</span>
              <select
                value={h.formStep0Value}
                onChange={e => h.setFormStep0Value(e.target.value)}
                disabled={h.formStep > 0}
              style={{
                padding: '6px 10px',
                fontSize: '1rem',
                fontWeight: 700,
                border: h.formStep0Error
                  ? '2px solid var(--color-feedback-error-dark)'
                  : '2px solid var(--color-neutral-lighter)',
                borderRadius: 6,
                background: h.formStep > 0 ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
                color: h.formStep > 0 ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-darkest)',
                minWidth: 70,
              }}
            >
                <option value="">?</option>
                <option value="S">S</option>
                <option value="A">A</option>
                <option value="Ā">Ā</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 1 — P(A) + P(Ā) = P(S) = ? */}
        {h.formStep >= 1 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Então <strong className="whitespace-nowrap">P(A) + P(Ā) = P(S)</strong>. Logo:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) + P(Ā) =</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={h.formStep1Value}
                  onChange={e => h.setFormStep1Value(e.target.value)}
                  disabled={h.formStep > 1}
                  placeholder="?"
                  style={{
                    width: 60,
                    padding: '6px 10px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: h.formStep1Error
                      ? '2px solid var(--color-feedback-error-dark)'
                      : '2px solid var(--color-neutral-lighter)',
                    borderRadius: 6,
                    background: h.formStep > 1 ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
                    color: h.formStep > 1 ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-darkest)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Substitua 1 por 36/36. A fórmula explicita P(A) (a resposta
             do problema) em função de P(Ā) que já foi calculado no passo anterior. */}
        {h.formStep >= 2 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Temos <strong className="whitespace-nowrap">P(A) = 1 − P(Ā)</strong>. Substitua <strong>1</strong> pela fração equivalente
              com denominador igual ao tamanho do espaço amostral:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep2Value}
                    onChange={e => h.setFormStep2Value(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 2}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep2Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 2 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 2 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep2DenValue}
                    onChange={e => h.setFormStep2DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 2}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep2Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 2 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 2 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
                <span className="ds-body-bold whitespace-nowrap">− P(<BarA color="#FF6A00" bold thickness={3} />)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Substituir P(Ā) pelo valor calculado anteriormente. */}
        {h.formStep >= 3 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Substitua <strong className="whitespace-nowrap">P(<BarA color="#FF6A00" bold thickness={3} />)</strong>{' '}
              pelo valor que você calculou:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                {/* Fração 36/36 com barra HORIZONTAL (não "/"). */}
                <div className="flex flex-col items-center">
                  <span style={{ fontSize: '1rem', fontWeight: 700, padding: '4px 8px', minWidth: 40, textAlign: 'center' }}>36</span>
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <span style={{ fontSize: '1rem', fontWeight: 700, padding: '4px 8px', minWidth: 40, textAlign: 'center' }}>36</span>
                </div>
                <span className="ds-body-bold">−</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep3NumValue}
                    onChange={e => h.setFormStep3NumValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 3}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep3Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 3 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 3 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep3DenValue}
                    onChange={e => h.setFormStep3DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 3}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep3Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 3 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 3 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Resultado da subtração: P(A) = nA/36 (ou equivalente).
             Step 5 (quando formStep >= 5): adiciona "= [fração irredutível]"
             na MESMA linha. Após validar Step 5, também anexa "= decimal = percent". */}
        {h.formStep >= 4 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">Calcule o resultado da subtração:</p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                {/* Primeira fração: resultado direto (nA/36 ou equivalente). */}
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep4NumValue}
                    onChange={e => h.setFormStep4NumValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 4}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep4Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 4 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 4 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep4DenValue}
                    onChange={e => h.setFormStep4DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 4}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep4Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 4 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 4 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Step 5: forma irredutível. Aparece com "=" quando desbloqueado. */}
              {h.formStep >= 5 && (
                <>
                  <span className="ds-body-bold">=</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={h.formStep5NumValue}
                      onChange={e => h.setFormStep5NumValue(e.target.value.replace(/\D/g, ''))}
                      disabled={h.formStep5Validated}
                      placeholder="?"
                      style={{
                        width: 50,
                        padding: '4px 8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: h.formStep5Error
                          ? '2px solid var(--color-feedback-error-dark)'
                          : '2px solid var(--color-neutral-lighter)',
                        borderRadius: 4,
                        color: h.formStep5Validated ? 'var(--color-feedback-success-dark)' : undefined,
                        background: h.formStep5Validated ? 'var(--color-neutral-lightest)' : undefined,
                      }}
                    />
                    <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={h.formStep5DenValue}
                      onChange={e => h.setFormStep5DenValue(e.target.value.replace(/\D/g, ''))}
                      disabled={h.formStep5Validated}
                      placeholder="?"
                      style={{
                        width: 50,
                        padding: '4px 8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: h.formStep5Error
                          ? '2px solid var(--color-feedback-error-dark)'
                          : '2px solid var(--color-neutral-lighter)',
                        borderRadius: 4,
                        color: h.formStep5Validated ? 'var(--color-feedback-success-dark)' : undefined,
                        background: h.formStep5Validated ? 'var(--color-neutral-lightest)' : undefined,
                      }}
                    />
                  </div>
                </>
              )}

              {/* Após validar a forma irredutível, exibe decimal e percentagem automaticamente. */}
              {h.formStep5Validated && (
                <>
                  <span className="ds-body-bold text-feedback-success-dark">
                    = {h.formStep5Decimal}
                  </span>
                  <span className="ds-body-bold text-feedback-success-dark">
                    = {h.formStep5Percent}
                  </span>
                </>
              )}
            </div>
            {h.formStep === 5 && !h.formStep5Validated && (
              <p className="ds-caption text-neutral-dark mt-nano italic">
                Escreva na forma irredutível: numerador e denominador sem divisores comuns.
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  // ─── Card de síntese ao final da rodada ──────────────────────
  function renderSynthesisCard() {
    if (h.subPhase !== 'complete' || !h.data) return null;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-feedback-success-lighter)',
          borderLeft: '4px solid var(--color-feedback-success-dark)',
        }}
      >
        <p className="ds-body-bold mb-micro" style={{ color: 'var(--color-feedback-success-darkest)' }}>
          Síntese — heurística do complementar
        </p>
        <p className="ds-body text-neutral-darkest mb-micro">
          Marcar diretamente o evento A exigiria <strong>{h.data.nA} células</strong>. Calcular pelo
          complementar precisou apenas de <strong>{h.data.nE}</strong>.
        </p>
        <p className="ds-body text-neutral-darkest">
          Quando um evento tem <strong>muitos casos favoráveis</strong>, a estratégia <span className="whitespace-nowrap">P(A) = 1 − P(Ā)</span>{' '}
          <strong>economiza trabalho</strong>.
        </p>
      </section>
    );
  }

  // ─── Botões de progressão (após a rodada) ────────────────────
  function renderProgressionButtons() {
    if (h.subPhase !== 'complete') return null;
    const hasNext = !h.disabledNextStepButton;
    const hasTrain = !h.disabledTrainAgainButton;
    const hasContinue = !h.disabledContinueButton;
    if (!hasNext && !hasTrain && !hasContinue) return null;
    return (
      <div className="flex gap-xxxs items-center justify-center flex-wrap">
        {hasNext && (
          <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={h.goToNextStepOnClick}>
            Próximo Desafio
          </Button>
        )}
        {hasTrain && (
          <Button style="secondary" size="small" icon={<Repeat2 aria-hidden="true" />} onClick={h.trainAgainOnClick}>
            Treinar novamente
          </Button>
        )}
        {hasContinue && (
          <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={h.continueOnClick}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  // ─── Label do botão Conferir conforme sub-fase ──────────────
  const checkButtonLabel = h.subPhase === 'strategyChoice' ? 'Continuar' : 'Conferir';

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // Sub-fases que NÃO mostram a tabela (só painéis próprios)
  const hideTable = h.subPhase === 'strategyChoice';

  return (
    <div className="flex flex-col gap-y-xxs" id="complementary-events">
      {/* CSS global para a classe .ova-bar-a usada em strings HTML (instruções/confronto). */}
      <style>{BAR_A_CSS}</style>

      {/* Título + botão Revisão */}
      <div className="flex items-center justify-between flex-wrap gap-micro">
        <div>
          <p className="ds-overline text-brand-otimath-pure">
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
          icon={<BookOpen aria-hidden="true" />}
          onClick={() => setReviewOpen(true)}
        >
          Revisão
        </Button>
      </div>

      {/* Instruções */}
      <TextBlock
        paragraph={h.instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      />

      {/* Card de estratégia (Passo 1) */}
      {renderStrategyCard()}

      {/* Layout principal — mostra tabela + formulation nas sub-fases que
           operam sobre o espaço amostral (marking, reveal, strategyReview,
           formalization, probabilities, complete). */}
      {!hideTable && (
        <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
          <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start lg:min-w-[760px]">
            <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
              <Button
                style="secondary"
                size="small"
                icon={<RefreshCw aria-hidden="true" />}
                onClick={h.resetGameOnClick}
              >
                Novo
              </Button>
              <Button
                style="borderless"
                size="extra-small"
                icon={<X aria-hidden="true" />}
                onClick={h.dicesChecksClearOnClick}
                disabled={h.disabledClearButton}
              >
                Limpar
              </Button>
            </div>

            <TwoDicesTable
              eventsCheckboxes={h.eventsCheckboxes ?? {}}
              updateEventsCheckboxes={h.updateEventsCheckboxes}
              eventColors={eventColors}
              eventLabels={eventLabels}
              blinkLabel={blinkLabel}
              hideIfUnchecked={hideIfUnchecked}
            />

            {/* Cards específicos de sub-fases (ficam entre tabela e Conferir) */}
            {renderStrategyReviewCard()}
            {renderFormalizationCard()}
            {renderSynthesisCard()}

            <div className="flex gap-xxxs items-center">
              {h.subPhase !== 'complete' && h.subPhase !== 'reveal' && (
                <Button
                  style="secondary"
                  size="small"
                  icon={h.subPhase === 'strategyReview' && h.confrontMessage ? <ArrowRight aria-hidden="true" /> : <Check aria-hidden="true" />}
                  onClick={h.checkOnClick}
                  disabled={h.disabledCheckButton}
                >
                  {h.subPhase === 'strategyReview' && h.confrontMessage
                    ? 'Entendi, continuar'
                    : 'Conferir'}
                </Button>
              )}
              {renderProgressionButtons()}
            </div>
          </div>

          <TwoDicesFormulation
            events={h.activeEvents}
            textsInputs={h.probabilitiesTextInputs}
            selectInputs={h.operationSelectInputs}
            eventColors={eventColors}
            eventLabels={eventLabels}
          />

        </div>
      )}

      {/* Strategy choice — sem tabela, só botão Continuar */}
      {hideTable && (
        <div className="flex justify-center mt-micro">
          <Button
            style="primary"
            size="small"
            icon={<ArrowRight aria-hidden="true" />}
            onClick={h.checkOnClick}
          >
            {checkButtonLabel}
          </Button>
        </div>
      )}

      {/* Alerts e Modal montados UMA ÚNICA VEZ no topo do componente.
          Antes ficavam dentro dos blocos {hideTable && ...} e {!hideTable && ...},
          o que desmontava o Modal quando o subPhase mudava de 'marking' para
          'strategyChoice' (após o aluno confirmar "Reiniciar seção"). O
          transitionend handler do close não chegava a disparar, então o
          updateModal({status:'hide'}) nunca rodava — e o Modal recém-montado
          no outro bloco abria de novo com status='show'. */}
      <Alerts alerts={h.alerts} updateAlert={h.updateAlert} deleteAlerts={h.deleteAlerts} />
      <Modal modal={h.modal} updateModal={h.updateModal} />

      {/* Modal de Revisão */}
      <ComplementaryReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
});
ComplementaryEventsActivity.displayName = 'ComplementaryEventsActivity';
