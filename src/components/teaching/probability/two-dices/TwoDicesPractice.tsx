'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { DiceSceneHandle, DiceColor } from './DiceScene';

// ═══════ Padrão de pintas para as faces do dado ═══════
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

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

// ═══════ Fração estilizada ═══════
function Fraction({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center mx-nano" style={{ verticalAlign: 'middle' }}>
      <span className="ds-small-bold">{num}</span>
      <span className="border-t border-neutral-darkest" style={{ width: '100%', minWidth: 12 }} />
      <span className="ds-small-bold">{den}</span>
    </span>
  );
}

// ═══════ Eventos para 1 dado — 4 categorias (A1=48, A2=12, A3=26, A4=55) ═══════
interface SingleDieEvent {
  description: string;
  validation: (f: number) => boolean;
}

// Helpers de propriedades numéricas
const isPrime = (n: number) => [2, 3, 5].includes(n);
const isComposite = (n: number) => [4, 6].includes(n);
const isMultOf = (n: number, m: number) => n % m === 0;
const isDivisorOf = (n: number, m: number) => m % n === 0;
const isPerfectSquare = (n: number) => [1, 4].includes(n);
const isPowerOf2 = (n: number) => [1, 2, 4].includes(n);
const divisorCount = (n: number) => { let c = 0; for (let i = 1; i <= n; i++) if (n % i === 0) c++; return c; };
const isSumOfTwoPrimes = (n: number) => {
  for (let i = 2; i <= n / 2; i++) if (isPrime(i) && isPrime(n - i)) return true;
  return false;
};
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const hasCommonDivisorBeyond1 = (a: number, b: number) => gcd(a, b) > 1;

type E = SingleDieEvent;
const e = (d: string, v: (f: number) => boolean): E => ({ description: d, validation: v });

const A1: E[] = [
  e('Sair número múltiplo de 2.', f => isMultOf(f, 2)),
  e('Sair número múltiplo de 3.', f => isMultOf(f, 3)),
  e('Sair número que não é múltiplo de 2.', f => !isMultOf(f, 2)),
  e('Sair número que não é múltiplo de 3.', f => !isMultOf(f, 3)),
  e('Sair número múltiplo de 2 e maior que 2.', f => isMultOf(f, 2) && f > 2),
  e('Sair número múltiplo de 3 ou igual a 1.', f => isMultOf(f, 3) || f === 1),
  e('Sair número múltiplo de 2 ou múltiplo de 3.', f => isMultOf(f, 2) || isMultOf(f, 3)),
  e('Sair número múltiplo de 2 e menor que 6.', f => isMultOf(f, 2) && f < 6),
  e('Sair número que é divisor de 6.', f => isDivisorOf(f, 6)),
  e('Sair número que é divisor de 4.', f => isDivisorOf(f, 4)),
  e('Sair número que é divisor de 3.', f => isDivisorOf(f, 3)),
  e('Sair número que não é divisor de 6.', f => !isDivisorOf(f, 6)),
  e('Sair número que divide 6 sem deixar resto.', f => isDivisorOf(f, 6)),
  e('Sair número que é divisor comum de 4 e 6.', f => isDivisorOf(f, 4) && isDivisorOf(f, 6)),
  e('Sair número que divide 6 e é maior que 1.', f => isDivisorOf(f, 6) && f > 1),
  e('Sair número primo.', f => isPrime(f)),
  e('Sair número primo menor que 5.', f => isPrime(f) && f < 5),
  e('Sair número primo maior que 2.', f => isPrime(f) && f > 2),
  e('Sair número que não é primo.', f => !isPrime(f)),
  e('Sair número primo ou igual a 1.', f => isPrime(f) || f === 1),
  e('Sair número primo e ímpar.', f => isPrime(f) && !isMultOf(f, 2)),
  e('Sair número composto.', f => isComposite(f)),
  e('Sair número composto maior que 3.', f => isComposite(f) && f > 3),
  e('Sair número composto par.', f => isComposite(f) && isMultOf(f, 2)),
  e('Sair número que não é composto.', f => !isComposite(f)),
  e('Sair número composto ou igual a 1.', f => isComposite(f) || f === 1),
  e('Sair número que é múltiplo de 2 e divisor de 6.', f => isMultOf(f, 2) && isDivisorOf(f, 6)),
  e('Sair número que é múltiplo de 3 e divisor de 6.', f => isMultOf(f, 3) && isDivisorOf(f, 6)),
  e('Sair número primo e menor que 4.', f => isPrime(f) && f < 4),
  e('Sair número composto e menor que 6.', f => isComposite(f) && f < 6),
  e('Sair número que não é primo nem composto.', f => !isPrime(f) && !isComposite(f)),
  e('Sair número que é divisor de 6 e primo.', f => isDivisorOf(f, 6) && isPrime(f)),
  e('Sair número que é divisor de 6 e composto.', f => isDivisorOf(f, 6) && isComposite(f)),
  e('Sair número múltiplo de 2 e não primo.', f => isMultOf(f, 2) && !isPrime(f)),
  e('Sair número múltiplo de 3 e primo.', f => isMultOf(f, 3) && isPrime(f)),
  e('Sair número que possui exatamente dois divisores.', f => divisorCount(f) === 2),
  e('Sair número que possui mais de dois divisores.', f => divisorCount(f) > 2),
  e('Sair número cujo único divisor além de 1 e dele mesmo não existe.', f => isPrime(f)),
  e('Sair número que pode ser decomposto em fatores primos.', f => f > 1),
  e('Sair número que não pode ser decomposto em fatores primos distintos.', f => f === 1 || isPowerOf2(f)),
  e('Sair número que é produto de dois números naturais menores que ele.', f => isComposite(f)),
  e('Sair número que não pode ser escrito como produto de dois naturais maiores que 1.', f => isPrime(f) || f === 1),
  e('Sair número divisor de 15.', f => isDivisorOf(f, 15)),
  e('Sair número divisor de 12.', f => isDivisorOf(f, 12)),
  e('Sair número divisor de 21.', f => isDivisorOf(f, 21)),
  e('Sair número divisor de 30.', f => isDivisorOf(f, 30)),
  e('Sair número que deixa resto 2 na divisão por 3.', f => f % 3 === 2),
  e('Sair número que deixa resto 1 na divisão por 2.', f => f % 2 === 1),
];

