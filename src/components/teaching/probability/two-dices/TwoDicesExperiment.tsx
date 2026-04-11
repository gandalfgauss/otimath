'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { TwoDiceSceneHandle } from './TwoDiceScene';
import type { DiceMachineSceneHandle } from './DiceMachineScene';
import { SampleSpaceTree } from './SampleSpaceTree';
import { FacePicker } from './FacePicker';

// ═══════ Faces do dado com pintas ═══════
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

// ═══════ Paleta de cores dos 13 carrinhos da corrida ═══════
// Carrinhos 1 e 13 em cinza opaco (visualmente "sem vida") — instanciação
// semiótica da impossibilidade. Carrinho 7 em dourado — destaque do pico.
const CAR_COLORS: Record<number, { body: string; detail: string; number: string }> = {
  1:  { body: '#9ca3af', detail: '#6b7280', number: '#374151' }, // cinza opaco — impossível
  2:  { body: '#dc2626', detail: '#ffffff', number: '#ffffff' }, // vermelho
  3:  { body: '#ea580c', detail: '#fde047', number: '#ffffff' }, // laranja
  4:  { body: '#facc15', detail: '#000000', number: '#000000' }, // amarelo
  5:  { body: '#84cc16', detail: '#ffffff', number: '#ffffff' }, // verde-lima
  6:  { body: '#10b981', detail: '#000000', number: '#ffffff' }, // esmeralda
  7:  { body: '#fbbf24', detail: '#000000', number: '#7c2d12' }, // dourado — pico
  8:  { body: '#06b6d4', detail: '#ffffff', number: '#ffffff' }, // ciano
  9:  { body: '#2563eb', detail: '#ffffff', number: '#ffffff' }, // azul royal
  10: { body: '#7c3aed', detail: '#e5e7eb', number: '#ffffff' }, // roxo
  11: { body: '#ec4899', detail: '#ffffff', number: '#ffffff' }, // rosa pink
  12: { body: '#881337', detail: '#fbbf24', number: '#fbbf24' }, // vinho
  13: { body: '#9ca3af', detail: '#6b7280', number: '#374151' }, // cinza opaco — impossível
};

