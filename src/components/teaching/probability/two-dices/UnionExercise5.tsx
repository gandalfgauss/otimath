'use client';

/* ═══════════════════════════════════════════════════════════════
   UnionExercise5 — Exercício 5 da trilha opcional.

   CONTEXTO: tabela de contingência social (♂/♀ × Time1/Time2)
   herdada do OVA Probabilidade Roxa (Flash legado), modernizada.

   OBJETIVO: calcular P(A ∪ B) ou P(A ∩ B) sobre eventos
   apresentados em registro tabular cruzado — registro semiótico
   inédito na sequência didática.

   ESTRUTURA DE CADA RODADA:
     intro             → apresentação dos times + tabela com totais em branco
     fillTotals        → aluno preenche os 5 totais (validação tri-estado)
     enunciadoView     → mostra a pergunta + 2 dicas escalonadas
     spiralAlternatives→ overlay com 5 alternativas em espiral
     result            → gol (acerto) OU dica + retry (erro)
     conditionalGlimpse→ só na rodada 2 (gancho à condicional)
     roundFinished     → botões: próxima / continuar estudando / finalizar

   ROUNDS:
     0 (1ª obrigatória): interseção (e ≥ 1 do tipo de pergunta)
     1 (2ª obrigatória): mutuamente exclusivos (e = 0)
     2+: opcional, alternando categorias

   PEDAGOGIA DO FEEDBACK:
     • Botão "Preciso de uma dica" — até 2 dicas (geral → específica)
     • Após 2 dicas: botão "Não sei realmente!" → ReasoningPlaybackPanel

   ARQUITETURA: espelha forwardRef + Handle + STEP_SEQUENCE do Ex4.
   ═══════════════════════════════════════════════════════════════ */

import React, {
  useState, useCallback, useMemo, useRef, useEffect,
  forwardRef, useImperativeHandle,
} from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import { useTelemetryExercise, useReadingTelemetry } from '@/hooks/teaching/probability/useTelemetry';
import {
  selectExercise5Data, type Exercise5Data, reduceFraction, fractionsEquivalent,
} from './shared/exercise5Data';
import {
  ContingencyTable, validateTotals, allTotalsCorrect,
  EMPTY_TOTALS, type TotalsState, type TotalsValidation,
} from './shared/ContingencyTable';
import { TeamsVersusHeader } from './shared/TeamShield';
import { SpiralAlternatives, type AlternativeOption } from './shared/SpiralAlternatives';
import { GoalAnimation } from './shared/GoalAnimation';
import {
  ReasoningPlaybackPanel, type ReasoningLine,
} from './shared/ReasoningPlaybackPanel';
import {
  DraggableCalculator, CalculatorToggleButton,
} from './shared/DraggableCalculator';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

type Step =
  | 'intro'
  | 'fillTotals'
  | 'enunciadoView'
  | 'spiralOpen'
  | 'goalAnim'
  | 'wrongFeedback'
  | 'reasoningPlayback'
  | 'conditionalGlimpse'
  | 'roundFinished';

interface UnionExercise5Props {
  onFinished: () => void;
  onRequestPreviousPhase?: () => void;
  initialStep?: Step;
  /** Toast alert do OVA (propagado pelo TwoDicesExperiment). */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number) => void;
}

export interface UnionExercise5Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

// Sequência completa que o DEV percorre — inclui todos os Steps do fluxo
// natural (intro → fillTotals → enunciadoView → spiralOpen → goalAnim →
// reasoningPlayback → conditionalGlimpse[rd1] → roundFinished). Sem
// listar todos, o advance() caía em onFinished() e pulava a 2ª rodada.
const STEP_SEQUENCE: Step[] = [
  'intro',
  'fillTotals',
  'enunciadoView',
  'spiralOpen',
  'goalAnim',
  'reasoningPlayback',
  'conditionalGlimpse',
  'roundFinished',
];

// ═══════════════════════════════════════════════════════════════
// HELPERS — formatação de fração
// ═══════════════════════════════════════════════════════════════

function fmtDecimal(num: number, den: number, digits = 3): string {
  if (den === 0) return '—';
  return (num / den).toFixed(digits).replace('.', ',');
}

function fmtPercent(num: number, den: number, digits = 1): string {
  if (den === 0) return '—';
  return `${((num / den) * 100).toFixed(digits).replace('.', ',')}%`;
}

function fmtFracDisplay(num: number, den: number): string {
  return `${num}/${den}`;
}