const A2: E[] = [
  e('Sair número que é quadrado perfeito.', f => isPerfectSquare(f)),
  e('Sair número com quantidade par de divisores.', f => divisorCount(f) % 2 === 0),
  e('Sair número com quantidade ímpar de divisores.', f => divisorCount(f) % 2 === 1),
  e('Sair número igual à quantidade de seus próprios divisores.', f => f === divisorCount(f)),
  e('Sair número que é potência de 2.', f => isPowerOf2(f)),
  e('Sair número que pode ser escrito como soma de dois números primos.', f => isSumOfTwoPrimes(f)),
  e('Sair número que não tem nenhum divisor em comum com 6, exceto o 1.', f => gcd(f, 6) === 1),
  e('Sair número que não tem nenhum divisor em comum com 4, exceto o 1.', f => gcd(f, 4) === 1),
  e('Sair número que é divisor de 4.', f => isDivisorOf(f, 4)),
  e('Sair número que é divisor de 6.', f => isDivisorOf(f, 6)),
  e('Sair número cujo quadrado também é uma face do dado.', f => f * f >= 1 && f * f <= 6),
  e('Sair número que é raiz quadrada exata de outra face do dado.', f => [1, 2].includes(f)),
];

const A3: E[] = [
  e('Sair número primo ou par.', f => isPrime(f) || isMultOf(f, 2)),
  e('Sair número ímpar ou divisor de 6.', f => !isMultOf(f, 2) || isDivisorOf(f, 6)),
  e('Sair número par ou menor que 4.', f => isMultOf(f, 2) || f < 4),
  e('Sair número primo ou divisor de 4.', f => isPrime(f) || isDivisorOf(f, 4)),
  e('Sair número quadrado perfeito ou número ímpar.', f => isPerfectSquare(f) || !isMultOf(f, 2)),
  e('Sair número par ou divisor de 3.', f => isMultOf(f, 2) || isDivisorOf(f, 3)),
  e('Sair número composto ou igual a 1.', f => isComposite(f) || f === 1),
  e('Sair número primo ou múltiplo de 3.', f => isPrime(f) || isMultOf(f, 3)),
  e('Sair número ímpar ou múltiplo de 2.', f => !isMultOf(f, 2) || isMultOf(f, 2)),
  e('Sair número quadrado perfeito ou primo.', f => isPerfectSquare(f) || isPrime(f)),
  e('Sair número que pode ser escrito como soma de dois primos ou é divisor de 6.', f => isSumOfTwoPrimes(f) || isDivisorOf(f, 6)),
  e('Sair número múltiplo de 2 ou múltiplo de 3.', f => isMultOf(f, 2) || isMultOf(f, 3)),
  e('Sair número primo ou maior que 4.', f => isPrime(f) || f > 4),
  e('Sair número menor que 3 ou maior que 5.', f => f < 3 || f > 5),
  e('Sair número divisor de 6 ou divisor de 4.', f => isDivisorOf(f, 6) || isDivisorOf(f, 4)),
  e('Sair número ímpar ou múltiplo de 3.', f => !isMultOf(f, 2) || isMultOf(f, 3)),
  e('Sair número composto ou menor que 4.', f => isComposite(f) || f < 4),
  e('Sair número primo ou divisor de 15.', f => isPrime(f) || isDivisorOf(f, 15)),
  e('Sair número que deixa resto 1 na divisão por 2 ou resto 0 na divisão por 3.', f => f % 2 === 1 || f % 3 === 0),
  e('Sair número maior que 2 ou múltiplo de 2.', f => f > 2 || isMultOf(f, 2)),
  e('Sair número divisor de 12 ou número primo.', f => isDivisorOf(f, 12) || isPrime(f)),
  e('Sair número múltiplo de 3 ou número menor que 5.', f => isMultOf(f, 3) || f < 5),
  e('Sair número divisor de 12 ou divisor de 18.', f => isDivisorOf(f, 12) || isDivisorOf(f, 18)),
  e('Sair número par ou divisor de 6.', f => isMultOf(f, 2) || isDivisorOf(f, 6)),
  e('Sair número primo ou divisor de 20.', f => isPrime(f) || isDivisorOf(f, 20)),
  e('Sair número divisor de 90 ou divisor de 80.', f => isDivisorOf(f, 90) || isDivisorOf(f, 80)),
];

