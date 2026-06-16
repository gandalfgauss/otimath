'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X, ArrowRight, CheckSquare } from "lucide-react";
import { useTelemetryExercise, telemetryRecordInteracaoExercicio } from "@/hooks/teaching/probability/useTelemetry";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { Alerts } from "@/components/global/Alerts";
import { Modal } from "@/components/global/Modal";
import { TwoDicesFormulation } from "./TwoDicesFormulation";
import { TextBlock } from "@/components/global/TextBlock";

interface TwoDicesGameProps {
  /** Quando true, exibe o botão "Marcar todos!" ao lado de "Limpar".
   *  Default false — preserva comportamento original da seção introdutória.
   *  Usado pelo Ex7 (Exercícios de Fixação) onde a estratégia "marcar tudo
   *  e desmarcar não-favoráveis" é útil para eventos com cardinalidade alta. */
  enableMarkAll?: boolean;
}

export function TwoDicesGame({ enableMarkAll = false }: Readonly<TwoDicesGameProps> = {}) {
  const {
    instructions,
    resetGameOnClick,
    disabledClearButton, dicesChecksClearOnClick,
    disabledCheckButton, checkOnClick,
    disabledNextStepButton, goToNextStepOnClick,
    activeEvents, eventsCheckboxes, updateEventsCheckboxes,
    operationSelectInputs, probabilitiesTextInputs,
    alerts, updateAlert, deleteAlerts,
    modal, updateModal,
    markAllOnClick,
    challenge,
    step,
  } = useTwoDicesHooks();

  // Telemetria — Ex7: jogo livre com a tabela 6×6 (eventos pré-definidos
  // ou modo "marcar tudo"). Enriquece a `descricao` com CONTEXTO do
  // aluno (eventos ativos, células marcadas, frações digitadas) pra que
  // o JSON dê pra reconstituir o exercício sem precisar abrir a tela.
  const activeEventDescriptions = (activeEvents ?? [])
    .map((e, i) => `${e.name ?? `E${i + 1}`}: ${e.description}`)
    .join(' | ');
  const cellSummary = Object.entries(eventsCheckboxes ?? {})
    .map(([eventName, grid]) => {
      let count = 0;
      for (const row of grid) for (const cell of row) if (cell?.checked) count++;
      return count > 0 ? `${eventName}=${count}` : '';
    })
    .filter(Boolean)
    .join(' ');
  const fracSummary = (() => {
    const p = probabilitiesTextInputs;
    if (!p?.numerator?.value && !p?.denominator?.value) return '';
    return `P(${p.eventName ?? '?'})=${p.numerator?.value || '_'}/${p.denominator?.value || '_'}`;
  })();
  const selectSummary = (() => {
    const s = operationSelectInputs;
    if (!s?.eventsA?.value && !s?.operations?.value && !s?.eventsB?.value) return '';
    return `select(A=${s.eventsA?.value || '_'} op=${s.operations?.value || '_'} B=${s.eventsB?.value || '_'})`;
  })();
  const contextParts = [
    activeEventDescriptions && `eventos: [${activeEventDescriptions}]`,
    cellSummary && `marcações: ${cellSummary}`,
    fracSummary,
    selectSummary,
  ].filter(Boolean);
  // Detecta o tipo de tarefa visível na tela (deriva pelo estado dos inputs):
  // se há campo de fração ativo → calcular P(evento); se há selects de
  // operação → escolher operação composta; caso contrário → marcação.
  const hasProbInput = !!(probabilitiesTextInputs?.numerator || probabilitiesTextInputs?.denominator);
  const hasSelectInput = !!(operationSelectInputs?.eventsA || operationSelectInputs?.operations || operationSelectInputs?.eventsB);
  const taskTypeEx7 =
    hasSelectInput ? `escolher composição A op B (select). Esperado: identificar o evento composto descrito.`
    : hasProbInput ? `calcular P(${probabilitiesTextInputs?.eventName ?? '?'})${probabilitiesTextInputs?.hasComplementary ? ' e também P(complementar)' : ''} via Laplace = n(${probabilitiesTextInputs?.eventName ?? '?'})/36.`
    : `marcar na tabela 6×6 as células favoráveis ao(s) evento(s) ${(activeEvents ?? []).map(e => e.name ?? '?').join(', ') || '?'}.`;
  const enrichedDescricao = [
    enableMarkAll
      ? 'Atividade global (Ex7 livre): Aluno marca células favoráveis a eventos compostos (modo livre).'
      : 'Atividade global (Apresentação): Aluno marca células favoráveis a um evento sorteado e identifica P(A) via Laplace.',
    `Ação atual do aluno / cálculo: ${taskTypeEx7}`,
    contextParts.length > 0 ? `[aluno ${contextParts.join('; ')}]` : '',
  ].filter(Boolean).join(' | ');
  // SEÇÃO POR (challenge, step) — cada desafio do jogo é uma "tela"
  // diferente; cada step dentro dele (marcação, fração, complementar)
  // também. Mudou desafio ou step → nova seção telemétrica.
  const baseId = enableMarkAll ? 'twoDices-cena7-twoDicesGame-ex7' : 'twoDices-cena7-twoDicesGame-intro';
  // Título dinâmico — inclui o desafio + step atual e o(s) evento(s) ativo(s)
  // pra que a seção telemétrica reflita a tela vista pelo aluno (não um
  // título genérico para todos os c{x}-s{y}).
  const eventNames = (activeEvents ?? []).map(e => e.name ?? '?').join(', ');
  const dynamicTitle = enableMarkAll
    ? `Exercício 7 — Marcação livre (Desafio ${challenge}, Step ${step}${eventNames ? ` — eventos: ${eventNames}` : ''})`
    : `Apresentação da tabela 6×6 (Desafio ${challenge}, Step ${step}${eventNames ? ` — eventos: ${eventNames}` : ''})`;
  // Instruções da tela (`instructions`) acumulam todo o texto visível no
  // topo da tela atual. Sem isso, a descricao era genérica e perdia o
  // enunciado real do desafio (que muda a cada step).
  const stripText = (raw: string, max: number): string => {
    const cleaned = (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
  };
  const screenText = stripText(instructions || '', 480);
  // Descrição literal de cada evento ativo da tabela 6×6.
  const eventosBlocoEx7 = (activeEvents ?? []).length > 0
    ? (activeEvents ?? []).map(e => `Evento ${e.name ?? '?'}: "${e.description ?? '?'}"`).join(' | ')
    : '(nenhum evento ativo)';
  const fullDescricao = [
    screenText && `Tela: ${screenText}`,
    `Eventos do desafio atual: ${eventosBlocoEx7} | Espaço amostral: 36 pares ordenados`,
    enrichedDescricao,
  ].filter(Boolean).join(' || ');
  useTelemetryExercise(
    `${baseId}-c${challenge}-s${step}`,
    dynamicTitle,
    fullDescricao || enrichedDescricao,
  );

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock 
        paragraph={instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          {/* Barra de botões: `gap-y-micro` pra respiro vertical quando
              quebra linha no mobile. `flex-wrap` permite quebra; antes ficava
              sem espaço entre as linhas e os botões se colavam. `px-micro`
              evita os botões encostarem nas bordas da viewport. */}
          <div className="flex flex-wrap items-center gap-x-xxxs gap-y-micro justify-between w-full max-w-[747px] px-micro">
            <Button style="secondary" size="small" icon={<RefreshCw aria-hidden="true" />} onClick={resetGameOnClick}>Novo</Button>
            <div className="flex flex-wrap items-center gap-x-xxxs gap-y-micro">
              {enableMarkAll && (
                <span title="Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento.">
                  <Button
                    style="borderless"
                    size="extra-small"
                    icon={<CheckSquare aria-hidden="true" />}
                    onClick={markAllOnClick}
                    disabled={disabledClearButton}
                    ariaLabel="Marcar todos os casos: Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento."
                  >
                    Marcar todos!
                  </Button>
                </span>
              )}
              <Button style="borderless" size="extra-small" icon={<X aria-hidden="true" />} onClick={dicesChecksClearOnClick} disabled={disabledClearButton}>Limpar</Button>
            </div>
          </div>

          <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>

          <div className="flex flex-wrap gap-x-xxxs gap-y-micro items-center justify-center px-micro">
            <Button style="secondary" size="small" icon={<Check aria-hidden="true" />} onClick={checkOnClick} disabled={disabledCheckButton}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={() => {
              telemetryRecordInteracaoExercicio(`clicou em "Próximo Desafio" (Ex7 — saindo do Desafio ${challenge}, Step ${step})`);
              goToNextStepOnClick();
            }} disabled={disabledNextStepButton}>Próximo Desafio</Button>
          </div>
        </div>
        <TwoDicesFormulation events={activeEvents} textsInputs={probabilitiesTextInputs} selectInputs={operationSelectInputs}/>
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
        <Modal modal={modal} updateModal={updateModal}/>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/