// ═══════════════════════════════════════════════════════════════
// DICAS ESCALONADAS — geral → específica
// ═══════════════════════════════════════════════════════════════

function buildHints(data: Exercise5Data): { general: string; specific: string } {
  if (data.questionType === 'union') {
    return {
      general:
        `Releia o enunciado: a pergunta usa "OU". Pense em duas categorias diferentes — você precisa contar pessoas que pertencem a pelo menos uma delas. Há alguma pessoa que pertence às DUAS categorias ao mesmo tempo? O que isso implica sobre a forma de contar?`,
      specific:
        `Use a fórmula geral P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Identifique:\n• n(A) = ${data.nA} pessoas (${data.descA})\n• n(B) = ${data.nB} pessoas (${data.descB})\n• n(A ∩ B) = ${data.nAB} pessoas (que satisfazem AS DUAS condições)\n• Total geral = ${data.tg}\nMonte: P(A ∪ B) = (${data.nA} + ${data.nB} − ${data.nAB}) / ${data.tg}.`,
    };
  }
  if (data.questionType === 'union_excl') {
    return {
      general:
        `Os dois eventos pedidos podem ocorrer simultaneamente? Uma pessoa pode torcer pelos dois times ao mesmo tempo? Quando A ∩ B = ∅, o que acontece com a fórmula geral da união?`,
      specific:
        `Como A ∩ B = ∅ (nenhuma pessoa torce pelos dois times), a fórmula reduz-se a P(A ∪ B) = P(A) + P(B). Identifique:\n• n(A) = ${data.nA} (${data.descA})\n• n(B) = ${data.nB} (${data.descB})\n• Total geral = ${data.tg}\nMonte: P(A ∪ B) = (${data.nA} + ${data.nB}) / ${data.tg}.`,
    };
  }
  return {
    general:
      `A pergunta usa "E" — pede pessoas que satisfazem AS DUAS condições simultaneamente. Localize na tabela a célula correspondente. O denominador é o total geral S.`,
    specific:
      `Identifique a célula da interseção: pessoas que ${data.descA} E ${data.descB} são n(A ∩ B) = ${data.nAB}. O total é ${data.tg}.\nMonte: P(A ∩ B) = ${data.nAB} / ${data.tg}.`,
  };
}

