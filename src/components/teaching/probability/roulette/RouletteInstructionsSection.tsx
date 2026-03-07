import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { List } from "@/components/global/List";
import { TextBlock } from '@/components/global/TextBlock';
import { RefreshCw, Play, X } from "lucide-react";

export function RouletteInstructionsSection() {
  return (
    <Grid
      id="disco-instrucoes"
      paddings="pt-xl pb-xl"
    >
      <GridItem cols="col-[1_/_13]">
        <div className="relative">
          <TextBlock
            styles="relative z-1"
            title={<h2 className="ds-heading-ultra">Descrição da Atividade</h2>}
            maxWidthParagraph="max-w-[850px]"
            paragraph={
              <div className="ds-body">
                <p>
                  Nesta <strong>atividade interativa</strong>, você vai explorar o conceito de <strong>probabilidade</strong> como
                  limite da <strong>frequência relativa</strong> de um evento quando um experimento aleatório é repetido muitas vezes.
                  Utilizando um <strong>disco colorido</strong>, você observará como os resultados se comportam ao longo de múltiplas repetições.
                </p>

                <br />

                <p>
                  A atividade está dividida em <strong>três etapas</strong> complementares:
                </p>

                <List>
                  <li><strong>Etapa 1 - Probabilidade Equiprovável:</strong> O disco é dividido em setores iguais com cores diferentes. Você identificará o experimento aleatório, o espaço amostral e calculará probabilidades baseando-se na simetria.</li>
                  <li><strong>Etapa 2 - Probabilidade Não Equiprovável:</strong> O disco possui setores de tamanhos diferentes. Você aprenderá que a probabilidade de cada cor depende da medida do ângulo central do setor.</li>
                  <li><strong>Etapa 3 - Setores Iguais com Cores Repetidas:</strong> O disco tem setores iguais, mas algumas cores se repetem. Você calculará probabilidades com base na frequência de cada cor.</li>
                </List>

                <br />

                <p>
                  Você realizará <strong>giros manuais</strong> e <strong>giros automáticos</strong> progressivos
                  para observar como as <strong>frequências relativas</strong> se aproximam
                  das <strong>probabilidades teóricas</strong> à medida que o número de repetições aumenta.
                </p>

                <br />

                <p>
                  Próximo ao disco, você encontra os seguintes <strong>controles:</strong>
                </p>

                <List removeMarker={true}>
                  <li><RefreshCw className="inline" size={16} /> - <strong>Reiniciar</strong> - Reinicia a atividade atual;</li>
                  <li><Play className="inline" size={16} /> - <strong>Sortear/Girar</strong> - Gira o disco uma vez ou executa giros automáticos;</li>
                  <li><X className="inline" size={16} /> - <strong>Limpar</strong> - Limpa os dados da tabela de frequências.</li>
                </List>

                <br />

                <p>
                  <strong>Conceitos explorados:</strong>
                </p>

                <List>
                  <li><strong>Experimento Aleatório:</strong> Procedimento que pode ser repetido nas mesmas condições, mas cujo resultado não pode ser previsto antes de acontecer.</li>
                  <li><strong>Espaço Amostral:</strong> Conjunto de todos os resultados possíveis de um experimento aleatório.</li>
                  <li><strong>Frequência Relativa:</strong> Razão entre o número de ocorrências de um evento e o total de repetições do experimento.</li>
                  <li><strong>Lei dos Grandes Números:</strong> A frequência relativa tende à probabilidade teórica quando o experimento é repetido muitas vezes.</li>
                </List>

                <br />

                <p>
                  Esta <strong>atividade</strong> é compatível com <strong>dispositivos móveis</strong> e está
                  alinhada à <strong>BNCC</strong> (habilidades EM13MAT311 e EM13MAT312).
                </p>

                <br />

                <p>
                  <strong>Boa sorte!</strong>
                </p>
              </div>
            }
          />

          <svg
            className="absolute top-[12%] rotate-135 right-[-25%] z-0"
            width="600"
            height="600"
            viewBox="0 0 600 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="none" stroke="#1a4a9e" strokeWidth="10" opacity={0.04}>
              <circle cx="300" cy="300" r="170" />

              <line x1="300" y1="300" x2="300" y2="130" />
              <line x1="300" y1="300" x2="420.2" y2="179.8" />
              <line x1="300" y1="300" x2="470" y2="300" />
              <line x1="300" y1="300" x2="420.2" y2="420.2" />
              <line x1="300" y1="300" x2="300" y2="470" />
              <line x1="300" y1="300" x2="179.8" y2="420.2" />
              <line x1="300" y1="300" x2="130" y2="300" />
              <line x1="300" y1="300" x2="179.8" y2="179.8" />
            </g>
          </svg>
        </div>
      </GridItem>
    </Grid>
  );
}
