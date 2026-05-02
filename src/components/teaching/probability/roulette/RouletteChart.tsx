'use client'

import { ROULETTE_COLORS } from "./Roulette";

export interface ChartData {
  colorName: string;
  relativeFrequency: number;
  theoreticalProbability?: number;
  absoluteFrequency?: number;
  relativeFrequencyLabel?: string;
}

interface RouletteChartProps {
  title?: string;
  data: ChartData[];
  showTheoreticalProbability?: boolean;
  useAbsoluteFrequency?: boolean;
  showRelativeLabels?: boolean;
  height?: number;
  sectorCount?: number; // Número de setores do disco (para calcular 1/n)
}

export function RouletteChart({
  title,
  data,
  showTheoreticalProbability = false,
  height = 200,
  sectorCount
}: RouletteChartProps) {
  const chartHeight = height - 20; // Altura útil do gráfico (descontando margem para labels)
  const barWidth = Math.max(30, Math.min(50, Math.floor(200 / data.length))); // Largura fixa das barras em pixels

  // Calcular a probabilidade teórica (1/n) em porcentagem
  const n = sectorCount || data.length;
  const theoreticalProbabilityPercent = (100 / n);

  // Verificar se as probabilidades teóricas são diferentes por setor (não equiprovável)
  const hasPerBarProbability = showTheoreticalProbability && data.length > 0 &&
    data.some(d => d.theoreticalProbability !== undefined) &&
    !data.every(d => d.theoreticalProbability === data[0].theoreticalProbability);

  // Eixo Y vai de 0 a 100%
  const maxValue = 100;

  // Gerar descrição acessível dos dados
  const chartDescription = data.map(d => `${d.colorName}: ${(d.relativeFrequency * 100).toFixed(1)}%`).join(', ');

  return (
    <div className="flex flex-col gap-y-micro bg-neutral-white p-macro rounded-md" role="figure" aria-label={title || 'Gráfico de frequências relativas'}>
      {title && (
        <h3 className="ds-body-bold text-brand-otimath-pure text-center">{title}</h3>
      )}

      {/* Descrição acessível oculta visualmente */}
      <p className="sr-only">{chartDescription}</p>

      <div className="flex flex-col gap-y-micro">
        {/* Chart area: Y-axis fixo à esquerda + área de barras com scroll
            horizontal no mobile (min-width baseada em quantidade de barras). */}
        <div className="flex">
          {/* Y-axis label (fixo) */}
          <div className="flex flex-col items-center justify-center mr-micro w-5 flex-shrink-0" aria-hidden="true">
            <span
              className="ds-caption text-neutral-dark whitespace-nowrap [writing-mode:vertical-rl] rotate-180"
            >
              Frequência Relativa (%)
            </span>
          </div>

          {/* Y-axis values (fixo) */}
          <div className="flex flex-col justify-between text-right pr-micro flex-shrink-0" style={{ height: chartHeight, width: 35 }} aria-hidden="true">
            <span className="ds-caption text-neutral-dark">100</span>
            <span className="ds-caption text-neutral-dark">75</span>
            <span className="ds-caption text-neutral-dark">50</span>
            <span className="ds-caption text-neutral-dark">25</span>
            <span className="ds-caption text-neutral-dark">0</span>
          </div>

          {/* Wrapper com scroll horizontal — agrupa barras + rótulos do eixo X
              para rolarem juntos. min-width garante barras legíveis com 4+ setores. */}
          <div className="flex-1 overflow-x-auto">
            <div
              className="flex flex-col"
              style={{ minWidth: Math.max(data.length * (barWidth + 8), 200) }}
            >
              {/* Bars container */}
              <div
                className="border-l border-b border-neutral-light relative"
                style={{ height: chartHeight }}
                aria-hidden="true"
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="border-t border-neutral-lighter w-full" />
                  ))}
                </div>

                {/* Theoretical probability line (1/n) — linha vermelha (equiprovável) */}
                {showTheoreticalProbability && !hasPerBarProbability && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-feedback-error-dark pointer-events-none"
                    style={{
                      bottom: (theoreticalProbabilityPercent / maxValue) * chartHeight,
                      zIndex: 10
                    }}
                  />
                )}

                {/* Bars */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex justify-around items-end px-micro"
                  style={{ height: chartHeight }}
                >
                  {data.map((item, index) => {
                    const colorHex = ROULETTE_COLORS[item.colorName] || '#6c6c6c';
                    const relativeFrequencyPercent = item.relativeFrequency * 100;
                    const barHeightPx = Math.max((relativeFrequencyPercent / maxValue) * chartHeight, 2);
                    const itemTheoPercent = item.theoreticalProbability !== undefined
                      ? item.theoreticalProbability * 100
                      : theoreticalProbabilityPercent;

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center relative flex-shrink-0"
                        style={{ width: barWidth }}
                      >
                        {hasPerBarProbability && (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              bottom: (itemTheoPercent / maxValue) * chartHeight,
                              width: barWidth,
                              zIndex: 10
                            }}
                          >
                            <div className="border-t-2 border-dashed border-feedback-error-dark w-full" />
                          </div>
                        )}
                        <div
                          className="rounded-t-sm transition-all duration-300 ease-out relative"
                          style={{
                            backgroundColor: colorHex,
                            height: barHeightPx,
                            width: barWidth - 4
                          }}
                        >
                          {relativeFrequencyPercent > 0 && (
                            <span
                              className="ds-caption text-neutral-dark absolute left-1/2 -translate-x-1/2 font-bold whitespace-nowrap"
                              style={{ top: -16, fontSize: '10px' }}
                            >
                              {relativeFrequencyPercent.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis labels — agora dentro do wrapper com scroll, alinham
                  com as barras automaticamente. */}
              <div className="flex justify-around mt-micro" aria-hidden="true">
                {data.map((item, index) => {
                  const colorHex = ROULETTE_COLORS[item.colorName] || '#6c6c6c';
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-y-nano flex-shrink-0"
                      style={{ width: barWidth }}
                    >
                      <div
                        className="w-[16px] h-[16px] rounded-sm border border-neutral-dark"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="ds-caption text-neutral-dark text-center">
                        {item.colorName.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        {showTheoreticalProbability && (
          <div className="flex justify-center gap-x-xxs mt-micro">
            <div className="flex items-center gap-x-micro">
              <div className="w-[20px] border-t-2 border-dashed border-feedback-error-dark" aria-hidden="true" />
              <span className="ds-caption">
                {hasPerBarProbability
                  ? 'Prob. Teórica (θ/360)'
                  : `Prob. Teórica (1/${n} = ${theoreticalProbabilityPercent.toFixed(1)}%)`
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