function buildReasoningLines(data: Exercise5Data): ReasoningLine[] {
  const target = data.targetLabel;
  const ans = data.answerNum;
  const den = data.answerDen;

  if (data.questionType === 'union') {
    return [
      { content: <>Identificamos os dois eventos: <strong>A</strong> = {data.descA} e <strong>B</strong> = {data.descB}.</> },
      { content: <>Lendo a tabela: n(A) = {data.nA}, n(B) = {data.nB}, <span className="whitespace-nowrap">n(A ∩ B)</span> = {data.nAB}, total geral = {data.tg}.</> },
      { content: <>Como há sobreposição, aplicamos a fórmula geral: <span className="whitespace-nowrap">P(A ∪ B)</span> = <span className="whitespace-nowrap">P(A)</span> + <span className="whitespace-nowrap">P(B)</span> − <span className="whitespace-nowrap">P(A ∩ B)</span>.</> },
      { content: <>Substituindo: <span className="whitespace-nowrap">P(A ∪ B)</span> =({data.nA} + {data.nB} − {data.nAB}) / {data.tg} = {ans}/{den}.</> },
      {
        emphasis: true,
        content: <><strong>Resposta final:</strong> {target} = {ans}/{den} ≈ {fmtDecimal(ans, den, 3)} ≈ {fmtPercent(ans, den, 1)}.</>,
      },
    ];
  }
  if (data.questionType === 'union_excl') {
    return [
      { content: <>Identificamos: <strong>A</strong> = {data.descA} e <strong>B</strong> = {data.descB}.</> },
      { content: <>Os eventos são mutuamente exclusivos: <strong className="whitespace-nowrap">A ∩ B = ∅</strong> (ninguém torce pelos dois times ao mesmo tempo).</> },
      { content: <>A fórmula geral reduz-se a <span className="whitespace-nowrap">P(A ∪ B) = P(A) + P(B)</span>, pois <span className="whitespace-nowrap">P(A ∩ B) = 0</span>.</> },
      { content: <>Lendo a tabela: n(A) = {data.nA}, n(B) = {data.nB}, total geral = {data.tg}.</> },
      { content: <>Substituindo: <span className="whitespace-nowrap">P(A ∪ B)</span> =({data.nA} + {data.nB}) / {data.tg} = {ans}/{den}.</> },
      {
        emphasis: true,
        content: <><strong>Resposta:</strong> {target} = {ans}/{den} ≈ {fmtDecimal(ans, den, 3)} ≈ {fmtPercent(ans, den, 1)}. Note que a fórmula geral <em>contém</em> este caso particular.</>,
      },
    ];
  }
  return [
    { content: <>A pergunta pede a interseção: <strong>A</strong> = {data.descA} e <strong>B</strong> = {data.descB}.</> },
    { content: <>Localizamos na tabela a célula correspondente: <span className="whitespace-nowrap">n(A ∩ B)</span> = {data.nAB}.</> },
    { content: <>Aplicamos Laplace direto: <span className="whitespace-nowrap">P(A ∩ B)</span> = <span className="whitespace-nowrap">n(A ∩ B)</span> / n(S) = {data.nAB} / {data.tg}.</> },
    {
      emphasis: true,
      content: <><strong>Resposta:</strong> {target} = {ans}/{den} ≈ {fmtDecimal(ans, den, 3)} ≈ {fmtPercent(ans, den, 1)}.</>,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const UnionExercise5 = forwardRef<UnionExercise5Handle, UnionExercise5Props>(
  function UnionExercise5({ onFinished, onRequestPreviousPhase, initialStep, createAlert }, ref) {
    const [step, setStep] = useState<Step>(initialStep ?? 'intro');
    useTelemetryExercise(
      `twoDices-cena7-unionExercise5-${step}`,
      'Exercício 5 — Pesquisa em campo (tabela de contingência)',
      'Aluno calcula P(A∪B) ou P(A∩B) lendo uma tabela de contingência (eventos não-exclusivos OU exclusivos).',
    );
    // Telemetria — leitura do enunciado do Ex.5.
    const confirmReadIntro = useReadingTelemetry(
      step === 'intro',
      'twoDices-cena7-unionExercise5-intro',
      'Leitura — Enunciado do Exercício 5 (torcedores no estádio, tabela de contingência)',
      'Painel inicial — contexto da pesquisa + instrução pra calcular os 5 totais da tabela.',
      'confirmou leitura do enunciado e clicou em "Começar"',
    );
    const [round, setRound] = useState(0);
    const [data, setData] = useState<Exercise5Data>(() => selectExercise5Data(0));

    // Estado dos totais editáveis
    const [totals, setTotals] = useState<TotalsState>(EMPTY_TOTALS);
    const [validation, setValidation] = useState<TotalsValidation>({});
    const [totalsLocked, setTotalsLocked] = useState(false);

    // Sistema de dicas escalonadas
    const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
    const [showNoIdeaButton, setShowNoIdeaButton] = useState(false);

    // Tentativas no spiral (para liberar Não sei realmente)
    const [wrongAttempts, setWrongAttempts] = useState(0);

    // Calculadora flutuante (arrastável + redimensionável)
    const [calcOpen, setCalcOpen] = useState(false);
    // Ref ao container da tabela — bounds da calculadora (não pode sair daqui)
    const tableBoundsRef = useRef<HTMLDivElement>(null);

    // Fecha a calculadora a cada transição de step. Antes ela ficava aberta
    // depois que o aluno avançava de tela e o botão CalculatorToggleButton
    // só está em 2 panels (fillTotals e enunciadoView) — quando ia pra
    // spiralOpen / goalAnim / roundFinished, a calculadora flutuava sobre
    // o conteúdo SEM o botão visível pra fechá-la.
    useEffect(() => {
      setCalcOpen(false);
    }, [step]);

    // Embaralhamento das alternativas
    const alternatives = useMemo<AlternativeOption[]>(() => {
      const correct: AlternativeOption = {
        id: 'correct',
        display: fmtDecimal(data.answerNum, data.answerDen, 2),
        ariaLabel: `${fmtFracDisplay(data.answerNum, data.answerDen)}, aproximadamente ${fmtDecimal(data.answerNum, data.answerDen, 3)}`,
      };
      const distractors: AlternativeOption[] = data.distractors.map((d, i) => ({
        id: `d${i}`,
        display: fmtDecimal(d.num, d.den, 2),
        ariaLabel: `Alternativa ${i + 1}: ${fmtFracDisplay(d.num, d.den)}, aproximadamente ${fmtDecimal(d.num, d.den, 3)}`,
      }));
      const all = [correct, ...distractors];
      // Embaralha (Fisher-Yates) com seed determinística por id da rodada
      const seed = data.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      let s = seed;
      const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all;
    }, [data]);

    // ── Navegação dev ────────────────────────────────────────────
    // Fluxo natural por rodada:
    //   intro → fillTotals → enunciadoView → spiralOpen → goalAnim
    //          → [conditionalGlimpse SE round===1] → roundFinished
    // Em 'roundFinished':
    //   • round===0 → próxima rodada (reseta tudo, volta para 'intro')
    //   • round===1 → onFinished() (sai do exercício)
    const advanceStep = useCallback(() => {
      playSound('/sounds/nextChallenge.mp3');
      switch (step) {
        case 'intro':           setStep('fillTotals'); return;
        case 'fillTotals':      setStep('enunciadoView'); return;
        case 'enunciadoView':   setStep('spiralOpen'); return;
        case 'wrongFeedback':   setStep('enunciadoView'); return;
        case 'spiralOpen':      setStep('goalAnim'); return;
        case 'goalAnim':
          // round 1: passa pelo glimpse condicional; outras rodadas pulam.
          setStep(round === 1 ? 'conditionalGlimpse' : 'roundFinished');
          return;
        case 'reasoningPlayback':
          // Caminho do "Não tenho ideia" — depois também encerra a rodada.
          setStep(round === 1 ? 'conditionalGlimpse' : 'roundFinished');
          return;
        case 'conditionalGlimpse':
          setStep('roundFinished');
          return;
        case 'roundFinished':
          if (round < 1) {
            // Próxima rodada obrigatória — reseta como advanceToNextRound.
            const nextRound = round + 1;
            setRound(nextRound);
            setData(selectExercise5Data(nextRound));
            setTotals(EMPTY_TOTALS);
            setValidation({});
            setTotalsLocked(false);
            setHintLevel(0);
            setShowNoIdeaButton(false);
            setWrongAttempts(0);
            setCalcOpen(false);
            setStep('intro');
            return;
          }
          onFinished();
          return;
      }
    }, [step, round, onFinished]);

    const backStep = useCallback(() => {
      const idx = STEP_SEQUENCE.indexOf(step);
      if (idx > 0) {
        playSound('/sounds/clear.mp3');
        setStep(STEP_SEQUENCE[idx - 1]);
        return;
      }
      if (onRequestPreviousPhase) {
        playSound('/sounds/clear.mp3');
        onRequestPreviousPhase();
      }
    }, [step, onRequestPreviousPhase]);

    useImperativeHandle(ref, () => ({
      advance: advanceStep,
      back: backStep,
      canAdvance: () => true,
      canBack: () => step !== 'intro' || !!onRequestPreviousPhase,
    }), [advanceStep, backStep, step, onRequestPreviousPhase]);

    // Rola pro topo do OVA em todo Conferir. Mirror do checkAnswer do Disco.
    const scrollDiceToTop = () => {
      requestAnimationFrame(() => {
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    // ── Handlers ─────────────────────────────────────────────────
    const onValidateTotals = useCallback(() => {
      scrollDiceToTop();
      const v = validateTotals(data, totals);
      setValidation(v);
      if (allTotalsCorrect(v)) {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Totais da tabela de contingência conferidos.', 'success', 3500);
        setTotalsLocked(true);
        setStep('enunciadoView');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Some as linhas e colunas — algum total não confere.', 'error', 4500);
      }
    }, [data, totals, createAlert]);

    const onResponderClick = useCallback(() => {
      scrollDiceToTop();
      setStep('spiralOpen');
    }, []);

    const onSpiralSubmit = useCallback((selectedId: string) => {
      scrollDiceToTop();
      if (selectedId === 'correct') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Resposta certa — siga para o gol!', 'success', 3500);
        setStep('goalAnim');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Releia o enunciado e reconsidere as alternativas.', 'error', 4500);
        setWrongAttempts(w => {
          const next = w + 1;
          if (next >= 1 && hintLevel === 0) setHintLevel(1);
          else if (next >= 2 && hintLevel === 1) setHintLevel(2);
          if (next >= 3) setShowNoIdeaButton(true);
          return next;
        });
        setStep('wrongFeedback');
      }
    }, [hintLevel, createAlert]);

    const onSpiralCancel = useCallback(() => {
      setStep('enunciadoView');
    }, []);

    const onGoalFinished = useCallback(() => {
      // Após gol: rodada 2 (round=1) ganha conditionalGlimpse; outras vão direto para roundFinished.
      // Som + alert de celebração ao chegar em roundFinished (idêntico ao padrão
      // dos outros exercícios Ex1/Ex2/Ex3/Ex4 ao concluir).
      if (round === 1) {
        setStep('conditionalGlimpse');
      } else {
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Parabéns!', 'Você finalizou esta rodada com sucesso!', 'success', 4500);
        setStep('roundFinished');
      }
    }, [round, createAlert]);

    const onRequestHint = useCallback(() => {
      if (hintLevel === 0) setHintLevel(1);
      else if (hintLevel === 1) setHintLevel(2);
      else setShowNoIdeaButton(true);
      playSound('/sounds/clear.mp3');
    }, [hintLevel]);

    const onNoIdea = useCallback(() => {
      setStep('reasoningPlayback');
    }, []);

    const advanceToNextRound = useCallback(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      setData(selectExercise5Data(nextRound));
      setTotals(EMPTY_TOTALS);
      setValidation({});
      setTotalsLocked(false);
      setHintLevel(0);
      setShowNoIdeaButton(false);
      setWrongAttempts(0);
      setCalcOpen(false);
      setStep('intro');
      scrollDiceToTop();
    }, [round]);

    const finishExercise = useCallback(() => {
      scrollDiceToTop();
      onFinished();
    }, [onFinished]);

    const hints = useMemo(() => buildHints(data), [data]);
    const reasoningLines = useMemo(() => buildReasoningLines(data), [data]);

    // ── Renderização ─────────────────────────────────────────────

    const isMandatory = round <= 1;
    const reduced = reduceFraction(data.answerNum, data.answerDen);
    void fractionsEquivalent; // disponibiliza para uso eventual em testes externos

    return (
      <div
        style={{
          width: '100%',
          maxWidth: 'min(96vw, 1100px)',
          margin: '0 auto',
          padding: 'clamp(8px, 2vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2vw, 20px)',
        }}
      >
        {/* Cabeçalho ── título centralizado + indicador de rodada abaixo */}
        <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-micro">
          Exercício 5 — Pesquisa em campo (tabela de contingência)
        </h2>
        <div className="flex justify-center">
          <RoundIndicator round={round} />
        </div>

        {/* Cenografia: dois escudos + X (sempre visíveis) */}
        <TeamsVersusHeader team1={data.team1} team2={data.team2} size={88} />

        {/* Conteúdo principal por step ─────────────────────────── */}
        {step === 'intro' && (
          <IntroPanel
            data={data}
            isMandatory={isMandatory}
            roundLabel={round === 0 ? 'primeira rodada' : round === 1 ? 'segunda rodada' : `rodada ${round + 1}`}
            onContinue={() => { confirmReadIntro(); setStep('fillTotals'); scrollDiceToTop(); }}
          />
        )}

        {step === 'fillTotals' && (
          <FillTotalsPanel
            data={data}
            totals={totals}
            setTotals={setTotals}
            validation={validation}
            locked={totalsLocked}
            onValidate={onValidateTotals}
            tableBoundsRef={tableBoundsRef}
            calcOpen={calcOpen}
            onToggleCalc={() => setCalcOpen(o => !o)}
          />
        )}

        {(step === 'enunciadoView' || step === 'wrongFeedback') && (
          <StatementPanel
            data={data}
            totals={totals}
            validation={validation}
            hintLevel={hintLevel}
            hints={hints}
            wrongAttempts={wrongAttempts}
            showNoIdeaButton={showNoIdeaButton}
            onResponderClick={onResponderClick}
            onRequestHint={onRequestHint}
            onNoIdea={onNoIdea}
            tableBoundsRef={tableBoundsRef}
            calcOpen={calcOpen}
            onToggleCalc={() => setCalcOpen(o => !o)}
          />
        )}

        {step === 'reasoningPlayback' && (
          <div>
            <ReasoningPlaybackPanel
              title="Resolução completa"
              lines={reasoningLines}
              onFinish={() => {
                // Mesmo padrão de celebração das outras vias de finalizar rodada.
                playSound('/sounds/challengeFinished.mp3');
                createAlert?.('Parabéns!', 'Você finalizou esta rodada com sucesso!', 'success', 4500);
                setStep('roundFinished');
              }}
              finishLabel="Entendi — concluir rodada"
            />
          </div>
        )}

        {step === 'conditionalGlimpse' && (
          <ConditionalGlimpsePanel
            data={data}
            onContinue={() => {
              // Som + alert de celebração ao chegar em roundFinished — mesmo
              // padrão do onGoalFinished (rodadas que não passam pelo glimpse).
              playSound('/sounds/challengeFinished.mp3');
              createAlert?.('Parabéns!', 'Você finalizou esta rodada com sucesso!', 'success', 4500);
              setStep('roundFinished');
              scrollDiceToTop();
            }}
          />
        )}

        {step === 'roundFinished' && (
          <RoundFinishedPanel
            round={round}
            data={data}
            answerNum={reduced.n}
            answerDen={reduced.d}
            answerFraction={fmtFracDisplay(data.answerNum, data.answerDen)}
            answerDecimal={fmtDecimal(data.answerNum, data.answerDen, 3)}
            answerPercent={fmtPercent(data.answerNum, data.answerDen, 1)}
            onNextMandatory={advanceToNextRound}
            onContinueStudying={advanceToNextRound}
            onFinish={finishExercise}
          />
        )}

        {/* Overlays ─────────────────────────────────────────────── */}
        <SpiralAlternatives
          open={step === 'spiralOpen'}
          team1={data.team1}
          team2={data.team2}
          question={data.statement}
          alternatives={alternatives}
          correctId="correct"
          onSubmit={onSpiralSubmit}
          onCancel={onSpiralCancel}
        />

        <GoalAnimation
          open={step === 'goalAnim'}
          subtitle={`${data.targetLabel} = ${fmtFracDisplay(data.answerNum, data.answerDen)} ≈ ${fmtPercent(data.answerNum, data.answerDen, 1)}`}
          onFinished={onGoalFinished}
        />

        {/* Overlay da calculadora — SEM boundsRef pra permitir arrastar
            por toda a viewport. Antes ficava restrita aos limites do
            container da tabela (tableBoundsRef), no mobile isso fazia ela
            tampar os valores da tabela sem deixar o aluno arrastá-la pra
            uma área neutra. Botão de abrir continua INLINE nos painéis. */}
        <DraggableCalculator
          open={calcOpen}
          onClose={() => setCalcOpen(false)}
        />
      </div>
    );
  },
);

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES DE UI
// ═══════════════════════════════════════════════════════════════

/** Símbolo ♂ ou ♀ inline no texto, em preto, traço grosso e
 *  alinhamento vertical perfeito dentro dos parênteses. */
function SexSymbol({ s }: { s: 'm' | 'f' }) {
  return (
    <span
      aria-label={s === 'm' ? 'masculino' : 'feminino'}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.18em',
        fontSize: '1.35em',
        lineHeight: 1,
        fontWeight: 900,
        color: '#000000',
        WebkitTextStroke: '1.2px #000000',
        margin: '0 1px',
      }}
    >
      {s === 'm' ? '♂' : '♀'}
    </span>
  );
}

function RoundIndicator({ round }: { round: number }) {
  const totalMandatory = 2;
  const dots = [];
  for (let i = 0; i < totalMandatory; i++) {
    const filled = i <= round;
    dots.push(
      <span
        key={i}
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 14, height: 14,
          borderRadius: '50%',
          background: filled
            ? 'var(--color-brand-otimath-pure)'
            : 'var(--color-neutral-light)',
          transition: 'background 200ms ease',
        }}
      />,
    );
  }
  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      aria-label={`Rodada ${round + 1} de ${Math.max(round + 1, totalMandatory)}`}
    >
      {dots}
      <span className="ds-small-bold" style={{ color: 'var(--color-brand-otimath-darker)' }}>
        {round < totalMandatory
          ? `Rodada ${round + 1} de ${totalMandatory}`
          : `Rodada extra ${round - totalMandatory + 1}`}
      </span>
    </div>
  );
}

