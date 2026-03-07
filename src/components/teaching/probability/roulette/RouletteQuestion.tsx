'use client'

import { Button } from "@/components/global/Button";
import { TextInput, TextInputInterface } from "@/components/global/TextInput";
import { Check } from "lucide-react";

export interface QuestionOption {
  value: string;
  label: string;
  isCorrect?: boolean;
}

interface RouletteQuestionProps {
  question: string;
  type: 'multiple-choice' | 'text' | 'yes-no' | 'multiple-text';
  options?: QuestionOption[];
  selectedOption?: string;
  onOptionSelect?: (value: string) => void;
  textInput?: TextInputInterface;
  textInputs?: { [key: string]: TextInputInterface };
  textInputLabels?: { [key: string]: string };
  inputPrefix?: string;
  onCheck?: () => void;
  disabled?: boolean;
  showCheckButton?: boolean;
  hint?: string;
  instruction?: string;
}

export function RouletteQuestion({
  question,
  type,
  options = [],
  selectedOption,
  onOptionSelect,
  textInput,
  textInputs,
  textInputLabels,
  inputPrefix,
  onCheck,
  disabled = false,
  showCheckButton = true,
  hint,
  instruction
}: RouletteQuestionProps) {
  return (
    <div className="flex flex-col gap-y-macro bg-neutral-white p-macro rounded-md border border-neutral-lighter" role="region" aria-label="Pergunta">
      {instruction && (
        <p className="ds-small text-neutral-dark italic">{instruction}</p>
      )}

      <p className="ds-body-bold text-brand-otimath-dark" dangerouslySetInnerHTML={{ __html: question }} />

      {hint && (
        <div className="bg-feedback-warning-lighter p-micro rounded-sm border-l-4 border-feedback-warning-dark" role="note">
          <p className="ds-small text-feedback-warning-darkest">{hint}</p>
        </div>
      )}

      {type === 'multiple-choice' && (
        <div className="flex flex-col gap-y-micro" role="radiogroup" aria-label="Opções de resposta">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onOptionSelect?.(option.value)}
              aria-pressed={selectedOption === option.value}
              className={`
                p-micro rounded-sm border-2 text-left transition-all duration-200 cursor-pointer min-h-[44px]
                ${selectedOption === option.value
                  ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                  : 'border-neutral-lighter bg-neutral-white hover:border-brand-otimath-light'
                }
              `}
            >
              <span className="ds-small">{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {type === 'yes-no' && (
        <div className="flex gap-x-macro" role="radiogroup" aria-label="Sim ou Não">
          <button
            onClick={() => onOptionSelect?.('sim')}
            aria-pressed={selectedOption === 'sim'}
            className={`
              flex-1 p-macro rounded-sm border-2 text-center transition-all duration-200 cursor-pointer min-h-[44px]
              ${selectedOption === 'sim'
                ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                : 'border-neutral-lighter bg-neutral-white hover:border-brand-otimath-light'
              }
            `}
          >
            <span className="ds-body-bold">Sim</span>
          </button>
          <button
            onClick={() => onOptionSelect?.('nao')}
            aria-pressed={selectedOption === 'nao'}
            className={`
              flex-1 p-macro rounded-sm border-2 text-center transition-all duration-200 cursor-pointer min-h-[44px]
              ${selectedOption === 'nao'
                ? 'border-brand-otimath-pure bg-brand-otimath-lightest'
                : 'border-neutral-lighter bg-neutral-white hover:border-brand-otimath-light'
              }
            `}
          >
            <span className="ds-body-bold">Não</span>
          </button>
        </div>
      )}

      {type === 'text' && textInput && (
        <div className="flex flex-col gap-y-micro">
          <div className="flex items-center gap-x-micro">
            {inputPrefix && (
              <span className="ds-body-bold text-brand-otimath-dark">{inputPrefix}</span>
            )}
            <TextInput
              textInput={{
                ...textInput,
                styles: `${textInput.styles || ''} w-full max-w-[300px]`
              }}
            />
          </div>
        </div>
      )}

      {type === 'multiple-text' && textInputs && (
        <div className="flex flex-wrap gap-macro">
          {Object.keys(textInputs).map((key) => (
            <div key={key} className="flex flex-col gap-y-nano">
              {textInputLabels?.[key] && (
                <label className="ds-small-bold">{textInputLabels[key]}</label>
              )}
              <TextInput
                textInput={{
                  ...textInputs[key],
                  styles: `${textInputs[key].styles || ''} w-[100px]`
                }}
              />
            </div>
          ))}
        </div>
      )}

      {showCheckButton && onCheck && (
        <div className="flex justify-start mt-micro">
          <Button
            style="primary"
            size="small"
            icon={<Check />}
            onClick={onCheck}
            disabled={disabled}
          >
            Verificar
          </Button>
        </div>
      )}
    </div>
  );
}
