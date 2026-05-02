import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { Button } from '@/components/global/Button';

const SEQUENCE_STEPS: { number: string; title: string; description: string }[] = [
  {
    number: '01',
    title: 'Apresentação',
    description: 'Contextualização do problema e ativação dos conhecimentos prévios do estudante.',
  },
  {
    number: '02',
    title: 'Exploração',
    description: 'Investigação ativa por meio de simulações interativas e experimentação dirigida.',
  },
  {
    number: '03',
    title: 'Sistematização',
    description: 'Construção e formalização dos conceitos a partir das observações da exploração.',
  },
  {
    number: '04',
    title: 'Avaliação',
    description: 'Aplicação dos conceitos em desafios e fixação com feedback imediato.',
  },
];

export function DidacticSequence() {
  return (
    <Grid
      id="sequencia-didatica"
      paddings={`pt-xl pb-xl`}
      rowGaps='gap-y-xs'
      backgroundColor='bg-linear-(--color-gradient-level-5)'
    >
      <GridItem cols="col-[1_/_7] max-lg:col-[1_/_13]">
        <TextBlock
          overline="TRILHA DE APRENDIZAGEM ESTRUTURADA"
          title={<h2 className="ds-heading-ultra">Sequência Didática orientada por evidências</h2>}
          paragraph={
            <span className="ds-body">
              Cada Objeto Virtual de Aprendizagem segue uma <strong>sequência didática planejada</strong>,
              ancorada em referenciais da Teoria das Situações Didáticas (Brousseau), Educação Matemática Realística
              (Freudenthal) e princípios da carga cognitiva (Mayer).
              <br/>
              <br/>
              A trilha conduz o estudante por quatro etapas progressivas, do <strong>fenômeno</strong> ao <strong>símbolo</strong>,
              respeitando o tempo de descoberta e a construção autônoma do conhecimento.
            </span>
          }
          maxWidthParagraph="max-w-[520px] max-lg:max-w-[700px]"
          innerComponents={[
            <Button key="button-1" type="link" href="/ensino/probabilidade/sequencia-didatica" style="primary" size="medium">Ver a sequência completa</Button>,
          ]}
        />
      </GridItem>
      <GridItem cols="col-[7_/_13] max-lg:col-[1_/_13]">
        <ol
          className="flex flex-col gap-y-micro"
          aria-label="Etapas da sequência didática"
        >
          {SEQUENCE_STEPS.map((step) => (
            <li
              key={step.number}
              className="flex items-start gap-x-micro p-macro rounded-md bg-neutral-white border border-brand-otimath-lighter shadow-level-1"
            >
              <span
                aria-hidden="true"
                className="ds-heading-extra text-brand-otimath-pure shrink-0 w-[48px] text-center"
              >
                {step.number}
              </span>
              <div className="flex flex-col gap-y-nano">
                <h3 className="ds-body-bold text-brand-otimath-darker">{step.title}</h3>
                <p className="ds-small text-neutral-darkest">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </GridItem>
    </Grid>
  );
}

/* Example

<DidacticSequence />

*/
