'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/global/Button";
import { RefreshCw, Play, X, ArrowRight, Check, Info, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Alerts } from "@/components/global/Alerts";
import { Modal } from "@/components/global/Modal";
import { TextBlock } from "@/components/global/TextBlock";
import { TextInput } from "@/components/global/TextInput";
import { Roulette, ROULETTE_COLORS } from "./Roulette";
import { RouletteTable } from "./RouletteTable";
import { RouletteChart } from "./RouletteChart";
import { RouletteQuestion } from "./RouletteQuestion";
import { RouletteInfoBox } from "./RouletteInfoBox";
import { useRouletteHooks } from "@/hooks/teaching/probability/roulette/useRouletteHooks";
import { playSound } from "@/hooks/global/useSound";
import { SequenceStatsCard } from "@/components/teaching/probability/SequenceStatsCard";
import { freezeOva, getSequenceStats, logOvaInteraction, setActiveOva, unfreezeOva, useSequenceTick } from "@/hooks/teaching/probability/useSequenceSession";
import { useTelemetryExercise, telemetryRecordInteracaoExercicio, useReadingTelemetry } from "@/hooks/teaching/probability/useTelemetry";
import { StudyMenu } from "@/components/teaching/probability/two-dices/shared/StudyMenu";
import { DISCO_GLOSSARY, DISCO_GROUPS } from "@/components/teaching/probability/two-dices/shared/studyMenuContent";
import { BookOpen } from "lucide-react";

// Snapshot opaco — round-trip entre getDevSnapshot/applyDevSnapshot do hook,
// usado tanto pelo painel DEV (RouletteDevNav) quanto pela gravação contínua
// no RouletteGame (que mantém o histórico vivo mesmo com modo DEV desligado).
type DevSnapshotOpaque = ReturnType<ReturnType<typeof useRouletteHooks>['getDevSnapshot']>;

function generateUnionNoteText(n: number) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, n);
  const numerals: Record<number, string> = { 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito' };
  const exampleText = letters.join(' ou ');
  const countText = numerals[n] || `${n}`;
  const union = letters.join('∪');
  const reading = letters.join(' União ');
  const eventsList = letters.map(l => `vale quando acontece ${l}`).join(', ');
  const complement = n === 2
    ? `e também vale quando acontecem ${letters[0]} e ${letters[1]} ao mesmo tempo`
    : `e também vale quando acontecem dois deles ou vários deles, inclusive os ${countText}, ao mesmo tempo`;
  return { exampleText, countText, union, reading, eventsList, complement };
}

interface RouletteGameProps {
  /** Callback opcional disparado quando o aluno conclui a Etapa 3 e clica
   *  em "Continuar" no card-ponte para o próximo OVA. Quando definido,
   *  substitui o link estático para `/ensino/probabilidade/dois-dados` —
   *  útil para compor o OVA dentro de uma sequência didática mais ampla. */
  onFinished?: () => void;
  /** Modo de desenvolvimento — quando true, renderiza uma barrinha
   *  interna de navegação (próxima/anterior subStep + jump direto) usada
   *  pelo painel de DEV da sequência didática. */
  devMode?: boolean;
  /** Callback opcional disparado sempre que o progresso interno do OVA
   *  muda (fração 0..1). Usado pela sequência didática para animar a
   *  barra de progresso global. A fração é uma estimativa heurística
   *  baseada em (stage, subStep) — não precisa ser exata, só monotônica. */
  onProgressChange?: (fraction: number) => void;
  /** Sinaliza que este OVA é a cena atualmente ativa da sequência. Quando
   *  true, o OVA reivindica/libera o cronômetro próprio via
   *  `setActiveOva('roulette' | null)` em função de sua tela interna
   *  (terminal vs. não-terminal). Em devMode, todos os OVAs ficam montados
   *  simultaneamente, então sem este sinal o cronômetro ficaria preso ao
   *  último OVA mexido. */
  isActiveStage?: boolean;
}

