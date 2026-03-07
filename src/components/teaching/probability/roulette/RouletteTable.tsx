'use client'

import { TextInput, TextInputInterface } from "@/components/global/TextInput";
import { ROULETTE_COLORS } from "./Roulette";

export interface FrequencyData {
  colorName: string;
  absoluteFrequency: number;
  relativeFrequency?: string;
  relativeFrequencyPercent?: string;
  theoreticalProbability?: string;
  theoreticalProbabilityPercent?: string;
}

interface RouletteTableProps {
  title?: string;
  data: FrequencyData[];
  showRelativeFrequency?: boolean;
  showPercentage?: boolean;
  showTheoreticalProbability?: boolean;
  totalSpins?: number;
  editable?: boolean;
  relativeFrequencyInputs?: { [colorName: string]: TextInputInterface };
  probabilityInputs?: { [colorName: string]: TextInputInterface };
  colorCountInputs?: { [colorName: string]: TextInputInterface };
  showColorCount?: boolean;
}

export function RouletteTable({
  title,
  data,
  showRelativeFrequency = false,
  showPercentage = false,
  showTheoreticalProbability = false,
  totalSpins = 0,
  editable = false,
  relativeFrequencyInputs,
  probabilityInputs,
  colorCountInputs,
  showColorCount = false
}: RouletteTableProps) {

  return (
    <div className="flex flex-col gap-y-micro">
      {title && (
        <h3 className="ds-body-bold text-brand-otimath-pure">{title}</h3>
      )}
      <div className="overflow-x-auto" role="region" aria-label={title || 'Tabela de frequências'} tabIndex={0}>
        <table className="w-full border-collapse bg-neutral-white rounded-md overflow-hidden" aria-label={title || 'Frequências por cor'}>
          <thead>
            <tr className="bg-brand-otimath-pure text-neutral-white">
              <th scope="col" className="p-micro text-left ds-small-bold">Cor</th>
              {showColorCount && (
                <th scope="col" className="p-micro text-center ds-small-bold">Qtd.</th>
              )}
              <th scope="col" className="p-micro text-center ds-small-bold">Freq. Abs.</th>
              {showRelativeFrequency && (
                <th scope="col" className="p-micro text-center ds-small-bold">Freq. Rel.</th>
              )}
              {showPercentage && (
                <th scope="col" className="p-micro text-center ds-small-bold">%</th>
              )}
              {showTheoreticalProbability && (
                <th scope="col" className="p-micro text-center ds-small-bold">Prob. Teórica</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const colorHex = ROULETTE_COLORS[row.colorName] || '#6c6c6c';
              return (
                <tr key={index} className="border-b border-neutral-lighter hover:bg-brand-otimath-lightest transition-colors">
                  <td className="p-micro">
                    <div className="flex items-center gap-x-micro">
                      <div
                        className="w-[20px] h-[20px] rounded-sm border border-neutral-dark"
                        style={{ backgroundColor: colorHex }}
                        aria-hidden="true"
                      />
                      <span className="ds-small">{row.colorName}</span>
                    </div>
                  </td>
                  {showColorCount && colorCountInputs && (
                    <td className="p-micro text-center">
                      <TextInput
                        textInput={{
                          ...colorCountInputs[row.colorName],
                          styles: "w-[50px] h-[32px] text-center ds-small",
                          type: "natural-number",
                          min: "0",
                        }}
                      />
                    </td>
                  )}
                  <td className="p-micro text-center ds-small">
                    {row.absoluteFrequency}
                  </td>
                  {showRelativeFrequency && (
                    <td className="p-micro text-center">
                      {editable && relativeFrequencyInputs ? (
                        <TextInput
                          textInput={{
                            ...relativeFrequencyInputs[row.colorName],
                            styles: "w-[100px] h-[32px] text-center ds-small",
                            placeholder: "a/b",
                          }}
                        />
                      ) : (
                        <span className="ds-small">{row.relativeFrequency || '-'}</span>
                      )}
                    </td>
                  )}
                  {showPercentage && (
                    <td className="p-micro text-center ds-small">
                      {row.relativeFrequencyPercent || '-'}
                    </td>
                  )}
                  {showTheoreticalProbability && (
                    <td className="p-micro text-center">
                      {editable && probabilityInputs ? (
                        <TextInput
                          textInput={{
                            ...probabilityInputs[row.colorName],
                            styles: "w-[70px] h-[32px] text-center ds-small",
                            placeholder: "a/b",
                          }}
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="ds-small">{row.theoreticalProbability || '-'}</span>
                          {row.theoreticalProbabilityPercent && (
                            <span className="ds-caption text-neutral-dark">({row.theoreticalProbabilityPercent})</span>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {totalSpins > 0 && (
            <tfoot>
              <tr className="bg-neutral-lighter">
                <td className="p-micro ds-small-bold" colSpan={showColorCount ? 2 : 1}>Total de giros:</td>
                <td className="p-micro text-center ds-small-bold">{totalSpins}</td>
                {showRelativeFrequency && <td className="p-micro text-center ds-small-bold">-</td>}
                {showPercentage && <td className="p-micro text-center ds-small-bold">100%</td>}
                {showTheoreticalProbability && <td className="p-micro text-center ds-small-bold">1</td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