function IntroPanel({
  data, isMandatory, roundLabel, onContinue,
}: {
  data: Exercise5Data;
  isMandatory: boolean;
  roundLabel: string;
  onContinue: () => void;
}) {
  return (
    <section
      style={{
        background: 'var(--color-brand-otimath-lightest)',
        padding: 'clamp(12px, 3vw, 24px)',
        borderRadius: 12,
        border: '2px solid var(--color-brand-otimath-light)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <p className="ds-body-large m-0 text-neutral-darkest">
        Você está na <strong>{roundLabel}</strong>. Imagine que uma pesquisa
        entrevistou torcedores presentes no estádio durante o jogo
        <strong> {data.team1.name} × {data.team2.name}</strong>. A tabela apresentada
        mostra quantos torcedores de cada time são do <strong>sexo masculino</strong> (<SexSymbol s="m" />)
        {' '}e do <strong>sexo feminino</strong> (<SexSymbol s="f" />).
      </p>
      <p className="ds-body m-0 text-neutral-darkest">
        Antes de calcular qualquer probabilidade, você precisa
        <strong> calcular os 5 totais</strong> da tabela (margens das linhas,
        margens das colunas e total geral). A calculadora está disponível
        no canto da tela.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <Button onClick={onContinue} size="medium" style="primary">
          Começar {isMandatory ? '' : '(rodada extra)'}
        </Button>
      </div>
    </section>
  );
}

function FillTotalsPanel({
  data, totals, setTotals, validation, locked, onValidate,
  tableBoundsRef, calcOpen, onToggleCalc,
}: {
  data: Exercise5Data;
  totals: TotalsState;
  setTotals: (t: TotalsState) => void;
  validation: TotalsValidation;
  locked: boolean;
  onValidate: () => void;
  tableBoundsRef: React.RefObject<HTMLDivElement | null>;
  calcOpen: boolean;
  onToggleCalc: () => void;
}) {
  const filled = (['t1','t2','th','tm','tg'] as const).every(k => totals[k].trim() !== '');
  return (
    <section
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: 'clamp(8px, 2vw, 16px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div
          className="ds-body-bold"
          style={{ color: 'var(--color-brand-otimath-darker)' }}
        >
          Etapa 1 — Preencha as 5 margens (totais) da tabela.
        </div>
        <CalculatorToggleButton open={calcOpen} onToggle={onToggleCalc} />
      </div>
      <div ref={tableBoundsRef} className="relative">
        <ContingencyTable
          data={data}
          totals={totals}
          setTotals={setTotals}
          validation={validation}
          locked={locked}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button onClick={onValidate} disabled={!filled} size="medium" style="primary">
          Verificar totais
        </Button>
      </div>
    </section>
  );
}

function StatementPanel({
  data, totals, validation, hintLevel, hints, wrongAttempts, showNoIdeaButton,
  onResponderClick, onRequestHint, onNoIdea,
  tableBoundsRef, calcOpen, onToggleCalc,
}: {
  data: Exercise5Data;
  totals: TotalsState;
  validation: TotalsValidation;
  hintLevel: 0 | 1 | 2;
  hints: { general: string; specific: string };
  wrongAttempts: number;
  showNoIdeaButton: boolean;
  onResponderClick: () => void;
  onRequestHint: () => void;
  onNoIdea: () => void;
  tableBoundsRef: React.RefObject<HTMLDivElement | null>;
  calcOpen: boolean;
  onToggleCalc: () => void;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex justify-end">
        <CalculatorToggleButton open={calcOpen} onToggle={onToggleCalc} />
      </div>
      <div ref={tableBoundsRef} className="relative">
        <ContingencyTable
          data={data}
          totals={totals}
          setTotals={() => { /* noop */ }}
          validation={validation}
          locked
        />
      </div>

      <div
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          padding: 'clamp(12px, 3vw, 20px)',
          borderRadius: 12,
          border: '2px solid var(--color-brand-otimath-pure)',
        }}
      >
        <p
          className="ds-body-large m-0 text-neutral-darkest"
        >
          {data.statement}
        </p>
      </div>

      {/* Dicas escalonadas */}
      {hintLevel >= 1 && (
        <aside
          aria-live="polite"
          style={{
            background: 'var(--color-feedback-warning-lighter, #fff8e1)',
            border: '2px solid var(--color-feedback-warning-dark, #f9a825)',
            padding: 'clamp(10px, 2vw, 16px)',
            borderRadius: 10,
          }}
        >
          <p className="ds-small-bold" style={{ margin: '0 0 6px 0', color: 'var(--color-feedback-warning-darkest, #6d4c00)' }}>
            💡 Dica {hintLevel === 1 ? '1' : '2'}:
          </p>
          <p
            className="ds-body"
            style={{ margin: 0, color: 'var(--color-neutral-darkest)', whiteSpace: 'pre-line' }}
          >
            {hintLevel === 1 ? hints.general : hints.specific}
          </p>
        </aside>
      )}

      {wrongAttempts > 0 && (
        <p
          aria-live="polite"
          className="ds-small"
          style={{ color: 'var(--color-feedback-error-darkest)', margin: 0 }}
        >
          {wrongAttempts === 1
            ? 'Não foi dessa vez. Tente refletir sobre a dica e clique em Responder novamente.'
            : 'Continue tentando — leia a dica específica e revise os passos.'}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {hintLevel < 2 && (
          <Button onClick={onRequestHint} size="medium" style="secondary">
            {hintLevel === 0 ? 'Preciso de uma dica' : 'Mais uma dica'}
          </Button>
        )}
        {showNoIdeaButton && (
          <Button onClick={onNoIdea} size="medium" style="borderless">
            Não sei realmente — ver resolução
          </Button>
        )}
        <Button onClick={onResponderClick} size="medium" style="primary">
          Responder
        </Button>
      </div>
    </section>
  );
}

function ConditionalGlimpsePanel({
  data, onContinue,
}: {
  data: Exercise5Data;
  onContinue: () => void;
}) {
  // Apresenta P(B|A) = n(A∩B)/n(A) usando os dados da rodada (no caso exclusivo
  // o gancho é mais rico se mostrarmos a célula H1 ou M1). Para simplicidade,
  // calculamos P(♂ | Time1) sobre a tabela atual (sempre disponível).
  const cellAB = data.H1; // homens do Time1
  const totalA = data.t1; // total do Time1
  return (
    <section
      style={{
        background: 'var(--color-brand-otimath-lightest)',
        padding: 'clamp(12px, 3vw, 24px)',
        borderRadius: 12,
        border: '2px dashed var(--color-brand-otimath-dark)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <h3
        className="ds-heading-large"
        style={{ margin: 0, color: 'var(--color-brand-otimath-darkest)' }}
      >
        🔮 Antecipação — uma nova pergunta sobre a mesma tabela
      </h3>
      <p className="ds-body m-0 text-neutral-darkest">
        Suponha que sabemos que a pessoa entrevistada
        <strong> torce pelo {data.team1.name}</strong> (já restringimos o
        espaço amostral à linha do Time1, que tem {totalA} torcedores).
        Qual seria a probabilidade de essa pessoa ser do sexo masculino?
      </p>
      <p className="ds-body-bold" style={{ margin: 0, color: 'var(--color-brand-otimath-darker)' }}>
        P(♂ | {data.team1.shortName}) = {cellAB} / {totalA} ≈ {fmtPercent(cellAB, totalA, 1)}
      </p>
      <p className="ds-small" style={{ margin: 0, color: 'var(--color-neutral-dark)', fontStyle: 'italic' }}>
        Isso é a <strong>probabilidade condicional</strong> — um conceito que
        futuramente pode ser inserido na sequência didática. Por enquanto,
        observe que ele depende de restringirmos o espaço amostral.
      </p>
      <div className="flex justify-end">
        <Button onClick={onContinue} size="medium" style="primary">
          Entendi, prosseguir
        </Button>
      </div>
    </section>
  );
}

function RoundFinishedPanel({
  round, data, answerNum, answerDen, answerFraction, answerDecimal, answerPercent,
  onNextMandatory, onContinueStudying, onFinish,
}: {
  round: number;
  data: Exercise5Data;
  answerNum: number;
  answerDen: number;
  answerFraction: string;
  answerDecimal: string;
  answerPercent: string;
  onNextMandatory: () => void;
  onContinueStudying: () => void;
  onFinish: () => void;
}) {
  const isMandatoryPending = round === 0;
  void answerNum; void answerDen;
  return (
    <section
      style={{
        background: 'var(--color-feedback-success-lighter)',
        border: '2px solid var(--color-feedback-success-dark)',
        padding: 'clamp(12px, 3vw, 24px)',
        borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <h3
        className="ds-heading-large"
        style={{ margin: 0, color: 'var(--color-feedback-success-darkest)' }}
      >
        🎉 Rodada concluída!
      </h3>
      <p className="ds-body m-0 text-neutral-darkest">
        A resposta foi <strong>{data.targetLabel} = {answerFraction}</strong> ≈ {answerDecimal} ≈ {answerPercent}.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'flex-end',
          marginTop: 4,
        }}
      >
        {isMandatoryPending ? (
          <div className="flex flex-col items-end gap-y-nano w-full">
            {/* Texto descritivo separado do botão — antes vinha dentro do
                <Button> e como o componente tem whitespace-nowrap no className,
                vazava da viewport no mobile. */}
            <p className="ds-small text-neutral-dark italic">
              A próxima rodada usa eventos mutuamente exclusivos.
            </p>
            <Button onClick={onNextMandatory} size="medium" style="primary">
              Próxima rodada
            </Button>
          </div>
        ) : (
          <>
            <Button onClick={onContinueStudying} size="medium" style="secondary">
              Continuar estudando
            </Button>
            <Button onClick={onFinish} size="medium" style="primary">
              Finalizar exercício
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