const A4: E[] = [
  e('Sair número par e ímpar.', f => isMultOf(f, 2) && !isMultOf(f, 2)),
  e('Sair número primo e composto.', f => isPrime(f) && isComposite(f)),
  e('Sair número menor que 3 e maior que 5.', f => f < 3 && f > 5),
  e('Sair número múltiplo de 2 e ímpar.', f => isMultOf(f, 2) && !isMultOf(f, 2)),
  e('Sair número divisor de 5 e par.', f => isDivisorOf(f, 5) && isMultOf(f, 2)),
  e('Sair número primo e par.', f => isPrime(f) && isMultOf(f, 2)),
  e('Sair número múltiplo de 3 e menor que 4.', f => isMultOf(f, 3) && f < 4),
  e('Sair número divisor de 6 e maior que 5.', f => isDivisorOf(f, 6) && f > 5),
  e('Sair número quadrado perfeito e par.', f => isPerfectSquare(f) && isMultOf(f, 2)),
  e('Sair número primo e maior que 3.', f => isPrime(f) && f > 3),
  e('Sair número par e maior que 2.', f => isMultOf(f, 2) && f > 2),
  e('Sair número par e menor que 5.', f => isMultOf(f, 2) && f < 5),
  e('Sair número ímpar e maior que 2.', f => !isMultOf(f, 2) && f > 2),
  e('Sair número primo e menor que 4.', f => isPrime(f) && f < 4),
  e('Sair número divisor de 6 e par.', f => isDivisorOf(f, 6) && isMultOf(f, 2)),
  e('Sair número composto e divisor de 12.', f => isComposite(f) && isDivisorOf(f, 12)),
  e('Sair número maior que 1 e menor que 5.', f => f > 1 && f < 5),
  e('Sair número divisor de 6 e menor que 5.', f => isDivisorOf(f, 6) && f < 5),
  e('Sair número maior que 2 e menor que 6.', f => f > 2 && f < 6),
  e('Sair número primo e divisor de 60.', f => isPrime(f) && isDivisorOf(f, 60)),
  e('Sair número maior que 1 e menor que 6.', f => f > 1 && f < 6),
  e('Sair número menor que 6 e diferente de 1.', f => f < 6 && f !== 1),
  e('Sair número maior que 2 e menor que 7.', f => f > 2 && f < 7),
  e('Sair número diferente de 6 e maior que 1.', f => f !== 6 && f > 1),
  e('Sair número divisor de 30 e divisor de 24.', f => isDivisorOf(f, 30) && isDivisorOf(f, 24)),
  e('Sair número maior que 1 e menor que 7.', f => f > 1 && f < 7),
  e('Sair número diferente de 1 e menor que 7.', f => f !== 1 && f < 7),
  e('Sair número maior que 0 e diferente de 1.', f => f > 0 && f !== 1),
  e('Sair número pelo menos 2 e no máximo 6.', f => f >= 2 && f <= 6),
  e('Sair número maior que 0 e menor que 7.', f => f > 0 && f < 7),
  e('Sair número natural entre 1 e 6.', f => f >= 1 && f <= 6),
  e('Sair número inteiro positivo menor que 7 e maior que 0.', f => f > 0 && f < 7),
  e('Sair número divisor de 60 e menor que 7.', f => isDivisorOf(f, 60) && f < 7),
  e('Sair número menor que 7 e maior ou igual a 1.', f => f < 7 && f >= 1),
  e('Sair número divisor de 60 e diferente de 1.', f => isDivisorOf(f, 60) && f !== 1),
  e('Sair número que divide 720 e é maior que 1.', f => isDivisorOf(f, 720) && f > 1),
  e('Sair número divisor de 120 e não é igual a 1.', f => isDivisorOf(f, 120) && f !== 1),
  e('Sair número divisor de 60 e maior que 1.', f => isDivisorOf(f, 60) && f > 1),
  e('Sair número primo e ímpar.', f => isPrime(f) && !isMultOf(f, 2)),
  e('Sair número múltiplo de 3 e divisor de 6.', f => isMultOf(f, 3) && isDivisorOf(f, 6)),
  e('Sair número ímpar e menor que 6.', f => !isMultOf(f, 2) && f < 6),
  e('Sair número divisor de 6 e maior que 1.', f => isDivisorOf(f, 6) && f > 1),
  e('Sair número par e divisor de 12.', f => isMultOf(f, 2) && isDivisorOf(f, 12)),
  e('Sair número primo e divisor de 30.', f => isPrime(f) && isDivisorOf(f, 30)),
  e('Sair número composto ou igual a 1 e divisor de 12.', f => (isComposite(f) || f === 1) && isDivisorOf(f, 12)),
  e('Sair número primo ou igual a 1 e menor que 6.', f => (isPrime(f) || f === 1) && f < 6),
  e('Sair número divisor de 12 e não múltiplo de 4.', f => isDivisorOf(f, 12) && !isMultOf(f, 4)),
  e('Sair número menor que 5 e divisor de 12.', f => f < 5 && isDivisorOf(f, 12)),
  e('Sair número não múltiplo de 3 e menor que 6.', f => !isMultOf(f, 3) && f < 6),
  e('Sair número divisor de 12 e maior que 1.', f => isDivisorOf(f, 12) && f > 1),
  e('Sair número menor que 6 e divisor de 60.', f => f < 6 && isDivisorOf(f, 60)),
  e('Sair número maior que 1 e divisor de 60.', f => f > 1 && isDivisorOf(f, 60)),
  e('Sair número divisor de 12 e divisor de 60.', f => isDivisorOf(f, 12) && isDivisorOf(f, 60)),
  e('Sair número divisor de 30 e divisor de 60.', f => isDivisorOf(f, 30) && isDivisorOf(f, 60)),
  e('Sair número não múltiplo de 6 e divisor de 60.', f => !isMultOf(f, 6) && isDivisorOf(f, 60)),
];

