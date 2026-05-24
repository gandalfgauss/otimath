'use client';

/* ═══════════════════════════════════════════════════════════════════
   SequenceProgressBar — Barra de progresso fixa no topo da sequência
   didática. Mostra 5 marcos da trilha (Início, OVA do Disco, Transição,
   OVA Dois Dados, Fim) e enche conforme o aluno avança.

   PROGRESSO
     • `progress` (0..1): preenchimento da barra
     • `currentStageIndex` (0..4): qual marco está "ativo" agora
        — 0: intro       (Início)
        — 1: roulette    (OVA do Disco)
        — 2: transition  (Transição)
        — 3: twoDices    (OVA Dois Dados)
        — 4: complete    (Fim)

   ACESSIBILIDADE
     • role="progressbar" + aria-valuemin/max/now/text
     • Marcos individuais com aria-current quando ativos
     • Marcos concluídos com aria-label semântico
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Check, Clock } from 'lucide-react';
import { formatElapsed, useSequenceTick } from '@/hooks/teaching/probability/useSequenceSession';

const MARKERS = [
  { key: 'intro',      label: 'Início',     short: 'Início' },
  { key: 'roulette',   label: 'Disco',      short: 'Disco' },
  { key: 'transition', label: 'Transição',  short: 'Transição' },
  { key: 'twoDices',   label: 'Dois Dados', short: 'Dois Dados' },
  { key: 'complete',   label: 'Fim',        short: 'Fim' },
] as const;

interface SequenceProgressBarProps {
  /** Fração de progresso global (0..1) */
  progress: number;
  /** Índice (0..4) do marco atual — para destacar o ponto ativo */
  currentStageIndex: number;
}

export function SequenceProgressBar({ progress, currentStageIndex }: SequenceProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  const totalMarkers = MARKERS.length;
  const stepPct = 100 / (totalMarkers - 1); // 25% entre marcos
  // Cronômetro vivo da sessão — atualiza a cada segundo enquanto a
  // sequência está rolando; congela quando entra no stage 'complete'.
  const elapsedMs = useSequenceTick(1000);
  const elapsedLabel = formatElapsed(elapsedMs);

  return (
    <div
      // Block normal — sem sticky/fixed. Renderizada logo abaixo do banner
      // pelo `page.tsx` para servir como cabeçalho da trilha. Rola junto
      // com a página: some quando o aluno desce, evitando competir com o
      // conteúdo do OVA.
      // Cor de fundo `#eff5fc` — entre `brand-otimath-lightest` (#eaf2fb)
      // e o branco-azulado anterior (#f4f8fd), mantendo a continuidade
      // visual com banner/OVAs e com tonalidade suficiente para se
      // diferenciar do branco puro. Sombra com a tinta da marca em
      // opacidade reforçada — `shadow-level-1` ficava quase invisível
      // contra o fundo azulado das seções dos OVAs logo abaixo. Uso de
      // arbitrary value do Tailwind para manter tudo no className sem
      // recorrer a style inline.
      className="bg-[#eff5fc] shadow-[0_8px_24px_rgba(26,74,158,0.18)]"
      aria-label="Progresso da sequência didática"
    >
      <div className="max-w-[1144px] mx-auto px-xxxs py-micro">
        {/* Linha superior: cronômetro vivo da sessão (alinhado à direita).
            No mobile fica compacto; no desktop ocupa o canto sem invadir
            os marcos. */}
        <div className="flex justify-end items-center mb-quarck">
          <span
            className="ds-caption-bold inline-flex items-center gap-x-quarck text-brand-otimath-darker bg-neutral-white rounded-pill px-micro py-nano border-hairline border-brand-otimath-light"
            aria-live="off"
            aria-label={`Tempo decorrido na sequência: ${elapsedLabel}`}
            title={`Tempo decorrido na sequência: ${elapsedLabel}`}
          >
            <Clock size={12} aria-hidden="true" />
            <span className="[font-variant-numeric:tabular-nums]">{elapsedLabel}</span>
          </span>
        </div>

        {/* Barra principal + marcos */}
        <div
          className="relative h-[28px] flex items-center"
          role="progressbar"
          aria-label="Progresso da sequência didática"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-valuetext={`${Math.round(pct)}% — atualmente em ${MARKERS[currentStageIndex]?.label ?? 'Início'}`}
        >
          {/* Trilho de fundo — `brand-otimath-lighter` mantém a barra
              dentro da paleta azul (em vez de cinza neutro) e ainda dá
              contraste suficiente com o fundo `lightest`. */}
          <div
            className="absolute left-0 right-0 h-[6px] rounded-pill bg-brand-otimath-lighter"
            aria-hidden="true"
          />

          {/* Preenchimento azul — anima largura suavemente */}
          <div
            className="absolute left-0 h-[6px] rounded-pill bg-brand-otimath-pure transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />

          {/* Marcos */}
          {MARKERS.map((m, i) => {
            const markerPct = i * stepPct;
            const isReached = pct >= markerPct - 0.5;
            const isActive = i === currentStageIndex;
            return (
              <div
                key={m.key}
                className="absolute -translate-x-1/2 flex items-center justify-center"
                style={{ left: `${markerPct}%` }}
              >
                <div
                  className={[
                    'flex items-center justify-center rounded-circular transition-all duration-300',
                    isReached
                      ? 'bg-brand-otimath-pure text-neutral-white'
                      : 'bg-neutral-white border-thin border-brand-otimath-light text-neutral-medium',
                    isActive
                      ? 'w-[22px] h-[22px] ring-2 ring-brand-otimath-light'
                      : 'w-[16px] h-[16px]',
                  ].join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={
                    isActive
                      ? `${m.label} (atual)`
                      : isReached
                        ? `${m.label} (concluído)`
                        : `${m.label} (pendente)`
                  }
                  title={m.label}
                >
                  {isReached && !isActive && <Check size={10} strokeWidth={3} aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rótulos abaixo dos marcos */}
        <div className="relative mt-quarck h-[18px]">
          {MARKERS.map((m, i) => {
            const markerPct = i * stepPct;
            const isActive = i === currentStageIndex;
            return (
              <div
                key={m.key}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${markerPct}%` }}
              >
                <span
                  className={[
                    'ds-caption whitespace-nowrap',
                    isActive
                      ? 'text-brand-otimath-darker font-bold'
                      : 'text-neutral-dark',
                  ].join(' ')}
                >
                  {/* Mobile: rótulo curto; ≥ sm: rótulo completo */}
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.short}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