export function RouletteGame({ onFinished, devMode = false, onProgressChange, isActiveStage = true }: Readonly<RouletteGameProps> = {}) {
  const {
    // Game state
    gameState,
    sliderValue,
    setSliderValue,
    selectedOption,
    setSelectedOption,
    currentQuestion,
    labelOfOption,

    // Inputs
    sampleSpaceInput,
    setSampleSpaceInput,
    sampleSpaceCountInput,
    setSampleSpaceCountInput,
    probabilityInputs,
    relativeFrequencyInputs,
    convergenceInputs,
    theoreticalQuestion1Input,
    theoreticalQuestion2Input,
    predictionInput,
    favorableCasesInput,
    exerciseNEInput,
    exerciseNSInput,
    exercisePENumeratorInput,
    exercisePEDenominatorInput,

    // Data
    getFrequencyData,
    getChartData,

    // Actions
    spinRoulette,
    handleSpinEnd,
    checkAnswer,
    nextStep,
    startAutoSpins,
    registerColor,
    startStage1,
    startStage2,
    startStage3,
    devSimulateAdvance,
    getDevSnapshot,
    applyDevSnapshot,
    getDevCenaId,
    toggleSectorSelection,
    restartExercise,
    restartChallenge1,

    // Info box
    showInfoBox,
    // setShowInfoBox não usado diretamente no componente
    infoBoxContent,
    handleInfoBoxConfirm,

    // Exemplos vistos (para controle de botões)
    deterministicExamplesViewed,
    randomExamplesViewed,
    handleSeeMoreDeterministicExamples,
    handleSeeMoreRandomExamples,

    // Exemplos de eventos disjuntos (subStep 6.55)
    disjointExamplesViewed,
    disjointNeedsNumbers,

    // Exercício interativo de eventos disjuntos
    disjointExercisePhase,
    disjointUserSelectA,
    disjointUserSelectB,
    handleStartDisjointExercise,
    handleDisjointSectorClick,
    handleDisjointConfirmA,
    handleDisjointConfirmB,
    handleDisjointRetry,

    // Probabilidade da União de Eventos ME (subStep 6.56)
    unionPhase,
    unionActivityNum,
    unionCurrentEventIdx,
    unionEvents,
    unionSelectedSectors,
    unionProbNumInput,
    unionProbDenInput,
    unionFinalNumInput,
    unionFinalDenInput,
    unionSectorNumbers,
    unionMaxActivities,
    unionNeedsNumbers,
    setUnionProbNumInput,
    setUnionProbDenInput,
    setUnionFinalNumInput,
    setUnionFinalDenInput,
    handleUnionSectorClick,
    handleUnionConfirmSelection,
    handleUnionConfirmProb,
    handleUnionConfirmFinal,
    handleUnionNextActivity,

    // Características do experimento aleatório (múltipla seleção)
    selectedCharacteristics,
    toggleCharacteristic,
    randomExperimentCharacteristics,

    // Fase de experimentação (3 tentativas)
    experimentationState,
    handleExperimentationBet,
    handleResultConfirmation,
    spinRouletteExperimentation,
    // Investigação inicial Etapa 2
    handleS2Bet,
    handleS2Confirmation,
    spinRouletteS2,
    handleColorPaletteSelect,
    progressiveReadingStep,

    // Control states
    instructions,
    disabledSpinButton,
    disabledCheckButton,
    disabledNextButton,
    showAutoSpinButtons,

    // Alertas e Modal
    alerts,
    updateAlert,
    deleteAlerts,
    modal,
    updateModal,

    // Eventos Complementares
    compPhase,
    compExamplesViewed,
    compCalcExampleNum,
    compUserSelectA,
    compUserSelectAbar,
    compIsGuided,
    compChainInputs, setCompChainInputs,
    compChainResult,
    compPaInput, setCompPaInput,
    compStepByStep, setCompStepByStep,
    handleCompSectorClick,
    handleCompConfirmA,
    handleCompConfirmAbar,
    handleCompRetry,
    handleStartCompExercise,
    handleCompSeeMoreExamples,

    // Frequência Absoluta (subStep 8.5)
    freqAbsQuestion,
    freqAbsInput, setFreqAbsInput,

    // Frequência Relativa conceitual (subStep 8.6)
    freqRelConceptPhase,
    handleFreqRelConceptLi,
    handleFreqRelConceptContinue,

    // Frequência Relativa verificação (subStep 9.5)
    freqRelQuestion,
    freqRelInput, setFreqRelInput,

    // Interpretação dos Resultados
    interpretationPhase,
    interpretationSelected, setInterpretationSelected,
    interpretationQ3,
    handleInterpretationCheck,
    handleInterpretationContinue,

    // Problemas de consolidação LGN (subStep 15)
    lgnPhase,
    lgnN,
    lgnParams,
    lgnInput, setLgnInput,
    lgnVerbalInput, setLgnVerbalInput,
    handleLgnWantToKnow,
    handleLgnContinue,
    handleLgnVerbalConfirm,
    diceState, diceInput, setDiceInput,
    handleDiceRoll, handleDiceAnswer,

    // Etapa 2 — Probabilidade Não Equiprovável
    s2RatioPhase,
    s2ConceptQuestion,
    s2ConceptSelected, setS2ConceptSelected,
    s2UnitSectorIndex,
    s2TableAllCorrect,
    handleRatioSectorClick,
    handleRatioTableContinue,
    s2ReasoningColorY,
    s2ReasoningAngleY,
    s2ReasoningRatio,
    s2ReasoningInput, setS2ReasoningInput,
    s2ReasoningErrors,
    s2ReasoningShowHint,
    s2IxPhase,
    s2IxSumSelected, setS2IxSumSelected,
    s2IxCalcStep,
    handleIxCalcNext,
    // Treinos
    trainingState,
    trainRatioInputs,
    trainIxInputs,
    trainSumInput,
    trainProbInputs,
    handleTrainingSectorClick,
    handleTrainingCalcNext,
    handleTrainingNext,
    handleTrainingContinue,
    // Perguntas conceituais pós-classificação
    s2RandomColors,
    // Leitura progressiva probabilidade angular
    s2AngleReadingStep,
    handleAngleReadingNext,
    // Giros reflexivos
    s2SpinReflection, setS2SpinReflection,
    handleSpinReflectionContinue,
    handleReflectionOptionChange,
    handleReflectionBetClick,
    s2RatioInputs,
    s2IxInputs,
    s2SumEquationInput,
    s2XInput,
    s2NumProbInputs,
    s2AngleProbInputs,
    s2FreqAbsInputs,
    s2FreqRelInputs,
    s2ConclusionInput,

    // Treinos de Fração θ/360
    fracTraining,
    fracThetaInputs, setFracThetaInputs,
    handleFracTrainingNext,
    handleFracTrainingChangePhase,

    // Simulação de Convergência
    convergenceSim,
    handleConvergenceBlock,

    // Etapa 3
    s3State,
    setS3State,
    handleS3ConfirmPrediction,
    handleS3SectorBet,
    handleS3ConfirmBet,
    handleS3Finalize,
    handleS3GoToReflection,
    handleS3DismissReflexao,
    spinRouletteS3,
    handleS3FallacyContinue,
    handleS3NewBetConfirm,
    handleS3FallacyFinish,

    // Log de desempenho
    downloadLog,
    getLogSummary
  } = useRouletteHooks();

  const frequencyData = getFrequencyData();
  const chartData = getChartData();

  // Verificar se deve mostrar o disco
  const shouldShowRoulette = gameState.sectors.length > 0 && gameState.showDivisions;

  // Lista única de cores presentes no disco (memoizada para evitar recriação por render)
  const uniqueColorNames = useMemo(
    () => [...new Set(gameState.sectors.map(s => s.colorName))],
    [gameState.sectors]
  );

  // Cor para destacar n/n (espaço amostral): escolher uma cor NÃO presente no disco
  const sampleSpaceColor = useMemo(() => {
    const usedNames = new Set(uniqueColorNames);
    const candidates = ['Verde', 'Laranja', 'Ciano', 'Roxo', 'Rosa', 'Vermelho', 'Azul', 'Amarelo', 'Marrom', 'Cinza'];
    const found = candidates.find(c => !usedNames.has(c));
    return found ? ROULETTE_COLORS[found] : '#2ac000';
  }, [uniqueColorNames]);

  // Verificar se deve mostrar o botão de sortear
  const shouldShowSpinButton = (gameState.subStep === 7 && gameState.stage !== 2) ||
                                gameState.subStep === 7.6 ||
                                gameState.subStep === 8 ||
                                (gameState.stage === 2 && gameState.subStep === 6.201 && s2SpinReflection.phase === 'spinning') ||
                                (gameState.stage === 2 && gameState.subStep === 6.202 && s2SpinReflection.phase === 'spinning');

  // Verificar se deve mostrar os botões de registro de cor
  const shouldShowColorRegistration = gameState.pendingRegistration && shouldShowSpinButton;

  // Estado do modal "Revisar conceitos" da tela final — mesmo
  // StudyMenu usado no OVA Dois Dados.
  const [rouletteStudyMenuOpen, setRouletteStudyMenuOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // Histórico DEV — vivo no escopo do RouletteGame para que continue
  // gravando snapshots mesmo quando o painel DEV está DESLIGADO. Sem
  // isso, a história só existia enquanto o RouletteDevNav estivesse
  // montado, então ativar o DEV depois de algumas interações dava
  // histórico vazio. Agora a captura roda sempre; o painel DEV apenas
  // expõe a UI de navegação sobre o mesmo histórico.
  // ─────────────────────────────────────────────────────────────────
  const devHistoryRef = useRef<DevSnapshotOpaque[]>([]);
  const devCursorRef = useRef<number>(-1);
  const devRestoringRef = useRef<boolean>(false);
  const [devHistoryTick, setDevHistoryTick] = useState(0);
  const devCenaId = getDevCenaId();

  useEffect(() => {
    // Restaurações disparadas pelo próprio DEV não devem empilhar snapshot
    // novo — apenas movem o cursor. O ref é resetado e a captura é pulada.
    if (devRestoringRef.current) {
      devRestoringRef.current = false;
      return;
    }
    const snap = getDevSnapshot();
    const cursor = devCursorRef.current;
    devHistoryRef.current = devHistoryRef.current.slice(0, cursor + 1);
    devHistoryRef.current.push(snap);
    devCursorRef.current = devHistoryRef.current.length - 1;
    setDevHistoryTick(c => c + 1);
    // Cada novo devCenaId = uma interação significativa do aluno (transição
    // de cena/sub-fase). Loga no log persistente do OVA para alimentar a
    // contagem de interações nos cards de estatística da sequência.
    // O `logTransition` legado só dispara em mudança de subStep — perdia
    // todas as mudanças de sub-fase (compPhase, unionPhase, freqRelPhase
    // etc.) que o devCenaId captura.
    logOvaInteraction('roulette', devCenaId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devCenaId]);

  // ─────────────────────────────────────────────────────────────────
  // Progresso interno do OVA (0..1) — reportado para a barra de
  // progresso da sequência didática. Heurístico: cada etapa ocupa uma
  // faixa fixa do OVA, e o subStep posiciona o aluno dentro da faixa.
  // Não precisa ser exato — só monotônico o suficiente para o aluno
  // perceber que está avançando.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onProgressChange) return;
    const { stage, subStep } = gameState;
    // Faixas re-balanceadas com base na CONTAGEM REAL de sub-steps únicos
    // usados em cada etapa (verificado por grep no useRouletteHooks):
    //   Stage 1: ~72 sub-steps únicos
    //   Stage 2: ~26 sub-steps únicos
    //   Stage 3: ~12 sub-steps únicos
    //   Total: ~110, proporção 65% / 24% / 11%
    //
    // A alocação anterior (55% / 27% / 18%) subestimava Stage 1 e
    // superestimava Stage 3 — quando o aluno entrava no Stage 3, a barra
    // já saltava pra 82%, sugerindo "quase terminei" mas ainda restavam
    // 12 sub-steps.
    const RANGES = {
      1: { start: 0,    end: 0.65, maxSub: 16 },  // subSteps vão de 0 a ~15.7
      2: { start: 0.65, end: 0.89, maxSub: 9.5 }, // subSteps vão até ~9.3
      3: { start: 0.89, end: 1,    maxSub: 8.5 }, // subSteps vão até ~8.3
    } as const;
    const range = RANGES[stage as 1 | 2 | 3] ?? RANGES[1];
    const within = Math.max(0, Math.min(1, subStep / range.maxSub));
    onProgressChange(range.start + within * (range.end - range.start));
  }, [gameState, onProgressChange]);

  // ─────────────────────────────────────────────────────────────────
  // Cronômetro do OVA: reivindica o cronômetro 'roulette' enquanto
  // este OVA é o estágio ativo da sequência. Em devMode todos os OVAs
  // ficam montados — `isActiveStage` evita reivindicação fantasma.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActiveStage) return;
    setActiveOva('roulette');
  }, [isActiveStage]);

  // ─────────────────────────────────────────────────────────────────
  // TELEMETRIA — captura interações EXPLORATÓRIAS (mexer no slider,
  // trocar opção em radio etc.). Cada interação real do aluno vira uma
  // entrada `interacao_exercicio` no histórico.
  //
  // ARMADILHA QUE EVITAMOS: `useEffect` dispara em CADA mudança nas
  // deps. Se incluirmos `gameState.stage`/`subStep` nas deps, qualquer
  // transição de sub-step dispara um evento falso (mesmo o aluno só
  // tendo clicado "Li." numa tela de leitura, sem tocar no input).
  //
  // FIX: change-detection EXPLÍCITA via ref. Só dispara quando o valor
  // do INPUT (sliderValue/selectedOption) realmente muda — não quando
  // sub-step ou stage mudam ao redor. Sentinel `null` no ref pra pular
  // o mount inicial (sliderValue=1 default, selectedOption='' default
  // não são interações do aluno).
  //
  // Quando o OVA desativa (isActiveStage=false), o ref é resetado pra
  // null pra que reativações + resets de sistema (startStage1 zera o
  // slider) não virem "slider: 5 → 1" espúrio.
  // ─────────────────────────────────────────────────────────────────

  // SLIDER — change-detection + debounce de 500ms (drag faz onChange
  // disparar a cada tick; debounce captura o valor "estável" depois que
  // o aluno solta).
  const prevSliderRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isActiveStage) {
      prevSliderRef.current = null;
      return;
    }
    const prev = prevSliderRef.current;
    if (prev === sliderValue) return;
    prevSliderRef.current = sliderValue;
    if (prev === null) return; // skip initial mount/reativação
    // (Não anotamos stage/subStep no texto — quem lê o JSON já tem o
    // `title`/`descricao` da seção corrente como âncora. Numeração
    // interna polui sem agregar.)
    const handle = window.setTimeout(() => {
      telemetryRecordInteracaoExercicio(
        `slider: ${prev} → ${sliderValue}`
      );
    }, 500);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValue, isActiveStage]);

  // ─── TRACKERS DE INPUTS DE TEXTO ────────────────────────────────
  // Helper genérico: cada digitação no input gera um evento
  // `interacao_exercicio` (com debounce de 800ms pra evitar 1
  // evento por tecla). O `label` identifica o input no histórico.
  //
  // FALSO POSITIVO QUE EVITAMOS: depois do acerto, o validator chama
  // `setXxxInput({value: '', ...})` pra limpar o campo. Sem cuidado, o
  // tracker via prev='2' → cur='' e agendava um setTimeout que disparava
  // `apagou "2"` 800ms depois — JÁ no NOVO subStep, criando um exercício
  // "fantasma" no novo card sem o aluno ter feito nada. Pra cortar isso,
  // resetamos `prevRef` toda vez que o `subStep` muda (o tracker re-inicia
  // sem comparar com o estado anterior). Adicionalmente, transições de
  // não-vazio→vazio são ignoradas — são quase sempre limpezas programáticas
  // e raramente uma interação intencional do aluno.
  const useTextInputTracker = (
    label: string,
    currentValue: string | undefined,
    enabled: boolean,
    subStepKey: number,
  ) => {
    const prevRef = useRef<string | null>(null);
    const prevSubStepRef = useRef<number | null>(null);
    useEffect(() => {
      if (!enabled) { prevRef.current = null; return; }
      // SubStep mudou → reset do tracker (próxima leitura conta como
      // "inicial" pro novo subStep, ignorando o que estava no input antes).
      if (prevSubStepRef.current !== subStepKey) {
        prevSubStepRef.current = subStepKey;
        prevRef.current = currentValue ?? '';
        return;
      }
      const cur = currentValue ?? '';
      const prev = prevRef.current;
      if (prev === cur) return;
      prevRef.current = cur;
      if (prev === null) return; // primeira leitura
      if (!cur && !prev) return; // ambos vazios
      if (!cur && prev) return; // não-vazio→vazio é quase sempre reset programático
      const handle = window.setTimeout(() => {
        telemetryRecordInteracaoExercicio(
          prev
            ? `${label}: "${prev}" → "${cur}"`
            : `${label}: digitou "${cur}"`,
        );
      }, 800);
      return () => window.clearTimeout(handle);
    }, [currentValue, enabled, subStepKey]);
  };
  useTextInputTracker('espaço amostral', sampleSpaceInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('n(S)', sampleSpaceCountInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('previsão', predictionInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('casos favoráveis', favorableCasesInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('n(E)', exerciseNEInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('n(S) exercício', exerciseNSInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('P(E) numerador', exercisePENumeratorInput?.value, isActiveStage, gameState.subStep);
  useTextInputTracker('P(E) denominador', exercisePEDenominatorInput?.value, isActiveStage, gameState.subStep);

  // INTERPRETATION RADIOS — cada mudança na seleção (Sim/Não/alternativa)
  // vira interacao_exercicio. Sem isso, só o Conferir gerava evento — o
  // aluno podia mudar de ideia várias vezes antes de confirmar e nada disso
  // ficava no histórico.
  const prevInterpRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isActiveStage) { prevInterpRef.current = null; return; }
    const cur = interpretationSelected;
    const prev = prevInterpRef.current;
    if (prev === cur) return;
    prevInterpRef.current = cur;
    if (prev === null) return; // mount inicial
    if (!cur) return; // reset programático
    // Resolve label legível: 'sim'/'nao' direto; em q3, o id ('correct'/'e0'/...)
    // não é informativo, então usamos o texto da alternativa se disponível.
    const q3Label = interpretationQ3?.alternatives.find(a => a.id === cur)?.text;
    const label = cur === 'sim' ? 'Sim'
                : cur === 'nao' ? 'Não'
                : q3Label?.slice(0, 140) ?? cur;
    telemetryRecordInteracaoExercicio(
      `marcou opção (Interpretação ${interpretationPhase}): "${label}"`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interpretationSelected, isActiveStage, interpretationPhase]);

  // SELECTED OPTION — change-detection sem debounce (clique em radio é
  // intencional). Ignora resets pra '' (mudança de tela do sistema).
  const prevSelectedOptionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isActiveStage) {
      prevSelectedOptionRef.current = null;
      return;
    }
    const prev = prevSelectedOptionRef.current;
    if (prev === selectedOption) return;
    prevSelectedOptionRef.current = selectedOption;
    if (prev === null) return; // skip initial mount/reativação
    if (!selectedOption) return; // reset pra '' não é interação
    // Traduz value → label legível. `currentQuestion` reflete a pergunta
    // ATUAL — se o aluno mudou de opção antes de trocar de pergunta, é a
    // mesma pergunta pra ambos os values. Em casos de race onde a pergunta
    // já mudou, labelOfOption cai pro próprio value (não quebra).
    const currentLabel = labelOfOption(selectedOption, currentQuestion);
    const prevLabel = prev ? labelOfOption(prev, currentQuestion) : prev;
    telemetryRecordInteracaoExercicio(
      prevLabel
        ? `mudou opção: "${prevLabel}" → "${currentLabel}"`
        : `selecionou opção: "${currentLabel}"`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, isActiveStage]);

  // Congela o cronômetro do OVA quando o aluno chega na tela
  // "Atividade Concluída" (Stage 3 SubStep 10). Descongela se ele
  // voltar para qualquer cena anterior via DEV.
  useEffect(() => {
    const atFinalScreen = gameState.stage === 3 && gameState.subStep === 10;
    if (atFinalScreen) freezeOva('roulette');
    else                unfreezeOva('roulette');
  }, [gameState.stage, gameState.subStep]);

  // Telemetria por etapa — cada uma das 3 etapas conta como um "contexto/seção"
  // distinto. Cada Conferir vira um EXERCÍCIO novo no JSON estruturado.
  const rouletteStageInfo: Record<number, { title: string; fallback: string }> = {
    1: { title: 'OVA do Disco — Etapa 1: Experimentação',
         fallback: 'Aluno faz giros manuais, observa frequências relativas e formula previsões.' },
    2: { title: 'OVA do Disco — Etapa 2: Probabilidade teórica',
         fallback: 'Cálculo de P(E) por Laplace + leitura progressiva do ângulo no disco.' },
    3: { title: 'OVA do Disco — Etapa 3: Evento complementar',
         fallback: 'Treino de P(Ā) = 1 − P(A) e generalização para um dado equilibrado.' },
  };
  const stageInfo = rouletteStageInfo[gameState.stage] ?? rouletteStageInfo[1];
  // ─── Construção da DESCRIÇÃO DINÂMICA ───────────────────────────
  //
  // A descricao do exercício na telemetria precisa capturar TUDO que o
  // aluno está vendo na hora da interação — não só o cabeçalho de
  // instruções no topo. Quem analisa os dados depois precisa entender
  // qual pergunta foi feita, quais opções estavam disponíveis, qual
  // balão conceitual estava em destaque, etc.
  //
  // Helper pra strip HTML + colapsar espaços + truncar com elipse.
  const stripText = (raw: string, max: number): string => {
    const cleaned = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
  };
  // TITLE da seção = stageInfo + TOPO (cabeçalho de instruções da subStep
  // atual). Vai pra `title` em vez de `descricao` — assim quem lê o JSON
  // identifica o exercício pela linha de título, e a descricao fica
  // limpa pra mostrar SÓ o que o aluno está vendo/interagindo agora
  // (balão / pergunta / opções / card).
  const topoText = instructions ? stripText(instructions, 200) : '';
  const liveTitle = topoText
    ? `${stageInfo.title} — ${topoText}`
    : stageInfo.title;

  const descricaoParts: string[] = [];
  // 1. Balão conceitual visível (InfoBox) — quando aparece, é onde o
  //    aluno está realmente olhando. Sem isso, "Li." vira clique sem
  //    contexto na coleta. Limitamos a 200 chars do message pra não
  //    inflar a descricao quando o balão tem texto muito longo.
  if (showInfoBox && infoBoxContent) {
    const balaoMsg = stripText(infoBoxContent.message || '', 200);
    descricaoParts.push(
      `Balão "${infoBoxContent.title || 'sem título'}": ${balaoMsg}`,
    );
  }
  // 3. Pergunta corrente (currentQuestion.question) — o enunciado
  //    específico do exercício. Crítico — antes a descricao só pegava
  //    "Identificação do Experimento Aleatório" (cabeçalho genérico)
  //    e não o enunciado "Tem-se um disco dividido em setores...".
  //
  // ATENÇÃO: `currentQuestion` PERSISTE entre subSteps mesmo depois
  // que a UI da pergunta sai da tela (não é resetado nos handlers que
  // avançam de subStep). Por isso, só incluímos na `descricao` quando
  // o subStep atual é DE FATO um subStep que renderiza `RouletteQuestion`
  // usando `currentQuestion`. A lista abaixo espelha as 19 ocorrências
  // de `<RouletteQuestion ... currentQuestion ...>` no JSX deste arquivo —
  // se uma nova for adicionada, incluir o subStep aqui também.
  const questionSubStepsByStage: Record<number, Set<number>> = {
    1: new Set([1, 4, 5, 6.5, 7.5]),
    2: new Set([0.19, 2.2, 2.3, 2.4, 9.2]),
    3: new Set([1.5, 3, 4, 5, 6, 7, 8, 8.2, 8.4]),
  };
  const isQuestionActiveSubStep =
    questionSubStepsByStage[gameState.stage]?.has(gameState.subStep) ?? false;
  if (isQuestionActiveSubStep && currentQuestion?.question) {
    descricaoParts.push(
      `Pergunta: ${stripText(currentQuestion.question, 280)}`,
    );
  }
  // 4. Opções da pergunta — as escolhas que o aluno vê na tela. Sem
  //    isso, "marcou 'distractor_2'" no resposta_usuario fica sem
  //    âncora — não dá pra saber qual era o texto da opção errada.
  //    Numeramos (a)/(b)/(c) pra ficar legível.
  //    Mesma gate da pergunta — não polui subSteps que não usam `currentQuestion`.
  if (isQuestionActiveSubStep && currentQuestion?.options && currentQuestion.options.length > 0) {
    const opts = currentQuestion.options
      .map((o, i) => `(${String.fromCharCode(97 + i)}) ${stripText(o.label || o.value, 100)}`)
      .join('; ');
    descricaoParts.push(`Opções: ${opts.slice(0, 400)}`);
  }
  // 5. CARDS CUSTOMIZADOS (telas que NÃO usam `currentQuestion` nem
  //    `InfoBox` mas que têm conteúdo conceitual fixo no JSX).
  //
  //    SubStep 1.25 — "Características do Experimento Aleatório":
  //    card com 7 checkboxes (uma característica por linha). Sem essa
  //    extração, a descricao só tinha as instruções do topo e nada
  //    sobre o card central com a pergunta + lista de características.
  if (gameState.stage === 1 && gameState.subStep === 1.25) {
    descricaoParts.push(
      'Pergunta: Características do Experimento Aleatório — Marque todas que julgar verdadeiro considerando os exemplos vistos anteriormente.',
    );
    if (randomExperimentCharacteristics && randomExperimentCharacteristics.length > 0) {
      const chars = randomExperimentCharacteristics
        .map((c: string, i: number) => `[${i + 1}] ${stripText(c, 110)}`)
        .join('; ');
      descricaoParts.push(`Características: ${chars.slice(0, 800)}`);
    }
  }
  // 6. PERGUNTAS HARDCODED em <RouletteQuestion question="..."> (string
  //    literal, não vinda de `currentQuestion`). Esses subSteps renderizam
  //    o componente RouletteQuestion passando a pergunta DIRETAMENTE no
  //    JSX — não há state intermediário pra ela. Sem este mapa, a coleta
  //    perde a pergunta inteira (ex.: SubStep 5.7 "Qual a chance você
  //    atribui ao evento certo...").
  //
  //    MANUTENÇÃO: se um subStep for adicionado/movido com `<RouletteQuestion
  //    question="..." />`, incluir aqui. Pesquise por `question="` no JSX.
  const hardcodedQuestion = ((): string | null => {
    const stage = gameState.stage;
    const sub = gameState.subStep;
    if (stage === 1) {
      if (sub === 2) return 'Qual o espaço amostral desse experimento aleatório?';
      if (sub === 3) return 'Quantos elementos possui o espaço amostral desse experimento aleatório?';
      if (sub === 5.7) return 'Qual a chance você atribui ao evento certo: girar um disco e o ponteiro indicar alguma das cores presentes no disco? (Atribua um número de 0% a 100%. Se preferir, utilize a forma decimal, atribuindo um valor de 0 a 1 inclusive.)';
      if (sub === 6.1) return 'Qual é o número de elementos (casos favoráveis) do evento E?';
      if (sub === 6.42) return 'Digite o número de casos favoráveis ao evento E.';
      if (sub === 6.43) return 'Digite o número de resultados possíveis do experimento aleatório (número de elementos do espaço amostral).';
      if (sub === 12) return `Caso o disco circular fosse dividido em ${gameState.theoreticalK} setores iguais, o setor h, após girar o disco um número p maior que 1 bilhão de vezes, terá uma frequência relativa aproximando de qual número?`;
      if (sub === 13) return `Na pergunta anterior você respondeu que a frequência relativa do setor h, após um número p maior que 1 bilhão de giros, se aproxima de ${theoreticalQuestion1Input?.value || '—'}. Então qual a probabilidade de o ponteiro do disco após um giro indicar a região h?`;
    }
    if (stage === 2) {
      if (sub === 2) return 'Qual o espaço amostral desse experimento aleatório?';
      if (sub === 2.1) return 'Quantos elementos possui o espaço amostral desse experimento?';
      if (sub === 4 && s2IxPhase === 'sum_question') {
        return 'Estamos atribuindo probabilidades a todos os setores do disco. O que deve acontecer quando somamos as probabilidades de todos os setores?';
      }
    }
    return null;
  })();
  if (hardcodedQuestion) {
    descricaoParts.push(`Pergunta: ${stripText(hardcodedQuestion, 320)}`);
  }
  // 7. CARDS CUSTOMIZADOS — telas que renderizam um <div> com <h3>+<p>
  //    no JSX (sem usar nem `<RouletteQuestion>` nem `<InfoBox>`). Cada
  //    card tem um título (h3) e uma descrição (p) próprios que NÃO entram
  //    no `instructions` (esses ficam no topo) nem no `currentQuestion`
  //    (esse vem de state). Sem este map, a `descricao` da seção fica
  //    sem o conteúdo central do exercício.
  //
  //    MANUTENÇÃO: pra adicionar um card aqui, basta:
  //      1) anotar (stage, subStep) e seus phases internos relevantes
  //      2) replicar a string do <h3> e do <p> que descrevem o card
  //         no JSX (busque por `ds-body-bold text-brand-otimath-pure`).
  const customCard = ((): { title: string; description?: string } | null => {
    const stage = gameState.stage;
    const sub = gameState.subStep;
    if (stage === 1) {
      if (sub === 6) {
        return {
          title: 'Probabilidade de Cada Cor',
          description: 'Baseando-se em elementos de simetria, atribua as probabilidades de o ponteiro parar em cada cor do disco.',
        };
      }
      if (sub === 6.1) {
        return {
          title: 'Probabilidade do Evento Composto',
          description: `Considere o evento composto E = {${gameState.compositeEventE.join(', ')}}. Esse evento é formado por alguns resultados simples do experimento aleatório de girar o disco.`,
        };
      }
      if (sub === 6.41) {
        return {
          title: 'Exercício — Aplicação do Modelo Probabilístico',
          description: `Clique nos setores do disco que correspondem aos casos favoráveis ao evento E = ocorre ${gameState.exerciseEventE.join(' ou ')}.`,
        };
      }
      if (sub === 6.42) {
        return {
          title: 'Exercício — Aplicação do Modelo Probabilístico',
          description: `Evento: E = {${gameState.exerciseEventE.join(', ')}}.`,
        };
      }
      if (sub === 6.43) {
        return {
          title: 'Exercício — Aplicação do Modelo Probabilístico',
          description: `Evento: E = {${gameState.exerciseEventE.join(', ')}}, n(E) = ${gameState.exerciseEventE.length}.`,
        };
      }
      if (sub === 6.44) {
        return {
          title: 'Exercício — Aplicação do Modelo Probabilístico',
          description: `Evento: E = {${gameState.exerciseEventE.join(', ')}}, n(E) = ${gameState.exerciseEventE.length}, n(S) = ${gameState.sectors.length}. Ao girar o disco uma única vez, qual a probabilidade de ocorrer o evento E?`,
        };
      }
      if (sub === 6.56 && (unionPhase === 'selecting' || unionPhase === 'filling_prob' || unionPhase === 'final_calc')) {
        const evtsList = unionEvents.map(e => `${e.label} = ${e.description}`).join(' | ');
        return {
          title: `Atividade ${unionActivityNum} de ${unionMaxActivities} — Probabilidade da União`,
          description: `Eventos: ${evtsList}. Fase: ${unionPhase}.`,
        };
      }
      if (sub === 6.6) {
        const title = gameState.challenge1Connective === 'ou' ? 'Desafio — União de Eventos' : 'Desafio — Interseção de Eventos';
        const desc = gameState.challenge1InterProblemType !== null
          ? `Calcule a probabilidade de, ao girar o disco uma única vez, obter um número ${gameState.challenge1PropertyY}.`
          : `Calcule a probabilidade de, ao girar o disco uma única vez, ocorrer ${gameState.challenge1EventXText} ${gameState.challenge1Connective.toUpperCase()} ocorrer um número ${gameState.challenge1PropertyY}.`;
        return { title, description: desc };
      }
      if (sub === 6.66) {
        return {
          title: 'Desafio — Contagem de Casos',
          description: `Evento: E = {${gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}}. Digite o número de casos favoráveis ao evento.`,
        };
      }
      if (sub === 6.67) {
        return {
          title: 'Desafio — Casos Possíveis',
          description: `Evento: E = {${gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}}. Digite o número de resultados possíveis do experimento.`,
        };
      }
      if (sub === 6.68) {
        return {
          title: 'Desafio — Probabilidade',
          description: `Evento: E = {${gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}}. Agora calcule a probabilidade.`,
        };
      }
      if ((sub === 6.85 || sub === 6.90) && compPhase === 'calc_selectA') {
        return {
          title: compIsGuided ? 'Cálculo da Probabilidade de Eventos Complementares' : `Treino ${compCalcExampleNum} de 4`,
          description: compIsGuided
            ? `Primeiro calcularemos P(A). Evento A = "${gameState.compEventA?.textA ?? ''}". Selecione os setores do evento A no disco.`
            : `Girando um disco ao acaso, qual a probabilidade de ocorrer o A = "${gameState.compEventA?.textA ?? ''}". Selecione os setores de A no disco.`,
        };
      }
      if (sub === 6.90 && compPhase === 'calc_pa') {
        return {
          title: `Treino ${compCalcExampleNum} de 4`,
          description: `A = "${gameState.compEventA?.textA ?? ''}". Informe a probabilidade de A como fração.`,
        };
      }
      if ((sub === 6.86 || sub === 6.91) && compPhase === 'calc_selectAbar') {
        return {
          title: compIsGuided ? 'Cálculo Guiado — P(Ā)' : `Treino ${compCalcExampleNum} de 4`,
          description: `A = "${gameState.compEventA?.textA ?? ''}". Marque no disco o evento complementar Ā.`,
        };
      }
      if ((sub === 6.88 || sub === 6.93) && compPhase === 'calc_chain') {
        return {
          title: compIsGuided ? 'P(Ā) a partir de P(A)' : 'Cálculo de P(Ā)',
          description: `A = "${gameState.compEventA?.textA ?? ''}". Cadeia de cálculo P(Ā) = 1 − P(A) = n/n − m/n = (n−m)/n.`,
        };
      }
      if (sub === 7) {
        if (gameState.pendingRegistration) {
          return {
            title: 'Registre a cor que saiu',
            description: 'Clique no botão correspondente à cor onde o ponteiro parou.',
          };
        }
        return {
          title: 'Giros Manuais',
          description: `Gire o disco ${gameState.manualSpinsRequired ?? 5} vezes clicando em Sortear. Após cada giro, registre a cor que saiu clicando no botão correspondente. Giros realizados: ${gameState.manualSpinsDone ?? 0}/${gameState.manualSpinsRequired ?? 5}.`,
        };
      }
      if (sub === 7.6) {
        return {
          title: 'Padrão Interessante Detectado!',
          description: `Você obteve cada cor exatamente uma vez. Isso acontece sempre? Continue girando o disco para observar o que acontece. Giros extras realizados: ${gameState.perfectPatternExtraSpinsDone} / ${gameState.manualSpinsRequired}.`,
        };
      }
      if (sub === 8) {
        // SubStep 8 (Stage 1) é a 2ª rodada de giros MANUAIS com Y giros
        // aleatórios (8-15) — NÃO os automáticos. Diferenciamos pelo
        // estado `pendingRegistration` (registro de cor após cada giro
        // é exclusivo dos giros manuais).
        const total = gameState.ySpins ?? 0;
        if (gameState.pendingRegistration) {
          return {
            title: 'Registre a cor que saiu',
            description: 'Clique no botão correspondente à cor onde o ponteiro parou.',
          };
        }
        return {
          title: 'Giros Manuais (2ª rodada)',
          description: `Realize ${total} giros e registre as frequências. Giros realizados: ${gameState.manualSpinsDone ?? 0}/${total}.`,
        };
      }
      if (sub === 9) {
        return {
          title: 'Frequências Relativas',
          description: 'Calcule a frequência relativa de cada cor (frequência absoluta / total de giros).',
        };
      }
      if (sub === 9.5 && freqRelQuestion) {
        return {
          title: 'Frequência Relativa',
          description: `A frequência relativa de um evento é a proporção ou porcentagem de vezes que esse evento ocorre em relação ao total de repetições do experimento. Qual é a frequência relativa (porcentagem das vezes que ocorre) da cor ${freqRelQuestion.color}?`,
        };
      }
      if (sub === 11) {
        return {
          title: 'Convergência das Frequências Relativas',
          description: 'À medida que o número de giros do disco se torna muito grande, as frequências relativas estão se aproximando de qual número?',
        };
      }
    }
    if (stage === 2) {
      if (sub === 0 && !showInfoBox) {
        return {
          title: 'Configuração do Disco — Etapa 2',
          description: `Use o controle deslizante para dividir o disco em ${gameState.s2K} setores e clique em Confirmar. Slider atual: ${sliderValue}.`,
        };
      }
      if (sub === 0.15 && !showInfoBox) {
        return {
          title: 'Investigação Inicial — Aposta',
          description: 'Girando-se aleatoriamente o disco, em qual cor você apostaria para ter mais chance de ganhar? Clique no setor que você acredita que o ponteiro irá indicar.',
        };
      }
      if (sub === 0.16 && !showInfoBox) {
        return {
          title: 'Investigação Inicial — Sortear',
          description: `Aposta registrada em ${experimentationState.wageredColor ?? '?'}. Clique em Sortear para girar o disco.`,
        };
      }
      if (sub === 0.17 && !showInfoBox) {
        return {
          title: 'Resultado da Aposta',
          description: `Aposta: ${experimentationState.wageredColor ?? '?'}. Resultado: ${experimentationState.internalDrawnColor ?? '?'}. ${experimentationState.wageredColor === experimentationState.internalDrawnColor ? 'Você ganhou a aposta!' : 'Você não ganhou desta vez.'}`,
        };
      }
      if (sub === 0.185 && !showInfoBox) {
        return {
          title: 'Qual cor possui a maior chance?',
          description: 'Clique na cor que você acredita ter a maior probabilidade de ser sorteada.',
        };
      }
      if (sub === 0.195 && !showInfoBox) {
        return {
          title: 'Reflexão Conceitual — Identifique a cor sorteada',
          description: 'O disco parou. Clique na cor em que o ponteiro parou.',
        };
      }
      if (sub === 2.3 && currentQuestion) {
        return {
          title: 'Probabilidade da União — Cor X ou Cor Y',
          description: `A probabilidade de ocorrer um setor de Cor ${s2RandomColors.colorX} ou Cor ${s2RandomColors.colorY} é 2/${gameState.s2K}? Marque Sim ou Não.`,
        };
      }
      if (sub === 2.4 && currentQuestion) {
        return {
          title: 'Probabilidade Laplaciana — Equiprovável ou Não Equiprovável?',
          description: 'Observando o disco com setores de tamanhos diferentes, classifique o espaço amostral em equiprovável ou não equiprovável e leia a definição correspondente.',
        };
      }
      if (sub === 3) {
        if (s2RatioPhase === 'init') {
          return {
            title: 'Razões Angulares — Selecione o menor setor',
            description: 'Clique no setor com o menor ângulo central. Esse setor será a unidade de comparação para os demais.',
          };
        }
        if (s2RatioPhase === 'unit_selected') {
          return {
            title: 'Razões Angulares — Reflexão conceitual',
            description: `Unidade = ${gameState.s2M}°. A área de um setor circular é diretamente proporcional ao seu ângulo central. Logo, a probabilidade de um setor ser sorteado é diretamente proporcional ______ e ______. Marque a opção que completa as lacunas corretamente.`,
          };
        }
        if (s2RatioPhase === 'ratio_question') {
          return {
            title: `Razões Angulares — Razão dos ângulos (cor ${s2ReasoningColorY})`,
            description: `Quantas vezes o ângulo do setor de cor ${s2ReasoningColorY} (${s2ReasoningAngleY}°) é maior que o ângulo do menor setor (${gameState.s2M}°)?`,
          };
        }
        if (s2RatioPhase === 'area_question') {
          return {
            title: `Razões Angulares — Razão das áreas (cor ${s2ReasoningColorY})`,
            description: `Então a área do setor de cor ${s2ReasoningColorY} é quantas vezes a área do menor setor do disco?`,
          };
        }
        if (s2RatioPhase === 'prob_question') {
          return {
            title: `Razões Angulares — Probabilidade em função de p (cor ${s2ReasoningColorY})`,
            description: `Supondo que a probabilidade do setor de menor ângulo seja p, qual é a probabilidade do setor de cor ${s2ReasoningColorY} ser sorteado?`,
          };
        }
        if (s2RatioPhase === 'question_correct' || s2RatioPhase === 'table_checked') {
          return {
            title: 'Razões Angulares — Tabela completa',
            description: `Unidade = ${gameState.s2M}°. Quantas unidades de ${gameState.s2M}° cabem em cada setor? Preencha a tabela com a razão (número de unidades) de cada cor.`,
          };
        }
      }
      if (sub === 4 && s2IxPhase === 'sum_question') {
        return {
          title: 'Soma das Probabilidades — Reflexão',
          description: 'Estamos atribuindo probabilidades a todos os setores do disco. O que deve acontecer quando somamos as probabilidades de todos os setores? (Opções: Deve dar 1; Deve dar o maior valor; Depende da cor)',
        };
      }
      if (sub === 4 && (s2IxPhase === 'filling_table' || s2IxPhase === 'guided_calc')) {
        const calcStr = s2IxPhase === 'guided_calc'
          ? (s2IxCalcStep === 0
              ? ` Cálculo guiado: ${gameState.s2Ki.map(ki => `${ki}p`).join(' + ')} = 1.`
              : s2IxCalcStep === 1
                ? ` Cálculo guiado: ${gameState.s2SumI}p = 1.`
                : ` Cálculo guiado: p = 1/${gameState.s2SumI}.`)
          : '';
        return {
          title: 'Distribuindo a probabilidade entre todos os setores',
          description: `Cada setor recebe uma quantidade proporcional à sua área. Seja p a probabilidade do setor de menor ângulo central ser sorteado. Vamos determinar o valor de p. Atribua probabilidades a cada setor na tabela em função de p.${calcStr}`,
        };
      }
      if (sub === 5) {
        return {
          title: 'Equação da Soma',
          description: `${gameState.s2Ki.map((ki: number) => `${ki}x`).join(' + ')} = ?`,
        };
      }
      if (sub === 5.2) {
        return {
          title: 'Determinar x',
          description: `${gameState.s2Ki.map((ki: number) => `${ki}x`).join(' + ')} = 1 → ${gameState.s2SumI}x = 1 → x = ?`,
        };
      }
      if (sub === 6) {
        return {
          title: `Probabilidades Numéricas (p = 1/${gameState.s2SumI})`,
          description: 'Preencha a probabilidade numérica de cada cor a partir de i·p.',
        };
      }
      if (trainingState?.active) {
        const phase = trainingState.phase;
        if (phase === 'identify_sector') {
          return {
            title: `Treino ${trainingState.currentTraining} de 4 — Identificar setor`,
            description: 'Clique no setor com o menor ângulo central.',
          };
        }
        if (phase === 'fill_ratios') {
          return {
            title: `Treino ${trainingState.currentTraining} de 4 — Divida todos os ângulos pelo menor`,
            description: 'Girando-se o disco apresentado ao acaso, determine a probabilidade de o ponteiro indicar cada uma das cores do disco.',
          };
        }
        if (phase === 'fill_ip' || phase === 'fill_sum' || phase === 'guided_calc') {
          return {
            title: `Treino ${trainingState.currentTraining} de 4 — Probabilidades em função de p`,
            description: 'Seja p a probabilidade do setor de menor ângulo central ser sorteado. Atribua probabilidades a cada setor na tabela em função de p.',
          };
        }
        if (phase === 'fill_prob') {
          return {
            title: `Treino ${trainingState.currentTraining} de 4 — Probabilidades Numéricas (p = 1/${trainingState.S})`,
            description: 'Preencha a probabilidade numérica de cada cor.',
          };
        }
        if (phase === 'completed') {
          return {
            title: `Treino ${trainingState.currentTraining} concluído!`,
          };
        }
      }
      if (sub === 6.201 && s2SpinReflection.phase === 'betting') {
        return { title: 'Primeiro giro', description: 'Clique no setor da cor em que deseja apostar.' };
      }
      if (sub === 6.201 && s2SpinReflection.phase === 'spinning') {
        return { title: 'Primeiro giro', description: `Você apostou em ${s2SpinReflection.bet1Color}. Agora clique em Sortear para girar o disco.` };
      }
      if (sub === 6.202 && !gameState.isSpinning) {
        return {
          title: `Foi sorteada a cor ${s2SpinReflection.spin1Color}`,
          description: 'Se você fosse apostar novamente, o que faria? (Opções: Apostaria nela; Não apostaria; Apostaria em outra cor; Sempre apostaria no maior setor)',
        };
      }
      if (sub === 6.204) {
        return {
          title: `Foi sorteada a cor ${s2SpinReflection.spin2Color}`,
          description: 'Se você fosse apostar novamente, o que faria? (Opções: Apostaria nela; Não apostaria; Apostaria em outra cor; Sempre apostaria no maior setor)',
        };
      }
      if (sub === 6.205) {
        return {
          title: 'Suas decisões',
          description: 'Em um disco, setores maiores possuem maior área e, portanto, maior probabilidade de serem sorteados. A probabilidade está diretamente relacionada ao tamanho do setor, e não ao resultado anterior.',
        };
      }
      if (sub === 7 && typeof s2AngleReadingStep === 'number') {
        if (s2AngleReadingStep === 0) return { title: 'Leitura progressiva — passo 1', description: 'O disco representa todos os resultados possíveis do experimento. Por isso, a probabilidade de o ponteiro parar em algum setor é 1.' };
        if (s2AngleReadingStep === 1) return { title: 'Leitura progressiva — passo 2', description: 'Observe que cada setor ocupa uma parte do disco e que quanto maior o ângulo central do setor, maior é a sua área.' };
        if (s2AngleReadingStep === 2) return { title: 'Leitura progressiva — passo 3', description: 'Como as probabilidades são proporcionais às áreas, podemos comparar cada setor com o disco completo.' };
        if (s2AngleReadingStep === 3) return { title: 'Leitura progressiva — passo 4', description: 'Assim, para calcular a probabilidade de um setor ser sorteado, basta dividir a medida do seu ângulo central por 360°, que é o ângulo total do disco.' };
        if (s2AngleReadingStep === 4) return { title: 'Pergunta de ativação (90°)', description: 'Se um setor mede 90°, qual fração do disco ele representa? (Opções: 90/360; 1/90; 360/90)' };
        if (s2AngleReadingStep >= 5) return { title: 'Probabilidade Angular (θ/360)', description: 'Estamos comparando cada setor com o disco completo (360°).' };
      }
      if (sub === 8 && fracTraining?.currentTraining > 0) {
        return {
          title: `Frequência Relativa e Probabilidade — Treino ${fracTraining.currentTraining} de 5`,
          description: 'Ao girar o disco ao acaso um número muito grande de vezes (superior a 1 bilhão), determine a probabilidade de cada cor, isto é, o valor para o qual tende a frequência relativa.',
        };
      }
      if (sub === 8.7) {
        return {
          title: 'Simulação e Convergência das Frequências Relativas',
          description: 'Comece com poucos giros para perceber a variação. Depois, avance para blocos maiores e observe a convergência. Observe como a diferença entre a frequência relativa e a probabilidade teórica diminui à medida que o número de giros aumenta.',
        };
      }
      if (sub === 9 && gameState.pendingRegistration) {
        return { title: 'Registre a cor que saiu', description: 'Clique no botão correspondente à cor sorteada no disco.' };
      }
      if (sub === 9.1) {
        return { title: 'Verificação das Frequências Absolutas', description: 'Preencha a frequência absoluta observada para cada cor.' };
      }
      if (sub === 9.3) {
        return { title: 'Frequência Relativa', description: 'Calcule a frequência relativa de cada cor com base nas frequências absolutas observadas.' };
      }
      if (sub === 11) {
        return { title: 'Conclusão', description: 'À medida que o número de giros aumenta, as frequências relativas se aproximam de quais valores?' };
      }
      if (sub === 12) {
        return { title: 'Etapa 2 Concluída!', description: 'Você explorou frequências relativas e a Lei dos Grandes Números.' };
      }
    }
    if (stage === 3) {
      if (sub === 0.5 && !showInfoBox) {
        return { title: 'Previsão inicial', description: 'Observando o disco, qual cor parece ocupar mais espaço?' };
      }
      if (sub === 1) {
        return { title: 'Faça sua aposta!', description: 'Clique em um setor do disco para apostar em uma cor. Escolha a cor que você acha que tem maior probabilidade de ser sorteada.' };
      }
      if (sub === 1.75) {
        return { title: 'Observe os setores', description: 'Quantos setores de cada cor existem no disco?' };
      }
      if (sub === 2) {
        return { title: 'Probabilidade de cada cor', description: 'Ao girar aleatoriamente o disco apresentado, calcule a probabilidade de o ponteiro parar em cada uma das cores indicadas.' };
      }
      if (sub === 8.1) {
        return {
          title: 'Observe os resultados do disco',
          description: `Você havia escolhido a cor ${s3State.betColor}. Agora observe alguns resultados. Gire o disco 5 vezes. (Giro ${s3State.spinCount} de 5)`,
        };
      }
      if (sub === 8.3) {
        return { title: 'Faça sua aposta novamente', description: `Com base nos resultados observados, você pode manter ou mudar sua aposta. Aposta anterior: ${s3State.betColor}.` };
      }
      if (sub === 8.5) {
        return {
          title: 'Falácia do Jogador',
          description: `A Falácia do Jogador ocorre quando acreditamos que resultados passados influenciam resultados futuros em experimentos aleatórios independentes. Essa probabilidade permanece sempre a mesma: P(setor) = 1/${s3State.n}.`,
        };
      }
      if (sub === 9) {
        return { title: 'Sua jornada na Etapa 3', description: 'Síntese da previsão, aposta, falácia do jogador e conceito-chave (espaço dos setores equiprovável vs. espaço das cores).' };
      }
      if (sub === 10) {
        return { title: 'Atividade Concluída!', description: 'Você explorou espaços equiprováveis e não equiprováveis, identificou vieses cognitivos e refletiu sobre suas escolhas.' };
      }
      if (sub === 11) {
        return { title: 'Reflexão para o próximo desafio', description: 'Ao lançar um dado justo, cada face tem probabilidade 1/6. Será que ao somar dois dados, todas as somas têm a mesma chance?' };
      }
    }
    // Cards cross-stage
    if (sub === 8.5 && stage !== 3 && freqAbsQuestion) {
      return {
        title: 'Frequência Absoluta',
        description: `A frequência absoluta de um evento é o número de ocorrências desse evento em n repetições de um experimento aleatório. Qual é a frequência absoluta do setor de cor ${freqAbsQuestion.color} após ${gameState.totalSpins} giros do disco?`,
      };
    }
    if (sub === 8.6) {
      if (freqRelConceptPhase === 'definition') {
        return {
          title: 'Frequência Relativa — Definição',
          description: 'Frequência relativa de um evento é a proporção entre o número de ocorrências do evento e o total de repetições do experimento, podendo ser expressa como fração, número decimal ou porcentagem. É a porcentagem de vezes em que um evento ocorreu após determinado número de giros, no caso particular do disco.',
        };
      }
      if (freqRelConceptPhase === 'example') {
        return {
          title: 'Frequência Relativa — Exemplo',
          description: `Se uma cor apareceu 3 vezes em ${gameState.totalSpins} giros, então 3/${gameState.totalSpins} = ${(3 / gameState.totalSpins).toFixed(3).replace('.', ',')} ≈ ${((3 / gameState.totalSpins) * 100).toFixed(1).replace('.', ',')}%. Agora é a sua vez de calcular as frequências relativas observando a tabela.`,
        };
      }
    }
    if (sub === 14 && interpretationPhase !== 'done') {
      if (interpretationPhase === 'q1') return { title: 'Interpretação dos Resultados — Q1', description: 'Todos os setores tiveram frequências relativas iguais no experimento? (Sim / Não)' };
      if (interpretationPhase === 'q2') return { title: 'Interpretação dos Resultados — Q2', description: `As frequências relativas ficaram muito próximas da probabilidade teórica (1/${gameState.targetSectorCount})? (Sim / Não)` };
      if (interpretationPhase === 'q3') return { title: 'Interpretação dos Resultados — Q3', description: `Por qual motivo as frequências relativas não ficaram exatamente iguais a 1/${gameState.targetSectorCount}?` };
      if (interpretationPhase === 'feedback') return { title: 'Interpretação dos Resultados — feedback', description: 'A variabilidade amostral diminui quando o número de repetições cresce, mas não desaparece completamente. A Lei dos Grandes Números afirma apenas que os valores tendem a se aproximar.' };
    }
    if (sub === 15) {
      // Cada fase do LGN tem um enunciado próprio dentro do card "Consolidação".
      // Sem isso, a descricao virava só o título do card e perdia o problema
      // específico que o aluno estava resolvendo (cores e números são dinâmicos).
      if (lgnPhase === 'problem1' && lgnParams) {
        return {
          title: 'Consolidação: Lei dos Grandes Números — Problema 1',
          description: `Um disco está dividido em ${lgnN} partes iguais. Considere a cor ${lgnParams.color} ocupando exatamente 1 dessas ${lgnN} partes. Após o disco girar ${lgnParams.m.toLocaleString('pt-BR')} vezes, quantas vezes se espera que ocorra a cor ${lgnParams.color}?`,
        };
      }
      if (lgnPhase === 'problem2' && lgnParams) {
        return {
          title: 'Consolidação: Lei dos Grandes Números — Problema 2',
          description: `Um medicamento tem ${lgnParams.p}% de chance de curar um paciente quando aplicado no início dos sintomas. Aplicando esse medicamento em ${lgnParams.m.toLocaleString('pt-BR')} pacientes, quantos pacientes se espera que sejam curados?`,
        };
      }
      if (lgnPhase === 'note') {
        return {
          title: 'Consolidação: Lei dos Grandes Números — NOTA (obrigatória)',
          description: 'Você sabe por que o número real de pacientes curados pode ser diferente desse valor?',
        };
      }
      if (lgnPhase === 'explanation') {
        return {
          title: 'Consolidação: Lei dos Grandes Números — Explicação',
          description: 'Mesmo conhecendo a probabilidade de cura, o resultado real pode variar porque cada paciente é um caso sujeito ao acaso. O valor calculado representa o número esperado: um valor em torno do qual os resultados tendem a se aproximar quando repetimos o experimento muitas vezes. Isso é uma consequência da Lei dos Grandes Números.',
        };
      }
      if (lgnPhase === 'verbal') {
        const nLabel = lgnN ?? gameState.targetSectorCount;
        return {
          title: 'Consolidação: Lei dos Grandes Números — Consolidação verbal',
          description: `Explique com suas palavras: por que a frequência relativa de cada cor se aproximou de 1/${nLabel} após muitos giros? (Resposta livre — escreva sua explicação no campo de texto. Mínimo de 10 caracteres.)`,
        };
      }
      return { title: 'Consolidação: Lei dos Grandes Números' };
    }
    if (stage === 1 && (sub === 15.6 || sub === 15.7)) {
      return {
        title: 'Generalização: Dado de 6 Faces',
        description: 'A Lei dos Grandes Números funciona apenas com o disco? Vamos testar com outro experimento aleatório.',
      };
    }
    return null;
  })();
  if (customCard) {
    descricaoParts.push(`Card: ${stripText(customCard.title, 120)}`);
    if (customCard.description) {
      descricaoParts.push(`(${stripText(customCard.description, 300)})`);
    }
  }
  const baseInstructions = descricaoParts.join(' || ');
  // Sufixos de CONTEXTO DO ALUNO — anexados ao final pra que, lendo só
  // a `descricao` no JSON, dê pra entender O QUE o aluno apostou /
  // previu na hora do evento. Sem isso, "Qual a probabilidade da cor
  // apostada?" fica sem âncora — não dá pra saber qual foi a aposta.
  const contextTags: string[] = [];
  // (O valor atual do slider NÃO entra na `descricao` — a movimentação
  // do slider já gera eventos `interacao_exercicio` no histórico, e o
  // valor confirmado vai no `resposta_usuario` do acerto/erro via
  // wrapper do createAlert. Repetir aqui só polui o texto da seção.)
  // Etapa 1 (1.1 / 1.17) e Etapa 2 (0.15-0.17): "investigação inicial"
  // com aposta exploratória via `experimentationState.wageredColor`.
  if ((gameState.stage === 1 || gameState.stage === 2) && experimentationState.wageredColor) {
    contextTags.push(`apostou na investigação: ${experimentationState.wageredColor}`);
  }
  // Opção atualmente marcada (radio/dropdown da pergunta corrente). Útil
  // em quase TODOS os subSteps com múltipla escolha. Traduz pro label
  // legível em vez do value interno.
  // Mesmo gate da pergunta — `selectedOption` PERSISTE entre subSteps
  // (não é resetado nos handlers que avançam). Sem gate, mostraria a
  // opção marcada na pergunta anterior em telas que não têm pergunta
  // (ex.: Experimentação Tentativa 1.17).
  if (isQuestionActiveSubStep && selectedOption) {
    contextTags.push(`opção marcada: "${labelOfOption(selectedOption, currentQuestion)}"`);
  }
  if (gameState.stage === 2 && s2SpinReflection.bet1Color) {
    contextTags.push(`apostou no 1º giro: ${s2SpinReflection.bet1Color}`);
  }
  if (gameState.stage === 2 && s2SpinReflection.bet2Color) {
    contextTags.push(`apostou no 2º giro: ${s2SpinReflection.bet2Color}`);
  }
  if (gameState.stage === 2 && s2SpinReflection.spin1Color) {
    contextTags.push(`saiu no 1º giro: ${s2SpinReflection.spin1Color}`);
  }
  if (gameState.stage === 2 && s2SpinReflection.spin2Color) {
    contextTags.push(`saiu no 2º giro: ${s2SpinReflection.spin2Color}`);
  }
  if (gameState.stage === 3 && s3State.predictionColor) {
    contextTags.push(`previu: ${s3State.predictionColor}`);
  }
  if (gameState.stage === 3 && s3State.betColor) {
    contextTags.push(`apostou na cor ${s3State.betColor} (setor ${s3State.betSector + 1})`);
  }
  if (gameState.stage === 3 && s3State.newBetColor) {
    contextTags.push(`mudou aposta para: ${s3State.newBetColor}`);
  }
  const contextSuffix = contextTags.length > 0
    ? ` | [aluno ${contextTags.join('; aluno ')}]`
    : '';
  const liveDescricao = (baseInstructions + contextSuffix) || stageInfo.fallback;
  // SEÇÃO POR (SUBPASSO + SUB-FASE) — cada "tela" da Roleta é uma seção
  // telemétrica independente. Além do subStep, incluímos TODOS os
  // phases internos relevantes pra que mudanças de cena DENTRO de um
  // mesmo subStep (ex.: disjoint 'selecting_A' → 'selecting_B') também
  // gerem seções distintas.
  //
  // Cada marcador só entra no id se o valor for truthy — assim subSteps
  // que não usam um determinado phase não recebem sufixo desnecessário.
  // Resultado: ids tipo `roulette-stage-1-sub6.55-disj=selecting_A`
  // quando a fase está ativa, ou `roulette-stage-1-sub0.1` quando não há
  // sub-fase ativa.
  // CADA phase marker tem um valor DEFAULT que parece ativo (ex.: 'init',
  // 'definition1', 'intro', 'sum_question', 0, -1). Sem gatear pelo subStep
  // onde a phase é DE FATO usada, o id ficava com lixo do tipo
  // `union=definition1,comp=intro,ratio=init,ix=sum_question,...` mesmo em
  // SubStep 6 (Probabilidade de Cada Cor) que não tem nada a ver com isso.
  // Cada gate abaixo restringe a phase ao seu range de subStep relevante.
  const phaseMarkers: string[] = [];
  const _stage = gameState.stage;
  const _sub = gameState.subStep;
  // disjoint phase — Stage 1 SubStep 6.55 (exercício de eventos disjuntos)
  if (_stage === 1 && _sub === 6.55 && disjointExercisePhase && disjointExercisePhase !== 'none') {
    phaseMarkers.push(`disj=${disjointExercisePhase}`);
  }
  // union phase — Stage 1 SubStep 6.56 (probabilidade da união)
  if (_stage === 1 && _sub === 6.56 && unionPhase) {
    phaseMarkers.push(`union=${unionPhase}`);
  }
  // comp phase — Stage 1 SubSteps 6.85-6.93 (eventos complementares)
  if (_stage === 1 && _sub >= 6.85 && _sub <= 6.93 && compPhase) {
    phaseMarkers.push(`comp=${compPhase}`);
  }
  // s2RatioPhase — Stage 2 SubStep 3 (razões angulares)
  if (_stage === 2 && _sub === 3 && s2RatioPhase) {
    phaseMarkers.push(`ratio=${s2RatioPhase}`);
  }
  // s2IxPhase + s2IxCalcStep — Stage 2 SubStep 4 (probabilidades i·p)
  if (_stage === 2 && _sub === 4) {
    if (s2IxPhase) phaseMarkers.push(`ix=${s2IxPhase}`);
    if (s2IxPhase === 'guided_calc' && typeof s2IxCalcStep === 'number') {
      phaseMarkers.push(`ixCalc=${s2IxCalcStep}`);
    }
  }
  // s2SpinReflection — Stage 2 SubSteps 6.201-6.205 (giros reflexivos)
  if (_stage === 2 && _sub >= 6.201 && _sub <= 6.205 && s2SpinReflection?.phase) {
    phaseMarkers.push(`spinRefl=${s2SpinReflection.phase}`);
  }
  // s2AngleReadingStep — Stage 2 SubStep 7 (leitura angular θ/360).
  // Default é -1 ("não iniciado") — só interessa quando >= 0.
  if (_stage === 2 && _sub === 7 && typeof s2AngleReadingStep === 'number' && s2AngleReadingStep >= 0) {
    phaseMarkers.push(`angleRead=${s2AngleReadingStep}`);
  }
  // progressiveReadingStep — Stage 2 SubStep 2.9 (leitura progressiva)
  if (_stage === 2 && _sub === 2.9 && typeof progressiveReadingStep === 'number') {
    phaseMarkers.push(`progRead=${progressiveReadingStep}`);
  }
  // freqRelConceptPhase — SubStep 8.6 (conceito de frequência relativa)
  if (_sub === 8.6 && freqRelConceptPhase) {
    phaseMarkers.push(`freqRel=${freqRelConceptPhase}`);
  }
  // interpretationPhase — SubStep 14 (interpretação dos resultados)
  if (_sub === 14 && interpretationPhase) {
    phaseMarkers.push(`interp=${interpretationPhase}`);
  }
  // lgnPhase — SubStep 15 (Lei dos Grandes Números)
  if (_sub === 15 && lgnPhase) {
    phaseMarkers.push(`lgn=${lgnPhase}`);
  }
  // trainingState — Stage 2 (treinos de razão e probabilidade)
  if (_stage === 2 && trainingState?.phase && trainingState.active) {
    phaseMarkers.push(`train=${trainingState.phase}`);
  }
  // fracTraining — Stage 2 SubStep 8 (treinos de fração θ/360)
  if (_stage === 2 && _sub === 8 && typeof fracTraining?.currentTraining === 'number' && fracTraining.currentTraining > 0) {
    phaseMarkers.push(`fracTrain=${fracTraining.currentTraining}`);
  }
  // compCalcExampleNum — Stage 1 SubSteps 6.85-6.93 (junto com compPhase)
  if (_stage === 1 && _sub >= 6.85 && _sub <= 6.93 && typeof compCalcExampleNum === 'number' && compCalcExampleNum > 0) {
    phaseMarkers.push(`compCalc=${compCalcExampleNum}`);
  }
  const phaseSuffix = phaseMarkers.length > 0 ? `-${phaseMarkers.join(',')}` : '';
  useTelemetryExercise(
    `roulette-stage-${gameState.stage}-sub${gameState.subStep}${phaseSuffix}`,
    liveTitle,
    liveDescricao,
    isActiveStage,
  );

  // ─── Telemetria de LEITURA do balão (InfoBox) ────────────────────
  // Cada balão conceitual com botão "Li." vira um EXERCÍCIO ATÔMICO
  // de tipo `interacao_usuario`. O `id` inclui stage+subStep+título pra
  // diferenciar balões com mesmo título reutilizado (ex.: "Informação")
  // em contextos diferentes. Quando `showInfoBox` vira true, a leitura
  // começa; quando o aluno clica "Li.", o `confirmReadingBalao()`
  // materializa o exercício com a duração da leitura.
  const balaoTitulo = infoBoxContent?.title ?? '(sem título)';
  const balaoMensagem = (infoBoxContent?.message ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
  // Fingerprint da MENSAGEM — alguns subSteps reusam o mesmo título do balão
  // pra múltiplos conteúdos distintos (ex.: 6.56 definition1 e definition2 têm
  // título idêntico "Probabilidade da União de Eventos Mutuamente Exclusivos"
  // mas mensagens completamente diferentes). Sem incluir o fingerprint no id,
  // o useReadingTelemetry achava que era o MESMO balão e não fechava/abria
  // novo pending — segundo balão da sequência nunca virava exercise.
  const balaoMensagemFingerprint = (infoBoxContent?.message ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .slice(0, 24);
  // `balaoEhInstrucional` — identifica balões que são apenas INSTRUÇÕES
  // operacionais (ex.: "Sua vez! Clique no evento A") e NÃO leituras
  // conceituais. Sem esse gate, o auto-confirm do `useReadingTelemetry`
  // (cleanup) gerava `interacao_usuario` fantasma quando o balão era
  // dispensado por outro botão (Confirmar A/B, Tentar novamente, etc.).
  //
  // INCLUÍMOS por padrão TODOS os balões (definições, sucessos com
  // explicação, conceitos), e só EXCLUÍMOS os intrutórios:
  //   • 6.55 selecting_A/selecting_B: "Sua vez! Clique no evento A/B"
  //   • 6.55 wrong: "Tente novamente. Observe..."
  //   • 6.70 selecting_A/selecting_Abar: idem pra eventos complementares
  //   • 6.70 wrong_A/wrong_Abar: idem
  //
  // Balões com type='success' (Parabéns! com explicação) e type='concept'
  // (definições) SEMPRE viram leitura, independente do botão de dispensa.
  const balaoEhInstrucional =
    (gameState.subStep === 6.55 && (
      disjointExercisePhase === 'selecting_A' ||
      disjointExercisePhase === 'selecting_B' ||
      disjointExercisePhase === 'wrong'
    )) ||
    (gameState.subStep === 6.70 && (
      compPhase === 'selecting_A' ||
      compPhase === 'selecting_Abar' ||
      compPhase === 'wrong_A' ||
      compPhase === 'wrong_Abar'
    ));
  const confirmReadingBalao = useReadingTelemetry(
    showInfoBox && !!infoBoxContent && !balaoEhInstrucional,
    // O `id` é interno e PRECISA ser único — incluímos `balaoMensagemFingerprint`
    // pra diferenciar balões de mesmo título com mensagens distintas
    // (ex.: 6.56 definition1 e definition2). Não aparece em texto exibido
    // pro analista.
    `roulette-s${gameState.stage}-sub${gameState.subStep}-balao-${balaoTitulo}-${balaoMensagemFingerprint}`,
    `Leitura — ${balaoTitulo}`,
    balaoMensagem || 'Balão conceitual sem texto definido.',
    `confirmou leitura: "${balaoTitulo}"`,
  );

  return (
    <div className="flex flex-col gap-y-xxs">
      {devMode && (
        // Wrapper com `data-skip-telemetry` — cliques nas setinhas DEV
        // de avanço/retorno + jumps de subStep não contam como interações.
        <div data-skip-telemetry>
          <RouletteDevNav
            stage={gameState.stage}
            historyRef={devHistoryRef}
            cursorRef={devCursorRef}
            restoringRef={devRestoringRef}
            historyTick={devHistoryTick}
            onCursorChange={() => setDevHistoryTick(c => c + 1)}
            onSimulateAdvance={devSimulateAdvance}
            applyDevSnapshot={applyDevSnapshot}
            onStartStage={(n) => {
              if (n === 1) startStage1();
              else if (n === 2) startStage2();
              else startStage3();
            }}
          />
        </div>
      )}
      {/* Indicador visual das etapas — não são botões, apenas ilustram em
          qual etapa o aluno está e quais já foram concluídas. A navegação
          entre etapas só é possível pelo fluxo natural do OVA ou pelo
          modo DEV da sequência didática. */}
      <div className="flex justify-center gap-x-macro mb-macro" role="list" aria-label="Etapas do disco">
        {[1, 2, 3].map((stageNum) => {
          const isCurrentStage = gameState.stage === stageNum;
          const isCompleted = gameState.stage > stageNum ||
            (stageNum === 1 && gameState.stage2Available) ||
            (stageNum === 2 && gameState.stage3Available);

          return (
            <div
              key={stageNum}
              role="listitem"
              aria-current={isCurrentStage ? 'step' : undefined}
              aria-label={`Etapa ${stageNum}${isCurrentStage ? ' (atual)' : isCompleted ? ' (concluída)' : ' (bloqueada)'}`}
              className={`
                px-macro py-micro rounded-pill ds-small-bold transition-colors min-h-[44px] flex items-center justify-center select-none
                ${isCurrentStage
                  ? 'bg-brand-otimath-pure text-neutral-white'
                  : isCompleted
                    ? 'bg-feedback-success-lighter text-feedback-success-darkest opacity-70'
                    : 'bg-neutral-lighter text-neutral-medium opacity-50'
                }
              `}
            >
              Etapa {stageNum}
            </div>
          );
        })}
      </div>

      {/* Instructions — ocultar durante leitura progressiva da prob. angular (Etapa 2, subStep 7, steps 0-4) e durante InfoBox de transição entre etapas */}
      <div aria-live="polite" aria-atomic="true">
        {!(gameState.stage === 2 && gameState.subStep === 7 && s2AngleReadingStep >= 0 && s2AngleReadingStep <= 4) && !(showInfoBox && ((gameState.stage === 2 && gameState.subStep === 0) || (gameState.stage === 3 && gameState.subStep === 0.5))) && (
          <TextBlock
            paragraph={<div dangerouslySetInnerHTML={{ __html: instructions }} />}
            maxWidthParagraph="max-w-[805px]"
            centralize={true}
          />
        )}
      </div>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col max-lg:items-center">
        {/* Left side - Roulette and controls */}
        <div className="flex-1 flex flex-col gap-y-xxs items-center">
          {/* Sector slider (Stage 1, subStep 0 only) */}
          {gameState.stage === 1 && gameState.subStep === 0 && (
            <div className="flex flex-col gap-y-micro w-full max-w-[350px] bg-neutral-white p-macro rounded-md">
              <label className="ds-small-bold text-brand-otimath-pure" id="slider-label-s1">
                Número de setores: {sliderValue}
              </label>
              <input
                type="range"
                min="1"
                max="6"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number.parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
                aria-labelledby="slider-label-s1"
                aria-valuenow={sliderValue}
              />
              <div className="flex justify-between ds-caption text-neutral-dark" aria-hidden="true">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
          )}

          {/* Placeholder circle when Stage 1 and divisions not shown yet */}
          {gameState.stage === 1 && gameState.subStep === 0 && (
            <div className="w-full max-w-[300px] aspect-square rounded-full border-4 border-dashed border-neutral-dark bg-neutral-lightest flex items-center justify-center" role="img" aria-label="Disco vazio - selecione o número de setores">
              <p className="ds-body text-neutral-dark text-center px-macro">
                Selecione o número<br/>de setores e clique<br/>em &quot;Confirmar&quot;
              </p>
            </div>
          )}

          {/* Stage 2 - Sector slider (subStep 0) — oculto durante InfoBox de transição */}
          {gameState.stage === 2 && gameState.subStep === 0 && !showInfoBox && (
            <div className="flex flex-col gap-y-micro w-full max-w-[350px] bg-neutral-white p-macro rounded-md">
              <label className="ds-small-bold text-brand-otimath-pure" id="slider-label-s2">
                Número de setores: {sliderValue}
              </label>
              <input
                type="range"
                min="1"
                max="6"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number.parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
                aria-labelledby="slider-label-s2"
                aria-valuenow={sliderValue}
              />
              <div className="flex justify-between ds-caption text-neutral-dark" aria-hidden="true">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
          )}

          {/* Stage 2 - Placeholder circle — oculto durante InfoBox de transição */}
          {gameState.stage === 2 && gameState.subStep === 0 && !showInfoBox && (
            <div className="w-full max-w-[300px] aspect-square rounded-full border-4 border-dashed border-neutral-dark bg-neutral-lightest flex items-center justify-center" role="img" aria-label="Disco vazio - selecione o número de setores">
              <p className="ds-body text-neutral-dark text-center px-macro">
                Selecione o número<br/>de setores e clique<br/>em &quot;Confirmar&quot;
              </p>
            </div>
          )}

          {/* Roulette wheel */}
          {shouldShowRoulette && (
            <div
              className="rounded-full transition-shadow duration-500"
              style={
                gameState.subStep === 6.88 && compPhase === 'calc_chain' && (
                  compStepByStep === 1 ||
                  (compStepByStep === 0 && compChainInputs.n1 === String(gameState.sectors.length) && compChainInputs.d1 === String(gameState.sectors.length))
                )
                  ? { boxShadow: `0 0 0 5px ${sampleSpaceColor}`, borderRadius: '50%' }
                  : undefined
              }
            >
            <Roulette
              sectors={
                // Adicionar números aos setores durante conceito disjunto (6.55), União ME (6.56), Desafio Dinâmico 1 (6.6-6.69) e Eventos Complementares (6.70-6.95)
                (gameState.subStep === 6.55 || (gameState.subStep >= 6.6 && gameState.subStep <= 6.69) || (gameState.subStep >= 6.70 && gameState.subStep <= 6.95)) && gameState.challenge1SectorNumbers.length > 0
                  ? gameState.sectors.map((sector, index) => ({
                      ...sector,
                      number: gameState.challenge1SectorNumbers[index]
                    }))
                  : (gameState.subStep === 6.56 && unionNeedsNumbers && unionSectorNumbers.length > 0)
                    ? gameState.sectors.map((sector, index) => ({
                        ...sector,
                        number: unionSectorNumbers[index]
                      }))
                    : gameState.sectors
              }
              isSpinning={gameState.isSpinning}
              spinDuration={gameState.spinDuration}
              targetAngle={gameState.targetAngle}
              showAngles={gameState.showAngles}
              showNumbers={gameState.showNumbers || gameState.stage === 3 || (gameState.subStep === 6.55 && disjointNeedsNumbers) || (gameState.subStep >= 6.6 && gameState.subStep <= 6.69) || (gameState.subStep === 6.56 && unionNeedsNumbers) || (gameState.subStep >= 6.70 && gameState.subStep <= 6.95 && gameState.compEventA?.needsNumbers)}
              size={300}
              largeNumbers={gameState.stage === 3}
              onSpinEnd={handleSpinEnd}
              useTransition={gameState.isAutoSpinning}
              selectableMode={
                gameState.subStep === 6.41 ||
                gameState.subStep === 6.6 ||
                gameState.subStep === 1.1 || // Fase de aposta
                gameState.subStep === 1.17 || // Fase de confirmação
                (gameState.subStep === 6.55 && (disjointExercisePhase === 'selecting_A' || disjointExercisePhase === 'selecting_B')) ||
                (gameState.subStep === 6.56 && unionPhase === 'selecting') ||
                (gameState.subStep === 6.70 && (compPhase === 'selecting_A' || compPhase === 'selecting_Abar')) ||
                ((gameState.subStep === 6.85 || gameState.subStep === 6.90) && compPhase === 'calc_selectA') ||
                ((gameState.subStep === 6.86 || gameState.subStep === 6.91) && compPhase === 'calc_selectAbar') ||
                (gameState.stage === 2 && gameState.subStep === 0.15 && !gameState.isSpinning) ||
                (gameState.stage === 2 && gameState.subStep === 0.16) ||
                (gameState.stage === 2 && gameState.subStep === 0.195) ||
                (gameState.stage === 2 && gameState.subStep === 3 && s2RatioPhase === 'init') ||
                (gameState.stage === 2 && trainingState.active && trainingState.phase === 'identify_sector') ||
                (gameState.stage === 2 && (gameState.subStep === 6.201 || gameState.subStep === 6.202) && s2SpinReflection.phase === 'betting') ||
                (gameState.stage === 3 && gameState.subStep === 1)
              }
              selectedSectors={
                // Exercício interativo de disjuntos: grupo A (dourado)
                (gameState.subStep === 6.55 && disjointExercisePhase !== 'none')
                  ? disjointUserSelectA
                  // Eventos Complementares — seleção de A (parte 1)
                  : (gameState.subStep === 6.70 && (compPhase === 'selecting_A' || compPhase === 'wrong_A'))
                    ? compUserSelectA
                  : (gameState.subStep === 6.70 && (compPhase === 'show_both' || compPhase === 'selecting_Abar' || compPhase === 'wrong_Abar'))
                    ? (gameState.compEventA?.indicesA || [])
                  // Eventos Complementares — intro (A highlight)
                  : (gameState.subStep === 6.70 && compPhase === 'intro')
                    ? (gameState.compEventA?.indicesA || [])
                  // Eventos Complementares — cálculo: A (dourado) fixo durante selectĀ/showBoth/chain
                  : ((gameState.subStep === 6.86 || gameState.subStep === 6.91) && (compPhase === 'calc_selectAbar' || compPhase === 'calc_showBoth'))
                    ? (gameState.compEventA?.indicesA || [])
                  : ((gameState.subStep === 6.87 || gameState.subStep === 6.88 || gameState.subStep === 6.92 || gameState.subStep === 6.93) && (compPhase === 'calc_showBoth' || compPhase === 'calc_chain'))
                    ? (compStepByStep >= 1 && compStepByStep < 2 ? [] : compStepByStep >= 3 ? [] : (gameState.compEventA?.indicesA || []))
                  // Na fase de experimentação, destacar a cor apostada (inclusive durante o giro).
                  // Restrito aos subSteps da experimentação para não vazar para giros automáticos posteriores.
                  : (gameState.stage === 1 && (gameState.subStep === 1.1 || gameState.subStep === 1.17) && experimentationState.wageredColor)
                    ? [gameState.sectors.findIndex(s => s.colorName === experimentationState.wageredColor)]
                  // Etapa 2: destacar setor apostado na investigação inicial
                  : (gameState.stage === 2 && (gameState.subStep === 0.15 || gameState.subStep === 0.16 || gameState.subStep === 0.17) && experimentationState.wageredColor)
                    ? [gameState.sectors.findIndex(s => s.colorName === experimentationState.wageredColor)]
                  // Etapa 2: destacar menor setor na leitura progressiva (passo de referência)
                  : (gameState.stage === 2 && gameState.subStep === 2.9 && progressiveReadingStep === 5)
                    ? [gameState.s2Angles.indexOf(gameState.s2M)]
                  // Etapa 2: destacar menor setor após identificação (subStep 3, STATE >= 1)
                  : (gameState.stage === 2 && gameState.subStep === 3 && s2UnitSectorIndex >= 0)
                    ? [s2UnitSectorIndex]
                  // Etapa 2: destacar setor apostado nos giros reflexivos
                  : (gameState.stage === 2 && (gameState.subStep === 6.201 || gameState.subStep === 6.202) && s2SpinReflection.phase === 'spinning')
                    ? [gameState.sectors.findIndex(s => s.colorName === (gameState.subStep === 6.201 ? s2SpinReflection.bet1Color : s2SpinReflection.bet2Color))]
                    // Na união ME, não usar selectedSectors (usar highlightGroups)
                    : gameState.subStep === 6.56
                      ? []
                    // Etapa 3 subStep 0.5: destacar setores da cor selecionada na previsão
                    : (gameState.stage === 3 && gameState.subStep === 0.5 && selectedOption && selectedOption !== 'iguais')
                      ? gameState.sectors.map((s, i) => s.colorName === selectedOption ? i : -1).filter(i => i >= 0)
                    // Etapa 3: destacar setor apostado
                    : (gameState.stage === 3 && s3State.betSector >= 0)
                      ? [s3State.betSector]
                      : gameState.selectedSectors
              }
              selectedSectorsB={
                // Exercício interativo de disjuntos: grupo B (ciano)
                (gameState.subStep === 6.55 && disjointExercisePhase !== 'none')
                  ? disjointUserSelectB
                  // Eventos Complementares — Ā (ciano)
                  : (gameState.subStep === 6.70 && (compPhase === 'selecting_Abar' || compPhase === 'wrong_Abar'))
                    ? compUserSelectAbar
                  : (gameState.subStep === 6.70 && compPhase === 'show_both')
                    ? (gameState.compEventA?.indicesAbar || [])
                  : (gameState.subStep === 6.70 && compPhase === 'intro')
                    ? (gameState.compEventA?.indicesAbar || [])
                  // Eventos Complementares — cálculo: Ā (ciano) durante selectĀ
                  : ((gameState.subStep === 6.86 || gameState.subStep === 6.91) && compPhase === 'calc_selectAbar')
                    ? compUserSelectAbar
                  // Eventos Complementares — cálculo: Ā (ciano) fixo durante showBoth/chain
                  : ((gameState.subStep === 6.86 || gameState.subStep === 6.87 || gameState.subStep === 6.88 || gameState.subStep === 6.91 || gameState.subStep === 6.92 || gameState.subStep === 6.93) && (compPhase === 'calc_showBoth' || compPhase === 'calc_chain'))
                    ? (compStepByStep >= 1 && compStepByStep < 3 ? [] : (gameState.compEventA?.indicesAbar || []))
                  : []
              }
              highlightGroups={
                gameState.subStep === 6.56
                  ? (() => {
                      const groups: Array<{indices: number[], color: string}> = [];
                      const COLORS = ['#FFD700', '#00E5FF', '#FF69B4', '#7CFC00', '#FF8C00', '#BA55D3'];
                      // Eventos já confirmados
                      unionEvents.forEach((evt, i) => {
                        if (evt.completed) {
                          groups.push({ indices: evt.sectorIndices, color: COLORS[i] || COLORS[0] });
                        }
                      });
                      // Seleção atual (evento sendo marcado)
                      if (unionPhase === 'selecting' && unionSelectedSectors.length > 0) {
                        groups.push({ indices: unionSelectedSectors, color: COLORS[unionCurrentEventIdx] || COLORS[0] });
                      }
                      // Em filling_prob, mostrar o evento atual destacado
                      if (unionPhase === 'filling_prob' && unionCurrentEventIdx < unionEvents.length) {
                        const evt = unionEvents[unionCurrentEventIdx];
                        if (!evt.completed) {
                          groups.push({ indices: evt.sectorIndices, color: COLORS[unionCurrentEventIdx] || COLORS[0] });
                        }
                      }
                      return groups;
                    })()
                  : []
              }
              onSectorClick={(index) => {
                // Feedback sonoro universal para todo clique em setor
                // selecionável. Antes, só os handlers de aposta
                // (handleExperimentationBet/handleS2Bet) tocavam click.mp3;
                // os outros modos de seleção (disjuntos, união ME,
                // complementares, treinos, etc.) ficavam silenciosos.
                // playSound usa Audio compartilhado — chamadas adicionais
                // dentro dos handlers apenas reiniciam o mesmo som, sem
                // tocar duas vezes.
                playSound("/sounds/click.mp3");

                // Etapa 3: aposta
                if (gameState.stage === 3 && gameState.subStep === 1) {
                  handleS3SectorBet(index);
                  return;
                }
                // Giros reflexivos: apostar em um setor
                if (gameState.stage === 2 && gameState.subStep === 6.201 && s2SpinReflection.phase === 'betting') {
                  const clickedColor = gameState.sectors[index]?.colorName;
                  if (!clickedColor) return;
                  setS2SpinReflection(prev => ({ ...prev, bet1Color: clickedColor, phase: 'spinning' }));
                  return;
                }
                if (gameState.stage === 2 && gameState.subStep === 6.202 && s2SpinReflection.phase === 'betting') {
                  handleReflectionBetClick(index);
                  return;
                }
                // Treino: identificar setor de menor ângulo
                if (gameState.stage === 2 && trainingState.active && trainingState.phase === 'identify_sector') {
                  handleTrainingSectorClick(index);
                  return;
                }
                // Exercício de união ME
                if (gameState.subStep === 6.56 && unionPhase === 'selecting') {
                  handleUnionSectorClick(index);
                  return;
                }
                // Exercício interativo de disjuntos
                if (gameState.subStep === 6.55 && (disjointExercisePhase === 'selecting_A' || disjointExercisePhase === 'selecting_B')) {
                  handleDisjointSectorClick(index);
                  return;
                }
                // Eventos Complementares — seleção parte 1
                if (gameState.subStep === 6.70 && (compPhase === 'selecting_A' || compPhase === 'selecting_Abar')) {
                  handleCompSectorClick(index);
                  return;
                }
                // Eventos Complementares — seleção cálculo: selectA (partes 3 e 4)
                if ((gameState.subStep === 6.85 || gameState.subStep === 6.90) && compPhase === 'calc_selectA') {
                  toggleSectorSelection(index);
                  return;
                }
                // Eventos Complementares — seleção cálculo: selectĀ (partes 3 e 4)
                if ((gameState.subStep === 6.86 || gameState.subStep === 6.91) && compPhase === 'calc_selectAbar') {
                  handleCompSectorClick(index);
                  return;
                }
                // Etapa 2: identificação do menor setor (subStep 3, STATE 0)
                if (gameState.stage === 2 && gameState.subStep === 3 && s2RatioPhase === 'init') {
                  handleRatioSectorClick(index);
                  return;
                }
                const clickedColor = gameState.sectors[index]?.colorName;
                // Etapa 2: aposta na investigação inicial
                if (gameState.stage === 2 && gameState.subStep === 0.15) {
                  handleS2Bet(clickedColor);
                  return;
                }
                // Etapa 2: confirmação do resultado na investigação inicial ou retry reflexão
                if (gameState.stage === 2 && (gameState.subStep === 0.16 || gameState.subStep === 0.195)) {
                  handleS2Confirmation(clickedColor);
                  return;
                }
                if (gameState.subStep === 1.1) {
                  // Fase de aposta
                  handleExperimentationBet(clickedColor);
                } else if (gameState.subStep === 1.17) {
                  // Fase de confirmação
                  handleResultConfirmation(clickedColor);
                } else {
                  // Outros modos de seleção
                  toggleSectorSelection(index);
                }
              }}
              highlightSelected={
                (gameState.subStep >= 6.42 && gameState.subStep <= 6.44) ||
                (gameState.subStep >= 6.66 && gameState.subStep <= 6.68) ||
                (gameState.subStep === 6.55 && (disjointExercisePhase === 'correct' || disjointExercisePhase === 'wrong')) ||
                (gameState.subStep === 6.56 && (unionPhase === 'filling_prob' || unionPhase === 'final_calc' || unionPhase === 'activity_success')) ||
                (gameState.subStep === 6.70 && (compPhase === 'intro' || compPhase === 'show_both' || compPhase === 'selecting_Abar' || compPhase === 'wrong_Abar')) ||
                (gameState.subStep >= 6.86 && gameState.subStep <= 6.88) ||
                (gameState.subStep === 6.90 && compPhase === 'calc_pa') ||
                (gameState.subStep >= 6.91 && gameState.subStep <= 6.93) ||
                (gameState.stage === 2 && gameState.subStep === 2.9 && progressiveReadingStep === 5) ||
                (gameState.stage === 2 && gameState.subStep === 3 && s2UnitSectorIndex >= 0) ||
                (gameState.stage === 2 && (gameState.subStep === 6.201 || gameState.subStep === 6.202) && s2SpinReflection.phase === 'spinning') ||
                (gameState.stage === 3 && s3State.betSector >= 0) ||
                (gameState.stage === 3 && gameState.subStep === 0.5 && !!selectedOption && selectedOption !== 'iguais')
              }
            />
            </div>
          )}

          {/* Feedback contextual: guiado calc_selectA sem setores selecionados */}
          {gameState.stage === 1 && gameState.subStep === 6.85 && compPhase === 'calc_selectA' && compIsGuided && gameState.selectedSectors.length === 0 && (
            <p className="ds-small-bold text-brand-otimath-pure animate-pulse text-center">
              Selecione os setores de A
            </p>
          )}

          {/* Spin button */}
          {shouldShowSpinButton && !showAutoSpinButtons && (
            <Button
              style="primary"
              size="medium"
              icon={<Play />}
              onClick={spinRoulette}
              disabled={disabledSpinButton || gameState.isSpinning || gameState.pendingRegistration}
            >
              {gameState.isSpinning ? 'Girando...' : 'Sortear'}
            </Button>
          )}

          {/* Botão Sortear para fase de experimentação */}
          {gameState.subStep === 1.1 && experimentationState.wageredColor && !gameState.isSpinning && (
            <Button
              style="primary"
              size="medium"
              icon={<Play />}
              onClick={spinRouletteExperimentation}
              disabled={disabledSpinButton || gameState.isSpinning}
            >
              Sortear
            </Button>
          )}

          {/* Indicador de cor apostada e sorteada na fase de experimentação.
              Restrito aos subSteps da experimentação (stage 1) para não aparecer
              durante os giros automáticos posteriores (50/100/150/200). */}
          {(gameState.stage === 1 && (gameState.subStep === 1.1 || gameState.subStep === 1.17) && experimentationState.wageredColor) && (
            <div className="bg-brand-otimath-lightest p-micro rounded-md border border-brand-otimath-light text-center" role="status" aria-live="polite">
              <p className="ds-small text-brand-otimath-dark">
                <strong>Aposta:</strong> {experimentationState.wageredColor}
                {(gameState.subStep === 1.17 || experimentationState.colorRevealed) && (
                  <> | <strong>Sorteada:</strong> {experimentationState.colorRevealed ? experimentationState.internalDrawnColor : '?'}</>
                )}
              </p>
            </div>
          )}

          {/* Color registration buttons */}
          {shouldShowColorRegistration && (
            <div className="flex flex-col gap-y-micro items-center bg-neutral-white p-macro rounded-md border border-brand-otimath-light">
              <p className="ds-small-bold text-brand-otimath-pure" id="color-reg-label">Registre a cor que saiu:</p>
              <div className="flex flex-wrap gap-micro justify-center" role="group" aria-labelledby="color-reg-label">
                {uniqueColorNames.map((colorName) => (
                  <Button
                    key={colorName}
                    style="secondary"
                    size="small"
                    onClick={() => registerColor(colorName)}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-micro border border-neutral-medium"
                      style={{ backgroundColor: ROULETTE_COLORS[colorName] }}
                      aria-hidden="true"
                    ></span>
                    {colorName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Auto spin buttons */}
          {showAutoSpinButtons && (
            <div className="flex flex-wrap gap-micro justify-center" role="group" aria-label="Opções de giros automáticos">
              {gameState.autoSpinBatches.map((batch, index) => (
                <Button
                  key={batch}
                  style={index <= gameState.currentAutoBatchIndex ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => startAutoSpins(batch)}
                  disabled={index !== gameState.currentAutoBatchIndex || gameState.isAutoSpinning}
                >
                  {batch} giros
                </Button>
              ))}
            </div>
          )}

          {/* Spin counter (Etapas 1 e 2 apenas) */}
          {gameState.totalSpins > 0 && gameState.stage !== 3 && (
            <p className="ds-small text-neutral-dark" aria-live="polite">
              Total de giros: <strong>{gameState.totalSpins}</strong>
              {gameState.selectedColor && (
                <span> | Último resultado: <strong>{gameState.selectedColor}</strong></span>
              )}
            </p>
          )}
        </div>

        {/* Right side - Questions, Tables, Charts */}
        <div className="flex-1 flex flex-col gap-y-xxs max-w-[500px] w-full max-lg:items-stretch max-lg:mx-auto" role="region" aria-label="Atividades e perguntas">
          {/* Info box */}
          {showInfoBox && (
            <RouletteInfoBox
              type={infoBoxContent.type}
              title={infoBoxContent.title}
              message={infoBoxContent.message}
              showConfirmButton={
                // Esconder botão "Li." até ver 3 exemplos (determinístico, aleatório)
                gameState.subStep === 0.1 ? deterministicExamplesViewed >= 3 :
                gameState.subStep === 0.3 ? randomExamplesViewed >= 3 :
                // Disjuntos: "Li." só aparece após 3 exemplos (1 passivo + 2 interativos) e exercício correto
                gameState.subStep === 6.55 ? disjointExercisePhase === 'correct' && disjointExamplesViewed >= 3 :
                // União ME: "Li." aparece nas definições e all_done
                gameState.subStep === 6.56 ? (unionPhase === 'definition1' || unionPhase === 'all_done') :
                // Eventos Complementares
                gameState.subStep === 6.70 ? (compPhase === 'intro' || (compPhase === 'show_both' && compExamplesViewed >= 3)) :
                gameState.subStep === 6.80 ? true :
                // Eventos Complementares — cálculo: enunciado do problema
                (gameState.subStep === 6.85 || gameState.subStep === 6.90) && compPhase === 'calc_enunciado' ? true :
                // Eventos Complementares — cálculo: showBoth confirma transição
                (gameState.subStep === 6.87 || gameState.subStep === 6.92) && compPhase === 'calc_showBoth' ? true :
                // Sem "Li." durante outros cálculos (6.85-6.93)
                (gameState.subStep >= 6.85 && gameState.subStep <= 6.93) ? false :
                true
              }
              onConfirm={() => { confirmReadingBalao(); handleInfoBoxConfirm(); }}
              confirmButtonText={
                gameState.subStep === 6.70 && compPhase === 'intro' ? 'Agora é sua vez!' :
                gameState.subStep === 6.70 && compPhase === 'show_both' && compExamplesViewed >= 3 ? 'PRÓXIMO!' :
                (gameState.subStep === 6.85 || gameState.subStep === 6.90) && compPhase === 'calc_enunciado' ? 'Veja!' :
                (gameState.stage === 2 && gameState.subStep === 0.19) ? 'Girar novamente' :
                'Li.'
              }
              secondaryButtonText={
                // Botão "Ver mais exemplos" para experimento determinístico
                gameState.subStep === 0.1 && deterministicExamplesViewed < 3
                  ? 'Clique para ver mais exemplos!'
                  // Botão "Ver mais exemplos" para experimento aleatório
                  : gameState.subStep === 0.3 && randomExamplesViewed < 3
                    ? 'Clique para ver mais exemplos!'
                    // Eventos disjuntos: 1º exemplo passivo, depois exercícios interativos
                    : gameState.subStep === 6.55 && disjointExercisePhase === 'none'
                      ? 'Agora é sua vez!'
                      : gameState.subStep === 6.55 && disjointExercisePhase === 'selecting_A'
                        ? 'Confirmar evento A ✓'
                        : gameState.subStep === 6.55 && disjointExercisePhase === 'selecting_B'
                          ? 'Confirmar evento B ✓'
                          : gameState.subStep === 6.55 && disjointExercisePhase === 'wrong'
                            ? 'Tentar novamente'
                            : gameState.subStep === 6.55 && disjointExercisePhase === 'correct' && disjointExamplesViewed < 3
                              ? 'Próximo exemplo!'
                              // União ME: botões de ação
                              : gameState.subStep === 6.56 && unionPhase === 'definition2'
                                ? 'Agora é sua vez!'
                                : gameState.subStep === 6.56 && unionPhase === 'activity_success'
                                  ? (unionActivityNum < unionMaxActivities ? 'Próxima atividade!' : undefined)
                                  // Eventos Complementares — parte 1
                              : gameState.subStep === 6.70 && compPhase === 'selecting_A'
                                ? 'Confirmar evento A ✓'
                                : gameState.subStep === 6.70 && compPhase === 'selecting_Abar'
                                  ? 'Confirmar evento Ā ✓'
                                  : gameState.subStep === 6.70 && (compPhase === 'wrong_A' || compPhase === 'wrong_Abar')
                                    ? 'Tentar novamente'
                                    : gameState.subStep === 6.70 && compPhase === 'show_both' && compExamplesViewed < 3
                                      ? 'Próximo exemplo!'
                                      : gameState.subStep === 6.70 && compPhase === 'show_both' && compExamplesViewed >= 3
                                        ? 'Ver mais exemplos'
                                        // Botão "Treine mais" para exercícios
                                        : (gameState.subStep === 6.45 || gameState.subStep === 6.69) && infoBoxContent.type === 'success'
                                          ? 'TREINE MAIS UMA VEZ!'
                                          : undefined
              }
              onSecondaryClick={
                // Ver mais exemplos determinístico
                gameState.subStep === 0.1 && deterministicExamplesViewed < 3
                  ? handleSeeMoreDeterministicExamples
                  // Ver mais exemplos aleatório
                  : gameState.subStep === 0.3 && randomExamplesViewed < 3
                    ? handleSeeMoreRandomExamples
                    // Eventos disjuntos: exercício interativo
                    : gameState.subStep === 6.55 && disjointExercisePhase === 'none'
                      ? handleStartDisjointExercise
                      : gameState.subStep === 6.55 && disjointExercisePhase === 'selecting_A'
                        ? handleDisjointConfirmA
                        : gameState.subStep === 6.55 && disjointExercisePhase === 'selecting_B'
                          ? handleDisjointConfirmB
                          : gameState.subStep === 6.55 && disjointExercisePhase === 'wrong'
                            ? handleDisjointRetry
                            : gameState.subStep === 6.55 && disjointExercisePhase === 'correct' && disjointExamplesViewed < 3
                              ? handleStartDisjointExercise
                              // União ME: ações
                              : gameState.subStep === 6.56 && unionPhase === 'definition2'
                                ? handleInfoBoxConfirm
                                : gameState.subStep === 6.56 && unionPhase === 'activity_success' && unionActivityNum < unionMaxActivities
                                  ? handleUnionNextActivity
                              // Eventos Complementares — parte 1
                              : gameState.subStep === 6.70 && compPhase === 'selecting_A'
                                ? handleCompConfirmA
                                : gameState.subStep === 6.70 && compPhase === 'selecting_Abar'
                                  ? handleCompConfirmAbar
                                  : gameState.subStep === 6.70 && (compPhase === 'wrong_A' || compPhase === 'wrong_Abar')
                                    ? handleCompRetry
                                    : gameState.subStep === 6.70 && compPhase === 'show_both' && compExamplesViewed < 3
                                      ? handleStartCompExercise
                                      : gameState.subStep === 6.70 && compPhase === 'show_both' && compExamplesViewed >= 3
                                        ? handleCompSeeMoreExamples
                                        // Treinar exercício novamente
                                        : gameState.subStep === 6.45 && infoBoxContent.type === 'success'
                                          ? restartExercise
                                          : gameState.subStep === 6.69 && infoBoxContent.type === 'success'
                                            ? restartChallenge1
                                            : undefined
              }
            >
              {/* Contador de progresso da leitura progressiva (Etapa 2, subStep 2.9) */}
              {gameState.stage === 2 && gameState.subStep === 2.9 && progressiveReadingStep < 5 && (
                <p className="ds-small text-neutral-dark mt-micro italic text-right">
                  {progressiveReadingStep + 1} / 5
                </p>
              )}
            </RouletteInfoBox>
          )}

          {/* SubStep 1: Pergunta do experimento aleatório (múltipla escolha) */}
          {currentQuestion && gameState.stage === 1 && gameState.subStep === 1 && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 1.25: Características do experimento aleatório (múltipla seleção - checkboxes) */}
          {gameState.stage === 1 && gameState.subStep === 1.25 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                Características do Experimento Aleatório
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Um experimento aleatório é aquele que satisfaz simultaneamente as seguintes características:
                <br />
                <span className="text-neutral-dark">(Marque todas que julgar verdadeiro considerando os exemplos vistos anteriormente)</span>
              </p>
              <div className="flex flex-col gap-y-micro mb-macro">
                {randomExperimentCharacteristics.map((characteristic, index) => (
                  <div
                    key={index}
                    role="checkbox"
                    aria-checked={selectedCharacteristics.includes(index)}
                    tabIndex={0}
                    className={`flex items-start gap-x-micro p-micro rounded-md cursor-pointer transition-colors ${
                      selectedCharacteristics.includes(index)
                        ? 'bg-brand-otimath-lightest border border-brand-otimath-pure'
                        : 'bg-neutral-lightest border border-neutral-lighter hover:bg-neutral-lighter'
                    }`}
                    onClick={() => toggleCharacteristic(index)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleCharacteristic(index);
                      }
                    }}
                  >
                    <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center mt-0.5 ${
                      selectedCharacteristics.includes(index)
                        ? 'bg-brand-otimath-pure border-brand-otimath-pure'
                        : 'bg-neutral-white border-neutral-medium'
                    }`}>
                      {selectedCharacteristics.includes(index) && (
                        <Check size={14} className="text-neutral-white" aria-hidden="true" />
                      )}
                    </div>
                    <span className="ds-small text-neutral-darkest">{characteristic}</span>
                  </div>
                ))}
              </div>
              <p className="ds-caption text-neutral-dark mb-micro">
                Características marcadas: {selectedCharacteristics.length} de {randomExperimentCharacteristics.length}
              </p>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={selectedCharacteristics.length === 0}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 2: Pergunta do espaço amostral (texto) */}
          {gameState.stage === 1 && gameState.subStep === 2 && (
            <RouletteQuestion
              question="Qual o espaço amostral desse experimento aleatório?"
              type="text"
              textInput={{
                ...sampleSpaceInput,
                placeholder: 'S = {cor1, cor2, ...}',
                setValue: (val) => setSampleSpaceInput(prev => ({ ...prev, value: val }))
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 3: Quantidade de elementos (texto) */}
          {gameState.stage === 1 && gameState.subStep === 3 && (
            <RouletteQuestion
              question="Quantos elementos possui o espaço amostral desse experimento aleatório?"
              type="text"
              inputPrefix="n(S) ="
              textInput={{
                ...sampleSpaceCountInput,
                type: 'natural-number',
                placeholder: 'Digite um número',
                setValue: (val) => setSampleSpaceCountInput(prev => ({ ...prev, value: val, type: 'natural-number' }))
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 4: Reflexão sim/não */}
          {currentQuestion && gameState.stage === 1 && gameState.subStep === 4 && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="yes-no"
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 5: Classificação equiprovável/não equiprovável */}
          {currentQuestion && gameState.stage === 1 && gameState.subStep === 5 && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 5.7: Probabilidade do evento certo */}
          {gameState.stage === 1 && gameState.subStep === 5.7 && (
            <RouletteQuestion
              question="Qual a chance você atribui ao evento certo: girar um disco e o ponteiro indicar alguma das cores presentes no disco?"
              hint="Atribua um número de 0% a 100%. Se preferir, utilize a forma decimal, atribuindo um valor de 0 a 1 (inclusive)."
              type="text"
              textInput={{
                ...theoreticalQuestion1Input,
                placeholder: 'Digite um número',
                setValue: (val) => theoreticalQuestion1Input.setValue?.(val)
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 6: Probabilidades teóricas */}
          {gameState.stage === 1 && gameState.subStep === 6 && Object.keys(probabilityInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Probabilidade de Cada Cor
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Baseando-se em elementos de simetria, atribua as probabilidades de o ponteiro parar em cada cor do disco.
              </p>
              <div className="flex flex-col gap-y-micro">
                {Object.keys(probabilityInputs).map((color) => (
                  <div key={color} className="flex items-center gap-x-macro">
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-micro border border-neutral-medium"
                      style={{ backgroundColor: ROULETTE_COLORS[color] }}
                    ></span>
                    <span className="ds-small w-[80px]">{color}:</span>
                    <TextInput
                      textInput={{
                        ...probabilityInputs[color],
                        placeholder: 'a/b',
                        styles: 'w-[100px] text-center'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-macro">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={disabledCheckButton}
                >
                  Verificar Probabilidades
                </Button>
              </div>
            </div>
          )}

          {/* SubStep 6.1: Probabilidade do Evento Composto - Casos Favoráveis */}
          {gameState.stage === 1 && gameState.subStep === 6.1 && gameState.compositeEventE.length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Probabilidade do Evento Composto
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Considere o evento composto
              </p>
              <p className="ds-body-bold text-brand-otimath-dark mb-macro text-center">
                E = &#123;{gameState.compositeEventE.join(', ')}&#125;
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Esse evento é formado por alguns resultados simples do experimento aleatório de girar o disco.
              </p>
              <RouletteQuestion
                question="Qual é o número de elementos (casos favoráveis) do evento E?"
                type="text"
                inputPrefix="n(E) ="
                textInput={{
                  ...favorableCasesInput,
                  type: 'natural-number',
                  placeholder: 'Digite um número',
                  setValue: (val) => favorableCasesInput.setValue?.(val)
                }}
                onCheck={checkAnswer}
                disabled={disabledCheckButton}
              />
            </div>
          )}

          {/* SubStep 6.41: Exercício Dinâmico - Seleção dos setores */}
          {gameState.stage === 1 && gameState.subStep === 6.41 && gameState.exerciseEventE.length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Exercício — Aplicação do Modelo Probabilístico
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Clique nos setores do disco que correspondem aos casos favoráveis ao evento:
              </p>
              <p className="ds-body-bold text-brand-otimath-dark mb-macro text-center">
                E = ocorre {gameState.exerciseEventE.join(' ou ')}
              </p>
              {gameState.exerciseEventE.length >= 2 && (() => {
                const { exampleText, countText, union, reading, eventsList, complement } = generateUnionNoteText(gameState.exerciseEventE.length);
                return (
                  <div className="mb-macro p-micro rounded-md bg-[#EEF2FF] border-l-4 border-[#6366F1]">
                    <p className="ds-small text-neutral-darkest">
                      <strong>Nota (OU – sentido matemático):</strong> Quando o enunciado diz &quot;{exampleText}&quot;, isso quer dizer &quot;pelo menos um dos {countText}&quot;. Então, {eventsList} {complement}. {exampleText} significa <strong>{union}</strong> ({reading}).
                    </p>
                  </div>
                );
              })()}
              <div className="bg-neutral-lightest p-macro rounded-md border border-neutral-lighter mb-macro">
                <p className="ds-small text-neutral-dark mb-micro">Casos favoráveis selecionados:</p>
                <p className="ds-body-bold text-brand-otimath-dark text-center">
                  E = &#123;{gameState.selectedSectors.length > 0
                    ? gameState.selectedSectors.map(i => gameState.sectors[i]?.colorName).join(', ')
                    : '...'
                  }&#125;
                </p>
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={gameState.selectedSectors.length === 0}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 6.42: Exercício Dinâmico - Digitar n(E) */}
          {gameState.stage === 1 && gameState.subStep === 6.42 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Exercício — Aplicação do Modelo Probabilístico
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Evento: <strong>E = &#123;{gameState.exerciseEventE.join(', ')}&#125;</strong>
              </p>
              <RouletteQuestion
                question="Digite o número de casos favoráveis ao evento E."
                type="text"
                inputPrefix="n(E) ="
                textInput={{
                  ...exerciseNEInput,
                  placeholder: 'Digite um número',
                  setValue: (val) => exerciseNEInput.setValue?.(val)
                }}
                onCheck={checkAnswer}
                disabled={disabledCheckButton}
              />
            </div>
          )}

          {/* SubStep 6.43: Exercício Dinâmico - Digitar n(S) */}
          {gameState.stage === 1 && gameState.subStep === 6.43 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Exercício — Aplicação do Modelo Probabilístico
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Evento: <strong>E = &#123;{gameState.exerciseEventE.join(', ')}&#125;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                n(E) = {gameState.exerciseEventE.length}
              </p>
              <RouletteQuestion
                question="Digite o número de resultados possíveis do experimento aleatório (número de elementos do espaço amostral)."
                type="text"
                inputPrefix="n(S) ="
                textInput={{
                  ...exerciseNSInput,
                  placeholder: 'Digite um número',
                  setValue: (val) => exerciseNSInput.setValue?.(val)
                }}
                onCheck={checkAnswer}
                disabled={disabledCheckButton}
              />
            </div>
          )}

          {/* SubStep 6.44: Exercício Dinâmico - Calcular P(E) */}
          {gameState.stage === 1 && gameState.subStep === 6.44 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Exercício — Aplicação do Modelo Probabilístico
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Evento: <strong>E = &#123;{gameState.exerciseEventE.join(', ')}&#125;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-micro">
                n(E) = {gameState.exerciseEventE.length}
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                n(S) = {gameState.sectors.length}
              </p>
              <p className="ds-body text-neutral-dark mb-macro">
                Ao girar o disco uma única vez, qual a probabilidade de ocorrer o evento E?
              </p>
              <div className="flex items-center justify-center gap-2 mb-macro">
                <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">P(E) =</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    value={exercisePENumeratorInput.value}
                    onChange={(e) => exercisePENumeratorInput.setValue?.(e.target.value)}
                    placeholder="?"
                    className={`w-16 text-center bg-transparent outline-none ds-body ${
                      exercisePENumeratorInput.error ? 'text-feedback-error-dark' : ''
                    }`}
                  />
                  <div className={`w-16 h-0.5 ${exercisePENumeratorInput.error || exercisePEDenominatorInput.error ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                  <input
                    type="text"
                    value={exercisePEDenominatorInput.value}
                    onChange={(e) => exercisePEDenominatorInput.setValue?.(e.target.value)}
                    placeholder="?"
                    className={`w-16 text-center bg-transparent outline-none ds-body ${
                      exercisePEDenominatorInput.error ? 'text-feedback-error-dark' : ''
                    }`}
                  />
                </div>
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={!exercisePENumeratorInput.value || !exercisePEDenominatorInput.value}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 6.56: Probabilidade da União de Eventos ME - Exercício */}
          {gameState.stage === 1 && gameState.subStep === 6.56 && (unionPhase === 'selecting' || unionPhase === 'filling_prob' || unionPhase === 'final_calc') && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Atividade {unionActivityNum} de {unionMaxActivities} — Probabilidade da União
              </h3>

              {/* Definições dos eventos */}
              <div className="mb-macro space-y-micro">
                {unionEvents.map((evt, i) => {
                  const COLORS = ['#FFD700', '#00E5FF', '#FF69B4', '#7CFC00', '#FF8C00', '#BA55D3'];
                  const color = COLORS[i] || COLORS[0];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="ds-small text-neutral-dark">
                        <strong>{evt.label}</strong> = {evt.description}
                        {evt.completed && (
                          <span className="text-feedback-positive ml-2">
                            — P({evt.label}) = {evt.probNumerator}/{evt.probDenominator} ✓
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Fase: selecting */}
              {unionPhase === 'selecting' && unionCurrentEventIdx < unionEvents.length && (
                <div>
                  <p className="ds-body text-neutral-dark mb-macro">
                    Marque no disco os setores que pertencem ao evento <strong>{unionEvents[unionCurrentEventIdx].label}</strong>.
                  </p>
                  <p className="ds-caption text-neutral-dark mb-macro">
                    Setores selecionados: {unionSelectedSectors.length}
                  </p>
                  <Button
                    style="primary"
                    size="small"
                    icon={<Check />}
                    onClick={handleUnionConfirmSelection}
                    disabled={unionSelectedSectors.length === 0}
                  >
                    Conferir
                  </Button>
                </div>
              )}

              {/* Fase: filling_prob */}
              {unionPhase === 'filling_prob' && unionCurrentEventIdx < unionEvents.length && (
                <div>
                  <p className="ds-body text-neutral-dark mb-macro">
                    Calcule <strong>P({unionEvents[unionCurrentEventIdx].label})</strong>:
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-macro">
                    <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">P({unionEvents[unionCurrentEventIdx].label}) =</span>
                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={unionProbNumInput.value}
                        onChange={(e) => setUnionProbNumInput(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="?"
                        className={`w-16 text-center bg-transparent outline-none ds-body ${
                          unionProbNumInput.error ? 'text-feedback-error-dark' : ''
                        }`}
                      />
                      <div className={`w-16 h-0.5 ${unionProbNumInput.error || unionProbDenInput.error ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                      <input
                        type="text"
                        value={unionProbDenInput.value}
                        onChange={(e) => setUnionProbDenInput(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="?"
                        className={`w-16 text-center bg-transparent outline-none ds-body ${
                          unionProbDenInput.error ? 'text-feedback-error-dark' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <Button
                    style="primary"
                    size="small"
                    icon={<Check />}
                    onClick={handleUnionConfirmProb}
                    disabled={!unionProbNumInput.value || !unionProbDenInput.value}
                  >
                    Conferir
                  </Button>
                </div>
              )}

              {/* Fase: final_calc */}
              {unionPhase === 'final_calc' && (
                <div>
                  {/* Listar todas as P individuais */}
                  <div className="mb-macro p-micro rounded-md bg-[#EEF2FF] border-l-4 border-[#6366F1]">
                    <p className="ds-small text-neutral-darkest mb-micro">
                      <strong>Lembre-se:</strong> Para eventos mutuamente exclusivos:
                    </p>
                    <p className="ds-small text-neutral-darkest">
                      <span className="whitespace-nowrap">P({unionEvents.map(e => e.label).join('∪')})</span> = <span className="whitespace-nowrap">{unionEvents.map(e => `P(${e.label})`).join(' + ')}</span> = <span className="whitespace-nowrap">{unionEvents.map(e => `${e.probNumerator}/${e.probDenominator}`).join(' + ')}</span>
                    </p>
                  </div>
                  <p className="ds-body text-neutral-dark mb-macro">
                    Calcule <strong className="whitespace-nowrap">P({unionEvents.map(e => e.label).join('∪')})</strong>:
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-macro">
                    <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">P({unionEvents.map(e => e.label).join('∪')}) =</span>
                    <div className="flex flex-col items-center">
                      <input
                        type="text"
                        value={unionFinalNumInput.value}
                        onChange={(e) => setUnionFinalNumInput(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="?"
                        className={`w-16 text-center bg-transparent outline-none ds-body ${
                          unionFinalNumInput.error ? 'text-feedback-error-dark' : ''
                        }`}
                      />
                      <div className={`w-16 h-0.5 ${unionFinalNumInput.error || unionFinalDenInput.error ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                      <input
                        type="text"
                        value={unionFinalDenInput.value}
                        onChange={(e) => setUnionFinalDenInput(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="?"
                        className={`w-16 text-center bg-transparent outline-none ds-body ${
                          unionFinalDenInput.error ? 'text-feedback-error-dark' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <Button
                    style="primary"
                    size="small"
                    icon={<Check />}
                    onClick={handleUnionConfirmFinal}
                    disabled={!unionFinalNumInput.value || !unionFinalDenInput.value}
                  >
                    Conferir
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* SubStep 6.6: Desafio Dinâmico 1 - Seleção de setores (Conectivo Variável) */}
          {gameState.stage === 1 && gameState.subStep === 6.6 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                {gameState.challenge1Connective === 'ou' ? 'Desafio — União de Eventos' : 'Desafio — Interseção de Eventos'}
              </h3>
              <p className="ds-body-bold text-brand-otimath-dark mb-macro">
                {gameState.challenge1InterProblemType !== null
                  ? <>Calcule a probabilidade de, ao girar o disco uma única vez, obter um número <strong>{gameState.challenge1PropertyY}</strong>.</>
                  : <>Calcule a probabilidade de, ao girar o disco uma única vez, ocorrer {gameState.challenge1EventXText} {gameState.challenge1Connective.toUpperCase()} ocorrer um número {gameState.challenge1PropertyY}.</>
                }
              </p>
              {gameState.challenge1Connective === 'ou' ? (() => {
                const n = gameState.challenge1EventXText.split(' ou ').length + 1;
                const { exampleText, countText, union, reading, eventsList, complement } = generateUnionNoteText(n);
                return (
                  <div className="mb-macro p-micro rounded-md bg-[#EEF2FF] border-l-4 border-[#6366F1]">
                    <p className="ds-small text-neutral-darkest">
                      <strong>Nota (OU – sentido matemático):</strong> Quando o enunciado diz &quot;{exampleText}&quot;, isso quer dizer &quot;pelo menos um dos {countText}&quot;. Então, {eventsList} {complement}. {exampleText} significa <strong>{union}</strong> ({reading}).
                    </p>
                  </div>
                );
              })() : (
                <div className="mb-macro p-micro rounded-md bg-[#FEF3C7] border-l-4 border-[#F59E0B]">
                  <p className="ds-small text-neutral-darkest">
                    <strong>Nota (E – sentido matemático):</strong> Quando o enunciado diz &quot;A e B&quot;, isso quer dizer que as duas condições devem acontecer juntas. Então, só conta quando acontece A e acontece B ao mesmo tempo (no mesmo resultado). A e B significa <strong className="text-base">A∩B</strong> (A Interseção B).
                  </p>
                </div>
              )}
              <p className="ds-small text-neutral-dark mb-macro">
                Clique nos setores do disco que são <strong>casos favoráveis</strong> ao evento.
              </p>
              <p className="ds-caption text-neutral-dark mb-macro">
                Setores selecionados: {gameState.selectedSectors.length}
              </p>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={gameState.selectedSectors.length === 0}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 6.66: Desafio Dinâmico 1 - Digitar n(E) */}
          {gameState.stage === 1 && gameState.subStep === 6.66 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                Desafio — Contagem de Casos
              </h3>
              <p className="ds-small text-brand-otimath-dark mb-macro">
                <strong>E = &#123;{gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}&#125;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Digite o número de casos favoráveis ao evento.
              </p>
              <div className="flex items-center gap-x-micro mb-macro">
                <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">n(E) =</span>
                <input
                  type="text"
                  value={exerciseNEInput.value}
                  onChange={(e) => exerciseNEInput.setValue?.(e.target.value)}
                  placeholder="?"
                  className={`w-20 text-center border-b-2 bg-transparent outline-none ds-body ${
                    exerciseNEInput.error ? 'border-feedback-error-dark' : 'border-brand-otimath-dark'
                  }`}
                />
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={!exerciseNEInput.value}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 6.67: Desafio Dinâmico 1 - Digitar n(S) */}
          {gameState.stage === 1 && gameState.subStep === 6.67 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                Desafio — Casos Possíveis
              </h3>
              <p className="ds-small text-brand-otimath-dark mb-macro">
                <strong>E = &#123;{gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}&#125;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Digite o número de resultados possíveis do experimento.
              </p>
              <div className="flex items-center gap-x-micro mb-macro">
                <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">n(S) =</span>
                <input
                  type="text"
                  value={exerciseNSInput.value}
                  onChange={(e) => exerciseNSInput.setValue?.(e.target.value)}
                  placeholder="?"
                  className={`w-20 text-center border-b-2 bg-transparent outline-none ds-body ${
                    exerciseNSInput.error ? 'border-feedback-error-dark' : 'border-brand-otimath-dark'
                  }`}
                />
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={!exerciseNSInput.value}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubStep 6.68: Desafio Dinâmico 1 - Calcular P(E) */}
          {gameState.stage === 1 && gameState.subStep === 6.68 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                Desafio — Probabilidade
              </h3>
              <p className="ds-small text-brand-otimath-dark mb-macro">
                <strong>E = &#123;{gameState.selectedSectors.map(i => `${gameState.sectors[i]?.colorName}(${gameState.challenge1SectorNumbers[i]})`).join(', ')}&#125;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Agora calcule a probabilidade.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">P(E) =</span>
                <div className="flex flex-col items-center py-2">
                  <input
                    type="text"
                    value={exercisePENumeratorInput.value}
                    onChange={(e) => exercisePENumeratorInput.setValue?.(e.target.value)}
                    placeholder="?"
                    className={`w-16 h-8 text-center bg-transparent outline-none ds-body ${
                      exercisePENumeratorInput.error ? 'text-feedback-error-dark' : ''
                    }`}
                  />
                  <div className={`w-16 h-0.5 my-1 ${exercisePENumeratorInput.error || exercisePEDenominatorInput.error ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                  <input
                    type="text"
                    value={exercisePEDenominatorInput.value}
                    onChange={(e) => exercisePEDenominatorInput.setValue?.(e.target.value)}
                    placeholder="?"
                    className={`w-16 h-8 text-center bg-transparent outline-none ds-body ${
                      exercisePEDenominatorInput.error ? 'text-feedback-error-dark' : ''
                    }`}
                  />
                </div>
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={!exercisePENumeratorInput.value || !exercisePEDenominatorInput.value}
              >
                Conferir
              </Button>
            </div>
          )}

          {/* SubSteps 6.85/6.90: Selecionar setores de A (cálculo complementar) */}
          {gameState.stage === 1 && (gameState.subStep === 6.85 || gameState.subStep === 6.90) && compPhase === 'calc_selectA' && (
            compIsGuided ? (
              <div className="flex flex-col gap-y-micro">
                {/* Header – título e instrução */}
                <div className="bg-brand-otimath-lightest p-macro rounded-md flex items-start gap-x-micro">
                  <Info size={20} className="text-brand-otimath-pure mt-nano shrink-0" />
                  <div>
                    <h3 className="ds-body-bold text-brand-otimath-pure mb-nano">
                      Cálculo da Probabilidade de Eventos Complementares
                    </h3>
                    <p className="ds-small text-brand-otimath-dark">
                      Selecione os setores do evento A no disco e clique em Conferir.
                    </p>
                  </div>
                </div>
                {/* Card – definição do evento */}
                <div className="bg-brand-otimath-lightest p-macro rounded-md border-l-4 border-brand-otimath-pure">
                  <p className="ds-small-bold text-brand-otimath-dark mb-micro">
                    Primeiro calcularemos P(A)
                  </p>
                  <p className="ds-small text-brand-otimath-dark">
                    Evento A = &quot;<strong>{gameState.compEventA?.textA}</strong>&quot;
                  </p>
                </div>
                {/* Botão Conferir — fica destacado pelo próprio
                    contraste do estilo `primary` quando habilitado.
                    Removido `animate-pulse` que ficava trocando opacidade
                    indefinidamente e incomodava visualmente. */}
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={gameState.selectedSectors.length === 0}
                >
                  Conferir
                </Button>
              </div>
            ) : (
              <div className="bg-feedback-success-lighter p-macro rounded-md border-l-4 border-feedback-success-dark">
                <h3 className="ds-body-bold text-brand-otimath-dark mb-micro">
                  {`Treino ${compCalcExampleNum} de 4`}
                </h3>
                <p className="ds-small text-brand-otimath-dark mb-macro">
                  Girando um disco ao acaso, qual a probabilidade de ocorrer o:
                </p>
                <p className="ds-small text-brand-otimath-dark mb-macro">
                  <strong>A = &quot;{gameState.compEventA?.textA}&quot;</strong>
                </p>
                <p className="ds-small text-brand-otimath-dark mb-macro">
                  Primeiro, selecione os setores de A no disco.
                </p>
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={gameState.selectedSectors.length === 0}>
                  Conferir
                </Button>
              </div>
            )
          )}

          {/* SubStep 6.90: P(A) fração (independente apenas) */}
          {gameState.stage === 1 && gameState.subStep === 6.90 && compPhase === 'calc_pa' && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                {`Treino ${compCalcExampleNum} de 4`}
              </h3>
              <p className="ds-small text-brand-otimath-dark mb-macro">
                <strong>A = &quot;{gameState.compEventA?.textA}&quot;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Informe a probabilidade de A como fração.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="ds-body-bold text-brand-otimath-dark whitespace-nowrap">P(A) =</span>
                <div className="flex flex-col items-center py-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={compPaInput.num}
                    onChange={(e) => setCompPaInput(prev => ({ ...prev, num: e.target.value, errNum: false }))}
                    placeholder="?"
                    className={`w-16 h-8 text-center bg-transparent outline-none ds-body ${compPaInput.errNum ? 'text-feedback-error-dark' : ''}`}
                  />
                  <div className={`w-16 h-0.5 my-1 ${compPaInput.errNum || compPaInput.errDen ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={compPaInput.den}
                    onChange={(e) => setCompPaInput(prev => ({ ...prev, den: e.target.value, errDen: false }))}
                    placeholder="?"
                    className={`w-16 h-8 text-center bg-transparent outline-none ds-body ${compPaInput.errDen ? 'text-feedback-error-dark' : ''}`}
                  />
                </div>
              </div>
              <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!compPaInput.num || !compPaInput.den}>
                Conferir
              </Button>
            </div>
          )}

          {/* SubSteps 6.86/6.91: Selecionar setores de Ā (cálculo complementar) */}
          {gameState.stage === 1 && (gameState.subStep === 6.86 || gameState.subStep === 6.91) && compPhase === 'calc_selectAbar' && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                {compIsGuided ? 'Cálculo Guiado — P(Ā)' : `Treino ${compCalcExampleNum} de 4`}
              </h3>
              <p className="ds-small text-brand-otimath-dark mb-macro">
                <strong>A = &quot;{gameState.compEventA?.textA}&quot;</strong>
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Marque no disco o evento complementar <strong>Ā</strong> e clique em Conferir.
              </p>
              {compIsGuided && (
                <p className="ds-small text-neutral-dark mb-macro italic">Dica: marque os setores que NÃO pertencem ao evento A.</p>
              )}
              <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={compUserSelectAbar.length === 0}>
                Conferir
              </Button>
            </div>
          )}

          {/* SubSteps 6.88/6.93: Cadeia de cálculo P(Ā) = 1 − P(A) = n/n − m/n = (n−m)/n */}
          {gameState.stage === 1 && (gameState.subStep === 6.88 || gameState.subStep === 6.93) && compPhase === 'calc_chain' && (() => {
            const ev = gameState.compEventA;
            const m = ev?.indicesA.length || 0;
            const n = gameState.sectors.length;
            const ci = compChainInputs;
            const allFilled = ci.n1 && ci.d1 && ci.n2 && ci.d2 && ci.finalNum && ci.finalDen;
            const step = compStepByStep;
            const isStepMode = step >= 1;
            // Cálculos para o passo a passo
            const decVal = (n - m) / n;
            const decStr = Number.isInteger(decVal) ? decVal.toFixed(1) : decVal % 1 === 0 ? decVal.toString() : (Math.round(decVal * 10000) / 10000).toString().replace('.', ',');
            const pctVal = decVal * 100;
            const pctStr = (Number.isInteger(pctVal) ? pctVal.toFixed(0) : pctVal.toFixed(1).replace('.', ',')) + '%';
            // Fração helper para passo a passo
            // Cores: dourado A (#CC8800 ≈ #FFD700 escuro), ciano Ā (#00838F ≈ #00E5FF escuro), azul padrão (#204478)
            const StepFrac = ({ num, den, highlight, color }: { num: string; den: string; highlight?: boolean; color?: string }) => {
              const c = highlight ? (color || '#2ac000') : '#204478';
              return (
                <div className="flex flex-col items-center">
                  <span className="w-10 h-7 flex items-center justify-center ds-small-bold transition-all duration-300" style={{ color: c }}>{num}</span>
                  <div className="w-10 h-0.5 my-0.5 transition-all duration-300" style={{ backgroundColor: c }}></div>
                  <span className="w-10 h-7 flex items-center justify-center ds-small-bold transition-all duration-300" style={{ color: c }}>{den}</span>
                </div>
              );
            };
            const PlaceholderFrac = () => (
              <div className="flex flex-col items-center">
                <span className="w-10 h-7 flex items-center justify-center ds-small text-neutral-light">?</span>
                <div className="w-10 h-0.5 my-0.5 bg-neutral-light"></div>
                <span className="w-10 h-7 flex items-center justify-center ds-small text-neutral-light">?</span>
              </div>
            );
            return (
              <div className={compIsGuided
                ? 'bg-brand-otimath-lightest p-macro rounded-md border-l-4 border-brand-otimath-pure'
                : 'bg-neutral-white p-macro rounded-md border border-neutral-lighter'
              }>
                <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">
                  {compIsGuided ? 'P(Ā) a partir de P(A)' : 'Cálculo de P(Ā)'}
                </h3>
                {compIsGuided ? (
                  <div className="ds-small text-brand-otimath-dark mb-macro">
                    <p><strong>A = &quot;{ev?.textA}&quot;</strong></p>
                    <p>Ā = complementar de A</p>
                  </div>
                ) : (
                  <div className="ds-small text-brand-otimath-dark mb-macro">
                    <p><strong>A = &quot;{ev?.textA}&quot;</strong></p>
                    <p><strong>Ā = &quot;{ev?.textAbar}&quot;</strong></p>
                  </div>
                )}

                {/* Modo passo a passo */}
                {isStepMode ? (
                  <>
                    {/* Indicador de passo */}
                    <p className="ds-caption text-neutral-dark mb-micro text-center">Passo {Math.min(step, 4)} de 4</p>

                    {/* Linha 1: P(Ā) = 1 − P(A) = frac1 − frac2 = */}
                    {/* sem flex-wrap: a equação precisa ficar numa linha só; em
                        telas estreitas usa scroll horizontal local em vez de
                        quebrar a expressão matemática. */}
                    <div className="flex items-center justify-center gap-1 mb-micro overflow-x-auto">
                      <span className="ds-small-bold text-brand-otimath-dark whitespace-nowrap">P(Ā) = 1 − P(A) =</span>
                      {step >= 1 ? <StepFrac num={`${n}`} den={`${n}`} highlight={step === 1} color={sampleSpaceColor} /> : <PlaceholderFrac />}
                      <span className="ds-small-bold text-brand-otimath-dark">−</span>
                      {step >= 2 ? <StepFrac num={`${m}`} den={`${n}`} highlight={step === 2} color="#FFD700" /> : <PlaceholderFrac />}
                      <span className="ds-small-bold text-brand-otimath-dark">=</span>
                    </div>

                    {/* Linha 2: = (n-m)/n e depois decimal/porcentagem */}
                    <div className="flex items-center justify-center gap-1 mb-macro overflow-x-auto">
                      <span className="ds-small-bold text-brand-otimath-dark">=</span>
                      {step >= 3 ? <StepFrac num={`${n - m}`} den={`${n}`} highlight={step === 3} color="#00E5FF" /> : <PlaceholderFrac />}
                      {step >= 4 && (
                        <>
                          <span className="ds-small-bold text-brand-otimath-dark">=</span>
                          <span className="ds-small-bold transition-all duration-300" style={{ color: '#00E5FF' }}>{decStr}</span>
                          <span className="ds-small-bold text-brand-otimath-dark">=</span>
                          <span className="ds-small-bold transition-all duration-300" style={{ color: '#00E5FF' }}>{pctStr}</span>
                        </>
                      )}
                    </div>

                    {/* Textos auxiliares por passo */}
                    {step === 2 && <p className="ds-caption text-neutral-dark mb-micro text-center italic">Setores de A destacados no disco.</p>}
                    {(step === 3 || step === 4) && <p className="ds-caption text-neutral-dark mb-micro text-center italic">Setores de Ā destacados no disco.</p>}

                    {/* Botões passo a passo */}
                    <div className="flex flex-col gap-micro">
                      {step < 4 ? (
                        <button
                          onClick={() => setCompStepByStep(prev => prev + 1)}
                          className="w-full py-3 rounded-md bg-brand-otimath-pure text-neutral-white ds-body-bold cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
                        >
                          Próximo passo
                        </button>
                      ) : step === 4 ? (
                        <button
                          onClick={() => setCompStepByStep(5)}
                          className="w-full py-3 rounded-md bg-feedback-success-dark text-neutral-white ds-body-bold cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
                        >
                          Concluir
                        </button>
                      ) : null}
                      {step === 5 && (
                        <button
                          onClick={() => setCompStepByStep(0)}
                          className="w-full py-3 rounded-md bg-brand-otimath-pure text-neutral-white ds-body-bold cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
                        >
                          Tentar sozinho
                        </button>
                      )}
                      {step >= 2 && step < 5 && (
                        <button
                          onClick={() => setCompStepByStep(prev => Math.max(prev - 1, 1))}
                          className="w-full py-2 rounded-md border border-neutral-light text-neutral-dark ds-small cursor-pointer hover:bg-neutral-lightest active:opacity-80 transition-all"
                        >
                          Voltar
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Modo manual (original) */}
                    <p className="ds-small text-neutral-dark mb-macro">
                      {compIsGuided ? 'Continue a igualdade preenchendo a fração final.' : 'Continue com o cálculo do complementar de A.'}
                    </p>

                    {/* Linha 1: P(Ā) = 1 − P(A) = □/□ − □/□ = */}
                    <div className="flex items-center justify-center gap-1 mb-micro overflow-x-auto">
                      <span className="ds-small-bold text-brand-otimath-dark whitespace-nowrap">P(Ā) = 1 − P(A) =</span>
                      {/* Fração 1: n/n */}
                      <div className="flex flex-col items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.n1}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, n1: e.target.value, errN1: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errN1 ? 'text-feedback-error-dark' : ''}`}
                        />
                        <div className={`w-10 h-0.5 my-0.5 ${ci.errN1 || ci.errD1 ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.d1}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, d1: e.target.value, errD1: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errD1 ? 'text-feedback-error-dark' : ''}`}
                        />
                      </div>
                      <span className="ds-small-bold text-brand-otimath-dark">−</span>
                      {/* Fração 2: m/n */}
                      <div className="flex flex-col items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.n2}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, n2: e.target.value, errN2: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errN2 ? 'text-feedback-error-dark' : ''}`}
                        />
                        <div className={`w-10 h-0.5 my-0.5 ${ci.errN2 || ci.errD2 ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.d2}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, d2: e.target.value, errD2: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errD2 ? 'text-feedback-error-dark' : ''}`}
                        />
                      </div>
                      <span className="ds-small-bold text-brand-otimath-dark">=</span>
                    </div>

                    {/* Linha 2: = □/□ = decimal_auto = percentage_auto */}
                    <div className="flex items-center justify-center gap-1 mb-macro overflow-x-auto">
                      <span className="ds-small-bold text-brand-otimath-dark">=</span>
                      {/* Fração resultado: (n−m)/n */}
                      <div className="flex flex-col items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.finalNum}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, finalNum: e.target.value, errFinalNum: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errFinalNum ? 'text-feedback-error-dark' : ''}`}
                        />
                        <div className={`w-10 h-0.5 my-0.5 ${ci.errFinalNum || ci.errFinalDen ? 'bg-feedback-error-dark' : 'bg-brand-otimath-dark'}`}></div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ci.finalDen}
                          onChange={(e) => setCompChainInputs(prev => ({ ...prev, finalDen: e.target.value, errFinalDen: false }))}
                          placeholder="?"
                          className={`w-10 h-7 text-center bg-transparent outline-none ds-small ${ci.errFinalDen ? 'text-feedback-error-dark' : ''}`}
                        />
                      </div>
                      {/* Decimal e percentual auto-calculados */}
                      {compChainResult ? (
                        <>
                          <span className="ds-small-bold text-brand-otimath-dark">=</span>
                          <span className="ds-small-bold text-feedback-success-dark">{compChainResult.decimal}</span>
                          <span className="ds-small-bold text-brand-otimath-dark">=</span>
                          <span className="ds-small-bold text-feedback-success-dark">{compChainResult.percentage}</span>
                        </>
                      ) : null}
                    </div>

                    <div className="flex gap-micro">
                      {/* `compChainResult` é preenchido no acerto (P(Ā)
                          = decimal = %). Enquanto ele estiver definido,
                          desabilita o botão para impedir que o aluno
                          dispare múltiplos alerts/sons no intervalo de
                          1.5s antes da transição automática para o
                          próximo treino. */}
                      <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!allFilled || compChainResult !== null}>
                        Conferir
                      </Button>
                      {compIsGuided && (
                        <button
                          onClick={() => setCompStepByStep(1)}
                          className="flex-1 py-2 rounded-md border-2 border-brand-otimath-pure text-brand-otimath-pure ds-small-bold cursor-pointer hover:bg-brand-otimath-pure hover:text-neutral-white active:opacity-80 transition-all"
                        >
                          Ver passo a passo
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* SubStep 6.5: Previsão do aluno */}
          {gameState.stage === 1 && gameState.subStep === 6.5 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="text"
              textInput={{
                ...predictionInput,
                placeholder: 'x',
                setValue: (val) => predictionInput.setValue?.(val)
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 7.5: Pergunta de incerteza */}
          {currentQuestion && gameState.stage === 1 && gameState.subStep === 7.5 && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 7.6: Padrão perfeito detectado */}
          {gameState.stage === 1 && gameState.subStep === 7.6 && (
            <div className="bg-feedback-success-lighter p-macro rounded-md border border-feedback-success-dark">
              <h3 className="ds-body-bold text-feedback-success-darkest mb-micro">
                Padrão Interessante Detectado!
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Você obteve cada cor exatamente uma vez. Isso acontece sempre?<br/>
                Continue girando o disco para observar o que acontece.
              </p>
              <p className="ds-caption text-neutral-dark">
                Giros extras realizados: <strong>{gameState.perfectPatternExtraSpinsDone}</strong> / <strong>{gameState.manualSpinsRequired}</strong>
              </p>
            </div>
          )}

          {/* SubStep 9: Entrada de frequências relativas */}
          {gameState.stage === 1 && gameState.subStep === 9 && Object.keys(relativeFrequencyInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Frequências Relativas
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Calcule a frequência relativa de cada cor (frequência absoluta / total de giros).
              </p>
              <div className="flex flex-col gap-y-micro">
                {Object.keys(relativeFrequencyInputs).map((color) => (
                  <div key={color} className="flex items-center gap-x-macro">
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-micro border border-neutral-medium"
                      style={{ backgroundColor: ROULETTE_COLORS[color] }}
                    ></span>
                    <span className="ds-small w-[80px]">{color}:</span>
                    <span className="ds-small w-[40px] text-center">{gameState.frequencies[color] || 0}</span>
                    <TextInput
                      textInput={{
                        ...relativeFrequencyInputs[color],
                        placeholder: 'a/b',
                        styles: 'w-[100px] text-center'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-macro">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={disabledCheckButton}
                >
                  Verificar Frequências Relativas
                </Button>
              </div>
            </div>
          )}

          {/* SubStep 9.5: Tabela + conceito de frequência relativa + pergunta */}
          {gameState.subStep === 9.5 && (
            <>
              <RouletteTable
                title="Tabela de Frequências"
                data={frequencyData}
                showRelativeFrequency={true}
                showPercentage={true}
                showTheoreticalProbability={false}
                totalSpins={gameState.totalSpins}
                editable={false}
              />
              {freqRelQuestion && (
                <div className="w-full max-w-[600px] mx-auto flex flex-col gap-xxxs">
                  <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">Frequência Relativa</p>
                    <p className="ds-body text-brand-otimath-dark">
                      A frequência relativa de um evento é a proporção ou porcentagem de vezes que esse evento ocorre em relação ao total de repetições do experimento.
                    </p>
                  </div>
                  <div className="rounded-md p-xxs bg-neutral-white border-hairline border-neutral-light">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">
                      Qual é a frequência relativa (porcentagem das vezes que ocorre) da cor {freqRelQuestion.color}?
                    </p>
                    <div className="flex items-center gap-nano mt-nano">
                      <input
                        type="text"
                        className={`w-full p-nano rounded-md border-hairline ds-body text-center ${freqRelInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                        placeholder="Ex: 22,2"
                        value={freqRelInput.value}
                        onChange={(e) => setFreqRelInput({ value: e.target.value, error: false })}
                      />
                      <span className="ds-body text-neutral-dark">%</span>
                    </div>
                    <div className="mt-nano flex justify-end">
                      <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!freqRelInput.value}>
                        Conferir
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SubStep 11: Pergunta de convergência */}
          {gameState.stage === 1 && gameState.subStep === 11 && convergenceInputs.convergence && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">
                Convergência das Frequências Relativas
              </h3>
              <p className="ds-small text-neutral-dark mb-macro">
                À medida que o número de giros do disco se torna muito grande, as frequências relativas estão se aproximando de qual número?
              </p>
              <div className="flex items-center gap-x-macro justify-center">
                <TextInput
                  textInput={{
                    ...convergenceInputs.convergence,
                    placeholder: 'a/b',
                    styles: 'w-[150px] text-center'
                  }}
                />
              </div>
              <div className="mt-macro flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={disabledCheckButton}
                >
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* SubStep 12: Pergunta teórica 1 */}
          {gameState.stage === 1 && gameState.subStep === 12 && (
            <RouletteQuestion
              question={`Caso o disco circular fosse dividido em <strong>${gameState.theoreticalK}</strong> setores iguais, o setor h, após girar o disco um número p maior que 1 bilhão de vezes, terá uma frequência relativa aproximando de qual número?`}
              type="text"
              textInput={{
                ...theoreticalQuestion1Input,
                placeholder: 'Digite a fração',
                setValue: (val) => theoreticalQuestion1Input.setValue?.(val)
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* SubStep 13: Pergunta teórica 2 */}
          {gameState.stage === 1 && gameState.subStep === 13 && (
            <RouletteQuestion
              question={`Na pergunta anterior você respondeu que a frequência relativa do setor h, após um número p maior que 1 bilhão de giros, se aproxima de <strong>${theoreticalQuestion1Input.value || '—'}</strong>. Então qual a probabilidade de o ponteiro do disco após um giro indicar a região h?`}
              type="text"
              textInput={{
                ...theoreticalQuestion2Input,
                placeholder: 'Digite a fração',
                setValue: (val) => theoreticalQuestion2Input.setValue?.(val)
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* Tabela de frequências (mostrar durante giros manuais e automáticos — Etapas 1 e 2) */}
          {gameState.stage !== 3 && gameState.totalSpins > 0 && (gameState.subStep === 7 || gameState.subStep === 7.6 || gameState.subStep === 8 || gameState.subStep === 8.5) && (
            <RouletteTable
              title="Tabela de Frequências"
              data={frequencyData}
              showRelativeFrequency={false}
              showPercentage={false}
              showTheoreticalProbability={false}
              totalSpins={gameState.totalSpins}
              editable={false}
            />
          )}

          {/* SubStep 8.5: Conceito de frequência absoluta + pergunta (Etapas 1 e 2) */}
          {gameState.stage !== 3 && gameState.subStep === 8.5 && freqAbsQuestion && (
            <div className="w-full max-w-[600px] mx-auto flex flex-col gap-xxxs">
              <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                <p className="ds-body-bold text-brand-otimath-dark mb-nano">Frequência Absoluta</p>
                <p className="ds-body text-brand-otimath-dark">
                  A frequência absoluta de um evento é o número de ocorrências desse evento em n repetições de um experimento aleatório.
                </p>
              </div>
              <div className="rounded-md p-xxs bg-neutral-white border-hairline border-neutral-light">
                <p className="ds-body-bold text-brand-otimath-dark mb-nano">
                  Qual é a frequência absoluta do setor de cor {freqAbsQuestion.color} após {gameState.totalSpins} giros do disco?
                </p>
                <div className="flex items-center gap-nano mt-nano">
                  <input
                    type="number"
                    className={`w-full p-nano rounded-md border-hairline ds-body text-center ${freqAbsInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                    placeholder="Digite o valor observando a tabela de frequências"
                    value={freqAbsInput.value}
                    onChange={(e) => setFreqAbsInput({ value: e.target.value, error: false })}
                  />
                </div>
                <div className="mt-nano flex justify-end">
                  <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!freqAbsInput.value}>
                    Conferir
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SubStep 8.6: Tela conceitual de frequência relativa */}
          {gameState.subStep === 8.6 && (
            <div className="w-full max-w-[600px] mx-auto flex flex-col gap-xxxs">
              {/* Definição (sempre visível) */}
              <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                <p className="ds-body-bold text-brand-otimath-dark mb-nano">Definição</p>
                <p className="ds-body text-brand-otimath-dark">
                  Frequência relativa de um evento é a proporção entre o número de ocorrências do evento e o total de repetições do experimento, podendo ser expressa como fração, número decimal ou porcentagem.
                </p>
                <p className="ds-body text-brand-otimath-dark mt-nano">
                  É a porcentagem de vezes em que um evento ocorreu após determinado número de giros, no caso particular do disco.
                </p>
              </div>

              {/* Botão "Li." (só na fase definition) */}
              {freqRelConceptPhase === 'definition' && (
                <div className="flex justify-end">
                  <Button style="primary" size="small" icon={<Check />} onClick={handleFreqRelConceptLi}>Li.</Button>
                </div>
              )}

              {/* Exemplo + transição + Continuar (só na fase example) */}
              {freqRelConceptPhase === 'example' && (
                <>
                  <div className="rounded-md p-xxs bg-neutral-white border-hairline border-neutral-light">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">Exemplo</p>
                    <p className="ds-body text-brand-otimath-dark">
                      Se uma cor apareceu 3 vezes em {gameState.totalSpins} giros, então:
                    </p>
                    <div className="flex items-center justify-center gap-nano mt-nano">
                      <span className="ds-body-bold text-brand-otimath-pure">3/{gameState.totalSpins}</span>
                      <span className="ds-body text-neutral-dark">=</span>
                      <span className="ds-body-bold text-brand-otimath-pure">{(3 / gameState.totalSpins).toFixed(3).replace('.', ',')}</span>
                      <span className="ds-body text-neutral-dark">≈</span>
                      <span className="ds-body-bold text-brand-otimath-pure">{((3 / gameState.totalSpins) * 100).toFixed(1).replace('.', ',')}%</span>
                    </div>
                  </div>

                  <div className="rounded-md p-xxs bg-feedback-info-lightest border-hairline border-feedback-info-light">
                    <p className="ds-body text-brand-otimath-dark">
                      Agora é a sua vez de calcular as frequências relativas observando a tabela.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleFreqRelConceptContinue}>Continuar</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tabela de frequências completa (após giros automáticos, ocultar durante LGN — Etapas 1 e 2) */}
          {gameState.stage !== 3 && gameState.totalSpins > 0 && gameState.subStep >= 10 && gameState.subStep !== 9 && gameState.subStep !== 15 && (
            <RouletteTable
              title="Tabela de Frequências"
              data={frequencyData}
              showRelativeFrequency={true}
              showPercentage={true}
              showTheoreticalProbability={true}
              totalSpins={gameState.totalSpins}
              editable={false}
            />
          )}

          {/* Gráfico de frequências relativas:
              - Etapas 1/2: aparece após os giros automáticos (totalSpins>10),
                escondido durante as perguntas de interpretação.
              - Etapa 3: a Falácia do Jogador acumula em s3State.spinHistory
                (não em gameState.totalSpins), então ali a condição é a
                quantidade de giros realizados na própria E3. */}
          {(
            (gameState.stage !== 3 && gameState.totalSpins > 10 && gameState.subStep >= 10 && gameState.subStep !== 15 && !(gameState.subStep === 14 && interpretationPhase !== 'done')) ||
            (gameState.stage === 3 && s3State.spinHistory.length > 0)
          ) && (
            <RouletteChart
              title="Frequências Relativas"
              data={chartData}
              showTheoreticalProbability={true}
              sectorCount={gameState.sectors.length}
            />
          )}

          {/* ===================== ETAPA 2 — PROBABILIDADE NÃO EQUIPROVÁVEL ===================== */}

          {/* Stage 2 — SubStep 0.15: Botão Sortear (investigação aposta) */}
          {gameState.stage === 2 && gameState.subStep === 0.15 && experimentationState.wageredColor && !gameState.isSpinning && (
            <Button
              style="primary"
              size="medium"
              icon={<Play />}
              onClick={spinRouletteS2}
              disabled={disabledSpinButton || gameState.isSpinning}
            >
              Sortear
            </Button>
          )}

          {/* Stage 2 — SubSteps 0.15/0.16/0.17: Indicador Aposta / Resultado */}
          {gameState.stage === 2 && (gameState.subStep === 0.15 || gameState.subStep === 0.16 || gameState.subStep === 0.17) && experimentationState.wageredColor && (
            <div className="bg-brand-otimath-lightest p-micro rounded-md border border-brand-otimath-light text-center">
              <p className="ds-small text-brand-otimath-dark">
                <strong>Aposta:</strong> {experimentationState.wageredColor}
                {(gameState.subStep === 0.16 || gameState.subStep === 0.17) && (
                  <> | <strong>Sorteada:</strong> {experimentationState.colorRevealed ? experimentationState.internalDrawnColor : '?'}</>
                )}
              </p>
            </div>
          )}

          {/* Stage 2 — SubStep 0.17: Quadro comparação + botão Continuar */}
          {gameState.stage === 2 && gameState.subStep === 0.17 && !showInfoBox && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Resultado da Aposta</h3>
              <div className="flex justify-center gap-x-macro mb-macro">
                <div className="flex flex-col items-center gap-y-nano">
                  <span className="ds-caption text-neutral-dark">Aposta</span>
                  <span
                    className="inline-block w-8 h-8 rounded-full border-2 border-neutral-dark"
                    style={{ backgroundColor: ROULETTE_COLORS[experimentationState.wageredColor || ''] }}
                  />
                  <span className="ds-small-bold">{experimentationState.wageredColor}</span>
                </div>
                <div className="flex flex-col items-center gap-y-nano">
                  <span className="ds-caption text-neutral-dark">Resultado</span>
                  <span
                    className="inline-block w-8 h-8 rounded-full border-2 border-neutral-dark"
                    style={{ backgroundColor: ROULETTE_COLORS[experimentationState.internalDrawnColor || ''] }}
                  />
                  <span className="ds-small-bold">{experimentationState.internalDrawnColor}</span>
                </div>
              </div>
              <p className="ds-body text-center mb-macro">
                {experimentationState.wageredColor === experimentationState.internalDrawnColor
                  ? 'Você ganhou a aposta!'
                  : 'Você não ganhou desta vez.'}
              </p>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={checkAnswer}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 0.185: Paleta de cores (identificar maior probabilidade) */}
          {gameState.stage === 2 && gameState.subStep === 0.185 && !showInfoBox && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Qual cor possui a maior chance?</h3>
              <p className="ds-small text-neutral-dark mb-macro">Clique na cor que você acredita ter a maior probabilidade de ser sorteada.</p>
              <div className="flex flex-wrap justify-center gap-macro" role="group" aria-label="Paleta de cores">
                {gameState.sectors.map((sector: { colorName: string }, idx: number) => (
                  <button
                    key={idx}
                    className="flex flex-col items-center gap-y-nano cursor-pointer hover:opacity-80 transition-opacity min-w-[44px] min-h-[44px]"
                    onClick={() => handleColorPaletteSelect(sector.colorName)}
                    aria-label={`Selecionar cor ${sector.colorName}`}
                  >
                    <span
                      className="inline-block w-10 h-10 rounded-full border-2 border-neutral-dark"
                      style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] }}
                      aria-hidden="true"
                    />
                    <span className="ds-small-bold">{sector.colorName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 0.19: Reflexão conceitual (múltipla escolha F/V) */}
          {gameState.stage === 2 && gameState.subStep === 0.19 && currentQuestion && !showInfoBox && !gameState.isSpinning && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton || !selectedOption}
            />
          )}

          {/* Stage 2 — SubStep 2: Espaço amostral (texto) */}
          {gameState.stage === 2 && gameState.subStep === 2 && (
            <RouletteQuestion
              question="Qual o espaço amostral desse experimento aleatório?"
              type="text"
              textInput={{
                ...sampleSpaceInput,
                placeholder: 'S = {cor1, cor2, ...}',
                setValue: (val) => setSampleSpaceInput(prev => ({ ...prev, value: val }))
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* Stage 2 — SubStep 2.1: Quantos elementos (texto numérico) */}
          {gameState.stage === 2 && gameState.subStep === 2.1 && (
            <RouletteQuestion
              question="Quantos elementos possui o espaço amostral desse experimento?"
              type="text"
              textInput={{
                value: sampleSpaceCountInput.value,
                disabled: false,
                error: sampleSpaceCountInput.error,
                type: 'natural-number',
                placeholder: 'Digite o número',
                setValue: (val) => setSampleSpaceCountInput({ value: val, disabled: false, error: false, type: 'natural-number' })
              }}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* Stage 2 — SubStep 2.2: Cada setor tem probabilidade 1/k? (Sim/Não) */}
          {gameState.stage === 2 && gameState.subStep === 2.2 && currentQuestion && (
            <div className="flex flex-col gap-y-macro">
              <RouletteQuestion
                question={currentQuestion.question}
                type="multiple-choice"
                options={currentQuestion.options}
                selectedOption={selectedOption}
                onOptionSelect={setSelectedOption}
                onCheck={checkAnswer}
                disabled={disabledCheckButton}
                showCheckButton={false}
              />
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={disabledCheckButton || !selectedOption}
              >
                Verificar
              </Button>
            </div>
          )}

          {/* Stage 2 — SubStep 2.3: P(Cor X ou Cor Y) = 2/k? (Sim/Não com cores) */}
          {gameState.stage === 2 && gameState.subStep === 2.3 && currentQuestion && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <p className="ds-body text-neutral-darkest mb-macro">
                  A probabilidade de ocorrer um setor de Cor{' '}
                  <span className="ds-body-bold" style={{ color: ROULETTE_COLORS[s2RandomColors.colorX] || '#333' }}>{s2RandomColors.colorX}</span>
                  {' '}ou Cor{' '}
                  <span className="ds-body-bold" style={{ color: ROULETTE_COLORS[s2RandomColors.colorY] || '#333' }}>{s2RandomColors.colorY}</span>
                  {' '}é {2}/{gameState.s2K}?
                </p>
                <div className="flex flex-col gap-y-micro">
                  {currentQuestion.options?.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-x-micro p-micro rounded-sm border cursor-pointer transition-colors ${selectedOption === opt.value ? 'border-brand-otimath-pure bg-brand-otimath-lightest' : 'border-neutral-lighter hover:bg-neutral-lightest'}`}>
                      <input
                        type="radio"
                        name="q23"
                        value={opt.value}
                        checked={selectedOption === opt.value}
                        onChange={() => setSelectedOption(opt.value)}
                        className="mt-[1px]"
                      />
                      <span className="ds-body">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={disabledCheckButton || !selectedOption}
              >
                Verificar
              </Button>
            </div>
          )}

          {/* Stage 2 — SubStep 2.4: Probabilidade Laplaciana (Equiprovável/Não equiprovável + definição) */}
          {gameState.stage === 2 && gameState.subStep === 2.4 && currentQuestion && (
            <div className="flex flex-col gap-y-macro">
              <RouletteQuestion
                question={currentQuestion.question}
                type="multiple-choice"
                options={currentQuestion.options}
                selectedOption={selectedOption}
                onOptionSelect={setSelectedOption}
                onCheck={checkAnswer}
                disabled={disabledCheckButton}
                showCheckButton={false}
              />
              {selectedOption && (
                <div
                  className="bg-feedback-info-lighter p-macro rounded-md border-l-4 border-feedback-info-dark"
                  style={{ animation: 'alertShow 0.4s ease-out' }}
                >
                  <h4 className="ds-body-bold text-feedback-info-darkest mb-micro">Definição</h4>
                  {selectedOption === 'equiprovavel' ? (
                    <div className="flex flex-col gap-y-micro">
                      <p className="ds-small text-neutral-darkest">
                        Um espaço amostral é <strong>equiprovável</strong> quando cada evento simples tem a mesma chance de ocorrer.
                      </p>
                      <p className="ds-small text-neutral-dark italic">
                        Observe se todos os setores do disco possuem o mesmo tamanho.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-y-micro">
                      <p className="ds-small text-neutral-darkest">
                        Um espaço amostral é <strong>não equiprovável</strong> quando os eventos simples possuem probabilidades diferentes.
                      </p>
                      <p className="ds-small text-neutral-dark italic">
                        Note que os setores têm ângulos e áreas distintos, logo alguns resultados são mais prováveis.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={checkAnswer}
                disabled={disabledCheckButton || !selectedOption}
              >
                Verificar
              </Button>
            </div>
          )}

          {/* Stage 2 — SubStep 3: Razões angulares — progressive disclosure */}
          {gameState.stage === 2 && gameState.subStep === 3 && (
            <div className="flex flex-col gap-y-macro">

              {/* Rótulo da unidade (após acertar menor setor) */}
              {s2RatioPhase !== 'init' && (
                <div className="bg-feedback-success-lighter p-micro rounded-sm border-l-4 border-feedback-success-dark">
                  <p className="ds-small-bold text-feedback-success-darkest">Unidade = {gameState.s2M}°</p>
                </div>
              )}

              {/* Questão conceitual MC (após identificar menor setor) */}
              {s2RatioPhase === 'unit_selected' && s2ConceptQuestion && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter flex flex-col gap-y-macro">
                  <p className="ds-body-bold text-brand-otimath-dark">
                    A área de um setor circular é diretamente proporcional ao seu ângulo central. Logo, a probabilidade de um setor ser sorteado é diretamente proporcional ______ e ______.
                  </p>
                  <p className="ds-small text-neutral-dark">As lacunas são corretamente preenchidas por:</p>
                  <div className="flex flex-col gap-y-micro">
                    {s2ConceptQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setS2ConceptSelected(option.value)}
                        className={`
                          p-micro rounded-sm border-2 text-left transition-all duration-200
                          ${s2ConceptSelected === option.value
                            ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                            : 'border-neutral-lighter bg-neutral-white hover:border-brand-otimath-light'
                          }
                          cursor-pointer
                        `}
                      >
                        <span className="ds-small">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-start">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!s2ConceptSelected}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Pergunta 1: Razão dos ângulos */}
              {s2RatioPhase === 'ratio_question' && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter flex flex-col gap-y-macro">
                  <p className="ds-body-bold text-brand-otimath-dark">
                    Quantas vezes o ângulo do setor de cor {s2ReasoningColorY} é maior que o ângulo do menor setor?
                  </p>
                  <div className="flex items-center gap-x-micro">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s2ReasoningInput}
                      onChange={(e) => {
                        // Permite apenas dígitos com um único separador decimal (. ou ,) — número real positivo
                        const next = e.target.value;
                        if (next === '' || /^\d*[.,]?\d*$/.test(next)) {
                          setS2ReasoningInput(next);
                        }
                      }}
                      placeholder="Digite o valor"
                      className={`border rounded-sm p-micro ds-body w-[120px] text-center focus:border-brand-otimath-pure focus:outline-none ${s2ReasoningErrors > 0 ? 'border-feedback-error-dark text-feedback-error-dark' : 'border-neutral-light'}`}
                    />
                  </div>
                  {s2ReasoningShowHint && (
                    <div className="bg-feedback-warning-lighter p-micro rounded-sm border-l-4 border-feedback-warning-dark">
                      <p className="ds-small text-feedback-warning-darkest">
                        Dica: O ângulo do setor {s2ReasoningColorY} é {s2ReasoningAngleY}° e o menor ângulo é {gameState.s2M}°. Divida {s2ReasoningAngleY} por {gameState.s2M}.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-start">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!s2ReasoningInput.trim()}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Pergunta 2: Razão das áreas */}
              {s2RatioPhase === 'area_question' && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter flex flex-col gap-y-macro">
                  <p className="ds-body-bold text-brand-otimath-dark">
                    Então a área do setor de cor {s2ReasoningColorY} é quantas vezes a área do menor setor do disco?
                  </p>
                  <div className="flex items-center gap-x-micro">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s2ReasoningInput}
                      onChange={(e) => {
                        // Permite apenas dígitos com um único separador decimal (. ou ,) — número real positivo
                        const next = e.target.value;
                        if (next === '' || /^\d*[.,]?\d*$/.test(next)) {
                          setS2ReasoningInput(next);
                        }
                      }}
                      placeholder="Digite o valor"
                      className={`border rounded-sm p-micro ds-body w-[120px] text-center focus:border-brand-otimath-pure focus:outline-none ${s2ReasoningErrors > 0 ? 'border-feedback-error-dark text-feedback-error-dark' : 'border-neutral-light'}`}
                    />
                  </div>
                  {s2ReasoningShowHint && (
                    <div className="bg-feedback-warning-lighter p-micro rounded-sm border-l-4 border-feedback-warning-dark">
                      <p className="ds-small text-feedback-warning-darkest">
                        Dica: Setores com o mesmo raio têm áreas proporcionais aos ângulos. A razão dos ângulos é {s2ReasoningRatio}.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-start">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!s2ReasoningInput.trim()}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Pergunta 3: Probabilidade */}
              {s2RatioPhase === 'prob_question' && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter flex flex-col gap-y-macro">
                  <p className="ds-body-bold text-brand-otimath-dark">
                    Supondo que a probabilidade do setor de menor ângulo seja p, qual é a probabilidade do setor de cor {s2ReasoningColorY} ser sorteado?
                  </p>
                  <div className="flex items-center gap-x-micro">
                    <input
                      type="text"
                      value={s2ReasoningInput}
                      onChange={(e) => setS2ReasoningInput(e.target.value)}
                      placeholder=""
                      className={`border rounded-sm p-micro ds-body w-[120px] text-center focus:border-brand-otimath-pure focus:outline-none ${s2ReasoningErrors > 0 ? 'border-feedback-error-dark text-feedback-error-dark' : 'border-neutral-light'}`}
                    />
                  </div>
                  {s2ReasoningShowHint && (
                    <div className="bg-feedback-warning-lighter p-micro rounded-sm border-l-4 border-feedback-warning-dark">
                      <p className="ds-small text-feedback-warning-darkest">
                        Dica: A razão encontrada é {s2ReasoningRatio}. Multiplique p por esse valor.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-start">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!s2ReasoningInput.trim()}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabela de razões angulares (após responder as 3 perguntas) */}
              {(s2RatioPhase === 'question_correct' || s2RatioPhase === 'table_checked') && Object.keys(s2RatioInputs).length > 0 && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <p className="ds-small text-neutral-dark italic mb-micro">
                    Perceba que todos os cálculos utilizam a mesma unidade angular.
                  </p>
                  <p className="ds-small text-neutral-dark mb-micro">
                    Quantas unidades de {gameState.s2M}° cabem em cada setor?
                  </p>
                  <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-otimath-pure text-neutral-white">
                        <th className="p-micro text-left ds-small-bold">Cor</th>
                        <th className="p-micro text-center ds-small-bold">Ângulo</th>
                        <th className="p-micro text-center ds-small-bold">Número de unidades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameState.sectors.map((sector, idx) => {
                        const colorHex = ROULETTE_COLORS[sector.colorName] || '#6c6c6c';
                        const input = s2RatioInputs[sector.colorName];
                        return (
                          <tr key={idx} className="border-b border-neutral-lighter">
                            <td className="p-micro">
                              <div className="flex items-center gap-x-micro">
                                <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: colorHex }} />
                                <span className="ds-small">{sector.colorName}</span>
                              </div>
                            </td>
                            <td className="p-micro text-center ds-small">{gameState.s2Angles[idx]}°</td>
                            <td className="p-micro text-center">
                              {input?.disabled && input?.value ? (
                                <span className="ds-small-bold text-feedback-success-dark">{input.value}</span>
                              ) : (
                                <TextInput
                                  textInput={{
                                    ...input,
                                    styles: `w-[60px] h-[32px] text-center ds-small`,
                                    placeholder: 'ex.: 2',
                                    type: 'natural-number',
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                  <div className="mt-micro flex gap-x-micro justify-center">
                    {!s2TableAllCorrect && (
                      <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer}>
                        Verificar
                      </Button>
                    )}
                    {s2TableAllCorrect && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleRatioTableContinue}>
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2 — SubStep 4: Probabilidades i·p (TPACK enhanced) */}
          {gameState.stage === 2 && gameState.subStep === 4 && (
            <div className="flex flex-col gap-y-macro">
              {/* Phase: sum_question — pergunta sobre soma das probabilidades */}
              {s2IxPhase === 'sum_question' && (
                <RouletteQuestion
                  question="Estamos atribuindo probabilidades a todos os setores do disco.<br/>O que deve acontecer quando somamos as probabilidades de todos os setores?"
                  type="multiple-choice"
                  options={[
                    { value: 'deve_dar_1', label: 'Deve dar 1, que é a probabilidade do evento certo.' },
                    { value: 'maior_valor', label: 'Deve dar o maior valor.' },
                    { value: 'depende_cor', label: 'Depende da cor.' }
                  ]}
                  selectedOption={s2IxSumSelected}
                  onOptionSelect={(v) => setS2IxSumSelected(v)}
                  onCheck={checkAnswer}
                  showCheckButton={!!s2IxSumSelected}
                />
              )}

              {/* Phase: filling_table, guided_calc — tabela + cálculo guiado */}
              {(s2IxPhase === 'filling_table' || s2IxPhase === 'guided_calc') && Object.keys(s2IxInputs).length > 0 && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <h3 className="ds-body-bold text-brand-otimath-pure mb-nano">Distribuindo a probabilidade entre todos os setores</h3>
                  <p className="ds-small text-neutral-dark mb-macro">Cada setor recebe uma quantidade proporcional à sua área. Seja p a probabilidade do setor de menor ângulo central ser sorteado. Vamos determinar o valor de p. Atribua probabilidades a cada setor na tabela em função de p.</p>

                  <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-otimath-pure text-neutral-white">
                        <th className="p-micro text-left ds-small-bold">Cor</th>
                        <th className="p-micro text-center ds-small-bold">Razão (i)</th>
                        <th className="p-micro text-center ds-small-bold">P(cor) = i·p</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameState.sectors.map((sector, idx) => (
                        <tr key={idx} className="border-b border-neutral-lighter">
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                              <span className="ds-small">{sector.colorName}</span>
                            </div>
                          </td>
                          <td className="p-micro text-center ds-small-bold">{gameState.s2Ki[idx]}</td>
                          <td className="p-micro text-center">
                            {s2IxInputs[sector.colorName]?.disabled && s2IxInputs[sector.colorName]?.value ? (
                              <span className="ds-small-bold text-feedback-success-dark">{s2IxInputs[sector.colorName].value}</span>
                            ) : (
                              <TextInput
                                textInput={{
                                  ...s2IxInputs[sector.colorName],
                                  styles: 'w-[70px] h-[32px] text-center ds-small',
                                  placeholder: '?p',
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Linha da soma das probabilidades */}
                      <tr className="border-t-2 border-brand-otimath-pure bg-neutral-lightest">
                        <td className="p-micro" colSpan={2}>
                          <span className="ds-small-bold text-neutral-darkest">Soma das probabilidades</span>
                        </td>
                        <td className="p-micro text-center">
                          {s2SumEquationInput.disabled && s2SumEquationInput.value ? (
                            <span className="ds-small-bold text-feedback-success-dark">{s2SumEquationInput.value}</span>
                          ) : s2SumEquationInput.disabled ? (
                            <span className="ds-small text-neutral-light">—</span>
                          ) : (
                            <TextInput
                              textInput={{
                                ...s2SumEquationInput,
                                styles: 'w-[70px] h-[32px] text-center ds-small',
                                placeholder: '?',
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table></div>

                  {/* Cálculo guiado passo a passo (aparece após digitar 1 na soma) */}
                  {s2IxPhase === 'guided_calc' && (
                    <div className="mt-macro p-macro bg-feedback-info-lighter rounded-sm border border-feedback-info-light">
                      {/* Step 0: equação expandida */}
                      {s2IxCalcStep === 0 && (
                        <p className="ds-body text-neutral-darkest">
                          {gameState.s2Ki.map(ki => `${ki}p`).join(' + ')} = 1
                        </p>
                      )}

                      {/* Step 1: simplificação */}
                      {s2IxCalcStep === 1 && (
                        <p className="ds-body text-neutral-darkest">
                          {gameState.s2SumI}p = 1
                        </p>
                      )}

                      {/* Step 2: resolução + conclusão */}
                      {s2IxCalcStep >= 2 && (
                        <>
                          <p className="ds-body-bold text-brand-otimath-dark">
                            p = 1/{gameState.s2SumI}
                          </p>
                          <p className="ds-small text-feedback-success-darkest mt-micro italic">
                            Assim, a probabilidade do menor setor ser sorteado é p = 1/{gameState.s2SumI}.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Botões */}
                  <div className="mt-micro flex justify-center gap-x-macro">
                    {s2IxPhase === 'filling_table' && (
                      <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                        Verificar
                      </Button>
                    )}
                    {s2IxPhase === 'guided_calc' && s2IxCalcStep < 2 && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleIxCalcNext}>
                        Próximo
                      </Button>
                    )}
                    {s2IxPhase === 'guided_calc' && s2IxCalcStep >= 2 && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleIxCalcNext}>
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2 — SubStep 5: Equação da soma = ? */}
          {gameState.stage === 2 && gameState.subStep === 5 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Equação da Soma</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                {gameState.s2Ki.map(ki => `${ki}x`).join(' + ')} = ?
              </p>
              <div className="flex items-center gap-x-macro justify-center">
                <TextInput
                  textInput={{
                    ...s2SumEquationInput,
                    placeholder: '?',
                    styles: 'w-[100px] text-center',
                  }}
                />
              </div>
              <div className="mt-macro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 5.2: Determinar x */}
          {gameState.stage === 2 && gameState.subStep === 5.2 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Determinar x</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                {gameState.s2Ki.map(ki => `${ki}x`).join(' + ')} = 1
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                {gameState.s2SumI}x = 1 &rarr; x = ?
              </p>
              <div className="flex items-center gap-x-macro justify-center">
                <TextInput
                  textInput={{
                    ...s2XInput,
                    placeholder: 'a/b',
                    styles: 'w-[100px] text-center',
                  }}
                />
              </div>
              <div className="mt-macro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 6: Probabilidades numéricas i·p (campo a campo) */}
          {gameState.stage === 2 && gameState.subStep === 6 && Object.keys(s2NumProbInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Probabilidades Numéricas (p = 1/{gameState.s2SumI})</h3>
              <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-brand-otimath-pure text-neutral-white">
                    <th className="p-micro text-left ds-small-bold">Cor</th>
                    <th className="p-micro text-center ds-small-bold">i·p</th>
                    <th className="p-micro text-center ds-small-bold">P(cor)</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.sectors.map((sector, idx) => (
                    <tr key={idx} className="border-b border-neutral-lighter">
                      <td className="p-micro">
                        <div className="flex items-center gap-x-micro">
                          <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                          <span className="ds-small">{sector.colorName}</span>
                        </div>
                      </td>
                      <td className="p-micro text-center ds-small-bold">{gameState.s2Ki[idx]}p</td>
                      <td className="p-micro text-center">
                        {s2NumProbInputs[sector.colorName]?.disabled && s2NumProbInputs[sector.colorName]?.value ? (
                          <span className="ds-small-bold text-feedback-success-dark">{s2NumProbInputs[sector.colorName].value}</span>
                        ) : (
                          <TextInput
                            textInput={{
                              ...s2NumProbInputs[sector.colorName],
                              styles: 'w-[80px] h-[32px] text-center ds-small',
                              placeholder: 'a/b',
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-micro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — Fase de Treinos (Treino 1-4) */}
          {gameState.stage === 2 && trainingState.active && (
            <div className="flex flex-col gap-y-macro">
              {/* Header do treino */}
              <div className="bg-brand-otimath-lightest p-micro rounded-sm border-l-4 border-brand-otimath-pure">
                <p className="ds-small-bold text-brand-otimath-dark">
                  Treino {trainingState.currentTraining} de 4
                </p>
                <p className="ds-small text-neutral-dark">
                  Girando-se o disco apresentado ao acaso, determine a probabilidade de o ponteiro indicar cada uma das cores do disco.
                </p>
              </div>

              {/* Phase: identify_sector */}
              {trainingState.phase === 'identify_sector' && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <p className="ds-body-bold text-brand-otimath-dark">
                    Clique no setor com o menor ângulo central.
                  </p>
                </div>
              )}

              {/* Phase: fill_ratios */}
              {trainingState.phase === 'fill_ratios' && Object.keys(trainRatioInputs).length > 0 && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <h3 className="ds-body-bold text-brand-otimath-pure mb-nano">Divida todos os ângulos pelo menor</h3>
                  <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-otimath-pure text-neutral-white">
                        <th className="p-micro text-left ds-small-bold">Cor</th>
                        <th className="p-micro text-center ds-small-bold">Ângulo</th>
                        <th className="p-micro text-center ds-small-bold">Razão (i)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingState.sectors.map((sector, idx) => (
                        <tr key={idx} className="border-b border-neutral-lighter">
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                              <span className="ds-small">{sector.colorName}</span>
                            </div>
                          </td>
                          <td className="p-micro text-center ds-small">{trainingState.angles[idx]}°</td>
                          <td className="p-micro text-center">
                            {trainRatioInputs[sector.colorName]?.disabled && trainRatioInputs[sector.colorName]?.value ? (
                              <span className="ds-small-bold text-feedback-success-dark">{trainRatioInputs[sector.colorName].value}</span>
                            ) : (
                              <TextInput
                                textInput={{
                                  ...trainRatioInputs[sector.colorName],
                                  styles: 'w-[70px] h-[32px] text-center ds-small',
                                  placeholder: '?',
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                  <div className="mt-micro flex justify-center">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Phase: fill_ip + fill_sum + guided_calc */}
              {(trainingState.phase === 'fill_ip' || trainingState.phase === 'fill_sum' || trainingState.phase === 'guided_calc') && Object.keys(trainIxInputs).length > 0 && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <h3 className="ds-body-bold text-brand-otimath-pure mb-nano">Probabilidades em função de p</h3>
                  <p className="ds-small text-neutral-dark mb-macro">Seja p a probabilidade do setor de menor ângulo central ser sorteado. Atribua probabilidades a cada setor na tabela em função de p.</p>

                  <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-otimath-pure text-neutral-white">
                        <th className="p-micro text-left ds-small-bold">Cor</th>
                        <th className="p-micro text-center ds-small-bold">Razão (i)</th>
                        <th className="p-micro text-center ds-small-bold">P(cor) = i·p</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingState.sectors.map((sector, idx) => (
                        <tr key={idx} className="border-b border-neutral-lighter">
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                              <span className="ds-small">{sector.colorName}</span>
                            </div>
                          </td>
                          <td className="p-micro text-center ds-small-bold">{trainingState.ki[idx]}</td>
                          <td className="p-micro text-center">
                            {trainIxInputs[sector.colorName]?.disabled && trainIxInputs[sector.colorName]?.value ? (
                              <span className="ds-small-bold text-feedback-success-dark">{trainIxInputs[sector.colorName].value}</span>
                            ) : (
                              <TextInput
                                textInput={{
                                  ...trainIxInputs[sector.colorName],
                                  styles: 'w-[70px] h-[32px] text-center ds-small',
                                  placeholder: '?p',
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Linha da soma das probabilidades */}
                      <tr className="border-t-2 border-brand-otimath-pure bg-neutral-lightest">
                        <td className="p-micro" colSpan={2}>
                          <span className="ds-small-bold text-neutral-darkest">Soma das probabilidades</span>
                        </td>
                        <td className="p-micro text-center">
                          {trainSumInput.disabled && trainSumInput.value ? (
                            <span className="ds-small-bold text-feedback-success-dark">{trainSumInput.value}</span>
                          ) : trainSumInput.disabled ? (
                            <span className="ds-small text-neutral-light">—</span>
                          ) : (
                            <TextInput
                              textInput={{
                                ...trainSumInput,
                                styles: 'w-[70px] h-[32px] text-center ds-small',
                                placeholder: '?',
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table></div>

                  {/* Cálculo guiado passo a passo */}
                  {trainingState.phase === 'guided_calc' && (
                    <div className="mt-macro p-macro bg-feedback-info-lighter rounded-sm border border-feedback-info-light">
                      {trainingState.calcStep === 0 && (
                        <p className="ds-body text-neutral-darkest">
                          {trainingState.ki.map(ki => `${ki}p`).join(' + ')} = 1
                        </p>
                      )}
                      {trainingState.calcStep === 1 && (
                        <p className="ds-body text-neutral-darkest">
                          {trainingState.S}p = 1
                        </p>
                      )}
                      {trainingState.calcStep >= 2 && (
                        <>
                          <p className="ds-body-bold text-brand-otimath-dark">
                            p = 1/{trainingState.S}
                          </p>
                          <p className="ds-small text-feedback-success-darkest mt-micro italic">
                            Assim, a probabilidade do menor setor ser sorteado é p = 1/{trainingState.S}.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Botões */}
                  <div className="mt-micro flex justify-center gap-x-macro">
                    {(trainingState.phase === 'fill_ip' || trainingState.phase === 'fill_sum') && (
                      <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                        Verificar
                      </Button>
                    )}
                    {trainingState.phase === 'guided_calc' && trainingState.calcStep < 2 && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleTrainingCalcNext}>
                        Próximo
                      </Button>
                    )}
                    {trainingState.phase === 'guided_calc' && trainingState.calcStep >= 2 && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleTrainingCalcNext}>
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Phase: fill_prob — Probabilidades numéricas */}
              {trainingState.phase === 'fill_prob' && Object.keys(trainProbInputs).length > 0 && (
                <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                  <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Probabilidades Numéricas (p = 1/{trainingState.S})</h3>
                  <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-otimath-pure text-neutral-white">
                        <th className="p-micro text-left ds-small-bold">Cor</th>
                        <th className="p-micro text-center ds-small-bold">i·p</th>
                        <th className="p-micro text-center ds-small-bold">P(cor)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingState.sectors.map((sector, idx) => (
                        <tr key={idx} className="border-b border-neutral-lighter">
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                              <span className="ds-small">{sector.colorName}</span>
                            </div>
                          </td>
                          <td className="p-micro text-center ds-small-bold">{trainingState.ki[idx]}p</td>
                          <td className="p-micro text-center">
                            {trainProbInputs[sector.colorName]?.disabled && trainProbInputs[sector.colorName]?.value ? (
                              <span className="ds-small-bold text-feedback-success-dark">{trainProbInputs[sector.colorName].value}</span>
                            ) : (
                              <TextInput
                                textInput={{
                                  ...trainProbInputs[sector.colorName],
                                  styles: 'w-[80px] h-[32px] text-center ds-small',
                                  placeholder: 'a/b',
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                  <div className="mt-micro flex justify-center">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}

              {/* Phase: completed */}
              {trainingState.phase === 'completed' && (
                <div className="bg-feedback-success-lighter p-macro rounded-md border border-feedback-success-light">
                  <p className="ds-body-bold text-feedback-success-darkest mb-macro">
                    Treino {trainingState.currentTraining} concluído!
                  </p>
                  <div className="flex gap-x-macro justify-center">
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleTrainingNext}>
                      Próximo
                    </Button>
                    {trainingState.currentTraining < 4 && (
                      <Button style="secondary" size="small" onClick={handleTrainingContinue}>
                        Continuar Treino
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2 — Giros Reflexivos (subSteps 6.201-6.205) */}
          {gameState.stage === 2 && gameState.subStep === 6.201 && s2SpinReflection.phase === 'betting' && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <p className="ds-body-bold text-brand-otimath-dark mb-micro">Primeiro giro</p>
                <p className="ds-body text-neutral-dark">Clique no setor da cor em que deseja apostar.</p>
              </div>
            </div>
          )}
          {gameState.stage === 2 && gameState.subStep === 6.201 && s2SpinReflection.phase === 'spinning' && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <p className="ds-body-bold text-brand-otimath-dark mb-micro">Primeiro giro</p>
                <p className="ds-body text-neutral-dark">
                  Você apostou em <span className="ds-body-bold" style={{ color: ROULETTE_COLORS[s2SpinReflection.bet1Color] || '#333' }}>{s2SpinReflection.bet1Color}</span>. Agora clique em <strong>Sortear</strong> para girar o disco.
                </p>
              </div>
            </div>
          )}
          {gameState.stage === 2 && gameState.subStep === 6.202 && !gameState.isSpinning && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <p className="ds-body-bold text-brand-otimath-dark mb-micro">
                  Foi sorteada a cor <span style={{ color: ROULETTE_COLORS[s2SpinReflection.spin1Color] || '#333' }}>{s2SpinReflection.spin1Color}</span>.
                </p>
                <p className="ds-body text-neutral-dark mb-macro">Se você fosse apostar novamente, o que faria?</p>
                <div className="flex flex-col gap-y-micro">
                  {[
                    { value: 'apostar_mesma', label: 'Apostaria nela porque ela acabou de ser sorteada.' },
                    { value: 'nao_apostar', label: 'Não apostaria nela, pois ela já foi sorteada e não poderá ser sorteada novamente em duas vezes consecutivas.' },
                    { value: 'apostar_outra', label: 'Apostaria em outra cor, pois ainda não foi sorteada.' },
                    { value: 'maior_setor', label: 'Sempre apostaria na cor do setor de maior ângulo central.' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-start gap-x-micro p-micro rounded-sm border cursor-pointer transition-colors ${s2SpinReflection.selectedOption === opt.value ? 'border-brand-otimath-pure bg-brand-otimath-lightest' : 'border-neutral-lighter hover:bg-neutral-lightest'}`}>
                      <input
                        type="radio"
                        name="spin1_question"
                        value={opt.value}
                        checked={s2SpinReflection.selectedOption === opt.value}
                        onChange={() => handleReflectionOptionChange(opt.value)}
                        className="mt-[3px]"
                      />
                      <span className="ds-small">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {s2SpinReflection.betConstraint === 'not_same' && !s2SpinReflection.bet2Color && (
                  <p className="ds-small text-brand-otimath-dark mt-micro animate-pulse text-center">
                    Clique no setor da cor em que deseja apostar (exceto {s2SpinReflection.spin1Color}).
                  </p>
                )}
                {s2SpinReflection.bet2Color && (
                  <p className="ds-small text-neutral-dark mt-micro text-center">
                    Aposta em <span className="ds-small-bold" style={{ color: ROULETTE_COLORS[s2SpinReflection.bet2Color] || '#333' }}>{s2SpinReflection.bet2Color}</span>. Clique em <strong>Sortear</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          {gameState.stage === 2 && gameState.subStep === 6.204 && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <p className="ds-body-bold text-brand-otimath-dark mb-micro">
                  Foi sorteada a cor <span style={{ color: ROULETTE_COLORS[s2SpinReflection.spin2Color] || '#333' }}>{s2SpinReflection.spin2Color}</span>.
                </p>
                <p className="ds-body text-neutral-dark mb-macro">Se você fosse apostar novamente, o que faria?</p>
                <div className="flex flex-col gap-y-micro">
                  {[
                    { value: 'apostar_mesma', label: 'Apostaria nela porque ela acabou de ser sorteada.' },
                    { value: 'nao_apostar', label: 'Não apostaria nela, pois ela já foi sorteada e não poderá ser sorteada novamente em duas vezes consecutivas.' },
                    { value: 'apostar_outra', label: 'Apostaria em outra cor, pois ainda não foi sorteada.' },
                    { value: 'maior_setor', label: 'Sempre apostaria na cor do setor de maior ângulo central.' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-start gap-x-micro p-micro rounded-sm border cursor-pointer transition-colors ${s2SpinReflection.selectedOption === opt.value ? 'border-brand-otimath-pure bg-brand-otimath-lightest' : 'border-neutral-lighter hover:bg-neutral-lightest'}`}>
                      <input
                        type="radio"
                        name="spin2_question"
                        value={opt.value}
                        checked={s2SpinReflection.selectedOption === opt.value}
                        onChange={() => setS2SpinReflection(prev => ({ ...prev, selectedOption: opt.value }))}
                        className="mt-[3px]"
                      />
                      <span className="ds-small">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-macro flex justify-center">
                  <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!s2SpinReflection.selectedOption}>
                    Responder
                  </Button>
                </div>
              </div>
            </div>
          )}

          {gameState.stage === 2 && gameState.subStep === 6.205 && (
            <div className="flex flex-col gap-y-macro">
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <h3 className="ds-body-bold text-brand-otimath-pure mb-macro">Suas decisões</h3>

                <div className="flex flex-col gap-y-micro mb-macro">
                  <div className="p-micro rounded-sm bg-neutral-lightest border border-neutral-lighter">
                    <p className="ds-small-bold text-neutral-darkest">Tentativa 1:</p>
                    <p className="ds-small text-neutral-dark">
                      {s2SpinReflection.answer1 === 'maior_setor'
                        ? '→ Considerou o tamanho do setor.'
                        : '→ Não considerou o tamanho do setor.'}
                    </p>
                  </div>
                  <div className="p-micro rounded-sm bg-neutral-lightest border border-neutral-lighter">
                    <p className="ds-small-bold text-neutral-darkest">Tentativa 2:</p>
                    <p className="ds-small text-neutral-dark">
                      {s2SpinReflection.answer2 === 'maior_setor'
                        ? '→ Considerou o tamanho do setor.'
                        : '→ Não considerou o tamanho do setor.'}
                    </p>
                  </div>
                </div>

                <div className="p-macro bg-feedback-info-lighter rounded-sm border border-feedback-info-light mb-macro">
                  <p className="ds-small text-neutral-darkest">
                    Em um disco, setores maiores possuem maior área e, portanto, maior probabilidade de serem sorteados.
                  </p>
                  <p className="ds-small text-neutral-darkest mt-micro">
                    A probabilidade está diretamente relacionada ao tamanho do setor, e não ao resultado anterior.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleSpinReflectionContinue}>
                    Vamos calcular as probabilidades
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 7: Leitura progressiva + Probabilidade angular θ/360 */}
          {gameState.stage === 2 && gameState.subStep === 7 && s2AngleReadingStep >= 0 && s2AngleReadingStep <= 3 && (
            <div
              className="bg-neutral-white p-macro rounded-md border-l-4 border-brand-otimath-dark shadow-sm w-full max-w-[480px] mx-auto"
              style={{ animation: 'alertShow 0.4s ease-out' }}
            >
              <p className="ds-body text-brand-otimath-dark leading-relaxed">
                {s2AngleReadingStep === 0 && (<>O disco representa todos os resultados possíveis do experimento.<br />Por isso, a probabilidade de o ponteiro parar em algum setor é <strong>1</strong>.</>)}
                {s2AngleReadingStep === 1 && (<>Observe que cada setor ocupa uma parte do disco e que quanto maior o ângulo central do setor, maior é a sua área.</>)}
                {s2AngleReadingStep === 2 && (<>Como as probabilidades são proporcionais às áreas, podemos comparar cada setor com o disco completo.</>)}
                {s2AngleReadingStep === 3 && (<>Assim, para calcular a probabilidade de um setor ser sorteado, basta dividir a medida do seu ângulo central por <strong>360°</strong>, que é o ângulo total do disco.</>)}
              </p>
              <div className="mt-macro flex justify-end">
                <Button style="primary" size="small" onClick={handleAngleReadingNext}>
                  Li.
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 7: Pergunta de ativação cognitiva (90°) */}
          {gameState.stage === 2 && gameState.subStep === 7 && s2AngleReadingStep === 4 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter" style={{ animation: 'alertShow 0.4s ease-out' }}>
              <p className="ds-body text-neutral-darkest mb-macro">Se um setor mede 90°, qual fração do disco ele representa?</p>
              <div className="flex flex-col gap-y-micro">
                {[
                  { value: '90/360', label: '90/360' },
                  { value: '1/90', label: '1/90' },
                  { value: '360/90', label: '360/90' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-x-micro p-micro rounded-sm border cursor-pointer transition-colors ${selectedOption === opt.value ? 'border-brand-otimath-pure bg-brand-otimath-lightest' : 'border-neutral-lighter hover:bg-neutral-lightest'}`}>
                    <input
                      type="radio"
                      name="q90"
                      value={opt.value}
                      checked={selectedOption === opt.value}
                      onChange={() => setSelectedOption(opt.value)}
                      className="mt-[1px]"
                    />
                    <span className="ds-body">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-macro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!selectedOption}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 7: Tabela θ/360 (após leitura progressiva) */}
          {gameState.stage === 2 && gameState.subStep === 7 && s2AngleReadingStep >= 5 && Object.keys(s2AngleProbInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Probabilidade Angular (θ/360)</h3>
              <p className="ds-small text-neutral-dark mb-micro">Estamos comparando cada setor com o disco completo (360°).</p>
              <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-brand-otimath-pure text-neutral-white">
                    <th className="p-micro text-left ds-small-bold">Cor</th>
                    <th className="p-micro text-center ds-small-bold">θ</th>
                    <th className="p-micro text-center ds-small-bold">θ/360</th>
                    <th className="p-micro text-center ds-small-bold">Decimal</th>
                    <th className="p-micro text-center ds-small-bold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.sectors.map((sector, idx) => (
                    <tr key={idx} className="border-b border-neutral-lighter">
                      <td className="p-micro">
                        <div className="flex items-center gap-x-micro">
                          <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                          <span className="ds-small">{sector.colorName}</span>
                        </div>
                      </td>
                      <td className="p-micro text-center ds-small">{gameState.s2Angles[idx]}°</td>
                      <td className="p-micro text-center">
                        {s2AngleProbInputs[sector.colorName]?.disabled && s2AngleProbInputs[sector.colorName]?.value ? (
                          <span className="ds-small-bold text-feedback-success-dark">{s2AngleProbInputs[sector.colorName].value}</span>
                        ) : (
                          <TextInput
                            textInput={{
                              ...s2AngleProbInputs[sector.colorName],
                              styles: 'w-[80px] h-[32px] text-center ds-small',
                              placeholder: 'a/b',
                            }}
                          />
                        )}
                      </td>
                      <td className="p-micro text-center ds-small">
                        {gameState.s2AngleProbDecimals[idx] || '-'}
                      </td>
                      <td className="p-micro text-center ds-small">
                        {gameState.s2AngleProbPercents[idx] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-micro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 8: Treinos de Fração θ/360 */}
          {gameState.stage === 2 && gameState.subStep === 8 && fracTraining.currentTraining > 0 && (
            <div className="flex flex-col gap-y-macro">
              {/* Título */}
              <h3 className="ds-body-bold text-brand-otimath-pure">
                Frequência Relativa e Probabilidade
              </h3>

              {/* Barra de progresso + Indicador do treino */}
              <div className="bg-brand-otimath-lightest p-micro rounded-sm border-l-4 border-brand-otimath-pure">
                <div className="flex items-center justify-between mb-nano">
                  <p className="ds-small-bold text-brand-otimath-dark">
                    Treino {fracTraining.currentTraining} de 5
                    {fracTraining.completedCount >= 2 && fracTraining.currentTraining > 2 && (
                      <span className="text-neutral-dark ds-caption ml-nano">(opcional)</span>
                    )}
                  </p>
                  <span className="ds-caption text-brand-otimath-medium">
                    {fracTraining.completedCount}/5 concluídos
                  </span>
                </div>
                <div className="w-full h-[6px] bg-neutral-lighter rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-otimath-pure rounded-full transition-all duration-500"
                    style={{ width: `${(fracTraining.completedCount / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Enunciado */}
              <p className="ds-small text-neutral-dark leading-relaxed">
                Ao girar o disco ao acaso um número muito grande de vezes (superior a 1 bilhão), determine a probabilidade de cada cor, isto é, o valor para o qual tende a frequência relativa.
              </p>

              {/* Lembre (regra conceitual) */}
              <div className="bg-feedback-info-lighter px-micro py-nano rounded-sm border-l-4 border-feedback-info-dark">
                <p className="ds-small text-neutral-darkest">
                  <strong>Lembre:</strong> A frequência relativa indica a proporção de vezes em que um resultado ocorre e, quando o experimento é repetido muitas vezes, tende à probabilidade do evento.
                </p>
              </div>

              {/* Tabela: Cor | Fração (θ/360) | Percentual | Status */}
              <div className="bg-neutral-white rounded-md border border-neutral-lighter overflow-hidden">
                <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-brand-otimath-pure text-neutral-white">
                      <th className="p-micro text-left ds-small-bold">Cor</th>
                      <th className="p-micro text-center ds-small-bold">Fração (θ/360)</th>
                      <th className="p-micro text-center ds-small-bold">Percentual</th>
                      <th className="p-micro text-center ds-small-bold w-[40px]"><span className="hidden">Header de marcação</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fracTraining.colors.map((color, idx) => {
                      const thetaInp = fracThetaInputs[color];
                      if (!thetaInp) return null;
                      const angle = fracTraining.angles[idx];
                      const pct = ((angle / 360) * 100);
                      const pctStr = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2).replace(/\.?0+$/, '')}%`;
                      return (
                        <tr key={idx} className={`border-b border-neutral-lighter transition-colors duration-300 ${thetaInp.status === 'correct' ? 'bg-feedback-success-lighter/40' : ''}`}>
                          {/* Cor */}
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[20px] h-[20px] rounded-full border-2 border-neutral-light shadow-sm"
                                   style={{ backgroundColor: ROULETTE_COLORS[color] || '#6c6c6c' }} />
                              <span className="ds-small-bold text-neutral-darkest">{color}</span>
                            </div>
                          </td>
                          {/* Fração θ/360 — input do aluno */}
                          <td className="p-micro text-center">
                            <div className="flex flex-col items-center gap-y-nano">
                              {thetaInp.status === 'correct' ? (
                                <span className="ds-small-bold text-feedback-success-dark">{thetaInp.value}</span>
                              ) : (
                                <TextInput textInput={{
                                  value: thetaInp.value,
                                  error: thetaInp.error,
                                  disabled: false,
                                  styles: 'w-[90px] h-[32px] text-center ds-small',
                                  placeholder: 'θ/360',
                                  setValue: (val: string) => {
                                    setFracThetaInputs(prev => ({
                                      ...prev,
                                      [color]: { ...prev[color], value: val, error: false, errorMsg: '' }
                                    }));
                                  }
                                }} />
                              )}
                              {thetaInp.error && thetaInp.errorMsg && (
                                <span className="ds-caption text-feedback-error-dark leading-tight">{thetaInp.errorMsg}</span>
                              )}
                            </div>
                          </td>
                          {/* Percentual — auto-preenchido quando θ/360 está correto */}
                          <td className="p-micro text-center">
                            {thetaInp.status === 'correct' ? (
                              <span className="ds-small-bold text-brand-otimath-dark">{pctStr}</span>
                            ) : (
                              <span className="ds-small text-neutral-light">—</span>
                            )}
                          </td>
                          {/* Status */}
                          <td className="p-micro text-center">
                            {thetaInp.status === 'correct' ? (
                              <Check className="w-[18px] h-[18px] text-feedback-success-dark mx-auto" />
                            ) : thetaInp.error ? (
                              <X className="w-[18px] h-[18px] text-feedback-error-dark mx-auto" />
                            ) : (
                              <span className="ds-small text-neutral-light">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
                {/* Conferir — só aparece enquanto não completou */}
                {!fracTraining.allCorrect && (
                  <div className="p-micro flex justify-center border-t border-neutral-lighter">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                      Conferir
                    </Button>
                  </div>
                )}
              </div>

              {/* Treino concluído — botões abaixo da tabela */}
              {fracTraining.allCorrect && (
                <div className="bg-feedback-success-lighter p-macro rounded-md border border-feedback-success-light">
                  <div className="flex items-center gap-x-micro mb-micro">
                    <Check className="w-[20px] h-[20px] text-feedback-success-dark" />
                    <p className="ds-body-bold text-feedback-success-darkest">
                      Treino {fracTraining.currentTraining} concluído!
                    </p>
                  </div>
                  <div className="flex gap-x-macro gap-y-micro justify-center flex-wrap">
                    {fracTraining.completedCount >= 2 && (
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleFracTrainingChangePhase}>
                        Mudar de fase
                      </Button>
                    )}
                    {fracTraining.currentTraining < 5 && (
                      <Button style="secondary" size="small" onClick={handleFracTrainingNext}>
                        Próximo exercício
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2 — SubStep 8.7: Simulação de Convergência */}
          {gameState.stage === 2 && gameState.subStep === 8.7 && (() => {
            const BLOCK_LABELS = ['10', '500', '1.000', '10.000', '20.000'];
            const BLOCK_SIZES = [10, 500, 1000, 10000, 20000];
            return (
            <div className="flex flex-col gap-y-macro">
              {/* Título */}
              <h3 className="ds-body-bold text-brand-otimath-pure">
                Simulação e Convergência das Frequências Relativas
              </h3>

              {/* Orientação */}
              <p className="ds-small text-neutral-dark leading-relaxed">
                Comece com poucos giros para perceber a variação. Depois, avance para blocos maiores e observe a convergência.
              </p>

              {/* Instrução visual */}
              <div className="bg-feedback-info-lighter px-micro py-nano rounded-sm border-l-4 border-feedback-info-dark">
                <p className="ds-small text-neutral-darkest">
                  Observe como a diferença entre a frequência relativa e a probabilidade teórica diminui à medida que o número de giros aumenta.
                </p>
              </div>

              {/* Painel de ações — blocos completados + botão atual */}
              <div className="bg-neutral-white rounded-md border border-neutral-lighter p-micro">
                {/* Blocos já completados */}
                {convergenceSim.currentBlock > 0 && (
                  <div className="flex flex-wrap gap-x-micro gap-y-nano mb-micro">
                    {BLOCK_LABELS.slice(0, convergenceSim.currentBlock).map((label, i) => (
                      <span key={i} className="inline-flex items-center gap-x-nano ds-caption text-feedback-success-dark bg-feedback-success-lighter px-nano py-nano rounded-sm">
                        <Check className="w-[12px] h-[12px]" /> {label} giros
                      </span>
                    ))}
                  </div>
                )}

                {/* Barra de progresso (enquanto roda um bloco) */}
                {convergenceSim.running && (
                  <div className="mb-micro">
                    <div className="flex items-center justify-between mb-nano">
                      <span className="ds-caption text-brand-otimath-medium">
                        Simulando +{BLOCK_LABELS[convergenceSim.currentBlock]} giros...
                      </span>
                      <span className="ds-caption text-brand-otimath-dark">{convergenceSim.progress}%</span>
                    </div>
                    <div className="w-full h-[6px] bg-neutral-lighter rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-otimath-medium transition-all duration-300"
                        style={{ width: `${convergenceSim.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Botão do bloco atual */}
                {convergenceSim.currentBlock < BLOCK_SIZES.length && !convergenceSim.running && (
                  <div className="flex justify-center">
                    <Button style="primary" size="small" icon={<Play />} onClick={handleConvergenceBlock}>
                      Girar {BLOCK_LABELS[convergenceSim.currentBlock]} vezes
                    </Button>
                  </div>
                )}

                {/* Total acumulado */}
                {gameState.totalSpins > 0 && (
                  <div className="flex justify-end mt-micro">
                    <span className="ds-small-bold text-brand-otimath-dark">
                      Total: {gameState.totalSpins.toLocaleString('pt-BR')} giros
                    </span>
                  </div>
                )}
              </div>

              {/* Tabela dinâmica */}
              {gameState.totalSpins > 0 && (
              <div className="bg-neutral-white rounded-md border border-neutral-lighter overflow-hidden">
                <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-brand-otimath-pure text-neutral-white">
                      <th className="p-micro text-left ds-small-bold">Cor</th>
                      <th className="p-micro text-center ds-small-bold">P. Teórica</th>
                      <th className="p-micro text-center ds-small-bold">Freq. Relativa</th>
                      <th className="p-micro text-center ds-small-bold">Diferença</th>
                      <th className="p-micro text-center ds-small-bold w-[80px]"><span className="hidden">Header de marcação</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameState.sectors.map((sector, idx) => {
                      const angle = sector.angle;
                      const theorProb = angle / 360;
                      const theorPct = (theorProb * 100).toFixed(1).replace('.', ',') + '%';
                      const absFreq = gameState.frequencies[sector.colorName] || 0;
                      const relFreq = gameState.totalSpins > 0 ? absFreq / gameState.totalSpins : 0;
                      const relFreqPct = (relFreq * 100).toFixed(1).replace('.', ',') + '%';
                      const diff = Math.abs(relFreq - theorProb);
                      const diffStr = diff.toFixed(4).replace('.', ',');

                      // Formato da freq. relativa: primeiros 10 giros → fração = decimal = %, depois → fração (%)
                      let freqRelStr: string;
                      if (gameState.totalSpins <= 10) {
                        const decStr = relFreq.toFixed(4).replace(/0+$/, '').replace(/\,$/, '').replace('.', ',');
                        freqRelStr = `${absFreq}/${gameState.totalSpins} = ${decStr} = ${relFreqPct}`;
                      } else {
                        freqRelStr = `${absFreq}/${gameState.totalSpins.toLocaleString('pt-BR')} (${relFreqPct})`;
                      }

                      // Cor da barra de convergência
                      let barColor = 'bg-feedback-error-lighter';
                      let barWidth = 100;
                      if (diff <= 0.005) { barColor = 'bg-feedback-success-light'; barWidth = 100; }
                      else if (diff <= 0.01) { barColor = 'bg-feedback-success-lighter'; barWidth = 75; }
                      else if (diff <= 0.05) { barColor = 'bg-feedback-warning-lighter'; barWidth = 50; }
                      else { barColor = 'bg-feedback-error-lighter'; barWidth = 25; }

                      return (
                        <tr key={idx} className="border-b border-neutral-lighter">
                          <td className="p-micro">
                            <div className="flex items-center gap-x-micro">
                              <div className="w-[16px] h-[16px] rounded-full border-2 border-neutral-light"
                                   style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                              <span className="ds-small-bold text-neutral-darkest">{sector.colorName}</span>
                            </div>
                          </td>
                          <td className="p-micro text-center">
                            <span className="ds-small text-neutral-dark">{angle}/360</span>
                            <span className="ds-caption text-neutral-dark block">({theorPct})</span>
                          </td>
                          <td className="p-micro text-center">
                            <span className="ds-caption text-neutral-darkest">{freqRelStr}</span>
                          </td>
                          <td className="p-micro text-center">
                            <span className="ds-caption text-neutral-dark">{diffStr}</span>
                          </td>
                          <td className="p-micro">
                            <div className="w-full h-[8px] bg-neutral-lighter rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
              )}

              {/* Card final — Lei dos Grandes Números (após todos os blocos) */}
              {convergenceSim.currentBlock >= BLOCK_SIZES.length && !convergenceSim.running && (
                <div className="bg-feedback-info-lighter p-macro rounded-md border border-feedback-info-light">
                  <p className="ds-body-bold text-brand-otimath-dark mb-micro">
                    Lei dos Grandes Números
                  </p>
                  <p className="ds-small text-neutral-darkest leading-relaxed mb-micro">
                    À medida que você aumenta o número de giros, as frequências relativas se aproximam das probabilidades teóricas.
                    Isso ilustra a <strong>Lei dos Grandes Números</strong>.
                  </p>
                  <p className="ds-small text-neutral-dark leading-relaxed mb-macro">
                    Note que a diferença entre os valores tende a diminuir, evidenciando a convergência.
                  </p>
                  <div className="flex justify-center">
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={startStage3}>
                      Ir para a Etapa 3
                    </Button>
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* Stage 2 — SubStep 9: Botão Sortear (giros manuais) */}
          {gameState.stage === 2 && gameState.subStep === 9 && !gameState.pendingRegistration && (
            <Button
              style="primary"
              size="medium"
              icon={<Play />}
              onClick={spinRoulette}
              disabled={disabledSpinButton || gameState.isSpinning}
            >
              {gameState.isSpinning ? 'Girando...' : 'Sortear'}
            </Button>
          )}

          {/* Stage 2 — SubStep 9: Registro de cor (giros manuais) */}
          {gameState.stage === 2 && gameState.subStep === 9 && gameState.pendingRegistration && (
            <div className="flex flex-col gap-y-micro items-center bg-neutral-white p-macro rounded-md border border-brand-otimath-light">
              <p className="ds-small-bold text-brand-otimath-pure">Registre a cor que saiu:</p>
              <div className="flex flex-wrap gap-micro justify-center">
                {uniqueColorNames.map((colorName) => (
                  <Button
                    key={colorName}
                    style="secondary"
                    size="small"
                    onClick={() => registerColor(colorName)}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-micro border border-neutral-medium"
                      style={{ backgroundColor: ROULETTE_COLORS[colorName] }}
                      aria-hidden="true"
                    ></span>
                    {colorName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 9: Tabela de frequências durante giros manuais */}
          {gameState.stage === 2 && gameState.subStep === 9 && gameState.totalSpins > 0 && (
            <RouletteTable
              title="Tabela de Frequências"
              data={frequencyData}
              showRelativeFrequency={false}
              showPercentage={false}
              showTheoreticalProbability={false}
              totalSpins={gameState.totalSpins}
              editable={false}
            />
          )}

          {/* Stage 2 — SubStep 9.1: Verificar frequências absolutas */}
          {gameState.stage === 2 && gameState.subStep === 9.1 && Object.keys(s2FreqAbsInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Verificação das Frequências Absolutas</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Preencha a frequência absoluta observada para cada cor:
              </p>
              <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-brand-otimath-pure text-neutral-white">
                    <th className="p-micro text-left ds-small-bold">Cor</th>
                    <th className="p-micro text-center ds-small-bold">Freq. Absoluta</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.sectors.map((sector, idx) => (
                    <tr key={idx} className="border-b border-neutral-lighter">
                      <td className="p-micro">
                        <div className="flex items-center gap-x-micro">
                          <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                          <span className="ds-small">{sector.colorName}</span>
                        </div>
                      </td>
                      <td className="p-micro text-center">
                        <TextInput
                          textInput={{
                            ...s2FreqAbsInputs[sector.colorName],
                            styles: 'w-[60px] h-[32px] text-center ds-small',
                            placeholder: '?',
                            type: 'natural-number',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-micro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 9.2: Pergunta de incerteza */}
          {gameState.stage === 2 && gameState.subStep === 9.2 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={disabledCheckButton}
            />
          )}

          {/* Stage 2 — SubStep 9.3: Frequência relativa (campo a campo) */}
          {gameState.stage === 2 && gameState.subStep === 9.3 && Object.keys(s2FreqRelInputs).length > 0 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Frequência Relativa</h3>
              <div className="overflow-x-auto"><table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-brand-otimath-pure text-neutral-white">
                    <th className="p-micro text-left ds-small-bold">Cor</th>
                    <th className="p-micro text-center ds-small-bold">Freq. Abs.</th>
                    <th className="p-micro text-center ds-small-bold">Freq. Rel.</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.sectors.map((sector, idx) => (
                    <tr key={idx} className="border-b border-neutral-lighter">
                      <td className="p-micro">
                        <div className="flex items-center gap-x-micro">
                          <div className="w-[20px] h-[20px] rounded-sm border border-neutral-dark" style={{ backgroundColor: ROULETTE_COLORS[sector.colorName] || '#6c6c6c' }} />
                          <span className="ds-small">{sector.colorName}</span>
                        </div>
                      </td>
                      <td className="p-micro text-center ds-small">{gameState.frequencies[sector.colorName] || 0}</td>
                      <td className="p-micro text-center">
                        {s2FreqRelInputs[sector.colorName]?.disabled && s2FreqRelInputs[sector.colorName]?.value ? (
                          <span className="ds-small-bold text-feedback-success-dark">{s2FreqRelInputs[sector.colorName].value}</span>
                        ) : (
                          <TextInput
                            textInput={{
                              ...s2FreqRelInputs[sector.colorName],
                              styles: 'w-[80px] h-[32px] text-center ds-small',
                              placeholder: `a/${gameState.s2ManualSpinsP}`,
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-lighter">
                    <td className="p-micro ds-small-bold">Total:</td>
                    <td className="p-micro text-center ds-small-bold">{gameState.totalSpins}</td>
                    <td className="p-micro text-center ds-small-bold">-</td>
                  </tr>
                </tfoot>
              </table></div>
              <div className="mt-micro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 11: Conclusão */}
          {gameState.stage === 2 && gameState.subStep === 11 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Conclusão</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                À medida que o número de giros aumenta, as frequências relativas se aproximam de quais valores?
              </p>
              <div className="flex items-center gap-x-macro justify-center">
                <TextInput
                  textInput={{
                    ...s2ConclusionInput,
                    placeholder: 'Digite sua resposta',
                    styles: 'w-[250px] text-center',
                  }}
                />
              </div>
              <div className="mt-macro flex justify-center">
                <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={disabledCheckButton}>
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 2 — SubStep 12: Etapa 2 Concluída */}
          {gameState.stage === 2 && gameState.subStep === 12 && (
            <div className="bg-feedback-success-lighter p-macro rounded-md border border-feedback-success-light text-center">
              <p className="ds-body-bold text-feedback-success-darkest mb-micro">Etapa 2 Concluída!</p>
              <p className="ds-small text-neutral-dark mb-macro">
                Você explorou frequências relativas e a Lei dos Grandes Números. Clique abaixo para avançar.
              </p>
              <div className="flex justify-center">
                <Button style="primary" size="medium" icon={<ArrowRight />} onClick={startStage3}>
                  Ir para a Etapa 3
                </Button>
              </div>
            </div>
          )}

          {/* ===================== FIM ETAPA 2 ===================== */}

          {/* ===================== ETAPA 3 ===================== */}

          {/* Badge da aposta (persistente durante toda a Etapa 3) */}
          {gameState.stage === 3 && s3State.betColor && (
            <div className="bg-neutral-white rounded-sm px-micro py-nano border border-neutral-lighter flex items-center gap-x-micro">
              <span className="ds-caption text-neutral-dark">Sua aposta:</span>
              <div className="w-[14px] h-[14px] rounded-full border border-neutral-lighter" style={{ backgroundColor: ROULETTE_COLORS[s3State.betColor] }} />
              <span className="ds-small-bold">{s3State.betColor} (Setor {s3State.betSector + 1})</span>
            </div>
          )}

          {/* Stage 3 — SubStep 0.5: Previsão visual (antes da aposta) — oculto durante InfoBox de transição */}
          {gameState.stage === 3 && gameState.subStep === 0.5 && !showInfoBox && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Previsão inicial</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Observando o disco, qual cor parece ocupar <strong>mais espaço</strong>?
              </p>
              <div className="flex flex-col gap-y-micro mb-macro" role="radiogroup" aria-label="Escolha a cor que ocupa mais espaço">
                {Object.keys(s3State.colorCounts).map(color => (
                  <button
                    key={color}
                    className={`flex items-center gap-x-micro p-micro rounded-sm border text-left transition-all min-h-[44px] cursor-pointer ${
                      selectedOption === color
                        ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                        : 'border-neutral-lighter bg-neutral-white hover:bg-neutral-lightest'
                    }`}
                    onClick={() => setSelectedOption(color)}
                    aria-pressed={selectedOption === color}
                  >
                    <div className="w-[18px] h-[18px] rounded-full border border-neutral-lighter shrink-0" style={{ backgroundColor: ROULETTE_COLORS[color] }} aria-hidden="true" />
                    <span className="ds-small-bold">{color}</span>
                  </button>
                ))}
                <button
                  className={`flex items-center gap-x-micro p-micro rounded-sm border text-left transition-all min-h-[44px] cursor-pointer ${
                    selectedOption === 'iguais'
                      ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                      : 'border-neutral-lighter bg-neutral-white hover:bg-neutral-lightest'
                  }`}
                  onClick={() => setSelectedOption('iguais')}
                  aria-pressed={selectedOption === 'iguais'}
                >
                  <span className="ds-small-bold">Todas parecem ocupar o mesmo espaço</span>
                </button>
              </div>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={() => handleS3ConfirmPrediction(selectedOption)}
                  disabled={!selectedOption}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 1: Aposta (clique no disco) */}
          {gameState.stage === 3 && gameState.subStep === 1 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Faça sua aposta!</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Clique em um setor do disco para apostar em uma cor. Escolha a cor que você acha que tem maior probabilidade de ser sorteada.
              </p>
              {s3State.betColor && (
                <div className="flex items-center gap-x-micro mb-macro p-micro rounded-sm bg-feedback-info-lighter border border-feedback-info-light">
                  <div className="w-[18px] h-[18px] rounded-full border border-neutral-lighter" style={{ backgroundColor: ROULETTE_COLORS[s3State.betColor] }} />
                  <span className="ds-small-bold text-feedback-info-darkest">
                    Cor selecionada: {s3State.betColor} (Setor {s3State.betSector + 1})
                  </span>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={handleS3ConfirmBet}
                  disabled={!s3State.betColor}
                >
                  Confirmar aposta
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 1.5: Questão diagnóstica (justificativa) */}
          {gameState.stage === 3 && gameState.subStep === 1.5 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 1.75: Contagem de setores por cor */}
          {gameState.stage === 3 && gameState.subStep === 1.75 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Observe os setores</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Quantos setores de cada cor existem no disco?
              </p>
              <div className="flex flex-col gap-y-micro mb-macro">
                {Object.keys(s3State.colorCounts).map(color => {
                  const inp = s3State.countInputs[color];
                  if (!inp) return null;
                  return (
                    <div key={color} className="flex items-center gap-x-micro">
                      <div className="w-[18px] h-[18px] rounded-full border border-neutral-lighter shrink-0" style={{ backgroundColor: ROULETTE_COLORS[color] }} />
                      <span className="ds-small-bold w-[80px]">{color}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="?"
                        className={`w-[50px] p-nano rounded-sm border-hairline ds-small text-center ${
                          inp.correct
                            ? 'border-feedback-success-medium bg-feedback-success-lightest text-feedback-success-darkest'
                            : inp.error
                              ? 'border-feedback-error-medium bg-feedback-error-lightest'
                              : 'border-neutral-light bg-neutral-white'
                        }`}
                        value={inp.value}
                        onChange={(e) => {
                          if (inp.correct) return;
                          const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
                          setS3State(prev => ({
                            ...prev,
                            countInputs: {
                              ...prev.countInputs,
                              [color]: { ...prev.countInputs[color], value: v, error: false }
                            }
                          }));
                        }}
                        disabled={inp.correct}
                      />
                      {inp.correct && (
                        <span className="ds-caption text-feedback-success-dark">setor(es)</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={() => checkAnswer()}
                >
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 2: Tabela P(cor) = a/b */}
          {gameState.stage === 3 && gameState.subStep === 2 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Probabilidade de cada cor</h3>
              <p className="ds-small text-neutral-dark mb-macro">
                Ao girar aleatoriamente o disco apresentado, calcule a probabilidade de o ponteiro parar em cada uma das cores indicadas.
              </p>
              <div className="flex flex-col gap-y-micro">
                {Object.entries(s3State.colorCounts).map(([color]) => {
                  const inp = s3State.probInputs[color];
                  if (!inp) return null;
                  const isCorrect = inp.status === 'correct';
                  return (
                    <div key={color} className="flex items-center gap-x-micro gap-y-nano flex-wrap">
                      <div className="w-[18px] h-[18px] rounded-full border border-neutral-lighter shrink-0" style={{ backgroundColor: ROULETTE_COLORS[color] }} aria-hidden="true" />
                      <span className="ds-small-bold w-[80px]">{color}</span>
                      {/* Bloco matemático: fração + "= decimal" + "= percent%".
                          Tem seu próprio flex-wrap interno para que, quando o
                          resultado não couber ao lado da fração, ele quebre
                          ALINHADO à esquerda do bloco (logo após o nome da cor)
                          — não na borda absoluta do container, o que fazia o
                          resultado parecer desconectado da fração. */}
                      <div className="flex flex-wrap items-center gap-x-nano gap-y-nano">
                        {/* "P =" + fração: nunca quebra entre o "=" e o numerador. */}
                        <div className="flex flex-nowrap items-center gap-x-nano">
                          <span className="ds-small text-neutral-dark whitespace-nowrap" aria-hidden="true">P =</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="a"
                            aria-label={`Numerador da probabilidade da cor ${color}`}
                            aria-invalid={inp.errorNum}
                            aria-describedby={inp.errorMsg && !isCorrect ? `s3-prob-err-${color}` : undefined}
                            className={`w-[42px] p-nano rounded-sm border-hairline ds-small text-center ${
                              isCorrect
                                ? 'border-feedback-success-medium bg-feedback-success-lightest text-feedback-success-darkest'
                                : inp.errorNum
                                  ? 'border-feedback-error-medium bg-feedback-error-lightest'
                                  : 'border-neutral-light bg-neutral-white'
                            }`}
                            value={inp.num}
                            onChange={(e) => {
                              if (isCorrect) return;
                              setS3State(prev => ({
                                ...prev,
                                probInputs: {
                                  ...prev.probInputs,
                                  [color]: { ...prev.probInputs[color], num: e.target.value, errorNum: false, errorMsg: '' }
                                }
                              }));
                            }}
                            disabled={isCorrect}
                          />
                          <span className="ds-body-bold text-neutral-dark" aria-hidden="true">/</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="b"
                            aria-label={`Denominador da probabilidade da cor ${color}`}
                            aria-invalid={inp.errorDen}
                            aria-describedby={inp.errorMsg && !isCorrect ? `s3-prob-err-${color}` : undefined}
                            className={`w-[42px] p-nano rounded-sm border-hairline ds-small text-center ${
                              isCorrect
                                ? 'border-feedback-success-medium bg-feedback-success-lightest text-feedback-success-darkest'
                                : inp.errorDen
                                  ? 'border-feedback-error-medium bg-feedback-error-lightest'
                                  : 'border-neutral-light bg-neutral-white'
                            }`}
                            value={inp.den}
                            onChange={(e) => {
                              if (isCorrect) return;
                              setS3State(prev => ({
                                ...prev,
                                probInputs: {
                                  ...prev.probInputs,
                                  [color]: { ...prev.probInputs[color], den: e.target.value, errorDen: false, errorMsg: '' }
                                }
                              }));
                            }}
                            disabled={isCorrect}
                          />
                        </div>
                        {(() => {
                          const numVal = parseFloat(inp.num);
                          const denVal = parseFloat(inp.den);
                          if (!isNaN(numVal) && !isNaN(denVal) && denVal > 0) {
                            const decimal = (numVal / denVal).toFixed(4).replace('.', ',').replace(/0+$/, '').replace(/,$/, '');
                            const percent = ((numVal / denVal) * 100).toFixed(2).replace('.', ',').replace(/0+$/, '').replace(/,$/, '');
                            const colorClass = isCorrect ? 'text-feedback-success-dark' : 'text-neutral-dark';
                            // Cada "= valor" é uma unidade matemática indivisível
                            // (whitespace-nowrap impede que o "=" fique órfão no fim
                            // de uma linha). As duas unidades podem quebrar entre si.
                            return (
                              <>
                                <span className={`ds-caption ${colorClass} whitespace-nowrap`}>= {decimal}</span>
                                <span className={`ds-caption ${colorClass} whitespace-nowrap`}>= {percent}%</span>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {inp.errorMsg && !isCorrect && (
                        <span id={`s3-prob-err-${color}`} className="ds-caption text-feedback-error-dark" role="alert">{inp.errorMsg}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-macro flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={Object.values(s3State.probInputs).every(i => i.status === 'correct')}
                >
                  Conferir
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 3: P(setor) = 1/n */}
          {gameState.stage === 3 && gameState.subStep === 3 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 4: Comparação dos espaços */}
          {gameState.stage === 3 && gameState.subStep === 4 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 5: Falácia do jogador */}
          {gameState.stage === 3 && gameState.subStep === 5 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 6: Ancoragem numérica */}
          {gameState.stage === 3 && gameState.subStep === 6 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 7: Generalização */}
          {gameState.stage === 3 && gameState.subStep === 7 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 8: Autoconfrontação */}
          {gameState.stage === 3 && gameState.subStep === 8 && currentQuestion && (
            <RouletteQuestion
              question={currentQuestion.question}
              type="multiple-choice"
              options={currentQuestion.options}
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
              onCheck={checkAnswer}
              disabled={!selectedOption}
            />
          )}

          {/* Stage 3 — SubStep 8.1: Falácia do jogador — girar 5 vezes */}
          {gameState.stage === 3 && gameState.subStep === 8.1 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Observe os resultados do disco</h3>
              <p className="ds-small text-neutral-dark mb-micro">
                Você havia escolhido a cor <strong>{s3State.betColor}</strong>.
                Agora observe alguns resultados. Gire o disco 5 vezes.
              </p>
              <p className="ds-small-bold text-brand-otimath-dark mb-macro">
                Giro {s3State.spinCount} de 5
              </p>

              {/* Histórico visual */}
              {s3State.spinHistory.length > 0 && (
                <div className="flex flex-wrap gap-micro mb-macro">
                  {s3State.spinHistory.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-x-nano px-micro py-nano rounded-sm bg-neutral-lightest border border-neutral-lighter">
                      <div className="w-[14px] h-[14px] rounded-full border border-neutral-lighter" style={{ backgroundColor: ROULETTE_COLORS[color] }} />
                      <span className="ds-caption">{color}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-x-macro justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<Play />}
                  onClick={spinRouletteS3}
                  disabled={gameState.isSpinning || s3State.spinCount >= 5}
                >
                  {gameState.isSpinning ? 'Girando...' : 'Girar'}
                </Button>
                <Button
                  style="secondary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={handleS3FallacyContinue}
                  disabled={s3State.spinCount < 5}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 8.2: Percepção do padrão */}
          {gameState.stage === 3 && gameState.subStep === 8.2 && currentQuestion && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              {/* Histórico visual (persistente) */}
              <div className="flex flex-wrap gap-micro mb-macro">
                {s3State.spinHistory.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-x-nano px-micro py-nano rounded-sm bg-neutral-lightest border border-neutral-lighter">
                    <div className="w-[14px] h-[14px] rounded-full border border-neutral-lighter" style={{ backgroundColor: ROULETTE_COLORS[color] }} />
                    <span className="ds-caption">{color}</span>
                  </div>
                ))}
              </div>
              <RouletteQuestion
                question={currentQuestion.question}
                type="multiple-choice"
                options={currentQuestion.options}
                selectedOption={selectedOption}
                onOptionSelect={setSelectedOption}
                onCheck={checkAnswer}
                disabled={!selectedOption}
              />
            </div>
          )}

          {/* Stage 3 — SubStep 8.3: Nova aposta */}
          {gameState.stage === 3 && gameState.subStep === 8.3 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Faça sua aposta novamente</h3>
              <p className="ds-small text-neutral-dark mb-micro">
                Com base nos resultados observados, você pode manter ou mudar sua aposta.
              </p>
              <p className="ds-small text-neutral-dark mb-macro">
                Aposta anterior: <strong>{s3State.betColor}</strong>
              </p>
              {/* Histórico visual */}
              <div className="flex flex-wrap gap-micro mb-macro">
                {s3State.spinHistory.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-x-nano px-micro py-nano rounded-sm bg-neutral-lightest border border-neutral-lighter">
                    <div className="w-[14px] h-[14px] rounded-full border border-neutral-lighter" style={{ backgroundColor: ROULETTE_COLORS[color] }} />
                    <span className="ds-caption">{color}</span>
                  </div>
                ))}
              </div>
              {/* Botões de cores */}
              <div className="flex flex-col gap-y-micro mb-macro" role="radiogroup" aria-label="Escolha a cor para nova aposta">
                {Object.keys(s3State.colorCounts).map(color => (
                  <button
                    key={color}
                    className={`flex items-center gap-x-micro p-micro rounded-sm border text-left transition-all min-h-[44px] cursor-pointer ${
                      s3State.newBetColor === color
                        ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                        : 'border-neutral-lighter bg-neutral-white hover:bg-neutral-lightest'
                    }`}
                    onClick={() => setS3State(prev => ({ ...prev, newBetColor: color }))}
                    aria-pressed={s3State.newBetColor === color}
                  >
                    <div className="w-[18px] h-[18px] rounded-full border border-neutral-lighter shrink-0" style={{ backgroundColor: ROULETTE_COLORS[color] }} aria-hidden="true" />
                    <span className="ds-small-bold">{color}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={handleS3NewBetConfirm}
                  disabled={!s3State.newBetColor}
                >
                  Confirmar aposta
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 8.4: Conflito cognitivo */}
          {gameState.stage === 3 && gameState.subStep === 8.4 && currentQuestion && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <div className="bg-feedback-info-lighter p-micro rounded-sm border border-feedback-info-light mb-macro">
                <p className="ds-small text-neutral-dark">
                  O disco utilizado no simulador é justo. Todos os {s3State.n} setores possuem o mesmo tamanho.
                </p>
                <p className="ds-small-bold text-brand-otimath-dark mt-nano">
                  P(setor) = 1/{s3State.n} = {((1 / s3State.n) * 100).toFixed(1).replace('.', ',')}%
                </p>
              </div>
              <RouletteQuestion
                question={currentQuestion.question}
                type="multiple-choice"
                options={currentQuestion.options}
                selectedOption={selectedOption}
                onOptionSelect={setSelectedOption}
                onCheck={checkAnswer}
                disabled={!selectedOption}
              />
            </div>
          )}

          {/* Stage 3 — SubStep 8.5: Institucionalização da Falácia do Jogador */}
          {gameState.stage === 3 && gameState.subStep === 8.5 && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
              <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Falácia do Jogador</h3>
              <div className="ds-small text-neutral-dark space-y-micro">
                <p>
                  A <strong>Falácia do Jogador</strong> ocorre quando acreditamos que resultados passados influenciam resultados futuros em experimentos aleatórios independentes.
                </p>
                <p>
                  No caso do disco:
                </p>
                <p className="ds-small-bold text-brand-otimath-dark text-center">
                  P(setor) = 1/{s3State.n} = {((1 / s3State.n) * 100).toFixed(1).replace('.', ',')}%
                </p>
                <p>
                  Essa probabilidade permanece sempre a mesma, independentemente dos resultados anteriores. Mesmo que uma cor tenha aparecido muitas vezes seguidas, a chance de cada setor ser sorteado continua sendo 1/{s3State.n}.
                </p>
              </div>
              <div className="mt-macro flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={handleS3FallacyFinish}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — SubStep 9: Institucionalização final */}
          {gameState.stage === 3 && gameState.subStep === 9 && (() => {
            const mfc = s3State.mostFreqColor;
            const sfc = s3State.secondFreqColor;
            const mfcCount = s3State.colorCounts[mfc] || 0;
            const sfcCount = s3State.colorCounts[sfc] || 0;
            const pred = s3State.predictionColor;
            const bet = s3State.betColor;
            const predictionMatched = pred === mfc;
            const betWon = bet === mfc;

            return (
              <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter">
                <h3 className="ds-body-bold text-brand-otimath-pure mb-micro">Sua jornada na Etapa 3</h3>
                <div className="flex flex-col gap-y-micro ds-small text-neutral-dark">
                  <p>
                    <strong>Sua previsão visual:</strong> Ao observar o disco, você indicou que <strong>{pred === 'iguais' ? 'todas as cores pareciam ocupar o mesmo espaço' : `a cor ${pred} parecia ocupar mais espaço`}</strong>.
                    {predictionMatched
                      ? ` De fato, ${mfc} é a cor com mais setores (${mfcCount} de ${s3State.n}).`
                      : pred === 'iguais'
                        ? ` Porém, ${mfc} possui ${mfcCount} setores e ${sfc} possui ${sfcCount} — as cores não ocupam o mesmo espaço. Isso é o viés perceptual.`
                        : ` Porém, a cor com mais setores é ${mfc} (${mfcCount} setores), não ${pred}. A disposição agrupada de ${sfc} (${sfcCount} setores) criou uma ilusão visual — isso é o viés perceptual.`
                    }
                  </p>
                  <p>
                    <strong>Sua aposta:</strong> Você apostou na cor <strong>{bet}</strong>.
                    {betWon
                      ? ` Boa escolha! ${bet} é de fato a cor mais provável, com P(${bet}) = ${mfcCount}/${s3State.n}.`
                      : ` A cor mais provável era ${mfc}, com P(${mfc}) = ${mfcCount}/${s3State.n}. A aparência visual pode ter influenciado sua escolha.`
                    }
                  </p>
                  <p>
                    <strong>Falácia do jogador:</strong> Sobre a influência de giros anteriores, {s3State.perceptionAnswer === 'sim'
                      ? 'você indicou que resultados passados influenciam os futuros — essa é a chamada falácia do jogador.'
                      : s3State.perceptionAnswer === 'nao'
                        ? 'você reconheceu corretamente que cada giro é independente.'
                        : 'você refletiu sobre essa questão.'
                    } Cada giro do disco é um experimento <strong>independente</strong>: o disco não tem memória.
                  </p>
                  <p>
                    <strong>Conceito-chave:</strong> Quando os setores são iguais, cada setor tem probabilidade 1/{s3State.n}. Mas o espaço das <em>cores</em> pode não ser equiprovável — a contagem de setores por cor, e não a impressão visual, deve guiar o cálculo.
                  </p>
                </div>
                <div className="mt-macro flex justify-center">
                  <Button
                    style="primary"
                    size="medium"
                    icon={<Check />}
                    onClick={() => handleS3Finalize(!!onFinished)}
                  >
                    Finalizar
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Stage 3 — SubStep 10: Tela final.
              No OVA standalone: apenas celebração + estatísticas (sem botões).
              Na sequência didática (onFinished definido): único botão
              "Continuar a Sequência" que avança direto para a próxima cena
              da trilha (TransitionSection antes do OVA Dois Dados),
              pulando o subStep 11 (Reflexão de ponte) que duplicaria o conteúdo
              de transição já renderizado pela própria sequência. */}
          {gameState.stage === 3 && gameState.subStep === 10 && (
            <div className="flex flex-col gap-y-xxs">
              <div className="bg-feedback-success-lighter p-macro rounded-md border border-feedback-success-light text-center flex flex-col items-center gap-y-macro">
                <p className="ds-body-bold text-feedback-success-darkest">Atividade Concluída!</p>
                <p className="ds-small text-neutral-dark">
                  Você explorou espaços equiprováveis e não equiprováveis, identificou vieses cognitivos e refletiu sobre suas escolhas. Parabéns!
                </p>
                <div className="flex gap-x-micro gap-y-micro flex-wrap justify-center">
                  {/* Revisar conceitos — abre o StudyMenu (mesmo modal do
                      OVA Dois Dados). Visível tanto no fluxo standalone
                      quanto na sequência didática. */}
                  <Button
                    style="borderless"
                    size="small"
                    icon={<BookOpen />}
                    onClick={() => setRouletteStudyMenuOpen(true)}
                  >
                    Revisar conceitos
                  </Button>
                  {onFinished && (
                    <Button style="primary" size="medium" icon={<ArrowRight />} onClick={onFinished}>
                      Continuar a Sequência
                    </Button>
                  )}
                </div>
              </div>
              {/* Card de estatísticas do OVA do Disco — mesmo formato dos
                  cards da tela final da sequência, mas restrito a este
                  OVA. Só aparece quando o aluno está dentro da sequência
                  didática (onFinished definido). */}
              {onFinished && <RouletteFinalStats />}
            </div>
          )}

          {/* Modal de revisão de conceitos — usa o glossário e os grupos
              do OVA do Disco (exemplos com setores, ponteiro, giros). */}
          <StudyMenu
            open={rouletteStudyMenuOpen}
            onClose={() => setRouletteStudyMenuOpen(false)}
            entries={DISCO_GLOSSARY}
            groups={DISCO_GROUPS}
          />


          {/* Stage 3 — SubStep 11: Reflexão de ponte com OVA 2.
              Só aparece na sequência didática (onFinished definido). No OVA
              standalone, handleS3Finalize roteia direto para subStep 10
              (Atividade Concluída) — Reflexão e botão de continuar só fazem
              sentido quando há um próximo OVA na trilha. */}
          {gameState.stage === 3 && gameState.subStep === 11 && onFinished && (
            <div className="flex flex-col items-center gap-y-xxs">
              <div className="w-full max-w-[650px] rounded-lg p-xxs border-l-4 border-brand-otimath-pure bg-brand-otimath-lightest">
                <p className="ds-body-bold text-brand-otimath-dark mb-micro">Reflexão para o próximo desafio</p>
                <p className="ds-body mb-micro">
                  Você verificou que, ao lançar um dado justo, cada face tem a mesma probabilidade: <strong>1/6</strong>.
                </p>
                <p className="ds-body mb-micro">
                  Agora imagine lançar <strong>dois dados</strong> e somar os resultados. As somas possíveis são: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 e 12.
                </p>
                <p className="ds-body mb-micro">
                  Será que todas essas somas têm a mesma chance de ocorrer? Se cada face isolada é equiprovável... as somas também seriam?
                </p>
                <p className="ds-body text-brand-otimath-dark italic">
                  Pense nisso. A resposta pode te surpreender.
                </p>
              </div>
              <Button
                style="primary"
                size="small"
                icon={<Check />}
                onClick={handleS3DismissReflexao}
              >
                Li.
              </Button>
            </div>
          )}

          {/* ===================== FIM ETAPA 3 ===================== */}

          {/* Bloco de Interpretação dos Resultados (subStep 14, antes de "Próxima Etapa") */}
          {gameState.subStep === 14 && interpretationPhase !== 'done' && (() => {
            const n = gameState.targetSectorCount;
            const probPercent = ((1 / n) * 100).toFixed(1).replace('.', ',');
            return (
              <div className="w-full max-w-[600px] mx-auto flex flex-col gap-xxxs">
                <h3 className="ds-body-large-bold text-brand-otimath-dark text-center">Interpretação dos Resultados</h3>

                {/* Pergunta 1 — só aparece na fase q1 */}
                {interpretationPhase === 'q1' && (
                  <div className="rounded-md p-xxs border-hairline border-neutral-light bg-neutral-white">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">Todos os setores tiveram frequências relativas iguais no experimento?</p>
                    <div className="flex flex-col gap-nano">
                      <label className="flex items-start gap-nano ds-body cursor-pointer">
                        <input type="radio" name="interp_q1" className="mt-1 shrink-0" value="sim" checked={interpretationSelected === 'sim'} onChange={() => setInterpretationSelected('sim')} />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-start gap-nano ds-body cursor-pointer">
                        <input type="radio" name="interp_q1" className="mt-1 shrink-0" value="nao" checked={interpretationSelected === 'nao'} onChange={() => setInterpretationSelected('nao')} />
                        <span>Não</span>
                      </label>
                    </div>
                    <div className="mt-nano flex justify-end">
                      <Button style="primary" size="small" icon={<Check />} onClick={handleInterpretationCheck} disabled={!interpretationSelected}>Conferir</Button>
                    </div>
                  </div>
                )}

                {/* Pergunta 2 — só aparece na fase q2 */}
                {interpretationPhase === 'q2' && (
                  <div className="rounded-md p-xxs border-hairline border-neutral-light bg-neutral-white">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">As frequências relativas ficaram muito próximas da probabilidade teórica (1/{n} ≈ {probPercent}%)?</p>
                    <div className="flex flex-col gap-nano">
                      <label className="flex items-start gap-nano ds-body cursor-pointer">
                        <input type="radio" name="interp_q2" className="mt-1 shrink-0" value="sim" checked={interpretationSelected === 'sim'} onChange={() => setInterpretationSelected('sim')} />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-start gap-nano ds-body cursor-pointer">
                        <input type="radio" name="interp_q2" className="mt-1 shrink-0" value="nao" checked={interpretationSelected === 'nao'} onChange={() => setInterpretationSelected('nao')} />
                        <span>Não</span>
                      </label>
                    </div>
                    <div className="mt-nano flex justify-end">
                      <Button style="primary" size="small" icon={<Check />} onClick={handleInterpretationCheck} disabled={!interpretationSelected}>Conferir</Button>
                    </div>
                  </div>
                )}

                {/* Pergunta 3 — alternativas dinâmicas, só aparece na fase q3 */}
                {interpretationPhase === 'q3' && interpretationQ3 && (
                  <div className="rounded-md p-xxs border-hairline border-neutral-light bg-neutral-white">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">Por qual motivo as frequências relativas não ficaram exatamente iguais a 1/{n} (≈ {probPercent}%)?</p>
                    <div className="flex flex-col gap-nano">
                      {interpretationQ3.alternatives.map((alt) => (
                        <label key={alt.id} className="flex items-start gap-nano ds-body cursor-pointer">
                          <input type="radio" name="interp_q3" className="mt-1 shrink-0" value={alt.id} checked={interpretationSelected === alt.id} onChange={() => setInterpretationSelected(alt.id)} />
                          <span>{alt.text}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-nano flex justify-end">
                      <Button style="primary" size="small" icon={<Check />} onClick={handleInterpretationCheck} disabled={!interpretationSelected}>Conferir</Button>
                    </div>
                  </div>
                )}

                {/* Feedback pedagógico */}
                {interpretationPhase === 'feedback' && (
                  <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                    <p className="ds-body-bold text-brand-otimath-dark mb-nano">A variabilidade amostral diminui quando o número de repetições cresce, mas não desaparece completamente.</p>
                    <p className="ds-small text-brand-otimath-dark">Mesmo com muitas repetições, os resultados observados raramente ficam exatamente iguais à probabilidade teórica. A Lei dos Grandes Números afirma apenas que eles tendem a se aproximar.</p>
                    <div className="mt-nano flex justify-end">
                      <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleInterpretationContinue}>Continuar</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* SubStep 15: Problemas de consolidação LGN.
              Antes o gate incluía `subStep === 15.5` (subStep intermediário
              durante o InfoBox de formalização da LGN), mas com isso o
              título "Consolidação: Lei dos Grandes Números" ficava
              renderizado órfão depois do envio da consolidação verbal.
              Restringimos o gate a `subStep === 15`: no 15.5 só fica o
              InfoBox, sem a moldura desta seção. */}
          {gameState.subStep === 15 && (
            <div className="w-full max-w-[600px] mx-auto flex flex-col gap-xxxs">
              <h3 className="ds-body-large-bold text-brand-otimath-dark text-center">Consolidação: Lei dos Grandes Números</h3>

              {/* Fase: escolher n */}
              {/* Fase: Problema 1 — Disco */}
              {lgnPhase === 'problem1' && lgnParams && (
                <div className="rounded-md p-xxs bg-neutral-white border-hairline border-neutral-light">
                  <p className="ds-body-bold text-brand-otimath-dark mb-nano">Problema 1</p>
                  <p className="ds-body text-brand-otimath-dark">
                    Um disco está dividido em <strong>{lgnN}</strong> partes iguais. Considere a cor {lgnParams.color} ocupando exatamente 1 dessas {lgnN} partes.
                  </p>
                  <p className="ds-body text-brand-otimath-dark mt-nano">
                    Após o disco girar <strong>{lgnParams.m.toLocaleString('pt-BR')}</strong> vezes, quantas vezes se espera que ocorra a cor {lgnParams.color}?
                  </p>
                  <div className="flex items-center gap-nano mt-nano">
                    <input
                      type="number"
                      className={`w-full p-nano rounded-md border-hairline ds-body text-center ${lgnInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                      placeholder="Digite sua resposta"
                      value={lgnInput.value}
                      onChange={(e) => setLgnInput({ value: e.target.value, error: false })}
                    />
                  </div>
                  <div className="mt-nano flex justify-end">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!lgnInput.value}>
                      Conferir
                    </Button>
                  </div>
                </div>
              )}

              {/* Fase: Problema 2 — Medicamento */}
              {lgnPhase === 'problem2' && lgnParams && (
                <div className="rounded-md p-xxs bg-neutral-white border-hairline border-neutral-light">
                  <p className="ds-body-bold text-brand-otimath-dark mb-nano">Problema 2</p>
                  <p className="ds-body text-brand-otimath-dark">
                    Um medicamento tem <strong>{lgnParams.p}%</strong> de chance de curar um paciente quando aplicado no início dos sintomas.
                  </p>
                  <p className="ds-body text-brand-otimath-dark mt-nano">
                    Aplicando esse medicamento em <strong>{lgnParams.m.toLocaleString('pt-BR')}</strong> pacientes, quantos pacientes se espera que sejam curados?
                  </p>
                  <div className="flex items-center gap-nano mt-nano">
                    <input
                      type="number"
                      className={`w-full p-nano rounded-md border-hairline ds-body text-center ${lgnInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                      placeholder="Digite sua resposta"
                      value={lgnInput.value}
                      onChange={(e) => setLgnInput({ value: e.target.value, error: false })}
                    />
                  </div>
                  <div className="mt-nano flex justify-end">
                    <Button style="primary" size="small" icon={<Check />} onClick={checkAnswer} disabled={!lgnInput.value}>
                      Conferir
                    </Button>
                  </div>
                </div>
              )}

              {/* Fase: Nota obrigatória */}
              {lgnPhase === 'note' && (
                <div className="rounded-md p-xxs bg-feedback-warning-lightest border-hairline border-feedback-warning-medium">
                  <p className="ds-body-bold text-brand-otimath-dark mb-nano">NOTA (obrigatória)</p>
                  <p className="ds-body text-brand-otimath-dark">
                    Você sabe por que o número real de pacientes curados pode ser diferente desse valor?
                  </p>
                  <div className="mt-nano flex justify-end">
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleLgnWantToKnow}>
                      Quero saber!
                    </Button>
                  </div>
                </div>
              )}

              {/* Fase: Explicação */}
              {lgnPhase === 'explanation' && (
                <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                  <p className="ds-body text-brand-otimath-dark">
                    Mesmo conhecendo a probabilidade de cura, o resultado real pode variar porque cada paciente é um caso sujeito ao acaso.
                  </p>
                  <p className="ds-body text-brand-otimath-dark mt-nano">
                    O valor calculado representa o <strong>número esperado</strong>: um valor em torno do qual os resultados tendem a se aproximar quando repetimos o experimento muitas vezes.
                  </p>
                  <p className="ds-body text-brand-otimath-dark mt-nano">
                    Isso é uma consequência da <strong>Lei dos Grandes Números</strong>.
                  </p>
                  <div className="mt-nano flex justify-end">
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={handleLgnContinue}>
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* Melhoria 7 — Consolidação verbal (Almouloud/Duval).
                  O `handleLgnVerbalConfirm` mantém `lgnPhase === 'verbal'`
                  após o envio (preserva o contexto pedagógico) e só muda
                  `subStep` 15 → 15.5. Por isso o gate também checa
                  `subStep === 15`: ao confirmar, o formulário some e só
                  resta o InfoBox da formalização da LGN. Antes, o
                  textarea + botão Confirmar ficavam ativos depois do
                  envio e permitiam novos cliques duplicados. */}
              {lgnPhase === 'verbal' && gameState.subStep === 15 && (
                <div className="rounded-md p-xxs bg-brand-otimath-lightest border-hairline border-brand-otimath-light">
                  <p className="ds-body-bold text-brand-otimath-dark mb-nano">Consolidação</p>
                  <p className="ds-body text-brand-otimath-dark mb-micro">
                    Explique com suas palavras: <strong>por que a frequência relativa de cada cor se aproximou de 1/{gameState.targetSectorCount} após muitos giros?</strong>
                  </p>
                  <textarea
                    className={`w-full p-nano rounded-md border-hairline ds-body ${lgnVerbalInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                    rows={3}
                    placeholder="Escreva sua explicação aqui..."
                    value={lgnVerbalInput.value}
                    onChange={(e) => setLgnVerbalInput({ value: e.target.value, error: false })}
                  />
                  <div className="mt-nano flex justify-end">
                    <Button style="primary" size="small" icon={<Check />} onClick={handleLgnVerbalConfirm} disabled={!lgnVerbalInput.value.trim()}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Melhoria 10 — Descontextualização: dado de 6 faces (subStep 15.6) */}
          {gameState.stage === 1 && (gameState.subStep === 15.6 || gameState.subStep === 15.7) && (
            <div className="bg-neutral-white p-macro rounded-md border border-neutral-lighter flex flex-col items-center gap-y-micro">
              <h3 className="ds-body-bold text-brand-otimath-pure">Generalização: Dado de 6 Faces</h3>
              <p className="ds-small text-neutral-dark text-center">
                A Lei dos Grandes Números funciona apenas com o disco? Vamos testar com outro experimento aleatório.
              </p>

              {/* Dado 3D em CSS */}
              {(() => {
                const SIZE = 96;
                const HALF = SIZE / 2;
                const DOT_PATTERNS = [
                  [0,0,0, 0,1,0, 0,0,0], // 1
                  [0,0,1, 0,0,0, 1,0,0], // 2
                  [0,0,1, 0,1,0, 1,0,0], // 3
                  [1,0,1, 0,0,0, 1,0,1], // 4
                  [1,0,1, 0,1,0, 1,0,1], // 5
                  [1,0,1, 1,0,1, 1,0,1], // 6
                ];

                const faceStyle = (transform: string): React.CSSProperties => ({
                  position: 'absolute',
                  width: SIZE,
                  height: SIZE,
                  backfaceVisibility: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 2,
                  padding: 10,
                  borderRadius: 12,
                  border: '2px solid #cbd5e1',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  transform,
                });

                // Rotação para mostrar cada face no topo (virada para o observador, inclinada)
                // A face "frente" (1) fica em translateZ(+HALF), a face "cima" (3) em rotateX(90deg)
                // Para mostrar face N no topo, precisamos rotacionar o cubo de modo que N fique virada para cima
                const FACE_ROT_X: Record<number, number> = { 1: 0, 2: 0, 3: -90, 4: 90, 5: 0, 6: 180 };
                const FACE_ROT_Y: Record<number, number> = { 1: 0, 2: -90, 3: 0, 4: 0, 5: 90, 6: 0 };

                const f = diceState.face || 1;

                let cubeTransform: string;
                if (diceState.rolling) {
                  // Animação de rolagem: várias voltas + pouso na face correta
                  cubeTransform = `rotateX(${720 + FACE_ROT_X[f]}deg) rotateY(${720 + FACE_ROT_Y[f]}deg)`;
                } else if (diceState.rolled) {
                  // Já parou: mostra a face sorteada com leve inclinação para dar profundidade
                  cubeTransform = `rotateX(${FACE_ROT_X[f] - 15}deg) rotateY(${FACE_ROT_Y[f] + 20}deg)`;
                } else {
                  // Estado inicial: inclinação 3D para mostrar que é um cubo
                  cubeTransform = 'rotateX(-20deg) rotateY(30deg)';
                }

                return (
                  <div style={{ width: SIZE + 48, height: SIZE + 48, margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 600 }}>
                    <div style={{
                      width: SIZE,
                      height: SIZE,
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      transform: cubeTransform,
                      transition: diceState.rolling
                        ? 'transform 1.2s cubic-bezier(0.2, 0.8, 0.3, 1)'
                        : diceState.rolled
                          ? 'transform 0.6s ease-out'
                          : 'none',
                    }}>
                      {/* Face 1 — frente (+Z) */}
                      <div style={faceStyle(`rotateY(0deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[0].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                      {/* Face 6 — trás (-Z) */}
                      <div style={faceStyle(`rotateY(180deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[5].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                      {/* Face 2 — direita (+X) */}
                      <div style={faceStyle(`rotateY(90deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[1].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                      {/* Face 5 — esquerda (-X) */}
                      <div style={faceStyle(`rotateY(-90deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[4].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                      {/* Face 3 — cima (+Y) */}
                      <div style={faceStyle(`rotateX(90deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[2].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                      {/* Face 4 — baixo (-Y) */}
                      <div style={faceStyle(`rotateX(-90deg) translateZ(${HALF}px)`)}>
                        {DOT_PATTERNS[3].map((dot, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {dot ? <div className="w-3.5 h-3.5 rounded-full bg-brand-otimath-pure" /> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Botão de lançar */}
              {!diceState.rolled && (
                <Button style="primary" size="medium" icon={<Play />} onClick={handleDiceRoll} disabled={diceState.rolling}>
                  {diceState.rolling ? 'Lançando...' : 'Lançar o dado'}
                </Button>
              )}

              {/* Resultado + Pergunta */}
              {diceState.rolled && !diceState.answered && (
                <div className="w-full max-w-[500px] flex flex-col gap-y-micro">
                  <p className="ds-body text-brand-otimath-dark text-center">
                    O dado caiu na face <strong>{diceState.face}</strong>.
                  </p>
                  <p className="ds-body-bold text-brand-otimath-dark text-center">
                    Se você lançasse esse dado 10.000 vezes, para qual valor a frequência relativa de cada face se aproximaria?
                  </p>
                  <div className="flex items-center justify-center gap-x-micro">
                    <input
                      type="text"
                      className={`w-24 p-nano rounded-md border-hairline ds-body text-center ${diceInput.error ? 'border-feedback-error-medium bg-feedback-error-lightest' : 'border-neutral-light bg-neutral-white'}`}
                      placeholder="?/?"
                      value={diceInput.value}
                      onChange={(e) => setDiceInput({ value: e.target.value, error: false })}
                    />
                    <Button style="primary" size="small" icon={<Check />} onClick={handleDiceAnswer} disabled={!diceInput.value.trim()}>
                      Verificar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check and Next buttons (apenas no subStep 0 e 16).
              No subStep 0 da Etapa 2 o InfoBox de transição é mostrado primeiro;
              o botão "Confirmar" só faz sentido depois que o balão é fechado
              (slider e placeholder também são ocultados durante o InfoBox). */}
          {((gameState.subStep === 0 && !showInfoBox) || gameState.subStep === 16) && (
            <div className="flex gap-xxxs items-center justify-center">
              {gameState.subStep === 0 && (
                <Button
                  style="primary"
                  size="small"
                  icon={<Check />}
                  onClick={checkAnswer}
                  disabled={disabledCheckButton}
                >
                  Confirmar
                </Button>
              )}
              {gameState.subStep === 16 && (
                <Button
                  style="primary"
                  size="small"
                  icon={<ArrowRight />}
                  onClick={() => {
                    telemetryRecordInteracaoExercicio(`clicou em "Próxima Etapa" (Etapa ${gameState.stage} → ${gameState.stage + 1})`);
                    nextStep();
                  }}
                  disabled={disabledNextButton}
                >
                  Próxima Etapa
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alerts and Modal */}
      <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts} />
      <Modal modal={modal} updateModal={updateModal} />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Barra de DEV interna do disco — uso restrito ao painel de DEV da
// sequência didática. O histórico de snapshots vive no RouletteGame
// (parent), garantindo que a captura continue acontecendo mesmo
// quando o painel está desligado. Este componente é apenas a UI de
// navegação sobre esse histórico.
// ─────────────────────────────────────────────────────────────────
function RouletteDevNav({
  stage, historyRef, cursorRef, restoringRef, historyTick,
  onCursorChange, onSimulateAdvance, applyDevSnapshot, onStartStage,
}: {
  stage: number;
  historyRef: React.MutableRefObject<DevSnapshotOpaque[]>;
  cursorRef: React.MutableRefObject<number>;
  restoringRef: React.MutableRefObject<boolean>;
  historyTick: number; // força re-render quando o histórico muda no parent
  onCursorChange: () => void;
  onSimulateAdvance: () => void;
  applyDevSnapshot: (snap: DevSnapshotOpaque) => void;
  onStartStage: (n: 1 | 2 | 3) => void;
}) {
  const goPrev = () => {
    if (cursorRef.current > 0) {
      cursorRef.current -= 1;
      restoringRef.current = true;
      // applyDevSnapshot dispara várias setStates que React baterá num
      // único re-render; o useEffect no parent detecta restoringRef e
      // não empilha snapshot novo.
      applyDevSnapshot(historyRef.current[cursorRef.current]);
      onCursorChange();
    }
  };

  const goNext = () => {
    if (cursorRef.current < historyRef.current.length - 1) {
      cursorRef.current += 1;
      restoringRef.current = true;
      applyDevSnapshot(historyRef.current[cursorRef.current]);
      onCursorChange();
      return;
    }
    // Sem snapshot futuro — simula resposta correta para construir a próxima cena.
    onSimulateAdvance();
  };

  // Posição = índice no histórico de cenas visitadas (cresce a cada
  // mudança natural de sub-cena via cenaId). É a contagem REAL do
  // que o usuário viu — não tenta prever total porque cenas dinâmicas
  // (3 exemplos no comp, etc.) tornam isso impreciso.
  const positionLabel = `Cena ${cursorRef.current + 1}`;
  // historyTick é referenciado para que o React inclua-o como dep do render
  // (re-renderiza quando o parent atualiza o tick após push/restore).
  void historyTick;

  return (
    <div className="relative z-98 flex flex-wrap items-center justify-center gap-x-quarck gap-y-quarck p-quarck rounded-md bg-feedback-warning-lightest border border-feedback-warning-light text-neutral-darkest">
      <span className="ds-caption font-bold">DEV — Disco:</span>
      <div className="flex gap-x-quarck">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => onStartStage(n as 1 | 2 | 3)}
            className={`px-quarck py-quarck rounded-sm border ds-caption cursor-pointer ${stage === n ? 'bg-brand-otimath-pure text-neutral-white border-brand-otimath-pure' : 'bg-neutral-white border-neutral-light hover:bg-neutral-lightest'}`}
          >
            E{n}
          </button>
        ))}
      </div>
      <button
        onClick={goPrev}
        disabled={cursorRef.current <= 0}
        aria-label="Cena anterior"
        className="flex items-center justify-center w-6 h-6 rounded-sm border border-neutral-light bg-neutral-white cursor-pointer hover:bg-neutral-lightest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </button>
      <span className="ds-caption">
        {positionLabel} de {historyRef.current.length}
      </span>
      <button
        onClick={goNext}
        aria-label="Próxima cena (simula resposta correta)"
        className="flex items-center justify-center w-6 h-6 rounded-sm border border-neutral-light bg-neutral-white cursor-pointer hover:bg-neutral-lightest"
      >
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Card de estatísticas do OVA do Disco na tela final do OVA.
// `useSequenceTick` força re-render a cada segundo enquanto a
// sequência roda — assim o tempo no card também avança ao vivo
// caso o aluno permaneça na tela antes de clicar "Continuar".
// ─────────────────────────────────────────────────────────────────
function RouletteFinalStats() {
  useSequenceTick(1000);
  const { roulette } = getSequenceStats();
  return <SequenceStatsCard title="OVA do Disco" stats={roulette} />;
}