const EVENT_CATEGORIES: E[][] = [A1, A2, A3, A4];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════ Tipos de fase ═══════
type MainPhase = 'intro' | 'experimentA' | 'experimentB' | 'exercises' | 'finished';
type ExpSubPhase = 'bet' | 'rolling' | 'compare' | 'markResult';
type ExSubPhase = 'mark' | 'calc';

// ═══════ Componente Principal ═══════
interface TwoDicesPracticeProps {
  diceRef: React.RefObject<DiceSceneHandle | null>;
  onColorChange: (color: DiceColor) => void;
  onFinished: () => void;
}

export function TwoDicesPractice({ diceRef, onColorChange, onFinished }: Readonly<TwoDicesPracticeProps>) {
  // Cor inicial sorteada
  const [colors] = useState<[DiceColor, DiceColor]>(() => {
    const first: DiceColor = Math.random() > 0.5 ? 'green' : 'blue';
    const second: DiceColor = first === 'green' ? 'blue' : 'green';
    return [first, second];
  });

  // Eventos sorteados para os 4 exercícios
  const [events] = useState<SingleDieEvent[]>(() =>
    EVENT_CATEGORIES.map(cat => pickRandom(cat))
  );

  // Estado principal
  const [mainPhase, setMainPhase] = useState<MainPhase>('intro');
  const [expRound, setExpRound] = useState(0); // 0 ou 1 (2 rodadas de experimentação)
  const [expSubPhase, setExpSubPhase] = useState<ExpSubPhase>('bet');
  const [exerciseIdx, setExerciseIdx] = useState(0); // 0–3
  const [exSubPhase, setExSubPhase] = useState<ExSubPhase>('mark');

  // Aposta
  const [bet, setBet] = useState('');
  const [betError, setBetError] = useState(false);

  // Resultado do dado
  const [diceResult, setDiceResult] = useState(0);

  // Marcação do resultado na matriz (experimentação)
  const [resultCheck, setResultCheck] = useState<boolean[]>([false, false, false, false, false, false]);
  const [resultCheckError, setResultCheckError] = useState(false);

  // Marcação de evento (exercícios)
  const [eventChecks, setEventChecks] = useState<boolean[]>([false, false, false, false, false, false]);
  const [eventChecksDisabled, setEventChecksDisabled] = useState(false);
  const [eventChecksError, setEventChecksError] = useState(false);

  // Cálculo de probabilidade
  const [calcNum, setCalcNum] = useState('');
  const [calcDen, setCalcDen] = useState('');
  const [calcNumError, setCalcNumError] = useState(false);
  const [calcDenError, setCalcDenError] = useState(false);
  const [calcFeedback, setCalcFeedback] = useState('');

  // Rolling state
  const rolling = useRef(false);


  // Cor atual
  const currentColor = (): DiceColor => {
    if (mainPhase === 'experimentA') return colors[0];
    if (mainPhase === 'experimentB') return colors[1];
    // Exercícios: alternam a partir da cor oposta da última experimentação
    return exerciseIdx % 2 === 0 ? colors[0] : colors[1];
  };

  // Mudar cor do dado ao mudar fase
  useEffect(() => {
    if (mainPhase !== 'intro' && mainPhase !== 'finished') {
      const color = currentColor();
      diceRef.current?.setColor(color);
      diceRef.current?.setIdle(true);
      onColorChange(color);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainPhase, exerciseIdx]);

  // ── Aposta ──
  const submitBet = () => {
    const v = parseInt(bet);
    if (v >= 1 && v <= 6) {
      setBetError(false);
      launchDie();
    } else {
      setBetError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── CSPRNG — resultado do dado via crypto (sem bias de módulo) ──
  const secureRoll = (): number => {
    if (typeof window !== 'undefined' && window.crypto) {
      const LIMIT = 4294967292; // maior múltiplo de 6 < 2^32
      const buf = new Uint32Array(1);
      let v: number;
      do { window.crypto.getRandomValues(buf); v = buf[0]; }
      while (v >= LIMIT);
      return (v % 6) + 1;
    }
    return Math.floor(Math.random() * 6) + 1;
  };

  // ── Lançar dado (mesma mecânica da Cena 2 — sem copo) ──
  const launchDie = useCallback(async () => {
    if (rolling.current) return;
    rolling.current = true;
    setExpSubPhase('rolling');

    // Resultado via CSPRNG
    const result = secureRoll();
    setDiceResult(result);

    // Dado 3D cai na mesa (mesma animação da apresentação)
    diceRef.current?.setIdle(false);
    if (diceRef.current) {
      await diceRef.current.roll(result);
    }

    rolling.current = false;
    setExpSubPhase('compare');

    // Som conforme acerto/erro
    if (parseInt(bet) === result) {
      playSound('/sounds/correct.mp3');
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [bet, diceRef]);

  // ── Validar marcação do resultado ──
  const validateResultMark = () => {
    // Exatamente 1 checkbox marcado, e deve ser o resultado
    const marked = resultCheck.filter(Boolean).length;
    if (marked === 1 && resultCheck[diceResult - 1]) {
      setResultCheckError(false);
      playSound('/sounds/correct.mp3');
      // Próxima rodada ou exercícios
      if (mainPhase === 'experimentA') {
        setMainPhase('experimentB');
        setExpSubPhase('bet');
        setBet('');
        setResultCheck([false, false, false, false, false, false]);
        setDiceResult(0);
      } else {
        // Após 2ª experimentação → exercícios
        setMainPhase('exercises');
        setExSubPhase('mark');
        setEventChecks([false, false, false, false, false, false]);
        setEventChecksDisabled(false);
      }
    } else {
      setResultCheckError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Validar marcação do evento ──
  const validateEventMarks = () => {
    const event = events[exerciseIdx];
    let correct = true;
    for (let f = 1; f <= 6; f++) {
      if (event.validation(f) !== eventChecks[f - 1]) {
        correct = false;
        break;
      }
    }
    if (correct) {
      setEventChecksError(false);
      setEventChecksDisabled(true);
      playSound('/sounds/correct.mp3');
      setExSubPhase('calc');
    } else {
      setEventChecksError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Validar cálculo de P(A) ──
  const validateCalc = () => {
    const event = events[exerciseIdx];
    let favorable = 0;
    for (let f = 1; f <= 6; f++) {
      if (event.validation(f)) favorable++;
    }
    const num = parseInt(calcNum);
    const den = parseInt(calcDen);
    const numOk = num === favorable;
    const denOk = den === 6;

    setCalcNumError(false);
    setCalcDenError(false);
    setCalcFeedback('');

    if (numOk && denOk) {
      playSound('/sounds/correct.mp3');
      const next = exerciseIdx + 1;
      if (next >= 4) {
        playSound('/sounds/challengeFinished.mp3');
        setMainPhase('finished');
      } else {
        setExerciseIdx(next);
        setExSubPhase('mark');
        setEventChecks([false, false, false, false, false, false]);
        setEventChecksDisabled(false);
        setEventChecksError(false);
        setCalcNum('');
        setCalcDen('');
      }
    } else {
      playSound('/sounds/incorrect.mp3');
      if (!numOk && !denOk) {
        setCalcNumError(true);
        setCalcDenError(true);
        setCalcFeedback(`Verifique quantos casos são favoráveis ao evento "${event.description}" e quantos são possíveis no lançamento de um dado equilibrado.`);
      } else if (!denOk) {
        setCalcDenError(true);
        setCalcFeedback('Quantos resultados possíveis existem no lançamento de um dado equilibrado? Revise o denominador.');
      } else {
        setCalcNumError(true);
        setCalcFeedback(`Quantos resultados satisfazem "${event.description}"? Revise o numerador.`);
      }
    }
  };

  // ── Renderizar matriz conforme cor ──
  const renderMatrix = (checks: boolean[], disabled: boolean, onChange: (idx: number, val: boolean) => void, error: boolean) => {
    const color = currentColor();
    if (color === 'green') {
      // Vertical: 6 linhas × 2 colunas
      return (
        <div className="flex justify-center mb-micro">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="ds-caption-bold text-neutral-dark p-micro border border-neutral-lighter" style={{ width: 60 }}>Face</th>
                <th className="ds-caption-bold p-micro border border-neutral-lighter" style={{ width: 60, color: 'var(--color-feedback-success-dark)' }}>✓</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(f => (
                <tr key={f}>
                  <td className="border border-neutral-lighter p-micro text-center">
                    <DiceFaceIcon face={f} size={32} color={currentColor()} />
                  </td>
                  <td className="border border-neutral-lighter p-micro text-center"
                    style={{ background: f % 2 === 0 ? 'rgba(42, 107, 69, 0.08)' : undefined }}>
                    <input
                      type="checkbox" checked={checks[f - 1]} disabled={disabled}
                      onChange={e => onChange(f - 1, e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: 'var(--color-feedback-success-dark)' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // Horizontal: 2 linhas × 6 colunas
      return (
        <div className="flex justify-center mb-micro overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                {[1, 2, 3, 4, 5, 6].map(f => (
                  <th key={f} className="border border-neutral-lighter p-micro text-center" style={{ width: 50 }}>
                    <DiceFaceIcon face={f} size={32} color={currentColor()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[1, 2, 3, 4, 5, 6].map(f => (
                  <td key={f} className="border border-neutral-lighter p-micro text-center"
                    style={{ background: f % 2 === 0 ? 'rgba(36, 80, 190, 0.08)' : undefined }}>
                    <input
                      type="checkbox" checked={checks[f - 1]} disabled={disabled}
                      onChange={e => onChange(f - 1, e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: 'var(--color-brand-otimath-pure)' }}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  };

  const colorLabel = (c: DiceColor) => c === 'green' ? 'Verde' : 'Azul';
  const colorStyle = (c: DiceColor) => c === 'green' ? 'var(--color-feedback-success-dark)' : 'var(--color-brand-otimath-pure)';

  // ═══════ RENDER ═══════
  return (
    <div className="w-full max-w-[620px]">
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Praticando com um dado
      </h2>

      {/* ═══════ INTRO ═══════ */}
      {mainPhase === 'intro' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black mb-macro" style={{ textAlign: 'justify', fontSize: '1.05rem' }}>
            Agora que você conhece o dado equilibrado e seu espaço amostral, vamos
            praticar <strong>simulando lançamentos</strong>. Primeiro você vai apostar em um
            resultado, lançar o dado e marcar o que saiu. Depois, vai resolver
            exercícios identificando <strong>eventos</strong> e calculando <strong>probabilidades</strong>.
          </p>
          <div className="flex justify-center">
            <Button style="primary" size="small" onClick={() => { setMainPhase('experimentA'); setExpSubPhase('bet'); }}>
              Começar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FASE A e B — Experimentação ═══════ */}
      {(mainPhase === 'experimentA' || mainPhase === 'experimentB') && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          <p className="ds-body-bold text-center mb-micro" style={{ color: colorStyle(currentColor()) }}>
            Dado {colorLabel(currentColor())} — Rodada {mainPhase === 'experimentA' ? '1' : '2'} de 2
          </p>

          {/* Apostar */}
          {expSubPhase === 'bet' && (
            <div className="flex flex-col gap-y-micro items-center">
              <p className="ds-body-bold text-neutral-black text-center">
                Em qual face você <strong>aposta</strong> que o dado vai cair?
              </p>
              <div className="flex items-center gap-x-micro">
                <span className="ds-body-bold text-neutral-black">Minha aposta:</span>
                <input
                  type="number" min="1" max="6" value={bet}
                  onChange={e => { setBet(e.target.value); setBetError(false); }}
                  placeholder="?"
                  className="ds-body-bold"
                  style={{
                    border: `2px solid ${betError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8, padding: '6px 10px', width: 64, textAlign: 'center', outline: 'none',
                  }}
                />
                <Button style="primary" size="extra-small" onClick={submitBet}>
                  🎲 Lançar dado
                </Button>
              </div>
              {betError && (
                <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Digite um número de 1 a 6.
                </p>
              )}
            </div>
          )}

          {/* Lançando */}
          {expSubPhase === 'rolling' && (
            <p className="ds-body-bold text-neutral-dark text-center">Lançando o dado...</p>
          )}

          {/* Comparação */}
          {expSubPhase === 'compare' && (
            <div className="flex flex-col gap-y-micro items-center">
              <div className="flex gap-x-xs items-center flex-wrap justify-center">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold text-neutral-dark">Sua aposta</span>
                  <DiceFaceIcon face={parseInt(bet)} size={48} color={currentColor()} />
                  <span className="ds-body-bold text-neutral-black">{bet}</span>
                </div>
                <span className="ds-heading-large text-neutral-dark">×</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold text-neutral-dark">Resultado</span>
                  <DiceFaceIcon face={diceResult} size={48} color={currentColor()} />
                  <span className="ds-body-bold text-neutral-black">{diceResult}</span>
                </div>
              </div>
              <p className="ds-body-bold text-center" style={{
                color: parseInt(bet) === diceResult ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
                fontSize: '1.1rem',
              }}>
                {parseInt(bet) === diceResult ? '✅ Acertou!' : '❌ Não acertou!'}
              </p>
              <Button style="primary" size="extra-small" onClick={() => setExpSubPhase('markResult')}>
                Marcar resultado na tabela
              </Button>
            </div>
          )}

          {/* Marcar resultado na matriz */}
          {expSubPhase === 'markResult' && (
            <div className="flex flex-col gap-y-micro">
              <p className="ds-body-bold text-neutral-black text-center">
                Marque na tabela o resultado <strong>{diceResult}</strong> do lançamento:
              </p>
              {renderMatrix(
                resultCheck, false,
                (idx, val) => {
                  const next = [...resultCheck];
                  next[idx] = val;
                  setResultCheck(next);
                  setResultCheckError(false);
                },
                resultCheckError
              )}
              <div className="flex flex-col items-center gap-y-micro">
                <Button style="primary" size="extra-small" onClick={validateResultMark}>Conferir</Button>
                {resultCheckError && (
                  <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    Marque apenas a face que corresponde ao resultado {diceResult}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ FASE C — Exercícios de eventos ═══════ */}
      {mainPhase === 'exercises' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Indicador de progresso */}
          <div className="flex justify-center gap-x-micro mb-macro">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-y-nano">
                <div className="rounded-full" style={{
                  width: 14, height: 14,
                  background: i < exerciseIdx ? 'var(--color-feedback-success-dark)'
                    : i === exerciseIdx ? 'var(--color-brand-otimath-pure)'
                    : 'var(--color-neutral-lighter)',
                  transition: 'background 0.3s',
                }} />
                <span className="ds-caption text-neutral-dark">{i + 1}</span>
              </div>
            ))}
          </div>

          <p className="ds-body-bold text-center mb-micro" style={{ color: colorStyle(currentColor()) }}>
            Dado {colorLabel(currentColor())} — Exercício {exerciseIdx + 1} de 4
          </p>

          {/* Quadro do evento */}
          <div className="border-b border-neutral-lighter pb-micro mb-micro">
            <p className="ds-heading-large text-brand-otimath-pure text-center mb-nano">Evento A</p>
            <p className="ds-body-bold text-neutral-black text-center">
              {events[exerciseIdx].description}
            </p>
          </div>

          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Lança-se um dado honesto (equilibrado) aleatoriamente. Marque os <strong>casos favoráveis</strong> ao evento A na tabela abaixo:
          </p>

          {/* Matriz */}
          {renderMatrix(
            eventChecks, eventChecksDisabled,
            (idx, val) => {
              const next = [...eventChecks];
              next[idx] = val;
              setEventChecks(next);
              setEventChecksError(false);
            },
            eventChecksError
          )}

          {/* Botão conferir marcação */}
          {exSubPhase === 'mark' && (
            <div className="flex flex-col items-center gap-y-micro">
              <Button style="primary" size="extra-small" onClick={validateEventMarks}>Conferir</Button>
              {eventChecksError && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Verifique quais resultados satisfazem o evento &quot;{events[exerciseIdx].description}&quot;.
                </p>
              )}
            </div>
          )}

          {/* Cálculo de P(A) */}
          {exSubPhase === 'calc' && (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro">
              <p className="ds-heading-large text-brand-otimath-pure text-center mb-nano">Cálculo</p>
              <p className="ds-body-bold text-neutral-black text-center">
                Calcule a probabilidade do evento A:
              </p>
              <div className="flex items-center justify-center gap-x-micro flex-wrap">
                <span className="ds-body-bold text-neutral-black">P(A) =</span>
                <div className="inline-flex flex-col items-center mx-nano">
                  <input
                    type="text" value={calcNum}
                    onChange={e => { setCalcNum(e.target.value); setCalcNumError(false); setCalcFeedback(''); }}
                    placeholder="?" className="ds-body"
                    style={{
                      border: `2px solid ${calcNumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                    }}
                  />
                  <hr style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '2px 0' }} />
                  <input
                    type="text" value={calcDen}
                    onChange={e => { setCalcDen(e.target.value); setCalcDenError(false); setCalcFeedback(''); }}
                    placeholder="?" className="ds-body"
                    style={{
                      border: `2px solid ${calcDenError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                    }}
                  />
                </div>
                <Button style="primary" size="extra-small" onClick={validateCalc}>Conferir</Button>
              </div>
              {calcFeedback && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  {calcFeedback}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ FINALIZAÇÃO ═══════ */}
      {mainPhase === 'finished' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
            Parabéns! Você praticou identificar eventos e calcular probabilidades com um dado.
            Agora que domina o dado <strong style={{ color: 'var(--color-feedback-success-dark)' }}>verde</strong> (linhas)
            e o dado <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>azul</strong> (colunas), vamos
            combinar <strong>dois dados</strong> numa tabela onde cada célula
            representa um par ordenado de resultados.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={onFinished}>
              Iniciar Simulação com Dois Dados
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