// ═══════ Componente SVG do carrinho de corrida estilo-brinquedo ═══════
// Corpo arredondado estilo Hot Wheels, para-brisa fumê, rodas pretas com
// centro cromado, número grande estampado na lateral. Cores vibrantes.
function CarrinhoIcon({ numero, width = 72, highlighted = false }: {
  numero: number;
  width?: number;
  highlighted?: boolean;
}) {
  const colors = CAR_COLORS[numero] ?? CAR_COLORS[2];
  const height = Math.floor(width * 0.5);
  const isImpossible = numero === 1 || numero === 13;
  return (
    <svg
      viewBox="0 0 120 60"
      width={width}
      height={height}
      role="img"
      aria-label={`Carrinho número ${numero}${isImpossible ? ' (soma impossível)' : ''}`}
      style={{
        filter: highlighted ? 'drop-shadow(0 0 6px #fbbf24) drop-shadow(0 0 10px #fbbf24)' : 'none',
        opacity: isImpossible ? 0.7 : 1,
        transition: 'filter 0.2s ease',
      }}
    >
      <defs>
        <linearGradient id={`body-${numero}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.body} stopOpacity="1" />
          <stop offset="50%" stopColor={colors.body} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {/* Sombra no chão */}
      <ellipse cx="60" cy="55" rx="46" ry="3" fill="rgba(0,0,0,0.32)" />
      {/* Corpo do carrinho — silhueta arredondada estilo brinquedo */}
      <path
        d="M 10 42 Q 10 32 22 28 L 38 26 Q 46 16 60 16 Q 74 16 82 26 L 98 28 Q 110 32 110 42 L 110 46 Q 110 50 104 50 L 16 50 Q 10 50 10 46 Z"
        fill={`url(#body-${numero})`}
        stroke="#000"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Para-brisa escuro/fumê */}
      <path
        d="M 42 28 Q 48 20 60 20 Q 72 20 78 28 L 75 36 L 45 36 Z"
        fill="rgba(15,20,35,0.78)"
        stroke="#000"
        strokeWidth="0.8"
      />
      {/* Faixa decorativa lateral */}
      <rect x="14" y="41" width="92" height="3" fill={colors.detail} opacity="0.85" />
      {/* Número estampado */}
      <text
        x="60"
        y="46"
        fontSize="18"
        fontWeight="900"
        textAnchor="middle"
        fill={colors.number}
        stroke="#000"
        strokeWidth="0.6"
        paintOrder="stroke"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {numero}
      </text>
      {/* Roda traseira */}
      <circle cx="28" cy="50" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="0.8" />
      <circle cx="28" cy="50" r="3.2" fill="#9ca3af" />
      <circle cx="28" cy="50" r="1.2" fill="#4b5563" />
      {/* Roda dianteira */}
      <circle cx="92" cy="50" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="0.8" />
      <circle cx="92" cy="50" r="3.2" fill="#9ca3af" />
      <circle cx="92" cy="50" r="1.2" fill="#4b5563" />
    </svg>
  );
}

function DiceFaceIcon({ face, size, color = 'blue' }: { face: number; size: number; color?: 'blue' | 'green' }) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.floor(size * 0.16),
      background: bgColor,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      padding: Math.floor(size * 0.14),
      gap,
    }}>
      {pips.map((pip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pip ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

// ═══════ CSS para destaque dos pares simétricos ═══════
// Padrão aplicado: static content + animated marker.
// O conteúdo (face do dado, número do par) permanece estático e legível;
// apenas o marcador semiótico (halo externo) pulsa. Isso reduz carga
// cognitiva (MAYER, coerência) e evita saturação semiótica (DUVAL).
// Suporte a prefers-reduced-motion via override com data-halo.
const blinkStyle = `
@keyframes headerHaloGold {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(199, 150, 52, 0),
                0 0 0 0 rgba(26, 18, 5, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(199, 150, 52, 0.95),
                0 0 0 6px rgba(26, 18, 5, 0.3);
  }
}
@keyframes headerHaloPurple {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(125, 60, 152, 0),
                0 0 0 0 rgba(26, 18, 5, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(125, 60, 152, 0.95),
                0 0 0 6px rgba(26, 18, 5, 0.3);
  }
}
@keyframes cellHaloGold {
  0%, 100% {
    box-shadow: inset 0 0 0 0 rgba(199, 150, 52, 0);
  }
  50% {
    box-shadow: inset 0 0 0 4px rgba(112, 68, 12, 0.95);
  }
}
@keyframes cellHaloPurple {
  0%, 100% {
    box-shadow: inset 0 0 0 0 rgba(125, 60, 152, 0);
  }
  50% {
    box-shadow: inset 0 0 0 4px rgba(58, 20, 80, 0.95);
  }
}
div[data-halo='gold'] {
  border-radius: 8px;
  animation: headerHaloGold 1.2s ease-in-out infinite;
  will-change: box-shadow;
}
div[data-halo='purple'] {
  border-radius: 8px;
  animation: headerHaloPurple 1.2s ease-in-out infinite;
  will-change: box-shadow;
}
td[data-halo='gold'] {
  animation: cellHaloGold 1.2s ease-in-out infinite;
  will-change: box-shadow;
}
td[data-halo='purple'] {
  animation: cellHaloPurple 1.2s ease-in-out infinite;
  will-change: box-shadow;
}
@media (prefers-reduced-motion: reduce) {
  div[data-halo='gold'] {
    animation: none;
    box-shadow: 0 0 0 3px rgba(199, 150, 52, 0.9), 0 0 0 5px rgba(26, 18, 5, 0.2);
  }
  div[data-halo='purple'] {
    animation: none;
    box-shadow: 0 0 0 3px rgba(125, 60, 152, 0.9), 0 0 0 5px rgba(26, 18, 5, 0.2);
  }
  td[data-halo='gold'] {
    animation: none;
    box-shadow: inset 0 0 0 3px rgba(112, 68, 12, 0.9);
  }
  td[data-halo='purple'] {
    animation: none;
    box-shadow: inset 0 0 0 3px rgba(58, 20, 80, 0.9);
  }
}

/* ═══════ Layout responsivo da fase sumReveal ═══════
   Mobile (< 768px): tabela e histograma empilhados verticalmente, histograma
   com altura compacta (160px) para caber junto com a tabela no viewport.
   Desktop (>= 768px): side-by-side — tabela à esquerda, histograma à direita,
   ambos centralizados verticalmente. Garante que o aluno veja a animação
   síncrona da tabela e do histograma sem rolar.
   (WCAG 2.5.5: alvos tocáveis mantidos ≥ 44px em todos os breakpoints.) */
.sumRevealLayout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
.sumRevealHistogram {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--color-neutral-lightest);
  border: 1px solid var(--color-neutral-lighter);
  border-radius: 12px;
  height: 160px;
  width: 100%;
  max-width: 420px;
}
@media (min-width: 768px) {
  .sumRevealLayout {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 14px;
    max-width: 100%;
  }
  .sumRevealHistogram {
    height: 260px;
    width: 290px;
    flex-shrink: 0;
  }
}
@media (max-width: 420px) {
  .sumRevealHistogram {
    height: 140px;
  }
}
@keyframes markFillIn {
  from { background-color: rgba(199, 150, 52, 0); }
  to { background-color: rgba(241, 207, 117, 0.85); }
}
@keyframes markVPop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes markPairAppear {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes markSyncBlink {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 0 rgba(255,255,255,0)); }
  50% { opacity: 0.4; filter: drop-shadow(0 0 8px rgba(255,220,120,0.95)); }
}
@keyframes markCoordBlink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(1.25); }
}
`;

// ═══════ Tipos ═══════
type Phase =
  | 'intro' | 'tree' | 'ready' | 'rolling' | 'landed'
  | 'pickPair' | 'pickConfirm' | 'markTable' | 'feedback'
  | 'sumInput' | 'sumMarkTable' | 'sumComplete'
  | 'sumAlienIntro' | 'sumPredictMax' | 'sumPredictMin' | 'sumImpossible' | 'sumReveal'
  | 'probPair' | 'probPairReveal' | 'probSumTable' | 'probSumReveal'
  | 'raceBet' | 'raceRunning' | 'raceFinished'
  | 'pairQuestion' | 'pairExplain' | 'colorQuestion' | 'colorExplain'
  | 'finished';

const TOTAL_ROUNDS = 3;

// ═══════ Componente Principal ═══════
interface TwoDicesExperimentProps {
  diceSceneRef: React.RefObject<TwoDiceSceneHandle | null>;
  diceContainerRef: React.RefObject<HTMLDivElement | null>;
  diceMachineRef: React.RefObject<DiceMachineSceneHandle | null>;
  diceMachineContainerRef: React.RefObject<HTMLDivElement | null>;
  onMachineVisibilityChange: (visible: boolean) => void;
  onHideAllDice?: (hide: boolean) => void;
  onFinished: () => void;
}

export function TwoDicesExperiment({
  diceSceneRef,
  diceContainerRef,
  diceMachineRef,
  diceMachineContainerRef,
  onMachineVisibilityChange,
  onHideAllDice,
  onFinished,
}: Readonly<TwoDicesExperimentProps>) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [greenResult, setGreenResult] = useState(0);
  const [blueResult, setBlueResult] = useState(0);

  // Picker do par ordenado (substitui readGreen/readBlue)
  // Reuso do padrão instrumental já construído na Cena 6 (DiceMachineExperiment).
  const [pickedGreen, setPickedGreen] = useState<number | null>(null);
  const [pickedBlue, setPickedBlue] = useState<number | null>(null);
  const [pickGreenError, setPickGreenError] = useState(false);
  const [pickBlueError, setPickBlueError] = useState(false);
  const [pickFeedback, setPickFeedback] = useState('');
  const [pickAttempts, setPickAttempts] = useState(0);

  // Tabela 6×6
  const [tableMarks, setTableMarks] = useState<boolean[][]>(() =>
    Array.from({ length: 6 }, () => Array(6).fill(false))
  );
  const [markError, setMarkError] = useState(false);
  // Marcação da célula: tentativas, célula acertada e passo da celebração
  // passo 0 = preenchimento + V, passo 1 = par visível + blink verde/abcissa,
  // passo 2 = blink azul/ordenada, passo 3 = steady state aguardando próxima rodada
  const [markAttempts, setMarkAttempts] = useState(0);
  const [markSolvedCell, setMarkSolvedCell] = useState<{ r: number; c: number } | null>(null);
  const [markCelebStep, setMarkCelebStep] = useState<0 | 1 | 2 | 3 | null>(null);
  const [markBusy, setMarkBusy] = useState(false);
  const [markRetryMsg, setMarkRetryMsg] = useState(false);

  // Histórico de pares
  const [history, setHistory] = useState<{ green: number; blue: number }[]>([]);

  // Pergunta (x,y) vs (y,x)
  const [pairAnswer, setPairAnswer] = useState('');
  const [pairAnswerError, setPairAnswerError] = useState(false);
  // Pergunta dados mesma cor
  const [colorAnswer, setColorAnswer] = useState('');
  const [colorAnswerError, setColorAnswerError] = useState(false);
  // Já mostrou o intervalo pedagógico
  const [pedagogicDone, setPedagogicDone] = useState(false);
  // Piscar
  const [blinkPairs, setBlinkPairs] = useState<{ green: number; blue: number }[]>([]);
  // Sequenciamento do halo em pairExplain: alterna entre 'A' → null → 'B' → null
  // para garantir que os dois pares nunca pulsam ao mesmo tempo e que a abcissa
  // e a ordenada de cada par pulsam exatamente em sincronia (mesma duração, mesmo tempo).
  const [activeHaloPair, setActiveHaloPair] = useState<'A' | 'B' | null>(null);

  // Lançamentos com a máquina (reaproveitada da Cena 6) + dados brancos
  // Máximo 2 usos, segundo opcional, sem loop automático.
  const [whiteThrowCount, setWhiteThrowCount] = useState(0);
  const [machineBusy, setMachineBusy] = useState(false);

  // ═══════ Rodada 3 — Momento A: exercício da soma ═══════
  // Após pickPair/pickConfirm, o aluno digita a soma dos dados e depois marca
  // na tabela 6x6 todas as células cujos pares produzem essa soma.
  // Feedback em 3 estados: incompleto (só acertos mas falta), erro (há erros
  // marcados) e completo (todos corretos e nenhum errado).
  const [sumAnswer, setSumAnswer] = useState('');
  const [sumAnswerError, setSumAnswerError] = useState(false);
  // Marcações do aluno na tabela como Set de strings "r,c" (1-indexado)
  const [sumMarks, setSumMarks] = useState<Set<string>>(new Set());
  // Marcações erradas para destacar com X vermelho (subconjunto de sumMarks)
  const [sumWrongMarks, setSumWrongMarks] = useState<Set<string>>(new Set());
  // Estado do feedback após Conferir: 'none' (ainda não conferiu), 'incomplete'
  // (só acertos mas faltam), 'wrong' (há X's vermelhos a corrigir)
  const [sumFeedbackState, setSumFeedbackState] = useState<'none' | 'incomplete' | 'wrong'>('none');
  // Contagem que o aluno digita na fase sumComplete — ele deve CONTAR na tabela
  // preenchida (não recebe o valor pronto).
  const [sumCountAnswer, setSumCountAnswer] = useState('');
  const [sumCountError, setSumCountError] = useState(false);
  const [sumCountValidated, setSumCountValidated] = useState(false);

  // ═══════ Rodada 3 — Momento B: exploração da distribuição ═══════
  // Desafio narrativo do alienígena brincalhão: 3 perguntas sobre a distribuição
  // das somas ANTES de revelar a tabela completa. Combate o viés de
  // equiprobabilidade (LECOUTRE, 1992). Recompensa simbólica: livro de matemática
  // alienígena (contexto lúdico, NÃO de jogos de azar).
  const [sumPredictedMax, setSumPredictedMax] = useState<number | null>(null);
  const [sumPredictedMin, setSumPredictedMin] = useState<number | null>(null);
  // Opções dinâmicas da pergunta 3 — geradas uma vez ao entrar na fase.
  // Total varia em {2, 3, 4}. Sempre contém 1 (fixo) e um d ∈ {13..16}.
  // Opções extras sorteadas de {2..12}. Ordem embaralhada.
  const [sumImpossibleOptions, setSumImpossibleOptions] = useState<number[]>([]);
  const [sumImpossibleSelected, setSumImpossibleSelected] = useState<Set<number>>(new Set());
  const [sumImpossibleError, setSumImpossibleError] = useState<'none' | 'hint'>('none');
  // Animação de revelação progressiva na fase sumReveal: marca cada soma
  // 2..12 em sequência no tabuleiro 6×6. Valores: 0=idle, 2..12=soma atual
  // sendo revelada, 13=animação completa (histograma + feedback visíveis).
  const [sumRevealStep, setSumRevealStep] = useState(0);

  // ═══════ Fase probPair: cálculo da probabilidade do par ordenado ═══════
  // Par exibido é dinâmico — sorteado de {1..6}×{1..6} a cada sessão.
  // Aluno digita numerador/denominador e o sistema valida via R14 (fração
  // equivalente). Resposta correta: 1/36 (ou qualquer fração equivalente).
  const [probPairX, setProbPairX] = useState(1);
  const [probPairY, setProbPairY] = useState(1);
  const [probPairNum, setProbPairNum] = useState('');
  const [probPairDen, setProbPairDen] = useState('');
  const [probPairError, setProbPairError] = useState(false);
  // Tipo de erro para mensagem específica:
  // 'denominator' → den errado (mensagem sobre total de resultados possíveis)
  // 'numerator'   → num errado (mensagem sobre equiprobabilidade)
  // 'both'        → ambos errados (mostra denominador primeiro — mais foundational)
  const [probPairErrorType, setProbPairErrorType] = useState<'denominator' | 'numerator' | 'both' | null>(null);

  // ═══════ Fase probSumTable: cálculo de P(soma) para cada soma 2..12 ═══════
  // 11 linhas, cada uma com numerador e denominador para o aluno digitar.
  // Correto: numerador = n(A) (contagem de pares), denominador = 36.
  // Validação via multiplicação cruzada (R14 — aceita frações equivalentes).
  const [probSumInputs, setProbSumInputs] = useState<Record<number, { num: string; den: string }>>(() => {
    const init: Record<number, { num: string; den: string }> = {};
    for (let s = 2; s <= 12; s++) init[s] = { num: '', den: '' };
    return init;
  });
  const [probSumWrongRows, setProbSumWrongRows] = useState<Set<number>>(new Set());
  const [probSumFeedback, setProbSumFeedback] = useState<'none' | 'missing' | 'wrong'>('none');

  // ═══════ CORRIDA DE CARRINHOS (fase final do OVA) ═══════
  // 13 carrinhos numerados de 1 a 13. Pista com 6 células de percurso.
  // Carrinhos 1 e 13 nunca avançam (P=0, eventos impossíveis) — pedagogia
  // pela inércia visual. Aluno deve reconhecer e evitar apostar neles.
  const RACE_LENGTH = 6;
  // Aposta do aluno no carrinho vencedor (null = ainda não apostou)
  const [raceBet, setRaceBet] = useState<number | null>(null);
  // Posição de cada carrinho na pista (índice = número do carrinho, valor = célula atual 0..6)
  const [racePositions, setRacePositions] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (let n = 1; n <= 13; n++) init[n] = 0;
    return init;
  });
  // Soma do último sorteio — o aluno precisa clicar no carrinho dessa soma para avançar
  const [racePendingSum, setRacePendingSum] = useState<number | null>(null);
  // Erro ao clicar no carrinho errado durante o sorteio pendente
  const [raceClickError, setRaceClickError] = useState(false);
  // Modal de confirmação quando aluno aposta em carrinho impossível (1 ou 13)
  const [raceImpossibleConfirm, setRaceImpossibleConfirm] = useState<number | null>(null);
  // Vencedor da corrida (null enquanto corrida em andamento)
  const [raceWinner, setRaceWinner] = useState<number | null>(null);
  // Bloqueio temporário do botão Sortear entre sorteio e clique no carrinho correto
  const [raceBusy, setRaceBusy] = useState(false);

  // Guards
  const rolling = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Par para a pergunta pedagógica: pegar um par do histórico onde green !== blue
  const getPairForQuestion = (): { original: { green: number; blue: number }; inverted: { green: number; blue: number } } => {
    for (const h of history) {
      if (h.green !== h.blue) {
        return { original: h, inverted: { green: h.blue, blue: h.green } };
      }
    }
    // Se todos os lançamentos deram green === blue, gerar par aleatório distinto
    const vals = [1, 2, 3, 4, 5, 6];
    const a = vals[Math.floor(Math.random() * 6)];
    let b: number;
    do { b = vals[Math.floor(Math.random() * 6)]; } while (b === a);
    return { original: { green: a, blue: b }, inverted: { green: b, blue: a } };
  };

  // ── Lançar dois dados ──
  const launchDice = useCallback(async () => {
    if (rolling.current) return;
    rolling.current = true;
    setPhase('rolling');

    diceContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 400));

    if (diceSceneRef.current) {
      let result = await diceSceneRef.current.roll();
      // Rodada 0 (Lançamento 1): proíbe pares iguais (x=y). Garante que o
      // interlúdio pairExplain sempre encontre um par do histórico com
      // componentes distintos para comparar (x,y) vs (y,x) de forma não-trivial.
      if (round === 0) {
        let equalAttempts = 0;
        while (result.green === result.blue && equalAttempts < 8) {
          result = await diceSceneRef.current.roll();
          equalAttempts++;
        }
      }
      // Evita par repetido em relação ao último lançamento (protege contra
      // colisão visual/clicável quando rodada N+1 sorteia o mesmo par da N).
      const lastHist = history[history.length - 1];
      if (lastHist) {
        let rerollAttempts = 0;
        while (
          result.green === lastHist.green &&
          result.blue === lastHist.blue &&
          rerollAttempts < 8
        ) {
          result = await diceSceneRef.current.roll();
          rerollAttempts++;
        }
      }
      setGreenResult(result.green);
      setBlueResult(result.blue);
    }

    setPhase('landed');
    await new Promise(r => setTimeout(r, 1500));

    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    rolling.current = false;

    setPickedGreen(null);
    setPickedBlue(null);
    setPickGreenError(false);
    setPickBlueError(false);
    setPickFeedback('');
    setPickAttempts(0);
    setMarkError(false);
    setMarkAttempts(0);
    setMarkSolvedCell(null);
    setMarkCelebStep(null);
    setMarkBusy(false);
    setMarkRetryMsg(false);
    setPhase('pickPair');
  }, [diceSceneRef, diceContainerRef, history, round]);

  // ── Relançamento + volta ao picker (usado em 3 erros no picker OU no markTable) ──
  const rerollAndRestartPicker = useCallback(async () => {
    const scene = diceSceneRef.current;
    if (!scene) return;
    setMarkBusy(true);
    setMarkRetryMsg(true);
    setMarkError(false);
    await new Promise(r => setTimeout(r, 900));
    setMarkRetryMsg(false);
    // Sorteia novos valores; pelo menos um eixo diferente do par atual
    let result: { green: number; blue: number };
    let attempts = 0;
    do {
      result = await scene.roll();
      attempts++;
    } while ((result.green === greenResult && result.blue === blueResult) && attempts < 8);
    setGreenResult(result.green);
    setBlueResult(result.blue);
    // Reset de todos os estados de resposta
    setPickedGreen(null);
    setPickedBlue(null);
    setPickGreenError(false);
    setPickBlueError(false);
    setPickFeedback('');
    setPickAttempts(0);
    setMarkAttempts(0);
    setMarkSolvedCell(null);
    setMarkCelebStep(null);
    setMarkError(false);
    setMarkBusy(false);
    // Volta ao picker com o novo par
    setPhase('pickPair');
  }, [diceSceneRef, greenResult, blueResult]);

  // ── Validação do picker (FacePicker) ──
  const validatePickedPair = useCallback(() => {
    if (pickedGreen == null) {
      setPickGreenError(true);
      setPickFeedback('Toque no dado verde e escolha a face que apareceu.');
      playSound('/sounds/incorrect.mp3');
      return;
    }
    if (pickedBlue == null) {
      setPickBlueError(true);
      setPickFeedback('Toque no dado azul e escolha a face que apareceu.');
      playSound('/sounds/incorrect.mp3');
      return;
    }
    const greenOk = pickedGreen === greenResult;
    const blueOk = pickedBlue === blueResult;
    if (greenOk && blueOk) {
      setPickGreenError(false);
      setPickBlueError(false);
      setPickFeedback('');
      playSound('/sounds/correct.mp3');
      setPhase('pickConfirm');
      return;
    }
    // Erro
    setPickGreenError(!greenOk);
    setPickBlueError(!blueOk);
    const nextAttempts = pickAttempts + 1;
    setPickAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      // Ao 3º erro: relança os dados e reinicia o picker com novo par
      setPickFeedback('');
      rerollAndRestartPicker();
      return;
    }
    if (!greenOk && !blueOk) {
      setPickFeedback('Releia os dois dados na cena acima. Toque em cada um e escolha a face que realmente apareceu.');
    } else if (!greenOk) {
      setPickFeedback('Releia o dado verde na cena acima. Toque nele e escolha a face que realmente apareceu.');
    } else {
      setPickFeedback('Releia o dado azul na cena acima. Toque nele e escolha a face que realmente apareceu.');
    }
    playSound('/sounds/incorrect.mp3');
  }, [pickedGreen, pickedBlue, greenResult, blueResult, pickAttempts, rerollAndRestartPicker]);

  // ── Próxima rodada (com intervalo pedagógico após rodada 2) ──
  const nextRound = () => {
    const next = round + 1;
    // Após rodada 2 (index 1), inserir intervalo pedagógico
    if (next === 2 && !pedagogicDone) {
      setPairAnswer('');
      setPairAnswerError(false);
      setColorAnswer('');
      setColorAnswerError(false);
      setPhase('pairQuestion');
      return;
    }
    if (next >= TOTAL_ROUNDS) {
      playSound('/sounds/gameFinished.mp3');
      setPhase('finished');
    } else {
      setRound(next);
      setPhase('ready');
    }
  };

  // ── Após intervalo pedagógico, continuar na rodada 3 ──
  // IMPORTANTE: reseta estados de marcação da rodada anterior — sem isso,
  // markSolvedCell carregado da rodada 2 bloqueia handleCellClick na rodada 3
  // (state-leak através da travessia feedback → pairQuestion → pairExplain →
  // colorQuestion → colorExplain → resumeAfterPedagogic).
  const resumeAfterPedagogic = () => {
    setPedagogicDone(true);
    setBlinkPairs([]);
    setRound(2);
    setMarkSolvedCell(null);
    setMarkCelebStep(null);
    setMarkError(false);
    setMarkAttempts(0);
    setMarkBusy(false);
    setMarkRetryMsg(false);
    setSumAnswer('');
    setSumAnswerError(false);
    setSumMarks(new Set());
    setSumWrongMarks(new Set());
    setSumFeedbackState('none');
    setSumCountAnswer('');
    setSumCountError(false);
    setSumCountValidated(false);
    setSumPredictedMax(null);
    setSumPredictedMin(null);
    setSumImpossibleOptions([]);
    setSumImpossibleSelected(new Set());
    setSumImpossibleError('none');
    setSumRevealStep(0);
    setProbPairX(1);
    setProbPairY(1);
    setProbPairNum('');
    setProbPairDen('');
    setProbPairError(false);
    setProbPairErrorType(null);
    const initProbSum: Record<number, { num: string; den: string }> = {};
    for (let s = 2; s <= 12; s++) initProbSum[s] = { num: '', den: '' };
    setProbSumInputs(initProbSum);
    setProbSumWrongRows(new Set());
    setProbSumFeedback('none');
    setRaceBet(null);
    const initRace: Record<number, number> = {};
    for (let n = 1; n <= 13; n++) initRace[n] = 0;
    setRacePositions(initRace);
    setRacePendingSum(null);
    setRaceClickError(false);
    setRaceImpossibleConfirm(null);
    setRaceWinner(null);
    setRaceBusy(false);
    setPhase('ready');
  };

  // ── Rodada 3 — Momento A: conjunto de pares corretos para uma soma ──
  // Retorna todas as células (r,c) tais que r+c = sum, no formato Set<"r,c">.
  const getPairsForSum = (sum: number): Set<string> => {
    const pairs = new Set<string>();
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        if (r + c === sum) pairs.add(`${r},${c}`);
      }
    }
    return pairs;
  };

  // ── Validação da soma digitada pelo aluno ──
  const validateSumInput = () => {
    const typed = parseInt(sumAnswer.trim(), 10);
    const correct = greenResult + blueResult;
    if (isNaN(typed)) {
      setSumAnswerError(true);
      playSound('/sounds/incorrect.mp3');
      return;
    }
    if (typed === correct) {
      setSumAnswerError(false);
      playSound('/sounds/correct.mp3');
      setSumMarks(new Set());
      setSumWrongMarks(new Set());
      setSumFeedbackState('none');
      setPhase('sumMarkTable');
    } else {
      setSumAnswerError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Toggle de marcação na fase sumMarkTable ──
  const handleSumCellClick = (row: number, col: number) => {
    if (phase !== 'sumMarkTable') return;
    const key = `${row + 1},${col + 1}`;
    const newMarks = new Set(sumMarks);
    if (newMarks.has(key)) newMarks.delete(key);
    else newMarks.add(key);
    setSumMarks(newMarks);
    // Qualquer interação limpa o feedback anterior (wrong/incomplete)
    if (sumFeedbackState !== 'none') {
      setSumFeedbackState('none');
      setSumWrongMarks(new Set());
    }
  };

  // ── Validação das marcações na fase sumMarkTable (3 estados) ──
  const validateSumMarks = () => {
    const targetSum = greenResult + blueResult;
    const correct = getPairsForSum(targetSum);
    const wrong = new Set<string>();
    for (const m of sumMarks) {
      if (!correct.has(m)) wrong.add(m);
    }
    const missing = new Set<string>();
    for (const c of correct) {
      if (!sumMarks.has(c)) missing.add(c);
    }

    if (wrong.size === 0 && missing.size === 0) {
      // Estado 1: tudo correto e completo → celebração + avança
      setSumFeedbackState('none');
      setSumWrongMarks(new Set());
      setSumCountAnswer('');
      setSumCountError(false);
      setSumCountValidated(false);
      playSound('/sounds/correct.mp3');
      setPhase('sumComplete');
    } else if (wrong.size === 0 && missing.size > 0) {
      // Estado 2: só acertos mas incompleto → reforço positivo parcial
      setSumFeedbackState('incomplete');
      setSumWrongMarks(new Set());
      playSound('/sounds/correct.mp3');
    } else {
      // Estado 3: há marcações erradas → X vermelho nelas, aluno corrige
      setSumFeedbackState('wrong');
      setSumWrongMarks(wrong);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Validação da contagem digitada pelo aluno na fase sumComplete ──
  // O aluno precisa contar manualmente quantas células foram marcadas como
  // corretas e digitar o número — verbalizando n(A) da fórmula P(A)=n(A)/n(Ω).
  const validateSumCount = () => {
    const typed = parseInt(sumCountAnswer.trim(), 10);
    const correct = getPairsForSum(greenResult + blueResult).size;
    if (isNaN(typed) || typed !== correct) {
      setSumCountError(true);
      playSound('/sounds/incorrect.mp3');
      return;
    }
    setSumCountError(false);
    setSumCountValidated(true);
    playSound('/sounds/correct.mp3');
  };

  // ═══════ Rodada 3 — Momento B: helper e validações ═══════

  /**
   * Gera as opções da pergunta 3 do Momento B:
   * - SEMPRE 5 opções no total
   * - `1` sempre presente (impossível fixo)
   * - k números sorteados em {13, 14, 15, 16}, onde k ∈ {1, 2, 3}
   * - (4 - k) números sorteados em {2..12}, distintos entre si (possíveis)
   * - GARANTIA: sempre pelo menos 1 número em {2..12} (k máximo é 3)
   * - Posições embaralhadas ao final (Fisher-Yates)
   * - Conjunto correto = {1} ∪ (todos os números ≥ 13 sorteados)
   */
  const generateImpossibleOptions = (): number[] => {
    const k = 1 + Math.floor(Math.random() * 3); // 1, 2 ou 3 impossíveis >12
    // Sorteia k números distintos de {13..16}
    const poolHigh = [13, 14, 15, 16];
    const chosenHigh: number[] = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * poolHigh.length);
      chosenHigh.push(poolHigh[idx]);
      poolHigh.splice(idx, 1);
    }
    // Completa com (4 - k) possíveis distintos de {2..12}
    const numPossiveis = 4 - k;
    const poolLow = Array.from({ length: 11 }, (_, i) => i + 2);
    const chosenLow: number[] = [];
    for (let i = 0; i < numPossiveis; i++) {
      const idx = Math.floor(Math.random() * poolLow.length);
      chosenLow.push(poolLow[idx]);
      poolLow.splice(idx, 1);
    }
    // Total = 1 + k + (4 - k) = 5 opções sempre
    const opts = [1, ...chosenHigh, ...chosenLow];
    // Fisher-Yates shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  };

  // Validações das 3 perguntas do alienígena
  const validateSumPredictMax = () => {
    if (sumPredictedMax === null) return;
    playSound('/sounds/correct.mp3');
    setPhase('sumPredictMin');
  };

  const validateSumPredictMin = () => {
    if (sumPredictedMin === null) return;
    playSound('/sounds/correct.mp3');
    // Gera as opções dinâmicas antes de entrar na fase da pergunta 3
    setSumImpossibleOptions(generateImpossibleOptions());
    setSumImpossibleSelected(new Set());
    setSumImpossibleError('none');
    setPhase('sumImpossible');
  };

  // Toggle de marcação de uma opção na pergunta 3
  const toggleSumImpossibleOption = (value: number) => {
    const next = new Set(sumImpossibleSelected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSumImpossibleSelected(next);
    setSumImpossibleError('none');
  };

  // Validação da pergunta 3 (impossíveis). Correto = exatamente {1, d}.
  const validateSumImpossible = () => {
    const correctSet = new Set<number>();
    for (const opt of sumImpossibleOptions) {
      if (opt === 1 || opt > 12) correctSet.add(opt);
    }
    // Comparação de sets: tamanho igual E todos os elementos presentes
    if (sumImpossibleSelected.size !== correctSet.size) {
      setSumImpossibleError('hint');
      playSound('/sounds/incorrect.mp3');
      return;
    }
    for (const c of correctSet) {
      if (!sumImpossibleSelected.has(c)) {
        setSumImpossibleError('hint');
        playSound('/sounds/incorrect.mp3');
        return;
      }
    }
    setSumImpossibleError('none');
    playSound('/sounds/correct.mp3');
    setPhase('sumReveal');
  };

  // Verifica se o aluno acertou cada uma das 3 previsões (para o card de revelação)
  const sumPredictedMaxCorrect = sumPredictedMax === 7;
  const sumPredictedMinCorrect = sumPredictedMin === 2 || sumPredictedMin === 12;

  // ═══════ Validações das fases probPair / probSumTable ═══════

  /**
   * Valida uma fração num/den contra uma fração esperada via multiplicação
   * cruzada (R14 do protocolo — aceita QUALQUER fração matematicamente
   * equivalente). Retorna true se num/den == expectedNum/expectedDen.
   */
  const isEquivalentFraction = (numStr: string, denStr: string, expectedNum: number, expectedDen: number): boolean => {
    const num = parseInt(numStr.trim(), 10);
    const den = parseInt(denStr.trim(), 10);
    if (!Number.isInteger(num) || !Number.isInteger(den)) return false;
    if (num < 0 || den <= 0) return false;
    // Comparação por multiplicação cruzada: num/den == expectedNum/expectedDen
    // ⇔ num * expectedDen == den * expectedNum
    return num * expectedDen === den * expectedNum;
  };

  /** Valida o input de P((x,y)) na fase probPair. Correto: 1/36 ou equivalente.
   * Se errado, detecta qual componente (numerador/denominador/ambos) está errado
   * e define probPairErrorType para renderizar a mensagem específica. */
  const validateProbPair = () => {
    if (isEquivalentFraction(probPairNum, probPairDen, 1, 36)) {
      setProbPairError(false);
      setProbPairErrorType(null);
      playSound('/sounds/correct.mp3');
      setPhase('probPairReveal');
      return;
    }
    // Analisa qual parte está errada
    const num = parseInt(probPairNum.trim(), 10);
    const den = parseInt(probPairDen.trim(), 10);
    const numIsOne = num === 1;        // Literalmente 1 (numerador "correto")
    const denIs36 = den === 36;        // Literalmente 36 (denominador "correto")
    let errorType: 'denominator' | 'numerator' | 'both';
    if (numIsOne && !denIs36) {
      errorType = 'denominator';
    } else if (!numIsOne && denIs36) {
      errorType = 'numerator';
    } else {
      errorType = 'both';
    }
    setProbPairError(true);
    setProbPairErrorType(errorType);
    playSound('/sounds/incorrect.mp3');
  };

  /**
   * Valida todas as 11 linhas da tabela de P(soma). Cada linha tem que ser
   * equivalente a `n(soma) / 36`. Marca as linhas erradas com sumWrongRows
   * para feedback visual (sem revelar a resposta correta).
   */
  const validateProbSumTable = () => {
    const wrong = new Set<number>();
    let missingAny = false;
    for (let s = 2; s <= 12; s++) {
      const entry = probSumInputs[s];
      if (!entry || entry.num.trim() === '' || entry.den.trim() === '') {
        missingAny = true;
        wrong.add(s);
        continue;
      }
      const expectedNum = getPairsForSum(s).size;
      if (!isEquivalentFraction(entry.num, entry.den, expectedNum, 36)) {
        wrong.add(s);
      }
    }
    if (wrong.size === 0) {
      setProbSumWrongRows(new Set());
      setProbSumFeedback('none');
      playSound('/sounds/gameFinished.mp3');
      setPhase('probSumReveal');
      return;
    }
    setProbSumWrongRows(wrong);
    setProbSumFeedback(missingAny ? 'missing' : 'wrong');
    playSound('/sounds/incorrect.mp3');
  };

  // ═══════ CORRIDA DE CARRINHOS — lógica ═══════

  /** Aluno clica num carrinho para fazer sua aposta. Em 1 ou 13 (impossíveis),
   * aparece confirmação metacognitiva lembrando do que ele descobriu antes. */
  const handleRaceBetClick = (carNumber: number) => {
    if (carNumber === 1 || carNumber === 13) {
      setRaceImpossibleConfirm(carNumber);
      return;
    }
    setRaceBet(carNumber);
    setRaceImpossibleConfirm(null);
    playSound('/sounds/correct.mp3');
  };

  /** Confirma aposta num carrinho impossível (aluno insistiu). */
  const confirmImpossibleBet = () => {
    if (raceImpossibleConfirm !== null) {
      setRaceBet(raceImpossibleConfirm);
      setRaceImpossibleConfirm(null);
      playSound('/sounds/nextChallenge.mp3');
    }
  };

  /** Cancela aposta num carrinho impossível (aluno refletiu). */
  const cancelImpossibleBet = () => {
    setRaceImpossibleConfirm(null);
  };

  /** Inicia a corrida: primeiro sorteio disparando launchDice sem branch logic
   * e entrando na fase raceRunning. */
  const startRace = () => {
    if (raceBet === null) return;
    setPhase('raceRunning');
    playSound('/sounds/nextChallenge.mp3');
  };

  /** Dispara um sorteio dos dados na fase raceRunning.
   * Faz scroll para o topo para o aluno ver o lançamento dos dados em 3D. */
  const rollRaceDice = async () => {
    if (raceBusy || racePendingSum !== null || raceWinner !== null) return;
    const scene = diceSceneRef.current;
    if (!scene) return;
    setRaceBusy(true);
    // Scroll para a cena 3D dos dados no topo da tela
    diceContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      const result = await scene.roll();
      const sum = result.green + result.blue;
      setRacePendingSum(sum);
      setRaceClickError(false);
      // Após os dados pararem, faz scroll para a pista para que o aluno clique
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 450);
    } finally {
      setRaceBusy(false);
    }
  };

  /** Clique num carrinho durante a corrida — deve corresponder à soma pendente. */
  const handleRaceCarClick = (carNumber: number) => {
    if (racePendingSum === null || raceWinner !== null) return;
    if (carNumber !== racePendingSum) {
      setRaceClickError(true);
      playSound('/sounds/incorrect.mp3');
      return;
    }
    // Acertou — avança o carrinho 1 célula
    setRaceClickError(false);
    const newPositions = { ...racePositions };
    const newPos = (newPositions[carNumber] ?? 0) + 1;
    newPositions[carNumber] = newPos;
    setRacePositions(newPositions);
    setRacePendingSum(null);
    playSound('/sounds/click.mp3');
    // Verifica vitória
    if (newPos >= RACE_LENGTH) {
      setRaceWinner(carNumber);
      setTimeout(() => {
        playSound('/sounds/gameFinished.mp3');
        setPhase('raceFinished');
      }, 600);
    }
  };

  /** Atualiza numerador ou denominador de uma linha específica da tabela de somas. */
  const setProbSumField = (sum: number, field: 'num' | 'den', value: string) => {
    setProbSumInputs(prev => ({
      ...prev,
      [sum]: { ...prev[sum], [field]: value },
    }));
    // Limpa o erro dessa linha quando o aluno mexe nela
    if (probSumWrongRows.has(sum)) {
      const newWrong = new Set(probSumWrongRows);
      newWrong.delete(sum);
      setProbSumWrongRows(newWrong);
      if (newWrong.size === 0) setProbSumFeedback('none');
    }
  };

  // ── Clique na célula da tabela (validação imediata + celebração / erro) ──
  const handleCellClick = (row: number, col: number) => {
    if (phase !== 'markTable') return;
    if (markBusy) return;
    if (markSolvedCell) return;
    // Nota: NÃO bloqueamos mais cliques em células historicamente marcadas.
    // A validação real é o match com o (greenResult, blueResult) atual.
    // Combinado com o reroll anti-repetição no launchDice, a colisão não
    // deveria ocorrer — mas se ocorrer, o clique funciona como defesa.

    const correctRow = greenResult - 1;
    const correctCol = blueResult - 1;
    const isCorrect = row === correctRow && col === correctCol;

    if (isCorrect) {
      setMarkError(false);
      playSound('/sounds/correct.mp3');
      setMarkSolvedCell({ r: row, c: col });
      setMarkCelebStep(0);
      // Sequência de celebração (gold fill + V → par + blink sync verde → blink sync azul → avançar)
      setTimeout(() => setMarkCelebStep(1), 900);
      setTimeout(() => setMarkCelebStep(2), 1700);
      setTimeout(() => setMarkCelebStep(3), 2500);
      setTimeout(() => {
        const newHist = [...history, { green: greenResult, blue: blueResult }];
        setHistory(newHist);
        const nextMarks = tableMarks.map(r => [...r]);
        nextMarks[row][col] = true;
        setTableMarks(nextMarks);
        setPhase('feedback');
      }, 3200);
    } else {
      playSound('/sounds/incorrect.mp3');
      setMarkError(true);
      const nextAttempts = markAttempts + 1;
      setMarkAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        // 3 erros no markTable: relança e volta ao picker com novo par
        rerollAndRestartPicker();
      }
    }
  };

  // ── Iniciar piscar ──
  useEffect(() => {
    if (phase === 'pairExplain') {
      const pair = getPairForQuestion();
      if (pair) {
        setBlinkPairs([pair.original, pair.inverted]);
      }
    } else if (phase !== 'colorQuestion' && phase !== 'colorExplain') {
      setBlinkPairs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Esconde as cenas 3D dos dados durante as fases de cálculo de probabilidade ──
  // Nas 4 fases finais (probPair, probPairReveal, probSumTable, probSumReveal),
  // a cena 3D dos dados verde/azul fica dissonante com a pergunta (que não é
  // mais sobre o lançamento físico, mas sobre a estrutura probabilística).
  // Nas fases da corrida (raceBet, raceRunning, raceFinished), os dados VOLTAM
  // a ser visíveis — o aluno precisa ver o lançamento físico que determina a
  // soma. Apenas raceFinished esconde novamente (celebração + alien).
  useEffect(() => {
    if (!onHideAllDice) return;
    const shouldHide =
      phase === 'probPair' ||
      phase === 'probPairReveal' ||
      phase === 'probSumTable' ||
      phase === 'probSumReveal' ||
      phase === 'raceFinished';
    onHideAllDice(shouldHide);
  }, [phase, onHideAllDice]);

  // ── Sorteio do par (x,y) quando entra na fase probPair ──
  // Par numérico dinâmico: x,y ∈ {1..6}, sorteado a cada entrada na fase.
  // Garante que a pergunta não seja fixa — a resposta é sempre 1/36 pela
  // equiprobabilidade, mas o par concreto varia entre sessões.
  useEffect(() => {
    if (phase === 'probPair') {
      setProbPairX(1 + Math.floor(Math.random() * 6));
      setProbPairY(1 + Math.floor(Math.random() * 6));
      setProbPairNum('');
      setProbPairDen('');
      setProbPairError(false);
      setProbPairErrorType(null);
    }
  }, [phase]);

  // ── Animação de revelação progressiva da tabela em sumReveal ──
  // Percorre as somas 2..12 marcando sequencialmente cada conjunto de pares.
  // Ao terminar (step=13), o histograma + feedback cards aparecem.
  // Respeita prefers-reduced-motion (pula para o final sem animar).
  useEffect(() => {
    if (phase !== 'sumReveal') {
      setSumRevealStep(0);
      return;
    }
    const mq = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mq?.matches) {
      // Sem animação: vai direto ao estado final
      setSumRevealStep(13);
      return;
    }
    const STEP_MS = 400;
    setSumRevealStep(2);
    const interval = setInterval(() => {
      setSumRevealStep(prev => {
        const next = prev + 1;
        if (next > 12) {
          clearInterval(interval);
          return 13;
        }
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Sequenciamento do halo entre os dois pares em pairExplain ──
  // Ciclo: A (1200ms) → pausa (250ms) → B (1200ms) → pausa (250ms) → repete.
  // Garante que os dois pares NUNCA pulsam simultaneamente e que a abcissa e
  // a ordenada de cada par pulsam exatamente em sincronia — respeita
  // prefers-reduced-motion (não inicia o ciclo se o usuário prefere).
  useEffect(() => {
    if (phase !== 'pairExplain' || blinkPairs.length < 2) {
      setActiveHaloPair(null);
      return;
    }
    const mq = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mq?.matches) {
      // Sem animação: mostra ambos em estado estático (via fallback CSS)
      setActiveHaloPair('A');
      return;
    }
    const PULSE_MS = 1200;
    const PAUSE_MS = 400;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const step = (current: 'A' | 'B') => {
      if (cancelled) return;
      setActiveHaloPair(current);
      timeouts.push(setTimeout(() => {
        if (cancelled) return;
        setActiveHaloPair(null);
        timeouts.push(setTimeout(() => {
          if (cancelled) return;
          step(current === 'A' ? 'B' : 'A');
        }, PAUSE_MS));
      }, PULSE_MS));
    };
    step('A');
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      setActiveHaloPair(null);
    };
  }, [phase, blinkPairs]);

  // ── Toggle da máquina durante a fase colorQuestion ──
  // Entra: mostra a máquina (parent troca cenas), reseta contador.
  // Sai: restaura dados coloridos, esconde a máquina.
  useEffect(() => {
    if (phase === 'colorQuestion') {
      onMachineVisibilityChange(true);
    } else {
      onMachineVisibilityChange(false);
      setWhiteThrowCount(0);
      setMachineBusy(false);
      const machine = diceMachineRef.current;
      if (machine) {
        machine.setWhiteMode(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Histograma reutilizável (final, todas as barras em altura máxima) ──
  // Usado em probSumTable como referência visual para o aluno preencher a
  // tabela de probabilidades. As contagens aparecem no topo de cada coluna.
  const renderHistogramFinal = () => {
    const counts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => ({
      sum: s,
      count: getPairsForSum(s).size,
    }));
    const maxCount = 6;
    return (
      <div
        role="img"
        aria-label="Histograma da distribuição das somas de dois dados"
        style={{
          // 100% inline styles — sem className — para evitar conflitos com
          // a classe .sumRevealHistogram que tem media queries diferentes
          // no contexto do sumReveal. Aqui queremos layout fixo e previsível.
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 6,
          padding: '12px 8px',
          background: 'var(--color-neutral-lightest)',
          border: '1px solid var(--color-neutral-lighter)',
          borderRadius: 12,
          height: 200,
          width: '100%',
          maxWidth: 480,
          boxSizing: 'border-box',
        }}
      >
        {counts.map(({ sum, count }) => {
          const isMax = count === maxCount;
          const isMin = count === 1;
          // Altura da barra em PIXELS (não %) para que count label possa
          // ficar colado ao topo via flex-end. Reserva ~34px para labels
          // (count + sum + margens) no total de 176px de altura útil (200 - 24 padding).
          const AVAIL_BAR_HEIGHT = 150;
          const barHeightPx = (count / maxCount) * AVAIL_BAR_HEIGHT;
          const barBg = isMax
            ? 'linear-gradient(180deg, #4ade80, #15803d)'
            : isMin
              ? 'linear-gradient(180deg, #fca5a5, #b91c1c)'
              : 'linear-gradient(180deg, #fde68a, #c79634)';
          return (
            <div
              key={sum}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // justify-content: flex-end → count + bar + sum se empilham
                // a partir do fundo do container, com count IMEDIATAMENTE
                // acima da barra (padrão de histograma estatístico).
                justifyContent: 'flex-end',
                height: '100%',
                flex: 1,
                maxWidth: 42,
              }}
            >
              {/* count label — fica colado ao topo da barra, não ao topo do container */}
              <span className="ds-small-bold" style={{
                color: isMax
                  ? 'var(--color-feedback-success-dark)'
                  : isMin
                    ? 'var(--color-feedback-error-dark)'
                    : 'var(--color-neutral-dark)',
                fontSize: '0.78rem',
                fontWeight: 800,
                lineHeight: '14px',
                marginBottom: 2,
              }}>
                {count}
              </span>
              {/* bar — altura em pixels proporcional à contagem */}
              <div
                style={{
                  width: '100%',
                  height: `${barHeightPx}px`,
                  background: barBg,
                  borderRadius: '4px 4px 0 0',
                }}
                aria-hidden
              />
              {/* sum label — rodapé do gráfico (eixo x) */}
              <span className="ds-small" style={{
                fontSize: '0.7rem',
                color: 'var(--color-neutral-darkest)',
                marginTop: 2,
                lineHeight: '14px',
              }}>
                {sum}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Tabela 6×6 ──
  const renderTable = (interactive?: boolean) => {
    // interactive controla se a tabela aceita cliques (callers antigos passam undefined)
    void interactive;
    // Conjunto de células corretas para a soma atual (usado em sumMarkTable e sumComplete)
    const sumTarget = greenResult + blueResult;
    const sumCorrectSet = (phase === 'sumMarkTable' || phase === 'sumComplete') ? getPairsForSum(sumTarget) : null;
    const showHighlight = phase === 'feedback' || phase === 'finished';

    return (
      <div className="overflow-x-auto">
        <style>{blinkStyle}</style>
        <table className="border-collapse mx-auto" style={{ minWidth: 320 }}>
          <thead>
            <tr>
              <th className="p-micro" style={{ width: 40 }} />
              {[1, 2, 3, 4, 5, 6].map(c => {
                const pairA = blinkPairs[0];
                const pairB = blinkPairs[1];
                const isColA = pairA && pairA.blue === c;
                const isColB = pairB && pairB.blue === c;
                // Halo só aplica se o par está ativo no ciclo de sequenciamento
                const isColActiveA = isColA && activeHaloPair === 'A';
                const isColActiveB = isColB && activeHaloPair === 'B';
                // Sincronização azul↔ordenada durante o passo 2 da celebração de acerto
                const isColCelebBlue = markCelebStep === 2 && markSolvedCell && (markSolvedCell.c + 1) === c;
                const halo: 'gold' | 'purple' | undefined = isColActiveA || isColCelebBlue ? 'gold' : isColActiveB ? 'purple' : undefined;
                const ariaLabel = isColA
                  ? `Dado azul face ${c}, pertencente ao primeiro par destacado`
                  : isColB
                  ? `Dado azul face ${c}, pertencente ao segundo par destacado`
                  : `Dado azul face ${c}`;
                return (
                  <th key={c} scope="col" className="p-micro text-center">
                    <div
                      data-halo={halo}
                      aria-label={ariaLabel}
                      role="img"
                      style={{
                        display: 'inline-block',
                        padding: 3,
                        lineHeight: 0,
                      }}
                    >
                      <DiceFaceIcon face={c} size={36} color="blue" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(r => {
              const pairA = blinkPairs[0];
              const pairB = blinkPairs[1];
              const isRowA = pairA && pairA.green === r;
              const isRowB = pairB && pairB.green === r;
              // Halo só aplica se o par está ativo no ciclo de sequenciamento
              const isRowActiveA = isRowA && activeHaloPair === 'A';
              const isRowActiveB = isRowB && activeHaloPair === 'B';
              // Sincronização verde↔abcissa durante o passo 1 da celebração de acerto
              const isRowCelebGreen = markCelebStep === 1 && markSolvedCell && (markSolvedCell.r + 1) === r;
              const rowHalo: 'gold' | 'purple' | undefined = isRowActiveA || isRowCelebGreen ? 'gold' : isRowActiveB ? 'purple' : undefined;
              const rowAriaLabel = isRowA
                ? `Dado verde face ${r}, pertencente ao primeiro par destacado`
                : isRowB
                ? `Dado verde face ${r}, pertencente ao segundo par destacado`
                : `Dado verde face ${r}`;
              return (
              <tr key={r}>
                <th scope="row" className="p-micro text-center">
                  <div
                    data-halo={rowHalo}
                    aria-label={rowAriaLabel}
                    role="img"
                    style={{
                      display: 'inline-block',
                      padding: 3,
                      lineHeight: 0,
                    }}
                  >
                    <DiceFaceIcon face={r} size={36} color="green" />
                  </div>
                </th>
                {[1, 2, 3, 4, 5, 6].map(c => {
                  const row = r - 1, col = c - 1;
                  const isFromHistory = history.some(h => h.green - 1 === row && h.blue - 1 === col);
                  const isCurrentResult = showHighlight && r === greenResult && c === blueResult;
                  const isHighlightRow = showHighlight && r === greenResult && c !== blueResult;
                  const isHighlightCol = showHighlight && c === blueResult && r !== greenResult;
                  const isCellA = pairA && pairA.green === r && pairA.blue === c;
                  const isCellB = pairB && pairB.green === r && pairB.blue === c;
                  const isCellActiveA = isCellA && activeHaloPair === 'A';
                  const isCellActiveB = isCellB && activeHaloPair === 'B';
                  const isHighlightedPair = isCellA || isCellB;
                  const cellHalo: 'gold' | 'purple' | undefined = isCellActiveA ? 'gold' : isCellActiveB ? 'purple' : undefined;
                  // isSolvedCell só é relevante durante markTable (celebração em progresso)
                  // e feedback (resultado da rodada). Fora dessas fases, o leak do
                  // markSolvedCell pinta células de rodadas anteriores em outras cenas
                  // (pairExplain, colorQuestion, etc.), o que é incorreto.
                  const isSolvedCell = !!(
                    markSolvedCell &&
                    markSolvedCell.r === row &&
                    markSolvedCell.c === col &&
                    (phase === 'markTable' || phase === 'feedback')
                  );
                  // Rodada 3 — fase sumMarkTable/sumComplete
                  const cellKey = `${r},${c}`;
                  const isSumMarked = (phase === 'sumMarkTable' || phase === 'sumComplete') && sumMarks.has(cellKey);
                  const isSumWrong = phase === 'sumMarkTable' && sumWrongMarks.has(cellKey);
                  const isSumCorrectReveal = phase === 'sumComplete' && sumCorrectSet?.has(cellKey);

                  // Animação de revelação em sumReveal: APENAS as células da soma
                  // atual (r+c === sumRevealStep) ficam destacadas. Cada soma revela
                  // seu grupo, substituindo a anterior. Cor alternada por paridade
                  // do step para variar visualmente a cada transição.
                  const cellSum = r + c;
                  const isRevealCurrent = phase === 'sumReveal' && cellSum === sumRevealStep && sumRevealStep >= 2 && sumRevealStep <= 12;
                  // Após a animação terminar (step=13), destaca as células da soma 7
                  // na mesma cor verde da coluna 7 do histograma (pico da distribuição).
                  const isRevealPeak7 = phase === 'sumReveal' && sumRevealStep >= 13 && cellSum === 7;
                  // Fase probPairReveal: destaca o par (x,y) sorteado + background
                  // uniforme em todas as células (equiprobabilidade visualizada).
                  const isProbPairTarget = phase === 'probPairReveal' && r === probPairX && c === probPairY;
                  const isProbPairAnyCell = phase === 'probPairReveal';
                  // Paridade do step: par → dourado, ímpar → turquesa
                  const revealBgColor = sumRevealStep % 2 === 0
                    ? 'linear-gradient(180deg, #fde68a, #b45309)'   // dourado forte
                    : 'linear-gradient(180deg, #99f6e4, #0d9488)';  // turquesa forte

                  let bg = undefined;
                  if (isProbPairTarget) bg = 'linear-gradient(180deg, #fde68a, #c79634)';
                  else if (isProbPairAnyCell) bg = 'rgba(252, 211, 77, 0.18)';
                  else if (isRevealPeak7) bg = 'linear-gradient(180deg, #4ade80, #15803d)';
                  else if (isRevealCurrent) bg = revealBgColor;
                  else if (isSumCorrectReveal) bg = 'linear-gradient(180deg, #a3d9a5, #2f8b4a)';
                  else if (isSumWrong) bg = 'linear-gradient(180deg, #ff9a9a, #c01818)';
                  else if (isSumMarked) bg = 'linear-gradient(180deg, #f6dc93, #c79634)';
                  else if (isSolvedCell) bg = 'linear-gradient(180deg, #f6dc93, #c79634)';
                  else if (isCurrentResult) bg = 'linear-gradient(180deg, #f1cf75, #c79634)';
                  else if (isCellA) bg = 'linear-gradient(180deg, #f1cf75, #c79634)';
                  else if (isCellB) bg = 'linear-gradient(180deg, #d7bde2, #7d3c98)';
                  else if (isHighlightRow) bg = 'rgba(42, 107, 69, 0.15)';
                  else if (isHighlightCol) bg = 'rgba(36, 80, 190, 0.15)';
                  // Background de histórico só aparece em feedback após 2ª validação
                  // (mesma regra do V) para não poluir o markTable da rodada atual.
                  else if (isFromHistory && phase === 'feedback' && history.length >= 2) bg = 'rgba(199, 165, 74, 0.12)';

                  // Padrão "static content + animated marker": a célula fica com
                  // background estático (gold ou purple gradient). Quem pulsa são os
                  // halos dos cabeçalhos (data-halo). Célula de celebração de acerto
                  // mantém a animação de fill-in única (não cíclica).
                  const cellAnim = isSolvedCell && markCelebStep === 0
                    ? 'markFillIn 0.3s ease-out forwards'
                    : isRevealCurrent
                    ? 'markVPop 0.4s ease-out'
                    : undefined;

                  const cellClickable =
                    (phase === 'markTable' && !isFromHistory && !markSolvedCell && !markBusy) ||
                    phase === 'sumMarkTable';

                  return (
                    <td
                      key={c}
                      data-halo={cellHalo}
                      className="border border-neutral-lighter p-micro text-center"
                      style={{
                        background: bg,
                        cursor: cellClickable ? 'pointer' : 'default',
                        transition: isHighlightedPair || isSolvedCell ? 'none' : 'background 0.2s',
                        animation: cellHalo ? undefined : cellAnim,
                        minWidth: 44, minHeight: 44,
                        position: 'relative',
                      }}
                      onClick={() => {
                        if (phase === 'markTable') handleCellClick(row, col);
                        else if (phase === 'sumMarkTable') handleSumCellClick(row, col);
                      }}
                    >
                      <div className="flex flex-col items-center gap-y-nano" style={{ minHeight: 32, justifyContent: 'center' }}>
                        {phase === 'pairExplain' && (
                          <span className="ds-caption" style={{
                            fontWeight: 800,
                            textShadow: '0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 1px 0 #fff',
                          }}>
                            (<span style={{ color: 'var(--color-feedback-success-dark)' }}>{r}</span>
                            ,<span style={{ color: 'var(--color-brand-otimath-pure)' }}>{c}</span>)
                          </span>
                        )}
                        {/* Celebração de acerto — passo 0: V grande branco com animação de pop */}
                        {phase === 'markTable' && isSolvedCell && markCelebStep === 0 && (
                          <svg
                            viewBox="0 0 24 24"
                            width="30"
                            height="30"
                            style={{ animation: 'markVPop 0.45s ease-out forwards' }}
                          >
                            <path
                              d="M4 12 L10 18 L20 6"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {/* V persistente — aparece APENAS em feedback após a segunda
                            validação. Ou seja, history.length >= 2. Durante markTable
                            o V do histórico fica oculto para não poluir a tabela que
                            o aluno está marcando ativamente. A célula do resultado
                            atual continua sendo destacada pelo background gold (bg). */}
                        {phase === 'feedback' && history.length >= 2 && (isFromHistory || isCurrentResult) && (
                          <svg
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            aria-label="Célula marcada corretamente"
                            role="img"
                          >
                            <path
                              d="M4 12 L10 18 L20 6"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
                              }}
                            />
                          </svg>
                        )}
                        {/* probPairReveal: cada célula mostra "1/36" — equiprobabilidade
                            de cada ponto do espaço amostral Ω = {1..6}×{1..6}. */}
                        {phase === 'probPairReveal' && (
                          <span
                            className="ds-small-bold"
                            style={{
                              fontSize: '0.68rem',
                              color: isProbPairTarget ? '#1a1205' : 'var(--color-neutral-darkest)',
                              fontWeight: isProbPairTarget ? 800 : 600,
                              textShadow: isProbPairTarget
                                ? '0 0 2px #fff, 0 0 2px #fff'
                                : undefined,
                            }}
                          >
                            1/36
                          </span>
                        )}
                        {/* X vermelho nas células marcadas erradas da fase sumMarkTable */}
                        {isSumWrong && (
                          <svg
                            viewBox="0 0 24 24"
                            width="26"
                            height="26"
                            aria-label="Marcação incorreta"
                            role="img"
                          >
                            <path
                              d="M6 6 L18 18 M18 6 L6 18"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
                              }}
                            />
                          </svg>
                        )}
                        {/* V grande verde em TODAS as células corretas quando sumComplete */}
                        {isSumCorrectReveal && (
                          <svg
                            viewBox="0 0 24 24"
                            width="26"
                            height="26"
                            aria-label="Célula corretamente identificada"
                            role="img"
                            style={{ animation: 'markVPop 0.45s ease-out forwards' }}
                          >
                            <path
                              d="M4 12 L10 18 L20 6"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
                              }}
                            />
                          </svg>
                        )}
                        {/* Celebração — passos 1-3: par ordenado colorido com blink sincronizado */}
                        {phase === 'markTable' && isSolvedCell && markCelebStep !== null && markCelebStep >= 1 && (
                          <span className="ds-caption" style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            textShadow: '0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 1px 0 #fff',
                            animation: markCelebStep === 1 ? 'markPairAppear 0.35s ease-out' : undefined,
                          }}>
                            (
                            <span style={{
                              color: 'var(--color-feedback-success-dark)',
                              display: 'inline-block',
                              animation: markCelebStep === 1 ? 'markCoordBlink 0.55s ease-in-out infinite' : undefined,
                            }}>{r}</span>
                            ,
                            <span style={{
                              color: 'var(--color-brand-otimath-pure)',
                              display: 'inline-block',
                              animation: markCelebStep === 2 ? 'markCoordBlink 0.55s ease-in-out infinite' : undefined,
                            }}>{c}</span>
                            )
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ═══════ RENDER ═══════
  return (
    <div className="w-full max-w-[700px]">
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Lançamento de dois dados
      </h2>

      {/* ═══════ INTRO — costura narrativa após a Cena 6 (máquina automática) ═══════
          Reordenamento didático: o aluno chega aqui já tendo observado o
          fenômeno na máquina, registrado pares, somado e feito uma previsão.
          A tabela é a RESPOSTA à pergunta plantada na ponte da Cena 6
          ("será que é só acaso ou existe um padrão escondido?"). */}
      {phase === 'intro' && (
        <div ref={cardRef} className="rounded-lg p-xxs"
          style={{
            background:
              'linear-gradient(180deg, var(--color-brand-otimath-lightest) 0%, var(--color-neutral-white) 100%)',
            border: '2px solid var(--color-brand-otimath-light)',
            boxShadow: '0 4px 16px rgba(36, 80, 190, 0.10)',
          }}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Quantos pares podem sair?
          </p>
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Você observou a máquina, registrou pares, somou e fez uma previsão. Mas{' '}
            <strong>quantos pares diferentes podem sair</strong> no lançamento de dois dados?
          </p>
          <p className="ds-body text-neutral-black mb-macro" style={{ textAlign: 'justify' }}>
            Vamos descobrir juntos, construindo as possibilidades <strong>um resultado de cada vez</strong>.
          </p>
          <div className="flex justify-center">
            <Button
              style="primary"
              size="small"
              onClick={() => { setPhase('tree'); playSound('/sounds/nextChallenge.mp3'); }}
              aria-label="Começar a construção do espaço amostral"
            >
              Começar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ ÁRVORE PROGRESSIVA — construção do espaço amostral ═══════ */}
      {phase === 'tree' && (
        <SampleSpaceTree onFinished={() => setPhase('ready')} diceSceneRef={diceSceneRef} />
      )}

      {/* ═══════ RODADA ATIVA ═══════ */}
      {phase !== 'intro' && phase !== 'tree' && phase !== 'finished' && phase !== 'pairQuestion' && phase !== 'pairExplain' && phase !== 'colorQuestion' && phase !== 'colorExplain' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Indicador de rodada */}
          <div className="flex justify-center gap-x-micro mb-macro">
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-y-nano">
                <div className="rounded-full" style={{
                  width: 14, height: 14,
                  background: i < round ? 'var(--color-feedback-success-dark)'
                    : i === round ? 'var(--color-brand-otimath-pure)'
                    : 'var(--color-neutral-lighter)',
                  transition: 'background 0.3s',
                }} />
                <span className="ds-caption text-neutral-dark">{i + 1}</span>
              </div>
            ))}
          </div>

          <p className="ds-body-bold text-center mb-micro" style={{ color: 'var(--color-brand-otimath-pure)' }}>
            Lançamento {round + 1} de {TOTAL_ROUNDS}
          </p>

          {/* Botão lançar */}
          {phase === 'ready' && (
            <>
              {round === 0 && (
                <p className="ds-body text-neutral-black text-center mb-micro" style={{ textAlign: 'justify' }}>
                  Agora vamos organizar os 36 pares numa <strong>tabela 6×6</strong>.
                  A cada lançamento, leia o resultado dos dados{' '}
                  <strong style={{ color: '#1a5c2e' }}>verde</strong> (linhas) e{' '}
                  <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>azul</strong> (colunas)
                  e marque o par na célula correspondente.
                </p>
              )}
              <div className="flex justify-center mb-micro">
                <Button style="primary" size="small" onClick={launchDice}>
                  🎲 Lançar dois dados
                </Button>
              </div>
            </>
          )}

          {/* Lançando / Observe */}
          {(phase === 'rolling' || phase === 'landed') && (
            <p className="ds-body-bold text-neutral-dark text-center mb-micro">
              {phase === 'rolling' ? 'Lançando os dados...' : 'Observe o resultado nos dados.'}
            </p>
          )}

          {/* ═══ PICKER DO PAR ORDENADO (substitui readGreen/readBlue) ═══
              Reuso do instrumento já construído na Cena 6 (gênese instrumental,
              TROUCHE 2004). O aluno clica no dado, escolhe a face via popover.
              Ordem do gesto (verde primeiro, azul depois) encena a convenção
              de par ordenado. 3 tentativas — ao 3º erro relança e reinicia. */}
          {phase === 'pickPair' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro">
              <p className="ds-body-bold text-neutral-black text-center" style={{ maxWidth: 460 }}>
                Registre o par de resultados do lançamento clicando em cada dado
                e escolhendo a face que apareceu.
              </p>
              <div
                className="flex items-center justify-center"
                style={{ gap: 12, flexWrap: 'wrap' }}
              >
                <span className="ds-heading-extra text-neutral-darkest" aria-hidden>(</span>
                <FacePicker
                  color="green"
                  selected={pickedGreen}
                  onPick={f => {
                    setPickedGreen(f);
                    setPickGreenError(false);
                    setPickFeedback('');
                  }}
                  errorState={pickGreenError}
                />
                <span className="ds-heading-extra text-neutral-darkest" aria-hidden>,</span>
                <FacePicker
                  color="blue"
                  selected={pickedBlue}
                  onPick={f => {
                    setPickedBlue(f);
                    setPickBlueError(false);
                    setPickFeedback('');
                  }}
                  errorState={pickBlueError}
                />
                <span className="ds-heading-extra text-neutral-darkest" aria-hidden>)</span>
              </div>
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={validatePickedPair}
                  aria-label="Conferir o par ordenado registrado"
                >
                  Conferir
                </Button>
              </div>
              {pickFeedback && !markRetryMsg && (
                <p
                  role="alert"
                  className="ds-small-bold text-center mt-micro"
                  style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 400 }}
                >
                  {pickFeedback}
                </p>
              )}
              {markRetryMsg && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                  Tente de novo. Vou te dar dados novos.
                </p>
              )}
            </div>
          )}

          {/* ═══ CONFIRMAÇÃO DO PAR REGISTRADO ═══
              Após picker correto, mostra o par (x, y) com coordenadas coloridas
              como espelho simbólico do gesto que o aluno acabou de fazer.
              Reforça a cadeia semiótica: ícone → símbolo → tabela. */}
          {phase === 'pickConfirm' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro">
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                ✓ Par registrado corretamente
              </p>
              <p className="ds-heading-extra text-center" style={{
                textShadow: '0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 1px 0 #fff',
              }}>
                (
                <span style={{ color: 'var(--color-feedback-success-dark)' }}>{greenResult}</span>
                ,{' '}
                <span style={{ color: 'var(--color-brand-otimath-pure)' }}>{blueResult}</span>
                )
              </p>
              <p className="ds-body text-neutral-black text-center" style={{ maxWidth: 440 }}>
                {round === 2
                  ? 'Agora você vai calcular a soma desses dois resultados.'
                  : 'Agora você vai marcar esse par na tabela 6 × 6 do espaço amostral.'}
              </p>
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={() => {
                    // Rodada 3 (index 2) salta a marcação simples e entra no
                    // exercício da soma (Momento A). Rodadas 0 e 1 seguem para
                    // markTable como antes.
                    if (round === 2) {
                      setSumAnswer('');
                      setSumAnswerError(false);
                      setSumMarks(new Set());
                      setSumWrongMarks(new Set());
                      setSumFeedbackState('none');
                      // Registra o par no histórico (como nas rodadas 1 e 2)
                      // para preservar compatibilidade com fases posteriores.
                      setHistory(h => [...h, { green: greenResult, blue: blueResult }]);
                      setPhase('sumInput');
                    } else {
                      setPhase('markTable');
                    }
                  }}
                  aria-label={round === 2 ? 'Calcular a soma dos dois dados' : 'Avançar para marcar o par na tabela'}
                >
                  {round === 2 ? 'Calcular a soma' : 'Marcar na tabela'}
                </Button>
              </div>
            </div>
          )}

          {/* Marcar na tabela */}
          {phase === 'markTable' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex gap-x-xs items-center justify-center mb-micro">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Verde</span>
                  <DiceFaceIcon face={greenResult} size={40} color="green" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-pure)' }}>Azul</span>
                  <DiceFaceIcon face={blueResult} size={40} color="blue" />
                </div>
              </div>
              <p className="ds-body-bold text-neutral-black text-center mb-micro">
                Marque o par ordenado{' '}
                <strong style={{
                  textShadow: '0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 1px 0 #fff',
                }}>
                  (
                  <span style={{ color: 'var(--color-feedback-success-dark)' }}>{greenResult}</span>
                  ,{' '}
                  <span style={{ color: 'var(--color-brand-otimath-pure)' }}>{blueResult}</span>
                  )
                </strong>{' '}
                na tabela:
              </p>
              {renderTable()}
              <div className="flex flex-col items-center gap-y-micro mt-micro">
                {markError && !markRetryMsg && (
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    O primeiro elemento do par (abcissa) é o resultado do dado <strong style={{ color: 'var(--color-feedback-success-dark)' }}>verde</strong> e o segundo (ordenada) é o do dado <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>azul</strong>.
                  </p>
                )}
                {markRetryMsg && (
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                    Tente de novo. Vou te dar dados novos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════ RODADA 3 — MOMENTO A (parte 1): digitar a soma ═══════ */}
          {phase === 'sumInput' && (
            <div className="flex flex-col gap-y-micro items-center mb-micro">
              <div className="flex gap-x-xs items-center justify-center mb-micro">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Verde</span>
                  <DiceFaceIcon face={greenResult} size={40} color="green" />
                </div>
                <span className="ds-heading-large text-neutral-dark">+</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-pure)' }}>Azul</span>
                  <DiceFaceIcon face={blueResult} size={40} color="blue" />
                </div>
                <span className="ds-heading-large text-neutral-dark">=</span>
                <span className="ds-heading-large text-neutral-dark">?</span>
              </div>
              <p className="ds-body-bold text-neutral-black text-center" style={{ maxWidth: 440 }}>
                Qual a soma dos resultados do lançamento?
              </p>
              <div className="flex items-center gap-x-micro mt-micro">
                <input
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={12}
                  value={sumAnswer}
                  onChange={e => { setSumAnswer(e.target.value); setSumAnswerError(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') validateSumInput(); }}
                  placeholder="?"
                  aria-label="Digite a soma dos dois dados"
                  className="ds-heading-extra"
                  style={{
                    border: `2px solid ${sumAnswerError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8,
                    padding: '8px 14px',
                    outline: 'none',
                    textAlign: 'center',
                    width: 88,
                    fontWeight: 700,
                  }}
                />
                <Button style="primary" size="small" onClick={validateSumInput}>
                  Conferir
                </Button>
              </div>
              {sumAnswerError && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Some os valores dos dois dados e tente novamente.
                </p>
              )}
            </div>
          )}

          {/* ═══════ RODADA 3 — MOMENTO A (parte 2): marcar todos os pares ═══════ */}
          {phase === 'sumMarkTable' && (
            <div className="flex flex-col gap-y-micro">
              <p className="ds-body-bold text-neutral-black text-center mb-micro" style={{ fontSize: '1.02rem' }}>
                Marque na tabela <strong>todas as possibilidades</strong> de ocorrer a soma{' '}
                <strong style={{ color: 'var(--color-feedback-warning-dark)', fontSize: '1.2rem' }}>
                  {greenResult + blueResult}
                </strong>.
              </p>
              {renderTable()}
              <div className="flex flex-col items-center gap-y-micro mt-micro">
                <Button style="primary" size="small" onClick={validateSumMarks}>
                  Conferir
                </Button>
                {sumFeedbackState === 'incomplete' && (
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                    Correto! Mas ainda não completou!
                  </p>
                )}
                {sumFeedbackState === 'wrong' && (
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    Há marcações incorretas (em vermelho). Corrija e tente novamente.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════ RODADA 3 — MOMENTO A: revelação + contagem pelo aluno ═══════
              A tabela é revelada com V em todas as células corretas, e o aluno
              precisa CONTAR manualmente quantas são e digitar o número. Não
              recebe o valor pronto — é a primeira vez que ele calcula n(A)
              explicitamente, preparando a fórmula P(A) = n(A)/n(Ω). */}
          {phase === 'sumComplete' && (
            <div className="flex flex-col gap-y-micro">
              <p className="ds-heading-extra text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                ✓ Correto!
              </p>
              {renderTable()}
              {!sumCountValidated ? (
                <div className="flex flex-col items-center gap-y-micro mt-micro">
                  <p className="ds-body-bold text-neutral-black text-center" style={{ fontSize: '1.05rem' }}>
                    A soma{' '}
                    <strong style={{ color: 'var(--color-feedback-warning-dark)' }}>
                      {greenResult + blueResult}
                    </strong>{' '}
                    ocorre{' '}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      value={sumCountAnswer}
                      onChange={e => { setSumCountAnswer(e.target.value); setSumCountError(false); }}
                      onKeyDown={e => { if (e.key === 'Enter') validateSumCount(); }}
                      placeholder="?"
                      aria-label="Digite quantas vezes a soma ocorre"
                      className="ds-body-bold"
                      style={{
                        border: `2px solid ${sumCountError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                        borderRadius: 8,
                        padding: '4px 10px',
                        outline: 'none',
                        textAlign: 'center',
                        width: 64,
                        fontWeight: 700,
                        margin: '0 6px',
                        verticalAlign: 'middle',
                      }}
                    />{' '}
                    vezes.
                  </p>
                  <Button style="primary" size="small" onClick={validateSumCount}>
                    Conferir
                  </Button>
                  {sumCountError && (
                    <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                      Conte na tabela quantas ocorrências da soma {greenResult + blueResult}.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="ds-body-bold text-neutral-black text-center mt-micro" style={{ fontSize: '1.05rem' }}>
                    A soma{' '}
                    <strong style={{ color: 'var(--color-feedback-warning-dark)' }}>
                      {greenResult + blueResult}
                    </strong>{' '}
                    ocorre{' '}
                    <strong style={{ color: 'var(--color-feedback-success-dark)' }}>
                      {getPairsForSum(greenResult + blueResult).size}
                    </strong>{' '}
                    {getPairsForSum(greenResult + blueResult).size === 1 ? 'vez' : 'vezes'}.
                  </p>
                  <div className="flex justify-center mt-micro">
                    <Button
                      style="primary"
                      size="small"
                      onClick={() => {
                        playSound('/sounds/nextChallenge.mp3');
                        setPhase('sumAlienIntro');
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════ RODADA 3 — MOMENTO B: ALIEN BRINCALHÃO ═══════
              Narrativa de entrada: alienígena oferece livro de matemática
              traduzido. Para ganhar, aluno responde 3 perguntas sobre a
              distribuição das somas. Contexto NÃO-JOGO-DE-AZAR. */}
          {phase === 'sumAlienIntro' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div style={{ fontSize: '3.5rem', lineHeight: 1 }} aria-hidden>🛸</div>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontSize: '0.98rem' }}>
                Um <strong>alienígena brincalhão</strong> surgiu na sua tela. Debaixo do braço,
                ele carrega um livro enorme, com símbolos dourados que pulsam na capa.
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontStyle: 'italic' }}>
                — Olá, humano! Este é o livro de matemática mais precioso da minha civilização.
                Levou 3 000 anos para ser escrito, e eu já fiz a tradução completa para o seu idioma.
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
                Ele estica os braços para te entregar o livro, mas o afasta na última hora e ri.
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontStyle: 'italic' }}>
                — Ahn, quase esqueci: no meu planeta a gente só dá presentes para quem vence um
                joguinho primeiro. São só <strong>três perguntas</strong> sobre a soma de dois dados.
                Acertou as três, o livro é seu. Mas atenção: você responde <strong>sem ver a tabela</strong>.
                É só na intuição!
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  setPhase('sumPredictMax');
                }}>
                  Topa o desafio!
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ MOMENTO B — Pergunta 1/3: soma mais frequente ═══════ */}
          {phase === 'sumPredictMax' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="flex items-center gap-x-micro">
                <span style={{ fontSize: '1.8rem' }} aria-hidden>🛸</span>
                <span className="ds-caption-bold text-brand-otimath-pure">Pergunta 1 de 3</span>
              </div>
              <p className="ds-body-bold text-neutral-black text-center" style={{ fontSize: '1.05rem' }}>
                Qual soma você acha que ocorre <strong style={{ color: 'var(--color-feedback-success-dark)' }}>MAIS</strong> vezes no lançamento de dois dados?
              </p>
              <div className="flex items-center gap-x-micro">
                <select
                  value={sumPredictedMax ?? ''}
                  onChange={e => setSumPredictedMax(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="ds-body-bold"
                  aria-label="Selecione a soma que você acha que ocorre mais vezes"
                  style={{
                    border: '2px solid var(--color-neutral-lighter)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    outline: 'none',
                    textAlign: 'center',
                    minWidth: 72,
                    fontWeight: 700,
                  }}
                >
                  <option value="">?</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <Button
                  style="primary"
                  size="small"
                  disabled={sumPredictedMax === null}
                  onClick={validateSumPredictMax}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ MOMENTO B — Pergunta 2/3: soma menos frequente ═══════ */}
          {phase === 'sumPredictMin' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="flex items-center gap-x-micro">
                <span style={{ fontSize: '1.8rem' }} aria-hidden>🛸</span>
                <span className="ds-caption-bold text-brand-otimath-pure">Pergunta 2 de 3</span>
              </div>
              <p className="ds-body-bold text-neutral-black text-center" style={{ fontSize: '1.05rem' }}>
                E qual soma você acha que ocorre <strong style={{ color: 'var(--color-feedback-error-dark)' }}>MENOS</strong> vezes?
              </p>
              <div className="flex items-center gap-x-micro">
                <select
                  value={sumPredictedMin ?? ''}
                  onChange={e => setSumPredictedMin(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="ds-body-bold"
                  aria-label="Selecione a soma que você acha que ocorre menos vezes"
                  style={{
                    border: '2px solid var(--color-neutral-lighter)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    outline: 'none',
                    textAlign: 'center',
                    minWidth: 72,
                    fontWeight: 700,
                  }}
                >
                  <option value="">?</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <Button
                  style="primary"
                  size="small"
                  disabled={sumPredictedMin === null}
                  onClick={validateSumPredictMin}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ MOMENTO B — Pergunta 3/3: somas impossíveis ═══════ */}
          {phase === 'sumImpossible' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="flex items-center gap-x-micro">
                <span style={{ fontSize: '1.8rem' }} aria-hidden>🛸</span>
                <span className="ds-caption-bold text-brand-otimath-pure">Pergunta 3 de 3</span>
              </div>
              <p className="ds-body-bold text-neutral-black text-center" style={{ fontSize: '1.02rem' }}>
                Quais destas somas são <strong style={{ color: 'var(--color-feedback-error-dark)' }}>impossíveis</strong> de ocorrer no lançamento de dois dados? (Marque todas.)
              </p>
              <div className="flex justify-center" style={{ gap: 10, flexWrap: 'wrap' }}>
                {sumImpossibleOptions.map(opt => {
                  const selected = sumImpossibleSelected.has(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSumImpossibleOption(opt)}
                      aria-pressed={selected}
                      aria-label={`Opção ${opt}${selected ? ' selecionada' : ''}`}
                      className="ds-heading-large"
                      style={{
                        minWidth: 64,
                        minHeight: 64,
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: selected
                          ? '3px solid var(--color-brand-otimath-pure)'
                          : '2px solid var(--color-neutral-lighter)',
                        background: selected
                          ? 'var(--color-brand-otimath-lightest)'
                          : 'var(--color-neutral-white)',
                        color: selected
                          ? 'var(--color-brand-otimath-pure)'
                          : 'var(--color-neutral-darkest)',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={validateSumImpossible}
                >
                  Confirmar
                </Button>
              </div>
              {sumImpossibleError === 'hint' && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 420 }}>
                  Pense: qual é o <strong>menor</strong> resultado possível quando você soma dois dados? E qual é o <strong>maior</strong>? Somas fora desse intervalo são impossíveis.
                </p>
              )}
            </div>
          )}

          {/* ═══════ MOMENTO B — Revelação animada + histograma + presente do alien ═══════ */}
          {phase === 'sumReveal' && (() => {
            const counts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => ({
              sum: s,
              count: getPairsForSum(s).size,
            }));
            const maxCount = 6;
            const animDone = sumRevealStep >= 13;
            const currentSum = sumRevealStep >= 2 && sumRevealStep <= 12 ? sumRevealStep : null;
            const currentCount = currentSum !== null ? getPairsForSum(currentSum).size : 0;
            return (
              <div className="flex flex-col gap-y-micro" style={{ maxWidth: 640, margin: '0 auto' }}>
                <div className="flex items-center justify-center gap-x-micro">
                  <span style={{ fontSize: '2.2rem' }} aria-hidden>🛸</span>
                  <p className="ds-heading-extra" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                    Revelação!
                  </p>
                </div>

                {/* Contador ao vivo durante a animação */}
                {!animDone && currentSum !== null && (
                  <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-warning-dark)', fontSize: '1.05rem' }}>
                    Soma <strong>{currentSum}</strong> → ocorre{' '}
                    <strong style={{ color: 'var(--color-feedback-success-dark)' }}>
                      {currentCount}
                    </strong>{' '}
                    {currentCount === 1 ? 'vez' : 'vezes'}
                  </p>
                )}
                {animDone && (
                  <p className="ds-body text-neutral-black text-center">
                    Agora sim — esta é a distribuição real de todas as somas possíveis:
                  </p>
                )}

                {/* Layout responsivo: tabela + histograma juntos na mesma tela.
                    Mobile: coluna (empilhados). Desktop ≥768px: linha (side-by-side).
                    Garante que o aluno veja tanto a célula sendo marcada quanto a
                    barra crescendo em sincronia, sem precisar rolar. */}
                <div className="sumRevealLayout">
                  {/* Tabela 6×6: apenas a soma atual destacada, cor alternada */}
                  <div style={{ flexShrink: 0 }}>
                    {renderTable()}
                  </div>

                {/* Histograma construído progressivamente EM PARALELO com a animação
                    da tabela. Cada barra cresce no momento em que sua soma é revelada
                    no tabuleiro. Inline styles (sem className) para garantir alinhamento
                    dentro do container e evitar conflitos com media queries.
                    Labels de frequência colados ao topo de cada barra via flex-end
                    + altura em pixels (não percentual). */}
                <div
                  role="img"
                  aria-label="Histograma da distribuição das somas de dois dados (construção progressiva)"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    background: 'var(--color-neutral-lightest)',
                    border: '1px solid var(--color-neutral-lighter)',
                    borderRadius: 12,
                    height: 200,
                    width: '100%',
                    maxWidth: 280,
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  {counts.map(({ sum, count }) => {
                    const isMax = count === maxCount;
                    const isMin = count === 1;
                    // A barra só tem altura se sua soma já foi revelada pela animação
                    const revealed = sumRevealStep >= sum;
                    // Altura em pixels (não %) para que count label possa ficar colado
                    // ao topo via flex-end. 150px é o máximo disponível entre os labels.
                    const AVAIL_BAR_HEIGHT = 150;
                    const barHeightPx = revealed ? (count / maxCount) * AVAIL_BAR_HEIGHT : 0;
                    // Durante a animação, usa cor alternada da tabela na barra que acabou
                    // de crescer; após animação, usa cor final (pico verde, extremos vermelhos).
                    const isGrowingNow = !animDone && sum === sumRevealStep;
                    let barBg: string;
                    if (isGrowingNow) {
                      barBg = sum % 2 === 0
                        ? 'linear-gradient(180deg, #fde68a, #b45309)'
                        : 'linear-gradient(180deg, #99f6e4, #0d9488)';
                    } else if (isMax) {
                      barBg = 'linear-gradient(180deg, #4ade80, #15803d)';
                    } else if (isMin) {
                      barBg = 'linear-gradient(180deg, #fca5a5, #b91c1c)';
                    } else {
                      barBg = 'linear-gradient(180deg, #fde68a, #c79634)';
                    }
                    return (
                      <div
                        key={sum}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          // flex-end: count + bar + sum se empilham a partir do fundo,
                          // com count IMEDIATAMENTE acima da barra.
                          justifyContent: 'flex-end',
                          height: '100%',
                          flex: 1,
                          maxWidth: 22,
                        }}
                      >
                        {/* Count label — colado ao topo da barra (flex-end) */}
                        <span className="ds-small-bold" style={{
                          color: isMax
                            ? 'var(--color-feedback-success-dark)'
                            : isMin
                            ? 'var(--color-feedback-error-dark)'
                            : 'var(--color-neutral-dark)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          opacity: revealed ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                          lineHeight: '14px',
                          marginBottom: 2,
                        }}>
                          {count}
                        </span>
                        {/* Bar com altura em pixels e transição animada */}
                        <div
                          style={{
                            width: '100%',
                            height: `${barHeightPx}px`,
                            background: barBg,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.28s ease-out, background 0.2s ease',
                          }}
                          aria-hidden
                        />
                        {/* Sum label — eixo x no rodapé */}
                        <span className="ds-small" style={{
                          fontSize: '0.7rem',
                          color: 'var(--color-neutral-darkest)',
                          marginTop: 2,
                          lineHeight: '14px',
                        }}>
                          {sum}
                        </span>
                      </div>
                    );
                  })}
                </div>
                </div>
                {/* fim do .sumRevealLayout (tabela + histograma juntos) */}

                {/* Cards de feedback e alien — só aparecem depois da animação */}
                {animDone && (
                  <>
                    {/* Comparação das 3 previsões com a realidade */}
                    <div className="flex flex-col gap-y-micro mt-micro" style={{ fontSize: '0.92rem' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: sumPredictedMaxCorrect ? 'rgba(74, 222, 128, 0.12)' : 'rgba(252, 165, 165, 0.12)',
                        border: `1px solid ${sumPredictedMaxCorrect ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)'}`,
                      }}>
                        {sumPredictedMaxCorrect ? '✓' : '✗'}{' '}
                        Mais frequente — você disse <strong>{sumPredictedMax}</strong>.
                        Resposta: <strong style={{ color: 'var(--color-feedback-success-dark)' }}>7</strong> (ocorre 6 vezes).
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: sumPredictedMinCorrect ? 'rgba(74, 222, 128, 0.12)' : 'rgba(252, 165, 165, 0.12)',
                        border: `1px solid ${sumPredictedMinCorrect ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)'}`,
                      }}>
                        {sumPredictedMinCorrect ? '✓' : '✗'}{' '}
                        Menos frequentes — você disse <strong>{sumPredictedMin}</strong>.
                        Resposta: <strong style={{ color: 'var(--color-feedback-error-dark)' }}>2</strong> e <strong style={{ color: 'var(--color-feedback-error-dark)' }}>12</strong> (cada uma ocorre apenas 1 vez).
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(74, 222, 128, 0.12)',
                        border: '1px solid var(--color-feedback-success-dark)',
                      }}>
                        ✓ Impossíveis — você identificou corretamente. A menor soma possível é <strong>2</strong> (1+1) e a maior é <strong>12</strong> (6+6). Qualquer valor fora desse intervalo é impossível.
                      </div>
                    </div>

                    {/* Mensagem curta de transição — o livro é entregue apenas
                        no card final de probSumReveal, depois do cálculo de todas
                        as probabilidades. Aqui é só celebração do histograma. */}
                    <p className="ds-body-bold text-center mt-micro" style={{ color: 'var(--color-feedback-success-dark)' }}>
                      {(sumPredictedMaxCorrect && sumPredictedMinCorrect)
                        ? '🎯 Você entendeu a distribuição das somas!'
                        : '📊 Agora você conhece a distribuição real das somas.'}
                    </p>

                    <div className="flex justify-center mt-micro">
                      <Button
                        style="primary"
                        size="small"
                        onClick={() => {
                          playSound('/sounds/nextChallenge.mp3');
                          setPhase('probPair');
                        }}
                      >
                        Próximo desafio
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ═══════ FASE probPair — pergunta sobre P((x,y)) ═══════ */}
          {phase === 'probPair' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 560, margin: '0 auto' }}>
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                Cálculo de probabilidade
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontSize: '0.98rem' }}>
                Um experimento aleatório consiste no lançamento de dois dados idênticos
                e equilibrados e observar o número de pintas nas faces dos dados que
                ficam voltadas para cima.
              </p>
              <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'center', fontSize: '1.02rem' }}>
                Após um único lançamento, qual a probabilidade de ocorrer o par{'\u00A0'}
                <strong style={{
                  color: 'var(--color-brand-otimath-pure)',
                  fontSize: '1.15rem',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}>
                  ({probPairX},&nbsp;{probPairY})
                </strong>
                ?
              </p>
              {/* Input de fração: numerador / denominador */}
              <div className="flex items-center justify-center" style={{ gap: 10, marginTop: 8 }}>
                <span className="ds-heading-extra text-neutral-darkest">P =</span>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={probPairNum}
                    onChange={e => { setProbPairNum(e.target.value); setProbPairError(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') validateProbPair(); }}
                    placeholder="?"
                    aria-label="Numerador"
                    className="ds-body-bold"
                    style={{
                      border: `2px solid ${probPairError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      outline: 'none',
                      textAlign: 'center',
                      width: 72,
                      fontWeight: 700,
                    }}
                  />
                  <div style={{
                    width: 72,
                    height: 2,
                    background: 'var(--color-neutral-darkest)',
                    margin: '4px 0',
                  }} />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={probPairDen}
                    onChange={e => { setProbPairDen(e.target.value); setProbPairError(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') validateProbPair(); }}
                    placeholder="?"
                    aria-label="Denominador"
                    className="ds-body-bold"
                    style={{
                      border: `2px solid ${probPairError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      outline: 'none',
                      textAlign: 'center',
                      width: 72,
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
              <Button style="primary" size="small" onClick={validateProbPair}>
                Conferir
              </Button>
              {probPairError && probPairErrorType === 'denominator' && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 440 }}>
                  No lançamento de dois dados, quantos resultados são possíveis?
                </p>
              )}
              {probPairError && probPairErrorType === 'numerator' && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 440 }}>
                  Os dados são honestos e portanto estamos diante de um espaço amostral equiprovável.
                </p>
              )}
              {probPairError && probPairErrorType === 'both' && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 440 }}>
                  No lançamento de dois dados, quantos resultados são possíveis? Lembre-se: os dados são honestos, e portanto estamos diante de um espaço amostral equiprovável.
                </p>
              )}
            </div>
          )}

          {/* ═══════ FASE probPairReveal — tabela 6×6 com 1/36 em cada célula ═══════ */}
          {phase === 'probPairReveal' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro">
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)', fontSize: '1.05rem' }}>
                ✓ Correto!
              </p>
              <p className="ds-body text-neutral-black text-center" style={{ maxWidth: 560 }}>
                Como todos os elementos de <strong>simetria</strong> estão presentes num{' '}
                <strong>dado equilibrado</strong>, cada par ordenado tem a mesma probabilidade{' '}
                <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>1/36</strong>{' '}
                de ocorrer.
              </p>
              {renderTable()}
              <p className="ds-small text-center mt-micro" style={{ color: 'var(--color-neutral-dark)', fontStyle: 'italic', maxWidth: 500 }}>
                Cada célula representa um par ordenado possível. Todas têm a mesma probabilidade.
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  setPhase('probSumTable');
                }}>
                  Próximo: probabilidades das somas
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ FASE probSumTable — tabela com 11 linhas para P(soma=k) ═══════ */}
          {phase === 'probSumTable' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 680, margin: '0 auto' }}>
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                Probabilidade de cada soma
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontSize: '0.96rem' }}>
                Você já sabe que cada par ordenado tem probabilidade <strong>1/36</strong>.
                Agora use o <strong>histograma</strong> abaixo para completar a probabilidade
                de cada <strong>soma</strong> — o número no topo de cada coluna indica
                quantos pares produzem aquela soma.
              </p>
              {/* Histograma como referência visual (substitui a cena 3D escondida) */}
              {renderHistogramFinal()}
              {/* Tabela em 2 colunas: P(2..7) | P(8..12) — exibe a simetria
                  triangular da distribuição de forma visualmente explícita. */}
              <div
                role="table"
                aria-label="Tabela de probabilidades das somas"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, auto auto)',
                  gap: '6px 12px',
                  alignItems: 'center',
                  padding: 12,
                  background: 'var(--color-neutral-lightest)',
                  border: '1px solid var(--color-neutral-lighter)',
                  borderRadius: 12,
                  maxWidth: 520,
                  justifyContent: 'center',
                }}
              >
                <span className="ds-caption-bold" style={{ color: 'var(--color-neutral-dark)', textAlign: 'right' }}>Soma</span>
                <span className="ds-caption-bold" style={{ color: 'var(--color-neutral-dark)' }}>Probabilidade</span>
                <span className="ds-caption-bold" style={{ color: 'var(--color-neutral-dark)', textAlign: 'right' }}>Soma</span>
                <span className="ds-caption-bold" style={{ color: 'var(--color-neutral-dark)' }}>Probabilidade</span>
                {/* Intercala P(k) e P(k+6) para formar as 2 colunas:
                    linha 0: P(2) | P(8), linha 1: P(3) | P(9), ..., linha 5: P(7) | — */}
                {(() => {
                  const rows: Array<[number, number | null]> = [
                    [2, 8], [3, 9], [4, 10], [5, 11], [6, 12], [7, null],
                  ];
                  const nodes: React.ReactNode[] = [];
                  const renderCellsForSum = (s: number): React.ReactNode => {
                    const entry = probSumInputs[s] ?? { num: '', den: '' };
                    const isWrong = probSumWrongRows.has(s);
                    const borderColor = isWrong ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)';
                    return (
                      <React.Fragment key={`pair-${s}`}>
                        <span
                          key={`label-${s}`}
                          className="ds-body-bold"
                          style={{ textAlign: 'right', color: 'var(--color-neutral-darkest)' }}
                        >
                          P({s}) =
                        </span>
                        <div key={`inputs-${s}`} className="flex items-center" style={{ gap: 6 }}>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={entry.num}
                            onChange={e => setProbSumField(s, 'num', e.target.value)}
                            aria-label={`Numerador da probabilidade da soma ${s}`}
                            style={{
                              border: `2px solid ${borderColor}`,
                              borderRadius: 6,
                              padding: '4px 6px',
                              outline: 'none',
                              textAlign: 'center',
                              width: 52,
                              fontWeight: 700,
                            }}
                          />
                          <span className="ds-body-bold text-neutral-darkest">/</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={entry.den}
                            onChange={e => setProbSumField(s, 'den', e.target.value)}
                            aria-label={`Denominador da probabilidade da soma ${s}`}
                            style={{
                              border: `2px solid ${borderColor}`,
                              borderRadius: 6,
                              padding: '4px 6px',
                              outline: 'none',
                              textAlign: 'center',
                              width: 52,
                              fontWeight: 700,
                            }}
                          />
                        </div>
                      </React.Fragment>
                    );
                  };
                  for (const [leftS, rightS] of rows) {
                    nodes.push(renderCellsForSum(leftS));
                    if (rightS !== null) {
                      nodes.push(renderCellsForSum(rightS));
                    } else {
                      // Célula vazia para manter o grid alinhado na linha final
                      nodes.push(
                        <span key={`empty-label-${leftS}`} aria-hidden />,
                        <span key={`empty-input-${leftS}`} aria-hidden />,
                      );
                    }
                  }
                  return nodes;
                })()}
              </div>
              <Button style="primary" size="small" onClick={validateProbSumTable}>
                Conferir
              </Button>
              {probSumFeedback === 'missing' && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 440 }}>
                  Preencha todas as linhas (numerador e denominador) antes de conferir.
                </p>
              )}
              {probSumFeedback === 'wrong' && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 440 }}>
                  Algumas linhas estão incorretas (marcadas em vermelho). Pense: quantos pares produzem cada soma? E qual o total de pares no espaço amostral?
                </p>
              )}
            </div>
          )}

          {/* ═══════ FASE probSumReveal — fechamento com axioma da soma + alien ═══════ */}
          {phase === 'probSumReveal' && (
            <div className="flex flex-col items-center gap-y-micro mb-micro" style={{ maxWidth: 560, margin: '0 auto' }}>
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)', fontSize: '1.1rem' }}>
                ✓ Todas corretas!
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
                Repare que a soma de todas as probabilidades é igual a <strong>1</strong>:
              </p>
              <div style={{
                padding: '12px 16px',
                background: 'var(--color-brand-otimath-lightest)',
                border: '1px solid var(--color-brand-otimath-light)',
                borderRadius: 10,
                fontSize: '0.88rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                color: 'var(--color-neutral-darkest)',
              }}>
                1/36 + 2/36 + 3/36 + 4/36 + 5/36 + 6/36 + 5/36 + 4/36 + 3/36 + 2/36 + 1/36
                <br />
                = <strong style={{ color: 'var(--color-feedback-success-dark)' }}>36/36 = 1</strong>
              </div>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontSize: '0.94rem' }}>
                Esse é um dos princípios fundamentais da probabilidade: a soma das probabilidades
                de todos os resultados possíveis de um experimento aleatório é sempre igual a <strong>1</strong>.
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'center', fontSize: '0.95rem', marginTop: 8 }}>
                Pronto para testar tudo que você aprendeu numa corrida de carrinhos?
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  setPhase('raceBet');
                }}>
                  Próximo: corrida dos carrinhos
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ CORRIDA DE CARRINHOS — sub-fase raceBet (aposta obrigatória) ═══════ */}
          {phase === 'raceBet' && (
            <div className="flex flex-col gap-y-micro" style={{ maxWidth: 720, margin: '0 auto' }}>
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                Corrida dos carrinhos
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify', fontSize: '0.95rem' }}>
                Antes de iniciar o jogo, <strong>aposte qual dos 13 carrinhos</strong> (numerados de 1 a 13) será o vencedor.
                Para jogar, você deve clicar em <strong>&ldquo;Sortear&rdquo;</strong> e dois dados serão sorteados.
                A soma dos resultados definirá qual carrinho irá se deslocar. Vence o carrinho que chegar primeiro.
              </p>
              <p className="ds-small text-center" style={{ color: 'var(--color-neutral-dark)', fontStyle: 'italic' }}>
                Clique no carrinho em que você quer apostar. Lembre-se do que você descobriu sobre somas possíveis.
              </p>
              {/* Pista da corrida — 13 linhas, cada uma com carrinho à esquerda
                  (clicável para aposta) + 6 células vazias + linha de chegada */}
              <div
                role="grid"
                aria-label="Pista da corrida com 13 carrinhos"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: 10,
                  background: 'var(--color-neutral-lightest)',
                  border: '1px solid var(--color-neutral-lighter)',
                  borderRadius: 12,
                }}
              >
                {/* Linhas de 13 até 1 (invertidas para 13 aparecer no topo) */}
                {[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(carNumber => {
                  const isBet = raceBet === carNumber;
                  return (
                    <div
                      key={`row-bet-${carNumber}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {/* Número do carrinho */}
                      <div style={{
                        width: 26,
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: isBet ? '#b45309' : 'var(--color-neutral-darkest)',
                        flexShrink: 0,
                      }}>
                        {carNumber}
                      </div>
                      {/* Carrinho clicável (primeira célula, largada) */}
                      <button
                        type="button"
                        onClick={() => handleRaceBetClick(carNumber)}
                        aria-label={`Apostar no carrinho ${carNumber}`}
                        style={{
                          flex: 1,
                          minHeight: 38,
                          background: isBet ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
                          border: isBet ? '2px solid #fbbf24' : '1px solid var(--color-neutral-lighter)',
                          borderRadius: 4,
                          padding: 0,
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          transition: 'border-color 0.18s ease, transform 0.12s ease, background 0.18s ease',
                          transform: isBet ? 'scale(1.02)' : 'scale(1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CarrinhoIcon numero={carNumber} width={44} highlighted={isBet} />
                      </button>
                      {/* Células vazias 2..6 */}
                      {Array.from({ length: RACE_LENGTH - 1 }, (_, i) => (
                        <div
                          key={`cell-bet-${carNumber}-${i}`}
                          style={{
                            flex: 1,
                            minHeight: 38,
                            border: '1px solid var(--color-neutral-lighter)',
                          }}
                        />
                      ))}
                      {/* Linha de chegada */}
                      <div
                        style={{
                          width: 16,
                          minHeight: 38,
                          background: 'repeating-linear-gradient(45deg, #000 0 4px, #fff 4px 8px)',
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>
              {/* Modal de confirmação para aposta em carrinho impossível */}
              {raceImpossibleConfirm !== null && (
                <div
                  role="alertdialog"
                  aria-labelledby="impossible-bet-title"
                  style={{
                    padding: 14,
                    background: 'rgba(252, 165, 165, 0.18)',
                    border: '2px solid var(--color-feedback-warning-dark)',
                    borderRadius: 12,
                  }}
                >
                  <p id="impossible-bet-title" className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-warning-dark)' }}>
                    Tem certeza que quer apostar no carrinho {raceImpossibleConfirm}?
                  </p>
                  <p className="ds-small text-center mt-micro" style={{ color: 'var(--color-neutral-darkest)' }}>
                    Essa é uma das somas que você identificou como <strong>impossível</strong>{' '}
                    na etapa anterior. Quer apostar mesmo assim?
                  </p>
                  <div className="flex justify-center gap-x-micro mt-micro">
                    <Button style="secondary" size="small" onClick={cancelImpossibleBet}>
                      Não, escolher outro
                    </Button>
                    <Button style="primary" size="small" onClick={confirmImpossibleBet}>
                      Sim, apostar mesmo assim
                    </Button>
                  </div>
                </div>
              )}
              {raceBet !== null && raceImpossibleConfirm === null && (
                <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                  Você apostou no carrinho <strong>{raceBet}</strong>. Clique em Sortear para começar a corrida!
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  disabled={raceBet === null || raceImpossibleConfirm !== null}
                  onClick={startRace}
                  aria-label={raceBet === null ? 'Escolha um carrinho antes de começar' : 'Sortear os dados'}
                >
                  🎲 Sortear
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ CORRIDA DE CARRINHOS — sub-fase raceRunning (corrida em andamento) ═══════ */}
          {phase === 'raceRunning' && (
            <div className="flex flex-col gap-y-micro" style={{ maxWidth: 720, margin: '0 auto' }}>
              <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-pure)' }}>
                Corrida em andamento
              </p>
              {racePendingSum === null && raceWinner === null && (
                <p className="ds-body text-neutral-black text-center" style={{ fontSize: '0.95rem' }}>
                  Clique em <strong>Sortear</strong> para lançar os dados. Depois, <strong>some os resultados</strong> e clique no carrinho correspondente à soma para avançá-lo.
                </p>
              )}
              {racePendingSum !== null && raceWinner === null && (
                <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-warning-dark)', fontSize: '1.05rem' }}>
                  A soma foi <strong>{racePendingSum}</strong>. Clique no carrinho <strong>{racePendingSum}</strong> para avançá-lo!
                </p>
              )}
              {raceClickError && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Observe os dados: a soma foi <strong>{racePendingSum}</strong>. Clique no carrinho correto.
                </p>
              )}
              {/* Pista da corrida — layout flex simples, 13 linhas verticais */}
              <div
                role="grid"
                aria-label="Pista da corrida com 13 carrinhos"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: 10,
                  background: 'var(--color-neutral-lightest)',
                  border: '1px solid var(--color-neutral-lighter)',
                  borderRadius: 12,
                }}
              >
                {[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(carNumber => {
                  const isBet = raceBet === carNumber;
                  const pos = racePositions[carNumber] ?? 0;
                  const canClick = racePendingSum !== null && raceWinner === null;
                  const isHighlightedAsTarget = racePendingSum === carNumber && raceWinner === null;
                  return (
                    <div
                      key={`row-running-${carNumber}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {/* Número do carrinho */}
                      <div style={{
                        width: 26,
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: isBet ? '#b45309' : 'var(--color-neutral-darkest)',
                        flexShrink: 0,
                      }}>
                        {carNumber}
                      </div>
                      {/* 6 células da pista */}
                      {Array.from({ length: RACE_LENGTH }, (_, i) => {
                        const isCarHere = pos === i;
                        return (
                          <div
                            key={`cell-run-${carNumber}-${i}`}
                            style={{
                              flex: 1,
                              minHeight: 38,
                              border: '1px solid var(--color-neutral-lighter)',
                              background: pos > i ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.25s ease',
                              position: 'relative',
                            }}
                          >
                            {isCarHere && (
                              <button
                                type="button"
                                disabled={!canClick}
                                onClick={() => handleRaceCarClick(carNumber)}
                                aria-label={`Carrinho ${carNumber}${isHighlightedAsTarget ? ' alvo atual, clique para avançar' : ''}`}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  padding: 0,
                                  cursor: canClick ? 'pointer' : 'default',
                                  transition: 'transform 350ms ease',
                                  transform: isHighlightedAsTarget ? 'scale(1.08)' : 'scale(1)',
                                  animation: isHighlightedAsTarget ? 'markVPop 0.5s ease-out' : undefined,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: '100%',
                                  touchAction: 'manipulation',
                                }}
                              >
                                <CarrinhoIcon
                                  numero={carNumber}
                                  width={44}
                                  highlighted={isBet || isHighlightedAsTarget}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {/* Linha de chegada (coluna final quadriculada) */}
                      <div
                        style={{
                          width: 16,
                          minHeight: 38,
                          background: 'repeating-linear-gradient(45deg, #000 0 4px, #fff 4px 8px)',
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  disabled={raceBusy || racePendingSum !== null || raceWinner !== null}
                  onClick={rollRaceDice}
                  aria-label="Sortear os dados"
                >
                  🎲 Sortear
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ CORRIDA DE CARRINHOS — sub-fase raceFinished (celebração) ═══════ */}
          {phase === 'raceFinished' && (
            <div className="flex flex-col gap-y-micro" style={{ maxWidth: 640, margin: '0 auto' }}>
              <p className="ds-heading-extra text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                🏁 Chegada!
              </p>
              <p className="ds-body-bold text-center" style={{ fontSize: '1.1rem' }}>
                O carrinho <strong style={{ color: 'var(--color-feedback-warning-dark)' }}>{raceWinner}</strong> venceu a corrida!
              </p>
              {raceBet !== null && raceWinner === raceBet && (
                <p className="ds-body text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
                  🎉 Parabéns! Você apostou no vencedor.
                </p>
              )}
              {raceBet !== null && raceWinner !== raceBet && raceBet !== 1 && raceBet !== 13 && (
                <p className="ds-body text-center">
                  Você apostou no carrinho <strong>{raceBet}</strong>, mas o <strong>{raceWinner}</strong> venceu.
                  Isso não é falha — é a probabilidade em ação. O carrinho 7 é o mais provável porque tem mais formas de ser alcançado (6 pares).
                </p>
              )}
              {raceBet !== null && (raceBet === 1 || raceBet === 13) && (
                <p className="ds-body text-center" style={{ color: 'var(--color-feedback-warning-dark)' }}>
                  Você apostou no carrinho <strong>{raceBet}</strong>, que é uma soma <strong>impossível</strong>. Ele nunca saiu da largada porque <strong>P({raceBet}) = 0</strong>.
                </p>
              )}
              <p className="ds-small text-center" style={{ color: 'var(--color-neutral-dark)', fontStyle: 'italic' }}>
                Repare que os carrinhos <strong>1</strong> e <strong>13</strong> ficaram parados o tempo todo.
                Isso é porque P(1) = 0 e P(13) = 0 — <strong>eventos impossíveis</strong> nunca ocorrem.
                A menor soma possível é 2 (1+1) e a maior é 12 (6+6).
              </p>
              {/* Card final do alien entregando o livro (agora no fim absoluto do OVA) */}
              <div className="flex flex-col items-center gap-y-micro mt-micro" style={{
                padding: '14px',
                background: 'var(--color-brand-otimath-lightest)',
                border: '2px solid var(--color-brand-otimath-light)',
                borderRadius: 12,
                width: '100%',
              }}>
                <img
                  src="/images/teaching/probability/two-dices/alien-livro.webp"
                  alt="Alienígena amigável entregando um livro de matemática com símbolos dourados na capa"
                  width={120}
                  height={120}
                  loading="lazy"
                  style={{
                    width: 'min(120px, 28vw)',
                    height: 'auto',
                    borderRadius: 10,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.textContent = '🛸 📘';
                    fallback.style.fontSize = '2rem';
                    fallback.setAttribute('aria-hidden', 'true');
                    img.parentElement?.insertBefore(fallback, img);
                  }}
                />
                <p className="ds-body text-neutral-black" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  — Parabéns, humano! Você dominou as probabilidades de dois dados e viu a distribuição em ação.
                  O livro é seu — leia-o bem, ele guarda os segredos matemáticos de um milhão de mundos!
                </p>
              </div>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={() => {
                  playSound('/sounds/gameFinished.mp3');
                  onFinished();
                }}>
                  Finalizar
                </Button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {phase === 'feedback' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex gap-x-xs items-center justify-center mb-micro">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Verde</span>
                  <DiceFaceIcon face={greenResult} size={40} color="green" />
                  <span className="ds-body-bold text-neutral-black">{greenResult}</span>
                </div>
                <span className="ds-heading-large text-neutral-dark">→</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold text-brand-otimath-pure">Par ordenado</span>
                  <span className="ds-heading-large text-brand-otimath-dark">({greenResult}, {blueResult})</span>
                </div>
                <span className="ds-heading-large text-neutral-dark">←</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-pure)' }}>Azul</span>
                  <DiceFaceIcon face={blueResult} size={40} color="blue" />
                  <span className="ds-body-bold text-neutral-black">{blueResult}</span>
                </div>
              </div>
              {renderTable()}
              <p className="ds-small text-neutral-dark text-center mt-micro" style={{ fontStyle: 'italic' }}>
                Lançamentos registrados: {history.length} de {TOTAL_ROUNDS}.
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={nextRound}>
                  {round + 1 >= TOTAL_ROUNDS ? 'Próximo: finalizar' : `Próximo: lançamento ${round + 2} de ${TOTAL_ROUNDS}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ INTERVALO PEDAGÓGICO: (x,y) vs (y,x) ═══════ */}
      {phase === 'pairQuestion' && (() => {
        const pair = getPairForQuestion();
        if (!pair) { setPhase('pairExplain'); return null; }
        const { original: o } = pair;
        return (
          <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="ds-body-bold text-neutral-black text-center mb-micro" style={{ fontSize: '1.05rem' }}>
              Considere o par ordenado <strong>({o.green}, {o.blue})</strong> que você registrou.
            </p>
            <p className="ds-body-bold text-neutral-black text-center mb-micro">
              O par <strong>({o.green}, {o.blue})</strong> é o mesmo que <strong>({o.blue}, {o.green})</strong>?
            </p>
            <div className="flex justify-center gap-x-macro mb-micro">
              <Button
                style={pairAnswer === 'sim' ? 'primary' : 'secondary'}
                size="extra-small"
                onClick={() => { setPairAnswer('sim'); setPairAnswerError(false); }}
              >
                Sim, são iguais
              </Button>
              <Button
                style={pairAnswer === 'nao' ? 'primary' : 'secondary'}
                size="extra-small"
                onClick={() => { setPairAnswer('nao'); setPairAnswerError(false); }}
              >
                Não, são diferentes
              </Button>
            </div>
            {pairAnswer && (
              <div className="flex justify-center">
                <Button style="primary" size="small" onClick={() => {
                  if (pairAnswer === 'nao') {
                    playSound('/sounds/correct.mp3');
                    setPhase('pairExplain');
                  } else {
                    playSound('/sounds/incorrect.mp3');
                    setPairAnswerError(true);
                  }
                }}>Conferir</Button>
              </div>
            )}
            {pairAnswerError && (
              <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
                Observe a posição de cada resultado na tabela. Tente novamente.
              </p>
            )}
          </div>
        );
      })()}

      {phase === 'pairExplain' && (() => {
        const pair = getPairForQuestion();
        const o = pair?.original ?? { green: 3, blue: 5 };
        return (
          <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify', fontSize: '1.05rem' }}>
              Os pares <strong>({o.green}, {o.blue})</strong> e <strong>({o.blue}, {o.green})</strong> são
              resultados <strong>diferentes</strong>.
            </p>
            <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
              Em <strong>({o.green}, {o.blue})</strong>, o dado
              <strong style={{ color: 'var(--color-feedback-success-dark)' }}> verde</strong> saiu {o.green} e o dado
              <strong style={{ color: 'var(--color-brand-otimath-pure)' }}> azul</strong> saiu {o.blue}.
              Em <strong>({o.blue}, {o.green})</strong>, o dado
              <strong style={{ color: 'var(--color-feedback-success-dark)' }}> verde</strong> saiu {o.blue} e o dado
              <strong style={{ color: 'var(--color-brand-otimath-pure)' }}> azul</strong> saiu {o.green}.
              São posições diferentes na tabela:
            </p>
            {renderTable(false)}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={() => setPhase('colorQuestion')}>
                Próximo
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ═══════ PERGUNTA SOBRE DADOS DA MESMA COR ═══════ */}
      {phase === 'colorQuestion' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black text-center mb-micro" style={{ fontSize: '1.05rem' }}>
            E se os dois dados fossem da <strong>mesma cor</strong>? Ainda seria possível distinguir os pares?
          </p>
          {whiteThrowCount < 2 && (
            <div className="flex justify-center mb-micro">
              <Button
                style="secondary"
                size="small"
                disabled={machineBusy}
                onClick={async () => {
                  const machine = diceMachineRef.current;
                  const machineContainer = diceMachineContainerRef.current;
                  if (!machine || !machineContainer || machineBusy) return;
                  setMachineBusy(true);
                  try {
                    // 1. Dados ficam brancos com pintas pretas (troca instantânea de textura)
                    machine.setWhiteMode(true);
                    // 2. Pausa de 300ms — aluno vê os dados brancos sobre a mesa antes do lançamento
                    await new Promise(r => setTimeout(r, 300));
                    // 3. Máquina processa o lançamento completo (copo, pistões, física, som)
                    machineContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await machine.roll();
                  } finally {
                    setMachineBusy(false);
                    setWhiteThrowCount(c => c + 1);
                  }
                }}
              >
                {whiteThrowCount === 0 ? 'Lançar os dados brancos' : 'Lançar novamente (opcional)'}
              </Button>
            </div>
          )}
          {whiteThrowCount === 0 && (
            <p className="ds-small text-center mb-micro" style={{ color: 'var(--color-neutral-dark)', fontStyle: 'italic' }}>
              Lance os dados pelo menos uma vez antes de responder.
            </p>
          )}
          <div className="flex justify-center gap-x-macro mb-micro" style={{ opacity: whiteThrowCount === 0 ? 0.4 : 1, pointerEvents: whiteThrowCount === 0 ? 'none' : 'auto' }}>
            <Button
              style={colorAnswer === 'sim' ? 'primary' : 'secondary'}
              size="extra-small"
              onClick={() => { setColorAnswer('sim'); setColorAnswerError(false); }}
            >
              Sim
            </Button>
            <Button
              style={colorAnswer === 'nao' ? 'primary' : 'secondary'}
              size="extra-small"
              onClick={() => { setColorAnswer('nao'); setColorAnswerError(false); }}
            >
              Não
            </Button>
          </div>
          {colorAnswer && (
            <div className="flex justify-center">
              <Button style="primary" size="small" onClick={() => {
                if (colorAnswer === 'sim') {
                  playSound('/sounds/correct.mp3');
                  setPhase('colorExplain');
                } else {
                  playSound('/sounds/incorrect.mp3');
                  setColorAnswerError(true);
                }
              }}>Conferir</Button>
            </div>
          )}
          {colorAnswerError && (
            <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Lembre-se: os dois dados são objetos separados, mesmo que tenham a mesma cor. Tente novamente.
            </p>
          )}
        </div>
      )}

      {phase === 'colorExplain' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify', fontSize: '1.05rem' }}>
            Mesmo escondidos pelo copo, sem as cores e sem você conseguir rastrear qual dado era qual,
            os pares <strong>(x, y)</strong> e <strong>(y, x)</strong> continuam sendo resultados diferentes.
            A <strong>ordem mora no par</strong>, não nos dados.
          </p>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Cada dado é um objeto separado, cada um produz seu próprio resultado, e a <strong>ordem importa</strong>{' '}
            como propriedade matemática do par ordenado — independente de conseguirmos distinguir os dados visualmente.
          </p>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Usamos cores diferentes apenas para <strong>facilitar a identificação</strong> de qual dado
            corresponde à linha e qual corresponde à coluna na tabela.
          </p>
          <div className="flex justify-center mt-micro">
            <Button style="primary" size="small" onClick={resumeAfterPedagogic}>
              Próximo: lançamento 3 de {TOTAL_ROUNDS}
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FINALIZAÇÃO ═══════ */}
      {phase === 'finished' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
            Você realizou {TOTAL_ROUNDS} lançamentos e registrou os resultados como pares ordenados na tabela.
            Cada célula representa um resultado possível do experimento aleatório de lançar dois dados.
          </p>
          {renderTable(false)}
          <p className="ds-small text-neutral-dark text-center mt-micro" style={{ fontStyle: 'italic' }}>
            Pares registrados: {history.map(h => `(${h.green}, ${h.blue})`).join(', ')}.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={onFinished}>
              Iniciar Simulação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
