'use client';

/* ═══════════════════════════════════════════════════════════════════
   SequenceStatsCard — Card de estatísticas de um trecho da sequência

   USO
     • Tela final do OVA do Disco — card com stats do OVA Disco
     • Tela final do OVA Dois Dados — card com stats do OVA Dois Dados
     • Tela final da Sequência — três cards (Disco, Dois Dados, Total)

   LAYOUT
     • Título no topo
     • Linha de 5 chips: Tempo · Interações · Tentativas · Erros · Acertos
     • Mobile: chips quebram em grid 2 colunas; tempo ocupa linha inteira
     • Cores: tempo destacado em brand, erros em feedback-error,
       acertos em feedback-success — paleta consistente do design system
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Clock, MousePointerClick, Target, X, Check } from 'lucide-react';
import { formatElapsed, type OvaStats } from '@/hooks/teaching/probability/useSequenceSession';

interface SequenceStatsCardProps {
  /** Título visível no topo (ex.: "OVA do Disco", "OVA Dois Dados", "Total"). */
  title: string;
  /** Estatísticas a exibir. */
  stats: OvaStats;
  /** Variação visual — `total` destaca em azul mais escuro. */
  variant?: 'ova' | 'total';
  /** Slot opcional renderizado abaixo dos chips (botões de revisão,
   *  link de download de relatório, etc.). Mantém os botões DENTRO do
   *  card sem precisar duplicar styling. */
  footer?: React.ReactNode;
}

export function SequenceStatsCard({ title, stats, variant = 'ova', footer }: Readonly<SequenceStatsCardProps>) {
  const isTotal = variant === 'total';

  return (
    <section
      aria-label={`Estatísticas — ${title}`}
      className={[
        // Sombra azulada sutil (`shadow-[0_2px_8px_rgba(26,74,158,0.06)]`)
        // expressa via arbitrary value do Tailwind — evita style inline e
        // mantém a paleta da marca consistente com a barra de progresso.
        'flex flex-col gap-y-micro rounded-md p-xxs border-hairline shadow-[0_2px_8px_rgba(26,74,158,0.06)]',
        isTotal
          ? 'bg-brand-otimath-lightest border-brand-otimath-light'
          : 'bg-neutral-white border-neutral-lighter',
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-x-micro">
        <h4 className={`ds-body-bold ${isTotal ? 'text-brand-otimath-darker' : 'text-brand-otimath-pure'}`}>
          {title}
        </h4>
      </header>

      {/* Grid auto-fit: cada chip respeita um min de 110px e o grid
          quebra naturalmente conforme a largura do contêiner.
          - Mobile/cards estreitos: 2 colunas
          - Desktop/cards largos: até 5 em linha
          Evita o "esmagamento" do layout fixo de 5 colunas em cards
          que ficam dentro de containers pequenos (ex.: 3 cards lado a
          lado na tela final, cada um ~330px). */}
      <div
        className="grid gap-x-quarck gap-y-quarck"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}
      >
        <StatChip
          icon={<Clock size={14} aria-hidden="true" />}
          label="Tempo"
          value={formatElapsed(stats.elapsedMs)}
        />
        <StatChip
          icon={<MousePointerClick size={14} aria-hidden="true" />}
          label="Interações"
          value={String(stats.interactions)}
        />
        <StatChip
          icon={<Target size={14} aria-hidden="true" />}
          label="Tentativas"
          value={String(stats.attempts)}
        />
        <StatChip
          icon={<X size={14} aria-hidden="true" />}
          label="Erros"
          value={String(stats.errors)}
          tone="error"
        />
        <StatChip
          icon={<Check size={14} aria-hidden="true" />}
          label="Acertos"
          value={String(stats.successes)}
          tone="success"
        />
      </div>

      {footer && (
        <div className="flex justify-end pt-quarck border-t-hairline border-neutral-lighter">
          {footer}
        </div>
      )}
    </section>
  );
}

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'error' | 'success';
}

function StatChip({ icon, label, value, tone = 'default' }: Readonly<StatChipProps>) {
  const toneClasses =
    tone === 'error'
      ? 'text-feedback-error-darker'
      : tone === 'success'
        ? 'text-feedback-success-darkest'
        : 'text-neutral-darkest';

  return (
    <div className="flex flex-col gap-y-nano rounded-sm bg-neutral-lightest p-quarck min-w-0">
      <span className="ds-caption text-neutral-dark flex items-center gap-x-quarck whitespace-nowrap">
        {icon}
        {label}
      </span>
      {/* tabular-nums alinha dígitos em "Xh Ymin Zs" sem dança visual */}
      <span
        className={`ds-small-bold ${toneClasses} truncate [font-variant-numeric:tabular-nums]`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
