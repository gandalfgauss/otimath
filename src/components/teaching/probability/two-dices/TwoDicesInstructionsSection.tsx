import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { List } from "@/components/global/List";
import { TextBlock } from '@/components/global/TextBlock';
import { RefreshCw, Check, X, ArrowRight } from "lucide-react";

export function TwoDicesInstructionsSection() {
  return (
    <Grid 
      id="dois-dados-instrucoes" 
      paddings={`pt-xl pb-xl`} 
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
                  Nesta <strong>atividade interativa</strong>, você vai explorar as propriedades de <strong>eventos aleatórios</strong> e
                  o <strong>cálculo de probabilidades</strong> por meio do experimento de <strong>lançamento de dois dados equilibrados</strong>:
                  um <strong>verde</strong> (representado no eixo vertical) e outro <strong>azul</strong> (representado no eixo horizontal).
                </p>

                <br/>

                <p>
                  A cada <strong>desafio</strong>, será apresentado um ou mais <strong>eventos</strong> definidos 
                  no <strong>Quadro de Evento(s)</strong> abaixo. Sua tarefa inicial é identificar 
                  os <strong>resultados possíveis</strong> que pertencem a esses <strong>eventos</strong>. Para isso:
                </p>

                <List>
                  <li>Clique nos <strong>quadradinhos</strong> da tabela abaixo para marcar os <strong>resultados</strong> que fazem parte do <strong>evento</strong> indicado;</li> 
                  <li>Cada <strong>quadradinho</strong> representa uma combinação possível entre os <strong>dados verde e azul;</strong></li>
                  <li>Se clicar novamente, o quadradinho será desmarcado.</li>
                </List>

                <br/>

                <p>
                  Após selecionar as combinações desejadas, clique em <strong>&apos;Conferir&apos;</strong> para
                  verificar sua resposta. 
                </p>
                <br/>

                <p>
                  Se sua resposta estiver correta, você irá automaticamente para a próxima etapa, onde 
                  explorará <strong>operações</strong> entre <strong>eventos: união</strong>, <strong>interseção</strong> e <strong>diferença.</strong>
                </p> 

                <br />
                
                <p>
                  Por último, calculará a(s) <strong>probabilidade(s)</strong> do(s)
                  último(s)<strong>evento(s)</strong> no <strong>Quadro de Cálculo(s).</strong>
                </p>
      
                <br />

                <p>
                  Próximo à tabela, você encontra <strong>quatro opções:</strong>
                </p>
                <List removeMarker={true}>
                  <li><RefreshCw className="inline" size={16}/> - <strong>Novo</strong> - Reinicia a <strong>atividade,</strong> retornando ao primeiro desafio;</li>
                  <li><X className="inline" size={16}/> - <strong>Limpar</strong> - Apaga os <strong>quadradinho</strong>s marcados referente ao(s) <strong>evento(s)</strong> ativo(s);</li>
                  <li><Check className="inline" size={16}/> - <strong>Conferir</strong> - Verifica se a <strong>etapa</strong> está correta;</li>
                  <li><ArrowRight className="inline" size={16}/> - <strong>Próximo Desafio</strong> - Passa para o próximo <strong>desafio.</strong></li>
                </List>

                <br />
                
                <p>
                  Esta <strong>atividade</strong> é compatível com <strong>dispositivos móveis,</strong> sendo 
                  desenvolvida para tornar o estudo da <strong>probabilidade</strong> mais visual, 
                  interativo e alinhado à <strong>BNCC</strong>.
                </p>

                <br />

                <p>
                Tente finalizar todos os <strong>desafios</strong>. <strong>Boa sorte!</strong>
                </p>
                
                <br />
                <br />

                <p>
                  Feito por: <strong>Halliday Gauss Costa dos Santos</strong> e <strong>Rangel Freitas dos Santos</strong>
                </p>
              </div>
            }
          ></TextBlock>

          <svg className="absolute top-[12%] rotate-135 right-[-25%] z-0" width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="#1a4a9e" strokeWidth="10" opacity={0.04}>
              <path d="M 0 100 Q 150 0 300 100 T 600 100" />
              <path d="M 0 200 Q 150 100 300 200 T 600 200" />
              <path d="M 0 300 Q 150 200 300 300 T 600 300" />
              <path d="M 0 400 Q 150 300 300 400 T 600 400" />
              <path d="M 0 500 Q 150 400 300 500 T 600 500" />
            </g>
          </svg>

        </div>
      </GridItem>
    </Grid>
  );
}


/* Example 

<TwoDicesSection />

*/