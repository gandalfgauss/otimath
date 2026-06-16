'use client';

import { useState } from 'react';
import { ClipboardList, ExternalLink, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { Button } from '@/components/global/Button';
import { Modal } from '@/components/global/Modal';
import { Alerts } from '@/components/global/Alerts';
import { useModal } from '@/hooks/global/useModal';
import { useAlerts } from '@/hooks/global/useAlerts';
import { playSound } from '@/hooks/global/useSound';

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
 * O acesso ao questionário é PROTEGIDO POR SENHA: o botão "Abrir
 * questionário" abre um modal do DS pedindo a senha fornecida pelo
 * pesquisador. Só após validar a senha o link real (Google Forms) é
 * exposto. Isso evita que pessoas fora do recorte da pesquisa
 * preencham o questionário e contaminem o dataset do mestrado.
 */

/** URL do questionário Google. Trocar quando o questionário definitivo
 *  estiver pronto. Mantemos const exportada pra que outros componentes
 *  possam linkar pro mesmo questionário sem duplicação. */
export const POST_SEQUENCE_QUESTIONNAIRE_URL =
  'https://forms.gle/SUBSTITUIR_PELO_LINK_DO_QUESTIONARIO';

/**
 * Senha de acesso ao questionário fica AGORA no server (env
 * `QUESTIONNAIRE_PASSWORD`). O client só envia o que o aluno
 * digitou pra `/api/auth/verify-password` — nada vaza no bundle.
 */

export function PostSequenceForm() {
  const { modal, updateModal } = useModal();
  // Instância PRÓPRIA de alerts — separada da do `page.tsx` pra não
  // colidir contadores ou rotinas de auto-dismiss. Renderizamos a
  // overlay do <Alerts> ao lado do <Modal> abaixo (mesmo padrão dos
  // OVAs que usam useAlerts próprio).
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Abre o modal — sempre num estado limpo (sem senha digitada antes,
  // sem erro anterior, NÃO destravado). Mesmo que o aluno tenha
  // destravado em uma abertura anterior, reabrir pede senha de novo —
  // mais seguro pra evitar acesso por curiosos no mesmo dispositivo.
  const openModal = () => {
    setPasswordInput('');
    setPasswordError(false);
    setUnlocked(false);
    updateModal({
      title: 'Acesso ao questionário pós-sequência',
      status: 'show',
    });
  };

  // Valida a senha contra o servidor (env QUESTIONNAIRE_PASSWORD).
  //
  // FEEDBACK:
  //  • Acerto: só som — a transição visual do modal é feedback suficiente.
  //  • Erro: som + alert tipo `error` (vermelho) com `silent: true`
  //    pra que o observador da telemetria NÃO capture como erro de OVA.
  //  • Rate-limit: o endpoint devolve 429 se brute-force; mostramos
  //    mensagem específica.
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ kind: 'questionnaire', password: passwordInput }),
      });
      if (res.ok) {
        playSound('/sounds/correct.mp3');
        setUnlocked(true);
        setPasswordError(false);
        return;
      }
      playSound('/sounds/incorrect.mp3');
      let msg = 'Confira a senha com o pesquisador e tente novamente.';
      if (res.status === 429) {
        msg = 'Muitas tentativas. Espere alguns segundos e tente novamente.';
      }
      createAlert(
        'Senha incorreta',
        msg,
        'error',
        4000,
        undefined,
        true, // silent — não notifica telemetria
      );
      setPasswordError(true);
    } catch {
      playSound('/sounds/incorrect.mp3');
      createAlert(
        'Falha de conexão',
        'Não foi possível validar a senha agora. Verifique sua internet.',
        'error',
        4000,
        undefined,
        true,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // `data-skip-telemetry` aqui na raiz: o listener global de cliques
    // em useTelemetry.ts checa esse atributo via `closest()` e PULA
    // qualquer clique cuja árvore tenha ele. Cobre tanto o botão "Abrir
    // questionário" do card quanto TODOS os botões/inputs do Modal —
    // como o Modal é renderizado dentro deste fragment, ele herda o
    // mesmo `data-skip-telemetry` via ancestral. Sem isso, cada clique
    // no fluxo do questionário (que não faz parte do percurso pedagógico)
    // contaria como interação do OVA ativo, inflando `total_interacoes_ova`
    // e `total_interacoes_sequencia`.
    <div data-skip-telemetry>
      {/* Overlay dos alerts desta seção — toast canto superior direito.
          `aboveModal` sobe pra z-[1100] (acima do modal em z-[1000]) pra
          que a mensagem de "Senha incorreta" seja visível enquanto o
          modal de senha ainda está aberto. */}
      <Alerts
        alerts={alerts}
        updateAlert={updateAlert}
        deleteAlerts={deleteAlerts}
        aboveModal
      />
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

              {/* Botão — abre o modal de senha (não mais um link direto).
                  Estilização espelha o anchor anterior pra preservar
                  consistência visual da seção. */}
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-x-micro
                  bg-brand-otimath-pure hover:bg-brand-otimath-medium active:bg-brand-otimath-dark
                  text-neutral-white ds-body-bold rounded-md
                  pt-xxxs pb-xxxs pl-xxs pr-xxs
                  transition-colors duration-300 ease-in-out cursor-pointer
                  shadow-level-1 hover:shadow-level-2
                  focus-visible:outline-2 focus-visible:outline-brand-otimath-darkest focus-visible:outline-offset-2"
                aria-label="Abrir modal de acesso ao questionário"
              >
                <Lock size={18} aria-hidden="true" />
                <span>Abrir questionário</span>
              </button>

              {/* Microcopy — explica que tem senha pra reduzir frustração. */}
              <p className="ds-caption text-neutral-dark italic">
                Acesso restrito por senha — combinada com o pesquisador.
              </p>
            </div>
          </div>
        </GridItem>
      </Grid>

      <Modal
        modal={modal}
        updateModal={updateModal}
        // CHILDREN = miolo rolável (descrição + input ou mensagem de
        // sucesso). FOOTER = botões fixos no fundo do modal — não rolam
        // com o conteúdo, ficam sempre alcançáveis mesmo em telas baixas.
        footer={({ close }) => (
          unlocked ? (
            <>
              <Button style="secondary" size="small" onClick={close}>
                Fechar
              </Button>
              {/* Link real pro Google Forms. `target=_blank` +
                  `rel="noopener noreferrer"` pra abrir em nova aba sem
                  expor `window.opener` ao destino externo. */}
              <a
                href={POST_SEQUENCE_QUESTIONNAIRE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-x-micro justify-center
                  bg-brand-otimath-pure hover:bg-brand-otimath-medium active:bg-brand-otimath-dark
                  text-neutral-white ds-body-bold rounded-md
                  pt-xxxs pb-xxxs pl-xxs pr-xxs
                  transition-colors duration-300 ease-in-out cursor-pointer
                  shadow-level-1 hover:shadow-level-2
                  focus-visible:outline-2 focus-visible:outline-brand-otimath-darkest focus-visible:outline-offset-2"
                aria-label="Abrir questionário no Google Forms em nova aba"
                onClick={close}
              >
                <span>Abrir questionário</span>
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <Button style="secondary" size="small" onClick={close}>
                Voltar
              </Button>
              <Button
                style="primary"
                size="small"
                onClick={() => void handleSubmit()}
                disabled={passwordInput.trim().length === 0 || submitting}
              >
                {submitting ? 'Validando…' : 'Validar senha'}
              </Button>
            </>
          )
        )}
      >
        {unlocked ? (
          // ─── ESTADO DESTRAVADO ──────────────────────────────────
          // Senha confirmada. Mostra confirmação visual; o botão pro
          // formulário externo vive no `footer` fixo.
          <div className="flex items-center gap-x-xxs">
            <CheckCircle2
              size={28}
              className="text-feedback-success-dark shrink-0"
              aria-hidden="true"
            />
            <p className="ds-body text-neutral-darkest">
              <strong>Acesso liberado.</strong> Você pode abrir o
              questionário agora — ele abrirá em uma nova aba e sua
              sessão aqui fica preservada.
            </p>
          </div>
        ) : (
          // ─── ESTADO BLOQUEADO (default) ─────────────────────────
          // Pede senha. Erro fica inline abaixo do input. Enter
          // submete pra UX padrão de formulários. Botões no footer.
          <div className="flex flex-col gap-y-xs">
            <p className="ds-body text-neutral-darkest">
              Este questionário faz parte de uma <strong>pesquisa
              acadêmica do PROFMAT</strong>. Pra garantir que só
              respostas dentro do recorte do estudo entrem na coleta,
              o acesso é protegido por senha.
            </p>
            <p className="ds-body text-neutral-darkest">
              Se você está participando da pesquisa, o pesquisador
              informou a senha junto com o convite. Digite abaixo:
            </p>
            <label className="flex flex-col gap-y-nano">
              <span className="ds-small-bold text-neutral-darkest flex items-center gap-x-nano">
                <KeyRound size={14} aria-hidden="true" />
                Senha de acesso
              </span>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  // Limpa o estado de erro assim que o aluno começa
                  // a corrigir — feedback positivo durante a digitação.
                  if (passwordError) setPasswordError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="Digite a senha fornecida pelo pesquisador"
                aria-invalid={passwordError}
                aria-describedby={passwordError ? 'senha-error' : undefined}
                className={`ds-body rounded-md p-xxxs border-thin transition-colors duration-200 outline-none
                  ${passwordError
                    ? 'border-feedback-error-dark bg-feedback-error-lightest text-feedback-error-darkest focus:border-feedback-error-dark'
                    : 'border-neutral-light bg-neutral-white text-neutral-darkest focus:border-brand-otimath-pure'
                  }`}
              />
              {passwordError && (
                <span
                  id="senha-error"
                  className="ds-small text-feedback-error-dark"
                  role="alert"
                >
                  Senha incorreta. Confira com o pesquisador e tente novamente.
                </span>
              )}
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
