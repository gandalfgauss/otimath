'use client'

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { DiceSceneHandle, DiceColor } from './DiceScene';
import type { AlertType } from '@/components/global/Alert';

// Handle exposto ao pai (TwoDicesPresentation) para o painel DEV poder
// avançar a Cena 5 simulando a interação natural do aluno em cada fase.
export interface TwoDicesPracticeHandle {
  /** Identificador da cena interna atual — usado pelo pai para construir o
   *  cenaId do snapshot DEV. Inclui mainPhase + sub-phase relevante +
   *  exerciseIdx quando estamos em 'exercises'. */
  getCurrentPhaseId: () => string;
  /** Simula a próxima ação correta do aluno na fase atual. Em fases que
   *  envolvem rolagem 3D (rolling/landed), pula direto para a próxima
   *  fase sem esperar a animação. */
  advance: () => void;
  /** Restaura main/sub-phases a partir de um snapshot DEV. Aceita o formato
   *  produzido por getCurrentPhaseId (campos separados por '|'). */
  setCurrentPhaseId: (phaseId: string) => void;
}

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
    <div
      role="img"
      aria-label={`Face ${face} do dado ${color === 'green' ? 'verde' : 'azul'}`}
      style={{
        width: size, height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
      }}
    >
      {(pips ?? []).map((pip, i) => (
        <div key={i} className="flex items-center justify-center">
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
  e('Sair número cujo quadrado também é uma face do dado.', f => f * f >= 1 && f * f <= 6),
  e('Sair número que é raiz quadrada exata de outra face do dado.', f => [1, 2].includes(f)),
  // Eventos dinâmicos: "pelo menos X"
  ...([2, 3, 4, 5, 6] as const).map(x => e(`Sair número pelo menos ${x}.`, f => f >= x)),
  ...([1, 2, 3, 4, 5] as const).map(x => e(`Sair número no máximo ${x}.`, f => f <= x)),
];

const A3: E[] = [
  e('Sair número primo ou par.', f => isPrime(f) || isMultOf(f, 2)),
  e('Sair número ímpar ou divisor de 6.', f => !isMultOf(f, 2) || isDivisorOf(f, 6)),
  e('Sair número par ou menor que 4.', f => isMultOf(f, 2) || f < 4),
  e('Sair número primo ou divisor de 4.', f => isPrime(f) || isDivisorOf(f, 4)),
  e('Sair número quadrado perfeito ou número ímpar.', f => isPerfectSquare(f) || !isMultOf(f, 2)),
  e('Sair número par ou divisor de 3.', f => isMultOf(f, 2) || isDivisorOf(f, 3)),
  e('Sair número primo ou múltiplo de 3.', f => isPrime(f) || isMultOf(f, 3)),
  e('Sair número ímpar ou múltiplo de 2.', f => !isMultOf(f, 2) || isMultOf(f, 2)),
  e('Sair número quadrado perfeito ou primo.', f => isPerfectSquare(f) || isPrime(f)),
  e('Sair número que pode ser escrito como soma de dois primos ou é divisor de 6.', f => isSumOfTwoPrimes(f) || isDivisorOf(f, 6)),
  e('Sair número primo ou maior que 4.', f => isPrime(f) || f > 4),
  e('Sair número menor que 3 ou maior que 5.', f => f < 3 || f > 5),
  e('Sair número divisor de 6 ou divisor de 4.', f => isDivisorOf(f, 6) || isDivisorOf(f, 4)),
  e('Sair número ímpar ou múltiplo de 3.', f => !isMultOf(f, 2) || isMultOf(f, 3)),
  e('Sair número composto ou menor que 4.', f => isComposite(f) || f < 4),
  e('Sair número primo ou divisor de 15.', f => isPrime(f) || isDivisorOf(f, 15)),
  e('Sair número que deixa resto 1 na divisão por 2 ou resto 0 na divisão por 3.', f => f % 2 === 1 || f % 3 === 0),
  e('Sair um número maior que 3 ou que não seja primo.', f => f > 3 || !isPrime(f)),
  e('Sair número divisor de 12 ou número primo.', f => isDivisorOf(f, 12) || isPrime(f)),
  e('Sair número múltiplo de 3 ou número menor que 5.', f => isMultOf(f, 3) || f < 5),
  e('Sair número divisor de 12 ou divisor de 18.', f => isDivisorOf(f, 12) || isDivisorOf(f, 18)),
  e('Sair número par ou divisor de 6.', f => isMultOf(f, 2) || isDivisorOf(f, 6)),
  e('Sair número primo ou divisor de 20.', f => isPrime(f) || isDivisorOf(f, 20)),
  e('Sair número divisor de 90 ou divisor de 80.', f => isDivisorOf(f, 90) || isDivisorOf(f, 80)),
  // Eventos dinâmicos: "pelo menos x ou no máximo y" (x > y+1)
  ...(() => {
    const result: E[] = [];
    for (let x = 3; x <= 6; x++) {
      for (let y = 1; y <= x - 2; y++) {
        let fav = 0;
        for (let f = 1; f <= 6; f++) if (f >= x || f <= y) fav++;
        if (fav >= 1 && fav <= 5) {
          result.push(e(`Sair número pelo menos ${x} ou no máximo ${y}.`, f => f >= x || f <= y));
        }
      }
    }
    return result;
  })(),
  // Eventos dinâmicos: "estritamente menor que x ou exatamente igual a y" (y >= x)
  ...(() => {
    const result: E[] = [];
    for (let x = 2; x <= 5; x++) {
      for (let y = x; y <= 6; y++) {
        let fav = 0;
        for (let f = 1; f <= 6; f++) if (f < x || f === y) fav++;
        if (fav >= 1 && fav <= 5) {
          result.push(e(`Sair número estritamente menor que ${x} ou exatamente igual a ${y}.`, f => f < x || f === y));
        }
      }
    }
    return result;
  })(),
  // Eventos dinâmicos: "fator de x ou estritamente maior que y"
  ...(() => {
    const result: E[] = [];
    const seen = new Set<string>();
    const xs = [2, 3, 4, 5, 6];
    for (const x of xs) {
      for (let y = 2; y <= 6; y++) {
        const faces: number[] = [];
        for (let f = 1; f <= 6; f++) if (x % f === 0 || f > y) faces.push(f);
        const key = faces.join(',');
        if (faces.length >= 1 && faces.length <= 5 && !seen.has(key)) {
          seen.add(key);
          result.push(e(`Sair número que seja fator de ${x} ou estritamente maior que ${y}.`, f => x % f === 0 || f > y));
        }
      }
    }
    return result;
  })(),
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
  // Eventos dinâmicos: "entre x e y, inclusive" (x < y, não consecutivos)
  ...([[1,3],[1,4],[1,5],[2,4],[2,5],[2,6],[3,5],[3,6],[4,6]] as const).map(
    ([x, y]) => e(`Sair número entre ${x} e ${y}, inclusive.`, f => f >= x && f <= y)
  ),
  // Eventos dinâmicos: "fator de X e pelo menos Y"
  ...(() => {
    const xs = [6, 10, 12, 15, 18, 20, 24, 30];
    const result: E[] = [];
    for (const x of xs) {
      for (let y = 2; y <= 6; y++) {
        // Contar favoráveis: faces do dado que são divisor de x E >= y
        let fav = 0;
        for (let f = 1; f <= 6; f++) if (x % f === 0 && f >= y) fav++;
        // Manter apenas combinações não triviais (1 a 5 favoráveis)
        if (fav >= 1 && fav <= 5) {
          result.push(e(`Sair número que seja fator de ${x} e pelo menos ${y}.`, f => x % f === 0 && f >= y));
        }
      }
    }
    // Casos adicionais com 4 e 5 favoráveis
    // fator de 60 e pelo menos 2 → {2,3,4,5,6} → 5 favoráveis
    result.push(e('Sair número que seja fator de 60 e pelo menos 2.', f => 60 % f === 0 && f >= 2));
    // fator de 12 e pelo menos 2 → {2,3,4,6} → 4 favoráveis
    result.push(e('Sair número que seja fator de 12 e pelo menos 2.', f => 12 % f === 0 && f >= 2));
    return result;
  })(),
];

const EVENT_CATEGORIES: E[][] = [A1, A2, A3, A4];

// ── xoshiro128** (Blackman & Vigna, 2021) — PRNG para sorteios ──
class RNG {
  private s: Uint32Array;
  constructor() {
    this.s = new Uint32Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(this.s);
    } else {
      const t = Date.now();
      this.s[0] = t >>> 0; this.s[1] = (t ^ 0xdeadbeef) >>> 0;
      this.s[2] = (t ^ 0xcafebabe) >>> 0; this.s[3] = (t ^ 0x12345678) >>> 0;
    }
    if (this.s[0] === 0 && this.s[1] === 0 && this.s[2] === 0 && this.s[3] === 0) this.s[0] = 1;
  }
  private _rotl(x: number, k: number) { return ((x << k) | (x >>> (32 - k))) >>> 0; }
  private _next() {
    const s = this.s;
    const result = (this._rotl(Math.imul(s[1], 5) >>> 0, 7) * 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0; s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0; s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0; s[3] = this._rotl(s[3], 11);
    return result;
  }
  f() { return this._next() / 4294967296; }
  /** Inteiro em [a, b] inclusive */
  i(a: number, b: number) { return a + Math.floor(this.f() * (b - a + 1)); }
  /** Dado [1,6] */
  die() { return this.i(1, 6); }
  /** Cor aleatória */
  color(): DiceColor { return (this._next() & 1) ? 'green' : 'blue'; }
  /** Escolhe elemento aleatório */
  pick<T>(arr: T[]): T { return arr[this.i(0, arr.length - 1)]; }
}
const rng = new RNG();

// ═══════ Tipos de fase ═══════
type MainPhase = 'intro' | 'experimentA' | 'experimentB' | 'exercises' | 'finished';
type ExpSubPhase = 'bet' | 'rolling' | 'landed' | 'compare' | 'markResult';
type ExSubPhase = 'mark' | 'bet' | 'rolling' | 'landed' | 'readDice' | 'result' | 'calc' | 'next';

// ═══════ Componente Principal ═══════
interface TwoDicesPracticeProps {
  diceRef: React.RefObject<DiceSceneHandle | null>;
  diceContainerRef: React.RefObject<HTMLDivElement | null>;
  onFinished: () => void;
  /** Notifica o pai quando a fase interna muda — usado pelo painel DEV
   *  para construir um cenaId que reflete a sub-cena ativa da Cena 5. */
  onPhaseChange?: (phaseId: string) => void;
  /** Cria um toast alert via o sistema de alerts do pai (TwoDicesPresentation).
   *  Usado pelas validações para feedback consistente com o resto do OVA. */
  createAlert?: (title: string, description: string, type: AlertType, timeout?: number) => void;
}

export const TwoDicesPractice = forwardRef<TwoDicesPracticeHandle, TwoDicesPracticeProps>(
  function TwoDicesPractice({ diceRef, diceContainerRef, onFinished, onPhaseChange, createAlert }, ref) {
  // Cor inicial sorteada via xoshiro128** — segundo é sempre o oposto
  const [colors] = useState<[DiceColor, DiceColor]>(() => {
    const first: DiceColor = rng.color();
    const second: DiceColor = first === 'green' ? 'blue' : 'green';
    return [first, second];
  });

  // Eventos sorteados para os 4 exercícios
  // Garante que pelo menos 1 evento tenha exatamente 3 favoráveis (indiferente válido)
  const [events] = useState<SingleDieEvent[]>(() => {
    const countFavorable = (ev: SingleDieEvent) => {
      let c = 0; for (let f = 1; f <= 6; f++) if (ev.validation(f)) c++; return c;
    };
    // Sortear eventos garantindo que nenhuma descrição se repita
    const picked: SingleDieEvent[] = [];
    const usedDescriptions = new Set<string>();
    for (const cat of EVENT_CATEGORIES) {
      let ev: SingleDieEvent;
      let attempts = 0;
      do {
        ev = rng.pick(cat);
        attempts++;
      } while (usedDescriptions.has(ev.description) && attempts < 50);
      picked.push(ev);
      usedDescriptions.add(ev.description);
    }
    const hasThree = picked.some(ev => countFavorable(ev) === 3);
    if (!hasThree) {
      // Encontrar uma categoria que tenha evento com 3 favoráveis e substituir
      const catIdx = rng.i(0, 3); // posição aleatória para substituir
      const candidates = EVENT_CATEGORIES[catIdx].filter(ev => countFavorable(ev) === 3);
      if (candidates.length > 0) {
        picked[catIdx] = rng.pick(candidates);
      } else {
        // Tentar em todas as categorias
        for (let i = 0; i < 4; i++) {
          const cands = EVENT_CATEGORIES[i].filter(ev => countFavorable(ev) === 3);
          if (cands.length > 0) {
            picked[i] = rng.pick(cands);
            break;
          }
        }
      }
    }
    return picked;
  });

  // Estado principal
  const [mainPhase, setMainPhase] = useState<MainPhase>('intro');
  const [expSubPhase, setExpSubPhase] = useState<ExpSubPhase>('bet');
  const [exerciseIdx, setExerciseIdx] = useState(0); // 0–3
  const [exSubPhase, setExSubPhase] = useState<ExSubPhase>('mark');

  // Aposta
  const [bet, setBet] = useState('');

  // Resultado do dado
  const [diceResult, setDiceResult] = useState(0);

  // Marcação do resultado na matriz (experimentação)
  const [resultCheck, setResultCheck] = useState<boolean[]>([false, false, false, false, false, false]);
  const [resultCheckError, setResultCheckError] = useState(false);

  // Marcação de evento (exercícios)
  const [eventChecks, setEventChecks] = useState<boolean[]>([false, false, false, false, false, false]);
  const [eventChecksDisabled, setEventChecksDisabled] = useState(false);
  const [eventChecksError, setEventChecksError] = useState(false);

  // Aposta no evento (exercícios): favor / contra / indiferente
  type ExBetType = 'favor' | 'contra' | 'indiferente' | null;
  const [exBet, setExBet] = useState<ExBetType>(null);
  // Resultado do dado no exercício
  const [exDiceResult, setExDiceResult] = useState(0);

  // Cálculo de probabilidade P(A)
  const [calcNum, setCalcNum] = useState('');
  const [calcDen, setCalcDen] = useState('');
  const [calcNumError, setCalcNumError] = useState(false);
  const [calcDenError, setCalcDenError] = useState(false);
  const [calcFeedback, setCalcFeedback] = useState('');

  // Cálculo do complementar P(Ā) — só quando "indiferente" errado
  const [calcCompNum, setCalcCompNum] = useState('');
  const [calcCompDen, setCalcCompDen] = useState('');
  const [calcCompNumError, setCalcCompNumError] = useState(false);
  const [calcCompDenError, setCalcCompDenError] = useState(false);
  const [calcCompFeedback, setCalcCompFeedback] = useState('');
  const [bothCalcCorrect, setBothCalcCorrect] = useState(false);
  // Leitura do dado pelo estudante (experimentação + exercícios)
  const [readDiceAnswer, setReadDiceAnswer] = useState('');
  const [readDiceError, setReadDiceError] = useState(false);

  // Comparação P(A) vs P(Ā)
  const [compOperator, setCompOperator] = useState('');
  const [compOperatorError, setCompOperatorError] = useState(false);
  const [compValidated, setCompValidated] = useState(false);

  // ── Caso degenerado: evento certo (P(A) = 1, A = S, favorable === 6) ──
  // Pergunta de nomeação canônica: o aluno precisa identificar que esse caso
  // limite é chamado "evento certo" antes de avançar para o próximo exercício.
  const [certainNameAnswer, setCertainNameAnswer] = useState('');
  const [certainNameValidated, setCertainNameValidated] = useState(false);
  const [certainNameError, setCertainNameError] = useState(false);

  // ── Caso degenerado simétrico: evento impossível (P(A) = 0, A = ∅, favorable === 0) ──
  // Pergunta de nomeação canônica: o aluno precisa identificar que esse caso
  // limite é chamado "evento impossível" antes de avançar para o próximo exercício.
  const [impossibleNameAnswer, setImpossibleNameAnswer] = useState('');
  const [impossibleNameValidated, setImpossibleNameValidated] = useState(false);
  const [impossibleNameError, setImpossibleNameError] = useState(false);

  // Rolling state
  const rolling = useRef(false);
  // Ref do card de exercício (para scroll de volta)
  const exerciseCardRef = useRef<HTMLDivElement>(null);


  // Cor atual
  const currentColor = (): DiceColor => {
    if (mainPhase === 'experimentA') return colors[0];
    if (mainPhase === 'experimentB') return colors[1];
    // Exercícios: alternam a partir da cor oposta da última experimentação
    return exerciseIdx % 2 === 0 ? colors[0] : colors[1];
  };

  // Mudar cor do dado e modo ao mudar fase/exercício
  const lastColorRef = useRef<DiceColor | null>(null);
  useEffect(() => {
    if (mainPhase !== 'intro' && mainPhase !== 'finished') {
      const color = currentColor();
      // Só recriar dado se cor realmente mudou
      if (color !== lastColorRef.current) {
        diceRef.current?.setColor(color);
        lastColorRef.current = color;
      }
      // Experimentação: modo betting (girar com dedo/mouse)
      if (mainPhase === 'experimentA' || mainPhase === 'experimentB') {
        diceRef.current?.highlightFace(null);
        diceRef.current?.setBetting(true, (face: number) => {
          setBet(String(face));
          diceRef.current?.highlightFace(face);
          playSound('/sounds/correct.mp3');
        });
      } else {
        diceRef.current?.setBetting(false);
        diceRef.current?.setIdle(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainPhase, exerciseIdx]);

  // ── Confirmar aposta e lançar ──
  // Defensivo: a UI só renderiza este botão quando bet ∈ {1..6}, então o
  // ramo "else" é inalcançável em uso normal — mantido para robustez.
  const submitBet = () => {
    const v = parseInt(bet);
    if (v >= 1 && v <= 6) {
      diceRef.current?.setBetting(false);
      launchDie();
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Lançar dado (mesma mecânica da Cena 2 — sem copo) ──
  const launchDie = useCallback(async () => {
    if (rolling.current) return;
    rolling.current = true;
    setExpSubPhase('rolling');

    // Som imediato ao clicar — sincroniza com a intenção do usuário
    playSound('/sounds/nextChallenge.mp3');

    // Scroll suave até o dado 3D (paralelo ao som)
    diceContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Esperar scroll completar antes de lançar (400ms)
    await new Promise(r => setTimeout(r, 400));

    // Resultado via xoshiro128**
    const result = rng.die();
    setDiceResult(result);

    // Dado 3D: sair do idle/betting antes de lançar
    diceRef.current?.setBetting(false);
    diceRef.current?.setIdle(false);
    if (diceRef.current) {
      await diceRef.current.roll(result);
    }

    // Dado já caiu
    setExpSubPhase('landed');

    // Esperar o aluno ver o resultado no dado
    await new Promise(r => setTimeout(r, 800));

    // Scroll de volta ao card do exercício
    exerciseCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    rolling.current = false;
    setExpSubPhase('markResult');
  }, [diceRef, diceContainerRef]);

  // Rola pro topo do OVA quando uma fase avança após Conferir/Próximo. Crítico
  // no mobile: o aluno termina a pergunta lá embaixo, clica Conferir, e a fase
  // nova carrega sem trazer o enunciado pra viewport. `apresentacao-dado`
  // é o Grid raiz do OVA, sempre presente.
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ── Validar marcação do resultado ──
  const validateResultMark = () => {
    scrollDiceToTop();
    // Exatamente 1 checkbox marcado, e deve ser o resultado
    const marked = resultCheck.filter(Boolean).length;
    if (marked === 1 && resultCheck[diceResult - 1]) {
      setResultCheckError(false);
      playSound('/sounds/correct.mp3');
      const won = parseInt(bet) === diceResult;
      createAlert?.(
        'Marcação correta!',
        won
          ? `Você apostou ${bet} e o dado caiu em ${diceResult}. Aposta certeira!`
          : `Você apostou ${bet} mas o dado caiu em ${diceResult}.`,
        won ? 'success' : 'info',
        3500,
      );
      // Ir para comparação (aposta × resultado) com feedback
      setTimeout(() => {
        playSound(won ? '/sounds/correct.mp3' : '/sounds/incorrect.mp3');
      }, 400);
      setExpSubPhase('compare');
      scrollDiceToTop();
    } else {
      setResultCheckError(true);
      playSound('/sounds/incorrect.mp3');
      createAlert?.(
        'Tente novamente',
        marked === 0
          ? 'Marque exatamente uma face — a que apareceu no dado.'
          : marked > 1
            ? 'Marque APENAS uma face — a que apareceu no dado.'
            : `O dado caiu em ${diceResult}. Marque essa face.`,
        'error',
        4000,
      );
    }
  };

  // ── Avançar após comparação ──
  const goToNextRound = () => {
    // Limpar highlight da aposta anterior
    diceRef.current?.highlightFace(null);
    if (mainPhase === 'experimentA') {
      setMainPhase('experimentB');
      setExpSubPhase('bet');
      setBet('');
      setResultCheck([false, false, false, false, false, false]);
      setDiceResult(0);
    } else {
      setMainPhase('exercises');
      setExSubPhase('mark');
      setEventChecks([false, false, false, false, false, false]);
      setEventChecksDisabled(false);
    }
    scrollDiceToTop();
  };

  // ── Validar marcação do evento ──
  const validateEventMarks = () => {
    scrollDiceToTop();
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
      createAlert?.(
        'Correto!',
        `Você identificou as faces favoráveis ao evento "${event.description}".`,
        'success',
        3000,
      );
      setExSubPhase('bet');
      scrollDiceToTop();
    } else {
      setEventChecksError(true);
      playSound('/sounds/incorrect.mp3');
      createAlert?.(
        'Marcação incorreta',
        `Releia o evento "${event.description}" e marque apenas as faces favoráveis.`,
        'error',
        4000,
      );
    }
  };

  // ── Lançar dado no exercício ──
  const launchExDie = useCallback(async () => {
    if (rolling.current) return;
    rolling.current = true;
    setExSubPhase('rolling');

    // Som imediato ao clicar — sincroniza com a intenção do usuário
    playSound('/sounds/nextChallenge.mp3');

    // Scroll suave até o dado 3D
    diceContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 400));

    const result = rng.die();
    setExDiceResult(result);

    diceRef.current?.setIdle(false);
    if (diceRef.current) {
      await diceRef.current.roll(result);
    }

    // Dado já caiu — mudar texto imediatamente
    setExSubPhase('landed');

    // Esperar o aluno ver o resultado no dado (1.5s)
    await new Promise(r => setTimeout(r, 1500));

    // Scroll de volta ao card do exercício
    exerciseCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    rolling.current = false;
    setExSubPhase('readDice');
  }, [diceRef, diceContainerRef]);

  // ── Validar cálculo de P(A) ──
  // ── Avançar para próximo exercício ou finalizar ──
  const goToNextExercise = () => {
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
      setExBet(null);
      setExDiceResult(0);
      setCalcNum('');
      setCalcDen('');
      setCalcCompNum('');
      setCalcCompDen('');
      setCalcCompNumError(false);
      setCalcCompDenError(false);
      setCalcCompFeedback('');
      setBothCalcCorrect(false);
      setReadDiceAnswer('');
      setReadDiceError(false);
      setCompOperator('');
      setCompOperatorError(false);
      setCompValidated(false);
      // Reset do caso degenerado (evento certo)
      setCertainNameAnswer('');
      setCertainNameValidated(false);
      setCertainNameError(false);
      // Reset do caso degenerado simétrico (evento impossível)
      setImpossibleNameAnswer('');
      setImpossibleNameValidated(false);
      setImpossibleNameError(false);
    }
    scrollDiceToTop();
  };

  // Validar cálculo do complementar (quando "indiferente" errado)
  const validateCompCalc = () => {
    scrollDiceToTop();
    const event = events[exerciseIdx];
    let favorable = 0;
    for (let f = 1; f <= 6; f++) if (event.validation(f)) favorable++;
    const compFavorable = 6 - favorable;
    // ── Padrão de projeto: aceitar qualquer fração equivalente a P(Ā) ──
    // Comparação por multiplicação cruzada: num/den ≡ compFavorable/6.
    const numStr = calcCompNum.trim();
    const denStr = calcCompDen.trim();
    const numIsValid = /^\d+$/.test(numStr);
    const denIsValid = /^\d+$/.test(denStr);
    const num = numIsValid ? parseInt(numStr, 10) : NaN;
    const den = denIsValid ? parseInt(denStr, 10) : NaN;

    setCalcCompNumError(false);
    setCalcCompDenError(false);
    setCalcCompFeedback('');

    if (!numIsValid || !denIsValid || den === 0) {
      playSound('/sounds/incorrect.mp3');
      if (!numIsValid) setCalcCompNumError(true);
      if (!denIsValid || den === 0) setCalcCompDenError(true);
      setCalcCompFeedback('Preencha numerador e denominador com números inteiros (denominador maior que zero).');
      createAlert?.('Campos inválidos', 'Preencha numerador e denominador com números inteiros (denominador maior que zero).', 'error', 4000);
      return;
    }

    const equivalent = num * 6 === den * compFavorable;

    if (equivalent) {
      playSound('/sounds/correct.mp3');
      setBothCalcCorrect(true);
      createAlert?.('Correto!', `P(Ā) = ${compFavorable}/6 (ou qualquer fração equivalente).`, 'success', 3000);
    } else {
      playSound('/sounds/incorrect.mp3');
      setCalcCompNumError(true);
      setCalcCompDenError(true);
      setCalcCompFeedback(
        `A fração ${num}/${den} não é equivalente a P(Ā). Lembre: P(Ā) = nº de resultados que não pertencem a A / nº total de resultados. Frações equivalentes são aceitas (por exemplo, 2/4 = 1/2 = 3/6).`
      );
      createAlert?.('Tente novamente', `A fração ${num}/${den} não é equivalente a P(Ā).`, 'error', 4000);
    }
  };

  const validateCalc = () => {
    scrollDiceToTop();
    const event = events[exerciseIdx];
    let favorable = 0;
    for (let f = 1; f <= 6; f++) {
      if (event.validation(f)) favorable++;
    }
    // ── Padrão de projeto: aceitar qualquer fração equivalente a P(A) ──
    // Comparação por multiplicação cruzada: num/den ≡ favorable/6 ⇔ num·6 = den·favorable.
    // Aceita forma canônica (favorable/6), simplificada (ex.: 2/3 quando favorable=4),
    // e qualquer múltiplo válido (ex.: 8/12, 40/60). Caso impossível: aceita 0/n para n>0.
    const numStr = calcNum.trim();
    const denStr = calcDen.trim();
    const numIsValid = /^\d+$/.test(numStr);
    const denIsValid = /^\d+$/.test(denStr);
    const num = numIsValid ? parseInt(numStr, 10) : NaN;
    const den = denIsValid ? parseInt(denStr, 10) : NaN;

    setCalcNumError(false);
    setCalcDenError(false);
    setCalcFeedback('');

    // Validações estruturais (campos vazios, não numéricos, denominador zero)
    if (!numIsValid || !denIsValid || den === 0) {
      playSound('/sounds/incorrect.mp3');
      if (!numIsValid) setCalcNumError(true);
      if (!denIsValid || den === 0) setCalcDenError(true);
      setCalcFeedback('Preencha numerador e denominador com números inteiros (denominador maior que zero).');
      createAlert?.('Campos inválidos', 'Preencha numerador e denominador com números inteiros (denominador maior que zero).', 'error', 4000);
      return;
    }

    // Equivalência matemática: num·6 === den·favorable
    const equivalent = num * 6 === den * favorable;

    if (equivalent) {
      playSound('/sounds/correct.mp3');
      // Se "indiferente" errado, não avança ainda — precisa calcular P(Ā)
      const needsCompCalc = exBet === 'indiferente' && favorable !== 3;
      if (needsCompCalc) {
        // P(A) ok, agora precisa de P(Ā) — não muda de fase, render mostrará o campo
        createAlert?.('P(A) correto!', 'Agora calcule também P(Ā) — a probabilidade do evento complementar.', 'info', 4000);
      } else {
        setExSubPhase('next');
        scrollDiceToTop();
        createAlert?.('Correto!', `P(A) = ${favorable}/6 (ou qualquer fração equivalente).`, 'success', 3000);
      }
    } else {
      playSound('/sounds/incorrect.mp3');
      setCalcNumError(true);
      setCalcDenError(true);
      setCalcFeedback(
        `A fração ${num}/${den} não é equivalente a P(A). Lembre: P(A) = nº de favoráveis / nº total de resultados. Frações equivalentes são aceitas (por exemplo, 2/4 = 1/2 = 3/6).`
      );
      createAlert?.('Tente novamente', `A fração ${num}/${den} não é equivalente a P(A).`, 'error', 4000);
    }
  };

  // ── Renderizar matriz conforme cor ──
  const renderMatrix = (checks: boolean[], disabled: boolean, onChange: (idx: number, val: boolean) => void) => {
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
                      aria-label={`Marcar face ${f} do dado verde`}
                      style={{
                        width: 20, height: 20,
                        accentColor: 'var(--color-feedback-success-dark)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
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
                      aria-label={`Marcar face ${f} do dado azul`}
                      style={{
                        width: 20, height: 20,
                        accentColor: 'var(--color-brand-otimath-pure)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
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

  // Sub-fase derivada da 'calc' — usada pelo cenaId DEV para tornar cada
  // input/comparador um snapshot distinto, e pelo advance() para saber
  // qual ação simular dentro do cálculo.
  const calcSubStep = (() => {
    if (mainPhase !== 'exercises' || exSubPhase !== 'calc') return '';
    const ev = events[exerciseIdx];
    if (!ev) return '';
    let fav = 0; for (let f = 1; f <= 6; f++) if (ev.validation(f)) fav++;
    const needsComp = exBet === 'indiferente' && fav !== 3;
    if (fav === 6 && !certainNameValidated) return 'certainName';
    if (fav === 0 && !impossibleNameValidated) return 'impossibleName';
    if (needsComp && !bothCalcCorrect) return 'pa+pcomp';
    if (needsComp && bothCalcCorrect && !compValidated) return 'compare';
    if (needsComp && compValidated) return 'done';
    // caso normal (sem needsComp): só P(A) — depois passa para 'next'
    return 'pa';
  })();

  // ═══════ Notificação de mudança de fase ao pai (para o cenaId DEV) ═══════
  useEffect(() => {
    if (!onPhaseChange) return;
    const parts: string[] = [`main=${mainPhase}`];
    if (mainPhase === 'experimentA' || mainPhase === 'experimentB') {
      parts.push(`exp=${expSubPhase}`);
    }
    if (mainPhase === 'exercises') {
      parts.push(`ex=${exerciseIdx}`, `sub=${exSubPhase}`);
      if (exSubPhase === 'calc' && calcSubStep) parts.push(`calc=${calcSubStep}`);
    }
    onPhaseChange(parts.join('|'));
  }, [mainPhase, expSubPhase, exSubPhase, exerciseIdx, calcSubStep, onPhaseChange]);

  // ═══════ Handle exposto ao painel DEV ═══════
  // Identifica a sub-cena atual + simula a próxima ação correta.
  // Para a fase 'calc' (cálculo de P(A)/P(Ā)/comparador/certo/impossível),
  // o avanço respeita cada sub-passo via inline da lógica de sucesso —
  // sem chamar validateCalc/validateCompCalc (closure stale após flushSync).
  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => {
      const parts: string[] = [`main=${mainPhase}`];
      if (mainPhase === 'experimentA' || mainPhase === 'experimentB') {
        parts.push(`exp=${expSubPhase}`);
      }
      if (mainPhase === 'exercises') {
        parts.push(`ex=${exerciseIdx}`, `sub=${exSubPhase}`);
        if (exSubPhase === 'calc' && calcSubStep) parts.push(`calc=${calcSubStep}`);
      }
      return parts.join('|');
    },
    advance: () => {
      if (mainPhase === 'intro') {
        setMainPhase('experimentA');
        setExpSubPhase('bet');
        return;
      }
      if (mainPhase === 'experimentA' || mainPhase === 'experimentB') {
        if (expSubPhase === 'bet' || expSubPhase === 'rolling' || expSubPhase === 'landed' || expSubPhase === 'markResult') {
          if (!bet) setBet('1');
          if (!diceResult) setDiceResult(1);
          setResultCheck([true, false, false, false, false, false]);
          setExpSubPhase('compare');
          return;
        }
        if (expSubPhase === 'compare') {
          goToNextRound();
          return;
        }
      }
      if (mainPhase === 'exercises') {
        // Antes de 'calc': pula direto para 'calc' (com valores plausíveis).
        if (exSubPhase === 'mark' || exSubPhase === 'bet' || exSubPhase === 'rolling' || exSubPhase === 'landed' || exSubPhase === 'readDice' || exSubPhase === 'result') {
          if (!exDiceResult || exDiceResult < 1) setExDiceResult(1);
          if (!exBet) setExBet('favor');
          setExSubPhase('calc');
          return;
        }
        // Dentro de 'calc': respeita cada sub-passo.
        if (exSubPhase === 'calc') {
          const ev = events[exerciseIdx];
          if (!ev) return;
          let fav = 0; for (let f = 1; f <= 6; f++) if (ev.validation(f)) fav++;
          const needsComp = exBet === 'indiferente' && fav !== 3;

          // Caso degenerado — evento certo (favorable === 6).
          if (fav === 6 && !certainNameValidated) {
            setCertainNameAnswer('certo');
            setCertainNameValidated(true);
            setCertainNameError(false);
            return;
          }
          // Caso degenerado — evento impossível (favorable === 0).
          if (fav === 0 && !impossibleNameValidated) {
            setImpossibleNameAnswer('impossivel');
            setImpossibleNameValidated(true);
            setImpossibleNameError(false);
            return;
          }
          // Indiferente em evento não trivial: P(A), depois P(Ā), depois compare.
          if (needsComp && !bothCalcCorrect) {
            // Preencher P(A) e P(Ā) corretos de uma vez e marcar bothCalcCorrect.
            setCalcNum(String(fav));
            setCalcDen('6');
            setCalcNumError(false);
            setCalcDenError(false);
            setCalcFeedback('');
            setCalcCompNum(String(6 - fav));
            setCalcCompDen('6');
            setCalcCompNumError(false);
            setCalcCompDenError(false);
            setCalcCompFeedback('');
            setBothCalcCorrect(true);
            return;
          }
          if (needsComp && bothCalcCorrect && !compValidated) {
            const correct = fav > 3 ? '>' : fav < 3 ? '<' : '=';
            setCompOperator(correct);
            setCompOperatorError(false);
            setCompValidated(true);
            return;
          }
          // Caso normal (a favor / contra com fav coerente, ou indiferente em fav=3):
          // só preencher P(A) e ir para 'next'.
          if (!needsComp && fav !== 6 && fav !== 0) {
            setCalcNum(String(fav));
            setCalcDen('6');
            setCalcNumError(false);
            setCalcDenError(false);
            setCalcFeedback('');
            setExSubPhase('next');
            return;
          }
          // Tudo já validado — avança para 'next'.
          setExSubPhase('next');
          return;
        }
        if (exSubPhase === 'next') {
          goToNextExercise();
          return;
        }
      }
      if (mainPhase === 'finished') {
        onFinished();
      }
    },
    setCurrentPhaseId: (phaseId: string) => {
      // Decodifica o formato 'main=X|exp=Y|ex=N|sub=Z|calc=W' produzido por
      // getCurrentPhaseId e restaura os estados correspondentes.
      const fields: Record<string, string> = {};
      for (const part of phaseId.split('|')) {
        const eq = part.indexOf('=');
        if (eq > 0) fields[part.slice(0, eq)] = part.slice(eq + 1);
      }
      if (fields.main) setMainPhase(fields.main as typeof mainPhase);
      if (fields.exp)  setExpSubPhase(fields.exp as typeof expSubPhase);
      if (fields.ex)   setExerciseIdx(parseInt(fields.ex, 10) || 0);
      if (fields.sub)  setExSubPhase(fields.sub as typeof exSubPhase);
    },
  }), [
    mainPhase, expSubPhase, exSubPhase, exerciseIdx, bet, diceResult,
    exBet, exDiceResult, events, bothCalcCorrect, compValidated,
    certainNameValidated, impossibleNameValidated, calcSubStep, onFinished,
  ]);

  // ═══════ RENDER ═══════
  return (
    <div className="w-full max-w-[620px]">
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Praticando com um dado
      </h2>

      {/* ═══════ INTRO ═══════ */}
      {mainPhase === 'intro' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="ds-body-bold text-neutral-black mb-macro text-justify text-[1.05rem]">
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
        <div ref={exerciseCardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

          <p className="ds-body-bold text-center mb-micro" style={{ color: colorStyle(currentColor()) }}>
            Dado {colorLabel(currentColor())} — Rodada {mainPhase === 'experimentA' ? '1' : '2'} de 2
          </p>

          {/* Apostar — girar o dado e clicar na face */}
          {expSubPhase === 'bet' && (
            <div className="flex flex-col gap-y-micro items-center">
              {!bet ? (
                <>
                  <p className="ds-body-bold text-neutral-black text-center">
                    <strong>Gire o dado</strong> arrastando com o dedo ou mouse e <strong>clique na face</strong> em que deseja apostar.
                  </p>
                  <p className="ds-small text-neutral-dark text-center italic">
                    Posicione a face desejada voltada para você e clique sobre o dado.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <span className="ds-caption-bold text-neutral-dark">Sua aposta</span>
                    <DiceFaceIcon face={parseInt(bet)} size={48} color={currentColor()} />
                    <span className="ds-body-bold text-neutral-black">{bet}</span>
                  </div>
                  <Button style="primary" size="small" onClick={submitBet}>
                    🎲 Lançar dado
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Lançando */}
          {(expSubPhase === 'rolling' || expSubPhase === 'landed') && (
            <>
              <div className="flex flex-col items-center mb-micro">
                <span className="ds-caption-bold text-neutral-dark">Sua aposta</span>
                <DiceFaceIcon face={parseInt(bet)} size={48} color={currentColor()} />
                <span className="ds-body-bold text-neutral-black">{bet}</span>
              </div>
              <p className="ds-body-bold text-neutral-dark text-center">
                {expSubPhase === 'rolling' ? 'Lançando o dado...' : 'Observe o resultado no dado.'}
              </p>
            </>
          )}

          {/* Marcar resultado na matriz (após lançamento) */}
          {expSubPhase === 'markResult' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex flex-col items-center mb-micro">
                <span className="ds-caption-bold text-neutral-dark">Sua aposta</span>
                <DiceFaceIcon face={parseInt(bet)} size={48} color={currentColor()} />
                <span className="ds-body-bold text-neutral-black">{bet}</span>
              </div>
              <p className="ds-body-bold text-neutral-black text-center">
                Marque na tabela o resultado do experimento aleatório:
              </p>
              {renderMatrix(
                resultCheck, false,
                (idx, val) => {
                  const next = [...resultCheck];
                  next[idx] = val;
                  setResultCheck(next);
                  setResultCheckError(false);
                },
              )}
              <div className="flex flex-col items-center gap-y-micro">
                <Button style="primary" size="extra-small" onClick={validateResultMark}>Conferir</Button>
                {resultCheckError && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="ds-small-bold text-feedback-error-dark"
                  >
                    Veja o resultado na face superior do dado e tente novamente.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comparação — aposta × resultado + matriz + feedback */}
          {expSubPhase === 'compare' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex gap-x-xs gap-y-nano items-center flex-wrap justify-center">
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
              {/* Matriz com resultado marcado (somente leitura) */}
              {renderMatrix(
                resultCheck, true,
                () => {}
              )}
              <p className="ds-body-bold text-center" style={{
                color: parseInt(bet) === diceResult ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
                fontSize: '1.1rem',
              }}>
                {parseInt(bet) === diceResult ? '✅ Você ganhou a aposta!' : '❌ Você não ganhou a aposta! O dado é imprevisível.'}
              </p>
              <div className="flex justify-center">
                <Button style="primary" size="small" onClick={goToNextRound}>
                  {mainPhase === 'experimentA' ? 'Próximo: rodada 2 de 2' : 'Próximo: exercícios'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ FASE C — Exercícios de eventos ═══════ */}
      {mainPhase === 'exercises' && (() => {
        const event = events[exerciseIdx];
        const belongsToEvent = exDiceResult > 0 ? event.validation(exDiceResult) : false;
        // Conta favoráveis para feedback e validação de "indiferente"
        let favorable = 0;
        for (let f = 1; f <= 6; f++) if (event.validation(f)) favorable++;
        const isIndifferentCorrect = favorable === 3;
        const won = exBet !== null && exDiceResult > 0
          ? ((exBet === 'indiferente' && isIndifferentCorrect) || (exBet === 'favor' && belongsToEvent) || (exBet === 'contra' && !belongsToEvent))
          : false;
        return (
        <div ref={exerciseCardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

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
              {event.description}
            </p>
            {/ ou / .test(event.description) && (
              <p className="ds-small text-neutral-dark text-center mt-nano italic">
                Lembre-se: na Matemática, &quot;ou&quot; significa um, outro, ou ambos.
              </p>
            )}
            {/ e /.test(event.description) && !/ ou /.test(event.description) && (
              <p className="ds-small text-neutral-dark text-center mt-nano italic">
                Lembre-se: na Matemática, &quot;e&quot; exige que ambas as condições sejam satisfeitas.
              </p>
            )}
          </div>

          {/* ETAPA 1 — Marcar favoráveis */}
          <p className="ds-body-bold text-neutral-black mb-micro text-justify">
            Considere o lançamento de um dado equilibrado. Marque os <strong>resultados favoráveis</strong> ao evento A:
          </p>

          {renderMatrix(
            eventChecks, eventChecksDisabled,
            (idx, val) => {
              const next = [...eventChecks];
              next[idx] = val;
              setEventChecks(next);
              setEventChecksError(false);
            },
          )}

          {exSubPhase === 'mark' && (
            <div className="flex flex-col items-center gap-y-micro">
              <Button style="primary" size="extra-small" onClick={validateEventMarks}>Conferir</Button>
              {eventChecksError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="ds-small-bold text-center text-feedback-error-dark"
                >
                  Verifique quais resultados satisfazem o evento &quot;{event.description}&quot;.
                </p>
              )}
            </div>
          )}

          {/* ETAPA 2 — Apostar no evento */}
          {exSubPhase === 'bet' && (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro">

              {/* ── EXPLORAÇÃO 4 (exclusiva do evento impossível) ──
                  Reconhecimento da resposta vazia: legitima a ação contraintuitiva
                  do aluno (clicar em Conferir sem marcar nada) e introduz a notação
                  do conjunto vazio ∅ no momento exato em que o aluno acabou de "agir"
                  o conjunto vazio. Duval: passagem do registro fenomenológico ao
                  simbólico-formal. */}
              {favorable === 0 && (
                <div
                  className="rounded-md p-micro"
                  style={{
                    background: 'var(--color-feedback-info-lighter)',
                    border: '1px solid var(--color-feedback-info-dark)',
                  }}
                >
                  <p className="ds-small text-neutral-darkest text-justify">
                    💡 Você marcou <strong>nenhuma face</strong> — e está correto! Quando{' '}
                    <strong>nenhum</strong> resultado do lançamento é favorável ao evento A,
                    dizemos que A não tem elementos: A é o <strong>conjunto vazio</strong>{' '}
                    (escrevemos <strong>A = ∅</strong>). Continue para apostar.
                  </p>
                </div>
              )}

              <p className="ds-body-bold text-neutral-black text-center">
                Você <strong>aposta</strong> que o resultado do lançamento será favorável ao evento A?
              </p>
              <div className="flex justify-center gap-x-micro gap-y-nano flex-wrap">
                <Button
                  style={exBet === 'favor' ? 'primary' : 'secondary'}
                  size="extra-small"
                  onClick={() => setExBet('favor')}
                >
                  A favor de A
                </Button>
                <Button
                  style={exBet === 'contra' ? 'primary' : 'secondary'}
                  size="extra-small"
                  onClick={() => setExBet('contra')}
                >
                  Contra A (complementar)
                </Button>
                <Button
                  style={exBet === 'indiferente' ? 'primary' : 'secondary'}
                  size="extra-small"
                  onClick={() => setExBet('indiferente')}
                >
                  É indiferente
                </Button>
              </div>
              {(exBet === 'contra' || exBet === 'indiferente') && (
                <p className="ds-small text-neutral-dark text-center mt-nano italic">
                  O <strong>evento complementar</strong> Ā é formado por todos os resultados que <strong>não</strong> pertencem a A.
                  {exBet === 'indiferente' && ' Quando A e Ā têm a mesma quantidade de resultados favoráveis, é indiferente apostar em um ou no outro.'}
                </p>
              )}
              {exBet !== null && (
                <div className="flex justify-center mt-micro">
                  <Button style="primary" size="small" onClick={launchExDie}>
                    🎲 Lançar dado
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2b — Lançando / Dado caiu */}
          {(exSubPhase === 'rolling' || exSubPhase === 'landed') && (
            <div className="mt-micro border-t border-neutral-lighter pt-micro">
              <p className="ds-body-bold text-neutral-dark text-center">
                {exSubPhase === 'rolling' ? 'Lançando o dado...' : 'Observe o resultado no dado.'}
              </p>
            </div>
          )}

          {/* ETAPA 3a — Estudante lê o resultado no dado 3D */}
          {exSubPhase === 'readDice' && (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro items-center">
              <p className="ds-body-bold text-neutral-black text-center">
                Qual foi o resultado do lançamento?
              </p>
              <div className="flex items-center gap-x-micro">
                <select
                  value={readDiceAnswer}
                  onChange={e => { setReadDiceAnswer(e.target.value); setReadDiceError(false); }}
                  className="ds-body-bold"
                  aria-label="Resultado do lançamento do dado"
                  aria-invalid={readDiceError}
                  aria-describedby={readDiceError ? 'practice-read-dice-error' : undefined}
                  style={{
                    border: `2px solid ${readDiceError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8, padding: '6px 12px', outline: 'none',
                    textAlign: 'center', minWidth: 64,
                  }}
                >
                  <option value="">?</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
                <Button style="primary" size="extra-small" onClick={() => {
                  if (parseInt(readDiceAnswer) === exDiceResult) {
                    playSound('/sounds/correct.mp3');
                    // Agora calcular won e tocar som da aposta
                    const belongsTo = events[exerciseIdx].validation(exDiceResult);
                    let fav = 0;
                    for (let f = 1; f <= 6; f++) if (events[exerciseIdx].validation(f)) fav++;
                    const indOk = fav === 3;
                    const w = (exBet === 'indiferente' && indOk)
                      || (exBet === 'favor' && belongsTo)
                      || (exBet === 'contra' && !belongsTo);
                    setTimeout(() => playSound(w ? '/sounds/correct.mp3' : '/sounds/incorrect.mp3'), 400);
                    createAlert?.(
                      'Resultado correto!',
                      `O dado caiu em ${exDiceResult}. ${w ? 'Sua aposta acertou!' : 'Sua aposta não acertou desta vez.'}`,
                      w ? 'success' : 'info',
                      4000,
                    );
                    setExSubPhase('result');
                  } else {
                    setReadDiceError(true);
                    playSound('/sounds/incorrect.mp3');
                    createAlert?.(
                      'Tente novamente',
                      'Veja o resultado na face superior do dado 3D e selecione a face correta.',
                      'error',
                      4000,
                    );
                  }
                }}>Conferir</Button>
              </div>
              {readDiceError && (
                <p
                  id="practice-read-dice-error"
                  role="alert"
                  aria-live="assertive"
                  className="ds-small-bold text-center text-feedback-error-dark"
                >
                  Veja o resultado na face superior do dado e tente novamente.
                </p>
              )}
            </div>
          )}

          {/* ETAPA 3b — Feedback da aposta */}
          {exSubPhase === 'result' && (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro">
              {/* Confirmação visual do resultado lido pelo estudante */}
              <div className="flex flex-col items-center">
                <span className="ds-caption-bold text-neutral-dark">Resultado</span>
                <DiceFaceIcon face={exDiceResult} size={48} color={currentColor()} />
                <span className="ds-body-bold text-neutral-black">{exDiceResult}</span>
              </div>
              <p className="ds-small-bold text-center text-neutral-dark">
                Sua aposta: <strong>{exBet === 'favor' ? 'a favor de A' : exBet === 'contra' ? 'contra A (complementar de A)' : 'indiferente (A ou complementar de A)'}</strong>
              </p>
              <p className="ds-body-bold text-center" style={{
                color: belongsToEvent ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
              }}>
                O resultado obtido {belongsToEvent ? 'pertence' : 'não pertence'} ao evento A.
              </p>
              {exBet === 'indiferente' && (
                <p className="ds-body-bold text-center" style={{ color: won ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)' }}>
                  {won
                    ? 'Você afirmou que é indiferente — e está correto: P(A) = P(Ā).'
                    : 'Você afirmou que é indiferente, mas A e Ā não têm a mesma quantidade de resultados favoráveis.'}
                </p>
              )}
              <p className="ds-body-bold text-center" style={{
                color: won ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
                fontSize: '1.1rem',
              }}>
                {won ? '✅ Você ganhou a aposta!' : '❌ Você não ganhou a aposta!'}
              </p>

              {/* ── EXPLORAÇÃO 1 — Caso degenerado: A = S (favorable === 6) ──
                  Feedback diferenciado por alternativa marcada. Cada aposta
                  do aluno abre uma janela conceitual diferente sobre eventos
                  certo/impossível/equiprovável. */}
              {favorable === 6 && (
                <div
                  className="rounded-md p-micro mt-micro"
                  style={{
                    background: 'var(--color-feedback-info-lighter)',
                    border: '1px solid var(--color-feedback-info-dark)',
                  }}
                >
                  {exBet === 'favor' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>todas as 6 faces</strong> e apostou{' '}
                      <strong>a favor de A</strong>. Observe algo especial: nesse exercício,
                      A coincide com o <strong>próprio espaço amostral S</strong>. Isso quer
                      dizer que A vai acontecer em <strong>todo lançamento</strong>, sem
                      exceção. Sua aposta era <strong>infalível</strong> — esse tipo de
                      evento, que tem o nome técnico de <strong>evento certo</strong>, sempre
                      tem probabilidade igual a <strong>1</strong> (ou 100%).
                    </p>
                  )}
                  {exBet === 'contra' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>todas as 6 faces</strong> mas apostou{' '}
                      <strong>contra A</strong>. Observe: como A coincide com o{' '}
                      <strong>próprio espaço amostral S</strong>, o complementar de A é o{' '}
                      <strong>conjunto vazio</strong> (Ā = ∅). Apostar contra A foi apostar
                      no <strong>evento impossível</strong>, que tem probabilidade{' '}
                      <strong>0</strong>: ele não pode acontecer em nenhum lançamento. Esse
                      caso especial — A = S, P(A) = 1 — chama-se <strong>evento certo</strong>.
                    </p>
                  )}
                  {exBet === 'indiferente' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>todas as 6 faces</strong> e escolheu{' '}
                      <strong>indiferente</strong>. A opção indiferente faz sentido quando
                      P(A) = P(Ā). Mas aqui temos o caso mais distante possível dessa igualdade:
                      P(A) = 6/6 = <strong>1</strong> (certeza absoluta) e P(Ā) = 0/6 ={' '}
                      <strong>0</strong> (impossibilidade absoluta). São extremos opostos! Esse
                      caso especial em que A = S chama-se <strong>evento certo</strong>; o
                      complementar Ā é o <strong>evento impossível</strong>.
                    </p>
                  )}
                </div>
              )}

              {/* ── EXPLORAÇÃO 1 (espelho) — Caso degenerado: A = ∅ (favorable === 0) ──
                  Feedback diferenciado por alternativa marcada, simétrico ao do
                  evento certo. Cada aposta abre uma janela conceitual diferente. */}
              {favorable === 0 && (
                <div
                  className="rounded-md p-micro mt-micro"
                  style={{
                    background: 'var(--color-feedback-info-lighter)',
                    border: '1px solid var(--color-feedback-info-dark)',
                  }}
                >
                  {exBet === 'favor' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>nenhuma face</strong> e ainda assim apostou{' '}
                      <strong>a favor de A</strong>. Observe: como nenhum dos resultados
                      possíveis pertence a A, esse é o <strong>evento impossível</strong>{' '}
                      (A = ∅). Sua aposta era no impossível: P(A) = <strong>0</strong>. O
                      complementar Ā coincide com todo o espaço amostral S e tem P(Ā) ={' '}
                      <strong>1</strong> — Ā é o <strong>evento certo</strong>.
                    </p>
                  )}
                  {exBet === 'contra' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>nenhuma face</strong> e apostou{' '}
                      <strong>contra A</strong>. Observe algo especial: como A = ∅
                      (nenhum resultado favorável), o complementar Ā coincide com{' '}
                      <strong>todo o espaço amostral S</strong> = {'{1,2,3,4,5,6}'}.
                      Sua aposta era <strong>infalível</strong>: Ā acontece em todo
                      lançamento. Esse caso especial em que A = ∅ chama-se{' '}
                      <strong>evento impossível</strong> (P(A) = 0); o complementar Ā é
                      o <strong>evento certo</strong> (P(Ā) = 1).
                    </p>
                  )}
                  {exBet === 'indiferente' && (
                    <p className="ds-small text-neutral-darkest text-justify">
                      💡 Você marcou <strong>nenhuma face</strong> e escolheu{' '}
                      <strong>indiferente</strong>. A opção indiferente faz sentido quando
                      P(A) = P(Ā). Mas aqui temos o caso mais distante possível dessa
                      igualdade — agora invertido: P(A) = 0/6 = <strong>0</strong>{' '}
                      (impossibilidade absoluta) e P(Ā) = 6/6 = <strong>1</strong>{' '}
                      (certeza absoluta). São extremos opostos! Esse caso especial em
                      que A = ∅ chama-se <strong>evento impossível</strong>; o
                      complementar Ā é o <strong>evento certo</strong>.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <Button style="primary" size="extra-small" onClick={() => setExSubPhase('calc')}>
                  Próximo: calcular P(A)
                </Button>
              </div>
            </div>
          )}

          {/* ETAPA 4 — Cálculo de P(A) e possivelmente P(Ā) */}
          {exSubPhase === 'calc' && (() => {
            const needsComp = exBet === 'indiferente' && favorable !== 3;
            const pACorrect = parseInt(calcNum) === favorable && parseInt(calcDen) === 6;
            const betLabelExtended =
              exBet === 'favor'        ? 'a favor do evento A (a face sorteada pertencer ao evento)'
              : exBet === 'contra'     ? 'contra o evento A (a face sorteada NÃO pertencer ao evento)'
              : exBet === 'indiferente' ? 'indiferente (apostou que tanto faz se a face pertence ou não ao evento)'
              : '';
            return (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro">
              <p className="ds-body-bold text-neutral-black text-center">
                Qual era a probabilidade de você ganhar a aposta?
              </p>
              {betLabelExtended && (
                <p className="ds-small text-neutral-dark text-center italic">
                  (Lembrete: você apostou <strong>{betLabelExtended}</strong>.)
                </p>
              )}
              <div className="flex items-center justify-center gap-x-micro gap-y-nano flex-wrap">
                <div className="flex items-center gap-x-nano">
                  <span className="ds-body-bold text-neutral-black whitespace-nowrap">P(A) =</span>
                  <div className="inline-flex flex-col items-center mx-nano">
                  <input
                    type="text" value={calcNum}
                    onChange={e => { setCalcNum(e.target.value); setCalcNumError(false); setCalcFeedback(''); }}
                    placeholder="?" className="ds-body"
                    disabled={needsComp && pACorrect}
                    aria-label="Numerador de P de A"
                    aria-invalid={calcNumError}
                    aria-describedby={calcFeedback ? 'practice-calc-feedback' : undefined}
                    style={{
                      border: `2px solid ${calcNumError ? 'var(--color-feedback-error-dark)' : pACorrect && needsComp ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                    }}
                  />
                  <hr aria-hidden="true" style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '2px 0' }} />
                  <input
                    type="text" value={calcDen}
                    onChange={e => { setCalcDen(e.target.value); setCalcDenError(false); setCalcFeedback(''); }}
                    placeholder="?" className="ds-body"
                    disabled={needsComp && pACorrect}
                    aria-label="Denominador de P de A"
                    aria-invalid={calcDenError}
                    aria-describedby={calcFeedback ? 'practice-calc-feedback' : undefined}
                    style={{
                      border: `2px solid ${calcDenError ? 'var(--color-feedback-error-dark)' : pACorrect && needsComp ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-lighter)'}`,
                      borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                    }}
                  />
                  </div>
                </div>
                {!(needsComp && pACorrect) && (
                  <Button style="primary" size="extra-small" onClick={validateCalc}>Conferir</Button>
                )}
              </div>
              {calcFeedback && (
                <p
                  id="practice-calc-feedback"
                  role="alert"
                  aria-live="assertive"
                  className="ds-small-bold text-center text-feedback-error-dark"
                >
                  {calcFeedback}
                </p>
              )}

              {/* P(Ā) — aparece quando "indiferente" errado e P(A) já correto */}
              {needsComp && pACorrect && !bothCalcCorrect && (
                <>
                  <p className="ds-body-bold text-neutral-black text-center mt-micro">
                    Agora calcule a probabilidade do <strong>complementar de A</strong>:
                  </p>
                  <div className="flex items-center justify-center gap-x-micro gap-y-nano flex-wrap">
                    <div className="flex items-center gap-x-nano">
                      <span className="ds-body-bold text-neutral-black whitespace-nowrap">P(Ā) =</span>
                      <div className="inline-flex flex-col items-center mx-nano">
                      <input
                        type="text" value={calcCompNum}
                        onChange={e => { setCalcCompNum(e.target.value); setCalcCompNumError(false); setCalcCompFeedback(''); }}
                        placeholder="?" className="ds-body"
                        aria-label="Numerador de P do complementar de A"
                        aria-invalid={calcCompNumError}
                        aria-describedby={calcCompFeedback ? 'practice-calc-comp-feedback' : undefined}
                        style={{
                          border: `2px solid ${calcCompNumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                          borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                        }}
                      />
                      <hr aria-hidden="true" style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '2px 0' }} />
                      <input
                        type="text" value={calcCompDen}
                        onChange={e => { setCalcCompDen(e.target.value); setCalcCompDenError(false); setCalcCompFeedback(''); }}
                        placeholder="?" className="ds-body"
                        aria-label="Denominador de P do complementar de A"
                        aria-invalid={calcCompDenError}
                        aria-describedby={calcCompFeedback ? 'practice-calc-comp-feedback' : undefined}
                        style={{
                          border: `2px solid ${calcCompDenError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                          borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                        }}
                      />
                      </div>
                    </div>
                    <Button style="primary" size="extra-small" onClick={validateCompCalc}>Conferir</Button>
                  </div>
                  {calcCompFeedback && (
                    <p
                      id="practice-calc-comp-feedback"
                      role="alert"
                      aria-live="assertive"
                      className="ds-small-bold text-center text-feedback-error-dark"
                    >
                      {calcCompFeedback}
                    </p>
                  )}
                </>
              )}

              {/* Comparação P(A) vs P(Ā) — após ambos corretos */}
              {needsComp && bothCalcCorrect && !compValidated && (
                <>
                  <p className="ds-body-bold text-neutral-black text-center mt-micro">
                    Compare as probabilidades:
                  </p>
                  <div className="flex items-center justify-center gap-x-micro gap-y-nano flex-wrap">
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">P(A) = <Fraction num={String(favorable)} den="6" /></span>
                    <select
                      value={compOperator}
                      onChange={e => { setCompOperator(e.target.value); setCompOperatorError(false); }}
                      className="ds-body-bold"
                      aria-label="Operador de comparação entre P(A) e P(complementar de A)"
                      aria-invalid={compOperatorError}
                      style={{
                        border: `2px solid ${compOperatorError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                        borderRadius: 6, padding: '4px 8px', outline: 'none',
                        textAlign: 'center', minWidth: 52,
                      }}
                    >
                      <option value="">?</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="=">=</option>
                    </select>
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano"><Fraction num={String(6 - favorable)} den="6" /> = P(Ā)</span>
                    <Button style="primary" size="extra-small" onClick={() => {
                      const correct = favorable > 3 ? '>' : favorable < 3 ? '<' : '=';
                      if (compOperator === correct) {
                        playSound('/sounds/correct.mp3');
                        setCompValidated(true);
                        createAlert?.(
                          'Correto!',
                          `P(A) ${correct} P(Ā). ${correct === '=' ? 'As duas probabilidades são iguais.' : correct === '>' ? 'A é mais provável que seu complementar.' : 'O complementar de A é mais provável que A.'}`,
                          'success',
                          3500,
                        );
                      } else {
                        playSound('/sounds/incorrect.mp3');
                        setCompOperatorError(true);
                        createAlert?.(
                          'Tente novamente',
                          `Compare os numeradores: ${favorable} e ${6 - favorable}. Qual é maior?`,
                          'error',
                          4000,
                        );
                      }
                    }}>Conferir</Button>
                  </div>
                  {compOperatorError && (
                    <p className="ds-small-bold text-center text-feedback-error-dark">
                      Compare os numeradores: {favorable} e {6 - favorable}. Qual é maior?
                    </p>
                  )}
                </>
              )}

              {/* Conclusão final — comparação validada */}
              {needsComp && compValidated && (
                <>
                  <div className="flex items-center justify-center gap-x-micro mt-micro">
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">P(A) = <Fraction num={String(favorable)} den="6" /></span>
                    <span className="ds-body-bold text-neutral-black">{favorable > 3 ? '>' : '<'}</span>
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano"><Fraction num={String(6 - favorable)} den="6" /> = P(Ā)</span>
                  </div>
                  <p className="ds-body-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)', fontStyle: 'italic' }}>
                    Note que as probabilidades são distintas, portanto não cabe a resposta indiferente.
                  </p>
                  <div className="flex justify-center mt-micro">
                    <Button style="primary" size="small" onClick={() => setExSubPhase('next')}>
                      {exerciseIdx + 1 >= 4 ? 'Próximo: finalizar' : `Próximo: exercício ${exerciseIdx + 2} de 4`}
                    </Button>
                  </div>
                </>
              )}
            </div>
            );
          })()}

          {/* ETAPA 5 — Recap + Reflexão + transição para próximo exercício */}
          {exSubPhase === 'next' && (() => {
            // Determinar se a aposta era coerente com a probabilidade
            const betFavor = exBet === 'favor';
            const betContra = exBet === 'contra';
            const pAHigh = favorable > 3;
            const pALow = favorable < 3;
            // Ganhou com P baixo ou perdeu com P alto?
            const wonWithLowP = won && ((betFavor && pALow) || (betContra && pAHigh));
            const lostWithHighP = !won && ((betFavor && pAHigh) || (betContra && pALow));
            const betLabel = exBet === 'favor' ? 'a favor de A'
              : exBet === 'contra' ? 'contra A (complementar)'
              : 'indiferente';
            return (
            <div className="flex flex-col gap-y-micro mt-micro border-t border-neutral-lighter pt-micro">
              {/* Recap visual: resultado + aposta + P(A) */}
              <div className="flex flex-col items-center gap-y-micro">
                <div className="flex gap-x-xs gap-y-nano items-center justify-center flex-wrap">
                  <div className="flex flex-col items-center">
                    <span className="ds-caption-bold text-neutral-dark">Resultado</span>
                    <DiceFaceIcon face={exDiceResult} size={48} color={currentColor()} />
                    <span className="ds-body-bold text-neutral-black">{exDiceResult}</span>
                  </div>
                </div>
                <p className="ds-small-bold text-center text-neutral-dark">
                  Sua aposta: <strong>{betLabel}</strong>
                </p>
                <p className="ds-body-bold text-center" style={{
                  color: belongsToEvent ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
                }}>
                  O resultado obtido {belongsToEvent ? 'pertence' : 'não pertence'} ao evento A.
                </p>
                <div className="flex items-center justify-center gap-x-nano">
                  <span className="ds-body-bold text-neutral-black">P(A) =</span>
                  <Fraction num={String(favorable)} den="6" />
                </div>
                <p className="ds-body-bold text-center" style={{
                  color: won ? 'var(--color-feedback-success-dark)' : 'var(--color-feedback-error-dark)',
                  fontSize: '1.1rem',
                }}>
                  {won ? '✅ Você ganhou a aposta!' : '❌ Você não ganhou a aposta!'}
                </p>
              </div>

              {/* Reflexão pedagógica condicional */}
              {wonWithLowP && (
                <p className="ds-small-bold text-center" style={{ fontStyle: 'italic', color: 'var(--color-brand-otimath-dark)' }}>
                  Você ganhou a aposta, mas a probabilidade era de apenas <Fraction num={String(betFavor ? favorable : 6 - favorable)} den="6" /> a seu favor. No lançamento de um dado, eventos menos prováveis também podem acontecer, mas acontecem com menos frequência.
                </p>
              )}
              {lostWithHighP && (
                <p className="ds-small-bold text-center" style={{ fontStyle: 'italic', color: 'var(--color-brand-otimath-dark)' }}>
                  Você perdeu a aposta, mas a probabilidade era de <Fraction num={String(betFavor ? favorable : 6 - favorable)} den="6" /> a seu favor. Uma probabilidade alta não garante o resultado. Ela indica o que tende a acontecer em muitos lançamentos.
                </p>
              )}

              {/* ── EXPLORAÇÃO 3 — Fechamento do complementar lado a lado ──
                  Quando A = S (favorable === 6), exibimos automaticamente
                  P(A) e P(Ā) lado a lado, ilustrando a regra do complementar
                  P(A) + P(Ā) = 1 no caso extremo. Sem pedir input adicional. */}
              {favorable === 6 && (
                <div
                  className="rounded-md p-micro mt-micro"
                  style={{
                    background: 'var(--color-feedback-info-lighter)',
                    border: '1px solid var(--color-feedback-info-dark)',
                  }}
                >
                  <p className="ds-small-bold text-center text-neutral-darkest mb-micro">
                    Veja o caso especial deste exercício:
                  </p>
                  <div className="flex items-center justify-center gap-x-xs gap-y-nano flex-wrap mb-micro">
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">
                      P(A) = <Fraction num="6" den="6" /> = 1
                    </span>
                    <span className="ds-body-bold text-neutral-medium">e</span>
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">
                      P(Ā) = <Fraction num="0" den="6" /> = 0
                    </span>
                  </div>
                  <p className="ds-small text-neutral-darkest text-justify">
                    Note que <strong>P(A) + P(Ā) = 1 + 0 = 1</strong> — esta é a{' '}
                    <strong>regra do complementar</strong>, válida para qualquer evento.
                    O caso de A = S é o <em>caso extremo</em> dessa regra: <strong>toda</strong>
                    {' '}a probabilidade está em A, <strong>nada</strong> sobra para Ā.
                  </p>
                </div>
              )}

              {/* ── EXPLORAÇÃO 2 — Pergunta de nomeação canônica ──
                  Aluno precisa nomear o caso vivido (Duval: passagem do
                  registro fenomenológico ao linguístico-formal) antes de
                  poder avançar para o próximo exercício. */}
              {favorable === 6 && (
                <div className="mt-micro">
                  <p className="ds-small-bold text-center text-neutral-darkest mb-micro">
                    Como chamamos um evento que coincide com todo o espaço amostral?
                  </p>
                  <div className="flex flex-col items-center gap-y-quarck">
                    {[
                      { v: 'provavel', label: 'Evento provável' },
                      { v: 'equiprovavel', label: 'Evento equiprovável' },
                      { v: 'certo', label: 'Evento certo' },
                      { v: 'impossivel', label: 'Evento impossível' },
                    ].map(opt => (
                      <label
                        key={opt.v}
                        className="ds-small text-neutral-darkest"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: certainNameValidated ? 'default' : 'pointer',
                          opacity: certainNameValidated && certainNameAnswer !== opt.v ? 0.55 : 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="certainName"
                          value={opt.v}
                          disabled={certainNameValidated}
                          checked={certainNameAnswer === opt.v}
                          onChange={() => { setCertainNameAnswer(opt.v); setCertainNameError(false); }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {!certainNameValidated && (
                    <div className="flex justify-center mt-micro">
                      <Button
                        style="primary"
                        size="extra-small"
                        onClick={() => {
                          if (certainNameAnswer === 'certo') {
                            playSound('/sounds/correct.mp3');
                            setCertainNameValidated(true);
                            setCertainNameError(false);
                            createAlert?.(
                              'Correto!',
                              'Quando A coincide com todo o espaço amostral S, chamamos A de evento certo (probabilidade 1).',
                              'success',
                              4000,
                            );
                          } else if (certainNameAnswer === '') {
                            setCertainNameError(true);
                            createAlert?.(
                              'Marque uma opção',
                              'Selecione uma das alternativas antes de conferir.',
                              'info',
                              3000,
                            );
                          } else {
                            playSound('/sounds/incorrect.mp3');
                            setCertainNameError(true);
                            createAlert?.(
                              'Tente novamente',
                              'Não é essa. Pense: o evento acontece em todos os lançamentos possíveis, sem exceção. Como chamamos isso?',
                              'error',
                              5000,
                            );
                          }
                        }}
                      >
                        Conferir
                      </Button>
                    </div>
                  )}
                  {certainNameError && !certainNameValidated && (
                    <p
                      role="alert"
                      aria-live="assertive"
                      className="ds-small-bold text-center mt-micro text-feedback-error-dark"
                    >
                      {certainNameAnswer === ''
                        ? 'Marque uma das opções antes de conferir.'
                        : 'Não é essa. Pense: o evento acontece em todos os lançamentos possíveis, sem exceção. Como chamamos isso?'}
                    </p>
                  )}
                  {certainNameValidated && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="ds-small-bold text-center mt-micro text-feedback-success-dark"
                    >
                      ✅ Correto! Quando A coincide com todo o espaço amostral S,
                      A é chamado <strong>evento certo</strong> e tem probabilidade 1.
                    </p>
                  )}
                </div>
              )}

              {/* ── EXPLORAÇÃO 3 (espelho) — Fechamento do complementar lado a lado ──
                  Quando A = ∅ (favorable === 0), exibimos automaticamente
                  P(A) = 0/6 = 0 e P(Ā) = 6/6 = 1, ilustrando a regra do
                  complementar P(A) + P(Ā) = 1 no caso extremo invertido. */}
              {favorable === 0 && (
                <div
                  className="rounded-md p-micro mt-micro"
                  style={{
                    background: 'var(--color-feedback-info-lighter)',
                    border: '1px solid var(--color-feedback-info-dark)',
                  }}
                >
                  <p className="ds-small-bold text-center text-neutral-darkest mb-micro">
                    Veja o caso especial deste exercício:
                  </p>
                  <div className="flex items-center justify-center gap-x-xs gap-y-nano flex-wrap mb-micro">
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">
                      P(A) = <Fraction num="0" den="6" /> = 0
                    </span>
                    <span className="ds-body-bold text-neutral-medium">e</span>
                    <span className="ds-body-bold text-neutral-black inline-flex items-center gap-x-nano">
                      P(Ā) = <Fraction num="6" den="6" /> = 1
                    </span>
                  </div>
                  <p className="ds-small text-neutral-darkest text-justify">
                    Note que <strong>P(A) + P(Ā) = 0 + 1 = 1</strong> — esta é a{' '}
                    <strong>regra do complementar</strong>, válida para qualquer evento.
                    O caso de A = ∅ é o <em>outro extremo</em> dessa regra:{' '}
                    <strong>nada</strong> está em A, <strong>toda</strong> a probabilidade
                    está em Ā.
                  </p>
                </div>
              )}

              {/* ── EXPLORAÇÃO 2 (espelho) — Pergunta de nomeação canônica ──
                  Aluno precisa nomear o caso vivido (Duval: passagem do
                  registro fenomenológico ao linguístico-formal) antes de
                  poder avançar para o próximo exercício. */}
              {favorable === 0 && (
                <div className="mt-micro">
                  <p className="ds-small-bold text-center text-neutral-darkest mb-micro">
                    Como chamamos um evento que não pode acontecer em nenhum lançamento?
                  </p>
                  <div className="flex flex-col items-center gap-y-quarck">
                    {[
                      { v: 'provavel', label: 'Evento provável' },
                      { v: 'equiprovavel', label: 'Evento equiprovável' },
                      { v: 'certo', label: 'Evento certo' },
                      { v: 'impossivel', label: 'Evento impossível' },
                    ].map(opt => (
                      <label
                        key={opt.v}
                        className="ds-small text-neutral-darkest"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: impossibleNameValidated ? 'default' : 'pointer',
                          opacity: impossibleNameValidated && impossibleNameAnswer !== opt.v ? 0.55 : 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="impossibleName"
                          value={opt.v}
                          disabled={impossibleNameValidated}
                          checked={impossibleNameAnswer === opt.v}
                          onChange={() => { setImpossibleNameAnswer(opt.v); setImpossibleNameError(false); }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {!impossibleNameValidated && (
                    <div className="flex justify-center mt-micro">
                      <Button
                        style="primary"
                        size="extra-small"
                        onClick={() => {
                          if (impossibleNameAnswer === 'impossivel') {
                            playSound('/sounds/correct.mp3');
                            setImpossibleNameValidated(true);
                            setImpossibleNameError(false);
                            createAlert?.(
                              'Correto!',
                              'Quando A não acontece em nenhum lançamento possível, chamamos A de evento impossível (probabilidade 0).',
                              'success',
                              4000,
                            );
                          } else if (impossibleNameAnswer === '') {
                            setImpossibleNameError(true);
                            createAlert?.(
                              'Marque uma opção',
                              'Selecione uma das alternativas antes de conferir.',
                              'info',
                              3000,
                            );
                          } else {
                            playSound('/sounds/incorrect.mp3');
                            setImpossibleNameError(true);
                            createAlert?.(
                              'Tente novamente',
                              'Não é essa. Pense: A não acontece em nenhum lançamento possível. Como chamamos esse caso?',
                              'error',
                              5000,
                            );
                          }
                        }}
                      >
                        Conferir
                      </Button>
                    </div>
                  )}
                  {impossibleNameError && !impossibleNameValidated && (
                    <p
                      role="alert"
                      aria-live="assertive"
                      className="ds-small-bold text-center mt-micro text-feedback-error-dark"
                    >
                      {impossibleNameAnswer === ''
                        ? 'Marque uma das opções antes de conferir.'
                        : 'Não é essa. Pense: A não acontece em nenhum lançamento possível. Como chamamos esse caso?'}
                    </p>
                  )}
                  {impossibleNameValidated && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="ds-small-bold text-center mt-micro text-feedback-success-dark"
                    >
                      ✅ Correto! Quando A é o conjunto vazio (A = ∅) e nenhum
                      resultado lhe é favorável, A é chamado <strong>evento impossível</strong>{' '}
                      e tem probabilidade 0.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="small"
                  onClick={goToNextExercise}
                  disabled={
                    (favorable === 6 && !certainNameValidated) ||
                    (favorable === 0 && !impossibleNameValidated)
                  }
                >
                  {exerciseIdx + 1 >= 4
                    ? 'Próximo: finalizar'
                    : `Próximo: exercício ${exerciseIdx + 2} de 4`
                  }
                </Button>
              </div>
            </div>
            );
          })()}
        </div>
        );
      })()}

      {/* ═══════ FINALIZAÇÃO — ponte para a Cena 6 (máquina automática) ═══════ */}
      {mainPhase === 'finished' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            De um para dois dados
          </p>
          <p className="ds-body text-neutral-black text-justify">
            Você domina o experimento com <strong>um dado</strong>. Agora vamos lançar
            {' '}<strong>dois</strong> — um <strong className="text-feedback-success-dark">verde</strong>
            {' '}e um <strong className="text-brand-otimath-pure">azul</strong>.
          </p>
          <p className="ds-body text-neutral-black mt-micro text-justify">
            Antes de organizar tudo numa tabela, <strong>observe o fenômeno</strong>:
            o processo é mecânico, mas o par <strong>(verde, azul)</strong> continua imprevisível.
          </p>
          <div className="flex justify-center mt-macro">
            <Button
              style="primary"
              size="small"
              onClick={onFinished}
              aria-label="Avançar para a máquina automática de lançamento"
            >
              Observar a máquina
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
TwoDicesPractice.displayName = 'TwoDicesPractice';
