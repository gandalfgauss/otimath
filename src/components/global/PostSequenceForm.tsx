import { ClipboardList, ExternalLink } from 'lucide-react';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';

/**
 * Bloco estático com convite para o questionário pós-sequência.
 *
 * Renderizado SEMPRE — independente do stage atual (intro, OVAs,
 * complete) — pra que o aluno saiba que existe um questionário de
 * impressões depois de concluir a sequência didática.
 *
 * Convive como IRMÃ acima de <OvaCredits/> em `page.tsx` da sequência.
 * Mantém o mesmo padrão visual (Grid + GridItem + gradiente nível 5)
 * pra continuidade estética.
 *
 * Pra trocar a URL do questionário, edite `POST_SEQUENCE_QUESTIONNAIRE_URL`
 * abaixo.
 */

/** URL do questionário Google. Trocar quando o questionário definitivo
 *  estiver pronto. Mantemos const exportada pra que outros componentes
 *  possam linkar pro mesmo questionário sem duplicação. */
export const POST_SEQUENCE_QUESTIONNAIRE_URL =
  'https://forms.gle/SUBSTITUIR_PELO_LINK_DO_QUESTIONARIO';

export function PostSequenceForm() {
  return (
    <Grid
      paddings="pt-xs pb-xs"
      backgroundColor="bg-linear-(--color-gradient-level-5)"
    >
      <GridItem cols="col-[2_/_12] max-md:col-[1_/_13]">
        {/* Decoração visual no mesmo TOM da OvaCredits (quadrado
              rotacionado, gradiente nível 5, opacidade intensa) mas
              ESPELHADA — fica no canto INFERIOR-ESQUERDO (em vez do
              superior-direito da OvaCredits) e com rotação oposta. Dá
              identidade de "seção irmã" sem ser cópia. */}
        <div
          className="rounded-lg relative shadow-level-1 overflow-hidden bg-linear-(--color-gradient-level-1)
          p-xs flex flex-col items-center gap-y-xs text-center
          before:content-[''] before:absolute before:inset-[auto_auto_-120px_-150px] before:w-[320px] before:h-[320px]
          before:pointer-events-none before:rotate-[-18deg] before:bg-linear-(--color-gradient-level-5)
          before:opacity-level-intense z-0"
          role="region"
          aria-label="Convite para questionário de impressões pós-sequência"
        >
          <div className="relative z-1 w-full flex flex-col items-center gap-y-xs">
            {/* Cabeçalho — ícone + label */}
            <div className="w-14 h-14 rounded-full bg-brand-otimath-lightest flex items-center justify-center">
              <ClipboardList size={28} className="text-brand-otimath-pure" aria-hidden="true" />
            </div>
            <span className="ds-overline text-brand-otimath-pure tracking-wider">
              QUESTIONÁRIO PÓS-SEQUÊNCIA
            </span>
            <h2 className="ds-heading-mega text-brand-otimath-dark max-w-[680px]">
              Conte pra gente como foi sua experiência
            </h2>
            <div className="w-12 h-0.5 bg-brand-otimath-pure rounded-full" />

            {/* Corpo — convite (tom amigável, sem obrigação). Reflete o
                escopo real do questionário (3 instrumentos do PROFMAT):
                P1 = comparação com aulas tradicionais + engajamento + ritmo;
                P2 = usabilidade dos OVAs (Nielsen); P3 = aprendizagem
                percebida (BNCC) + autoeficácia. */}
            <p className="ds-body text-neutral-darkest max-w-[640px] leading-relaxed">
              Depois de percorrer a sequência, você pode contribuir com
              uma pesquisa acadêmica respondendo um questionário em três
              partes — sobre como esta vivência se comparou com{' '}
              <strong>aulas tradicionais de matemática</strong>, sua{' '}
              <strong>experiência de uso</strong> dos OVAs (clareza,
              feedback, facilidade) e o que você sente que{' '}
              <strong>aprendeu de probabilidade</strong>. Há também
              espaço pra suas <strong>sugestões</strong> de melhoria.
              Suas respostas alimentam uma pesquisa de mestrado do PROFMAT.
            </p>

            {/* Botão — link externo pro questionário */}
            <a
              href={POST_SEQUENCE_QUESTIONNAIRE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-x-micro
                bg-brand-otimath-pure hover:bg-brand-otimath-medium active:bg-brand-otimath-dark
                text-neutral-white ds-body-bold rounded-md
                pt-xxxs pb-xxxs pl-xxs pr-xxs
                transition-colors duration-300 ease-in-out cursor-pointer
                shadow-level-1 hover:shadow-level-2
                focus-visible:outline-2 focus-visible:outline-brand-otimath-darkest focus-visible:outline-offset-2"
              aria-label="Abrir questionário em uma nova aba"
            >
              <span>Abrir questionário</span>
              <ExternalLink size={18} aria-hidden="true" />
            </a>

            {/* Microcopy — abre em nova aba */}
            <p className="ds-caption text-neutral-dark italic">
              O questionário abre em uma nova aba — sua sessão fica preservada.
            </p>
          </div>
        </div>
      </GridItem>
    </Grid>
  );
}
